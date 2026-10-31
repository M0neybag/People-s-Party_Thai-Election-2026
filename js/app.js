/* พรรคประชาชน 2569 · Dashboard ผลเลือกตั้ง สส. (D3.js) — ค่าที่ปรับได้อยู่ช่วงบนสุดของไฟล์ */
'use strict';
const PPN = 'ประชาชน';
const MAIN5 = ['ภูมิใจไทย','ประชาชน','เพื่อไทย','กล้าธรรม','ประชาธิปัตย์'];
const OTHER = '#5E6573', NODATA = '#D3D3D3';
const REGIONS = ['กรุงเทพมหานคร','ภาคกลาง','ภาคเหนือ','ภาคตะวันออกเฉียงเหนือ','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];
const RO = ['กรุงเทพมหานคร','ภาคกลาง','ภาคตะวันออกเฉียงเหนือ','ภาคเหนือ','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];
const MODES = [['win','สส.เขต'],['list','สส.บัญชีรายชื่อ'],['both','สส.เขต + บัญชีรายชื่อ'],['tier','ระดับโอกาส'],['house','ข้อมูลบ้านใหญ่']];
const GB = [['#b3540b','ชนะ มากกว่า 15%'],['#ee8a2c','ชนะ 5–15%'],['#f9c896','ชนะ ไม่เกิน 5%'],['#cfd3ec','แพ้ ไม่เกิน 5%'],['#959cd4','แพ้ 5–15%'],['#5d66b3','แพ้ 15–30%'],['#333b84','แพ้ มากกว่า 30%']];
const TT = {flip:['พลิกได้','#7b3fc4'],hold:['รักษาฐานเสียง','#f5b06a'],cand:['ดันผู้สมัคร','#1f8f86'],safe:['ฐานเสียง','#b3540b'],far:['ปรับแผนใหม่','#c3c7ce'],none:['ไม่ส่งผู้สมัคร','#e3e5ea']};
const TK = ['flip','hold','cand','safe','far'];
const NATB = {c:{b:3.54,n:4.25},l:{b:4.41,n:2.93}};
let LEGEND_W = 200; const ROWH = 22;

const $ = s => document.querySelector(s);
const fmt = d3.format(',');
let PARTY = {};
const col = p => { const o = PARTY[p]; return o && o.c !== NODATA ? o.c : OTHER; };
const pk = p => MAIN5.includes(p) ? p : 'อื่นๆ';
const nm66 = p => p === PPN ? 'ก้าวไกล' : p === 'ไทรวมพลัง' ? 'เพื่อไทรวมพลัง' : p;
/* สีอ่อน → ตัวเลขสีดำ */
const ink = c => { const h = d3.color(c).rgb(); return (h.r * 299 + h.g * 587 + h.b * 114) / 1000 >= 150 || c.toUpperCase() === '#01A4E4' ? '#16181d' : '#fff'; };
const short = r => r.replace('ภาคตะวันออกเฉียงเหนือ','อีสาน').replace('กรุงเทพมหานคร','กทม.').replace('ภาค','');
const key = d => d.pc + '-' + d.d;
const HOUSE = '<span class="hz"><svg class="house" viewBox="0 0 16 16"><path d="M8 1.5 1 7.5h2v7h4v-4h2v4h4v-7h2z" fill="#16181d"/></svg><span class="hzt">บ้านใหญ่</span></span>';
let LOGOS = {}, LOGOS66 = {};
const logo = (src, p, sz, bc) => src ? `<img class="lgo" src="${src}" alt="" style="width:${sz}px;height:${sz}px;border-color:${bc}">`
  : `<span class="lgo" style="width:${sz}px;height:${sz}px;border-color:${bc};color:${bc};font-size:${sz * .45}px">${p[0]}</span>`;
const LGO = (p, sz) => logo(LOGOS[p], p, sz, col(p));
const LGO66 = (p, sz) => logo(LOGOS66[p] || LOGOS[p], nm66(p), sz, col(p));
const gbin = v => v == null ? -1 : v > 15 ? 0 : v > 5 ? 1 : v > 0 ? 2 : v >= -5 ? 3 : v >= -15 ? 4 : v >= -30 ? 5 : 6;
const gcolv = v => v == null ? NODATA : GB[gbin(v)][0];
const sgn = v => (v > 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%';

const ST = {mode:'win', reg:'', fil:null, y66:false, big:false, cb:'party', h:{party:null, res:'all'}, lg:null, sort:'gap', sel:null, hover:null, tf:'target', brush:null, win:{}, ps:{c:{k:'v',dir:-1}, l:{k:'v',dir:-1}}, pexp:{c:false, l:false}};
let D, L, N6, byK = {}, tiles = [];

/* ---------- filters ---------- */
const Y66 = () => ST.y66 && (ST.mode === 'win' || ST.mode === 'list');
const bigOK = () => ST.mode !== 'list' && ST.mode !== 'house';
const closeW = d => d.has && Math.abs(d.gap) <= 5, closeL = d => Math.abs(d.lgap) <= 5;
const closeKind = () => ST.mode === 'list' ? 'list' : ST.mode === 'both' ? 'both' : 'win';
const GV = () => (ST.mode === 'win' || ST.mode === 'list') && ST.cb === 'gap' && !Y66();
/* half: 'w' | 'l' | undefined */
const okF = (d, half) => {
  if (ST.fil === 'split') return d.split;
  if (ST.fil !== 'close') return true;
  const k = half === 'w' ? 'win' : half === 'l' ? 'list' : closeKind();
  return k === 'list' ? closeL(d) : k === 'both' ? (closeW(d) || closeL(d)) : closeW(d);
};
const okR = d => !ST.reg || d.reg === ST.reg;
const okBig = d => !ST.big || !bigOK() || !!d.w[4];
/* โหมดข้อมูลบ้านใหญ่ */
const isB = d => d.cand.some(c => c[4]), bfP = d => [...new Set(d.cand.filter(c => c[4]).map(c => c[1]))];
const hWon = d => ST.h.party ? (d.w[1] === ST.h.party && d.w[4]) : !!d.w[4];
const hP = d => !ST.h.party || bfP(d).includes(ST.h.party), hRes = d => ST.h.res === 'all' || (ST.h.res === 'win' ? hWon(d) : !hWon(d));
const hLit = d => isB(d) && okR(d) && hP(d) && hRes(d);
const gapV = d => ST.mode === 'list' ? d.lgap : d.gap;
const okL = d => {
  const g = ST.lg; if (g == null) return true;
  switch (ST.mode) {
    case 'win':  return GV() ? String(gbin(gapV(d))) === g : pk(d.w[1]) === g;
    case 'list': return GV() ? String(gbin(gapV(d))) === g : pk(d.pltop) === g;
    case 'both': return pk(d.w[1]) === g || pk(d.pltop) === g;
    case 'tier': return d.tier === g;
    default:     return String(gbin(gapV(d))) === g;
  }
};
const inB = d => ST.mode !== 'tier' || !ST.brush || (d.has && d.gap >= ST.brush[0] && d.gap <= ST.brush[1] && d.lgap >= ST.brush[2] && d.lgap <= ST.brush[3]);
const lit = (d, half) => okF(d, half) && okR(d) && okL(d) && inB(d) && okBig(d);

/* ---------- prep ---------- */
function prep() {
  const ren = p => p === 'เพื่อไทรวมพลัง' ? 'ไทรวมพลัง' : p;
  D.forEach(d => {
    if (d.c66) d.c66.forEach(c => c[1] = ren(c[1]));
    if (d.p66) d.p66.forEach(x => x[0] = ren(x[0]));
    d.w = d.cand[0];
    const i = d.cand.findIndex(c => c[1] === PPN);
    d.ppr = i + 1; d.has = i >= 0;
    d.gap = !d.has ? null : (i === 0 ? d.cand[0][2] - d.cand[1][2] : d.cand[i][2] - d.cand[0][2]) / d.good * 100;
    d.plt = d.pl.reduce((s, x) => s + x[1], 0);
    d.pltop = d.pl[0][0];
    d.split = d.pltop !== d.w[1];
    const pi = d.pl.findIndex(x => x[0] === PPN);
    d.lrank = pi + 1;
    d.lgap = pi < 0 ? -d.pl[0][1] / d.plt * 100 : (pi === 0 ? d.pl[0][1] - d.pl[1][1] : d.pl[pi][1] - d.pl[0][1]) / d.plt * 100;
    /* เกณฑ์ระดับโอกาสใหม่ (ตารางทีม 28 ต.ค.) */
    const m = Math.abs(d.gap), PL = d.lgap > 0;
    d.tier = !d.has ? 'none' : d.ppr === 1 ? (m > 5 && PL ? 'safe' : 'hold') : (m <= 5 ? 'flip' : m >= 30 ? 'far' : PL ? 'cand' : 'far');
    byK[key(d)] = d;
  });
  ['cs', 'ls', 'lv'].forEach(k => { const o = N6['66'][k]; if (o['เพื่อไทรวมพลัง'] != null) { o['ไทรวมพลัง'] = (o['ไทรวมพลัง'] || 0) + o['เพื่อไทรวมพลัง']; delete o['เพื่อไทรวมพลัง']; } });
  Object.entries(L.prov).forEach(([pc, o]) => o.tiles.forEach((t, i) => { const dd = byK[pc + '-' + (i + 1)]; if (dd) tiles.push({pc:+pc, d:i + 1, x:t[0], y:t[1], dd}); }));
}

/* ---------- init ---------- */
let svg, gRoot, gTiles, gHi, zoom;
function init() {
  D = DATA.districts; L = DATA.layout; N6 = DATA.national; LOGOS = DATA.logos; LOGOS66 = DATA.logos66; PARTY = DATA.parties;
  prep();
  $('#region').innerHTML = '<option value="">ทุกภาค</option>' + REGIONS.map(r => `<option>${r}</option>`).join('');
  $('#modes').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b || b.dataset.m === ST.mode) return; ST.mode = b.dataset.m; ST.lg = null; ST.h = {party:null, res:'all'}; ST.brush = null; ST.win = {}; render(); });
  $('#region').addEventListener('change', e => { ST.reg = e.target.value; ST.win = {}; ST.brush = null; render(); fitView(true); });
  $('#filters').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; ST.fil = b.dataset.f || null; ST.win = {}; render(); });
  $('#cb66').addEventListener('change', e => { ST.y66 = e.target.checked; render(); });
  $('#cbbig').addEventListener('change', e => { ST.big = e.target.checked; render(); });
  $('#legend').addEventListener('click', e => {
    const g = e.target.closest('[data-gk]'); if (g) { ST.cb = g.dataset.gk; ST.lg = null; render(); return; }
    if (ST.mode === 'house') { const hp = e.target.closest('[data-hp]'); if (hp) { const v = hp.dataset.hp || null; ST.h.party = ST.h.party === v ? null : v; render(); } return; }
    const b = e.target.closest('[data-k]'); if (!b) return;
    const k = b.dataset.k || null; ST.lg = ST.lg === k ? null : k; render();
  });
  $('.zoom').addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; const z = b.dataset.z; if (z === 'home') fitView(true); else svg.transition().duration(300).call(zoom.scaleBy, z === 'in' ? 1.5 : 1 / 1.5); });
  $('#rk').addEventListener('click', e => {
    const hr = e.target.closest('[data-hr]'); if (hr) { ST.reg = ST.reg === hr.dataset.hr ? '' : hr.dataset.hr; $('#region').value = ST.reg; render(); fitView(true); return; }
    const hp = e.target.closest('[data-hp]'); if (hp) { ST.h.party = ST.h.party === hp.dataset.hp ? null : hp.dataset.hp; render(); return; }
    const hx = e.target.closest('[data-hx]'); if (hx) { if (hx.dataset.hx === 'reg') { ST.reg = ''; $('#region').value = ''; render(); fitView(true); } else { ST.h.party = null; render(); } return; }
    const s = e.target.closest('[data-s]'); if (s) { ST.sort = s.dataset.s; ST.win = {}; renderRight(); return; }
    const t = e.target.closest('[data-tf]'); if (t) { ST.tf = t.dataset.tf; renderRight(); return; }
    const r = e.target.closest('[data-k]'); if (r && byK[r.dataset.k]) select(byK[r.dataset.k]);
  });
  $('#rk').addEventListener('mouseover', e => { const r = e.target.closest('.r[data-k],.trr[data-k]'); setHover(r ? byK[r.dataset.k] : null); });
  $('#rk').addEventListener('mouseleave', () => setHover(null));
  $('#panel').addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { closePanel(); return; }
    const h = e.target.closest('[data-ps]');
    if (h) { const [t, k] = h.dataset.ps.split(':'), s = ST.ps[t]; if (s.k === k || (s.k !== 'no' && k !== 'no')) s.dir *= -1; else { s.k = k; s.dir = k === 'no' ? 1 : -1; } s.k = k; renderPanel(); return; }
    const m = e.target.closest('[data-more]'); if (m) { ST.pexp[m.dataset.more] = !ST.pexp[m.dataset.more]; renderPanel(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
  $('#rescon').addEventListener('click', e => { const b = e.target.closest('[data-res]'); if (b) { ST.h.res = b.dataset.res; render(); } });
  setupMap(); render(); fitView(false);
  let to, first = true;
  new ResizeObserver(() => { if (first) { first = false; return; } clearTimeout(to); to = setTimeout(() => { render(); fitView(false); }, 150); }).observe($('.cols'));
}
function render() { hideTip(); renderHeader(); renderLegend(); drawTiles(); renderKPI(); renderRight(); if (ST.sel) renderPanel(); drawHi(); }

/* ---------- header ---------- */
function renderHeader() {
  $('#modes').innerHTML = MODES.map(([k, t]) => `<button data-m="${k}" class="${k === ST.mode ? 'on' : ''}">${t}</button>`).join('');
  const sub = D.filter(d => okR(d) && okBig(d)), ck = closeKind();
  const cl = ck === 'both' ? `<span class="n">${sub.filter(closeW).length} · ${sub.filter(closeL).length}</span>` : `<span class="n">${sub.filter(ck === 'list' ? closeL : closeW).length}</span>`;
  const lab = {win:'สส.เขต', list:'บัญชีรายชื่อ', both:'เขต · บัญชีฯ'}[ck];
  $('#filters').innerHTML = `<button class="chip ${!ST.fil ? 'on' : ''}" data-f="">ทั้งหมด <span class="n">${sub.length}</span></button>`
    + `<button class="chip ${ST.fil === 'close' ? 'on' : ''}" data-f="close">สูสี ±5% <span class="ck">${lab}</span> ${cl}</button>`
    + `<button class="chip ${ST.fil === 'split' ? 'on' : ''}" data-f="split">เขต-พรรค สวนทาง <span class="n">${sub.filter(d => d.split).length}</span></button>`;
  const dis = !(ST.mode === 'win' || ST.mode === 'list'), y = $('#y66');
  $('#cb66').disabled = dis; y.classList.toggle('dis', dis); y.classList.toggle('on', ST.y66 && !dis);
  $('#y66s').textContent = dis ? 'ใช้ได้ในโหมด สส.เขต และ บัญชีรายชื่อ' : 'แสดงผลการเลือกตั้งปี 2566';
  const bdis = !bigOK(), b = $('#bigf');
  $('#cbbig').disabled = bdis; b.classList.toggle('dis', bdis); b.classList.toggle('on', ST.big && !bdis);
  $('#bign').textContent = sub.filter(d => d.w[4]).length;
  b.title = bdis ? 'ใช้ไม่ได้ในโหมดบัญชีรายชื่อ (ไม่มีตัวผู้สมัคร)' : 'แสดงเฉพาะเขตที่ผู้ชนะ สส.เขต เป็นบ้านใหญ่';
  const H = ST.mode === 'house';
  $('#filters').style.visibility = H ? 'hidden' : ''; b.style.display = H ? 'none' : ''; $('#rescon').hidden = !H;
  if (H) { const S = D.filter(d => isB(d) && okR(d) && hP(d)), nw = S.filter(hWon).length;
    $('#rescon').querySelector('.rseg').innerHTML = [['all','ทั้งหมด',S.length],['win','ชนะ',nw],['lose','แพ้',S.length - nw]].map(([k, t, n]) => `<button data-res="${k}" class="${ST.h.res === k ? 'on' : ''}">${t} <span>${n}</span></button>`).join(''); }
  const n = D.filter(d => H ? hLit(d) : lit(d)).length;
  $('#empty').hidden = n > 0 || ST.mode === 'both';
}

/* ---------- legend ---------- */
function tileGlyph(kind) {
  const u = 34, S = .3, x0 = 6, y0 = 6, P = (a, b) => [x0 + a * u, y0 + b * u];
  const TL = P(S, 0), TR = P(1 + S, 0), BR = P(1, 1), BL = P(0, 1), pts = a => a.map(p => p.join(',')).join(' ');
  const lx = x0 + (1 + S) * u + 14;
  /* เส้นชี้แนวนอนตรง: จุดในรูป → ข้อความที่ระดับเดียวกัน */
  const lab = (px, py, t) => `<line x1="${px}" y1="${py}" x2="${lx}" y2="${py}" stroke="#16181d"/><circle cx="${px}" cy="${py}" r="2.2" fill="#16181d"/><text x="${lx + 4}" y="${py + 4}" font-size="11.5" font-weight="700">${t}</text>`;
  let s;
  if (kind === 'both') {
    s = `<polygon points="${pts([TL, TR, BL])}" fill="#322485"/><polygon points="${pts([TR, BR, BL])}" fill="#FF6411"/><line x1="${TR[0]}" y1="${TR[1]}" x2="${BL[0]}" y2="${BL[1]}" stroke="#fff" stroke-width="2"/>`
      + lab(x0 + .5 * u, y0 + .25 * u, 'สส.เขต') + lab(x0 + .9 * u, y0 + .78 * u, 'บัญชีรายชื่อ');
  } else {
    const T = .8, p1 = [BR[0] + (BL[0] - BR[0]) * T, BR[1]], p2 = [BR[0] + (TR[0] - BR[0]) * T, BR[1] + (TR[1] - BR[1]) * T];
    s = `<polygon points="${pts([BL, BR, TR, TL])}" fill="#322485"/><polygon points="${pts([BR, p1, p2])}" fill="#FF6411" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`
      + lab(x0 + .5 * u, y0 + .25 * u, 'ปี 69') + lab(x0 + .86 * u, y0 + .8 * u, 'ปี 66');
  }
  return `<svg width="170" height="${u + 14}" style="margin:2px 0 4px">${s}</svg>`;
}
function renderLegend() {
  const M = ST.mode, y = Y66();
  const multi = '<span class="sw multi"></span>';
  let items;
  if (M === 'tier') items = TK.map(k => ({k, sw:`<span class="sw" style="background:${TT[k][1]}"></span>`, t:TT[k][0], n:D.filter(d => d.tier === k && okR(d) && okBig(d)).length}));
  else if (GV()) items = GB.map((g, i) => ({k:String(i), sw:`<span class="sw" style="background:${g[0]}"></span>`, t:g[1], n:D.filter(d => gbin(gapV(d)) === i && okR(d) && okBig(d)).length}));
  else items = [...MAIN5, 'อื่นๆ'].map(p => ({k:p, sw:p === 'อื่นๆ' ? multi : `<span class="sw" style="background:${col(p)}"></span>`, t:p === 'อื่นๆ' ? 'พรรคอื่น' : p, n:D.filter(d => okR(d) && okBig(d) && (M === 'list' ? pk(d.pltop) : pk(d.w[1])) === p).length}));
  const all = {k:'', sw:'<span class="sw allsw"></span>', t:'ทั้งหมด', n:D.filter(d => okR(d) && okBig(d)).length};
  const title = y ? (M === 'list' ? 'บัญชีรายชื่ออันดับ 1 · 69 เทียบ 66' : 'ผู้ชนะ สส.เขต · 69 เทียบ 66')
    : {tier:'ระดับโอกาส (เกณฑ์ปี 69)', win:'พรรคที่ชนะ สส.เขต', list:'พรรคที่ได้บัญชีรายชื่อสูงสุดในเขต', both:'สส.เขต + บัญชีรายชื่อ', gap:'ระยะห่างของพรรคประชาชน · ' + (M === 'list' ? 'บัญชีรายชื่อ' : 'สส.เขต')}[GV() ? 'gap' : M];
  if (M === 'house') { renderLegendHouse(); return; }
  const gk = (M === 'win' || M === 'list') && !y ? `<div class="gk"><button data-gk="party" class="${ST.cb === 'party' ? 'on' : ''}">สีตามพรรค</button><button data-gk="gap" class="${ST.cb === 'gap' ? 'on' : ''}">สีตามระยะห่าง</button></div>` : '';
  const glyph = M === 'both' ? tileGlyph('both') : y ? tileGlyph('66') + '<div class="lnote">มุมเทา = ไม่มีเขตนี้ในปี 66</div>' : '';
  $('#legend').innerHTML = `<div class="t">${title}</div>${gk}${glyph}` + [all, ...items].map(it => {
    const on = (ST.lg || '') === it.k, dim = ST.lg && !on && it.k !== '';
    return `<button class="lg ${on ? 'on' : ''} ${dim ? 'dim' : ''}" data-k="${it.k}">${it.sw}<span>${it.t}</span><span class="n">${M === 'both' && it.k ? '' : it.n}</span></button>`;
  }).join('');
}

/* ---------- map ---------- */
function setupMap() {
  svg = d3.select('#map'); gRoot = svg.append('g'); gTiles = gRoot.append('g');
  const gLab = gRoot.append('g').attr('pointer-events', 'none'); gHi = gRoot.append('g').attr('pointer-events', 'none');
  Object.values(L.prov).forEach(o => gLab.append('text').attr('x', o.lx).attr('y', o.ly).attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('font-size', .62).attr('font-weight', 700).attr('fill', '#16181d').text(o.name.replace('กรุงเทพมหานคร', 'กรุงเทพฯ')));
  zoom = d3.zoom().scaleExtent([2, 200]).constrain(constrainMap).on('zoom', e => { gRoot.attr('transform', e.transform); hideTip(); });
  svg.call(zoom).on('dblclick.zoom', null);
}
function viewTransform() {
  LEGEND_W = innerWidth < 640 ? 0 : (innerWidth < 1024 || innerHeight > innerWidth) ? 190 : 200;
  const n = svg.node(), W = n.clientWidth, H = n.clientHeight; let k, tx, ty;
  const fit = (x0, x1, y0, y1, f) => { k = Math.min((W - LEGEND_W) / (x1 - x0), H / (y1 - y0)) * f; tx = LEGEND_W + ((W - LEGEND_W) - k * (x1 - x0)) / 2 - k * x0; ty = (H - k * (y1 - y0)) / 2 - k * y0; };
  if (ST.reg) { const rt = tiles.filter(t => t.dd.reg === ST.reg); fit(d3.min(rt, t => t.x) - 1.5, d3.max(rt, t => t.x) + 2.8, d3.min(rt, t => t.y) - 2, d3.max(rt, t => t.y) + 1.8, .9); }
  else fit(d3.min(tiles, t => t.x) - 1, d3.max(tiles, t => t.x) + 2.3, d3.min(Object.values(L.prov), o => o.ly) - 1, d3.max(tiles, t => t.y) + 1.6, 1);
  return d3.zoomIdentity.translate(tx, ty).scale(k);
}
/* ล็อกการซูม: ออกได้สุด = มุมมองทั้งประเทศ, เข้าได้สุด = 4 เท่า ; ลากไม่ให้หลุดกรอบ */
let K0 = null;
function setZoomLimits() { const t0 = (() => { const r = ST.reg; ST.reg = ''; const t = viewTransform(); ST.reg = r; return t; })(); K0 = t0.k; zoom.scaleExtent([K0, K0 * 4]); }
function constrainMap(t, ext) {
  if (!K0) return t; const n = svg.node(), W = n.clientWidth, H = n.clientHeight;
  const x0 = d3.min(tiles, q => q.x) - 1, x1 = d3.max(tiles, q => q.x) + 2.3, y0 = d3.min(Object.values(L.prov), o => o.ly) - 1, y1 = d3.max(tiles, q => q.y) + 1.6;
  const m = Math.min(W, H) * .35, lx = W - m - t.k * x0, hx = m - t.k * x1, ly = H - m - t.k * y0, hy = m - t.k * y1;
  const x = Math.max(Math.min(t.x, lx), hx), y = Math.max(Math.min(t.y, ly), hy);
  return d3.zoomIdentity.translate(x, y).scale(t.k);
}
function fitView(anim) { setZoomLimits(); (anim ? svg.transition().duration(600) : svg).call(zoom.transform, viewTransform()); }
const geo = t => { const S = L.S, x = t.x, y = t.y; return {TL:[x + S, y], TR:[x + 1 + S, y], BR:[x + 1, y + 1], BL:[x, y + 1], cx:x + .5 + S / 2, cy:y + .5}; };
const shrink = (pts, cx, cy, f) => pts.map(([a, b]) => [cx + (a - cx) * f, cy + (b - cy) * f].join(',')).join(' ');
function drawTiles() {
  gTiles.selectAll('*').remove();
  const M = ST.mode, y66 = Y66(), f = .9, DIM = .14;
  tiles.forEach(t => {
    const d = t.dd, {TL, TR, BR, BL, cx, cy} = geo(t);
    if (M === 'house') { drawHouseTile(t, d); return; }
    const g = gTiles.append('g').attr('class', 'tile')
      .on('mouseenter', e => { showTip(e, tipHTML(d)); setHover(d); }).on('mousemove', moveTip)
      .on('mouseleave', () => { hideTip(); setHover(null); }).on('click', () => select(d));
    const num = (x, yy, fill, anchor, op) => g.append('text').attr('x', x).attr('y', yy).attr('text-anchor', anchor).attr('dominant-baseline', 'central')
      .attr('font-size', .42).attr('font-weight', 700).attr('font-family', 'IBM Plex Sans Thai,sans-serif').attr('fill', fill).attr('opacity', op).attr('pointer-events', 'none').text(t.d);
    if (M === 'both') {
      const ow = lit(d, 'w') ? 1 : DIM, ol = lit(d, 'l') ? 1 : DIM;
      g.append('polygon').attr('points', shrink([TL, TR, BL], cx, cy, f)).attr('fill', col(d.w[1])).attr('opacity', ow);
      g.append('polygon').attr('points', shrink([TR, BR, BL], cx, cy, f)).attr('fill', col(d.pltop)).attr('opacity', ol);
      const a = [cx + (TR[0] - cx) * f, cy + (TR[1] - cy) * f], b = [cx + (BL[0] - cx) * f, cy + (BL[1] - cy) * f];
      g.append('line').attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1]).attr('stroke', '#fff').attr('stroke-width', .07);
      num(t.x + L.S + .12, t.y + .3, '#fff', 'start', Math.max(ow, .35));
    } else {
      const op = lit(d) ? 1 : DIM;
      g.attr('opacity', op);
      if (y66) {
        const w69 = M === 'list' ? d.pltop : d.w[1], w66 = M === 'list' ? (d.p66 ? d.p66[0][0] : null) : (d.c66 ? d.c66[0][1] : null);
        const T = .8, p1 = [BR[0] + (BL[0] - BR[0]) * T, BR[1]], p2 = [BR[0] + (TR[0] - BR[0]) * T, BR[1] + (TR[1] - BR[1]) * T];
        g.append('polygon').attr('points', shrink([BL, BR, TR, TL], cx, cy, f)).attr('fill', col(w69));
        g.append('polygon').attr('points', shrink([BR, p1, p2], cx, cy, f)).attr('fill', w66 ? col(w66) : NODATA).attr('stroke', '#fff').attr('stroke-width', .05);
        num(t.x + L.S + .12, t.y + .3, '#fff', 'start', 1);
      } else {
        const fill = M === 'tier' ? TT[d.tier][1] : GV() ? gcolv(gapV(d)) : M === 'win' ? col(d.w[1]) : M === 'list' ? col(d.pltop) : gcolv(gapV(d));
        g.append('polygon').attr('points', shrink([BL, BR, TR, TL], cx, cy, f)).attr('fill', fill);
        num(cx, cy + .03, '#fff', 'middle', 1);
      }
    }
  });
}
const selD = () => ST.sel ? byK[ST.sel] : null;
function drawHi() {
  gHi.selectAll('*').remove();
  const out = (d, w, dash) => { const t = tiles.find(q => q.dd === d); if (!t) return; const {TL, TR, BR, BL, cx, cy} = geo(t);
    gHi.append('polygon').attr('points', shrink([BL, BR, TR, TL], cx, cy, 1.08)).attr('fill', 'none').attr('stroke', '#16181d').attr('stroke-width', w).attr('stroke-dasharray', dash); };
  if (ST.hover && ST.hover !== selD()) out(ST.hover, .09, '.18 .1');
  if (ST.sel) out(selD(), .13, null);
}
function setHover(d) { if (ST.hover === d) return; ST.hover = d; drawHi(); hoverDot(); hoverArrows(); }
/* ลูกศรดำใต้แท่ง overview: ทุกกราฟ overview ที่อยู่บนหน้าจอ (โหมดเขต+บัญชีฯ มี 2 กราฟ → ขึ้นพร้อมกัน) */
let HVA = [];
function hoverArrows() { HVA = HVA.filter(f => f.alive()); HVA.forEach(f => f(ST.hover)); }
function hoverDot() {
  const dots = d3.selectAll('#rk circle.dot'); if (dots.empty()) return;
  styleDots();
  if (!ST.hover) return;
  dots.filter(x => x === ST.hover).attr('r', 7).attr('stroke', '#16181d').attr('stroke-width', 2.2).attr('opacity', 1).raise();
}

