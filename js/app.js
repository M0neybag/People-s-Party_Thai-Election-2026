/* พรรคประชาชน */
'use strict';
const PPN = 'ประชาชน';
const MAIN5 = ['ภูมิใจไทย','ประชาชน','เพื่อไทย','กล้าธรรม','ประชาธิปัตย์'];
const OTHER = '#5E6573', NODATA = '#D3D3D3';
const REGIONS = ['กรุงเทพมหานคร','ภาคกลาง','ภาคเหนือ','ภาคตะวันออกเฉียงเหนือ','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];
const RO = ['กรุงเทพมหานคร','ภาคกลาง','ภาคตะวันตก','ภาคตะวันออกเฉียงเหนือ','ภาคตะวันออก','ภาคใต้','ภาคเหนือ'];
const MODES = [['win','สส.เขต'],['list','บัญชีรายชื่อ'],['both','สส.เขต + บัญชีรายชื่อ'],['tier','วางแผนพรรค'],['house','ข้อมูลบ้านใหญ่']];
const GB = [['#a65923','ชนะ มากกว่า 15%'],['#e18f43','ชนะ 5–15%'],['#feb96b','ชนะ ไม่เกิน 5%'],['#b2d0ce','แพ้ ไม่เกิน 5%'],['#80b9b3','แพ้ 5–15%'],['#5a8a86','แพ้ 15–30%'],['#3e6763','แพ้ มากกว่า 30%']];
const TT = {flip:['พลิกได้','#FFA500'],hold:['รักษาฐานเสียง','#D2691E'],cand:['ดันผู้สมัคร','#EEDD82'],safe:['ฐานเสียง','#8B4513'],far:['ปรับแผนใหม่','#BEBEBE'],none:['ไม่ส่งผู้สมัคร','#e3e5ea']};
const TK = ['safe','hold','flip','cand','far'];
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

/* เกณฑ์ระดับโอกาส (ตารางทีม 28 ต.ค.), ปรับได้จาก popup ของกราฟวางแผนพรรค
   lo = ขอบล่างของ "พลิกได้" (ฝั่งแพ้), hi = ขอบของ "ฐานเสียง" (ฝั่งชนะ), far = แพ้เกินนี้ = ปรับแผนใหม่, ly = เส้นบัญชีรายชื่อ */
const TIER_T0 = {lo:-5, hi:5, far:-30, ly:0};
let TIER_T = {...TIER_T0};
const tierOf = (d, T = TIER_T) => !d.has ? 'none' : d.gap > 0 ? (d.gap > T.hi && d.lgap > T.ly ? 'safe' : 'hold') : (d.gap >= T.lo ? 'flip' : d.gap <= T.far ? 'far' : d.lgap > T.ly ? 'cand' : 'far');
let tierBtns = () => '';   /* ปุ่มขยาย/กลับเกณฑ์ บนหัวกราฟวางแผนพรรค (กำหนดในบล็อก popup) */
const tierCustom = () => Object.keys(TIER_T0).some(k => TIER_T[k] !== TIER_T0[k]);
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
    d.tier = tierOf(d);
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
  $('#modes').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b || b.dataset.m === ST.mode) return; closePanel(); ST.mode = b.dataset.m;   /* เปลี่ยนโหมด → ปิดกล่องรายละเอียดเขต */ ST.lg = null; ST.h = {party:null, res:'all'}; ST.brush = null; ST.win = {}; render(); });
  $('#region').addEventListener('change', e => { ST.reg = e.target.value; ST.win = {}; ST.brush = null; render(); fitView(true); });
  $('#filters').addEventListener('click', e => { const r = e.target.closest('[data-res]'); if (r) { ST.h.res = r.dataset.res; render(); return; } const b = e.target.closest('[data-f]'); if (!b) return; ST.fil = b.dataset.f || null; ST.win = {}; render(); });
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
  $('#rk').addEventListener('mouseleave', () => setHover(null));  $('#panel').addEventListener('click', e => {
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
  const sub = D.filter(d => okR(d) && okBig(d) && okL(d) && inB(d)), ck = closeKind();   /* ตัวเลขชิปนับตาม legend ที่เลือก + กรอบที่ลากใน scatter ด้วย */
  const cl = ck === 'both' ? `<span class="n">${sub.filter(closeW).length} / ${sub.filter(closeL).length}</span>` : `<span class="n">${sub.filter(ck === 'list' ? closeL : closeW).length}</span>`;
  const lab = {win:'สส.เขต', list:'บัญชีรายชื่อ', both:'เขต - บัญชีฯ'}[ck];
  $('#filters').innerHTML = `<button class="chip ${!ST.fil ? 'on' : ''}" data-f="">ทั้งหมด <span class="n">${sub.length}</span></button>`
    + `<button class="chip ${ST.fil === 'close' ? 'on' : ''}" data-f="close">สูสี ±5% <span class="ck">${lab}</span> ${cl}</button>`
    + `<button class="chip ${ST.fil === 'split' ? 'on' : ''}" data-f="split">เขต-พรรค สวนทาง <span class="n">${sub.filter(d => d.split).length}</span></button>`;
  const dis = !(ST.mode === 'win' || ST.mode === 'list'), y = $('#y66');
  $('#cb66').disabled = dis; y.classList.toggle('dis', dis); y.classList.toggle('on', ST.y66 && !dis);
  $('#y66s').textContent = dis ? '' : '';
  const bdis = !bigOK(), b = $('#bigf');
  $('#cbbig').disabled = bdis; b.classList.toggle('dis', bdis); b.classList.toggle('on', ST.big && !bdis);
  $('#bign').textContent = sub.filter(d => d.w[4]).length;
  b.title = bdis ? 'ใช้ไม่ได้ในโหมดบัญชีรายชื่อ (ไม่มีตัวผู้สมัคร)' : 'แสดงเฉพาะเขตที่ผู้ชนะ สส.เขต เป็นบ้านใหญ่';
  const H = ST.mode === 'house';
  $('#filters').style.visibility = ''; b.style.display = H ? 'none' : ''; $('#rescon').hidden = true;
  if (H) { const S = D.filter(d => isB(d) && okR(d) && hP(d)), nw = S.filter(hWon).length;
    $('#filters').innerHTML = `<span class="flab"><svg viewBox="0 0 16 16" width="13" height="13"><path d="M8 1.5 1 7.5h2v7h4v-4h2v4h4v-7h2z" fill="#16181d"/></svg>ผลของบ้านใหญ่</span>`
      + [['all','ทั้งหมด',S.length],['win','ชนะ',nw],['lose','แพ้',S.length - nw]].map(([k, t, n]) => `<button class="chip ${ST.h.res === k ? 'on' : ''}" data-res="${k}">${t} <span class="n">${n}</span></button>`).join(''); }
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
  const base = (d, h) => okF(d, h) && okR(d) && okBig(d) && inB(d);   /* ตัวเลข legend นับตามชิป (สูสี / สวนทาง) ภาค บ้านใหญ่ และกรอบที่ลาก */
  if (M === 'tier') items = TK.map(k => ({k, sw:`<span class="sw" style="background:${TT[k][1]}"></span>`, t:TT[k][0], n:D.filter(d => d.tier === k && base(d)).length}));
  else if (GV()) items = GB.map((g, i) => ({k:String(i), sw:`<span class="sw" style="background:${g[0]}"></span>`, t:g[1], n:D.filter(d => gbin(gapV(d)) === i && base(d)).length}));
  else items = [...MAIN5, 'อื่นๆ'].map(p => ({k:p, sw:p === 'อื่นๆ' ? multi : `<span class="sw" style="background:${col(p)}"></span>`, t:p === 'อื่นๆ' ? 'พรรคอื่น' : p,
    n:M === 'both' ? D.filter(d => base(d, 'w') && pk(d.w[1]) === p).length + ' / ' + D.filter(d => base(d, 'l') && pk(d.pltop) === p).length   /* สส.เขต, บัญชีรายชื่อ */
      : D.filter(d => base(d) && (M === 'list' ? pk(d.pltop) : pk(d.w[1])) === p).length}));
  const all = {k:'', sw:'<span class="sw allsw"></span>', t:'ทั้งหมด', n:D.filter(d => base(d)).length};
  const title = y ? (M === 'list' ? 'บัญชีรายชื่ออันดับ 1 69 เทียบ 66' : 'ผู้ชนะ สส.เขต 69 เทียบ 66')
    : {tier:'ระดับโอกาส (เกณฑ์ปี 69)', win:'พรรคที่ชนะ สส.เขต', list:'พรรคที่ได้บัญชีรายชื่อสูงสุดในเขต', both:'สส.เขต + บัญชีรายชื่อ', gap:'ระยะห่างของพรรคประชาชน: ' + (M === 'list' ? 'บัญชีรายชื่อ' : 'สส.เขต')}[GV() ? 'gap' : M];
  $('#legend').style.display = M === 'house' ? 'none' : '';   /* โหมดบ้านใหญ่ไม่แสดง legend (ซ้ำกับกราฟแยกตามพรรคด้านขวา) */
  if (M === 'house') return;
  const gk = (M === 'win' || M === 'list') && !y ? `<div class="gk"><button data-gk="party" class="${ST.cb === 'party' ? 'on' : ''}">สีตามพรรค</button><button data-gk="gap" class="${ST.cb === 'gap' ? 'on' : ''}">สีตามระยะห่าง</button></div>` : '';
  const glyph = M === 'both' ? tileGlyph('both') + '<div class="lnote">ตัวเลข = ชนะ สส.เขต / บัญชีรายชื่ออันดับ 1</div>' : y ? tileGlyph('66') + '<div class="lnote">มุมเทา = ไม่มีเขตนี้ในปี 66</div>' : '';
  $('#legend').innerHTML = `<div class="t">${title}</div>${gk}${glyph}` + [all, ...items].map(it => {
    const on = (ST.lg || '') === it.k, dim = ST.lg && !on && it.k !== '';
    return `<button class="lg ${on ? 'on' : ''} ${dim ? 'dim' : ''}" data-k="${it.k}">${it.sw}<span>${it.t}</span><span class="n">${it.n}</span></button>`;
  }).join('');
}

/* ---------- map ---------- */
function setupMap() {
  svg = d3.select('#map'); gRoot = svg.append('g'); gTiles = gRoot.append('g');
  const gLab = gRoot.append('g').attr('pointer-events', 'none'); gHi = gRoot.append('g').attr('pointer-events', 'none');
  Object.values(L.prov).forEach(o => gLab.append('text').attr('x', o.lx).attr('y', o.ly).attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('font-size', .62).attr('font-weight', 700).attr('fill', '#16181d').text(o.name.replace('กรุงเทพมหานคร', 'กรุงเทพฯ')));
  zoom = d3.zoom().scaleExtent([2, 200]).constrain(constrainMap).clickDistance(6).tapDistance(10).on('zoom', e => { gRoot.attr('transform', e.transform); hideTip(); });
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
      const two = String(t.d).length > 1;   /* วางชิดขอบบนของสามเหลี่ยมบนซ้าย (ตรงที่กว้างสุด), เลข 2 หลักตัวเล็กลง, ขอบตัวเลขสีเดียวกับพื้น กันเส้นแบ่งทับ */
      num(t.x + (two ? .54 : .52), t.y + (two ? .23 : .26), '#fff', 'middle', Math.max(ow, .35)).attr('font-size', two ? .3 : .38).attr('stroke', col(d.w[1])).attr('stroke-width', .06).attr('paint-order', 'stroke');
    } else {
      const op = lit(d) ? 1 : DIM;
      g.attr('opacity', op);
      if (y66) {
        const w69 = M === 'list' ? d.pltop : d.w[1], w66 = M === 'list' ? (d.p66 ? d.p66[0][0] : null) : (d.c66 ? d.c66[0][1] : null);
        const T = .8, p1 = [BR[0] + (BL[0] - BR[0]) * T, BR[1]], p2 = [BR[0] + (TR[0] - BR[0]) * T, BR[1] + (TR[1] - BR[1]) * T];
        g.append('polygon').attr('points', shrink([BL, BR, TR, TL], cx, cy, f)).attr('fill', col(w69));
        g.append('polygon').attr('points', shrink([BR, p1, p2], cx, cy, f)).attr('fill', w66 ? col(w66) : NODATA).attr('stroke', '#fff').attr('stroke-width', .05);
        const two = String(t.d).length > 1;   /* เลข 2 หลักตัวเล็กลงและชิดซ้าย ไม่ทับสามเหลี่ยมปี 66, ขอบตัวเลขสีเดียวกับพื้น */
        num(t.x + L.S + (two ? .05 : .1), t.y + .29, '#fff', 'start', 1).attr('font-size', two ? .34 : .42).attr('stroke', w69 ? col(w69) : NODATA).attr('stroke-width', .06).attr('paint-order', 'stroke');
      } else {
        const fill = M === 'tier' ? TT[d.tier][1] : GV() ? gcolv(gapV(d)) : M === 'win' ? col(d.w[1]) : M === 'list' ? col(d.pltop) : gcolv(gapV(d));
        g.append('polygon').attr('points', shrink([BL, BR, TR, TL], cx, cy, f)).attr('fill', fill);
        num(cx, cy + .03, M === 'tier' ? ink(fill) : '#fff', 'middle', 1);
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
    $('#k1s').textContent = r === 0 ? `อันดับ 1 ตามด้วย${cs[1][0]} (${cs[1][1]})` : `อันดับ ${r + 1} รองจาก${cs[0][0]} (${cs[0][1]})`;
    const lv = Object.entries(n69.lv).sort((a, b) => b[1] - a[1]), lr = lv.findIndex(x => x[0] === PPN), v = n69.lv[PPN];
    $('#k2l').textContent = 'พรรคประชาชน สส.บัญชีรายชื่อ'; $('#k2v').innerHTML = `${n69.ls[PPN] || 0}<small> / 100 ที่นั่ง</small>`;
    $('#k2s').textContent = `คะแนน ${(v / 1e6).toFixed(2)} ล้าน อันดับ ${lr + 1} (${(v / n69.lt * 100).toFixed(1)}%)`;
  } else {
    const sub = D.filter(okR), won = sub.filter(d => d.ppr === 1).length;
    const cnt = d3.rollups(sub, v => v.length, d => d.w[1]).sort((a, b) => b[1] - a[1]), r = cnt.findIndex(x => x[0] === PPN);
    $('#k1l').textContent = 'พรรคประชาชนชนะ สส.เขต ' + ST.reg; $('#k1v').innerHTML = `${won}<small> / ${sub.length} เขต</small>`;
    $('#k1s').textContent = r < 0 ? `ไม่ชนะในภาคนี้ ${cnt[0][0]} ชนะมากสุด (${cnt[0][1]})` : r === 0 ? 'อันดับ 1 ในภาคนี้' + (cnt[1] ? ` ตามด้วย${cnt[1][0]} (${cnt[1][1]})` : '') : `อันดับ ${r + 1} ในภาคนี้ รองจาก${cnt[0][0]} (${cnt[0][1]})`;
    const pv = d3.sum(sub, d => (d.pl.find(x => x[0] === PPN) || [0, 0])[1]), tot = d3.sum(sub, d => d.plt), lead = sub.filter(d => d.lrank === 1).length;
    $('#k2l').textContent = 'พรรคประชาชน บัญชีรายชื่อ ' + ST.reg; $('#k2v').innerHTML = `${lead}<small> / ${sub.length} เขตที่ชนะ</small>`;
    $('#k2s').textContent = `คะแนน ${(pv / 1e6).toFixed(2)} ล้าน (${(pv / tot * 100).toFixed(1)}%) ทั้งประเทศ ${n69.ls[PPN] || 0} ที่นั่ง`;
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
      <div class="half" id="h1"><h4>สส.เขต: ห่างผู้ชนะ / อันดับ 2 (% บัตรดี)</h4>${chartShell()}</div>
      <div class="half" id="h2"><h4>บัญชีรายชื่อ: ห่างพรรคที่ชนะ / อันดับ 2 (% คะแนนบัญชีรายชื่อ)</h4>${chartShell()}</div>`;
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
  ORD.forEach((d, i) => { const v = val(d) ?? 0; s += `<rect data-ob="${key(d)}" x="${x0 + i * bw + bw * .075}" width="${Math.max(.7, bw * .85)}" y="${yy(Math.max(0, v))}" height="${Math.max(.8, Math.abs(yy(v) - yy(0)))}" fill="${gcolv(val(d))}" opacity="${on(d) ? 1 : .2}"/>`; });
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
    host.querySelector('.cnt').textContent = `${rows.length} เขต อันดับ ${i0 + 1}–${i1} จาก ${N}`;
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
  /* มือถือ / ไอแพด: ปัดนิ้วจนสุดรายการ → กรอบข้างบนเลื่อนต่อ (ปัดประมาณ 1 แถว = เลื่อน 1 เขต), กรอบสุดกราฟแล้ว → ปล่อยให้หน้าเว็บเลื่อนตามปกติ
     ฟังที่แถวที่นิ้วแตะ (ไม่ใช่ที่ listEl) เพราะ list() วาดแถวใหม่ระหว่างปัด แถวเดิมหลุดออกจากหน้า แต่นิ้วยังส่งสัญญาณไปที่แถวเดิม */
  listEl.ontouchstart = e => {
    const tg = e.target; let tY = e.touches[0].clientY, tAcc = 0;
    const mv = ev => {
      const y = ev.touches[0].clientY, dy = tY - y; tY = y;   /* dy > 0 = นิ้วปัดขึ้น = ดูเขตถัดไป */
      const atEnd = listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 1, atTop = listEl.scrollTop <= 0;
      if (!((dy > 0 && atEnd && i1 < N) || (dy < 0 && atTop && i0 > 0))) { tAcc = 0; return; }
      if (ev.cancelable) ev.preventDefault(); tAcc += dy;
      const m = Math.trunc(tAcc / ROWH); if (!m) return; tAcc -= m * ROWH;
      const k = m > 0 ? Math.min(m, N - i1) : -Math.min(-m, i0); i0 += k; i1 += k;
      bg.call(br.move, [X(i0), X(i1)]); list(); listEl.scrollTop = k > 0 ? listEl.scrollHeight : 0; syncVw();
    };
    const up = () => { tg.removeEventListener('touchmove', mv); tg.removeEventListener('touchend', up); tg.removeEventListener('touchcancel', up); };
    tg.addEventListener('touchmove', mv, {passive:false}); tg.addEventListener('touchend', up); tg.addEventListener('touchcancel', up);
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
  rk.innerHTML = `<div class="hd"><h3 style="margin:0">ระดับโอกาสของพรรคประชาชน<span class="ast" tabindex="0" data-tip="วิเคราะห์ผลการเลือกตั้งปี 2569 รายเขต เพื่อจัดกลุ่มพื้นที่และกำหนดแนวทางลงพื้นที่หาเสียงครั้งหน้า">*</span></h3><span class="desc">จุดละ 1 เขต ลากกรอบเพื่อเลือกกลุ่มเขต คลิกนอกกรอบเพื่อล้าง</span>${tierBtns()}</div><div class="scw"><svg class="sc"></svg></div><div class="tl"></div>`;
  /* กราฟ:ตาราง = ครึ่ง:ครึ่ง (CSS grid) → วัดความสูงช่องกราฟจริงแล้ววาด */
  const scw = rk.querySelector('.scw'), W = rk.clientWidth - 24, SH = Math.max(200, Math.min(760, scw.clientHeight)), m = {l:46, r:10, t:14, b:30};   /* กราฟสูงได้ถึง 760px ใช้พื้นที่ว่างให้เต็ม (ขอบบนเหลือแค่พอใส่คำว่า พลิกได้) */
  /* ช่องกราฟเปลี่ยนขนาด (ฟอนต์โหลดเสร็จ / หมุนจอ / ย่อหน้าต่าง) → วาดใหม่ให้พอดีช่อง ไม่ให้แกนล่างโดนตัด */
  const h0 = scw.clientHeight, ro = new ResizeObserver(() => { if (!scw.isConnected) { ro.disconnect(); return; } if (Math.abs(scw.clientHeight - h0) > 3) { ro.disconnect(); renderTier(rk); } }); ro.observe(scw);
  const xs = d3.scaleLinear([-72, 46], [m.l, W - m.r]), ys = d3.scaleLinear([-60, 45], [SH - m.b, m.t]);
  const T = TIER_T, Z = [[-72,T.far,-60,45,'far'],[T.far,T.lo,T.ly,45,'cand'],[T.far,T.lo,-60,T.ly,'far'],[T.lo,0,-60,45,'flip'],[0,T.hi,-60,45,'hold'],[T.hi,46,-60,T.ly,'hold'],[T.hi,46,T.ly,45,'safe']];   /* โซนตามเกณฑ์ปัจจุบัน */
  let sv = Z.map(([a, b, c, e, t]) => `<rect x="${xs(a)}" y="${ys(e)}" width="${xs(b) - xs(a)}" height="${ys(c) - ys(e)}" fill="${TT[t][1]}" opacity=".13"/>`).join('');
  [[(-72 + T.far) / 2,38,'far'],[(T.far + T.lo) / 2,38,'cand'],[(T.hi + 46) / 2,38,'safe'],[(T.hi + 46) / 2,-50,'hold']].forEach(([a, b, k]) => sv += `<text x="${xs(a)}" y="${ys(b)}" text-anchor="middle" font-size="12" font-weight="700" fill="${d3.color(TT[k][1]).darker({far:1.4, hold:1.4, safe:.4, cand:2.2}[k])}">${TT[k][0]}</text>`);
  sv += `<text x="${xs(T.lo / 2)}" y="${m.t - 3}" text-anchor="middle" font-size="11" font-weight="700" fill="${d3.color(TT.flip[1]).darker(1.1)}">พลิกได้</text>`;
  [-60,-40,-20,0,20,40].forEach(v => sv += `<text x="${m.l - 6}" y="${ys(v) + 3}" font-size="9.5" text-anchor="end" fill="#5d6370" font-family="IBM Plex Sans Thai,sans-serif">${v > 0 ? '+' : ''}${v}%</text>`);
  [T.far,T.lo,0,T.hi].forEach(v => sv += `<line x1="${xs(v)}" x2="${xs(v)}" y1="${m.t}" y2="${SH - m.b}" stroke="#16181d" stroke-width="${v ? 1 : 1.6}" ${v ? 'stroke-dasharray="4 3"' : ''} opacity=".7"/><text x="${xs(v)}" y="${SH - m.b + 13}" font-size="10" text-anchor="middle" font-family="IBM Plex Sans Thai,sans-serif">${v > 0 ? '+' : ''}${v}%</text>`);
  sv += `<line x1="${m.l}" x2="${W - m.r}" y1="${ys(T.ly)}" y2="${ys(T.ly)}" stroke="#16181d" stroke-width="1.6" opacity=".7"/>`;
  sv += `<text x="${(m.l + W) / 2}" y="${SH - 3}" font-size="11" text-anchor="middle" fill="#5d6370">← แพ้   ผลการแข่งขัน สส.เขต ของพรรคประชาชน (% บัตรดี)   ชนะ →</text>`;
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
  rk.querySelector('.tl').innerHTML = `<div class="th"><span>จังหวัด เขต</span><span>ระดับโอกาส</span><span style="text-align:right">สส.เขต</span><span style="text-align:right">บัญชีรายชื่อ</span></div>`
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
  const sub = (y, p) => L_ ? `${(N[y].lv[p] / 1e6).toFixed(2)} ล้านคะแนน (${(N[y].lv[p] / N[y].lt * 100).toFixed(1)}%)` : '';
  const card = (i, p, v, y) => {
    const rc = y === 69 ? (rank66.indexOf(p) < 0 ? null : rank66.indexOf(p) - i) : null;
    const bd = y === 69 ? (rc == null ? '<span class="bd new">ใหม่</span>' : rc > 0 ? `<span class="bd up">▲${rc}</span>` : rc < 0 ? `<span class="bd dn">▼${-rc}</span>` : '') : '';
    return `<div class="pc ${y === 69 ? 'r' : 'l'} sm" data-p="${p}"><div class="rkb" style="background:${col(p)}">${i + 1}</div><div class="lg2">${y === 66 ? LGO66(p, 28) : LGO(p, 28)}</div><div class="pn"><b>${y === 66 ? nm66(p) : p}</b><span>${sub(y, p)} ${bd}</span></div><div class="pv">${v}</div></div>`;
  };
  let rows = ''; for (let i = 0; i < 10; i++) rows += (r66[i] ? card(i, r66[i][0], r66[i][1], 66) : '<div class="pc empty"></div>') + '<div class="arr">»</div>' + (r69[i] ? card(i, r69[i][0], r69[i][1], 69) : '<div class="pc empty"></div>');
  rk.innerHTML = `<div class="hd"><h3>${L_ ? 'ที่นั่ง สส.บัญชีรายชื่อ' : 'ที่นั่ง สส.เขต'}${ST.reg ? ' ' + (L_ ? 'ทั้งประเทศ' : ST.reg) : ''} 10 อันดับแรก</h3></div>
    <div class="cmph"><span>ปี 66</span><span>»</span><span>ปี 69</span></div><div class="cmpw"><div class="cmp">${rows}</div></div>`;
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
  return `<div class="tip" style="width:260px"><div class="h"><b style="font-size:12.5px">${r.lab}: ${name}</b></div><div class="bd2"><div class="kv"><span>จำนวน</span><b class="mono">${fmt(v)} ใบ</b></div><div class="kv"><span>สัดส่วนของผู้มาใช้สิทธิ์</span><b class="mono">${(v / r.to * 100).toFixed(2)}%</b></div><div class="kv muted"><span>${o.lab}</span><span class="mono">${fmt(ov)} ใบ (${(ov / o.to * 100).toFixed(2)}%)</span></div><div class="kv muted"><span>ค่าเฉลี่ยทั้งประเทศ</span><span class="mono">${kk === 'g' ? '–' : NATB[k][kk].toFixed(2) + '%'}</span></div></div></div>`;
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
    return `<tr class="${pp ? 'pp' : ''}"><td class="no">${r.no}</td><td class="nm"><b>${r.name}</b>${r.h ? HOUSE : ''}${t === 'c' && !compact ? ` <span>(${r.party})</span>` : ''}</td><td class="nr">${fmt(r.v)}</td><td class="nr">${(r.v / tot * 100).toFixed(1)}%</td></tr>`
      + `<tr class="brow ${pp ? 'pp' : ''}"><td></td><td colspan="3"><i style="width:${Math.max(.6, r.v / mx * 100)}%;background:${col(r.party)}"></i>${pp && gap > 0 ? `<div class="note">แพ้จาก${t === 'c' ? 'ผู้ชนะ' : 'พรรคที่ชนะ'} ${fmt(gap)} คะแนน (${(gap / tot * 100).toFixed(1)}%)</div>` : ''}</td></tr>`; }).join('');
  const more = rows.length > 5 ? `<button class="more" data-more="${t}">${exp ? 'ย่อรายชื่อ ▴' : `ดูเพิ่มเติมอีก ${rows.length - 5} ${t === 'c' ? 'คน' : 'พรรค'} ▾`}</button>` : '';
  return `<table class="ptab ${compact ? 'cp' : ''}">${head}${body}</table>${more}`;
}
const panelHead = d => `<div class="ph"><div class="t1"><span class="eb">${d.reg} / ${d.pv}</span><button class="x" data-close title="ปิด">✕</button></div><div class="tt">${d.pv} เขต ${d.d}</div></div>`;
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
    return `<div class="cc ${y === 69 ? 'r' : 'l'}" data-p="${c[1]}"><div class="rkb" style="background:${col(c[1])}">${i + 1}</div><div class="lg2">${y === 66 ? LGO66(c[1], 30) : LGO(c[1], 30)}</div><div class="pn"><b>${L_ ? pn : c[0]}${c[4] ? HOUSE : ''}</b><span>${L_ ? 'บัญชีรายชื่อ' : pn} ${bd}</span></div><div class="pv" style="font-size:16px">${fmt(c[2])}<small>${(c[2] / (y === 69 ? tb : ta) * 100).toFixed(1)}%</small></div></div>`; };
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
    <div style="display:grid;gap:5px"><span class="st">${L2 ? 'บัตรบัญชีรายชื่อ: ' : ''}ผู้มาใช้สิทธิ์ ${fmt(tot)} จาก ${fmt(d.el)} คน (${(tot / d.el * 100).toFixed(1)}%)</span>${ballots(d, [L2 ? 'l' : 'c'])}</div></div>`;
}



/* ---------- โหมดข้อมูลบ้านใหญ่ ---------- */
const HW = '#5a8a86', HL = '#d9dce2';
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
  /* จำนวนเขตที่บ้านใหญ่ของแต่ละพรรคลงสมัคร (ทั้งประเทศ, ไม่เปลี่ยนตาม link & brush), คลิกเพื่อกรองพรรค (ค่าเดียวกับกราฟแยกตามพรรค) */
  const cnt = d3.rollups(D.filter(isB).flatMap(d => bfP(d)), v => v.length, p => p).sort((a, b) => b[1] - a[1]), sp = ST.h.party;
  $('#legend').innerHTML = `<div class="t">บ้านใหญ่ลงสมัคร (เขต)</div>`
    + `<button class="lg ${!sp ? 'on' : ''}" data-hp=""><span class="sw allsw"></span><span>ทั้งหมด</span><span class="n">${D.filter(isB).length}</span></button>`
    + cnt.map(([p, n]) => `<button class="lg ${sp === p ? 'on' : ''} ${sp && sp !== p ? 'dim' : ''}" data-hp="${p}"><span class="sw" style="background:${col(p)}"></span><span style="${p === PPN ? 'font-weight:700' : ''}">${p}</span><span class="n">${n}</span></button>`).join('');
}
/* พรรคประชาชนได้คะแนนมากกว่าผู้สมัครบ้านใหญ่ของพรรค x ในเขต d หรือไม่ (เทียบตัวต่อตัว ไม่สนว่าใครชนะเขต) */
const beatBF = (d, x) => { const pp = d.cand.find(c => c[1] === PPN); if (!pp) return false; return d.cand.filter(c => c[1] === x && c[4]).every(c => pp[2] > c[2]); };
function renderHouse(rk) {
  const HC = ST.h.party ? col(ST.h.party) : HW, HT = ink(HC);   /* เลือกพรรค → แถบ/แท่งใช้สีพรรคนั้น */
  const B = D.filter(isB), SEL = B.filter(d => okR(d) && hP(d)), nW = SEL.filter(hWon).length, nA = SEL.length, pw = nA ? nW / nA * 100 : 0;
  const chips = [ST.reg ? `<button class="fc" data-hx="reg">ภาค: ${RS(ST.reg)} ✕</button>` : '', ST.h.party ? `<button class="fc" data-hx="party">พรรค: ${ST.h.party} ✕</button>` : ''].join('');
  let h = `<div class="hhd"><h3>ข้อมูลบ้านใหญ่</h3><div class="fcs">${chips}</div></div>
  <div class="sum"><div class="st3">เขตที่มีตระกูลบ้านใหญ่${ST.h.party ? 'ของ' + ST.h.party : ''}ลงสมัคร สส.เขต${ST.reg ? '  ' + RS(ST.reg) : ''} รวม <b>${nA}</b> เขต</div>
  <div class="sbar">${nA ? `${nW ? `<div style="width:${pw}%;background:${HC}">${pw >= 8 ? `<b style="color:${HT}">${pw.toFixed(1)}%</b>` : ''}</div>` : ''}${nA - nW ? `<div style="width:${100 - pw}%;background:${HL}">${100 - pw >= 8 ? `<b style="color:#5d6370">${(100 - pw).toFixed(1)}%</b>` : ''}</div>` : ''}` : `<div style="width:100%;background:#f1f2f5;justify-content:center"><b style="color:#9aa0ab">ไม่มีบ้านใหญ่ของพรรคนี้ลงในภาคนี้</b></div>`}</div>
  <div class="slab"><span><i style="background:${HC}"></i>ชนะ <b>${nW}</b> เขต</span><span>แพ้ <b>${nA - nW}</b> เขต <i style="background:${HL}"></i></span></div></div>`;
  const R = RN.map(r => { const v = B.filter(d => d.reg === r && hP(d)); return {r, w:v.filter(hWon).length, l:v.filter(d => !hWon(d)).length}; });
  /* รายชื่อพรรคคงที่ (ลำดับตามจำนวนทั้งประเทศ) → ขนาดกล่องไม่เปลี่ยนเมื่อกรอง */
  const ORDER = d3.rollups(B.flatMap(d => bfP(d)), v => v.length, p => p).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const PP = ORDER.map(p => { const v = B.filter(d => okR(d) && bfP(d).includes(p)); return [p, {w:v.filter(d => d.w[1] === p && d.w[4]).length, l:v.filter(d => !(d.w[1] === p && d.w[4])).length}]; }).filter(x => x[1].w + x[1].l > 0);
  const CH = 10 * 22 + 6 + 20;
  /* กราฟแยกตามภาค: กว้างตามกล่องจริง */
  const mk1 = CW => { const mx = d3.max(R, x => x.w + x.l) || 1, bwd = (CW - 10) / R.length, y = v => v / mx * (CH - 52), fs = bwd < 34 ? 9.5 : 10.5;
    let c1 = `<svg width="${CW}" height="${CH}" class="hsv">`;
    R.forEach((x, i) => { const X = 5 + i * bwd + bwd * .14, w = bwd * .72, sel = ST.reg === x.r, dim = ST.reg && !sel, base = CH - 28;
      c1 += `<g data-hr="${x.r}" style="cursor:pointer"><rect x="${X - 4}" y="0" width="${w + 8}" height="${CH}" fill="transparent"/><rect x="${X}" y="${base - y(x.w)}" width="${w}" height="${y(x.w)}" fill="${HC}"/><rect x="${X}" y="${base - y(x.w) - y(x.l)}" width="${w}" height="${y(x.l)}" fill="${HL}"/>`;
      if (x.w > 2) c1 += `<text x="${X + w / 2}" y="${base - y(x.w) / 2 + 4}" text-anchor="middle" font-size="10.5" fill="${HT}" font-weight="700">${x.w}</text>`;
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
      c2 += `<clipPath id="${cid}"><rect x="${LX}" y="${Y + 4}" width="${tw}" height="${bh}" rx="3"/></clipPath><g clip-path="url(#${cid})"><rect x="${LX}" y="${Y + 4}" width="${tw}" height="${bh}" fill="${HL}"/><rect x="${LX}" y="${Y + 4}" width="${gw}" height="${bh}" fill="${sel ? HC : HW}"/></g>`;
      if (gw >= 26) c2 += `<text x="${LX + gw - 5}" y="${Y + 14.5}" text-anchor="end" font-size="10" fill="${sel ? HT : '#fff'}" font-weight="700">${v.w}</text>`;
      c2 += `<text x="${LX + tw + 6}" y="${Y + 14.5}" font-size="10.5" class="num"><tspan fill="${sel ? d3.color(HC).darker(.6) : HW}" font-weight="700">${v.w}</tspan><tspan fill="#5d6370"> / ${t}</tspan></text>`;
      if (sel) c2 += `<rect x="1" y="${Y}" width="${PW - 2}" height="${rh - 1}" fill="none" stroke="#e8740f" stroke-width="2" rx="4"/>`; c2 += '</g>'; });
    return c2 + '</svg>'; };
  h += `<div class="two2c"><div class="cc2"><div class="ct">แยกตามภาค</div><div class="hsvw" id="hc1"></div></div><div class="cc2"><div class="ct">แยกตามพรรคของบ้านใหญ่</div><div class="hsvw" id="hc2"></div><div class="lgd"><span><i style="background:${HW}"></i>ชนะ</span><span><i style="background:${HL}"></i>แพ้</span></div></div></div>`;
  const cnt = {}; B.filter(okR).forEach(d => bfP(d).forEach(p => { if (p !== PPN) cnt[p] = (cnt[p] || 0) + 1; }));
  /* รายชื่อพรรคคงที่ทั้งประเทศ → ความสูงกล่องไม่หดเมื่อกรองภาค จึงไม่เด้งขึ้นบน */
  const cntAll = {}; B.forEach(d => bfP(d).forEach(p => { if (p !== PPN) cntAll[p] = (cntAll[p] || 0) + 1; }));
  const X = Object.keys(cntAll).sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0) || cntAll[b] - cntAll[a]);
  const rows = X.map(x => { const SS = B.filter(d => okR(d) && d.has && bfP(d).includes(x)), N = SS.length, pp = SS.filter(d => beatBF(d, x)).length, p = N ? pp / N * 100 : 0, few = N < 15;
    if (!N) return `<div class="vr"><span class="vn">${x}</span><span class="vp" style="color:#c3c7ce">–</span><span class="vb" style="background:#f1f2f5"></span><span class="vc">0/0</span></div>`;
    return `<div class="vr ${ST.h.party === x ? 'sel' : ''}"><span class="vn">${x}</span><span class="vp" style="color:${pp ? '#a94f05' : '#9aa0ab'}">${p.toFixed(0)}%</span><span class="vb"><i style="width:${p}%;background:${col(PPN)}"></i><i style="width:${100 - p}%;background:${ST.h.party === x ? col(x) : HL}"></i></span><span class="vc">${pp}/${N}</span></div>`; }).join('');
  h += `<div class="vs"><div class="ct">% ที่พรรคประชาชนมีคะแนนนำเมื่อเจอบ้านใหญ่ของแต่ละพรรค</div><div class="vl">${rows || '<span class="muted">ไม่มีข้อมูล</span>'}</div></div>`;
  rk.innerHTML = h;
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

