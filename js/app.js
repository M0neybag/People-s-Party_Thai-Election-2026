/* =========================================================
   พรรคประชาชน 2569 · dashboard หน้า 1
   ข้อมูลทั้งหมดอยู่ในโฟลเดอร์ data/
     data/districts.json  ผลรายเขต (ปี 69 + ปี 66)
     data/layout.json     พิกัดช่องแผนที่ของแต่ละจังหวัด (แก้ได้ ดู README)
     data/national.json   ผลรวมทั้งประเทศ ปี 66 / 69
     data/logos.json      โลโก้พรรค (data URI)
   ========================================================= */
'use strict';

/* ---------- ค่าตั้งต้นที่ทีมปรับได้ ---------- */
const OLD_VERSION_URL = 'index-v1.html';   // ไฟล์เวอร์ชันเดิม ถ้ามีจะขึ้นลิงก์ "เวอร์ชันเดิม" ใต้ชื่อ
const PPN = 'ประชาชน';
const PC = {'ภูมิใจไทย':'#2747b8','ประชาชน':'#f28a1e','เพื่อไทย':'#a3203c','กล้าธรรม':'#58b847','ประชาธิปัตย์':'#38b0d8','พลังประชารัฐ':'#7a5cc4','รวมไทยสร้างชาติ':'#c49a2c','ก้าวไกล':'#f28a1e'};
const MAINP = ['ภูมิใจไทย','ประชาชน','เพื่อไทย','กล้าธรรม','ประชาธิปัตย์','พลังประชารัฐ','รวมไทยสร้างชาติ'];
const REGIONS = ['กรุงเทพมหานคร','ภาคกลาง','ภาคเหนือ','ภาคตะวันออกเฉียงเหนือ','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];
const RO = ['กรุงเทพมหานคร','ภาคกลาง','ภาคตะวันออกเฉียงเหนือ','ภาคเหนือ','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้']; // ลำดับในกราฟ "แยกภาค"
const MODES = [['win','สส.เขต'],['list','สส.บัญชีรายชื่อ'],['both','สส.เขต + บัญชีรายชื่อ'],['gap','ความห่างคะแนน'],['tier','ระดับโอกาส']];
const GB = [['#b3540b','ชนะ มากกว่า 15%'],['#ee8a2c','ชนะ 5–15%'],['#f9c896','ชนะ ไม่เกิน 5%'],['#cfd3ec','แพ้ ไม่เกิน 5%'],['#959cd4','แพ้ 5–15%'],['#5d66b3','แพ้ 15–30%'],['#333b84','แพ้ มากกว่า 30%']];
const TT = {safe:['ฐานมั่น','#b3540b','#fff'],hold:['ต้องรักษา','#f5b06a','#16181d'],flip:['ต้องพลิก','#7b3fc4','#fff'],cand:['แก้ตัวผู้สมัคร','#1f8f86','#fff'],far:['ระยะยาว','#c3c7ce','#16181d'],none:['ไม่ส่งผู้สมัคร','#e3e5ea','#16181d']};
const TK = ['flip','hold','cand','safe','far'];
const NATB = {c:{b:3.54,n:4.25},l:{b:4.41,n:2.93}};   // % บัตรเสีย / ไม่เลือกผู้ใด ทั้งประเทศ
const LEGEND_W = 185;                                // พื้นที่เว้นซ้ายให้คำอธิบายสี
const ROWH = 22;                                     // ความสูงแถวรายการ (px) ต้องตรงกับ --rowh ใน css

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const fmt = d3.format(',');
const col = p => PC[p] || '#9aa0ab';
const pk = p => PC[p] ? p : 'อื่นๆ';
const nm66 = p => p === PPN ? 'ก้าวไกล' : p;
const short = r => r.replace('ภาคตะวันออกเฉียงเหนือ','อีสาน').replace('กรุงเทพมหานคร','กทม.').replace('ภาค','');
const key = d => d.pc + '-' + d.d;
const HOUSE = '<span class="hz"><svg class="house" viewBox="0 0 16 16"><path d="M8 1.5 1 7.5h2v7h4v-4h2v4h4v-7h2z" fill="#16181d"/></svg><span class="hzt">บ้านใหญ่</span></span>';
let LOGOS = {};
const LGO = (p, sz, bc) => LOGOS[p]
  ? `<img class="lgo" src="${LOGOS[p]}" alt="${p}" style="width:${sz}px;height:${sz}px;border-color:${bc||col(p)}">`
  : `<span class="lgo" style="width:${sz}px;height:${sz}px;border-color:${bc||col(p)};color:${bc||col(p)};font-size:${sz*.45}px">${p[0]}</span>`;
const gbin = v => v == null ? -1 : v > 15 ? 0 : v > 5 ? 1 : v > 0 ? 2 : v >= -5 ? 3 : v >= -15 ? 4 : v >= -30 ? 5 : 6;
const gcolv = v => v == null ? '#d5d8de' : GB[gbin(v)][0];
const sgn = v => (v > 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%';

/* ---------- state ---------- */
const ST = {mode:'win', reg:'', fil:null, y66:false, lg:null, sort:'gap', sel:null, hover:null, tf:'target', brush:null, win:{}};
let D, L, N6, byK = {}, tiles = [];

/* ---------- filters ---------- */
const Y66 = () => ST.y66 && (ST.mode === 'win' || ST.mode === 'list');
const okF = d => ST.fil === 'close' ? (d.has && Math.abs(d.gap) <= 5) : ST.fil === 'split' ? d.split : true;
const okR = d => !ST.reg || d.reg === ST.reg;
const okL = d => {
  const g = ST.lg; if (g == null) return true;
  switch (ST.mode) {
    case 'win':  return pk(d.w[1]) === g;
    case 'list': return pk(d.pltop) === g;
    case 'both': return pk(d.w[1]) === g || pk(d.pltop) === g;
    case 'tier': return d.tier === g;
    default:     return String(gbin(d.gap)) === g;
  }
};
const inB = d => ST.mode !== 'tier' || !ST.brush || (d.has && d.gap >= ST.brush[0] && d.gap <= ST.brush[1] && d.lgap >= ST.brush[2] && d.lgap <= ST.brush[3]);
const lit = d => okF(d) && okR(d) && okL(d) && inB(d);

/* ---------- load ---------- */
Promise.all(['districts','layout','national','logos'].map(n =>
  fetch('data/' + n + '.json').then(r => { if (!r.ok) throw new Error('data/' + n + '.json'); return r.json(); })
)).then(([a, b, c, e]) => { D = a; L = b; N6 = c; LOGOS = e; prep(); init(); })
  .catch(err => {
    document.body.innerHTML = `<div class="err"><b>โหลดข้อมูลไม่สำเร็จ</b> (${err.message})<br>
    ถ้าเปิดไฟล์ index.html จากเครื่องโดยตรง (ดับเบิลคลิก) เบราว์เซอร์จะไม่ยอมให้อ่านไฟล์ข้อมูล ให้เปิดผ่านเว็บเซิร์ฟเวอร์ เช่น
    รัน <code>python -m http.server</code> ในโฟลเดอร์นี้ แล้วเปิด <code>http://localhost:8000</code> หรือใช้ GitHub Pages</div>`;
    console.error(err);
  });

function prep() {
  D.forEach(d => {
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
    const ppl = pi < 0 ? 0 : d.pl[pi][1];
    d.flip = d.has && d.ppr > 1 && ppl > d.cand[0][2];       // "พลิกได้": คะแนนบัญชีรายชื่อของพรรคในเขต > คะแนนผู้ชนะเขต
    const g = d.gap, l = d.lgap;
    d.tier = !d.has ? 'none' : g < -30 ? 'far' : (d.ppr === 1 && g > 5 && l > 0) ? 'safe' : d.ppr === 1 ? 'hold'
      : ((g >= -5 && l > 0) || d.flip) ? 'flip' : l > 0 ? 'cand' : 'far';
    byK[key(d)] = d;
  });
  Object.entries(L.prov).forEach(([pc, o]) => o.tiles.forEach((t, i) => {
    const dd = byK[pc + '-' + (i + 1)];
    if (dd) tiles.push({pc:+pc, d:i + 1, x:t[0], y:t[1], dd});
    else console.warn('layout.json: ไม่พบข้อมูลเขต', o.name, i + 1);
  }));
  D.forEach(d => { if (!tiles.some(t => t.dd === d)) console.warn('layout.json: ไม่มีช่องสำหรับ', d.pv, 'เขต', d.d); });
}

/* ---------- init + events ---------- */
let svg, gRoot, gTiles, gHi, zoom;
function init() {
  $('#region').innerHTML = '<option value="">ทุกภาค</option>' + REGIONS.map(r => `<option>${r}</option>`).join('');
  $('#modes').addEventListener('click', e => {
    const b = e.target.closest('[data-m]'); if (!b || b.dataset.m === ST.mode) return;
    ST.mode = b.dataset.m; ST.lg = null; ST.brush = null; ST.win = {}; render();
  });
  $('#region').addEventListener('change', e => { ST.reg = e.target.value; ST.win = {}; ST.brush = null; render(); fitView(true); });
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    ST.fil = b.dataset.f || null; render();
  });
  $('#cb66').addEventListener('change', e => { ST.y66 = e.target.checked; render(); });
  $('#legend').addEventListener('click', e => {
    const b = e.target.closest('[data-k]'); if (!b) return;
    ST.lg = ST.lg === b.dataset.k ? null : b.dataset.k; render();
  });
  $('.zoom').addEventListener('click', e => {
    const b = e.target.closest('[data-z]'); if (!b) return;
    const z = b.dataset.z;
    if (z === 'home') fitView(true);
    else svg.transition().duration(300).call(zoom.scaleBy, z === 'in' ? 1.5 : 1 / 1.5);
  });
  $('#rk').addEventListener('click', e => {
    const s = e.target.closest('[data-s]');
    if (s) { ST.sort = s.dataset.s; ST.win = {}; renderRight(); return; }
    const t = e.target.closest('[data-tf]');
    if (t) { ST.tf = t.dataset.tf; renderRight(); return; }
    const r = e.target.closest('[data-k]');
    if (r && byK[r.dataset.k]) select(byK[r.dataset.k]);
  });
  $('#rk').addEventListener('mouseover', e => { const r = e.target.closest('.r[data-k],.trr[data-k]'); setHover(r ? byK[r.dataset.k] : null); });
  $('#rk').addEventListener('mouseleave', () => setHover(null));
  $('#panel').addEventListener('click', e => { if (e.target.closest('[data-close]')) closePanel(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  // ลิงก์เวอร์ชันเดิม: แสดงเฉพาะเมื่อมีไฟล์อยู่จริง
  const ov = $('#oldv'); ov.href = OLD_VERSION_URL;
  fetch(OLD_VERSION_URL, {method:'HEAD'}).then(r => { if (r.ok) ov.hidden = false; }).catch(() => {});

  setupMap();
  render();
  fitView(false);
  let to, first = true;
  new ResizeObserver(() => { if (first) { first = false; return; } clearTimeout(to); to = setTimeout(() => { render(); fitView(false); }, 150); }).observe($('.cols'));
}

function render() {
  hideTip();
  renderHeader();
  renderLegend();
  drawTiles();
  renderKPI();
  renderRight();
  if (ST.sel) renderPanel();
  drawHi();
}

/* ---------- header ---------- */
function renderHeader() {
  $('#modes').innerHTML = MODES.map(([k, t]) => `<button data-m="${k}" class="${k === ST.mode ? 'on' : ''}">${t}</button>`).join('');
  const sub = D.filter(okR);
  $('#filters').innerHTML = [[null,'ทั้งหมด',sub.length],['close','สูสี ±5%',sub.filter(d => d.has && Math.abs(d.gap) <= 5).length],['split','เขต-พรรค สวนทาง',sub.filter(d => d.split).length]]
    .map(([k, t, n]) => `<button class="chip ${ST.fil === k ? 'on' : ''}" data-f="${k || ''}">${t} <span class="n">${n}</span></button>`).join('');
  const dis = !(ST.mode === 'win' || ST.mode === 'list'), y = $('#y66');
  $('#cb66').disabled = dis;
  y.classList.toggle('dis', dis);
  y.classList.toggle('on', ST.y66 && !dis);
  $('#y66s').textContent = dis ? 'ใช้ได้ในโหมด สส.เขต และ บัญชีรายชื่อ' : 'แสดงผลการเลือกตั้งปี 2566';
}

/* ---------- legend ---------- */
function renderLegend() {
  const M = ST.mode, y = Y66();
  const items = M === 'tier' ? TK.map(k => ({k, c:TT[k][1], t:TT[k][0], n:D.filter(d => d.tier === k && okR(d)).length}))
    : M === 'gap' ? GB.map((g, i) => ({k:String(i), c:g[0], t:g[1], n:D.filter(d => gbin(d.gap) === i && okR(d)).length}))
    : [...MAINP, 'อื่นๆ'].map(p => ({k:p, c:col(p), t:p === 'อื่นๆ' ? 'พรรคอื่น' : p, n:D.filter(d => okR(d) && (M === 'list' ? pk(d.pltop) : pk(d.w[1])) === p).length}));
  const title = y ? (M === 'list' ? 'บัญชีรายชื่ออันดับ 1 · 69 เทียบ 66' : 'ผู้ชนะ สส.เขต · 69 เทียบ 66')
    : {tier:'ระดับโอกาส (เกณฑ์ปี 69)', win:'พรรคที่ชนะ สส.เขต', list:'พรรคที่ได้บัญชีรายชื่อสูงสุดในเขต', both:'สส.เขต + บัญชีรายชื่อ', gap:'ระยะห่างของพรรคประชาชน'}[M];
  const glyph = M === 'both' ? `<svg width="150" height="46" style="margin:2px 0 4px"><polygon points="20,6 56,6 6,42" fill="#2747b8"/><polygon points="56,6 42,42 6,42" fill="#f28a1e"/><line x1="56" y1="6" x2="6" y2="42" stroke="#fff" stroke-width="2"/><line x1="26" y1="16" x2="70" y2="16" stroke="#16181d"/><circle cx="26" cy="16" r="2" fill="#16181d"/><text x="74" y="20" font-size="11.5" font-weight="700">สส.เขต</text><line x1="36" y1="34" x2="70" y2="34" stroke="#16181d"/><circle cx="36" cy="34" r="2" fill="#16181d"/><text x="74" y="38" font-size="11.5" font-weight="700">บัญชีรายชื่อ</text></svg>` : '';
  const g66 = y ? `<svg width="150" height="48" style="margin:2px 0 4px"><path d="M14,6 L56,6 L46,42 L4,42Z" fill="#2747b8"/><path d="M46,42 L12.4,42 L54,13.2Z" fill="#f28a1e" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><line x1="22" y1="16" x2="68" y2="16" stroke="#16181d"/><circle cx="22" cy="16" r="2.2" fill="#16181d"/><text x="72" y="20" font-size="11.5" font-weight="700">ปี 69</text><line x1="40" y1="34" x2="68" y2="34" stroke="#16181d"/><circle cx="40" cy="34" r="2.2" fill="#16181d"/><text x="72" y="38" font-size="11.5" font-weight="700">ปี 66</text></svg><div style="font-size:10.5px;color:#5d6370;margin-bottom:3px">มุมเทา = ไม่มีเขตนี้ในปี 66</div>` : '';
  $('#legend').innerHTML = `<div class="t">${title}</div>${glyph}${g66}` + items.map(it =>
    `<button class="lg ${ST.lg === it.k ? 'on' : ''}" data-k="${it.k}"><span class="sw" style="background:${it.c};width:11px;height:11px"></span><span>${it.t}</span><span class="n">${M === 'both' ? '' : it.n}</span></button>`).join('');
}

/* ---------- map ---------- */
function setupMap() {
  svg = d3.select('#map');
  gRoot = svg.append('g');
  gTiles = gRoot.append('g');
  const gLab = gRoot.append('g').attr('pointer-events', 'none');
  gHi = gRoot.append('g').attr('pointer-events', 'none');
  Object.values(L.prov).forEach(o => gLab.append('text').attr('x', o.lx).attr('y', o.ly).attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
    .attr('font-size', .62).attr('font-weight', 700).attr('fill', '#16181d').text(o.name.replace('กรุงเทพมหานคร', 'กรุงเทพฯ')));
  zoom = d3.zoom().scaleExtent([2, 200]).on('zoom', e => { gRoot.attr('transform', e.transform); hideTip(); });
  svg.call(zoom).on('dblclick.zoom', null);
}
function viewTransform() {
  const n = svg.node(), W = n.clientWidth, H = n.clientHeight;
  let k, tx, ty;
  if (ST.reg) {
    const rt = tiles.filter(t => t.dd.reg === ST.reg);
    const ax0 = d3.min(rt, t => t.x) - 1.5, ax1 = d3.max(rt, t => t.x) + 2.8, ay0 = d3.min(rt, t => t.y) - 2, ay1 = d3.max(rt, t => t.y) + 1.8;
    k = Math.min((W - LEGEND_W) / (ax1 - ax0), H / (ay1 - ay0)) * .9;
    tx = LEGEND_W + ((W - LEGEND_W) - k * (ax1 - ax0)) / 2 - k * ax0; ty = (H - k * (ay1 - ay0)) / 2 - k * ay0;
  } else {
    const xs = tiles.map(t => t.x), ys = tiles.map(t => t.y), lys = Object.values(L.prov).map(o => o.ly);
    const x0 = d3.min(xs) - 1, x1 = d3.max(xs) + 2.3, y0 = d3.min(lys) - 1, y1 = d3.max(ys) + 1.6;
    k = Math.min((W - LEGEND_W) / (x1 - x0), H / (y1 - y0));
    tx = LEGEND_W + ((W - LEGEND_W) - k * (x1 - x0)) / 2 - k * x0; ty = (H - k * (y1 - y0)) / 2 - k * y0;
  }
  return d3.zoomIdentity.translate(tx, ty).scale(k);
}
function fitView(anim) { (anim ? svg.transition().duration(600) : svg).call(zoom.transform, viewTransform()); }

const geo = t => {
  const S = L.S, x = t.x, y = t.y;
  return {TL:[x + S, y], TR:[x + 1 + S, y], BR:[x + 1, y + 1], BL:[x, y + 1], cx:x + .5 + S / 2, cy:y + .5};
};
const shrink = (pts, cx, cy, f) => pts.map(([a, b]) => [cx + (a - cx) * f, cy + (b - cy) * f].join(',')).join(' ');

function drawTiles() {
  gTiles.selectAll('*').remove();
  const M = ST.mode, y66 = Y66(), f = .9;
  tiles.forEach(t => {
    const d = t.dd, {TL, TR, BR, BL, cx, cy} = geo(t), on = lit(d), op = on ? 1 : .14;
    const g = gTiles.append('g').attr('class', 'tile').attr('opacity', op)
      .on('mouseenter', e => { showTip(e, tipHTML(d)); setHover(d, true); })
      .on('mousemove', moveTip)
      .on('mouseleave', () => { hideTip(); setHover(null, true); })
      .on('click', () => select(d));
    const num = (x, yy, fill, anchor) => g.append('text').attr('x', x).attr('y', yy).attr('text-anchor', anchor).attr('dominant-baseline', 'central')
      .attr('font-size', .42).attr('font-weight', 700).attr('font-family', 'IBM Plex Mono,monospace').attr('fill', fill).attr('pointer-events', 'none').text(t.d);
    if (M === 'both') {
      g.append('polygon').attr('points', shrink([TL, TR, BL], cx, cy, f)).attr('fill', col(d.w[1]));
      g.append('polygon').attr('points', shrink([TR, BR, BL], cx, cy, f)).attr('fill', col(d.pltop));
      const a = [cx + (TR[0] - cx) * f, cy + (TR[1] - cy) * f], b = [cx + (BL[0] - cx) * f, cy + (BL[1] - cy) * f];
      g.append('line').attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1]).attr('stroke', '#fff').attr('stroke-width', .07);
      num(t.x + L.S + .12, t.y + .3, '#fff', 'start');
    } else if (y66) {
      const w69 = M === 'list' ? d.pltop : d.w[1];
      const w66 = M === 'list' ? (d.p66 ? d.p66[0][0] : null) : (d.c66 ? d.c66[0][1] : null);
      const T = .8, p1 = [BR[0] + (BL[0] - BR[0]) * T, BR[1]], p2 = [BR[0] + (TR[0] - BR[0]) * T, BR[1] + (TR[1] - BR[1]) * T];
      g.append('polygon').attr('points', shrink([BL, BR, TR, TL], cx, cy, f)).attr('fill', col(w69));
      g.append('polygon').attr('points', shrink([BR, p1, p2], cx, cy, f)).attr('fill', w66 ? col(w66) : '#e1e3e8').attr('stroke', '#fff').attr('stroke-width', .05);
      num(t.x + L.S + .12, t.y + .3, '#fff', 'start');
    } else {
      const fill = M === 'tier' ? TT[d.tier][1] : M === 'win' ? col(d.w[1]) : M === 'list' ? col(d.pltop) : gcolv(d.gap);
      g.append('polygon').attr('points', shrink([BL, BR, TR, TL], cx, cy, f)).attr('fill', fill);
      const light = M === 'tier' ? TT[d.tier][2] === '#fff' : M !== 'gap' || [0, 5, 6].includes(gbin(d.gap));
      num(cx, cy + .03, light ? '#fff' : '#16181d', 'middle');
    }
  });
}
function drawHi() {
  gHi.selectAll('*').remove();
  const out = (d, w, dash) => {
    const t = tiles.find(q => q.dd === d); if (!t) return;
    const {TL, TR, BR, BL, cx, cy} = geo(t);
    gHi.append('polygon').attr('points', shrink([BL, BR, TR, TL], cx, cy, 1.08)).attr('fill', 'none').attr('stroke', '#16181d').attr('stroke-width', w).attr('stroke-dasharray', dash);
  };
  if (ST.hover && ST.hover !== selD()) out(ST.hover, .09, '.18 .1');
  if (ST.sel) out(selD(), .13, null);
}
const selD = () => ST.sel ? byK[ST.sel] : null;
function setHover(d, fromMap) {
  if (ST.hover === d) return;
  ST.hover = d; drawHi();
  if (!fromMap) return;
  document.querySelectorAll('#rk [data-k].hov').forEach(e => e.classList.remove('hov'));
}

/* ---------- tooltip ---------- */
const ftip = () => $('#ftip');
function showTip(e, html) { const t = ftip(); t.innerHTML = html; t.style.display = 'block'; moveTip(e); }
function moveTip(e) {
  const t = ftip(), w = t.offsetWidth, h = t.offsetHeight;
  let x = e.clientX + 16, y = e.clientY + 12;
  if (x + w > innerWidth - 8) x = e.clientX - w - 16;
  if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8);
  t.style.left = x + 'px'; t.style.top = y + 'px';
}
function hideTip() { const t = ftip(); if (t) t.style.display = 'none'; }