/* ---------- tooltip ---------- */
const ftip = () => $('#ftip');
function showTip(e, html) { const t = ftip(); t.innerHTML = html; t.style.display = 'block'; moveTip(e); }
function moveTip(e) { const t = ftip(), w = t.offsetWidth, h = t.offsetHeight; let x = e.clientX + 16, y = e.clientY + 12;
  if (x + w > innerWidth - 8) x = e.clientX - w - 16; if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8); t.style.left = x + 'px'; t.style.top = y + 'px'; }
function hideTip() { const t = ftip(); if (t) t.style.display = 'none'; }
function tipHTML(d) {
  const M = ST.mode;
  if (Y66()) {
    const row = (nm, p, v, pct, h, y6) => `<div class="tc"><span class="rkn" style="background:${col(p)};color:${ink(col(p))}">1</span><span class="nm">${nm}${h ? HOUSE : ''}</span><span class="vv">${fmt(v)}<small>${pct}%</small></span><span class="pt">${y6 ? nm66(p) : p}</span></div>`;
    const none = '<div class="tc"><span></span><span class="pt">ไม่มีเขตนี้ในปี 66</span></div>';
    let a, b;
    if (M === 'list') { const t6 = d.p66 ? d.p66.reduce((s, x) => s + x[1], 0) : 1;
      a = row(d.pl[0][0], d.pl[0][0], d.pl[0][1], (d.pl[0][1] / d.plt * 100).toFixed(1));
      b = d.p66 ? row(nm66(d.p66[0][0]), d.p66[0][0], d.p66[0][1], (d.p66[0][1] / t6 * 100).toFixed(1), 0, 1) : none;
    } else { const g6 = d.c66 ? d.c66.reduce((s, x) => s + x[2], 0) : 1;
      a = row(d.w[0], d.w[1], d.w[2], (d.w[2] / d.good * 100).toFixed(1), d.w[4]);
      b = d.c66 ? row(d.c66[0][0], d.c66[0][1], d.c66[0][2], (d.c66[0][2] / g6 * 100).toFixed(1), d.c66[0][4], 1) : none; }
    const has66 = M === 'list' ? d.p66 : d.c66;
    return `<div class="tip"><div class="h"><b>${d.pv} เขต ${d.d}</b></div><div><div class="yh">ปี 2569</div>${a}</div><div class="y66b"><div class="yh">ปี 2566</div>${b}</div>${d.chg && has66 ? '<div class="f">⚠ เขตนี้อาจถูกแบ่งใหม่ เทียบกับปี 66 ได้ไม่ตรงทั้งหมด</div>' : ''}</div>`;
  }
  let body, right;
  const rk = (i, p) => `<span class="rkn" style="background:${col(p)};color:${ink(col(p))}">${i + 1}</span>`;
  if (M === 'list') {
    body = d.pl.slice(0, 4).map((x, i) => `<div class="tc ${x[0] === PPN ? 'pp' : ''}">${rk(i, x[0])}<span class="nm">${x[0]}</span><span class="vv">${fmt(x[1])}<small>${(x[1] / d.plt * 100).toFixed(1)}%</small></span><span class="pt">บัญชีรายชื่อ</span></div>`).join('');
    right = 'คะแนนบัญชีรายชื่อ';
  } else {
    body = d.cand.slice(0, 4).map((c, i) => `<div class="tc ${c[1] === PPN ? 'pp' : ''}">${rk(i, c[1])}<span class="nm">${c[0]}${c[4] ? HOUSE : ''}</span><span class="vv">${fmt(c[2])}<small>${(c[2] / d.good * 100).toFixed(1)}%</small></span><span class="pt">${c[1]}</span></div>`).join('');
    right = M === 'tier' ? `<span class="tp" style="background:${TT[d.tier][1]};color:${ink(TT[d.tier][1])}">${TT[d.tier][0]}</span>` : 'ผู้สมัคร สส.เขต';
  }
  return `<div class="tip"><div class="h"><b>${d.pv} เขต ${d.d}</b><span style="font-size:11px;color:#5d6370">${right}</span></div>${body}</div>`;
}