/* ===== animation ตอนเปลี่ยนโหมดและตอนกดตัวกรอง =====
   ครอบฟังก์ชัน render() กับ renderHeader() ด้านบน เพิ่ม animation โดยไม่แก้โค้ดเดิม
   ห้ามเปลี่ยน ถ้ายังอยากให้ animation ทำงาน:
   - ชื่อฟังก์ชัน render, renderHeader
   - id #modes #filters #rk #legend #rescon #bigf และคลาส .kpis
   - ช่องแผนที่ต้องเป็น <g class="tile"> ที่มี <polygon> ข้างใน
   (แก้สี ขนาด ชื่อปุ่ม ได้ตามปกติ) */
(function () {
  const A_DUR = 800;                    /* ความยาว animation สี/ความจาง (มิลลิวินาที) */
  const RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
  const animOK = () => !RM.matches;
  const replay = (el, cls) => { if (!el || !animOK()) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  let A_key = null, A_pill = null;

  /* 1) แถบขาวของปุ่มโหมดเลื่อนจากปุ่มเดิมไปปุ่มใหม่ */
  function placePill(animate) {
    const seg = $('#modes'), on = seg.querySelector('button.on'); if (!on) return;
    const pill = document.createElement('span'); pill.className = 'mode-pill'; seg.prepend(pill); seg.classList.add('has-pill');
    const to = {x:on.offsetLeft, y:on.offsetTop, w:on.offsetWidth, h:on.offsetHeight}, from = A_pill || to;
    const set = p => { pill.style.transform = `translate(${p.x}px,${p.y}px)`; pill.style.width = p.w + 'px'; pill.style.height = p.h + 'px'; };
    pill.style.transition = 'none'; set(animate && animOK() ? from : to); A_pill = to;
    requestAnimationFrame(() => requestAnimationFrame(() => { pill.style.transition = ''; set(to); }));
  }
  new ResizeObserver(() => {
    const on = document.querySelector('#modes button.on'), p = document.querySelector('#modes .mode-pill'); if (!on || !p) return;
    A_pill = {x:on.offsetLeft, y:on.offsetTop, w:on.offsetWidth, h:on.offsetHeight};
    p.style.transition = 'none'; p.style.transform = `translate(${A_pill.x}px,${A_pill.y}px)`; p.style.width = A_pill.w + 'px'; p.style.height = A_pill.h + 'px';
  }).observe(document.documentElement);

  const _renderHeader = renderHeader;
  renderHeader = function () {
    const key = ST.mode + '|' + Y66(), changed = A_key !== null && key !== A_key;
    _renderHeader();
    placePill(changed);
    $('#filters').style.opacity = $('#filters').style.visibility === 'hidden' ? 0 : 1;
    if (changed && !$('#rescon').hidden) replay($('#rescon'), 'a-in-f');
  };

  /* 2) สีและความจางค่อยๆ เปลี่ยน: ช่องแผนที่ แท่ง overview แถวรายการ จุด scatter */
  function snapshot() {
    const tiles = [...document.querySelectorAll('g.tile')].map(g => { const t = g.querySelector('text');
      return {go:g.getAttribute('opacity'), ps:[...g.querySelectorAll('polygon')].map(p => [p.getAttribute('fill'), p.getAttribute('opacity')]), to:t ? t.getAttribute('opacity') : null}; });
    const bars = [...document.querySelectorAll('#rk .ovw svg')].map(sv => [...sv.querySelectorAll('rect[opacity]')].map(r => [r.getAttribute('fill'), r.getAttribute('opacity')]));
    const dots = {}; document.querySelectorAll('#rk circle.dot[data-k]').forEach(c => dots[c.dataset.k] = c.getAttribute('opacity'));
    const rows = {}; document.querySelectorAll('#rk .r[data-k], #rk .trr[data-k]').forEach(r => rows[r.dataset.k] = getComputedStyle(r).opacity);
    return {tiles, bars, dots, rows};
  }
  function tweenFrom(S, sameView) {
    const jobs = [], tw = (el, attr, o) => { const n = el.getAttribute(attr); if (o == null || n == null || o === n) return; el.setAttribute(attr, o); jobs.push([el, attr, n]); };
    const gs = document.querySelectorAll('g.tile');
    if (gs.length === S.tiles.length) gs.forEach((g, i) => { const o = S.tiles[i];
      tw(g, 'opacity', o.go);
      const ps = g.querySelectorAll('polygon'), same = ps.length === o.ps.length;
      ps.forEach((p, j) => { const op = same ? o.ps[j] : o.ps[0]; if (!op) return; tw(p, 'fill', op[0]); if (same) tw(p, 'opacity', op[1]); });
      const t = g.querySelector('text'); if (t && o.to != null) tw(t, 'opacity', o.to); });
    const rowJobs = [];
    if (sameView) {
      document.querySelectorAll('#rk .ovw svg').forEach((sv, k) => { const ob = S.bars[k], rs = sv.querySelectorAll('rect[opacity]'); if (!ob || ob.length !== rs.length) return;
        rs.forEach((r, i) => { tw(r, 'fill', ob[i][0]); tw(r, 'opacity', ob[i][1]); }); });
      document.querySelectorAll('#rk circle.dot[data-k]').forEach(c => tw(c, 'opacity', S.dots[c.dataset.k]));
      document.querySelectorAll('#rk .r[data-k], #rk .trr[data-k]').forEach(r => { const o = S.rows[r.dataset.k], n = r.style.opacity || '1';
        if (o == null || o === n) return; r.style.transition = 'none'; r.style.opacity = o; rowJobs.push([r, n]); });
    }
    requestAnimationFrame(() => {
      jobs.forEach(([el, attr, n]) => d3.select(el).transition(attr).duration(A_DUR).ease(d3.easeCubicOut).attr(attr, n));
      rowJobs.forEach(([r, n]) => { r.style.transition = `opacity ${A_DUR}ms ease-out`; r.style.opacity = n; });
    });
  }

  /* 3) เปลี่ยนโหมด / ติ๊กปี 66 → กล่องด้านขวา การ์ดสรุป legend ค่อยๆ ปรากฏ */
  const _render = render;
  render = function () {
    const key = ST.mode + '|' + Y66(), changed = A_key !== null && key !== A_key, S = animOK() && A_key !== null ? snapshot() : null;
    _render();
    if (S) tweenFrom(S, !changed);
    if (changed) { [...$('#rk').children].forEach(c => replay(c, 'a-in')); [...$('#legend').children].forEach(c => replay(c, 'a-in-f')); }   /* กล่องอยู่กับที่, เฉพาะของข้างในจางเข้า, การ์ดสรุปไม่ animate */
    A_key = key;
  };
})();
/* ===== animation กราฟวิ่ง (บ้านใหญ่, รายละเอียดเขต, overview, scatter) =====
   หลักการ: ก่อนวาดใหม่ จำตำแหน่ง/ขนาดของแท่งเดิมไว้ (จับคู่ด้วยชื่อ ไม่ใช่ลำดับ)
            หลังวาดใหม่ ให้แท่งเริ่มจากค่าเดิมแล้วค่อยๆ วิ่งไปค่าใหม่
            แท่งที่เพิ่งเกิด → งอกจากฐาน / จุดที่เพิ่งเกิด → ค่อยๆ ขยายขึ้น
   ไม่ animate ตอนลากกรอบ (brush) เลื่อนรายการ หรือชี้เมาส์ เพราะต้องตอบสนองทันที */
(function () {
  const G_DUR = 650;                       /* ความยาว animation แท่งกราฟ (มิลลิวินาที) */
  const RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
  const EZ = 'cubic-bezier(.2,.7,.3,1)', GEO = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r'];
  const attrs = el => { const a = {}; GEO.forEach(n => { if (el.hasAttribute(n)) a[n] = el.getAttribute(n); }); a.fill = el.getAttribute('fill'); a.op = el.getAttribute('opacity'); a.t = el.children.length ? null : el.textContent; return a; };
  const isInt = v => v != null && /^\d+$/.test(v);
  /* svg: ตั้งค่าเดิม แล้ว transition ไปค่าใหม่ */
  function svgTween(el, from, delay, dur) {
    const now = attrs(el), t = d3.select(el), tr = t.transition('g').delay(delay || 0).duration(dur || G_DUR).ease(d3.easeCubicOut);
    Object.keys(from).forEach(n => { if (n === 't' || n === 'op' || from[n] == null || now[n] == null || from[n] === now[n]) return; t.attr(n, from[n]); tr.attr(n, now[n]); });
    if (isInt(from.t) && isInt(now.t) && from.t !== now.t) { const f = d3.interpolateRound(+from.t, +now.t); el.textContent = from.t; tr.tween('text', () => k => el.textContent = f(k)); }
  }
  const fadeIn = (el, delay, dur) => { const o = el.getAttribute('opacity') || 1; el.setAttribute('opacity', 0); d3.select(el).transition('g').delay(delay).duration(dur || G_DUR * .5).attr('opacity', o); };
  /* html: ตั้ง style เดิม → บังคับวาด → transition ไป style ใหม่ */
  function cssTween(el, from, delay, dur) {
    const now = {}; Object.keys(from).forEach(k => now[k] = el.style[k]);
    el.style.transition = 'none'; Object.entries(from).forEach(([k, v]) => el.style[k] = v); void el.offsetWidth;
    el.style.transition = Object.keys(from).map(k => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())} ${dur || G_DUR}ms ${EZ} ${delay || 0}ms`).join(',');
    Object.entries(now).forEach(([k, v]) => el.style[k] = v);
  }

  /* ---------- 1) กราฟหน้าบ้านใหญ่ ---------- */
  /* ตั้งชื่อให้ทุกชิ้นในกราฟตาม "หน้าที่" (แท่งชนะ/แท่งแพ้/ตัวเลข/ชื่อภาค) → ตัวเลขที่หายไปไม่ทำให้ชิ้นอื่นสลับที่กัน */
  function role(el, H) {
    if (el.tagName === 'rect') {
      if (el.getAttribute('stroke')) return 'sel';
      const f = el.getAttribute('fill'); if (f === 'transparent') return 'hit';
      if (el.parentNode.tagName === 'clipPath') return 'clip';
      return el.parentNode.hasAttribute('clip-path') ? (f === HL ? 'all' : 'won') : (f === HL ? 'lose' : 'won');
    }
    const y = +el.getAttribute('y'), fs = el.getAttribute('font-size');
    if (y === H - 15 || y === H - 3) return 'name' + y;
    if (el.getAttribute('text-anchor') === 'end') return fs === '10' ? 'in' : 'lab';
    if (el.querySelector('tspan')) return 'cnt';
    return fs === '11' ? 'tot' : el.getAttribute('fill') === '#3d424c' ? 'nl' : 'nw';
  }
  function houseItems() {
    const out = {};
    document.querySelectorAll('#hc1 svg, #hc2 svg').forEach(sv => { const H = +sv.getAttribute('height'), c = sv.parentNode.id;
      sv.querySelectorAll('g[data-hr], g[data-hp]').forEach(g => { const k = g.dataset.hr || g.dataset.hp;
        g.querySelectorAll('rect, text').forEach(el => { const r = role(el, H); out[r === 'sel' ? c + ':sel' : c + ':' + k + ':' + r] = el; }); }); });
    return out;
  }
  function houseHTML() {
    const o = {};
    document.querySelectorAll('#rk .sbar > div').forEach(d => o['s' + (d.style.background.includes('217') || d.style.background === HL ? 'L' : 'W')] = d);
    document.querySelectorAll('#rk .vr').forEach(r => { const n = r.querySelector('.vn'); r.querySelectorAll('.vb i').forEach((d, i) => o['v' + n.textContent + i] = d); });
    return o;
  }
  function houseSnap() {
    if (!document.querySelector('#hc1')) return null;
    const g = {}, h = {}; Object.entries(houseItems()).forEach(([k, el]) => g[k] = attrs(el));
    Object.entries(houseHTML()).forEach(([k, d]) => h[k] = {width:d.style.width, background:d.style.background});
    return {g, h};
  }
  function housePlay(S) {
    Object.entries(houseItems()).forEach(([k, el]) => {
      const o = S && S.g[k], now = attrs(el);
      if (o) return svgTween(el, o);
      if (el.tagName === 'text') return fadeIn(el, S ? G_DUR * .3 : G_DUR * .45);
      if (k.endsWith(':sel')) return fadeIn(el, 0);
      if (k.endsWith(':hit') || !now.width) return;
      if (k.startsWith('hc1')) svgTween(el, {y:+now.y + +now.height, height:0}); else svgTween(el, {width:0});
    });
    Object.entries(houseHTML()).forEach(([k, d]) => { const o = S && S.h[k]; cssTween(d, o ? o : {width:k === 'sL' ? d.style.width : '0%'}); });
  }

  /* ---------- 2) overview (แท่งเล็กด้านบน) + รายการ detail + scatter ระดับโอกาส ---------- */
  const C_DUR = 900, C_DUR0 = C_DUR;                       /* ความยาว animation กราฟ overview / detail / scatter / กล่องรายละเอียดเขต */
  const SWAP_DUR0 = [600, 500, 1100];       /* สลับ สส.เขต ↔ บัญชีรายชื่อ: [ขั้น 1 ความสูง, ทยอยออกตัว, ขั้น 2 เลื่อนที่] (มิลลิวินาที) */
  const MOVE_DUR0 = 1600;                   /* ความยาวตอนแท่ง overview เลื่อนไปตำแหน่งใหม่ (กด แยกภาค / ตามระยะห่าง) */
  const hid = el => el.closest('.half') ? el.closest('.half').id : '';
  function chartSnap(R = '#rk') {
    const ob = {}, rows = {}, dots = {};
    document.querySelectorAll(R + ' rect[data-ob]').forEach(r => ob[hid(r) + r.dataset.ob] = attrs(r));
    document.querySelectorAll(R + ' .r[data-k] .tr i').forEach(i => { const r = i.closest('.r'); rows[hid(r) + r.dataset.k] = {left:i.style.left, width:i.style.width}; });
    document.querySelectorAll(R + ' circle.dot[data-k]').forEach(c => dots[c.dataset.k] = attrs(c));
    return {ob, rows, dots};
  }
  let C_morph = false;   /* true = แท่ง overview กำลังย้ายที่ → ไม่ต้องให้ทั้งกล่องจางเข้า */
  function chartPlay(S, R = '#rk', f = 1) {   /* f = ตัวคูณความช้า (popup ใช้ 1.5) */
    const C_DUR = C_DUR0 * f, MOVE_DUR = MOVE_DUR0 * f, SWAP_DUR = SWAP_DUR0.map(v => v * f);
    C_morph = false;
    document.querySelectorAll(R + ' svg.ov').forEach(sv => {
      const z = [...sv.querySelectorAll('line')].find(l => l.getAttribute('opacity') === '.55'), y0 = z ? +z.getAttribute('y1') : 0, rs = sv.querySelectorAll('rect[data-ob]'), n = rs.length || 1;
      let moved = 0;
      /* ชุดเขตเปลี่ยน (เช่น เลือกภาคจาก dropdown) → ถือเป็นกราฟใหม่ ทุกแท่งงอกจากเส้น 0% */
      const same = rs.length === Object.keys(S.ob).filter(k => k.startsWith(hid(sv))).length && [...rs].every(r => S.ob[hid(r) + r.dataset.ob]);
      /* มีแท่งที่ทั้งย้ายที่และเปลี่ยนความสูง = สลับ สส.เขต ↔ บัญชีรายชื่อ → ทุกแท่งต้องยุบแล้วงอกใหม่พร้อมกัน (รวมแท่งที่บังเอิญอยู่ลำดับเดิม) */
      const swap = same && [...rs].some(r => { const o = S.ob[hid(r) + r.dataset.ob]; return o.x !== r.getAttribute('x') && (o.y !== r.getAttribute('y') || o.height !== r.getAttribute('height')); });
      rs.forEach((r, i) => { const o = same ? S.ob[hid(r) + r.dataset.ob] : null, now = attrs(r), t = d3.select(r);
        if (!o) return svgTween(r, {y:y0, height:0}, i / n * 400, C_DUR);          /* แท่งใหม่ → งอกจากเส้น 0% ไล่ซ้ายไปขวา */
        const dx = o.x !== now.x, dh = o.y !== now.y || o.height !== now.height;
        if (!dx && !swap) return svgTween(r, {y:o.y, height:o.height}, 0, C_DUR);
        moved++; t.attr('x', o.x).attr('y', o.y).attr('height', o.height);
        if (swap) /* เปลี่ยน สส.เขต ↔ บัญชีรายชื่อ: ขั้น 1 ความสูงเปลี่ยนที่ตำแหน่งเดิม → ขั้น 2 เลื่อนไปเรียงตามลำดับใหม่ */
          t.attr('fill', o.fill).transition('g').duration(SWAP_DUR[0]).ease(d3.easeCubicInOut).attr('y', now.y).attr('height', now.height).attr('fill', now.fill)
           .transition().delay(i / n * SWAP_DUR[1]).duration(SWAP_DUR[2]).ease(d3.easeCubicInOut).attr('x', now.x);
        else    /* กด แยกภาค / ตามระยะห่าง: แท่งเลื่อนไปที่ใหม่ ทยอยออกตามลำดับปลายทาง */
          t.transition('g').delay(i / n * 700).duration(MOVE_DUR).ease(d3.easeCubicInOut).attr('x', now.x);
      });
      /* กรอบส้ม: ระหว่างแท่งวิ่ง/งอก ซ่อนไว้ก่อน → แท่งเข้าที่ครบแล้วค่อยๆ ปรากฏที่ตำแหน่งใหม่ (ไม่เด้งไปมา) */
      const grew = !same && rs.length, bT = swap ? SWAP_DUR[0] + SWAP_DUR[1] + SWAP_DUR[2] : moved ? MOVE_DUR + 700 : grew ? 400 + C_DUR : 0, bb = sv.querySelector('g.brush');
      if (bT && bb) d3.select(bb).interrupt('bf').style('opacity', 0).transition('bf').delay(bT).duration(350).style('opacity', 1);
      if (moved) { C_morph = true;   /* ชื่อภาค / เส้นแบ่ง / ข้อความ ชนะ-แพ้ ค่อยๆ โผล่หลังแท่งเข้าที่ */
        sv.querySelectorAll(':scope > text:not([font-size="9"]), :scope > line[stroke-dasharray="3 3"]').forEach(el => fadeIn(el, swap ? SWAP_DUR[0] + SWAP_DUR[1] + SWAP_DUR[2] : MOVE_DUR + 500, C_DUR * .5)); }
    });
    document.querySelectorAll(R + ' .r[data-k] .tr i').forEach((i, j) => { const r = i.closest('.r'), o = S.rows[hid(r) + r.dataset.k];
      cssTween(i, o || {left:'50%', width:'0%'}, o ? 0 : 150 + (j % 30) * 25, C_DUR); });
    const cs = document.querySelectorAll(R + ' circle.dot[data-k]');
    if (cs.length) { const xs = [...cs].map(c => +c.getAttribute('cx')), lo = d3.min(xs), sp = (d3.max(xs) - lo) || 1;
      cs.forEach(c => { const o = S.dots[c.dataset.k]; if (o) svgTween(c, {cx:o.cx, cy:o.cy}, 0, C_DUR); else svgTween(c, {r:0}, (+c.getAttribute('cx') - lo) / sp * 500, C_DUR); }); }
  }
  window.chartAnim = {snap:chartSnap, play:chartPlay, off:() => RM.matches};   /* ให้ popup กราฟขยายใช้ animation ชุดเดียวกัน */
  const _renderRight = renderRight;
  renderRight = function () {
    const C = RM.matches || ST.mode === 'house' ? null : chartSnap();
    _renderRight();
    if (C) chartPlay(C);
  };

  const _render = render;
  render = function () {
    const H = RM.matches ? null : houseSnap();
    _render();
    if (RM.matches) return;
    if (ST.mode === 'house' && !Y66() && document.querySelector('#hc1')) housePlay(H);
    if (C_morph) { $('#rk').querySelectorAll(':scope > .a-in').forEach(c => c.classList.remove('a-in')); C_morph = false; }
  };

  /* ---------- 3) กล่องรายละเอียดเขต ---------- */
  function panelSnap() {
    const p = $('#panel'), b = {}, bl = {}, c = {}, bv = {};
    if (!p.classList.contains('open')) return {k:null, b, bl, c, bv};
    p.querySelectorAll('.bfly .ell').forEach(n => { const l = n.nextElementSibling, r = l.nextElementSibling;
      b[n.textContent] = [l.querySelector('i').style.width, l.querySelector('.lv').style.right, r.querySelector('i').style.width, r.querySelector('.rv').style.left]; bv[n.textContent] = [l.querySelector('.lv').textContent, r.querySelector('.rv').textContent]; });
    p.querySelectorAll('.ballot [data-bk]').forEach(d => bl[d.dataset.bk] = d.style.flex);
    p.querySelectorAll('.ptab .brow i').forEach(i => c[i.closest('table').className + i.closest('tr').previousElementSibling.querySelector('.nm b').textContent] = 1);
    return {k:p.dataset.k, b, bl, c, bv};
  }
  /* ตัวเลขวิ่ง: จากค่าเดิม (หรือ 0) ไปค่าที่แสดงอยู่, รองรับ 36,543 / 42.9% / 12.3 */
  const txt = n => n.nodeType === 3 ? n.nodeValue : n.textContent, setT = (n, v) => { if (n.nodeType === 3) n.nodeValue = v; else n.textContent = v; };
  function numRun(n, from, delay, dur) {
    const to = txt(n).trim(), m = to.match(/^([\d,]+(?:\.(\d+))?)(%?)$/); if (!m) return;
    const dec = m[2] ? m[2].length : 0, end = +m[1].replace(/,/g, ''), a = from == null ? 0 : +String(from).replace(/[,%]/g, '') || 0; if (a === end) return;
    const show = v => (dec ? v.toFixed(dec) : fmt(Math.round(v))) + m[3];
    setT(n, show(a)); d3.timeout(() => { const t = d3.timer(e => { const k = Math.min(1, e / dur); setT(n, show(a + (end - a) * d3.easeCubicOut(k))); if (k >= 1) { setT(n, to); t.stop(); } }); }, delay);
  }
  /* กล่องรายละเอียดเขต โหมดเทียบปี 66: การ์ดปี 69 เริ่มที่แถวของพรรคนั้นในปี 66 แล้ววิ่งไปแถวปี 69, คะแนนและ % นับจากค่าปี 66 */
  function panel66Play(p) {
    const L = {}, R66 = {}, EZ2 = 'cubic-bezier(.2,.7,.3,1)';
    p.querySelectorAll('.cmp .cc.l[data-p]').forEach((c, i) => { L[c.dataset.p] = c; R66[c.dataset.p] = i; c.animate([{transform:'translateX(-12px)', opacity:0}, {transform:'none', opacity:1}], {duration:420, delay:Math.min(i, 14) * 45, easing:EZ2, fill:'backwards'}); });
    const D0 = 120;   /* ปี 66 กับปี 69 เล่นไปพร้อมกัน (ปี 69 เริ่มจากซ่อนสนิท ไม่มีเงาจางรอ) */
    p.querySelectorAll('.cmp .cc.r[data-p]').forEach((c, i) => { const o = L[c.dataset.p], dl = D0 + Math.min(i, 14) * 45, pv = c.querySelector('.pv'), sm = pv.querySelector('small'), j = R66[c.dataset.p];
      /* วิ่งเฉพาะพรรคที่อยู่ 10 อันดับแรกทั้งสองปี และอันดับเปลี่ยนไม่เกิน 5 แถว, นอกนั้นค่อยๆ จางเข้าที่ตำแหน่งใหม่ */
      const run = o && i < 10 && j < 10 && Math.abs(i - j) <= 5, opv = o && o.querySelector('.pv');
      if (run) { const dy = o.getBoundingClientRect().top - c.getBoundingClientRect().top;
        c.animate([{transform:`translate(-14px,${dy}px)`, opacity:0}, {transform:`translate(-14px,${dy}px)`, opacity:1, offset:.18}, {transform:'none', opacity:1}], {duration:C_DUR * 1.15, delay:dl, easing:EZ2, fill:'backwards'}); }
      else c.animate([{transform:'translateX(14px)', opacity:0}, {transform:'none', opacity:1}], {duration:500, delay:dl + 250, easing:EZ2, fill:'backwards'});
      const d2 = run ? dl : dl + 250;
      numRun(pv.firstChild, opv ? txt(opv.firstChild) : 0, d2, C_DUR); if (sm) numRun(sm, opv && opv.querySelector('small') ? opv.querySelector('small').textContent : 0, d2, C_DUR);
    });
    p.querySelectorAll('.cmp .bd').forEach((b, i) => b.animate([{transform:'scale(.4)', opacity:0}, {transform:'scale(1.15)', opacity:1, offset:.7}, {transform:'none', opacity:1}], {duration:380, delay:D0 + C_DUR + 300 + i * 25, easing:'ease-out', fill:'backwards'}));
  }
  const _renderPanel = renderPanel;
  renderPanel = function () {
    const S = RM.matches ? null : panelSnap();
    _renderPanel();
    if (!S) return; const p = $('#panel'), same = S.k === p.dataset.k;
    /* แท่งคะแนนผู้สมัคร: งอกจากซ้ายทีละแถว (ถ้ากดเรียง/ดูเพิ่มเติมในเขตเดิม → วิ่งเฉพาะแถวที่เพิ่งโผล่) */
    let n = 0; p.querySelectorAll('.ptab .brow i').forEach(i => { const k = i.closest('table').className + i.closest('tr').previousElementSibling.querySelector('.nm b').textContent;
      if (same && S.c[k]) return; const dl = (n++ % 12) * 60; cssTween(i, {width:'0%'}, dl, C_DUR);
      i.closest('tr').previousElementSibling.querySelectorAll('td.nr').forEach(td => numRun(td, 0, dl, C_DUR)); });   /* คะแนนเสียง และ % นับขึ้นพร้อมแท่ง */
    if (same) return;
    if (Y66()) return panel66Play(p);
    /* สส.เขต เทียบ บัญชีรายชื่อ: เปลี่ยนเขต → แท่งของพรรคเดิมวิ่งจากค่าเขตก่อน, เปิดใหม่ → งอกจากเส้นกลาง */
    p.querySelectorAll('.bfly .ell').forEach((nm, j) => { const l = nm.nextElementSibling, r = l.nextElementSibling, o = S.b[nm.textContent] || ['0%', '2%', '0%', '2%'], d = S.k ? 0 : 150 + j * 60;
      numRun(l.querySelector('.lv'), S.bv && S.bv[nm.textContent] ? S.bv[nm.textContent][0] : 0, d, C_DUR); numRun(r.querySelector('.rv'), S.bv && S.bv[nm.textContent] ? S.bv[nm.textContent][1] : 0, d, C_DUR);
      cssTween(l.querySelector('i'), {width:o[0]}, d, C_DUR); cssTween(l.querySelector('.lv'), {right:o[1]}, d, C_DUR); cssTween(r.querySelector('i'), {width:o[2]}, d, C_DUR); cssTween(r.querySelector('.rv'), {left:o[3]}, d, C_DUR); });
    /* บัตรดี/บัตรเสีย: สัดส่วนค่อยๆ ปรับ */
    p.querySelectorAll('.ballot [data-bk]').forEach(d => cssTween(d, {flex:S.bl[d.dataset.bk] || '1 1 0%'}, S.k ? 0 : 250, C_DUR));
  };
})();

/* ===== popup ขยายกราฟ overview + detail (ปุ่ม ⛶ มุมขวาบนของกล่องกราฟ) =====
   - สลับ สส.เขต ↔ บัญชีรายชื่อ ได้ใน popup (หน้าหลักไม่เปลี่ยนโหมด)
   - ใช้ตัวกรองเดียวกับหน้าหลัก (ภาค, ชิป, legend, บ้านใหญ่ชนะ)
   - คลิกแถว = ปักหมุดติดตามเขต (สูงสุด 3 เขต) → แท่งของเขตนั้นเด่น วิ่งตามเมื่อสลับโหมด */
(function () {
  const PIN_C = ['#16181d', '#7c3aed', '#db2777'];   /* สีหมุด เขตที่ 1–3 */
  const SLOW = 1.5;                                  /* animation ใน popup ช้ากว่าหน้าหลัก 1.5 เท่า */
  const PM = {kind:'win', sort:'gap', pins:[]};
  const box = document.createElement('div'); box.id = 'ovm'; box.hidden = true;
  box.innerHTML = `<div class="ovm-bg" data-xc></div><div class="ovm-box" role="dialog" aria-modal="true" aria-labelledby="ovm-t">
    <div class="ovm-hd"><div><h3 id="ovm-t"></h3><div class="ovm-f" id="ovm-f"></div></div>
      <div class="ovm-ctl"><div class="seg2" id="ovm-k"></div><div class="sub" id="ovm-s"></div><button class="ovm-x" data-xc aria-label="ปิด">✕</button></div></div>
    <div class="ovm-pins" id="ovm-p"></div><div class="ovm-ch" id="ovm-c"></div></div><style id="ovm-css"></style>`;
  document.body.appendChild(box);
  const Q = s => box.querySelector(s);
  const val = (k, d) => k === 'list' ? d.lgap : (d.has ? d.gap : null), vv = (k, d) => val(k, d) == null ? -999 : val(k, d);
  const order = (k, srt) => D.filter(okR).sort(srt === 'reg' ? (a, b) => RO.indexOf(a.reg) - RO.indexOf(b.reg) || vv(k, b) - vv(k, a) : (a, b) => vv(k, b) - vv(k, a));
  const pc = k => PIN_C[PM.pins.indexOf(k)];
  let tm = null;

  function filtNote() {
    const f = [];
    if (ST.reg) f.push(ST.reg);
    if (ST.fil === 'close') f.push('สูสี ±5%'); else if (ST.fil === 'split') f.push('เขต-พรรค สวนทาง');
    if (ST.lg != null) f.push('legend: ' + (GV() ? GB[+ST.lg][1] : ST.lg === 'อื่นๆ' ? 'พรรคอื่น' : ST.lg));
    if (ST.big && bigOK()) f.push('บ้านใหญ่ชนะ');
    return f.length ? 'กำลังกรองตามหน้าหลัก: <b>' + f.join(', ') + '</b> (แท่งจาง = ไม่ตรงเงื่อนไข)' : 'แสดงทุกเขต (หน้าหลักไม่ได้กรอง)';
  }
  function pinStrip() {
    Q('#ovm-p').innerHTML = PM.pins.length ? PM.pins.map((k, i) => { const d = byK[k];
      return `<div class="pin" style="--pc:${PIN_C[i]}"><b class="nm">${d.pv} เขต ${d.d}</b><button data-pd="${k}">ดูรายละเอียด</button><button data-px="${k}" aria-label="เลิกติดตาม">✕</button></div>`; }).join('')
      : `<span class="ovm-empty">คลิกแถวในรายการด้านล่าง เพื่อปักหมุดติดตามเขต (สูงสุด 3 เขต) แล้วลองกดสลับ สส.เขต ↔ บัญชีรายชื่อ</span>`;
    Q('#ovm-css').textContent = PM.pins.map((k, i) => `#ovm .r[data-k="${k}"]{box-shadow:inset 4px 0 0 ${PIN_C[i]};background:${PIN_C[i]}14}`).join('');
  }
  /* แท่งของเขตที่ปักหมุด: สีหมุด หนาขึ้น + เส้นแนวตั้ง + ป้ายชื่อด้านบน (ตามแท่งไประหว่างวิ่ง) */
  function deco(T) {
    const sv = Q('svg.ov'), lane = Q('#ovm-l'); if (!sv || !lane) return;
    sv.querySelectorAll('.pinl').forEach(n => n.remove()); sv.querySelectorAll('rect[data-ob]').forEach(r => { if (r.dataset.pw) { r.setAttribute('width', r.dataset.pw); delete r.dataset.pw; r.style.fill = ''; } });
    const H = +sv.getAttribute('height');
    const items = PM.pins.map((k, i) => { const r = sv.querySelector(`rect[data-ob="${k}"]`); if (!r) return null;
      r.dataset.pw = r.getAttribute('width'); r.setAttribute('width', Math.max(3, +r.dataset.pw * 2.2)); r.style.fill = PIN_C[i]; sv.appendChild(r);
      const ln = d3.select(sv).append('line').attr('class', 'pinl').attr('y1', 0).attr('y2', H - 12).attr('stroke', PIN_C[i]).attr('stroke-dasharray', '3 2').attr('pointer-events', 'none').node();
      return {r, ln, i}; }).filter(Boolean);
    lane.innerHTML = items.map(({i}) => { const d = byK[PM.pins[i]]; return `<span class="pl" style="--pc:${PIN_C[i]};top:${i * 16}px">${d.pv} ${d.d}</span><span class="pll" style="--pc:${PIN_C[i]};top:${i * 16 + 15}px"></span>`; }).join('');
    const labs = lane.querySelectorAll('.pl'), lls = lane.querySelectorAll('.pll'), W = lane.clientWidth;
    const pos = () => items.forEach(({r, ln}, j) => { const x = +r.getAttribute('x') + +r.getAttribute('width') / 2;
      ln.setAttribute('x1', x); ln.setAttribute('x2', x); lls[j].style.left = x + 'px';
      const w = labs[j].offsetWidth; labs[j].style.left = Math.max(w / 2, Math.min(W - w / 2, x)) + 'px'; });
    if (tm) tm.stop(); pos(); if (T) tm = d3.timer(e => { pos(); if (e > T) tm.stop(); });
  }
  function draw(snap, center) {
    const c = Q('#ovm-c'), K = PM.kind;
    Q('#ovm-t').textContent = K === 'list' ? 'บัญชีรายชื่อ: พรรคประชาชนห่างพรรคที่ชนะ / อันดับ 2' : 'สส.เขต: พรรคประชาชนห่างผู้ชนะ / อันดับ 2';
    Q('#ovm-f').innerHTML = filtNote();
    Q('#ovm-k').innerHTML = [['win', 'สส.เขต'], ['list', 'บัญชีรายชื่อ']].map(([k, t]) => `<button data-pk="${k}" class="${K === k ? 'on' : ''}">${t}</button>`).join('');
    Q('#ovm-s').innerHTML = [['gap', 'ตามระยะห่าง'], ['reg', 'แยกภาค']].map(([k, t]) => `<button data-ps2="${k}" class="${PM.sort === k ? 'on' : ''}">${t}</button>`).join('');
    const S = snap && !chartAnim.off() ? (snap === 'empty' ? {ob:{}, rows:{}, dots:{}} : chartAnim.snap('#ovm-c')) : null;
    c.innerHTML = `<div class="ovm-lane" id="ovm-l"></div>${chartShell()}`;
    const last = PM.pins[PM.pins.length - 1], wk = 'm' + K;
    if (center && last) {   /* กรอบส้มไปอยู่ที่เขตที่ปักหมุดล่าสุด */
      const O = order(K, PM.sort), i = O.indexOf(byK[last]), NR = Math.max(4, Math.floor((c.querySelector('.list').clientHeight - 2) / ROWH));
      if (i >= 0) { const a = Math.max(0, Math.min(O.length - NR, i - Math.floor(NR / 2))); ST.win[wk] = [a, Math.min(O.length, a + NR)]; }
    }
    const OH = Math.round(Math.max(170, Math.min(300, c.clientHeight * .4))), s0 = ST.sort;
    ST.sort = PM.sort; chartBlock(c, K, OH, wk); ST.sort = s0;
    pinStrip();
    const sv = Q('svg.ov'), T = !S ? 0 : snap === 'empty' ? 900 * SLOW + 400 * SLOW : 2200 * SLOW + 300;
    if (S) chartAnim.play(S, '#ovm-c', SLOW);
    deco(T);
  }
  function open() {
    PM.kind = ST.mode === 'list' ? 'list' : 'win'; PM.sort = ST.sort;
    box.hidden = false; document.body.style.overflow = 'hidden'; void box.offsetWidth; box.classList.add('open');
    draw('empty', true); Q('.ovm-x').focus({preventScroll:true});
  }
  function close() { box.classList.remove('open'); document.body.style.overflow = ''; setTimeout(() => { if (!box.classList.contains('open')) box.hidden = true; }, 360); }

  box.addEventListener('click', e => {
    if (e.target.closest('[data-xc]')) return close();
    const k = e.target.closest('[data-pk]'); if (k) { if (k.dataset.pk !== PM.kind) { PM.kind = k.dataset.pk; draw('snap', true); } return; }
    const s = e.target.closest('[data-ps2]'); if (s) { if (s.dataset.ps2 !== PM.sort) { PM.sort = s.dataset.ps2; delete ST.win['m' + PM.kind]; draw('snap', true); } return; }
    const pd = e.target.closest('[data-pd]'); if (pd) { close(); select(byK[pd.dataset.pd]); return; }
    const px = e.target.closest('[data-px]'); if (px) { PM.pins = PM.pins.filter(k => k !== px.dataset.px); pinStrip(); deco(0); return; }
    const r = e.target.closest('.r[data-k]'); if (r) { const k = r.dataset.k;
      PM.pins = PM.pins.includes(k) ? PM.pins.filter(x => x !== k) : [...PM.pins, k].slice(-3);   /* เกิน 3 เขต → หมุดเก่าสุดหลุด */
      pinStrip(); deco(0); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('open')) { e.stopImmediatePropagation(); close(); } }, true);
  let rt; addEventListener('resize', () => { if (!box.classList.contains('open')) return; clearTimeout(rt); rt = setTimeout(() => draw(null, false), 150); });
  /* ปุ่มขยายบนหัวกล่องกราฟ (โหมด สส.เขต / บัญชีรายชื่อ / สส.เขต + บัญชีรายชื่อ, ไม่มีในโหมดเทียบปี 66) */
  const _renderRight = renderRight;
  renderRight = function () {
    _renderRight();
    const hd = $('#rk > .hd'); if (!hd || Y66() || !['win', 'list', 'both'].includes(ST.mode)) return;
    hd.querySelector('.sub').insertAdjacentHTML('beforeend', `<button class="xpand" data-xp title="ขยายกราฟ" aria-label="ขยายกราฟ"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4"/></svg>ขยาย</button>`);
  };
  $('#rk').addEventListener('click', e => { if (e.target.closest('[data-xp]')) { e.stopPropagation(); open(); } }, true);
})();