function tipHTML(d) {
  const M = ST.mode;
  if (Y66()) {
    const row = (y, nm, p, v, pct, h) => `<div class="tc"><span class="rkn y" style="background:${col(p)}">${y}</span><span class="nm">${nm}${h ? HOUSE : ''}</span><span class="vv">${fmt(v)}<small>${pct}%</small></span><span class="pt">${y === '66' ? nm66(p) : p}</span></div>`;
    const none = '<div class="tc"><span></span><span class="pt">ไม่มีเขตนี้ในปี 66</span></div>';
    let b;
    if (M === 'list') {
      const t6 = d.p66 ? d.p66.reduce((s, x) => s + x[1], 0) : 1;
      b = row('69', d.pl[0][0], d.pl[0][0], d.pl[0][1], (d.pl[0][1] / d.plt * 100).toFixed(1))
        + (d.p66 ? row('66', nm66(d.p66[0][0]), d.p66[0][0], d.p66[0][1], (d.p66[0][1] / t6 * 100).toFixed(1)) : none);
    } else {
      const g6 = d.c66 ? d.c66.reduce((s, x) => s + x[2], 0) : 1;
      b = row('69', d.w[0], d.w[1], d.w[2], (d.w[2] / d.good * 100).toFixed(1), d.w[4])
        + (d.c66 ? row('66', d.c66[0][0], d.c66[0][1], d.c66[0][2], (d.c66[0][2] / g6 * 100).toFixed(1), d.c66[0][4]) : none);
    }
    const has66 = M === 'list' ? d.p66 : d.c66;
    return `<div class="tip"><div class="h"><b>${d.pv} เขต ${d.d}</b></div>${b}${d.chg && has66 ? '<div class="f">⚠ เขตนี้อาจถูกแบ่งใหม่ เทียบกับปี 66 ได้ไม่ตรงทั้งหมด</div>' : ''}</div>`;
  }
  let body, right;
  if (M === 'list') {
    body = d.pl.slice(0, 4).map((x, i) => `<div class="tc ${x[0] === PPN ? 'pp' : ''}"><span class="rkn" style="background:${col(x[0])}">${i + 1}</span><span class="nm">${x[0]}</span><span class="vv">${fmt(x[1])}<small>${(x[1] / d.plt * 100).toFixed(1)}%</small></span><span class="pt">บัญชีรายชื่อ</span></div>`).join('');
    right = 'คะแนนบัญชีรายชื่อ';
  } else {
    body = d.cand.slice(0, 4).map((c, i) => `<div class="tc ${c[1] === PPN ? 'pp' : ''}"><span class="rkn" style="background:${col(c[1])}">${i + 1}</span><span class="nm">${c[0]}${c[4] ? HOUSE : ''}</span><span class="vv">${fmt(c[2])}<small>${(c[2] / d.good * 100).toFixed(1)}%</small></span><span class="pt">${c[1]}</span></div>`).join('');
    right = M === 'tier' ? `<span class="tp" style="background:${TT[d.tier][1]};color:${TT[d.tier][2]}">${TT[d.tier][0]}</span>` : 'ผู้สมัคร สส.เขต';
  }
  return `<div class="tip"><div class="h"><b>${d.pv} เขต ${d.d}</b><span style="font-size:11px;color:#5d6370">${right}</span></div>${body}</div>`;
}