/* ---------- KPI ---------- */
function renderKPI() {
  const hide = ST.mode === 'both' || ST.mode === 'tier' || ST.mode === 'house' || Y66();
  $('#right').classList.toggle('nokpi', hide); if (hide) return;
  const n69 = N6['69'];
  if (!ST.reg) {
    const won = D.filter(d => d.ppr === 1).length, cs = Object.entries(n69.cs).sort((a, b) => b[1] - a[1]), r = cs.findIndex(x => x[0] === PPN);
    $('#k1l').textContent = 'พรรคประชาชนชนะ สส.เขต'; $('#k1v').innerHTML = `${won}<small> / ${D.length} เขต</small>`;
    $('#k1s').textContent = r === 0 ? `อันดับ 1 · อันดับ 2 คือ${cs[1][0]} (${cs[1][1]})` : `อันดับ ${r + 1} รองจาก${cs[0][0]} (${cs[0][1]})`;
    const lv = Object.entries(n69.lv).sort((a, b) => b[1] - a[1]), lr = lv.findIndex(x => x[0] === PPN), v = n69.lv[PPN];
    $('#k2l').textContent = 'พรรคประชาชน สส.บัญชีรายชื่อ'; $('#k2v').innerHTML = `${n69.ls[PPN] || 0}<small> / 100 ที่นั่ง</small>`;
    $('#k2s').textContent = `คะแนน ${(v / 1e6).toFixed(2)} ล้าน · อันดับ ${lr + 1} (${(v / n69.lt * 100).toFixed(1)}%)`;
  } else {
    const sub = D.filter(okR), won = sub.filter(d => d.ppr === 1).length;
    const cnt = d3.rollups(sub, v => v.length, d => d.w[1]).sort((a, b) => b[1] - a[1]), r = cnt.findIndex(x => x[0] === PPN);
    $('#k1l').textContent = 'พรรคประชาชนชนะ สส.เขต · ' + ST.reg; $('#k1v').innerHTML = `${won}<small> / ${sub.length} เขต</small>`;
    $('#k1s').textContent = r < 0 ? `ไม่ชนะในภาคนี้ · ${cnt[0][0]} ชนะมากสุด (${cnt[0][1]})` : r === 0 ? 'อันดับ 1 ในภาคนี้' + (cnt[1] ? ` · ${cnt[1][0]} (${cnt[1][1]})` : '') : `อันดับ ${r + 1} ในภาคนี้ รองจาก${cnt[0][0]} (${cnt[0][1]})`;
    const pv = d3.sum(sub, d => (d.pl.find(x => x[0] === PPN) || [0, 0])[1]), tot = d3.sum(sub, d => d.plt), lead = sub.filter(d => d.lrank === 1).length;
    $('#k2l').textContent = 'พรรคประชาชน บัญชีรายชื่อ · ' + ST.reg; $('#k2v').innerHTML = `${lead}<small> / ${sub.length} เขตที่ชนะ</small>`;
    $('#k2s').textContent = `คะแนน ${(pv / 1e6).toFixed(2)} ล้าน (${(pv / tot * 100).toFixed(1)}%) · ทั้งประเทศ ${n69.ls[PPN] || 0} ที่นั่ง`;
  }
}

