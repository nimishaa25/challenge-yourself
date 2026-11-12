const $=id=>document.getElementById(id),KEY='challenge-yourself-v1';let data=JSON.parse(localStorage.getItem(KEY)||'[]'),tab='today',installPrompt=null;
const save=()=>localStorage.setItem(KEY,JSON.stringify(data)),now=()=>Date.now(),dur=d=>d==='Difficult'?48*3600000:24*3600000;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function clock(ms){ms=Math.max(0,ms);let h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);return [h,m,s].map(n=>String(n).padStart(2,'0')).join(':')}
function elapsed(ms){ms=Math.max(0,ms);let h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);if(h)return `${h}h ${m}m ${s}s`;if(m)return `${m}m ${s}s`;return `${s}s`}
function expire(){let changed=false;data.forEach(x=>{if(x.status==='active'&&now()>=x.deadline){x.status='expired';changed=true}});if(changed)save()}
function card(x){
 const left=x.deadline-now(),pct=x.status==='completed'?100:x.status==='expired'?0:Math.max(0,Math.min(100,(1-left/dur(x.difficulty))*100));
 const state=x.status==='active'?`<b class="countdown">${clock(left)}</b> remaining`:x.status==='completed'?`Completed in <b>${elapsed(x.elapsedMs??((x.completedAt||now())-x.createdAt))}</b>`:'Time expired';
 const buttons=x.status==='active'?`<button class="small ok" data-act="complete" data-id="${x.id}">Mark complete ✓</button>`:x.status==='expired'?`<button class="small ok" data-act="restart" data-id="${x.id}">↻ Restart</button>`:'';
 return `<article class="card"><div class="cardtop"><div class="cardname">${esc(x.title)}</div><span class="pill ${x.status==='active'?x.difficulty.toLowerCase():x.status}">${x.status==='active'?x.difficulty:x.status}</span></div><div class="meta"><span>${state}</span><span>${x.difficulty} · ${x.difficulty==='Difficult'?48:24}h limit</span></div><div class="track"><div class="fill" style="width:${pct}%"></div></div><div class="actions">${buttons}<button class="small" data-detail="${x.id}">Details</button></div></article>`
}
function render(){
 expire();let a=data.filter(x=>x.status==='active'),e=data.filter(x=>x.status==='expired'),d=data.filter(x=>x.status==='completed'),r=d.filter(x=>x.reward);
 $('activeN').textContent=a.length;$('doneN').textContent=d.length;$('rewardN').textContent=r.length;$('rewardBadge').textContent=r.length;
 $('date').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
 $('activeList').innerHTML=a.map(card).join('');$('expiredList').innerHTML=e.map(card).join('');
 $('historyList').innerHTML=[...d,...e].sort((x,y)=>(y.completedAt||y.createdAt)-(x.completedAt||x.createdAt)).map(card).join('');
 $('rewardsList').innerHTML=r.map(x=>`<article class="card"><div class="cardname">♢ &nbsp;${esc(x.reward)}</div><p class="detailcopy">Unlocked for completing “${esc(x.title)}”</p></article>`).join('');
 $('emptyActive').hidden=!!a.length;$('expiredWrap').hidden=!e.length;$('emptyHistory').hidden=!!(d.length+e.length);$('emptyRewards').hidden=!!r.length;
 document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!==tab);document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('selected',b.dataset.tab===tab));
 document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>act(b.dataset.act,b.dataset.id));document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>detail(b.dataset.detail));
}
function act(action,id){
 let x=data.find(v=>v.id===id);if(!x)return;
 if(action==='complete'){x.status='completed';x.completedAt=now();x.elapsedMs=x.completedAt-x.createdAt;}
 else{x.status='active';x.createdAt=now();x.deadline=now()+dur(x.difficulty);delete x.completedAt;delete x.elapsedMs;}
 save();render()
}
function detail(id){
 let x=data.find(v=>v.id===id);$('detailTitle').textContent=x.title;
 let timing=x.status==='active'?`<div class="rewardbox"><label>COUNTDOWN</label><strong class="countdown">${clock(x.deadline-now())}</strong><small>Time remaining in this challenge</small></div>`:x.status==='completed'?`<div class="rewardbox"><label>YOUR COMPLETION TIME</label><strong>${elapsed(x.elapsedMs??((x.completedAt||now())-x.createdAt))}</strong><small>Time from starting the challenge until you completed it</small></div>`:`<div class="rewardbox"><label>STATUS</label><strong>Expired</strong><small>You can restart this challenge to try again.</small></div>`;
 $('detailBody').innerHTML=`<p class="detailcopy">${x.difficulty} challenge · ${x.status} · ${x.difficulty==='Difficult'?48:24} hour time limit</p>${timing}${x.reward?`<div class="rewardbox"><label>PERSONAL REWARD</label><strong>${esc(x.reward)}</strong><small>${x.status==='completed'?'♢ Unlocked — you earned it!':'🔒 Locked until you complete this challenge.'}</small></div>`:''}<p class="detailcopy">Started ${new Date(x.createdAt).toLocaleString()}${x.status==='active'?'<br>Deadline '+new Date(x.deadline).toLocaleString():''}</p>`;
 $('detail').showModal()
}
function create(e){
 e.preventDefault();let title=$('title').value.trim();if(!title)return;
 let difficulty=document.querySelector('[name=difficulty]:checked').value,t=now();
 data.unshift({id:crypto.randomUUID?crypto.randomUUID():String(t)+Math.random(),title,difficulty,reward:$('reward').value.trim(),createdAt:t,deadline:t+dur(difficulty),status:'active'});
 save();$('form').reset();$('create').close();tab='today';render()
}
function openCreate(){$('create').showModal()}
$('new').onclick=$('emptyNew').onclick=openCreate;$('close').onclick=()=>$('create').close();$('closeDetail').onclick=()=>$('detail').close();
$('form').onsubmit=create;document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
$('mic').onclick=()=>{let SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){$('voiceNote').textContent='Voice input is not supported by this browser. Please type your challenge instead.';return}let rec=new SR();rec.lang=navigator.language||'en-IN';rec.onstart=()=>$('voiceNote').textContent='Listening… speak your challenge.';rec.onresult=e=>{$('title').value=e.results[0][0].transcript;$('voiceNote').textContent='Speech added. You can edit it before saving.'};rec.onerror=()=>$('voiceNote').textContent='Could not capture speech. Please type instead.';rec.start()};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('install').hidden=false});
$('install').onclick=async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('install').hidden=true}};
if('serviceWorker'in navigator&&location.protocol!=='file:')addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
render();setInterval(render,1000);