/* ---------- KPI ---------- */
function renderKPI() {
  const hide = ST.mode === 'both' || ST.mode === 'tier' || Y66();
  $('#right').classList.toggle('nokpi', hide);
  if (hide) return;
  const n69 = N6['69'];
  if (!ST.reg) {
    const won = D.filter(d => d.ppr === 1).length;
    const cs = Object.entries(n69.cs).sort((a, b) => b[1] - a[1]), r = cs.findIndex(x => x[0] === PPN);
    $('#k1l').textContent = 'พรรคประชาชนชนะ สส.เขต';
    $('#k1v').innerHTML = `${won}<small> / ${D.length} เขต</small>`;
    $('#k1s').textContent = r === 0 ? `อันดับ 1 · อันดับ 2 คือ${cs[1][0]} (${cs[1][1]})` : `อันดับ ${r + 1} รองจาก${cs[0][0]} (${cs[0][1]})`;
    const lv = Object.entries(n69.lv).sort((a, b) => b[1] - a[1]), lr = lv.findIndex(x => x[0] === PPN), v = n69.lv[PPN];
    $('#k2l').textContent = 'พรรคประชาชน สส.บัญชีรายชื่อ';
    $('#k2v').innerHTML = `${n69.ls[PPN] || 0}<small> / 100 ที่นั่ง</small>`;
    $('#k2s').textContent = `คะแนน ${(v / 1e6).toFixed(2)} ล้าน · อันดับ ${lr + 1} (${(v / n69.lt * 100).toFixed(1)}%)`;
  } else {
    const sub = D.filter(okR), won = sub.filter(d => d.ppr === 1).length;
    const cnt = d3.rollups(sub, v => v.length, d => d.w[1]).sort((a, b) => b[1] - a[1]), r = cnt.findIndex(x => x[0] === PPN);
    $('#k1l').textContent = 'พรรคประชาชนชนะ สส.เขต · ' + ST.reg;
    $('#k1v').innerHTML = `${won}<small> / ${sub.length} เขต</small>`;
    $('#k1s').textContent = r < 0 ? `ไม่ชนะในภาคนี้ · ${cnt[0][0]} ชนะมากสุด (${cnt[0][1]})` : r === 0 ? `อันดับ 1 ในภาคนี้` + (cnt[1] ? ` · ${cnt[1][0]} (${cnt[1][1]})` : '') : `อันดับ ${r + 1} ในภาคนี้ รองจาก${cnt[0][0]} (${cnt[0][1]})`;
    const pv = d3.sum(sub, d => (d.pl.find(x => x[0] === PPN) || [0, 0])[1]), tot = d3.sum(sub, d => d.plt), lead = sub.filter(d => d.lrank === 1).length;
    $('#k2l').textContent = 'พรรคประชาชน บัญชีรายชื่อ · ' + ST.reg;
    $('#k2v').innerHTML = `${lead}<small> / ${sub.length} เขตที่นำ</small>`;
    $('#k2s').textContent = `คะแนน ${(pv / 1e6).toFixed(2)} ล้าน (${(pv / tot * 100).toFixed(1)}%) · ทั้งประเทศ ${n69.ls[PPN] || 0} ที่นั่ง`;
  }
}