/* ---------- right column ---------- */
const sortBtns = () => `<div class="sub">${[['gap','ตามระยะห่าง'],['reg','แยกภาค']].map(([k, t]) => `<button data-s="${k}" class="${ST.sort === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
const chartShell = () => `<div class="ovw"></div><div class="desc info"><span class="cnt"></span><span class="lab"></span></div><div class="list"></div>`;
function renderRight() {
  HVA = [];
  const rk = $('#rk');
  if (Y66()) { rk.className = 'card rk3'; render66(rk); return; }
  if (ST.mode === 'tier') { rk.className = 'card rk3 tier'; renderTier(rk); return; }
  if (ST.mode === 'both') {
    rk.className = 'card rk2';
    rk.innerHTML = `<div class="hd"><h3>พรรคประชาชน: สส.เขต เทียบ บัญชีรายชื่อ</h3>${sortBtns()}</div>
      <div class="half" id="h1"><h4>สส.เขต · ห่างผู้ชนะ / อันดับ 2 (% บัตรดี)</h4>${chartShell()}</div>
      <div class="half" id="h2"><h4>บัญชีรายชื่อ · ห่างพรรคที่ชนะ / อันดับ 2 (% คะแนนบัญชีรายชื่อ)</h4>${chartShell()}</div>`;
    chartBlock($('#h1'), 'win', 96, 'bw'); chartBlock($('#h2'), 'list', 96, 'bl'); return;
  }
  if (ST.mode === 'house') { const keep = rk.classList.contains('hrk'), st = rk.scrollTop, wy = window.scrollY; rk.className = 'card hrk'; renderHouse(rk); if (keep) { rk.scrollTop = st; window.scrollTo(0, wy); } return; }  /* คลิกกรองแล้วไม่เด้งกลับขึ้นบน */
  const kind = ST.mode === 'list' ? 'list' : 'win';
  rk.className = 'card rk';
  rk.innerHTML = `<div class="hd"><h3>${kind === 'list' ? 'บัญชีรายชื่อ: พรรคประชาชนห่างพรรคที่ชนะ / อันดับ 2' : 'พรรคประชาชนห่างผู้ชนะ / อันดับ 2 เท่าไร'}</h3>${sortBtns()}</div>${chartShell()}`;
  chartBlock(rk, kind, 112, kind);
}