/* ===== animation หน้าเปรียบเทียบปี 66 =====
   1) แผนที่: ติ๊กปี 66 → สามเหลี่ยมมุมปี 66 งอกออกจากมุมขวาล่าง ทยอยจากเหนือลงใต้, เอาติ๊กออก → หดกลับเข้ามุม
   2) อันดับพรรค: การ์ดปี 69 เริ่มที่แถวอันดับปี 66 ของพรรคนั้น แล้ววิ่งไปอันดับปี 69, ตัวเลขนับจากค่าปี 66, ป้าย ▲▼ เด้งตอนจบ
   3) เปลี่ยน สส.เขต ↔ บัญชีรายชื่อ / เปลี่ยนภาค ระหว่างเทียบปี 66 → การ์ดวิ่งไปอันดับใหม่ ตัวเลขนับไปค่าใหม่ */
(function () {
  const RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
  const Y_DUR = 900;                                  /* ความยาวการ์ดวิ่ง (มิลลิวินาที) */
  const EZ = 'cubic-bezier(.2,.7,.3,1)';
  const corners = () => [...document.querySelectorAll('#map g.tile polygon[stroke]')];
  const brOf = el => el.getAttribute('points').split(' ')[0].split(',').map(Number);   /* จุดแรกของสามเหลี่ยม = มุมขวาล่าง */
  const scaleAt = ([x, y], k) => `translate(${x},${y}) scale(${k}) translate(${-x},${-y})`;
  function waveDelay(els) { const ys = els.map(e => brOf(e)[1]), lo = d3.min(ys), sp = (d3.max(ys) - lo) || 1; return i => (ys[i] - lo) / sp * 700; }
  function growCorners() { const els = corners(), dl = waveDelay(els);
    els.forEach((el, i) => { const b = brOf(el); d3.select(el).attr('transform', scaleAt(b, 0)).transition('y66').delay(dl(i)).duration(450).ease(d3.easeBackOut.overshoot(1.4)).attr('transform', scaleAt(b, 1)); }); }
  function shrinkCorners(snap) {   /* แผนที่วาดใหม่ไม่มีมุมแล้ว → ใช้สำเนามุมเดิมมาหดหายแทน */
    if (!snap.length) return; const g = gTiles.append('g').attr('pointer-events', 'none'), els = snap.map(o => g.append('polygon').attr('points', o.pts).attr('fill', o.fill).attr('stroke', '#fff').attr('stroke-width', .05).node()), dl = waveDelay(els);
    els.forEach((el, i) => d3.select(el).transition('y66').delay(dl(i) * .6).duration(350).ease(d3.easeCubicIn).attr('transform', scaleAt(brOf(el), 0)));
    setTimeout(() => g.remove(), 1200);
  }
  /* ---------- การ์ดอันดับ ---------- */
  const cards = () => [...document.querySelectorAll('#rk .cmp .pc[data-p]')];
  const ck = c => (c.classList.contains('r') ? 'r:' : 'l:') + c.dataset.p;
  function cardSnap() { const o = {}; cards().forEach(c => { const r = c.getBoundingClientRect(); o[ck(c)] = {top:r.top, v:c.querySelector('.pv').textContent}; }); return o; }
  function count(el, a, b, delay) { if (!/^\d+$/.test(a) || !/^\d+$/.test(b) || a === b) return; const f = d3.interpolateRound(+a, +b); el.textContent = a; d3.timeout(() => { const t = d3.timer(e => { const k = Math.min(1, e / Y_DUR); el.textContent = f(d3.easeCubicOut(k)); if (k >= 1) t.stop(); }); }, delay); }
  const move = (el, dy, delay, extra) => el.animate([{transform:`translateY(${dy}px)`, ...(extra || {})}, {transform:'none', opacity:1}], {duration:Y_DUR, delay, easing:EZ, fill:'backwards'});
  function enter() {   /* เพิ่งติ๊กปี 66 */
    const L = {}, rows = cards();
    rows.filter(c => c.classList.contains('l')).forEach((c, i) => { L[c.dataset.p] = c.getBoundingClientRect().top; c.animate([{transform:'translateX(-14px)', opacity:0}, {transform:'none', opacity:1}], {duration:450, delay:i * 45, easing:EZ, fill:'backwards'}); });
    document.querySelectorAll('#rk .cmp .arr').forEach((a, i) => a.animate([{opacity:0}, {opacity:1}], {duration:300, delay:250 + i * 45, fill:'backwards'}));
    const D0 = 120;   /* ปี 66 กับปี 69 เล่นไปพร้อมกัน (ปี 69 เริ่มจากซ่อนสนิท ไม่มีเงาจางรอ) */
    rows.filter(c => c.classList.contains('r')).forEach((c, i) => {
      const t0 = L[c.dataset.p], me = c.getBoundingClientRect().top;
      if (t0 != null) { c.animate([{transform:`translateY(${t0 - me}px)`, opacity:0}, {transform:`translateY(${t0 - me}px)`, opacity:1, offset:.18}, {transform:'none', opacity:1}], {duration:Y_DUR * 1.15, delay:D0 + i * 30, easing:EZ, fill:'backwards'}); const l = [...document.querySelectorAll('#rk .cmp .pc.l')].find(x => x.dataset.p === c.dataset.p); count(c.querySelector('.pv'), l.querySelector('.pv').textContent, c.querySelector('.pv').textContent, D0 + i * 30); }
      else c.animate([{transform:'translateX(14px)', opacity:0}, {transform:'none', opacity:1}], {duration:500, delay:D0 + 300 + i * 30, easing:EZ, fill:'backwards'});
    });
    pops(D0 + Y_DUR + 350);
  }
  function update(S) {   /* เปลี่ยนโหมด / ภาค ระหว่างเทียบปี 66 */
    cards().forEach((c, i) => { const o = S[ck(c)], me = c.getBoundingClientRect().top;
      if (o) { move(c, o.top - me, 0); count(c.querySelector('.pv'), o.v, c.querySelector('.pv').textContent, 0); }
      else c.animate([{opacity:0, transform:'translateY(8px)'}, {opacity:1, transform:'none'}], {duration:500, delay:250 + i % 10 * 30, easing:EZ, fill:'backwards'}); });
    pops(Y_DUR);
  }
  const pops = d => document.querySelectorAll('#rk .cmp .bd').forEach((b, i) => b.animate([{transform:'scale(.4)', opacity:0}, {transform:'scale(1.15)', opacity:1, offset:.7}, {transform:'none', opacity:1}], {duration:380, delay:d + i * 25, easing:'ease-out', fill:'backwards'}));
  let was = null, wasKey = null;
  const _render = render;
  render = function () {
    const on = Y66(), key = ST.mode + '|' + ST.reg, S = on && was ? cardSnap() : null;
    const off = !on && was ? corners().map(el => ({pts:el.getAttribute('points'), fill:el.getAttribute('fill')})) : [];
    _render();
    if (!RM.matches) {
      if (on && !was) { growCorners(); enter(); }
      else if (on && was && key !== wasKey) { if (key.split('|')[0] !== wasKey.split('|')[0]) growCorners(); update(S); }   /* เปลี่ยนโหมด → มุมงอกใหม่ (สีปี 66 เปลี่ยน), เปลี่ยนภาค → มุมไม่ต้องงอกใหม่ */
      else if (!on && was) shrinkCorners(off);
      if (on && (!was || key !== wasKey)) { const w = document.querySelector('#rk .cmpw'); if (w) w.classList.remove('a-in'); }
    }
    was = on; wasKey = key;
  };
})();