/* ---------- right column ---------- */
const sortBtns = () => `<div class="sub">${[['gap','ตามระยะห่าง'],['close','แข่งสูสี'],['reg','แยกภาค']].map(([k, t]) => `<button data-s="${k}" class="${ST.sort === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
const chartShell = () => `<svg class="ov"></svg><div class="desc info"><span class="cnt"></span><span class="lab"></span></div><div class="list"></div>`;

function renderRight() {
  const rk = $('#rk');
  if (Y66()) { rk.className = 'card rk3'; render66(rk); return; }
  if (ST.mode === 'tier') { rk.className = 'card rk3'; renderTier(rk); return; }
  if (ST.mode === 'both') {
    rk.className = 'card rk2';
    rk.innerHTML = `<div class="hd"><h3>พรรคประชาชน: สส.เขต เทียบ บัญชีรายชื่อ</h3>${sortBtns()}</div>
      <div class="half" id="h1"><h4>สส.เขต · ห่างผู้ชนะ / อันดับ 2 (% บัตรดี)</h4>${chartShell()}</div>
      <div class="half" id="h2"><h4>บัญชีรายชื่อ · ห่างพรรคที่นำ / อันดับ 2 (% คะแนนบัญชีรายชื่อ)</h4>${chartShell()}</div>`;
    chartBlock($('#h1'), 'win', 100, 'bw');
    chartBlock($('#h2'), 'list', 100, 'bl');
    return;
  }
  const kind = ST.mode === 'list' ? 'list' : 'win';
  rk.className = 'card rk';
  rk.innerHTML = `<div class="hd"><h3>${kind === 'list' ? 'บัญชีรายชื่อ: พรรคประชาชนห่างพรรคที่นำ / อันดับ 2' : 'พรรคประชาชนห่างผู้ชนะ / อันดับ 2 เท่าไร'}</h3>${sortBtns()}</div>${chartShell()}`;
  chartBlock(rk, kind, 112, kind);
}