/* กราฟระยะห่าง: overview + detail — ลากกรอบส้มเพื่อเลื่อน ลากขอบเพื่อยืด/หด คลิกที่ว่างเพื่อย้ายกรอบ */
function chartBlock(host, kind, OH, wkey) {
  const val = d => kind === 'list' ? d.lgap : (d.has ? d.gap : null), vv = d => val(d) == null ? -999 : val(d);
  const half = kind === 'list' ? 'l' : 'w';
  let ORD = D.filter(okR);
  const CL = ST.fil === 'close'; /* ชิป สูสี ±5% คุมกราฟนี้ด้วย */
  ORD.sort(ST.sort === 'reg' ? (a, b) => RO.indexOf(a.reg) - RO.indexOf(b.reg) || vv(b) - vv(a) : (a, b) => vv(b) - vv(a));
  const listEl = host.querySelector('.list'), ovw = host.querySelector('.ovw');
  const ow = listEl.clientWidth, NR = Math.max(4, Math.floor((listEl.clientHeight - 2) / ROWH));
  const N = ORD.length, lo = -70, hi = 55, x0 = 28, bw = (ow - x0 - 2) / Math.max(1, N);
  const ext = null;
  const yy = v => 8 + (hi - v) / (hi - lo) * (OH - 22);
  const ticks = [40, 20, 0, -20, -40, -60];
  const on = d => okF(d, half) && okL(d) && okBig(d);
  let s = '';
  ticks.forEach(v => s += `<line x1="${x0}" x2="${ow}" y1="${yy(v)}" y2="${yy(v)}" stroke="#e1e4ea" stroke-dasharray="2 3"/><text x="24" y="${yy(v) + 3}" font-size="9" text-anchor="end" fill="#5d6370" font-family="IBM Plex Sans Thai,sans-serif">${v > 0 ? '+' : ''}${v}%</text>`);
  ORD.forEach((d, i) => { const v = val(d) ?? 0; s += `<rect x="${x0 + i * bw + bw * .075}" width="${Math.max(.7, bw * .85)}" y="${yy(Math.max(0, v))}" height="${Math.max(.8, Math.abs(yy(v) - yy(0)))}" fill="${gcolv(val(d))}" opacity="${on(d) ? 1 : .2}"/>`; });
  if (ST.sort === 'reg') { let s0 = 0; RO.forEach(r => { const n = ORD.filter(d => d.reg === r).length; if (!n) return; const xa = x0 + s0 * bw, xb = x0 + (s0 + n) * bw;
    s += `<text x="${(xa + xb) / 2}" y="${OH - 2}" font-size="9.5" text-anchor="middle" fill="#5d6370">${short(r)}</text>`; if (s0) s += `<line x1="${xa}" x2="${xa}" y1="4" y2="${OH - 12}" stroke="#9aa0ab" stroke-dasharray="3 3"/>`; s0 += n; }); }
  const nw = ORD.filter(d => val(d) != null && val(d) > 0).length;
  s += `<line x1="${x0}" x2="${ow}" y1="${yy(0)}" y2="${yy(0)}" stroke="#16181d" opacity=".55"/>`;
  if (ST.sort !== 'reg') s += `<text x="30" y="9" font-size="10" fill="#5d6370">← ชนะ ${nw} เขต</text><text x="${ow - 2}" y="${OH - 2}" font-size="10" text-anchor="end" fill="#5d6370">แพ้ ${N - nw} เขต →</text>`;
  if (false && N && nw && nw < N) s += `<line x1="${x0 + nw * bw}" x2="${x0 + nw * bw}" y1="4" y2="${OH - 12}" stroke="#16181d" stroke-dasharray="3 2" opacity=".5"/>`;
  ovw.innerHTML = `<svg class="ov" width="${ow}" height="${OH}">${s}</svg>`;
  host.querySelector('.lab').textContent = 'คู่แข่งที่ใกล้ที่สุด';
  const opp = d => kind === 'list' ? (d.lrank === 1 ? d.pl[1][0] : d.pl[0][0]) : (d.ppr === 1 ? d.cand[1][1] : d.cand[0][1]);
  if (!N) { host.querySelector('.cnt').textContent = 'ไม่มีเขตที่ตรงเงื่อนไข'; listEl.innerHTML = ''; return; }
  let [i0, i1] = ST.win[wkey] || (() => {
    if (CL) { const ix = ORD.map((d, k) => val(d) != null && Math.abs(val(d)) <= 5 ? k : -1).filter(k => k >= 0); if (ix.length) return [ix[0], ix[ix.length - 1] + 1]; }
    if (ST.sort === 'gap' && !CL) { const z = ORD.findIndex(d => val(d) != null && val(d) < 0), a = Math.max(0, Math.min(N - NR, (z < 0 ? 0 : z) - Math.floor(NR / 2))); return [a, Math.min(N, a + NR)]; }
    return [0, Math.min(N, NR)];
  })();
  i0 = Math.max(0, Math.min(N - 1, i0)); i1 = Math.max(i0 + 1, Math.min(N, i1));
  function list() {
    ST.win[wkey] = [i0, i1];
    const rows = ORD.slice(i0, i1), R = d3.max(rows, d => Math.abs(val(d) || 0)) || 1;
    host.querySelector('.cnt').textContent = `${rows.length} เขต · อันดับ ${i0 + 1}–${i1} จาก ${N}`;
    listEl.innerHTML = rows.map(d => { const v = val(d), w = v == null ? 0 : Math.abs(v) / R * 50;
      return `<div class="r ${ST.sel === key(d) ? 'sel' : ''}" data-k="${key(d)}" style="opacity:${on(d) ? 1 : .35}"><span>${d.pv} <span class="muted">เขต ${d.d}</span></span><span class="tr"><span class="z" style="left:50%"></span><i style="left:${v < 0 ? 50 - w : 50}%;width:${Math.max(.8, w)}%;background:${gcolv(v)}"></i></span><span class="v">${v == null ? '–' : sgn(v)}</span><span class="op"><span class="sw" style="background:${col(opp(d))}"></span>${opp(d)} <b class="${v > 0 ? 'ol' : 'ow'}">${v == null ? '' : v > 0 ? 'แพ้' : 'ชนะ'}</b></span></div>`; }).join('');
  }
  const ov = d3.select(host).select('svg.ov'), X = i => x0 + i * bw, clampI = () => { i0 = Math.max(0, Math.min(N - 1, i0)); i1 = Math.max(i0 + 1, Math.min(N, i1)); };
  const fromSel = s => { i0 = Math.round((s[0] - x0) / bw); i1 = Math.round((s[1] - x0) / bw); clampI(); };
  const br = d3.brushX().extent([[x0, 2], [ow, OH - 12]]).handleSize(8)
    .filter(e => !e.button && !(e.target.classList && e.target.classList.contains('overlay')))
    .on('brush', e => { if (!e.sourceEvent || !e.selection) return; fromSel(e.selection); list(); })
    .on('end', e => { if (!e.sourceEvent || !e.selection) return; fromSel(e.selection); bg.call(br.move, [X(i0), X(i1)]); list(); });
  const bg = ov.append('g').attr('class', 'brush').call(br);
  /* คลิกที่ว่าง = ย้ายกรอบไปตรงนั้น ขนาดเท่าเดิม (ไม่วาดกรอบใหม่) */
  bg.select('.overlay').on('mousedown.brush touchstart.brush', null).on('pointerdown', e => {
    const w = i1 - i0, c = (d3.pointer(e, ov.node())[0] - x0) / bw;
    i0 = Math.round(c - w / 2); i0 = Math.max(0, Math.min(N - w, i0)); i1 = i0 + w;
    bg.transition().duration(300).call(br.move, [X(i0), X(i1)]); list();
  });
  bg.call(br.move, [X(i0), X(i1)]);
  /* แถบเข้มในกรอบ = แถวที่กำลังเห็นในรายการ (เลื่อนรายการ → แถบเลื่อนตาม) */
  const vw = ov.append('rect').attr('class', 'vwin').attr('y', 3).attr('height', OH - 16).attr('pointer-events', 'none');
  const hv = ov.append('path').attr('class', 'hvarrow').attr('d', 'M0,0 L-5,8 L5,8 Z').attr('fill', '#16181d').attr('pointer-events', 'none').attr('opacity', 0);
  const syncVw = () => { const f = Math.floor(listEl.scrollTop / ROWH), n = Math.min(i1 - i0 - f, Math.ceil(listEl.clientHeight / ROWH)); vw.attr('opacity', 0); };
  listEl.onscroll = syncVw;
  /* หมุนล้อจนสุดรายการ → กรอบข้างบนเลื่อนต่อ (ขนาดเท่าเดิม) */
  listEl.onwheel = e => {
    const atEnd = listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 1, atTop = listEl.scrollTop <= 0, st = 3;
    if (e.deltaY > 0 && atEnd && i1 < N) { e.preventDefault(); const m = Math.min(st, N - i1); i0 += m; i1 += m; bg.call(br.move, [X(i0), X(i1)]); list(); listEl.scrollTop = listEl.scrollHeight; syncVw(); }
    else if (e.deltaY < 0 && atTop && i0 > 0) { e.preventDefault(); const m = Math.min(st, i0); i0 -= m; i1 -= m; bg.call(br.move, [X(i0), X(i1)]); list(); listEl.scrollTop = 0; syncVw(); }
  };
  /* ชี้แถว → แท่งในกราฟข้างบนเด่นขึ้น */
  /* ชี้เขต (จากแผนที่ หรือแถวรายการของกราฟไหนก็ได้) → ลูกศรขึ้นใต้แท่งของเขตนั้น; กรอบส้มไม่ขยับ */
  const arrow = d => { const i = d ? ORD.indexOf(d) : -1; if (i < 0) { hv.attr('opacity', 0); return; } hv.attr('transform', `translate(${X(i) + bw / 2},${OH - 12})`).attr('opacity', 1).raise(); };
  arrow.alive = () => hv.node().isConnected; HVA.push(arrow); arrow(ST.hover);
  list(); syncVw();
}

/* ระดับโอกาส */
function renderTier(rk) {
  const sub = D.filter(okR);
  rk.innerHTML = `<div class="hd"><h3>ระดับโอกาสของพรรคประชาชน</h3><span class="desc">จุดละ 1 เขต · ลากกรอบเพื่อเลือกกลุ่มเขต · คลิกนอกกรอบเพื่อล้าง</span></div><div class="scw"><svg class="sc"></svg></div><div class="tl"></div>`;
  /* กราฟ:ตาราง = ครึ่ง:ครึ่ง (CSS grid) → วัดความสูงช่องกราฟจริงแล้ววาด */
  const scw = rk.querySelector('.scw'), W = rk.clientWidth - 24, SH = Math.max(200, Math.min(540, scw.clientHeight)), m = {l:46, r:10, t:12, b:30};
  /* ช่องกราฟเปลี่ยนขนาด (ฟอนต์โหลดเสร็จ / หมุนจอ / ย่อหน้าต่าง) → วาดใหม่ให้พอดีช่อง ไม่ให้แกนล่างโดนตัด */
  const h0 = scw.clientHeight, ro = new ResizeObserver(() => { if (!scw.isConnected) { ro.disconnect(); return; } if (Math.abs(scw.clientHeight - h0) > 3) { ro.disconnect(); renderTier(rk); } }); ro.observe(scw);
  const xs = d3.scaleLinear([-72, 46], [m.l, W - m.r]), ys = d3.scaleLinear([-60, 45], [SH - m.b, m.t]);
  const Z = [[-72,-30,-60,45,'far'],[-30,-5,0,45,'cand'],[-30,-5,-60,0,'far'],[-5,0,-60,45,'flip'],[0,5,-60,45,'hold'],[5,46,-60,0,'hold'],[5,46,0,45,'safe']];
  let sv = Z.map(([a, b, c, e, t]) => `<rect x="${xs(a)}" y="${ys(e)}" width="${xs(b) - xs(a)}" height="${ys(c) - ys(e)}" fill="${TT[t][1]}" opacity=".13"/>`).join('');
  [[-50,25,'far'],[-17.5,38,'cand'],[25,38,'safe'],[25,-50,'hold']].forEach(([a, b, k]) => sv += `<text x="${xs(a)}" y="${ys(b)}" text-anchor="middle" font-size="12" font-weight="700" fill="${d3.color(TT[k][1]).darker(k === 'far' || k === 'hold' ? 1.4 : .4)}">${TT[k][0]}</text>`);
  sv += `<text x="${xs(-2.5)}" y="${m.t - 1}" text-anchor="middle" font-size="11" font-weight="700" fill="#7b3fc4">พลิกได้</text>`;
  [-60,-40,-20,0,20,40].forEach(v => sv += `<text x="${m.l - 6}" y="${ys(v) + 3}" font-size="9.5" text-anchor="end" fill="#5d6370" font-family="IBM Plex Sans Thai,sans-serif">${v > 0 ? '+' : ''}${v}%</text>`);
  [-30,-5,0,5].forEach(v => sv += `<line x1="${xs(v)}" x2="${xs(v)}" y1="${m.t}" y2="${SH - m.b}" stroke="#16181d" stroke-width="${v ? 1 : 1.6}" ${v ? 'stroke-dasharray="4 3"' : ''} opacity=".7"/><text x="${xs(v)}" y="${SH - m.b + 13}" font-size="10" text-anchor="middle" font-family="IBM Plex Sans Thai,sans-serif">${v > 0 ? '+' : ''}${v}%</text>`);
  sv += `<line x1="${m.l}" x2="${W - m.r}" y1="${ys(0)}" y2="${ys(0)}" stroke="#16181d" stroke-width="1.6" opacity=".7"/>`;
  sv += `<text x="${(m.l + W) / 2}" y="${SH - 3}" font-size="11" text-anchor="middle" fill="#5d6370">← แพ้ · ผลการแข่งขัน สส.เขต ของพรรคประชาชน (% บัตรดี) · ชนะ →</text>`;
  sv += `<text transform="translate(11,${(SH - m.b + m.t) / 2}) rotate(-90)" font-size="11" text-anchor="middle" fill="#5d6370">บัญชีรายชื่อ แพ้ ← → ชนะ</text>`;
  const sc = d3.select(rk).select('svg.sc').attr('width', W).attr('height', SH).html(sv);
  const br = d3.brush().extent([[m.l, m.t], [W - m.r, SH - m.b]]).on('end', e => { if (!e.sourceEvent) return; const s = e.selection;
    ST.brush = s ? [xs.invert(s[0][0]), xs.invert(s[1][0]), ys.invert(s[1][1]), ys.invert(s[0][1])] : null; render(); });
  const bg = sc.append('g').attr('class', 'brush').call(br);
  if (ST.brush) { const [a, b, c, e] = ST.brush; bg.call(br.move, [[xs(a), ys(e)], [xs(b), ys(c)]]); }
  sc.on('dblclick', () => { if (ST.brush) { ST.brush = null; render(); } });
  sc.append('g').selectAll('circle').data(sub.filter(d => d.has)).join('circle').attr('class', 'dot').attr('data-k', key)
    .attr('cx', d => xs(Math.max(-72, Math.min(46, d.gap)))).attr('cy', d => ys(Math.max(-60, Math.min(45, d.lgap))))
    .attr('fill', d => TT[d.tier][1]).attr('opacity', d => inB(d) && okL(d) && okF(d) && okBig(d) ? 1 : .15)
    .on('mouseenter', (e, d) => { showTip(e, tipHTML(d)); setHover(d); }).on('mousemove', moveTip).on('mouseleave', () => { hideTip(); setHover(null); }).on('click', (e, d) => select(d));
  styleDots();
  let rows = sub.filter(d => d.has && inB(d) && okF(d) && okL(d) && okBig(d));
  rows.sort((a, b) => TK.indexOf(a.tier) - TK.indexOf(b.tier) || Math.abs(a.gap) - Math.abs(b.gap));
  const num = v => `<span class="tv"><span class="tw">${v > 0 ? 'ชนะ' : 'แพ้'}</span><span class="tn">${Math.abs(v).toFixed(1)}%</span></span>`;
  rk.querySelector('.tl').innerHTML = `<div class="th"><span>จังหวัด · เขต</span><span>ระดับโอกาส</span><span style="text-align:right">สส.เขต</span><span style="text-align:right">บัญชีรายชื่อ</span></div>`
    + (rows.length ? rows.map(d => `<div class="trr ${ST.sel === key(d) ? 'sel' : ''}" data-k="${key(d)}"><span>${d.pv} <span class="muted">เขต ${d.d}</span>${d.w[4] && ST.big ? HOUSE : ''}</span><span><span class="tp" style="background:${TT[d.tier][1]};color:${ink(TT[d.tier][1])}">${TT[d.tier][0]}</span></span>${num(d.gap)}${num(d.lgap)}</div>`).join('')
      : '<div class="muted" style="padding:10px 12px">ไม่มีเขตที่ตรงเงื่อนไข</div>');
}
function styleDots() { d3.selectAll('#rk circle.dot').attr('opacity', d => inB(d) && okL(d) && okF(d) && okBig(d) ? 1 : .15).attr('r', d => ST.sel === key(d) ? 5.5 : 3).attr('stroke', d => ST.sel === key(d) ? '#16181d' : '#fff').attr('stroke-width', d => ST.sel === key(d) ? 2 : .6).filter(d => ST.sel === key(d)).raise(); }