/* ===== popup ขยายกราฟวางแผนพรรค: ลากเส้นเกณฑ์ได้ + สถิติ =====
   - ลากเส้น 4 เส้น: ขอบพลิกได้ (ฝั่งแพ้), ขอบฐานเสียง (ฝั่งชนะ), ขอบปรับแผนใหม่, เส้นบัญชีรายชื่อ
   - เกณฑ์ที่ลากใช้แค่ใน popup จนกว่าจะกด "ใช้เกณฑ์นี้กับหน้าหลัก", กด "กลับเกณฑ์ทีม" ได้ตลอด */
(function () {
  const box = document.createElement('div'); box.id = 'tvm'; box.className = 'ovmx'; box.hidden = true;
  box.innerHTML = `<div class="ovm-bg" data-tc></div><div class="ovm-box" role="dialog" aria-modal="true" aria-labelledby="tvm-t">
    <div class="ovm-hd"><div><h3 id="tvm-t">ทดลองปรับเกณฑ์ระดับโอกาส</h3><div class="ovm-f" id="tvm-f"></div></div>
      <div class="ovm-ctl"><button class="tbtn" data-treset>↺ กลับเกณฑ์ทีม</button><button class="tbtn pri" data-tapply>ใช้เกณฑ์นี้กับหน้าหลัก</button><button class="ovm-x" data-tc aria-label="ปิด">✕</button></div></div>
    <div class="tvm-body"><div class="tvm-l"><div class="tvm-sc"><svg></svg></div><div class="tl tvm-tl"></div></div><div class="tvm-st" id="tvm-st"></div></div></div><style id="tvm-css"></style>`;
  document.body.appendChild(box);
  const Q = s => box.querySelector(s);
  let T = {...TIER_T}, sub = [], X, Y, W, H, m = {l:50, r:14, t:50, b:34};
  const PIN_C = ['#16181d', '#7c3aed', '#db2777'];   /* สีหมุด เขตที่ 1–3 (เหมือน popup กราฟ overview) */
  let pins = [], hov = null;
  const fmtP = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%';
  const snap = v => Math.round(v * 2) / 2;
  const need = d => d.cand[0][2] - d.cand[d.ppr - 1][2] + 1;   /* คะแนนที่ต้องหาเพิ่มเพื่อแซงผู้ชนะ */

  function zones() { return [[-72,T.far,-60,45,'far'],[T.far,T.lo,T.ly,45,'cand'],[T.far,T.lo,-60,T.ly,'far'],[T.lo,0,-60,45,'flip'],[0,T.hi,-60,45,'hold'],[T.hi,46,-60,T.ly,'hold'],[T.hi,46,T.ly,45,'safe']]; }
  function draw() {
    const wrap = Q('.tvm-sc'); W = wrap.clientWidth; H = Math.max(260, wrap.clientHeight);
    X = d3.scaleLinear([-72, 46], [m.l, W - m.r]); Y = d3.scaleLinear([-60, 45], [H - m.b, m.t]);
    const sv = d3.select(wrap).select('svg').attr('width', W).attr('height', H).html('');
    sv.append('g').attr('class', 'zn');
    const ax = sv.append('g');
    [-60,-40,-20,0,20,40].forEach(v => ax.append('text').attr('x', m.l - 6).attr('y', Y(v) + 3).attr('font-size', 10).attr('text-anchor', 'end').attr('fill', '#5d6370').text((v > 0 ? '+' : '') + v + '%'));
    [-60,-40,-20,0,20,40].forEach(v => ax.append('text').attr('x', X(v)).attr('y', H - m.b + 14).attr('font-size', 10).attr('text-anchor', 'middle').attr('fill', '#9aa0ab').text((v > 0 ? '+' : '') + v + '%'));
    ax.append('text').attr('x', (m.l + W) / 2).attr('y', H - 4).attr('font-size', 11.5).attr('text-anchor', 'middle').attr('fill', '#5d6370').text('← แพ้   ผลการแข่งขัน สส.เขต ของพรรคประชาชน (% บัตรดี)   ชนะ →');
    ax.append('text').attr('transform', `translate(13,${(H - m.b + m.t) / 2}) rotate(-90)`).attr('font-size', 11.5).attr('text-anchor', 'middle').attr('fill', '#5d6370').text('บัญชีรายชื่อ แพ้ ← → ชนะ');
    ax.append('line').attr('x1', X(0)).attr('x2', X(0)).attr('y1', m.t).attr('y2', H - m.b).attr('stroke', '#16181d').attr('stroke-width', 1.6).attr('opacity', .7);
    sv.append('g').attr('class', 'zl');
    sv.append('g').attr('class', 'dots').selectAll('circle').data(sub).join('circle').attr('class', 'dot').attr('r', 3.6).attr('stroke', '#fff').attr('stroke-width', .7)
      .attr('cx', d => X(Math.max(-72, Math.min(46, d.gap)))).attr('cy', d => Y(Math.max(-60, Math.min(45, d.lgap))))
      .on('click', (e, d) => { e.stopPropagation(); pinT(key(d)); })   /* คลิกจุด = ปักหมุด เหมือนคลิกแถว */
      .on('click', (e, d) => { const k = key(d); pins = pins.includes(k) ? pins.filter(x => x !== k) : [...pins, k].slice(-3); hl(); })   /* คลิกจุด = ปักหมุด เหมือนคลิกแถว */
      .on('mouseenter', (e, d) => { showTip(e, tipHTML(d)); hov = key(d); hl(); rowOf(hov); }).on('mousemove', moveTip).on('mouseleave', () => { hideTip(); hov = null; hl(); rowOf(null); });
    sv.append('g').attr('class', 'hl').attr('pointer-events', 'none');
    /* เส้นเกณฑ์ที่ลากได้: [ชื่อ, แกน, คำอธิบาย] */
    const G = sv.append('g').attr('class', 'thr');
    [['far', 'x', 'ปรับแผนใหม่'], ['lo', 'x', 'พลิกได้'], ['hi', 'x', 'ฐานเสียง'], ['ly', 'y', 'บัญชีรายชื่อ']].forEach(([k, a, t]) => {
      const g = G.append('g').attr('class', 'th-' + k).attr('cursor', a === 'x' ? 'ew-resize' : 'ns-resize');
      g.append('rect').attr('class', 'hit').attr('fill', 'transparent');
      g.append('line').attr('class', 'ln').attr('stroke', '#e8740f').attr('stroke-width', 2).attr('stroke-dasharray', '6 3');
      g.append('g').attr('class', 'tag').call(tg => { tg.append('rect').attr('rx', 4).attr('height', 17).attr('fill', '#e8740f'); tg.append('text').attr('fill', '#fff').attr('font-size', 11).attr('font-weight', 700).attr('y', 12.5).attr('text-anchor', 'middle'); });
      g.call(d3.drag().on('start', () => { hideTip(); g.classed('drag', true); }).on('drag', e => {
        let v = snap(a === 'x' ? X.invert(e.x) : Y.invert(e.y));
        if (k === 'far') v = Math.max(-70, Math.min(T.lo - 1, v));
        if (k === 'lo') v = Math.max(T.far + 1, Math.min(0, v));
        if (k === 'hi') v = Math.max(0, Math.min(40, v));
        if (k === 'ly') v = Math.max(-40, Math.min(40, v));
        if (v !== T[k]) { T[k] = v; update(false); }
      }).on('end', () => { g.classed('drag', false); update(true); }));
      g.datum({k, a, t});
    });
    update(true, true);
  }
  function update(full, first) {
    const sv = d3.select(Q('.tvm-sc svg'));
    sv.select('.zn').selectAll('rect').data(zones()).join('rect').attr('x', z => X(z[0])).attr('y', z => Y(z[3])).attr('width', z => Math.max(0, X(z[1]) - X(z[0]))).attr('height', z => Y(z[2]) - Y(z[3])).attr('fill', z => TT[z[4]][1]).attr('opacity', .14);
    const lab = [[(-72 + T.far) / 2, 40, 'far'], [(T.far + T.lo) / 2, 40, 'cand'], [T.lo / 2, 40, 'flip'], [(T.hi + 46) / 2, 40, 'safe'], [(T.hi + 46) / 2, -52, 'hold']];
    sv.select('.zl').selectAll('text').data(lab).join('text').attr('x', z => X(z[0])).attr('y', z => Y(z[1])).attr('text-anchor', 'middle').attr('font-size', 12.5).attr('font-weight', 700)
      .attr('fill', z => d3.color(TT[z[2]][1]).darker({far:1.4, hold:1.4, safe:.4, cand:2.2, flip:1.1}[z[2]])).text(z => TT[z[2]][0]);
    sv.selectAll('.dots circle').each(function (d) { const t = tierOf(d, T), c = TT[t][1]; if (this.__t === t) return; this.__t = t;
      first ? d3.select(this).attr('fill', c) : d3.select(this).interrupt().transition().duration(220).attr('fill', c); });
    sv.selectAll('.thr > g').each(function (o) { const g = d3.select(this), v = T[o.k];
      if (o.a === 'x') { const x = X(v); g.select('.hit').attr('x', x - 7).attr('y', m.t).attr('width', 14).attr('height', H - m.b - m.t); g.select('.ln').attr('x1', x).attr('x2', x).attr('y1', m.t).attr('y2', H - m.b);
        g.select('.tag').attr('transform', `translate(${x},${o.k === 'lo' ? m.t - 22 : m.t - 44})`); }   /* ป้ายพลิกได้อยู่แถวล่าง, ป้ายปรับแผนใหม่และฐานเสียงอยู่แถวบน → ป้ายไม่ทับกัน */
      else { const y = Y(v); g.select('.hit').attr('x', m.l).attr('y', y - 7).attr('width', W - m.r - m.l).attr('height', 14); g.select('.ln').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
        g.select('.tag').attr('transform', `translate(${W - m.r - 62},${y - 21})`); }
      const txt = o.t + ' ' + fmtP(v); g.select('.tag text').text(txt); const tw = txt.length * 6.1 + 12; g.select('.tag rect').attr('x', -tw / 2).attr('width', tw); });
    stats(); if (full) table(); hl();
    Q('[data-treset]').disabled = Object.keys(TIER_T0).every(k => T[k] === TIER_T0[k]);
    Q('[data-tapply]').disabled = Object.keys(T).every(k => T[k] === TIER_T[k]);
  }
  function stats() {
    const cnt = (TT0) => { const o = {}; TK.forEach(k => o[k] = 0); sub.forEach(d => { const t = tierOf(d, TT0); if (o[t] != null) o[t]++; }); return o; };
    const now = cnt(T), base = cnt(TIER_T0), flips = sub.filter(d => tierOf(d, T) === 'flip'), won = sub.filter(d => d.gap > 0).length;
    const nv = d3.sum(flips, need), byR = RO.map(r => [r, flips.filter(d => d.reg === r).length]).filter(x => x[1]), mx = d3.max(byR, x => x[1]) || 1;
    const dl = (a, b) => a === b ? '' : `<span class="dl ${a > b ? 'up' : 'dn'}">${a > b ? '+' : '−'}${Math.abs(a - b)}</span>`;
    Q('#tvm-st').innerHTML = `<div class="sb"><div class="sbt">จำนวนเขตแต่ละระดับ <small>เทียบเกณฑ์ทีม</small></div>${TK.map(k => `<div class="zr"><span class="sw" style="background:${TT[k][1]}"></span><span>${TT[k][0]}</span><b>${now[k]}</b>${dl(now[k], base[k])}</div>`).join('')}</div>
      <div class="sb"><div class="sbt">ถ้าพลิกได้ครบทุกเขต</div><div class="big">${won} + ${flips.length} = <b>${won + flips.length}</b> <small>เขต</small></div><div class="muted">ชนะอยู่แล้ว ${won} เขต และพลิกได้ ${flips.length} เขต</div></div>
      <div class="sb"><div class="sbt">คะแนนที่ต้องหาเพิ่ม (เขตพลิกได้)</div><div class="big"><b>${fmt(nv)}</b> <small>คะแนน</small></div><div class="muted">เฉลี่ยเขตละ ${flips.length ? fmt(Math.round(nv / flips.length)) : 0} คะแนน</div></div>
      <div class="sb"><div class="sbt">เขตพลิกได้ แยกตามภาค</div>${byR.length ? byR.map(([r, n]) => `<div class="rr2"><span>${short(r)}</span><i style="width:${n / mx * 100}%"></i><b>${n}</b></div>`).join('') : '<div class="muted">ไม่มีเขตพลิกได้</div>'}</div>`;
  }
  function table() {
    const rows = sub.map(d => [d, tierOf(d, T)]).sort((a, b) => TK.indexOf(a[1]) - TK.indexOf(b[1]) || Math.abs(a[0].gap) - Math.abs(b[0].gap));
    const num = v => `<span class="tv"><span class="tw">${v > 0 ? 'ชนะ' : 'แพ้'}</span><span class="tn">${Math.abs(v).toFixed(1)}%</span></span>`;
    Q('.tvm-tl').innerHTML = `<div class="th"><span>จังหวัด เขต</span><span>ระดับโอกาส</span><span style="text-align:right">สส.เขต</span><span style="text-align:right">บัญชีรายชื่อ</span></div>`
      + rows.map(([d, t]) => `<div class="trr" data-tk="${key(d)}"><span>${d.pv} <span class="muted">เขต ${d.d}</span><button class="tdet" data-tdet="${key(d)}" title="ดูรายละเอียดเขต" aria-label="ดูรายละเอียดเขต">↗</button></span><span><span class="tp" style="background:${TT[t][1]};color:${ink(TT[t][1])}">${TT[t][0]}</span>${t !== d.tier ? ' <span class="chg">เปลี่ยน</span>' : ''}</span>${num(d.gap)}${num(d.lgap)}</div>`).join('');
  }
  /* เขตที่ชี้ / ปักหมุด: จุดใหญ่ขึ้น + วงแหวน + ป้ายชื่อ + เส้นประไปแกน, จุดอื่นจางลง */
  function hl() {
    const sv = d3.select(Q('.tvm-sc svg')), g = sv.select('.hl'); if (g.empty()) return;
    const ks = [...pins]; if (hov && !ks.includes(hov)) ks.push(hov);
    sv.selectAll('.dots circle').attr('opacity', d => !ks.length || ks.includes(key(d)) ? 1 : .35);
    g.html(''); ks.forEach(k => { const d = byK[k], x = X(Math.max(-72, Math.min(46, d.gap))), y = Y(Math.max(-60, Math.min(45, d.lgap))), c = pins.includes(k) ? PIN_C[pins.indexOf(k)] : '#5d6370';   /* ชี้เฉยๆ = สีเทาเข้ม, ปักหมุด = สีหมุด */
      g.append('line').attr('x1', x).attr('x2', x).attr('y1', y).attr('y2', H - m.b).attr('stroke', c).attr('stroke-dasharray', '3 3').attr('opacity', .6);
      g.append('line').attr('x1', m.l).attr('x2', x).attr('y1', y).attr('y2', y).attr('stroke', c).attr('stroke-dasharray', '3 3').attr('opacity', .6);
      g.append('circle').attr('cx', x).attr('cy', y).attr('r', 6.5).attr('fill', TT[tierOf(d, T)][1]).attr('stroke', '#fff').attr('stroke-width', 1.5);
      g.append('circle').attr('cx', x).attr('cy', y).attr('r', 9.5).attr('fill', 'none').attr('stroke', c).attr('stroke-width', 2);
      const lb = `${d.pv} เขต ${d.d}`, right = x < (m.l + W) / 2;
      g.append('text').attr('x', x + (right ? 13 : -13)).attr('y', y - 9).attr('text-anchor', right ? 'start' : 'end').attr('font-size', 12).attr('font-weight', 700).attr('fill', c)
        .attr('stroke', '#fff').attr('stroke-width', 3.5).attr('paint-order', 'stroke').text(lb); });
    Q('#tvm-css').textContent = pins.map((k, i) => `#tvm .trr[data-tk="${k}"]{box-shadow:inset 4px 0 0 ${PIN_C[i]};background:${PIN_C[i]}12}`).join('');
  }
  /* ปักหมุด / เลิกปักหมุด (สูงสุด 3 เขต เกินแล้วหมุดเก่าสุดหลุด) */
  function pinT(k) { pins = pins.includes(k) ? pins.filter(x => x !== k) : [...pins, k].slice(-3); hl(); }
  /* ชี้จุดบน scatter → แถวในตารางมีแถบสี (ตารางไม่เลื่อนตาม) */
  function rowOf(k) {
    Q('.tvm-tl').querySelectorAll('.trr.hov').forEach(r => r.classList.remove('hov')); if (!k) return;
    const r = Q(`.tvm-tl .trr[data-tk="${k}"]`); if (!r) return; r.classList.add('hov');
  }
  function note() {
    const f = []; if (ST.reg) f.push(ST.reg); if (ST.fil === 'close') f.push('สูสี ±5%'); else if (ST.fil === 'split') f.push('เขต-พรรค สวนทาง'); if (ST.big) f.push('บ้านใหญ่ชนะ');
    return 'ลากเส้นสีส้มเพื่อปรับเกณฑ์ ' + (f.length ? 'กรองตามหน้าหลัก: <b>' + f.join(', ') + '</b>' : 'แสดงทุกเขตที่พรรคประชาชนส่งผู้สมัคร');
  }
  function open() {
    T = {...TIER_T}; sub = D.filter(d => d.has && okR(d) && okF(d) && okBig(d)); pins = pins.filter(k => sub.includes(byK[k])); hov = null;
    box.hidden = false; document.body.style.overflow = 'hidden'; void box.offsetWidth; box.classList.add('open');
    Q('#tvm-f').innerHTML = note(); draw();
    const cs = Q('.tvm-sc').querySelectorAll('circle'), xs = [...cs].map(c => +c.getAttribute('cx')), lo = d3.min(xs), sp = (d3.max(xs) - lo) || 1;
    if (!(window.chartAnim && chartAnim.off())) cs.forEach(c => { const r = c.getAttribute('r'); c.setAttribute('r', 0); d3.select(c).transition().delay((+c.getAttribute('cx') - lo) / sp * 600).duration(700).ease(d3.easeBackOut).attr('r', r); });
  }
  function close() { box.classList.remove('open'); document.body.style.overflow = ''; hideTip(); setTimeout(() => { if (!box.classList.contains('open')) box.hidden = true; }, 360); }
  function apply(v) { TIER_T = {...v}; D.forEach(d => d.tier = tierOf(d)); render(); }   /* หน้าหลัก: แผนที่ legend ตาราง ใช้เกณฑ์ใหม่ */

  box.addEventListener('mouseover', e => { if (!e.target.closest('.tvm-tl')) return; const r = e.target.closest('.trr[data-tk]'), k = r ? r.dataset.tk : null; if (k !== hov) { hov = k; hl(); } });   /* ชี้แถวในตาราง → จุดบน scatter เด่น */
  box.addEventListener('mouseout', e => { if (e.target.closest('.tvm-tl') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.tvm-tl'))) { hov = null; hl(); } });
  box.addEventListener('mouseleave', () => { if (hov) { hov = null; hl(); } });
  box.addEventListener('click', e => {
    if (e.target.closest('[data-tc]')) return close();
    if (e.target.closest('[data-treset]')) { T = {...TIER_T0}; update(true); return; }
    if (e.target.closest('[data-tapply]')) { apply(T); close(); return; }   /* ใช้กับหน้าหลักแล้วปิด popup ให้เห็นผลบนแผนที่ทันที */
    const dt = e.target.closest('[data-tdet]'); if (dt) { close(); select(byK[dt.dataset.tdet]); return; }   /* ↗ = ปิด popup แล้วเปิดกล่องรายละเอียดเขต */
    const r = e.target.closest('[data-tk]'); if (r) pinT(r.dataset.tk);   /* คลิกแถว = ปักหมุด (สูงสุด 3 เขต) */
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('open')) { e.stopImmediatePropagation(); close(); } }, true);
  let rt; addEventListener('resize', () => { if (!box.classList.contains('open')) return; clearTimeout(rt); rt = setTimeout(draw, 150); });
  /* ปุ่มขยายบนหัวกราฟวางแผนพรรค + ป้ายบอกเมื่อหน้าหลักใช้เกณฑ์ที่ปรับเอง */
  tierBtns = () => `<div class="sub">${tierCustom() ? `<span class="tcus">เกณฑ์ปรับเอง</span><button data-trst>↺ กลับเกณฑ์ทีม</button>` : ''}<button class="xpand" data-xt title="ขยายกราฟและปรับเกณฑ์"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4"/></svg>ขยายและปรับเกณฑ์</button></div>`;
  $('#rk').addEventListener('click', e => {
    if (e.target.closest('[data-xt]')) { e.stopPropagation(); open(); }
    else if (e.target.closest('[data-trst]')) { e.stopPropagation(); apply(TIER_T0); }
  }, true);
})();

/* ===== การ์ดสรุป: เลือกภาคจาก dropdown → ตัวเลขวิ่งจากค่าเดิมไปค่าใหม่ ===== */
(function () {
  const RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
  const K_DUR = 900, NUM = /\d[\d,]*(?:\.\d+)?/g;
  /* ข้อความในการ์ด: ตัวเลขหลัก, "/ 400 เขต", บรรทัดล่าง (เช่น "อันดับ 2 รองจาก... (173)") */
  const parts = () => ['#k1v', '#k2v'].flatMap(s => { const e = $(s); return e ? [e.firstChild, e.querySelector('small')] : []; }).concat([$('#k1s'), $('#k2s')]).filter(Boolean);
  const get = n => n.nodeType === 3 ? n.nodeValue : n.textContent, put = (n, v) => { if (n.nodeType === 3) n.nodeValue = v; else n.textContent = v; };
  function run(n, from) {
    const to = get(n); if (from == null) return;
    const a = from.match(NUM) || [], B = [...to.matchAll(NUM)]; if (!B.length) return;
    /* ข้อความแบบเดียวกันและตัวเลขเปลี่ยน → วิ่งจากค่าเดิม, ตัวเลขเท่าเดิม หรือข้อความเปลี่ยนรูปแบบ → วิ่งจาก 0, เลขอันดับไม่วิ่ง */
    const sameSk = from.replace(NUM, '#') === to.replace(NUM, '#') && a.length === B.length;
    const nums = B.map((m, i) => { const s = m[0], dec = (s.split('.')[1] || '').length, v1 = +s.replace(/,/g, ''), rank = /อันดับ\s*$/.test(to.slice(Math.max(0, m.index - 8), m.index));
      const v0 = rank ? v1 : sameSk && from !== to ? +a[i].replace(/,/g, '') : 0; return {dec, v0, v1, com:s.includes(',')}; });
    if (nums.every(o => o.v0 === o.v1)) return;
    const show = k => { let i = 0; return to.replace(NUM, () => { const o = nums[i++], v = o.v0 + (o.v1 - o.v0) * k; return o.dec ? v.toFixed(o.dec) : o.com ? fmt(Math.round(v)) : String(Math.round(v)); }); };
    put(n, show(0)); const t = d3.timer(e => { const k = Math.min(1, e / K_DUR); put(n, show(d3.easeCubicOut(k))); if (k >= 1) { put(n, to); t.stop(); } });
  }
  let reg0 = null;
  const _render = render;
  render = function () {
    const chg = reg0 !== null && ST.reg !== reg0, old = chg ? parts().map(get) : null;
    _render();
    if (chg && !RM.matches) { const now = parts(); if (now.length === old.length) now.forEach((n, i) => run(n, old[i])); }
    reg0 = ST.reg;
  };
})();