/* กราฟระยะห่าง: ภาพรวมทุกเขต (บน) + รายการเขตในกรอบส้ม (ล่าง) ลาก/คลิกบนภาพรวมเพื่อเลื่อนกรอบ หรือหมุนล้อเมาส์บนรายการ */
function chartBlock(host, kind, OH, wkey) {
  const val = d => kind === 'list' ? d.lgap : (d.has ? d.gap : null), vv = d => val(d) == null ? -999 : val(d);
  const ORD = D.filter(okR);
  ORD.sort(ST.sort === 'reg' ? (a, b) => RO.indexOf(a.reg) - RO.indexOf(b.reg) || vv(b) - vv(a)
    : ST.sort === 'close' ? (a, b) => (val(a) == null ? 999 : Math.abs(val(a))) - (val(b) == null ? 999 : Math.abs(val(b)))
    : (a, b) => vv(b) - vv(a));
  const ovEl = host.querySelector('.ov'), listEl = host.querySelector('.list');
  const ow = listEl.clientWidth, NR = Math.max(4, Math.floor((listEl.clientHeight - 2) / ROWH));
  const lo = -70, hi = 55, yy = v => 8 + (hi - v) / (hi - lo) * (OH - 22), x0 = 28, bw = (ow - x0 - 2) / ORD.length;
  let s = `<svg>`;
  [40, 20, 0, -20, -40, -60].forEach(v => s += `<line x1="${x0}" x2="${ow}" y1="${yy(v)}" y2="${yy(v)}" stroke="#e1e4ea" stroke-dasharray="2 3"/><text x="24" y="${yy(v) + 3}" font-size="9" text-anchor="end" fill="#5d6370" font-family="monospace">${v}%</text>`);
  ORD.forEach((d, i) => { const v = val(d) ?? 0; s += `<rect x="${x0 + i * bw}" width="${Math.max(.7, bw * .85)}" y="${yy(Math.max(0, v))}" height="${Math.max(.8, Math.abs(yy(v) - yy(0)))}" fill="${gcolv(val(d))}" opacity="${okF(d) && okL(d) ? 1 : .2}"/>`; });
  if (ST.sort === 'reg') {
    let s0 = 0;
    RO.forEach(r => {
      const n = ORD.filter(d => d.reg === r).length; if (!n) return;
      const xa = x0 + s0 * bw, xb = x0 + (s0 + n) * bw;
      s += `<text x="${(xa + xb) / 2}" y="${OH - 2}" font-size="9.5" text-anchor="middle" fill="#5d6370">${short(r)}</text>`;
      if (s0) s += `<line x1="${xa}" x2="${xa}" y1="4" y2="${OH - 12}" stroke="#9aa0ab" stroke-dasharray="3 3"/>`;
      s0 += n;
    });
  }
  const nw = ORD.filter(d => val(d) != null && val(d) > 0).length;
  s += `<line x1="${x0}" x2="${ow}" y1="${yy(0)}" y2="${yy(0)}" stroke="#16181d" opacity=".55"/>`;
  if (ST.sort === 'gap') s += `<text x="30" y="9" font-size="10" fill="#5d6370">← ${kind === 'list' ? 'นำ' : 'ชนะ'} ${nw} เขต</text><text x="${ow - 2}" y="${OH - 2}" font-size="10" text-anchor="end" fill="#5d6370">${kind === 'list' ? 'ตาม' : 'แพ้'} ${ORD.length - nw} เขต →</text>`;
  if (ST.sort === 'close') {
    const n5 = ORD.filter(d => val(d) != null && Math.abs(val(d)) <= 5).length;
    s += `<line x1="${x0 + n5 * bw}" x2="${x0 + n5 * bw}" y1="4" y2="${OH - 12}" stroke="#e8740f" stroke-dasharray="3 2"/><text x="${x0 + n5 * bw + 4}" y="9" font-size="10" fill="#a94f05">← ห่างไม่เกิน 5%: ${n5} เขต</text><text x="${ow - 2}" y="${OH - 2}" font-size="10" text-anchor="end" fill="#5d6370">สูสีที่สุด → ห่างที่สุด</text>`;
  }
  s += `<rect class="win" y="3" height="${OH - 14}" fill="rgba(232,116,15,.13)" stroke="#e8740f" stroke-width="1.5" pointer-events="none"/></svg>`;
  ovEl.outerHTML = s.replace('<svg>', `<svg class="ov" width="${ow}" height="${OH}">`);
  const ov = host.querySelector('.ov'), win = ov.querySelector('.win');
  host.querySelector('.lab').textContent = kind === 'list' ? 'พรรคที่นำ / อันดับ 2' : 'ผู้ชนะ / อันดับ 2';
  const opp = d => kind === 'list' ? (d.lrank === 1 ? d.pl[1][0] : d.pl[0][0]) : (d.ppr === 1 ? d.cand[1][1] : d.cand[0][1]);
  const maxSt = Math.max(0, ORD.length - NR);
  let st = ST.win[wkey];
  if (st == null) {
    const z = ORD.findIndex(d => val(d) != null && val(d) < 0);
    st = ST.sort === 'gap' && z >= 0 ? z - Math.floor(NR / 2) : 0;
  }
  function upd() {
    st = Math.max(0, Math.min(maxSt, Math.round(st))); ST.win[wkey] = st;
    win.setAttribute('x', x0 + st * bw); win.setAttribute('width', Math.min(NR, ORD.length) * bw);
    const rows = ORD.slice(st, st + NR), R = d3.max(rows, d => Math.abs(val(d) || 0)) || 1;
    host.querySelector('.cnt').textContent = ORD.length ? `${rows.length} เขต · อันดับ ${st + 1}–${st + rows.length} จาก ${ORD.length}` : 'ไม่มีเขต';
    listEl.innerHTML = rows.map(d => {
      const v = val(d), w = v == null ? 0 : Math.abs(v) / R * 50;
      return `<div class="r ${ST.sel === key(d) ? 'sel' : ''}" data-k="${key(d)}" style="opacity:${okF(d) && okL(d) ? 1 : .35}"><span>${d.pv} <span class="muted">เขต ${d.d}</span></span><span class="tr"><span class="z" style="left:50%"></span><i style="left:${v < 0 ? 50 - w : 50}%;width:${Math.max(.8, w)}%;background:${gcolv(v)}"></i></span><span class="v">${v == null ? '–' : sgn(v)}</span><span class="op"><span class="sw" style="background:${col(opp(d))}"></span>${opp(d)}</span></div>`;
    }).join('');
  }
  upd();
  const idx = e => Math.floor((d3.pointer(e, ov)[0] - x0) / bw);
  let drag = false;
  ov.addEventListener('pointerdown', e => { drag = true; ov.setPointerCapture(e.pointerId); hideTip(); st = idx(e) - NR / 2; upd(); });
  ov.addEventListener('pointerup', () => { drag = false; });
  ov.addEventListener('pointermove', e => {
    if (drag) { st = idx(e) - NR / 2; upd(); return; }
    const d = ORD[idx(e)];
    if (!d) { hideTip(); return; }
    const v = val(d);
    showTip(e, `<div class="tip sm"><div class="h"><b style="font-size:12.5px">${d.pv} เขต ${d.d}</b><span class="mono">${v == null ? 'ไม่ส่ง' : sgn(v)}</span></div></div>`);
  });
  ov.addEventListener('pointerleave', hideTip);
  listEl.addEventListener('wheel', e => { e.preventDefault(); st += Math.sign(e.deltaY) * Math.max(1, Math.floor(NR / 4)); upd(); }, {passive:false});
}

