const API_BASE = window.API_BASE || "/api";
const state = { status: {days:{}, papers:{}}, activeTimer:null, timerInterval:null };

const dayPlan = [
["Freeze scope, title, question and hypotheses.","Create the IEEE document skeleton and a one-page research brief. Write H1 and H2 exactly as defined in the research guide."],
["Learn perceptual hashing, cryptographic vs perceptual hashing and Hamming distance.","Write concept notes and viva answers. Be able to explain why SHA-256 is unsuitable for visual similarity."],
["Read the survey and state-of-the-art review first.","Create literature notes for at least 5–8 papers. Record the problem, method, result and relevance to your study."],
["Build the 25+ paper literature matrix.","Record author, year, hash type, application, dataset, transformations, distance metric, threshold method, metrics, result, limitation and research gap."],
["Study AHash, DHash, PHash and WHash conceptually.","Write algorithm notes and pseudocode. Understand what each hash represents and how its binary output is compared."],
["Set up Python and baseline hashing code.","Install Python 3.x, Pillow, ImageHash, NumPy, pandas, Matplotlib and optional scikit-learn. Get A/D/P/W hashes working on sample images."],
["Prepare the image dataset and document source/licensing.","Create originals/ and transformed/ folders, choose a reproducible dataset and record its source and license."],
["Implement image transformations.","Implement JPEG compression, resize, brightness, contrast, blur, Gaussian noise, rotation and crop at predefined strengths."],
["Implement Hamming distance and positive/negative pairs.","Build the experiment pipeline: original-vs-transformed positive pairs and unrelated-image negative pairs."],
["Run a small pilot experiment.","Test a small number of images and transformation levels. Verify hashes, distances, CSV output and metrics; record bugs."],
["Lock the experimental protocol.","Freeze image count, transformation levels, hash size, threshold range, metrics and threshold-selection criterion before final analysis."],
["Run compression, resize, brightness and contrast experiments.","Generate the raw CSV results and verify that every transformation level is represented for every hash."],
["Run blur, noise, rotation and crop experiments.","Generate the remaining raw CSV results and check for missing or invalid experiment records."],
["Run negative-pair experiments and threshold sweeps.","Plot positive/negative distance distributions, confusion matrices and threshold curves. Test the full threshold range rather than one arbitrary value."],
["Analyze robustness and failure boundaries.","Identify where each hash becomes unreliable under each transformation and prepare the main findings table."],
["Create final graphs and publication-ready tables.","Create transformation-vs-distance graphs, failure-boundary tables and global-vs-transformation-aware threshold comparisons."],
["Write Introduction, Related Work and Methodology.","Write the first IEEE draft using the structure: Introduction, Related Work, Background/Problem Definition and Methodology."],
["Write Results, Discussion, Limitations, Future Work and Conclusion.","Complete the draft using actual measured results. Explain unexpected findings instead of changing them to fit expectations."],
["Finish IEEE formatting and reference verification.","Move the paper into the official IEEE template, verify numbered citations, figure/table captions, equations and reproducibility details."],
["Proofread, verify citations and reproducibility; prepare faculty presentation.","Check every reference and result, verify the GitHub repository reproduces the experiment, and prepare final PDF plus viva/presentation notes."]
];

const dayDeliverables = ["One-page research brief with frozen title, research question and hypotheses.", "Concept notes and viva answers covering perceptual vs cryptographic hashing and Hamming distance.", "Literature notes for 5–8 papers.", "Author/year/method/dataset/gap literature matrix for 25+ papers.", "Algorithm notes and pseudocode for AHash, DHash, PHash and WHash.", "Working baseline hashing script.", "Reproducible dataset folder with source and license documentation.", "Working transformation generator.", "Experiment pipeline v1 with Hamming distance and positive/negative pair generation.", "Pilot results and a recorded bug list.", "Locked experiment protocol.", "Raw CSV results for compression, resize, brightness and contrast.", "Raw CSV results for blur, noise, rotation and crop.", "Confusion matrices, positive/negative distance distributions and threshold curves.", "Main robustness and failure-boundary findings table.", "Publication-ready figures and tables.", "First IEEE paper draft.", "Complete IEEE paper draft.", "IEEE-formatted draft with verified references and formatting.", "Final PDF, code and presentation/viva notes."];

