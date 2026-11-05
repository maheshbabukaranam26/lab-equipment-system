const K='neat-lab-db3',base=document.body.dataset.base;let pg=location.hash.slice(1)||document.body.dataset.page;
const P={grid:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',box:'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',inbox:'M22 12h-6l-2 3h-4l-2-3H2M5 5h14l3 7v7H2v-7z',repeat:'M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3',alert:'M12 3l10 18H2zM12 10v5M12 18h.01',flask:'M9 3h6M10 3v6L4 20h16L14 9V3',zap:'M13 2L4 14h7l-1 8 9-12h-7z',microscope:'M6 18h12M8 22h8M14 2l4 4-6 6-4-4zM10 12l-3 3M13 15a5 5 0 005-5',check:'M20 6L9 17l-5-5'};
const ic=(n,s=22)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${P[n]}"/></svg>`;
const CAT={Biology:['#15803d','#dcfce7','microscope'],Chemistry:['#7c3aed','#ede9fe','flask'],Physics:['#b45309','#fef3c7','zap'],x:['#0d9488','#ccfbf1','box']};
const E=(id,name,category,quantity,location,desc)=>({id,name,category,quantity,available:quantity,status:'available',location,desc});
const seed={users:[{id:1,name:'Admin One',role:'admin',dept:'Lab Office'},{id:2,name:'Ravi Kumar',role:'student',dept:'Physics'},{id:3,name:'Dr. Meena',role:'faculty',dept:'Chemistry'},{id:4,name:'Sneha Reddy',role:'student',dept:'Biology'},{id:5,name:'Mahesh',role:'faculty',dept:'Professor',photo:'prof-mahesh.jpg'},{id:6,name:'Pradeep',role:'faculty',dept:'Professor',photo:'prof-pradeep.svg'},{id:7,name:'Rony',role:'faculty',dept:'Professor',photo:'prof-rony.svg'}],
equipment:[E(1,'Compound Microscope','Biology',10,'Lab 101','40x to 1000x magnification for slide study.'),E(2,'Bunsen Burner','Chemistry',20,'Lab 204','Gas burner for heating and sterilising.'),E(3,'Digital Multimeter','Physics',8,'Lab 305','Measures voltage, current and resistance.'),E(4,'Centrifuge','Biology',4,'Lab 102','Separates samples at up to 5000 rpm.'),E(5,'Oscilloscope','Physics',5,'Lab 306','Dual-channel 100 MHz waveform display.'),E(6,'Beaker Set','Chemistry',40,'Store B','Borosilicate glass, 50 ml to 1000 ml.'),E(7,'Analytical Balance','Chemistry',6,'Lab 205','Weighs samples to 0.0001 g.'),E(8,'Slide Projector','Biology',3,'Store A','For showing specimen slides to a class.')],
requests:[],transactions:[],issues:[],seq:20};
let db=null;try{db=JSON.parse(localStorage.getItem(K))}catch(e){}
db=db||JSON.parse(JSON.stringify(seed));
const save=()=>{try{localStorage.setItem(K,JSON.stringify(db))}catch(e){}};
const eq=i=>db.equipment.find(e=>e.id==i),us=i=>db.users.find(u=>u.id==i);
const nid=()=>db.seq++,today=()=>new Date().toISOString().slice(0,10);
const plus=d=>new Date(Date.now()+d*864e5).toISOString().slice(0,10);
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const val=i=>document.getElementById(i).value.trim();
const sum=(a,k)=>a.reduce((n,x)=>n+x[k],0);
const badge=s=>`<span class="b ${s}" data-t="${s}">${s}</span>`;
const opts=(l,f)=>l.map(x=>`<option value="${x.id??x}">${f?f(x):x}</option>`).join('');
const pic=(u,s=40)=>`<span class="av" style="width:${s}px;height:${s}px;font-size:${s*.4}px">${u.name[0]}${u.photo?`<img src="${base}img/${u.photo}" alt="${u.name}" onerror="this.remove()">`:''}</span>`;
const ph=(t,s)=>`<div class="ph"><h1>${t}</h1><p>${s}</p></div>`;
const table=(h,r,msg)=>`<div class="tw"><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${r.length?r.map(c=>`<tr>${c.map(x=>`<td>${x}</td>`).join('')}</tr>`).join(''):`<tr><td class="empty" colspan="${h.length}">${msg||'Nothing here yet.'}</td></tr>`}</table></div>`;
const nav=[['index','Dashboard','index.html','grid'],['equipment','Equipment','pages/equipment.html','box'],['requests','Requests','pages/requests.html','inbox'],['transactions','Issue and return','pages/transactions.html','repeat'],['issues','Damaged and unavailable','pages/issues.html','alert']];
const card=e=>{const c=CAT[e.category]||CAT.x,p=e.quantity?Math.round(e.available/e.quantity*100):0;
 return `<div class="ec" data-t="${(e.name+e.category+(e.location||'')).toLowerCase()}" data-c="${e.category}"><div class="pic" style="background:${c[1]};color:${c[0]}">${ic(c[2],52)}<img src="${base}img/equipment-${e.id}.jpg" alt="${e.name}" onerror="this.remove()"></div><div class="eb"><div class="rw"><b>${e.name}</b>${badge(e.status)}</div><small>${e.category}, ${e.location||'Main lab'}</small><p>${e.desc||''}</p><div class="bar"><i style="width:${p}%"></i></div><small>${e.available} of ${e.quantity} available</small></div></div>`};
const stat=(n,l,v,c,b)=>`<div class="pn sc"><div class="ic" style="color:${c};background:${b}">${ic(n)}</div><div><b>${v}</b><small>${l}</small></div></div>`;

const V={
index(){const A=db.equipment,tot=sum(A,'quantity'),av=sum(A,'available'),pct=tot?Math.round(av/tot*100):0,out=db.transactions.filter(t=>!t.returned),od=out.filter(t=>t.due<today());
 const cats=[...new Set(A.map(e=>e.category))],pend=db.requests.filter(r=>r.status=='pending').length,oi=db.issues.filter(i=>!i.resolved).length;
 const act=[...db.requests.map(r=>({id:r.id,t:`${us(r.uid).name} requested ${r.qty} x ${eq(r.eid).name}`,s:r.status})),...db.transactions.map(t=>({id:t.id,t:`${us(t.uid).name} ${t.returned?'returned':'borrowed'} ${t.qty} x ${eq(t.eid).name}`,s:t.returned?'returned':'issued'})),...db.issues.map(i=>({id:i.id,t:`${eq(i.eid).name}: ${i.qty} reported ${i.type}`,s:i.type}))].sort((a,b)=>b.id-a.id).slice(0,6);
 return `<div class="hero"><svg class="bg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1"><path d="${P.flask}"/></svg><h1>Welcome back, Admin</h1><p>${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}. ${out.length} items are out on loan and ${pend} requests need your decision.</p></div>
 <div class="g4">${stat('box','Total units',tot,'#0d9488','#ccfbf1')}${stat('check','Available now',av,'#15803d','#dcfce7')}${stat('inbox','Pending requests',pend,'#b45309','#fef3c7')}${stat('alert','Open issues',oi,'#be123c','#ffe4e6')}</div>
 <div class="pn" style="margin-bottom:20px"><h2>Faculty</h2><div class="fac">${db.users.filter(u=>u.dept=='Professor').map(u=>`<div>${pic(u,56)}<div><b>${u.name}</b><br><small>Professor, ${db.transactions.filter(t=>t.uid==u.id&&!t.returned).length} items on loan</small></div></div>`).join('')}</div></div>
 <div class="g2"><div class="pn"><h2>Availability</h2><div class="dn"><div class="ring" style="background:conic-gradient(#0d9488 ${pct*3.6}deg,#e4ecf3 0)"><span>${pct}%</span></div><div><b>${av} of ${tot} units</b><br><small>are on the shelf and ready to issue.</small></div></div></div>
 <div class="pn"><h2>Stock by category</h2>${cats.map(c=>{const a=A.filter(e=>e.category==c),t=sum(a,'quantity'),v=sum(a,'available');return `<div class="cb"><div><span>${c}</span><small>${v}/${t}</small></div><div class="bar"><i style="width:${t?v/t*100:0}%;background:${(CAT[c]||CAT.x)[0]}"></i></div></div>`}).join('')}</div></div>
 <div class="g2"><div class="pn"><h2>Recent activity</h2><ul class="act">${act.length?act.map(a=>`<li><span>${a.t}</span>${badge(a.s)}</li>`).join(''):'<li><small>No activity yet. Send a request to get started.</small></li>'}</ul></div>
 <div class="pn"><h2>Overdue returns</h2>${table(['Borrower','Item','Due'],od.map(t=>[us(t.uid).name,eq(t.eid).name,t.due]),'No overdue returns.')}<button class="alt" onclick="resetDb()">Reset sample data</button></div></div>`},
equipment(){const cats=[...new Set(db.equipment.map(e=>e.category))];
 return ph('Equipment','Browse the lab inventory and add new items.')+`<form onsubmit="return addEq()"><label>Name<input id="n" required></label><label>Category<input id="c" list="cl" required></label><datalist id="cl">${cats.map(c=>`<option>${c}</option>`).join('')}</datalist><label>Quantity<input id="q" type="number" min="1" required style="width:90px"></label><label>Location<input id="l" placeholder="Lab 101"></label><label>Description<input id="d"></label><button>Add equipment</button></form>
 <div class="tb"><input id="s" placeholder="Search equipment" oninput="filt()"><select id="cf" onchange="filt()"><option value="">All categories</option>${cats.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="cards">${db.equipment.map(card).join('')}</div>`},
requests(){return ph('Requests','Students and faculty request equipment; admins approve or reject.')+`<form onsubmit="return addReq()"><label>Requested by<select id="u">${opts(db.users.filter(u=>u.role!='admin'),u=>`${u.name} (${u.role}, ${u.dept})`)}</select></label><label>Equipment<select id="e">${opts(db.equipment,e=>`${e.name} (${e.available} free)`)}</select></label><label>Quantity<input id="q" type="number" min="1" value="1" required style="width:90px"></label><label>Purpose<input id="p"></label><button>Send request</button></form>`+table(['ID','User','Department','Equipment','Qty','Purpose','Status','Action'],db.requests.map(r=>[r.id,pic(us(r.uid),28)+' '+us(r.uid).name,us(r.uid).dept,eq(r.eid).name,r.qty,r.purpose,badge(r.status),r.status=='pending'?`<div class="row"><button onclick="setReq(${r.id},'approved')">Approve</button><button class="alt" onclick="setReq(${r.id},'rejected')">Reject</button></div>`:'']))},
transactions(){const ap=db.requests.filter(r=>r.status=='approved');
 return ph('Issue and return','Hand out approved requests and record what comes back.')+`<h2>Approved, ready to issue</h2>`+table(['Request','User','Equipment','Qty','Action'],ap.map(r=>[r.id,us(r.uid).name,eq(r.eid).name,r.qty,`<button onclick="issue(${r.id})">Issue for 7 days</button>`]),'No approved requests waiting.')+
 `<h2>Issue and return log</h2>`+table(['ID','Borrower','Equipment','Qty','Issued','Due','Return'],db.transactions.map(t=>[t.id,us(t.uid).name,eq(t.eid).name,t.qty,t.issued,t.due,t.returned?badge(t.cond)+' '+t.returned:`<div class="row"><select id="c${t.id}"><option>good</option><option>damaged</option><option>lost</option></select><button onclick="ret(${t.id})">Record return</button></div>`]))},
issues(){return ph('Damaged and unavailable','Track broken, lost and out-of-service equipment.')+`<form onsubmit="return addIssue()"><label>Equipment<select id="e">${opts(db.equipment,e=>e.name)}</select></label><label>Type<select id="t"><option>damaged</option><option>maintenance</option><option>unavailable</option><option>lost</option></select></label><label>Quantity<input id="q" type="number" min="1" value="1" required style="width:90px"></label><label>Details<input id="d"></label><button>Report issue</button></form>`+table(['ID','Equipment','Type','Qty','Details','Reported','Status'],db.issues.map(i=>[i.id,eq(i.eid).name,badge(i.type),i.qty,i.desc,i.date,i.resolved?'Resolved '+i.resolved:`<button onclick="resolve(${i.id})">${i.type=='lost'?'Write off':'Mark fixed'}</button>`]))}};

function render(){if(!V[pg])pg='index';document.body.innerHTML=`<aside><div class="br">${ic('flask',24)}<b>Lab Equipments</b><small>System</small></div>${nav.map(n=>`<a href="#${n[0]}" class="${n[0]==pg?'on':''}">${ic(n[3],20)}${n[1]}</a>`).join('')}<p>Signed in as<br><b>Admin One</b></p></aside><main>${V[pg]()}</main>`}
const done=()=>{save();render()};
const sync=e=>{e.status=e.available>0?'available':(e.status=='available'?'unavailable':e.status)};
function addEq(){const q=+val('q');db.equipment.push({id:nid(),name:esc(val('n')),category:esc(val('c')),quantity:q,available:q,status:'available',location:esc(val('l')),desc:esc(val('d'))});done();return false}
function filt(){const v=val('s').toLowerCase(),c=val('cf');document.querySelectorAll('.ec').forEach(x=>x.hidden=!(x.dataset.t.includes(v)&&(!c||x.dataset.c==c)))}
function addReq(){db.requests.push({id:nid(),uid:+val('u'),eid:+val('e'),qty:+val('q'),purpose:esc(val('p')),status:'pending'});done();return false}
function setReq(i,s){db.requests.find(r=>r.id==i).status=s;done()}
function issue(i){const r=db.requests.find(x=>x.id==i),e=eq(r.eid);
 if(e.available<r.qty){alert('Only '+e.available+' available for '+e.name+'.');return}
 e.available-=r.qty;sync(e);r.status='issued';db.transactions.push({id:nid(),rid:i,eid:r.eid,uid:r.uid,qty:r.qty,issued:today(),due:plus(7),returned:null,cond:null});done()}
function ret(i){const t=db.transactions.find(x=>x.id==i),c=val('c'+i),e=eq(t.eid);
 t.returned=today();t.cond=c;
 if(c=='good'){e.available+=t.qty;sync(e)}else db.issues.push({id:nid(),eid:t.eid,tid:i,type:c,qty:t.qty,desc:'Reported at return',date:today(),resolved:null});done()}
function addIssue(){const e=eq(val('e')),q=+val('q'),t=val('t');
 e.available=Math.max(0,e.available-q);if(e.available==0)e.status=t=='maintenance'?'maintenance':t=='damaged'?'damaged':'unavailable';
 db.issues.push({id:nid(),eid:e.id,tid:null,type:t,qty:q,desc:esc(val('d')),date:today(),resolved:null});done();return false}
function resolve(i){const s=db.issues.find(x=>x.id==i),e=eq(s.eid);s.resolved=today();
 if(s.type=='lost')e.quantity=Math.max(0,e.quantity-s.qty);else e.available=Math.min(e.quantity,e.available+s.qty);
 e.available=Math.min(e.available,e.quantity);if(e.available>0)e.status='available';done()}
function resetDb(){try{localStorage.removeItem(K)}catch(e){}db=JSON.parse(JSON.stringify(seed));render()}
render();
window.addEventListener('hashchange',()=>{pg=location.hash.slice(1)||'index';render();window.scrollTo(0,0)});