/* ระดับโอกาส: scatter (ลากกรอบได้) + ชิป + รายการ */
function renderTier(rk) {
  const sub = D.filter(okR);
  rk.innerHTML = `<div class="hd"><h3>ระดับโอกาสของพรรคประชาชน</h3><span class="desc">จุดละ 1 เขต · ลากกรอบเพื่อเลือกกลุ่มเขต · ดับเบิลคลิกเพื่อล้าง</span></div><svg class="sc"></svg><div class="chips"></div><div class="tl"></div>`;
  const W = rk.clientWidth - 24, SH = Math.max(220, Math.min(300, Math.round(rk.clientHeight * .42))), m = {l:46, r:10, t:12, b:30};
  const xs = d3.scaleLinear([-72, 46], [m.l, W - m.r]), ys = d3.scaleLinear([-60, 45], [SH - m.b, m.t]);
  const Z = [[-72,-30,-60,45,'far'],[-30,-5,0,45,'cand'],[-30,-5,-60,0,'far'],[-5,0,-60,45,'flip'],[0,5,-60,45,'hold'],[5,46,-60,0,'hold'],[5,46,0,45,'safe']];
  let sv = Z.map(([a, b, c, e, t]) => `<rect x="${xs(a)}" y="${ys(e)}" width="${xs(b) - xs(a)}" height="${ys(c) - ys(e)}" fill="${TT[t][1]}" opacity=".13"/>`).join('');
  [[-50,25,'ระยะยาว','far'],[-17.5,38,'แก้ตัวผู้สมัคร','cand'],[25,38,'ฐานมั่น','safe'],[25,-50,'ต้องรักษา','hold']].forEach(([a, b, t, k]) =>
    sv += `<text x="${xs(a)}" y="${ys(b)}" text-anchor="middle" font-size="12" font-weight="700" fill="${d3.color(TT[k][1]).darker(k === 'far' || k === 'hold' ? 1.4 : .4)}">${t}</text>`);
  sv += `<text x="${xs(-2.5)}" y="${m.t - 1}" text-anchor="middle" font-size="11" font-weight="700" fill="#7b3fc4">ต้องพลิก</text>`;
  [-60,-40,-20,0,20,40].forEach(v => sv += `<text x="${m.l - 6}" y="${ys(v) + 3}" font-size="9.5" text-anchor="end" fill="#5d6370" font-family="monospace">${v > 0 ? '+' : ''}${v}%</text>`);
  [-30,-5,0,5].forEach(v => sv += `<line x1="${xs(v)}" x2="${xs(v)}" y1="${m.t}" y2="${SH - m.b}" stroke="#16181d" stroke-width="${v ? 1 : 1.6}" ${v ? 'stroke-dasharray="4 3"' : ''} opacity=".7"/><text x="${xs(v)}" y="${SH - m.b + 13}" font-size="10" text-anchor="middle" font-family="monospace">${v > 0 ? '+' : ''}${v}%</text>`);
  sv += `<line x1="${m.l}" x2="${W - m.r}" y1="${ys(0)}" y2="${ys(0)}" stroke="#16181d" stroke-width="1.6" opacity=".7"/>`;
  sv += `<text x="${(m.l + W) / 2}" y="${SH - 3}" font-size="11" text-anchor="middle" fill="#5d6370">← แพ้ · ผลการแข่งขัน สส.เขต ของพรรคประชาชน (% บัตรดี) · ชนะ →</text>`;
  sv += `<text transform="translate(11,${(SH - m.b + m.t) / 2}) rotate(-90)" font-size="11" text-anchor="middle" fill="#5d6370">บัญชีรายชื่อ ตาม ← → นำ</text>`;
  const sc = d3.select(rk).select('svg.sc').attr('width', W).attr('height', SH).html(sv);

  const br = d3.brush().extent([[m.l, m.t], [W - m.r, SH - m.b]]).on('end', e => {
    if (!e.sourceEvent) return;
    const s = e.selection;
    ST.brush = s ? [xs.invert(s[0][0]), xs.invert(s[1][0]), ys.invert(s[1][1]), ys.invert(s[0][1])] : null;
    if (s) ST.tf = 'all';
    render();
  });
  const bg = sc.append('g').attr('class', 'brush').call(br);
  if (ST.brush) { const [a, b, c, e] = ST.brush; bg.call(br.move, [[xs(a), ys(e)], [xs(b), ys(c)]]); }
  sc.on('dblclick', () => { if (ST.brush) { ST.brush = null; render(); } });

  sc.append('g').selectAll('circle').data(sub.filter(d => d.has)).join('circle')
    .attr('class', 'dot').attr('data-k', key).attr('cx', d => xs(Math.max(-72, Math.min(46, d.gap)))).attr('cy', d => ys(Math.max(-60, Math.min(45, d.lgap))))
    .attr('fill', d => TT[d.tier][1]).attr('opacity', d => inB(d) && okL(d) && okF(d) ? 1 : .15)
    .on('mouseenter', (e, d) => { showTip(e, tipHTML(d)); setHover(d, true); }).on('mousemove', moveTip)
    .on('mouseleave', () => { hideTip(); setHover(null, true); }).on('click', (e, d) => select(d));
  styleDots();

  const nT = k => sub.filter(d => d.tier === k && inB(d)).length;
  const chips = [['target','เป้าหมาย (ต้องพลิก + ต้องรักษา)',nT('flip') + nT('hold')], ...TK.map(k => [k, TT[k][0], nT(k)]), ['all','ทั้งหมด',sub.filter(d => d.has && inB(d)).length]];
  rk.querySelector('.chips').innerHTML = chips.map(([k, t, n]) => `<button class="chip ${ST.tf === k ? 'on' : ''}" data-tf="${k}">${k !== 'target' && k !== 'all' ? `<span class="sw" style="background:${TT[k][1]}"></span>` : ''}${t} <span class="n">${n}</span></button>`).join('');

  let rows = sub.filter(d => d.has && inB(d) && okF(d) && okL(d));
  rows = ST.tf === 'target' ? rows.filter(d => d.tier === 'flip' || d.tier === 'hold') : ST.tf === 'all' ? rows : rows.filter(d => d.tier === ST.tf);
  rows.sort((a, b) => TK.indexOf(a.tier) - TK.indexOf(b.tier) || Math.abs(a.gap) - Math.abs(b.gap));
  const num = (v, pos, neg) => `<span class="tv"><span class="tw">${v > 0 ? pos : neg}</span><span class="tn">${Math.abs(v).toFixed(1)}%</span></span>`;
  rk.querySelector('.tl').innerHTML = `<div class="th"><span>จังหวัด · เขต</span><span>ระดับโอกาส</span><span style="text-align:right">สส.เขต</span><span style="text-align:right">บัญชีรายชื่อ</span></div>`
    + (rows.length ? rows.map(d => `<div class="trr ${ST.sel === key(d) ? 'sel' : ''}" data-k="${key(d)}"><span>${d.pv} <span class="muted">เขต ${d.d}</span></span><span><span class="tp" style="background:${TT[d.tier][1]};color:${TT[d.tier][2]}">${TT[d.tier][0]}</span>${d.flip && d.gap < -5 ? '<span class="fl">พลิกได้</span>' : ''}</span>${num(d.gap, 'ชนะ', 'แพ้')}${num(d.lgap, 'นำ', 'ตาม')}</div>`).join('')
      : '<div class="muted" style="padding:10px 12px">ไม่มีเขตที่ตรงเงื่อนไข</div>');
}
function styleDots() {
  d3.selectAll('#rk circle.dot').attr('r', d => ST.sel === key(d) ? 5.5 : 3).attr('stroke', d => ST.sel === key(d) ? '#16181d' : '#fff').attr('stroke-width', d => ST.sel === key(d) ? 2 : .6)
    .filter(d => ST.sel === key(d)).raise();
}

/* เปรียบเทียบปี 66 » 69 (ทั้งประเทศ) */
function render66(rk) {
  const L_ = ST.mode === 'list', k = L_ ? 'ls' : 'cs', N = N6;
  const top = y => Object.entries(N[y][k]).sort((a, b) => b[1] - a[1]);
  const r66 = top('66').slice(0, 12), r69 = top('69').slice(0, 12), rank66 = top('66').map(x => x[0]);
  const sub = (y, p) => L_ ? `${(N[y].lv[p] / 1e6).toFixed(2)} ล้านคะแนน · ${(N[y].lv[p] / N[y].lt * 100).toFixed(1)}%` : '';
  const card = (i, p, v, y) => {
    const nm = y === 66 ? nm66(p) : p, lg = y === 66 && p === PPN ? LGO('ก้าวไกล', 28, col(p)) : LGO(p, 28);
    const rc = y === 69 ? (rank66.indexOf(p) < 0 ? null : rank66.indexOf(p) - i) : null;
    const bd = y === 69 ? (rc == null ? '<span class="bd new">ใหม่</span>' : rc > 0 ? `<span class="bd up">▲${rc}</span>` : rc < 0 ? `<span class="bd dn">▼${-rc}</span>` : '') : '';
    return `<div class="pc ${y === 69 ? 'r' : 'l'} sm"><div class="rkb" style="background:${col(p)}">${i + 1}</div><div class="lg2">${lg}</div><div class="pn"><b>${nm}</b><span>${sub(y, p)} ${bd}</span></div><div class="pv">${v}</div></div>`;
  };
  let rows = '';
  for (let i = 0; i < 12; i++) rows += (r66[i] ? card(i, r66[i][0], r66[i][1], 66) : '<div class="pc empty"></div>') + '<div class="arr">»</div>' + (r69[i] ? card(i, r69[i][0], r69[i][1], 69) : '<div class="pc empty"></div>');
  rk.innerHTML = `<div class="hd"><h3>${L_ ? 'ที่นั่ง สส.บัญชีรายชื่อ' : 'ที่นั่ง สส.เขต'} · 12 อันดับแรก</h3><span class="desc">${L_ ? 'ที่นั่งคำนวณจากคะแนน' : 'จำนวนเขตที่ชนะ'}</span></div>
    <div class="cmph"><span>ปี 66</span><span>»</span><span><b>ปี 69</b></span></div>
    <div class="cmpw"><div class="cmp">${rows}</div></div>
    <div class="desc">▲▼ = อันดับเปลี่ยนจากปี 66 · ใหม่ = ไม่ติด 12 อันดับในปี 66</div>`;
}