function showToast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function loadStatus(){
  try{
    const r=await fetch(`${API_BASE}/status`);
    if(!r.ok) throw new Error("API unavailable");
    state.status=await r.json();
    document.getElementById("connectionBadge").textContent="API CONNECTED";
  }catch(e){
    state.status=JSON.parse(localStorage.getItem("ph_status")||'{"days":{},"papers":{}}');
    document.getElementById("connectionBadge").textContent="LOCAL STORAGE";
  }
  renderAll();
}
async function saveStatus(){
  localStorage.setItem("ph_status",JSON.stringify(state.status));
}
async function markPaperRead(id){
  state.status.papers[id]={...(state.status.papers[id]||{}),read:true,completedAt:new Date().toISOString()};
  try{await fetch(`${API_BASE}/reading`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paper_id:id,read:true})})}catch(e){}
  await saveStatus(); renderPapers(); updateSummary(); showToast(`Paper ${id} marked as read.`);
}
async function uploadDay(day,file){
  const mime=file.type;
  const ext=mime==="application/pdf"?".pdf":mime==="image/png"?".png":mime==="image/jpeg"?".jpg":".bin";
  if(!["application/pdf","image/png","image/jpeg"].includes(mime)){showToast("Only PDF, PNG or JPG files are accepted.");return}
  try{
    const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]);r.onerror=reject;r.readAsDataURL(file);});
    const r=await fetch(`${API_BASE}/upload`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({day,filename:file.name,mime,data:base64})});
    if(!r.ok)throw new Error("Upload failed");
    const data=await r.json();
    state.status.days[day]={submitted:true,name:data.name||`day_${day}_work${ext}`,uploadedAt:new Date().toISOString()};
    await saveStatus();renderDays();updateSummary();showToast(`Day ${day} uploaded successfully.`);
  }catch(e){
    try{await idbSave(`day_${day}_work${ext}`,file);state.status.days[day]={submitted:true,name:`day_${day}_work${ext}`,uploadedAt:new Date().toISOString(),localOnly:true};await saveStatus();renderDays();updateSummary();showToast(`Day ${day} saved in this browser.`)}
    catch(err){showToast("Upload failed. Check your Netlify Functions configuration.")}
  }
}


const IMPLEMENTATION_UNLOCK_DAY = 6;
const IEEE_UNLOCK_DAY = 17;
let selectedPaperForNotes = null;

function completedDays(){
  return Object.values(state.status.days || {}).filter(x=>x.submitted).length;
}
function paperNotesMap(){
  state.status.paperNotes = state.status.paperNotes || {};
  return state.status.paperNotes;
}
function localPrivate(){
  return JSON.parse(localStorage.getItem("ph_private_notes") || '{"explanation":"","questions":""}');
}
function savePrivateLocal(data){ localStorage.setItem("ph_private_notes", JSON.stringify(data)); }

