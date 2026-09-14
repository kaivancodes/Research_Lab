const API_BASE = window.API_BASE || "/api";
const params = new URLSearchParams(location.search);
const id = Number(params.get("id"));
const day = dayPlan[id-1];
let status = {days:{},papers:{},paperNotes:{}};
const key="ph_status";
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
async function load(){
  try{const r=await fetch(`${API_BASE}/status`);if(!r.ok)throw 0;status=await r.json();}
  catch(e){status=JSON.parse(localStorage.getItem(key)||'{"days":{},"papers":{},"paperNotes":{}}');}
  status.days=status.days||{}; render();
}
function render(){
 const root=document.getElementById("dayPage");
 if(!day){root.innerHTML='<section class="card"><h2>Day not found</h2><p>Return to the 20-Day Work Tracker and select a valid day.</p></section>';return;}
 const previousSubmitted = id===1 || !!status.days[id-1]?.submitted;
 if(!previousSubmitted){
   root.innerHTML=`<section class="card locked-day-page">
     <div class="paper-page-number">DAY ${String(id).padStart(2,"0")}</div>
     <h1>Day ${id} is locked</h1>
     <p>You must upload the document for Day ${id-1} before Day ${id} can be opened.</p>
     <a class="primary nav-button-link" href="index.html#days">← Back to 20-Day Work Tracker</a>
   </section>`;
   return;
 }
 const st=status.days[id]||{};
 root.innerHTML=`
 <section class="card day-detail-hero">
   <div class="paper-page-number">DAY ${String(id).padStart(2,"0")}</div>
   <div class="paper-page-heading"><h1>Day ${id} — ${esc(day[0])}</h1>${st.submitted?'<span class="done">✓ DONE</span>':'<span class="tag">PENDING</span>'}</div>
 </section>
 <section class="card today-work-card">
   <div class="card-title"><span>Today's Work</span><span class="tag">DAY ${id}</span></div>
   <div class="detail-instruction"><h3>Exact instructions</h3><p>${esc(day[1])}</p></div>
   <div class="detail-instruction"><h3>Expected output</h3><p>${esc(day[2])}</p></div>
 </section>
 <section class="card upload-detail-card">
   <div class="card-title"><span>Upload Today's Work</span><span class="tag">RECORD</span></div>
   <p>Upload your screenshot, notes, result or PDF. The file is recorded as <b>day_${id}_work</b>.</p>
   <div class="upload-row"><label class="upload-label" for="dayFile">＋ Upload work</label><input class="file-input" id="dayFile" type="file" accept=".pdf,.png,.jpg,.jpeg"><span class="filename">${st.submitted?esc(st.name):"PDF / PNG / JPG"}</span></div>
   ${st.submitted?`<div class="submitted-file">✓ Saved as <b>${esc(st.name)}</b>${st.localOnly?" • browser storage":""}</div>`:""}
   <div id="uploadProgress" class="upload-progress"></div>
 </section>
 ${dayNavigation()}`;
 document.getElementById("dayFile")?.addEventListener("change",e=>uploadDay(e.target.files[0]));
}
function dayNavigation(){
 const prev=id>1?`<a class="sequence-nav prev" href="day.html?id=${id-1}">← Day ${id-1}</a>`:"<span class=\"sequence-nav-placeholder\"></span>";
 const next=id<dayPlan.length?`<a class="sequence-nav next" href="day.html?id=${id+1}">Day ${id+1} →</a>`:"<span class=\"sequence-nav-placeholder\"></span>";
 return `<nav class="sequence-navigation" aria-label="Day navigation">${prev}${next}</nav>`;
}
async function saveLocal(file){
 return new Promise((resolve,reject)=>{const req=indexedDB.open("phResearchFiles",1);req.onupgradeneeded=()=>req.result.createObjectStore("files");req.onsuccess=()=>{const db=req.result,tx=db.transaction("files","readwrite");tx.objectStore("files").put(file,`day_${id}_work`);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)};req.onerror=()=>reject(req.error)});
}
async function uploadDay(file){
 if(!file)return;
 const allowed=["application/pdf","image/png","image/jpeg"];
 if(!allowed.includes(file.type)){toast("Only PDF, PNG or JPG files are accepted.");return;}
 const progress=document.getElementById("uploadProgress"); if(progress)progress.textContent="Uploading…";
 const ext=file.type==="application/pdf"?".pdf":file.type==="image/png"?".png":".jpg";
 try{
  const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(",")[1]);r.onerror=reject;r.readAsDataURL(file);});
  const r=await fetch(`${API_BASE}/upload`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({day:id,filename:file.name,mime:file.type,data:base64})});
  if(!r.ok)throw 0; const data=await r.json();
  status.days[id]={submitted:true,name:data.name||`day_${id}_work${ext}`,uploadedAt:new Date().toISOString()};
  localStorage.setItem(key,JSON.stringify(status));render();toast(`Day ${id} uploaded successfully.`);
 }catch(e){
  try{await saveLocal(file);status.days[id]={submitted:true,name:`day_${id}_work${ext}`,uploadedAt:new Date().toISOString(),localOnly:true};localStorage.setItem(key,JSON.stringify(status));render();toast(`Day ${id} saved in this browser.`)}
  catch(err){if(progress)progress.textContent="Upload failed. Check Netlify Functions configuration.";}
 }
}
load();