/* ---------- selection + panel ---------- */
function select(d) {
  ST.sel = key(d); hideTip();
  renderPanel();
  refreshSel();
}
function closePanel() {
  if (!ST.sel) return;
  ST.sel = null;
  const p = $('#panel'); p.classList.remove('open'); p.setAttribute('aria-hidden', 'true');
  refreshSel();
}
function refreshSel() {
  drawHi();
  document.querySelectorAll('#rk [data-k]').forEach(e => { if (!e.classList.contains('dot')) e.classList.toggle('sel', e.dataset.k === ST.sel); });
  styleDots();
}

function ballots(d, rows) {
  const R = ballotRows(d);
  let h = '<div style="display:grid;gap:7px">';
  rows.forEach(k => {
    const r = R[k], p = v => v / r.to * 100;
    const seg = (kk, v, c, t) => `<div data-bk="${k}-${kk}" style="flex:${Math.max(p(v), 6)};background:${c}">${t}</div>`;
    h += `<div style="display:grid;grid-template-columns:96px 1fr;gap:8px;align-items:center;font-size:11.5px"><span>${r.lab}</span><div class="ballot">${seg('g', r.g, '#4b8f6a', 'บัตรดี ' + p(r.g).toFixed(1) + '%')}${seg('b', r.b, '#c0504d', p(r.b).toFixed(1) + '%')}${seg('n', r.n, '#8a8f99', p(r.n).toFixed(1) + '%')}</div></div>`;
  });
  return h + `</div><div class="bleg"><span><span class="sw" style="background:#4b8f6a"></span> บัตรดี</span><span><span class="sw" style="background:#c0504d"></span> บัตรเสีย</span><span><span class="sw" style="background:#8a8f99"></span> ไม่เลือกผู้ใด</span><span>· ชี้แถบเพื่อดูจำนวนบัตร</span></div>`;
}
const ballotRows = d => ({c:{lab:'บัตร สส.เขต', to:d.to, g:d.good, b:d.bad, n:d.nv}, l:{lab:'บัตรบัญชีรายชื่อ', to:d.lto, g:d.lgood, b:d.lbad, n:d.lnv}});
function ballotTip(d, k, kk) {
  const R = ballotRows(d), r = R[k], o = R[k === 'c' ? 'l' : 'c'], name = {g:'บัตรดี', b:'บัตรเสีย', n:'ไม่เลือกผู้ใด'}[kk], v = r[kk], ov = o[kk];
  return `<div class="tip" style="width:260px"><div class="h"><b style="font-size:12.5px">${r.lab} · ${name}</b></div><div class="bd2">
    <div class="kv"><span>จำนวน</span><b class="mono">${fmt(v)} ใบ</b></div>
    <div class="kv"><span>สัดส่วนของผู้มาใช้สิทธิ์</span><b class="mono">${(v / r.to * 100).toFixed(2)}%</b></div>
    <div class="kv muted"><span>${o.lab}</span><span class="mono">${fmt(ov)} ใบ (${(ov / o.to * 100).toFixed(2)}%)</span></div>
    <div class="kv muted"><span>ค่าเฉลี่ยทั้งประเทศ</span><span class="mono">${kk === 'g' ? '–' : NATB[k][kk].toFixed(2) + '%'}</span></div></div></div>`;
}
function butterfly(d) {
  const cv = {}, lv = {};
  d.cand.forEach(c => cv[c[1]] = c[2] / d.good * 100);
  d.pl.forEach(x => lv[x[0]] = x[1] / d.plt * 100);
  const parts = [...new Set([...d.cand.slice(0, 4).map(c => c[1]), ...d.pl.slice(0, 4).map(x => x[0])])].slice(0, 6);
  const bm = Math.max(...parts.map(p => Math.max(cv[p] || 0, lv[p] || 0)));
  return `<div class="bfly"><span></span><span style="text-align:right;padding-right:6px;font-size:11px;color:#5d6370">◀ สส.เขต</span><span style="padding-left:6px;font-size:11px;color:#5d6370">บัญชีรายชื่อ ▶</span>`
    + parts.map(p => { const a = cv[p] || 0, b = lv[p] || 0;
      return `<span class="ell" style="${p === PPN ? 'font-weight:700' : ''}">${p}</span><span class="l"><i style="width:${a / bm * 74}%;background:${col(p)}"></i><span class="lv" style="right:${a / bm * 74 + 2}%">${a.toFixed(1)}</span></span><span class="rr"><i style="width:${b / bm * 74}%;background:${col(p)}"></i><span class="rv" style="left:${b / bm * 74 + 2}%">${b.toFixed(1)}</span></span>`; }).join('') + '</div>';
}
const panelHead = (d, extra) => `<div class="ph"><div class="t1"><span class="eb">${d.reg} · ${d.pv}</span><button class="x" data-close title="ปิด">✕</button></div><div class="tt">${d.pv} เขต ${d.d}</div>${extra || ''}</div>`;

function renderPanel() {
  const d = selD(); if (!d) return;
  const p = $('#panel');
  p.innerHTML = Y66() ? panel66(d) : ST.mode === 'both' ? panelBoth(d) : panelOne(d);
  p.classList.add('open'); p.setAttribute('aria-hidden', 'false');
  p.querySelectorAll('[data-bk]').forEach(el => {
    const [k, kk] = el.dataset.bk.split('-');
    el.addEventListener('mouseenter', e => showTip(e, ballotTip(d, k, kk)));
    el.addEventListener('mousemove', moveTip);
    el.addEventListener('mouseleave', hideTip);
  });
}

function panel66(d) {
  const L_ = ST.mode === 'list';
  const A = L_ ? (d.p66 || []).map(x => [x[0], x[0], x[1], 0, 0]) : (d.c66 || []);
  const B = L_ ? d.pl.map(x => [x[0], x[0], x[1], 0, 0]) : d.cand;
  const ta = A.reduce((s, x) => s + x[2], 0) || 1, tb = B.reduce((s, x) => s + x[2], 0), rA = A.map(x => x[1]);
  const pc = (c, i, y) => {
    if (!c) return '<div class="cc empty"></div>';
    const rc = y === 69 ? (rA.indexOf(c[1]) < 0 ? null : rA.indexOf(c[1]) - i) : null;
    const bd = y === 69 && A.length ? (rc == null ? '<span class="bd new">ใหม่</span>' : rc > 0 ? `<span class="bd up">▲${rc}</span>` : rc < 0 ? `<span class="bd dn">▼${-rc}</span>` : '') : '';
    const pn = y === 66 ? nm66(c[1]) : c[1];
    return `<div class="cc ${y === 69 ? 'r' : 'l'}"><div class="rkb" style="background:${col(c[1])}">${i + 1}</div><div class="lg2">${y === 66 && c[1] === PPN ? LGO('ก้าวไกล', 30, col(PPN)) : LGO(c[1], 30)}</div><div class="pn"><b>${L_ ? pn : c[0]}${c[4] ? HOUSE : ''}</b><span>${L_ ? 'บัญชีรายชื่อ' : pn} ${bd}</span></div><div class="pv" style="font-size:16px">${fmt(c[2])}<small>${(c[2] / (y === 69 ? tb : ta) * 100).toFixed(1)}%</small></div></div>`;
  };
  const has = L_ ? d.p66 : d.c66;
  let rows = '';
  for (let i = 0, n = Math.max(A.length, B.length); i < n; i++) rows += pc(A[i], i, 66) + '<div class="arr">»</div>' + pc(B[i], i, 69);
  const w = L_ ? 'บัญชีรายชื่อ' : 'คะแนน';
  return panelHead(d) + `<div class="pb">${has
    ? `<div class="cmph"><span>ผล${w}ปี 66</span><span>»</span><span><b>ผล${w}ปี 69</b></span></div><div class="cmp">${rows}</div>${d.chg ? '<div class="desc">⚠ จำนวนผู้มีสิทธิ์ต่างจากปี 66 เกิน 5% เขตนี้อาจถูกแบ่งใหม่</div>' : ''}<div class="desc">▲▼ = อันดับของพรรคเปลี่ยนจากปี 66</div>`
    : '<div class="desc">ไม่มีเขตนี้ในปี 66 (จังหวัดนี้มีจำนวนเขตเพิ่มขึ้นในปี 69)</div>'}</div>`;
}