/* ปี 66 » 69 */
function render66(rk) {
  const L_ = ST.mode === 'list', k = L_ ? 'ls' : 'cs', N = N6;
  const regional = ST.reg && !L_;
  const src = y => { if (!regional) return Object.entries(N[y][k]); const m = {}; D.filter(okR).forEach(d => { const w = y === '69' ? d.w[1] : (d.c66 ? d.c66[0][1] : null); if (w) m[w] = (m[w] || 0) + 1; }); return Object.entries(m); };
  const top = y => src(y).sort((a, b) => b[1] - a[1]);
  const r66 = top('66').slice(0, 10), r69 = top('69').slice(0, 10), rank66 = top('66').map(x => x[0]);
  const sub = (y, p) => L_ ? `${(N[y].lv[p] / 1e6).toFixed(2)} ล้านคะแนน · ${(N[y].lv[p] / N[y].lt * 100).toFixed(1)}%` : '';
  const card = (i, p, v, y) => {
    const rc = y === 69 ? (rank66.indexOf(p) < 0 ? null : rank66.indexOf(p) - i) : null;
    const bd = y === 69 ? (rc == null ? '<span class="bd new">ใหม่</span>' : rc > 0 ? `<span class="bd up">▲${rc}</span>` : rc < 0 ? `<span class="bd dn">▼${-rc}</span>` : '') : '';
    return `<div class="pc ${y === 69 ? 'r' : 'l'} sm"><div class="rkb" style="background:${col(p)}">${i + 1}</div><div class="lg2">${y === 66 ? LGO66(p, 28) : LGO(p, 28)}</div><div class="pn"><b>${y === 66 ? nm66(p) : p}</b><span>${sub(y, p)} ${bd}</span></div><div class="pv">${v}</div></div>`;
  };
  let rows = ''; for (let i = 0; i < 10; i++) rows += (r66[i] ? card(i, r66[i][0], r66[i][1], 66) : '<div class="pc empty"></div>') + '<div class="arr">»</div>' + (r69[i] ? card(i, r69[i][0], r69[i][1], 69) : '<div class="pc empty"></div>');
  rk.innerHTML = `<div class="hd"><h3>${L_ ? 'ที่นั่ง สส.บัญชีรายชื่อ' : 'ที่นั่ง สส.เขต'}${ST.reg ? ' · ' + (L_ ? 'ทั้งประเทศ' : ST.reg) : ''} · 10 อันดับแรก</h3><span class="desc">${L_ ? 'ที่นั่งคำนวณจากคะแนน' : 'จำนวนเขตที่ชนะ'}</span></div>
    <div class="cmph"><span>ปี 66</span><span>»</span><span>ปี 69</span></div><div class="cmpw"><div class="cmp">${rows}</div></div>
    <div class="desc">▲▼ = อันดับเปลี่ยนจากปี 66 · ใหม่ = ไม่ติด 10 อันดับในปี 66</div>`;
}

