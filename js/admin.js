const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const STORAGE="tcc_site_data_v1";
const AUTH="tcc_admin_auth_v1";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const niceDate=v=>new Date(v+"T00:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});

const defaultData={events:[{id:"e1",title:"TCC Orientation & Tech Talk",description:"Meet the council, explore technology projects, and learn how to get involved.",date:"2026-09-25",time:"11:00",venue:"Trinity College Auditorium",status:"upcoming",image:""},{id:"e2",title:"Web Development Bootcamp",description:"A hands-on session on building modern responsive websites.",date:"2026-08-22",time:"12:30",venue:"Computer Lab",status:"past",image:""}],magazines:[],team:[],registrations:[]};
function data(){try{return JSON.parse(localStorage.getItem(STORAGE))||structuredClone(defaultData)}catch{return structuredClone(defaultData)}}
function save(d){localStorage.setItem(STORAGE,JSON.stringify(d))}
if(!localStorage.getItem(STORAGE))save(defaultData);

function showDashboard(){
  const auth=sessionStorage.getItem(AUTH)==="1";
  $("#loginPanel").classList.toggle("hidden",auth);$("#dashboard").classList.toggle("hidden",!auth);
  if(auth)renderAll();
}
$("#loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const vals=Object.fromEntries(new FormData(e.currentTarget));
  if(vals.username==="admin"&&vals.password==="tcc2026"){sessionStorage.setItem(AUTH,"1");showDashboard()}
  else $("#loginMessage").textContent="Invalid credentials.";
});
$("#logoutButton").addEventListener("click",()=>{sessionStorage.removeItem(AUTH);showDashboard()});

$$(".tab").forEach(tab=>tab.addEventListener("click",()=>{
  $$(".tab").forEach(t=>t.classList.remove("active"));tab.classList.add("active");
  $$(".tab-panel").forEach(p=>p.classList.add("hidden"));$("#"+tab.dataset.panel).classList.remove("hidden");
}));

function readFile(file){return new Promise((resolve,reject)=>{if(!file)return resolve("");const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})}

$("#eventForm").addEventListener("submit",async e=>{
  e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f)),d=data();
  const image=await readFile(f.image.files[0]);
  d.events.push({id:"e"+Date.now(),title:v.title,description:v.description,date:v.date,time:v.time,venue:v.venue,status:v.status,image});
  save(d);f.reset();$("#eventMessage").textContent="Event published successfully.";renderAll();
});

$("#magazineForm").addEventListener("submit",async e=>{
  e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f)),file=f.file.files[0];
  if(!file||file.type!=="application/pdf"){ $("#magazineMessage").textContent="Please select a PDF file.";return}
  if(file.size>8*1024*1024){$("#magazineMessage").textContent="PDF must be smaller than 8 MB.";return}
  const d=data(),pdf=await readFile(file);
  d.magazines.push({id:"m"+Date.now(),title:v.title,description:v.description,data:pdf,originalName:file.name});
  save(d);f.reset();$("#magazineMessage").textContent="Magazine uploaded successfully.";renderAll();
});

$("#teamForm").addEventListener("submit",async e=>{
  e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f)),file=f.photo.files[0];
  if(!file||!file.type.startsWith("image/")){$("#teamMessage").textContent="Please select an image.";return}
  if(file.size>8*1024*1024){$("#teamMessage").textContent="Photo must be smaller than 8 MB.";return}
  const d=data(),photo=await readFile(file);
  d.team.push({id:"t"+Date.now(),name:v.name,position:v.position,introduction:v.introduction,photo});
  save(d);f.reset();$("#teamMessage").textContent="Executive member added.";renderAll();
});

function renderAll(){
  const d=data();
  $("#adminEvents").innerHTML=d.events.length?d.events.map(x=>`<div class="admin-item"><div class="admin-item-main"><strong>${esc(x.title)}</strong><small>${x.status} • ${niceDate(x.date)} • ${esc(x.venue)}</small></div><button class="delete-btn" data-type="events" data-id="${x.id}">Delete</button></div>`).join(""):"<p>No events.</p>";
  $("#adminMagazines").innerHTML=d.magazines.length?d.magazines.map(x=>`<div class="admin-item"><div class="admin-item-main"><strong>${esc(x.title)}</strong><small>${esc(x.originalName)}</small></div><a class="delete-btn" href="${x.data}" target="_blank">View</a><button class="delete-btn" data-type="magazines" data-id="${x.id}">Delete</button></div>`).join(""):"<p>No magazines.</p>";
  $("#adminTeam").innerHTML=d.team.length?d.team.map(x=>`<div class="admin-item"><img class="admin-thumb" src="${x.photo}" alt=""><div class="admin-item-main"><strong>${esc(x.name)}</strong><small>${esc(x.position)}</small></div><button class="delete-btn" data-type="team" data-id="${x.id}">Delete</button></div>`).join(""):"<p>No team members.</p>";
  $("#registrationsBody").innerHTML=d.registrations.length?d.registrations.map(r=>`<tr><td>${esc(r.eventTitle)}</td><td>${esc(r.fullName)}</td><td>${esc(r.studentId)}</td><td>${esc(r.email)}</td><td>${esc(r.className)}</td><td>${esc(r.section)}</td><td>${esc(r.stream)}</td><td>${esc(r.shift)}</td></tr>`).join(""):"<tr><td colspan='8'>No registrations yet.</td></tr>";
  $$(".delete-btn[data-type]").forEach(b=>b.addEventListener("click",()=>{
    if(!confirm("Delete this item?"))return;const x=data();x[b.dataset.type]=x[b.dataset.type].filter(i=>i.id!==b.dataset.id);save(x);renderAll();
  }));
}

$("#exportRegistrations").addEventListener("click",()=>{
  const rows=data().registrations;
  const headers=["Event","Full Name","Student ID","Email","Class","Section","Stream","Shift","Registered At"];
  const csv=[headers,...rows.map(r=>[r.eventTitle,r.fullName,r.studentId,r.email,r.className,r.section,r.stream,r.shift,r.registeredAt])].map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="tcc-registrations.csv";a.click();URL.revokeObjectURL(url);
});
showDashboard();