function panelBoth(d) {
  const ppi = d.cand.findIndex(c => c[1] === PPN), mxc = d.cand[0][2], mxl = d.pl[0][1];
  const cl = d.cand.slice(0, 8).map((c, i) => `<div class="cr ${c[1] === PPN ? 'pp' : ''}" style="font-size:11.5px"><span class="ix">${i + 1}</span><span class="ell">${c[0]}${c[4] ? HOUSE : ''}</span><span class="v">${fmt(c[2])} <span class="muted">${(c[2] / d.good * 100).toFixed(1)}%</span></span><span class="bb" style="width:${Math.max(.5, c[2] / mxc * 100)}%;background:${col(c[1])}"></span></div>`).join('')
    + (d.cand.length > 8 ? `<div class="muted" style="font-size:11px;padding-left:28px">+ อีก ${d.cand.length - 8} คน</div>` : '');
  const ll = d.pl.slice(0, 8).map((x, i) => `<div class="lt ${x[0] === PPN ? 'pp' : ''}" style="font-size:11.5px"><span class="ix">${i + 1}</span><span class="ell">${x[0]}</span><span class="v">${fmt(x[1])} <span class="muted">${(x[1] / d.plt * 100).toFixed(1)}%</span></span><span class="bb" style="width:${Math.max(.5, x[1] / mxl * 100)}%;background:${col(x[0])}"></span></div>`).join('')
    + (d.pl.length > 8 ? `<div class="muted" style="font-size:11px;padding-left:28px">+ อีก ${d.pl.length - 8} พรรค</div>` : '');
  const pills = `<div style="display:flex;gap:6px;flex-wrap:wrap">${d.has ? `<span class="pill"><span class="sw" style="background:${col(PPN)}"></span>สส.เขต อันดับ ${ppi + 1} · ${ppi === 0 ? 'นำ' : 'ตาม'} ${Math.abs(d.gap).toFixed(1)}%</span>` : '<span class="pill">ไม่ส่งผู้สมัคร สส.เขต</span>'}<span class="pill"><span class="sw" style="background:${col(PPN)}"></span>บัญชีรายชื่อ อันดับ ${d.lrank} · ${d.lrank === 1 ? 'นำ' : 'ตาม'} ${Math.abs(d.lgap).toFixed(1)}%</span>${d.split ? '<span class="tag">เขต-พรรค สวนทาง</span>' : ''}</div>`;
  return panelHead(d, pills) + `<div class="pb">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div style="display:grid;gap:1px;align-content:start;min-width:0"><span class="st">ผู้สมัคร สส.เขต (${d.cand.length} คน)</span>${cl}</div><div style="display:grid;gap:1px;align-content:start;min-width:0"><span class="st">บัญชีรายชื่อ (${d.pl.length} พรรค)</span>${ll}</div></div>
    <div style="display:grid;gap:5px"><span class="st">สส.เขต เทียบ บัญชีรายชื่อ (%)</span>${butterfly(d)}</div>
    <div style="display:grid;gap:6px"><span class="st">ผู้มาใช้สิทธิ์ ${fmt(d.to)} จาก ${fmt(d.el)} คน (${(d.to / d.el * 100).toFixed(1)}%)</span>${ballots(d, ['c', 'l'])}</div></div>`;
}

function panelOne(d) {
  const L2 = ST.mode === 'list', ppi = d.cand.findIndex(c => c[1] === PPN);
  let top;
  if (L2) {
    const mx = d.pl[0][1], shown = d.pl.slice(0, 10), rest = d.pl.slice(10).reduce((s, x) => s + x[1], 0);
    top = `<div style="display:grid;gap:2px"><span class="st">คะแนนบัญชีรายชื่อในเขตนี้ · ${d.pl.length} พรรค (% คะแนนบัญชีรายชื่อ)</span>`
      + shown.map((x, i) => `<div class="lt ${x[0] === PPN ? 'pp' : ''}"><span class="ix">${i + 1}</span><span>${x[0]}</span><span class="v">${fmt(x[1])} <span class="muted">${(x[1] / d.plt * 100).toFixed(1)}%</span></span><span class="bb" style="width:${Math.max(.5, x[1] / mx * 100)}%;background:${col(x[0])}"></span></div>`).join('')
      + (d.pl.length > 10 ? `<div class="lt"><span></span><span class="muted">อีก ${d.pl.length - 10} พรรค</span><span class="v muted">${fmt(rest)} ${(rest / d.plt * 100).toFixed(1)}%</span></div>` : '') + '</div>';
  } else {
    const mx = d.cand[0][2];
    top = `<div style="display:grid;gap:2px"><span class="st">ผู้สมัคร สส.เขต ทั้งหมด ${d.cand.length} คน (% บัตรดี)</span>`
      + d.cand.map((c, i) => `<div class="cr ${c[1] === PPN ? 'pp' : ''}"><span class="ix">${i + 1}</span><span>${c[0]}${c[4] ? HOUSE : ''} <span class="muted">· ${c[1]} · เบอร์ ${c[3]}</span></span><span class="v">${fmt(c[2])} <span class="muted">${(c[2] / d.good * 100).toFixed(1)}%</span></span><span class="bb" style="width:${Math.max(.5, c[2] / mx * 100)}%;background:${col(c[1])}"></span>${c[1] === PPN && i > 0 ? `<span class="note">ตามหลังผู้ชนะ ${fmt(d.cand[0][2] - c[2])} คะแนน (${((d.cand[0][2] - c[2]) / d.good * 100).toFixed(1)}%)</span>` : ''}</div>`).join('') + '</div>';
  }
  const pill = L2 ? `พรรคประชาชนบัญชีรายชื่ออันดับ ${d.lrank} · ${d.lrank === 1 ? 'นำ' : 'ตาม'} ${Math.abs(d.lgap).toFixed(1)}%`
    : !d.has ? 'พรรคประชาชนไม่ส่งผู้สมัครเขตนี้' : ppi === 0 ? 'พรรคประชาชนชนะ · ห่าง ' + d.gap.toFixed(1) + '%' : 'พรรคประชาชนอันดับ ' + (ppi + 1) + ' · ตามหลัง ' + (-d.gap).toFixed(1) + '%';
  const tier = ST.mode === 'tier' ? `<span class="tp" style="background:${TT[d.tier][1]};color:${TT[d.tier][2]}">${TT[d.tier][0]}</span>${d.flip && d.gap < -5 ? '<span class="fl">พลิกได้</span>' : ''}` : '';
  const head = `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${tier}<span class="pill"><span class="sw" style="background:${col(PPN)}"></span>${pill}</span>${d.split ? '<span class="tag">เขต-พรรค สวนทาง</span>' : ''}</div>`;
  const tot = L2 ? d.lto : d.to;
  return panelHead(d, head) + `<div class="pb">${top}
    <div style="display:grid;gap:5px"><span class="st">สส.เขต เทียบ บัญชีรายชื่อ ในเขตนี้ (%)</span>${butterfly(d)}</div>
    <div style="display:grid;gap:5px"><span class="st">${L2 ? 'บัตรบัญชีรายชื่อ · ' : ''}ผู้มาใช้สิทธิ์ ${fmt(tot)} จาก ${fmt(d.el)} คน (${(tot / d.el * 100).toFixed(1)}%)</span>${ballots(d, [L2 ? 'l' : 'c'])}</div></div>`;
}