/* ---------- panel ---------- */
function select(d) { ST.sel = key(d); ST.pexp = {c:false, l:false}; ST.ps = {c:{k:'v',dir:-1}, l:{k:'v',dir:-1}}; hideTip(); renderPanel(); refreshSel(); }
function closePanel() { if (!ST.sel) return; ST.sel = null; const p = $('#panel'); p.classList.remove('open'); $('#right').classList.remove('pop'); refreshSel(); }
function refreshSel() { drawHi(); document.querySelectorAll('#rk [data-k]').forEach(e => { if (!e.classList.contains('dot')) e.classList.toggle('sel', e.dataset.k === ST.sel); }); styleDots(); }
const ballotRows = d => ({c:{lab:'บัตร สส.เขต', to:d.to, g:d.good, b:d.bad, n:d.nv}, l:{lab:'บัตรบัญชีรายชื่อ', to:d.lto, g:d.lgood, b:d.lbad, n:d.lnv}});
function ballots(d, rows) {
  const R = ballotRows(d); let h = '<div style="display:grid;gap:7px">';
  rows.forEach(k => { const r = R[k], p = v => v / r.to * 100, seg = (kk, v, c, t) => `<div data-bk="${k}-${kk}" style="flex:${Math.max(p(v), 6)};background:${c}">${t}</div>`;
    h += `<div style="display:grid;grid-template-columns:96px 1fr;gap:8px;align-items:center;font-size:11.5px"><span>${r.lab}</span><div class="ballot">${seg('g', r.g, '#4b8f6a', 'บัตรดี ' + p(r.g).toFixed(1) + '%')}${seg('b', r.b, '#c0504d', p(r.b).toFixed(1) + '%')}${seg('n', r.n, '#8a8f99', p(r.n).toFixed(1) + '%')}</div></div>`; });
  return h + `</div><div class="bleg"><span><span class="sw" style="background:#4b8f6a"></span> บัตรดี</span><span><span class="sw" style="background:#c0504d"></span> บัตรเสีย</span><span><span class="sw" style="background:#8a8f99"></span> ไม่เลือกผู้ใด</span></div>`;
}
function ballotTip(d, k, kk) {
  const R = ballotRows(d), r = R[k], o = R[k === 'c' ? 'l' : 'c'], name = {g:'บัตรดี', b:'บัตรเสีย', n:'ไม่เลือกผู้ใด'}[kk], v = r[kk], ov = o[kk];
  return `<div class="tip" style="width:260px"><div class="h"><b style="font-size:12.5px">${r.lab} · ${name}</b></div><div class="bd2"><div class="kv"><span>จำนวน</span><b class="mono">${fmt(v)} ใบ</b></div><div class="kv"><span>สัดส่วนของผู้มาใช้สิทธิ์</span><b class="mono">${(v / r.to * 100).toFixed(2)}%</b></div><div class="kv muted"><span>${o.lab}</span><span class="mono">${fmt(ov)} ใบ (${(ov / o.to * 100).toFixed(2)}%)</span></div><div class="kv muted"><span>ค่าเฉลี่ยทั้งประเทศ</span><span class="mono">${kk === 'g' ? '–' : NATB[k][kk].toFixed(2) + '%'}</span></div></div></div>`;
}
function butterfly(d) {
  const cv = {}, lv = {}; d.cand.forEach(c => cv[c[1]] = c[2] / d.good * 100); d.pl.forEach(x => lv[x[0]] = x[1] / d.plt * 100);
  const parts = [...new Set([...d.cand.slice(0, 4).map(c => c[1]), ...d.pl.slice(0, 4).map(x => x[0])])].slice(0, 6);
  const R = [...parts.map(p => [p, cv[p] || 0, lv[p] || 0, col(p)]), ['พรรคอื่น', Math.max(0, 100 - d3.sum(parts, p => cv[p] || 0)), Math.max(0, 100 - d3.sum(parts, p => lv[p] || 0)), '#9aa0ab']];
  const bm = d3.max(R, r => Math.max(r[1], r[2]));
  return `<div class="bfly"><span></span><span style="text-align:right;padding-right:6px;font-size:11px;color:#5d6370">◀ สส.เขต</span><span style="padding-left:6px;font-size:11px;color:#5d6370">บัญชีรายชื่อ ▶</span>`
    + R.map(([p, a, b, c]) => `<span class="ell" style="${p === PPN ? 'font-weight:700' : p === 'พรรคอื่น' ? 'color:#5d6370' : ''}">${p}</span><span class="l"><i style="width:${a / bm * 74}%;background:${c}"></i><span class="lv" style="right:${a / bm * 74 + 2}%">${a.toFixed(1)}</span></span><span class="rr"><i style="width:${b / bm * 74}%;background:${c}"></i><span class="rv" style="left:${b / bm * 74 + 2}%">${b.toFixed(1)}</span></span>`).join('') + '</div>';
}
/* ตารางผู้สมัคร / บัญชีรายชื่อ — กดหัวคอลัมน์ เบอร์ / คะแนนเสียง / % เพื่อเรียง ; แสดง 5 แถวแรก */
function table(d, t, compact) {
  const rows = t === 'c' ? d.cand.map(c => ({no:c[3], name:c[0], party:c[1], v:c[2], h:c[4]})) : d.pl.map(x => ({no:PARTY[x[0]] ? PARTY[x[0]].n : '', name:x[0], party:x[0], v:x[1]}));
  const tot = t === 'c' ? d.good : d.plt, top = rows[0].v, mx = top, s = ST.ps[t];
  const sorted = rows.slice().sort(s.k === 'no' ? (a, b) => ((+a.no || 999) - (+b.no || 999)) * s.dir : (a, b) => (a.v - b.v) * s.dir);
  const exp = ST.pexp[t], show = exp ? sorted : sorted.slice(0, 5);
  const ar = k => s.k === k || (k !== 'no' && s.k !== 'no') ? `<span class="ar on">${s.dir > 0 ? '▲' : '▼'}</span>` : '<span class="ar">⇅</span>';
  const head = `<tr><th class="s" data-ps="${t}:no" style="width:${compact ? 44 : 56}px">เบอร์${ar('no')}</th><th>${t === 'c' ? 'ชื่อผู้สมัคร' : 'พรรค'}</th><th class="nr s" data-ps="${t}:v">${compact ? 'คะแนน' : 'คะแนนเสียง'}${ar('v')}</th><th class="nr s" data-ps="${t}:p" style="width:${compact ? 58 : 68}px">%${ar('p')}</th></tr>`;
  const body = show.map(r => { const pp = r.party === PPN, gap = top - r.v;
    return `<tr class="${pp ? 'pp' : ''}"><td class="no">${r.no}</td><td class="nm"><b>${r.name}</b>${r.h ? HOUSE : ''}${t === 'c' && !compact ? ` <span>· ${r.party}</span>` : ''}</td><td class="nr">${fmt(r.v)}</td><td class="nr">${(r.v / tot * 100).toFixed(1)}%</td></tr>`
      + `<tr class="brow ${pp ? 'pp' : ''}"><td></td><td colspan="3"><i style="width:${Math.max(.6, r.v / mx * 100)}%;background:${col(r.party)}"></i>${pp && gap > 0 ? `<div class="note">แพ้จาก${t === 'c' ? 'ผู้ชนะ' : 'พรรคที่ชนะ'} ${fmt(gap)} คะแนน (${(gap / tot * 100).toFixed(1)}%)</div>` : ''}</td></tr>`; }).join('');
  const more = rows.length > 5 ? `<button class="more" data-more="${t}">${exp ? 'ย่อรายชื่อ ▴' : `ดูเพิ่มเติมอีก ${rows.length - 5} ${t === 'c' ? 'คน' : 'พรรค'} ▾`}</button>` : '';
  return `<table class="ptab ${compact ? 'cp' : ''}">${head}${body}</table>${more}`;
}
const panelHead = d => `<div class="ph"><div class="t1"><span class="eb">${d.reg} · ${d.pv}</span><button class="x" data-close title="ปิด">✕</button></div><div class="tt">${d.pv} เขต ${d.d}</div></div>`;
function renderPanel() {
  const d = selD(); if (!d) return; const p = $('#panel'), sc = p.querySelector('.pb') ? p.querySelector('.pb').scrollTop : 0, same = p.dataset.k === ST.sel;
  p.innerHTML = Y66() ? panel66(d) : ST.mode === 'both' ? panelBoth(d) : panelOne(d);
  p.dataset.k = ST.sel; p.classList.add('open'); $('#right').classList.add('pop');
  if (same && p.querySelector('.pb')) p.querySelector('.pb').scrollTop = sc;
  p.querySelectorAll('[data-bk]').forEach(el => { const [k, kk] = el.dataset.bk.split('-'); el.addEventListener('mouseenter', e => showTip(e, ballotTip(d, k, kk))); el.addEventListener('mousemove', moveTip); el.addEventListener('mouseleave', hideTip); });
}
function panel66(d) {
  const L_ = ST.mode === 'list', A = L_ ? (d.p66 || []).map(x => [x[0], x[0], x[1], 0, 0]) : (d.c66 || []), B = L_ ? d.pl.map(x => [x[0], x[0], x[1], 0, 0]) : d.cand;
  const ta = A.reduce((s, x) => s + x[2], 0) || 1, tb = B.reduce((s, x) => s + x[2], 0), rA = A.map(x => x[1]);
  const pc = (c, i, y) => { if (!c) return '<div></div>';
    const rc = y === 69 ? (rA.indexOf(c[1]) < 0 ? null : rA.indexOf(c[1]) - i) : null;
    const bd = y === 69 && A.length ? (rc == null ? '<span class="bd new">ใหม่</span>' : rc > 0 ? `<span class="bd up">▲${rc}</span>` : rc < 0 ? `<span class="bd dn">▼${-rc}</span>` : '') : '';
    const pn = y === 66 ? nm66(c[1]) : c[1];
    return `<div class="cc ${y === 69 ? 'r' : 'l'}"><div class="rkb" style="background:${col(c[1])}">${i + 1}</div><div class="lg2">${y === 66 ? LGO66(c[1], 30) : LGO(c[1], 30)}</div><div class="pn"><b>${L_ ? pn : c[0]}${c[4] ? HOUSE : ''}</b><span>${L_ ? 'บัญชีรายชื่อ' : pn} ${bd}</span></div><div class="pv" style="font-size:16px">${fmt(c[2])}<small>${(c[2] / (y === 69 ? tb : ta) * 100).toFixed(1)}%</small></div></div>`; };
  const has = L_ ? d.p66 : d.c66; let rows = ''; for (let i = 0, n = Math.max(A.length, B.length); i < n; i++) rows += pc(A[i], i, 66) + pc(B[i], i, 69);
  const w = L_ ? 'บัญชีรายชื่อ' : 'คะแนน';
  return panelHead(d) + `<div class="pb"><div class="cmph two2"><span>ผล${w}ปี 66</span><span>ผล${w}ปี 69</span></div><div class="cmp two2">${rows}</div>${has && d.chg ? '<div class="desc">⚠ จำนวนผู้มีสิทธิ์ต่างจากปี 66 เกิน 5% เขตนี้อาจถูกแบ่งใหม่</div>' : ''}</div>`;
}
function panelBoth(d) {
  return panelHead(d) + `<div class="pb"><div class="two"><div><div class="st">สส.เขต</div>${table(d, 'c', true)}</div><div><div class="st">บัญชีรายชื่อ</div>${table(d, 'l', true)}</div></div>
    <div style="display:grid;gap:5px"><span class="st">สส.เขต เทียบ บัญชีรายชื่อ ในเขตนี้ (%)</span>${butterfly(d)}</div>
    <div style="display:grid;gap:6px"><span class="st">ผู้มาใช้สิทธิ์ ${fmt(d.to)} จาก ${fmt(d.el)} คน (${(d.to / d.el * 100).toFixed(1)}%)</span>${ballots(d, ['c', 'l'])}</div></div>`;
}
function panelOne(d) {
  const L2 = ST.mode === 'list', tot = L2 ? d.lto : d.to;
  return panelHead(d) + `<div class="pb">${table(d, L2 ? 'l' : 'c')}
    <div style="display:grid;gap:5px"><span class="st">สส.เขต เทียบ บัญชีรายชื่อ ในเขตนี้ (%)</span>${butterfly(d)}</div>
    <div style="display:grid;gap:5px"><span class="st">${L2 ? 'บัตรบัญชีรายชื่อ · ' : ''}ผู้มาใช้สิทธิ์ ${fmt(tot)} จาก ${fmt(d.el)} คน (${(tot / d.el * 100).toFixed(1)}%)</span>${ballots(d, [L2 ? 'l' : 'c'])}</div></div>`;
}



