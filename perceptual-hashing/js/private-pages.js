const defaults={
 faculty:[
  ["How do I explain my research to faculty?","My research studies perceptual hashing for near-duplicate image detection. Unlike cryptographic hashing, perceptual hashing is designed so visually similar images can produce similar hash values even after normal changes such as compression or resizing. I will implement classical hashes such as AHash, DHash, PHash and WHash and test them under controlled image transformations. I will measure Hamming distance and detection performance as the transformation becomes stronger. The main research question is whether one threshold is suitable for all transformations or whether transformation-aware thresholds give better results. My output will be a reproducible benchmark, failure-boundary analysis and a practical threshold recommendation for near-duplicate detection."],
  ["What is the research question?","How robust are classical perceptual hashing algorithms when images undergo progressively stronger real-world transformations, and can transformation-aware similarity thresholds improve near-duplicate detection?"],
  ["What will I actually produce?","A Python implementation of AHash, DHash, PHash and optionally WHash; a controlled image-transformation generator; Hamming-distance measurements; precision, recall, F1 and threshold analysis; transformation-vs-distance graphs; a failure-boundary table; a global-vs-transformation-aware threshold comparison; and a reproducible GitHub repository."],
  ["What is the contribution?","The contribution is not a claim of inventing a new perceptual hash. It is a controlled robustness and failure-boundary study plus an experimentally derived threshold strategy." ]
 ],
 viva:[
  ["Why not SHA-256?","Cryptographic hashes are designed to change drastically after tiny input changes. Perceptual hashing instead aims for similarity under visually minor changes."],
  ["What is the DSA component?","Hash representation, binary strings, Hamming distance, indexing/search and complexity analysis."],
  ["What is your novelty?","Not a claim of inventing a new hash. The contribution is a controlled robustness/failure-boundary study plus an experimentally derived threshold strategy."],
  ["Why Hamming distance?","The hashes are binary strings, so Hamming distance directly counts differing bit positions."],
  ["What is a false positive?","An unrelated image incorrectly classified as a near duplicate."],
  ["What is a false negative?","A transformed version of the same image incorrectly rejected as not similar."],
  ["Why multiple transformations?","Real images can undergo compression, resizing, brightness changes, blur, rotation and cropping; robustness is transformation-dependent."],
  ["How will you avoid cherry-picking?","Predefine transformations, levels, dataset split, metrics and threshold-selection criteria before analyzing results."],
  ["What if PHash is not best?","That is still a valid result. The purpose is to measure the conditions under which each method works best."],
  ["Can this scale?","The hash is compact and fast to compare, making it useful as a candidate-filtering stage before more expensive image similarity methods."]
 ]
};
function getItems(kind){const key=`ph_${kind}_qa`;const saved=localStorage.getItem(key);if(saved){try{return JSON.parse(saved)}catch(e){}}return defaults[kind].map(([q,a])=>({q,a}));}
function saveItems(kind,items){localStorage.setItem(`ph_${kind}_qa`,JSON.stringify(items));}
function renderQA(kind){const root=document.getElementById("qaRoot"),items=getItems(kind);root.innerHTML=items.map((x,i)=>`<article class="qa-card editable-qa"><div class="qa-question">Q: ${esc(x.q)}</div><div class="qa-answer"><b>A:</b> ${esc(x.a)}</div><button class="delete-qa" onclick="deleteQA('${kind}',${i})">Delete</button></article>`).join("");document.getElementById("qaCount").textContent=`${items.length} items`;}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function showAdd(){document.getElementById("addQAForm").classList.remove("hidden");document.getElementById("questionInput").focus();}
function hideAdd(){document.getElementById("addQAForm").classList.add("hidden");document.getElementById("questionInput").value="";document.getElementById("answerInput").value="";}
function addQA(kind){const q=document.getElementById("questionInput").value.trim(),a=document.getElementById("answerInput").value.trim();if(!q||!a)return alert("Enter both the question and answer.");const items=getItems(kind);items.push({q,a});saveItems(kind,items);hideAdd();renderQA(kind);}
function deleteQA(kind,i){if(!confirm("Delete this Q&A item?"))return;const items=getItems(kind);items.splice(i,1);saveItems(kind,items);renderQA(kind);}
