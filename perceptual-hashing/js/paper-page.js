const API_BASE = window.API_BASE || "/api";
const params = new URLSearchParams(location.search);
const id = Number(params.get("id"));
const paper = papers.find(p => p.id === id);
const statusKey = "ph_status";
let status = {days:{},papers:{},paperNotes:{}};
let noteFormVisible = false;
let timer = null;
let elapsed = 0;

function esc(s){return String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function notes(){status.paperNotes=status.paperNotes||{}; const raw=status.paperNotes[String(id)]; if(Array.isArray(raw))return raw; if(typeof raw==="string"&&raw.trim())return [{text:raw,createdAt:new Date().toISOString()}]; status.paperNotes[String(id)]=[]; return status.paperNotes[String(id)];}
async function persist(){localStorage.setItem(statusKey,JSON.stringify(status)); try{await fetch(`${API_BASE}/reading`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paper_id:id,notes:notes()})})}catch(e){} }
async function load(){
  try{const r=await fetch(`${API_BASE}/status`); if(r.ok) status=await r.json(); else throw 0;}catch(e){status=JSON.parse(localStorage.getItem(statusKey)||'{"days":{},"papers":{},"paperNotes":{}}');}
  status.days=status.days||{};status.papers=status.papers||{};status.paperNotes=status.paperNotes||{};
  render();
}
function render(){
  if(!paper){document.getElementById("paperPage").innerHTML='<div class="card"><h2>Paper not found</h2><p>Return to the Research Papers page and select a valid paper.</p></div>';return;}
  const done=!!status.papers[id]?.read;
  const ns=notes();
  document.getElementById("paperPage").innerHTML=`
    <section class="card paper-hero-card">
      <div class="paper-page-number">PAPER ${String(paper.id).padStart(2,"0")}</div>
      <div class="paper-page-heading"><h1>${esc(paper.title)}</h1><span class="year-badge">${paper.year}</span></div>
      <div class="paper-meta-line">${done?'<span class="done">✓ READING COMPLETED</span>':'<span class="tag">READING IN PROGRESS</span>'}</div>
    </section>
    <section class="paper-info-grid">
      <article class="card"><div class="card-title"><span>What is this paper about?</span><span class="tag">ABOUT</span></div><p>${esc(paper.about)}</p></article>
      <article class="card"><div class="card-title"><span>Why is it useful for our research?</span><span class="tag">RELEVANCE</span></div><p>${esc(paper.use)}</p></article>
    </section>
    <section class="card paper-reading-actions">
      <div><div class="card-title"><span>Read the paper</span><span id="timer" class="paper-timer">${done?'✓ READ':'15:00'}</span></div><p>Use the button below to open the paper in a separate browser tab. The research site will handle the PDF/source page instead of an embedded viewer, avoiding the blank-PDF problem.</p></div>
      <div class="action-row"><button class="primary" onclick="openPaper()">Open PDF</button><button class="secondary" onclick="toggleNotes()">＋ Add Notes</button><a class="secondary" href="index.html#papers">Back to 25 Papers</a></div>
    </section>
    <section class="card notes-panel ${noteFormVisible?'show-form':''}" id="notesPanel">
      <div class="card-title"><span>My Notes</span><span class="tag">${ns.length} SAVED</span></div>
      <div id="savedNotes">${ns.length?ns.map((n,i)=>`<div class="saved-note"><div><span class="note-number">Note ${i+1}</span><div>${esc(n.text).replace(/\n/g,"<br>")}</div></div><button onclick="deleteNote(${i})">Delete</button></div>`).join(""):'<p class="empty-notes">No notes saved for this paper yet. Click “Add Notes” when you are ready.</p>'}</div>
      <div id="noteComposer" class="note-composer ${noteFormVisible?'':'hidden'}">
        <textarea id="noteInput" class="paper-note-input" placeholder="Write your note about this paper..."></textarea>
        <div class="action-row"><button class="primary" onclick="saveNote()">Save Note</button><button class="secondary" onclick="toggleNotes(false)">Cancel</button></div>
      </div>
    </section>
    ${paperNavigation()}`;
}
function paperNavigation(){
 const prev=id>1?`<a class="sequence-nav prev" href="paper.html?id=${id-1}">← Previous Paper</a>`:"<span class=\"sequence-nav-placeholder\"></span>";
 const next=id<papers.length?`<a class="sequence-nav next" href="paper.html?id=${id+1}">Next Paper →</a>`:"<span class=\"sequence-nav-placeholder\"></span>";
 return `<nav class="sequence-navigation" aria-label="Research paper navigation">${prev}${next}</nav>`;
}
function openPaper(){
  if(!paper)return;
  window.open(paper.url,"_blank","noopener,noreferrer");
  startTimer();
  toast("The paper/source opened in a new tab.");
}
function startTimer(){
  if(timer)return; elapsed=0; timer=setInterval(()=>{elapsed++;const remain=Math.max(0,900-elapsed),m=Math.floor(remain/60),s=remain%60;const el=document.getElementById("timer");if(el)el.textContent=remain?`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:"✓ 15 MIN";if(!remain){clearInterval(timer);timer=null;markRead();}},1000);
}
async function markRead(){status.papers[id]={...(status.papers[id]||{}),read:true,completedAt:new Date().toISOString()};localStorage.setItem(statusKey,JSON.stringify(status));try{await fetch(`${API_BASE}/reading`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paper_id:id,read:true})})}catch(e){}render();toast("15-minute reading completed.");}
function toggleNotes(show){noteFormVisible=typeof show==="boolean"?show:!noteFormVisible;render();if(noteFormVisible)setTimeout(()=>document.getElementById("noteInput")?.focus(),50);}
async function saveNote(){const input=document.getElementById("noteInput"),text=(input?.value||"").trim();if(!text){toast("Write a note before saving.");return;}notes().push({text,createdAt:new Date().toISOString()});await persist();noteFormVisible=false;render();toast("Note saved for this paper.");}
async function deleteNote(index){const ns=notes();if(!confirm("Delete this note?"))return;ns.splice(index,1);await persist();render();toast("Note deleted.");}
load();