/* ---------- โหมดข้อมูลบ้านใหญ่ ---------- */
const HW = '#2e9e5b', HL = '#d9dce2';
const RN = ['กรุงเทพมหานคร','ภาคกลาง','ภาคตะวันตก','ภาคตะวันออก','ภาคตะวันออกเฉียงเหนือ','ภาคใต้','ภาคเหนือ'];
const RS = r => r === 'กรุงเทพมหานคร' ? 'กทม.' : r.replace('ภาค', '');
function drawHouseTile(t, d) {
  const {TL, TR, BR, BL, cx, cy} = geo(t), on = hLit(d);
  const g = gTiles.append('g').attr('class', 'tile')
    .on('mouseenter', e => { showTip(e, tipHTML(d)); setHover(d); }).on('mousemove', moveTip).on('mouseleave', () => { hideTip(); setHover(null); }).on('click', () => select(d));
  const f = on ? col(d.w[1]) : isB(d) ? d3.interpolateRgb(col(d.w[1]), '#fff')(.82) : '#f1f2f5';
  g.append('polygon').attr('points', shrink([BL, BR, TR, TL], cx, cy, .9)).attr('fill', f);
  g.append('text').attr('x', cx).attr('y', cy + .03).attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('font-size', .42).attr('font-weight', 700)
    .attr('font-family', 'IBM Plex Sans Thai,sans-serif').attr('fill', '#fff').attr('pointer-events', 'none').text(t.d);
}
function renderLegendHouse() {
  /* จำนวนเขตที่บ้านใหญ่ของแต่ละพรรคลงสมัคร (ทั้งประเทศ · ไม่เปลี่ยนตาม link & brush) · คลิกเพื่อกรองพรรค (ค่าเดียวกับกราฟแยกตามพรรค) */
  const cnt = d3.rollups(D.filter(isB).flatMap(d => bfP(d)), v => v.length, p => p).sort((a, b) => b[1] - a[1]), sp = ST.h.party;
  $('#legend').innerHTML = `<div class="t">บ้านใหญ่ลงสมัคร (เขต)</div>`
    + `<button class="lg ${!sp ? 'on' : ''}" data-hp=""><span class="sw allsw"></span><span>ทั้งหมด</span><span class="n">${D.filter(isB).length}</span></button>`
    + cnt.map(([p, n]) => `<button class="lg ${sp === p ? 'on' : ''} ${sp && sp !== p ? 'dim' : ''}" data-hp="${p}"><span class="sw" style="background:${col(p)}"></span><span style="${p === PPN ? 'font-weight:700' : ''}">${p}</span><span class="n">${n}</span></button>`).join('');
}
function renderHouse(rk) {
  const B = D.filter(isB), SEL = B.filter(d => okR(d) && hP(d)), nW = SEL.filter(hWon).length, nA = SEL.length, pw = nA ? nW / nA * 100 : 0;
  const chips = [ST.reg ? `<button class="fc" data-hx="reg">ภาค: ${RS(ST.reg)} ✕</button>` : '', ST.h.party ? `<button class="fc" data-hx="party">พรรค: ${ST.h.party} ✕</button>` : ''].join('');
  let h = `<div class="hhd"><h3>ข้อมูลบ้านใหญ่</h3><div class="fcs">${chips}</div></div>
  <div class="sum"><div class="st3">เขตที่มีตระกูลบ้านใหญ่${ST.h.party ? 'ของ' + ST.h.party : ''}ลงสมัคร สส.แบ่งเขต${ST.reg ? ' · ' + RS(ST.reg) : ''} รวม <b>${nA}</b> เขต</div>
  <div class="sbar">${nA ? `<div style="width:${pw}%;background:${HW}">${pw >= 8 ? `<b>${pw.toFixed(1)}%</b>` : ''}</div><div style="width:${100 - pw}%;background:${HL}">${100 - pw >= 8 ? `<b style="color:#5d6370">${(100 - pw).toFixed(1)}%</b>` : ''}</div>` : `<div style="width:100%;background:#f1f2f5;justify-content:center"><b style="color:#9aa0ab">ไม่มีบ้านใหญ่ของพรรคนี้ลงในภาคนี้</b></div>`}</div>
  <div class="slab"><span><i style="background:${HW}"></i>ได้รับเลือกตั้ง <b>${nW}</b> เขต</span><span>ไม่ได้รับเลือกตั้ง <b>${nA - nW}</b> เขต <i style="background:${HL}"></i></span></div></div>`;
  const R = RN.map(r => { const v = B.filter(d => d.reg === r && hP(d)); return {r, w:v.filter(hWon).length, l:v.filter(d => !hWon(d)).length}; });
  /* รายชื่อพรรคคงที่ (ลำดับตามจำนวนทั้งประเทศ) → ขนาดกล่องไม่เปลี่ยนเมื่อกรอง */
  const ORDER = d3.rollups(B.flatMap(d => bfP(d)), v => v.length, p => p).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const PP = ORDER.map(p => { const v = B.filter(d => okR(d) && bfP(d).includes(p)); return [p, {w:v.filter(d => d.w[1] === p && d.w[4]).length, l:v.filter(d => !(d.w[1] === p && d.w[4])).length}]; }).filter(x => x[1].w + x[1].l > 0);
  const CH = 10 * 22 + 6 + 20;
  /* กราฟแยกตามภาค: กว้างตามกล่องจริง */
  const mk1 = CW => { const mx = d3.max(R, x => x.w + x.l) || 1, bwd = (CW - 10) / R.length, y = v => v / mx * (CH - 52), fs = bwd < 34 ? 9.5 : 10.5;
    let c1 = `<svg width="${CW}" height="${CH}" class="hsv">`;
    R.forEach((x, i) => { const X = 5 + i * bwd + bwd * .14, w = bwd * .72, sel = ST.reg === x.r, dim = ST.reg && !sel, base = CH - 28;
      c1 += `<g data-hr="${x.r}" opacity="${dim ? .35 : 1}" style="cursor:pointer"><rect x="${X - 4}" y="0" width="${w + 8}" height="${CH}" fill="transparent"/><rect x="${X}" y="${base - y(x.w)}" width="${w}" height="${y(x.w)}" fill="${HW}"/><rect x="${X}" y="${base - y(x.w) - y(x.l)}" width="${w}" height="${y(x.l)}" fill="${HL}"/>`;
      if (x.w > 2) c1 += `<text x="${X + w / 2}" y="${base - y(x.w) / 2 + 4}" text-anchor="middle" font-size="10.5" fill="#fff" font-weight="700">${x.w}</text>`;
      if (x.l > 2) c1 += `<text x="${X + w / 2}" y="${base - y(x.w) - y(x.l) / 2 + 4}" text-anchor="middle" font-size="10.5" fill="#3d424c" font-weight="700">${x.l}</text>`;
      c1 += `<text x="${X + w / 2}" y="${base - y(x.w) - y(x.l) - 4}" text-anchor="middle" font-size="11" font-weight="700">${x.w + x.l}</text>`;
      if (sel) c1 += `<rect x="${X - 3}" y="${base - y(x.w) - y(x.l) - 18}" width="${w + 6}" height="${y(x.w) + y(x.l) + 18}" fill="none" stroke="#e8740f" stroke-width="2" rx="3"/>`;
      const L = RS(x.r).replace('ตะวันออกเฉียงเหนือ', 'อีสาน'), two = L.startsWith('ตะวัน'), cl = sel ? '#a94f05' : '#3d424c', fw = sel ? 700 : 400;
      c1 += `<text x="${X + w / 2}" y="${CH - 15}" text-anchor="middle" font-size="${fs}" fill="${cl}" font-weight="${fw}">${two ? 'ตะวัน' : L}</text>` + (two ? `<text x="${X + w / 2}" y="${CH - 3}" text-anchor="middle" font-size="${fs}" fill="${cl}" font-weight="${fw}">${L.slice(5)}</text>` : '') + '</g>'; });
    return c1 + `<line x1="0" x2="${CW}" y1="${CH - 28}" y2="${CH - 28}" stroke="#16181d" opacity=".4"/></svg>`; };
  /* กราฟแยกตามพรรค: แท่งเทา = ทั้งหมด, สีเขียวอยู่ข้างในเสมอ (clipPath) */
  const mk2 = PW => { const rh = 22, PH = ORDER.length * rh + 6, pm = d3.max(PP, x => x[1].w + x[1].l) || 1, LX = PW < 280 ? 84 : 102, px = v => v / pm * (PW - LX - 56), bh = rh - 8;
    let c2 = `<svg width="${PW}" height="${PH}" class="hsv">`;
    PP.forEach(([p, v], i) => { const Y = 3 + i * rh, sel = ST.h.party === p, t = v.w + v.l, tw = Math.max(px(t), 4), gw = v.w ? Math.max(px(v.w), 3) : 0, cid = 'hpc' + i;
      c2 += `<g data-hp="${p}" style="cursor:pointer"><rect x="0" y="${Y}" width="${PW}" height="${rh - 1}" fill="transparent"/><text x="${LX - 6}" y="${Y + 14}" text-anchor="end" font-size="${LX < 100 ? 10.5 : 11.5}" font-weight="${sel || p === PPN ? 700 : 400}" fill="${sel ? '#a94f05' : '#16181d'}">${p}</text>`;
      c2 += `<clipPath id="${cid}"><rect x="${LX}" y="${Y + 4}" width="${tw}" height="${bh}" rx="3"/></clipPath><g clip-path="url(#${cid})"><rect x="${LX}" y="${Y + 4}" width="${tw}" height="${bh}" fill="${HL}"/><rect x="${LX}" y="${Y + 4}" width="${gw}" height="${bh}" fill="${HW}"/></g>`;
      if (gw >= 26) c2 += `<text x="${LX + gw - 5}" y="${Y + 14.5}" text-anchor="end" font-size="10" fill="#fff" font-weight="700">${v.w}</text>`;
      c2 += `<text x="${LX + tw + 6}" y="${Y + 14.5}" font-size="10.5" class="num"><tspan fill="${HW}" font-weight="700">${v.w}</tspan><tspan fill="#5d6370"> / ${t}</tspan></text>`;
      if (sel) c2 += `<rect x="1" y="${Y}" width="${PW - 2}" height="${rh - 1}" fill="none" stroke="#e8740f" stroke-width="2" rx="4"/>`; c2 += '</g>'; });
    return c2 + '</svg>'; };
  h += `<div class="two2c"><div class="cc2"><div class="ct">แยกตามภาค</div><div class="hsvw" id="hc1"></div></div><div class="cc2"><div class="ct">แยกตามพรรคของบ้านใหญ่</div><div class="hsvw" id="hc2"></div><div class="lgd"><span><i style="background:${HW}"></i>ได้รับเลือกตั้ง</span><span><i style="background:${HL}"></i>ไม่ได้รับเลือกตั้ง</span></div></div></div>`;
  const cnt = {}; B.filter(okR).forEach(d => bfP(d).forEach(p => { if (p !== PPN) cnt[p] = (cnt[p] || 0) + 1; }));
  /* รายชื่อพรรคคงที่ทั้งประเทศ → ความสูงกล่องไม่หดเมื่อกรองภาค จึงไม่เด้งขึ้นบน */
  const cntAll = {}; B.forEach(d => bfP(d).forEach(p => { if (p !== PPN) cntAll[p] = (cntAll[p] || 0) + 1; }));
  const X = Object.keys(cntAll).sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0) || cntAll[b] - cntAll[a]);
  const rows = X.map(x => { const SS = B.filter(d => okR(d) && bfP(d).includes(x)), N = SS.length, pp = SS.filter(d => d.w[1] === PPN).length, p = N ? pp / N * 100 : 0, few = N < 15;
    if (!N) return `<div class="vr"><span class="vn">${x}</span><span class="vp" style="color:#c3c7ce">–</span><span class="vb" style="background:#f1f2f5"></span><span class="vc">0/0</span></div>`;
    return `<div class="vr ${ST.h.party === x ? 'sel' : ''}"><span class="vn">${x}</span><span class="vp" style="color:${pp ? '#a94f05' : '#9aa0ab'}">${p.toFixed(0)}%</span><span class="vb"><i style="width:${p}%;background:${col(PPN)}"></i><i style="width:${100 - p}%;background:${col(x)}"></i></span><span class="vc">${pp}/${N}</span></div>`; }).join('');
  h += `<div class="vs"><div class="ct">เมื่อเจอบ้านใหญ่ของแต่ละพรรค พรรคประชาชนชนะเขตได้กี่ %</div><div class="vl">${rows || '<span class="muted">ไม่มีข้อมูล</span>'}</div></div>`;
  rk.innerHTML = h;
  /* วัดความกว้างจริงของกล่องหลังวาง แล้วค่อยวาดกราฟ → ไม่ล้นกรอบทุกขนาดจอ */
  const w1 = document.getElementById('hc1'), w2 = document.getElementById('hc2');
  w1.innerHTML = mk1(Math.max(160, w1.clientWidth)); w2.innerHTML = mk2(Math.max(180, w2.clientWidth));
}

/* ---------- โหลดข้อมูล ---------- */
const DATA_FILES = ['districts', 'layout', 'national', 'logos', 'logos66', 'parties'];
let DATA = {};
document.addEventListener('DOMContentLoaded', () => {
  Promise.all(DATA_FILES.map(n => fetch('data/' + n + '.json').then(r => { if (!r.ok) throw new Error('data/' + n + '.json'); return r.json(); })))
    .then(arr => { DATA_FILES.forEach((n, i) => DATA[n] = arr[i]); init(); })
    .catch(err => { document.body.insertAdjacentHTML('afterbegin', '<div style="padding:16px;background:#fde8e8;color:#8a1c1c;font:14px sans-serif">โหลดข้อมูลไม่ได้: ' + err.message + ' — ต้องเปิดผ่านเว็บเซิร์ฟเวอร์ (ดู README)</div>'); console.error(err); });
});
