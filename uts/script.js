// SISFOKAD — tema Light/Dark + CRUD stabil
const STORAGE_KEY = 'sisfokad_v_final2';
const THEME_KEY   = 'sisfokad_theme_v2';


const defaultSemesters = [
  { no:1, mks:[{kode:'IF101',nama:'Pemrograman Web',sks:'3'},{kode:'IF102',nama:'Dasar Pemrograman',sks:'3'}] },
  { no:2, mks:[{kode:'IF103',nama:'Basis Data',sks:'3'},{kode:'IF104',nama:'Struktur Data',sks:'3'}] },
  { no:3, mks:[{kode:'IF201',nama:'Rekayasa Perangkat Lunak',sks:'4'},{kode:'IF202',nama:'Jaringan Komputer',sks:'3'}] }
];


let semesters = [];
let editing = null;        // {kode, semester} | null
let currentFilter = null;  // number|null
let views = [];


function loadData(){
  try{
    const s = localStorage.getItem(STORAGE_KEY);
    semesters = s ? JSON.parse(s) : JSON.parse(JSON.stringify(defaultSemesters));
    if(!Array.isArray(semesters)) semesters = JSON.parse(JSON.stringify(defaultSemesters));
    semesters.forEach(v=>{ if(!Array.isArray(v.mks)) v.mks=[]; });
  }catch{ semesters = JSON.parse(JSON.stringify(defaultSemesters)); }
}
function saveData(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(semesters)); }catch{} }


function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t==='dark' ? 'dark' : 'light');
}
function loadTheme(){
  const t = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(t);
}
function toggleTheme(){
  const now = document.documentElement.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, now);
  applyTheme(now);
}


/* utils */
const byId = (id)=>document.getElementById(id);
const findSemester = (n)=> semesters.find(s=>Number(s.no)===Number(n)) || null;
function fillSemOptions(){
  const sel = byId('m-sem'); if(!sel) return;
  sel.innerHTML='';
  semesters.forEach(s=>{ const o=document.createElement('option'); o.value=s.no; o.textContent='Semester '+s.no; sel.appendChild(o); });
}


/* views */
function registerViews(){ views = Array.from(document.querySelectorAll('.view')); }
function showView(id){
  views.forEach(v=> v.style.display = (v.id===id ? '' : 'none'));
  document.querySelectorAll('.nav-link').forEach(a=> a.classList.toggle('active', a.dataset.target===id));
  if(id==='beranda'){ currentFilter=null; renderSemesters(); }
  if(id==='daftar'){ renderDaftar(currentFilter); }
  if(id==='grafik'){ renderIPK(); }
}


/* beranda */
function renderSemesters(){
  const wrap = byId('semester-list'); if(!wrap) return; wrap.innerHTML='';
  semesters.forEach(s=>{
    const card = document.createElement('div');
    card.className='semester-card'; card.dataset.sem=s.no;
    card.innerHTML = `<div class="sem-no">Semester ${s.no}</div><div class="sem-meta">${(s.mks||[]).length} mata kuliah</div>`;
    card.addEventListener('click', ()=>{ currentFilter=s.no; showView('daftar'); renderDaftar(s.no); });
    wrap.appendChild(card);
  });
}


/* daftar */
function renderDaftar(filter=null){
  fillSemOptions();
  const cont = byId('mk-container'); if(!cont) return; cont.innerHTML='';
  const all=[]; semesters.forEach(s=>(s.mks||[]).forEach(mk=>all.push({...mk,semester:s.no})));
  const list = filter ? all.filter(m=>Number(m.semester)===Number(filter)) : all;
  if(list.length===0){ cont.innerHTML='<p class="muted">Belum ada mata kuliah.</p>'; return; }


  list.forEach(mk=>{
    const card = document.createElement('div'); card.className='mk-card';
    const actions = document.createElement('div'); actions.className='card-actions';


    const edit = document.createElement('button'); edit.className='icon-btn'; edit.title='Edit';
    edit.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 21l3-1 11-11 1-3L14 4 3 15v6z" stroke="currentColor" stroke-width="1.4"/></svg>';
    edit.addEventListener('click', ()=>openEdit(mk.kode,mk.semester));


    const del = document.createElement('button'); del.className='icon-btn icon-delete'; del.title='Hapus';
    del.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="1.6"/></svg>';
    del.addEventListener('click', ()=>removeMK(mk.semester,mk.kode));


    actions.appendChild(edit); actions.appendChild(del);


    const title=document.createElement('div'); title.className='mk-title'; title.textContent=mk.nama;
    const sub=document.createElement('div'); sub.className='mk-sub'; sub.textContent=`${mk.kode} • SKS ${mk.sks} • S${mk.semester}`;


    card.appendChild(actions); card.appendChild(title); card.appendChild(sub); cont.appendChild(card);
  });
}