function updateLocks(){
  const days = completedDays();
  const impl = document.getElementById("implementationNav");
  const yellow = document.getElementById("yellowNav");
  const ieee = document.getElementById("ieeeNav");
  impl.disabled = days < IMPLEMENTATION_UNLOCK_DAY;
  yellow.disabled = days < IEEE_UNLOCK_DAY;
  ieee.disabled = days < IEEE_UNLOCK_DAY;
  document.getElementById("implementationLock").textContent = days >= IMPLEMENTATION_UNLOCK_DAY ? "UNLOCKED" : "LOCKED • Day 6";
  document.getElementById("yellowLock").textContent = days >= IEEE_UNLOCK_DAY ? "UNLOCKED" : "LOCKED • Day 17";
  document.getElementById("ieeeLock").textContent = days >= IEEE_UNLOCK_DAY ? "UNLOCKED" : "LOCKED • Day 17";
}
function normalizePaperNotes(id){
  const map=paperNotesMap();
  const raw=map[id];
  if(Array.isArray(raw)) return raw;
  if(typeof raw === "string" && raw.trim()) return [{text:raw,createdAt:new Date().toISOString()}];
  map[id]=[]; return map[id];
}
function showPaperNotes(id){
  const p=papers.find(x=>x.id===id); if(!p)return;
  const card=document.getElementById(`notes-${id}`);
  if(card) card.classList.toggle("hidden");
}
async function addPaperNote(id){
  const input=document.getElementById(`note-input-${id}`);
  const text=(input?.value||"").trim();
  if(!text){showToast("Write a note before saving.");return;}
  const notes=normalizePaperNotes(id);
  notes.push({text,createdAt:new Date().toISOString()});
  paperNotesMap()[id]=notes;
  await saveStatus();
  try{await fetch(`${API_BASE}/reading`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paper_id:id,notes})})}catch(e){}
  input.value=""; renderPapers();
  const card=document.getElementById(`notes-${id}`); if(card) card.classList.remove("hidden");
  showToast(`Note saved for Paper ${id}.`);
}
async function deletePaperNote(id,index){
  const notes=normalizePaperNotes(id); notes.splice(index,1); paperNotesMap()[id]=notes;
  await saveStatus();
  try{await fetch(`${API_BASE}/reading`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paper_id:id,notes})})}catch(e){}
  renderPapers(); document.getElementById(`notes-${id}`)?.classList.remove("hidden");
}
function renderImplementation(){
  const box=document.getElementById("implementationContent");
  if(completedDays()<IMPLEMENTATION_UNLOCK_DAY){
    box.innerHTML=`<div class="lock-icon">🔒</div><h3>Implementation Plan Locked</h3><p>Complete ${IMPLEMENTATION_UNLOCK_DAY} day submissions to unlock this section.</p>`; return;
  }
  box.className="card";
  box.innerHTML=`
  <div class="card-title"><span>Research → Python Implementation Pipeline</span><span class="tag">UNLOCKED</span></div>
  <div class="pipeline"><div>Dataset<br><b>Original images</b></div><i>→</i><div>Transform<br><b>JPEG / Resize / Blur</b></div><i>→</i><div>Hash<br><b>A/D/P/W</b></div><i>→</i><div>Hamming<br><b>Distance</b></div><i>→</i><div>Threshold<br><b>Decision</b></div><i>→</i><div>Metrics<br><b>F1 / Precision / Recall</b></div></div>
  <div class="grid two">
    <article class="card"><div class="card-title"><span>Libraries</span></div><ul class="clean-list"><li>Python 3.x</li><li>Pillow — image loading and transformations</li><li>ImageHash — AHash, DHash, PHash, WHash</li><li>NumPy — numerical operations</li><li>pandas — experiment tables / CSV</li><li>Matplotlib — research graphs</li><li>scikit-learn — metrics and threshold analysis</li></ul></article>
    <article class="card"><div class="card-title"><span>Recommended research file structure</span></div><pre class="code-box">research/
├── data/
│   ├── originals/
│   └── transformed/
├── src/
│   ├── hashing.py
│   ├── transforms.py
│   ├── distance.py
│   ├── experiments.py
│   └── metrics.py
├── results/
│   ├── csv/
│   └── figures/
├── notebooks/
└── README.md</pre></article>
  </div>
  <article class="card"><div class="card-title"><span>Experiments to run</span></div><ol class="clean-list"><li>JPEG compression: quality 90, 70, 50, 30, 10.</li><li>Resize: 90%, 75%, 50%, 25%.</li><li>Brightness: ±10, ±20, ±40, ±60.</li><li>Contrast: 0.7, 0.85, 1.15, 1.3.</li><li>Blur: small → strong Gaussian blur.</li><li>Noise: low → high Gaussian noise.</li><li>Rotation: 1°, 3°, 5°, 10°, 20°.</li><li>Crop: 5%, 10%, 20%, 30%.</li><li>Positive vs negative distance distributions.</li><li>Global vs transformation-aware threshold selection.</li></ol></article>
  <article class="card"><div class="card-title"><span>Research discipline</span></div><p>Predefine image count, transformation levels, hash size, threshold range and metrics before looking at final results. Save raw CSV data so every graph can be reproduced. Do not claim a new hashing algorithm; the contribution is the controlled robustness/failure-boundary study and threshold strategy.</p></article>`;
}
function renderIEEE(){
  const box=document.getElementById("ieeeContent");
  if(completedDays()<IEEE_UNLOCK_DAY){box.innerHTML=`<div class="lock-icon">🔒</div><h3>IEEE Guide Locked</h3><p>Complete ${IEEE_UNLOCK_DAY} day submissions to unlock the paper-writing guide.</p>`;return;}
  box.className="card";
  box.innerHTML=`<div class="card-title"><span>IEEE Conference Paper Guide</span><span class="tag">CURRENT GUIDANCE</span></div>
  <p>Use the official IEEE conference template. Keep the title specific and descriptive, write a self-contained abstract up to 250 words, include 3–5 keywords, use numbered citations, and keep the methodology reproducible. Exact page limits and submission rules come from the target conference.</p>
  <div class="grid two"><article class="card"><div class="card-title"><span>Recommended structure</span></div><ol class="clean-list"><li>Title</li><li>Authors and affiliations</li><li>Abstract</li><li>Keywords</li><li>I. Introduction</li><li>II. Related Work / Literature Review</li><li>III. Background and Problem Definition</li><li>IV. Proposed Experimental Framework / Methodology</li><li>V. Experimental Setup</li><li>VI. Results and Analysis</li><li>VII. Discussion</li><li>VIII. Limitations and Future Work</li><li>IX. Conclusion</li><li>References</li></ol></article>
  <article class="card"><div class="card-title"><span>Formatting checklist</span></div><ul class="clean-list"><li>Official IEEE Word/LaTeX template.</li><li>Numbered citations such as [1], [2], [3]–[5].</li><li>Figure captions below figures; table titles above tables.</li><li>Reference every figure/table in the text.</li><li>Record dataset size, sources, transformation strengths, hash size, thresholds and software versions.</li><li>Do not fabricate references, datasets or results.</li><li>Every reference-list entry should be cited and every in-text citation should appear in the references.</li></ul></article></div>
  <article class="card"><div class="card-title"><span>Recommended final paper story</span></div><p>Problem → why ordinary/cryptographic hashing is not appropriate for visual similarity → perceptual hashing → existing methods → known robustness problem → research gap → controlled transformation framework → experimental results → failure boundaries → threshold analysis → practical recommendation → limitations → future work.</p></article>
  <article class="card"><div class="card-title"><span>Deliverables</span></div><div class="chips"><span>Final paper PDF</span><span>Editable IEEE source</span><span>Python source</span><span>requirements.txt</span><span>Dataset/source documentation</span><span>Raw CSV</span><span>Processed tables</span><span>Final figures</span><span>25+ paper matrix</span><span>Viva notes</span><span>Reproducibility README</span></div></article>`;
}
function renderPapers(){
  const el=document.getElementById("papersList");
  el.innerHTML=papers.map(p=>{
    const done=!!state.status.papers[p.id]?.read;
    return `<article class="paper ${done?"read":""}" role="link" tabindex="0" onclick="openPaperPage(${p.id})" onkeydown="if(event.key===\"Enter\"||event.key===\" \"){openPaperPage(${p.id})}">
      <div class="paper-number">${p.id}</div>
      <div class="paper-content"><div class="paper-heading"><h3>${escapeHtml(p.title)}</h3><span class="year-badge">${p.year}</span></div><p>${escapeHtml(p.about)}</p></div>
      <div class="paper-card-action">${done?'<span class="done">✓ READ</span>':'<span class="tag">OPEN</span>'}<span class="arrow">→</span></div>
    </article>`;
  }).join("");
}
function openPaperPage(id){ window.location.href=`paper.html?id=${encodeURIComponent(id)}`; }
function renderDays(){
  const el=document.getElementById("daysList");
  el.innerHTML=dayPlan.map((d,i)=>{
    const n=i+1, st=state.status.days[n]||{};
    const unlocked = n===1 || !!state.status.days[n-1]?.submitted;
    const locked = !unlocked;
    return `<article class="day ${st.submitted?"submitted":""} ${locked?"locked":""}" role="${unlocked?"link":"article"}" tabindex="${unlocked?"0":"-1"}" ${unlocked?`onclick="openDayPage(${n})" onkeydown="if(event.key===\"Enter\"||event.key===\" "){openDayPage(${n})}"`:"aria-disabled=\"true\""}>
      <div class="day-top day-card-link">
        <div class="day-num">${String(n).padStart(2,"0")}</div>
        <div class="day-heading"><h3>Day ${n}</h3><p>${escapeHtml(d[0])}</p></div>
        <div class="day-status">${st.submitted?'<span class="done">✓ DONE</span>':locked?'<span class="tag lock-tag">🔒 LOCKED</span>':'<span class="tag">READY</span>'}${unlocked?'<span class="arrow">→</span>':'<span class="lock-mini">🔒</span>'}</div>
      </div>
    </article>`;
  }).join("");
  updateLocks();
}
function openDayPage(n){ window.location.href=`day.html?id=${encodeURIComponent(n)}`; }
function renderAll(){renderPapers();renderDays();updateSummary(); const requested=(location.hash||"").replace("#",""); navigate(["papers","days","implementation","ieee"].includes(requested)?requested:"home");}
function updateSummary(){
  const read=Object.values(state.status.papers).filter(x=>x.read).length;
  const days=Object.values(state.status.days).filter(x=>x.submitted).length;
  document.getElementById("papersReadCount").textContent=`${read} / 25`;
  document.getElementById("daysDoneCount").textContent=`${days} / 20`;
  document.getElementById("paperProgress").textContent=`${read} / 25`;
  document.getElementById("dayProgress").textContent=`${days} / 20`;
  const pct=Math.round((days/20)*100);
  document.getElementById("overallProgressText").textContent=`${pct}%`;
  document.getElementById("overallProgressBar").style.width=`${pct}%`;
  document.getElementById("ieeeStatus").textContent=days<17?`Day ${Math.max(1,days+1)}`:"Drafting";
  updateLocks();
  renderImplementation();
  renderIEEE();
}
function navigate(page){
  const days=completedDays();
  if(page==="workspace"){window.location.href="private.html";return;}
  if(page==="implementation" && days<IMPLEMENTATION_UNLOCK_DAY){showToast("Green stage unlocks on Day 6.");return;}
  if((page==="yellow" || page==="ieee") && days<IEEE_UNLOCK_DAY){showToast("Yellow / Blue stages unlock on Day 17.");return;}
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  document.getElementById(page+"Page").classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  document.getElementById("pageTitle").textContent=page==="home"?"Project Overview":page==="papers"?"Research Papers":page==="days"?"Research Roadmap":page==="workspace"?"Research Workspace":page==="implementation"?"Green":page==="yellow"?"Yellow":"Blue";
  document.getElementById("sidebar").classList.remove("open");
  if(page==="papers")renderPapers(); if(page==="days")renderDays();
  window.scrollTo({top:0,behavior:"smooth"});
}
function openPaper(id){
  const p=papers.find(x=>x.id===id); if(!p)return;
  if(state.activeTimer)clearInterval(state.activeTimer);
  window.open(p.url,"_blank","noopener,noreferrer");
  let elapsed=0;
  state.activeTimer=setInterval(()=>{
    elapsed++;
    const remain=Math.max(0,900-elapsed),m=Math.floor(remain/60),s=remain%60;
    const timer=document.getElementById(`timer-${id}`);
    if(timer)timer.textContent=remain>0?`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:"✓ 15 MIN";
    if(remain===0){clearInterval(state.activeTimer);state.activeTimer=null;markPaperRead(id);}
  },1000);
  showToast("Paper opened in a new tab. Keep it open while you read.");
}
function handleFile(day,file){ if(file) uploadDay(day,file); }
async function idbSave(name,file){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open("phResearchFiles",1);
    req.onupgradeneeded=()=>req.result.createObjectStore("files");
    req.onsuccess=()=>{const db=req.result,tx=db.transaction("files","readwrite");tx.objectStore("files").put(file,name);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)};
    req.onerror=()=>reject(req.error);
  });
}
document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
document.getElementById("menuBtn").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));

function toggleSidebar(){
  document.body.classList.toggle("sidebar-collapsed");
  const collapsed=document.body.classList.contains("sidebar-collapsed");
  const toggle=document.getElementById("sidebarToggle");
  if(toggle) toggle.textContent=collapsed?"›":"‹";
}
// PH is the sidebar control. It does NOT open the hidden/private area.
document.getElementById("sidebarToggle").addEventListener("click",toggleSidebar);
function openHiddenStudyArea(){ if(!document.body.contains(document.getElementById("homePage"))) return; window.location.href="private.html"; }
document.addEventListener("keydown",e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==="l"){e.preventDefault();openHiddenStudyArea();}});

loadStatus();
