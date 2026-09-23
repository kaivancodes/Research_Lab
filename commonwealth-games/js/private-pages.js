const defaults={
 faculty:[
  ['How do I explain this research?','This research builds a structured evidence-analysis system for Commonwealth Games 2030 opinions. It combines literature, text collection, preprocessing, semantic grouping, sentiment/aspect analysis, contextual weighting and graph-based summarization so that diverse evidence can be analyzed systematically.'],
  ['What is the research question?','Considering opinions of citizens, Indian and international audiences, experts, officials and governing bodies, what are the major perceived benefits and risks of hosting the 2030 Commonwealth Games in Ahmedabad, and what patterns emerge from the collected evidence?'],
  ['What is the contribution?','The contribution is a reproducible pipeline that combines semantic opinion grouping, contextual evidence weighting and redundancy-aware graph summarization for this research setting.'],
  ['What should I avoid claiming?','Do not present a predicted public perception or invented results. Findings must come from the collected evidence and completed experiments.']
 ],
 viva:[
  ['Why use semantic grouping?','Exact duplicate removal alone cannot handle paraphrases. Semantic grouping can reduce redundancy while preserving the prevalence of an opinion cluster.'],
  ['Why keep source and stakeholder metadata?','The same statement can have different context depending on its source, stakeholder, location and authority. Metadata supports contextual analysis.'],
  ['What is the role of sentiment analysis?','It provides a structured polarity signal for the collected text, which can then be analyzed by aspect and context.'],
  ['Why use graph-based summarization?','A graph can represent relationships among candidate sentences or opinions and support relevance ranking while a redundancy-control step avoids repetitive summaries.']
 ]
};
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function key(kind){return `cw_${kind}_qa_v3`}
function getItems(kind){try{const x=JSON.parse(localStorage.getItem(key(kind)));if(Array.isArray(x))return x}catch{}return defaults[kind].map(([q,a])=>({q,a}))}
function saveItems(kind,items){localStorage.setItem(key(kind),JSON.stringify(items))}
function render(kind){const root=document.getElementById(kind==='faculty'?'facultyRoot':'vivaRoot');const items=getItems(kind);root.innerHTML=`<div class="qa-actions"><button class="primary" onclick="showAdd('${kind}')">+ Add Q&amp;A</button><span>${items.length} items</span></div>${items.map((x,i)=>`<article class="qa-card editable-qa"><div class="qa-question">Q: ${esc(x.q)}</div><div class="qa-answer"><b>A:</b> ${esc(x.a)}</div><div class="qa-card-actions"><button class="btn" onclick="editQA('${kind}',${i})">Edit</button><button class="delete-qa" onclick="deleteQA('${kind}',${i})">Delete</button></div></article>`).join('')}`}
function showAdd(kind){const q=prompt('Question:','');if(q===null||!q.trim())return;const a=prompt('Answer:','');if(a===null||!a.trim())return;const items=getItems(kind);items.push({q:q.trim(),a:a.trim()});saveItems(kind,items);render(kind)}
function editQA(kind,i){const items=getItems(kind);const q=prompt('Edit question:',items[i].q);if(q===null)return;const a=prompt('Edit answer:',items[i].a);if(a===null)return;items[i]={q:q.trim(),a:a.trim()};saveItems(kind,items);render(kind)}
function deleteQA(kind,i){if(!confirm('Delete this Q&A item?'))return;const items=getItems(kind);items.splice(i,1);saveItems(kind,items);render(kind)}
render(location.pathname.endsWith('faculty.html')?'faculty':'viva');