/* modal */
function openCreate(){
  editing=null;
  byId('modal-title').textContent='Tambah Mata Kuliah';
  byId('m-kode').value=''; byId('m-nama').value=''; byId('m-sks').value='';
  byId('m-sem').value=(currentFilter||semesters[0].no);
  openModal();
}
function openEdit(kode,semester){
  const s=findSemester(semester); if(!s) return;
  const mk=(s.mks||[]).find(m=>m.kode===kode); if(!mk) return;
  editing={kode,semester};
  byId('modal-title').textContent='Edit Mata Kuliah';
  byId('m-kode').value=mk.kode; byId('m-nama').value=mk.nama; byId('m-sks').value=mk.sks; byId('m-sem').value=semester;
  openModal();
}
function openModal(){ const m=byId('modal'); m.setAttribute('aria-hidden','false'); m.style.display='block'; byId('m-kode').focus(); }
function closeModal(){ const m=byId('modal'); m.setAttribute('aria-hidden','true'); m.style.display='none'; editing=null; }


function modalSave(){
  const kode=(byId('m-kode').value||'').trim().toUpperCase();
  const nama=(byId('m-nama').value||'').trim();
  const sks =(byId('m-sks').value||'').trim();
  const sem =Number(byId('m-sem').value);
  if(!kode||!nama||!sks){ alert('Isi semua field!'); return; }
  const target=findSemester(sem); if(!target){ alert('Semester tidak tersedia'); return; }


  if(editing){
    const prev=findSemester(editing.semester); if(!prev) return;
    const idx=prev.mks.findIndex(m=>m.kode===editing.kode);
    if(idx===-1){ closeModal(); return; }
    if(!(editing.kode===kode && Number(editing.semester)===sem) && target.mks.some(m=>m.kode===kode)){
      alert('Kode MK sudah ada di semester tujuan'); return;
    }
    const obj={kode,nama,sks};
    if(Number(editing.semester)===sem) prev.mks[idx]=obj; else { prev.mks.splice(idx,1); target.mks.push(obj); }
    saveData(); closeModal(); renderDaftar(currentFilter); renderSemesters(); return;
  }


  if(target.mks.some(m=>m.kode===kode)){ alert('Kode MK sudah ada di semester tujuan'); return; }
  target.mks.push({kode,nama,sks}); saveData(); closeModal(); renderDaftar(currentFilter); renderSemesters();
}
function removeMK(semNo,kode){
  const s=findSemester(semNo); if(!s) return;
  const idx=s.mks.findIndex(m=>m.kode===kode); if(idx===-1) return;
  if(!confirm('Hapus mata kuliah '+s.mks[idx].nama+' dari Semester '+semNo+' ?')) return;
  s.mks.splice(idx,1); saveData(); renderDaftar(currentFilter); renderSemesters();
}


/* search */
function doSearch(q){
  currentFilter=null; showView('daftar');
  const cont=byId('mk-container'); cont.innerHTML='';
  const all=[]; semesters.forEach(s=>(s.mks||[]).forEach(mk=>all.push({...mk,semester:s.no})));
  const ql=(q||'').toLowerCase().trim();
  const res = ql ? all.filter(m=>(m.nama+m.kode+m.semester).toString().toLowerCase().includes(ql)) : all;
  if(res.length===0){ cont.innerHTML='<p class="muted">Tidak ada hasil.</p>'; return; }
  res.forEach(mk=>{
    const card=document.createElement('div'); card.className='mk-card';
    const actions=document.createElement('div'); actions.className='card-actions';
    const edit=document.createElement('button'); edit.className='icon-btn'; edit.title='Edit';
    edit.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21l3-1 11-11 1-3L14 4 3 15v6z" stroke="currentColor" stroke-width="1.4"/></svg>';
    edit.addEventListener('click',()=>openEdit(mk.kode,mk.semester));
    const del=document.createElement('button'); del.className='icon-btn icon-delete'; del.title='Hapus';
    del.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="1.6"/></svg>';
    del.addEventListener('click',()=>removeMK(mk.semester,mk.kode));
    actions.appendChild(edit); actions.appendChild(del);
    const title=document.createElement('div'); title.className='mk-title'; title.textContent=mk.nama;
    const sub=document.createElement('div'); sub.className='mk-sub'; sub.textContent=`${mk.kode} • SKS ${mk.sks} • S${mk.semester}`;
    card.appendChild(actions); card.appendChild(title); card.appendChild(sub); cont.appendChild(card);
  });
}



/* === IPK Chart (Chart.js) === */
const ipkData = {
  labels: ['Semester 1','Semester 2','Semester 3','Semester 4','Semester 5','Semester 6'],
  values: [3.15,3.22,3.30,3.35,3.40,3.45]
};
let ipkChart = null;

function getChartColors(){
  const isDark = document.documentElement.getAttribute('data-theme')==='dark';
  return {
    text: isDark ? '#e5e7eb' : '#0f172a',
    grid: isDark ? 'rgba(226,232,240,.15)' : 'rgba(15,23,42,.08)',
    line: isDark ? 'rgba(134,239,172,1)' : 'rgba(34,197,94,1)',
    fill: isDark ? 'rgba(134,239,172,.18)' : 'rgba(34,197,94,.18)'
  };
}

function renderIPK(){
  const el = document.getElementById('chartIPK');
  if(!el) return;
  const C = getChartColors();
  if(ipkChart){ ipkChart.destroy(); }
  ipkChart = new Chart(el, {
    type: 'line',
    data: {
      labels: ipkData.labels,
      datasets: [{
        label: 'IPK',
        data: ipkData.values,
        borderColor: C.line,
        backgroundColor: C.fill,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: C.text } },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: {
          grid: { color: C.grid },
          ticks: { color: C.text }
        },
        y: {
          beginAtZero: false,
          min: 2.5,
          max: 4,
          grid: { color: C.grid },
          ticks: { color: C.text }
        }
      }
    }
  });
}


/* events & init */
function attach(){
  document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',e=>{ e.preventDefault(); currentFilter=null; showView(a.dataset.target); }));
  byId('brand-btn').addEventListener('click',()=>{ currentFilter=null; showView('beranda'); });


  byId('open-create').addEventListener('click',openCreate);
  byId('modal-cancel').addEventListener('click',closeModal);
  byId('modal-save').addEventListener('click',modalSave);
  document.querySelector('[data-close="1"]').addEventListener('click',closeModal);
  document.addEventListener('keydown',e=>{ const m=byId('modal'); if(e.key==='Escape' && m.getAttribute('aria-hidden')==='false'){ closeModal(); } });


  byId('search-form').addEventListener('submit',(e)=>{ e.preventDefault(); doSearch(byId('global-search').value||''); });


  // Tema
  byId('theme-btn').addEventListener('click', ()=>{ toggleTheme(); renderIPK(); });
}
function init(){
  loadTheme();
  loadData();
  registerViews();
  fillSemOptions();
  renderSemesters();
  renderDaftar();
  attach();
  showView('beranda');
}
document.addEventListener('DOMContentLoaded', init);
// Tambahan fitur Tambah Semester


function addSemester(){
  let max = semesters.reduce((m,s)=>Math.max(m,s.no),0);
  let next = max+1;
  semesters.push({no:next, mks:[]});
  saveData();
  renderSemesters();
  fillSemOptions();
  alert('Semester '+next+' berhasil ditambahkan');
}


// Tambahkan tombol di Beranda
const berandaSection = document.getElementById('beranda');
if(berandaSection){
  const btn = document.createElement('button');
  btn.id='add-semester';
  btn.className='btn secondary';
  btn.textContent='+ Tambah Semester';
  btn.addEventListener('click', addSemester);
  berandaSection.insertBefore(btn, berandaSection.querySelector('.beranda-wrap'));
}