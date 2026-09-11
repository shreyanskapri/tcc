const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const STORAGE = "tcc_site_data_v1";

const seed = {
  events: [
    {id:"e1",title:"TCC Orientation & Tech Talk",description:"Meet the council, explore technology projects, and learn how to get involved.",date:"2026-09-25",time:"11:00",venue:"Trinity College Auditorium",status:"upcoming",image:""},
    {id:"e2",title:"Web Development Bootcamp",description:"A hands-on session on building modern responsive websites.",date:"2026-08-22",time:"12:30",venue:"Computer Lab",status:"past",image:""}
  ],
  magazines: [],
  team: [],
  registrations: []
};

function getData(){
  try{return JSON.parse(localStorage.getItem(STORAGE)) || structuredClone(seed)}
  catch{return structuredClone(seed)}
}
function saveData(data){localStorage.setItem(STORAGE,JSON.stringify(data))}
if(!localStorage.getItem(STORAGE)) saveData(seed);

$("#year").textContent = new Date().getFullYear();

$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$$("nav a").forEach(a=>a.addEventListener("click",()=>$("#mainNav").classList.remove("open")));

window.addEventListener("scroll",()=>{
  const max=document.documentElement.scrollHeight-innerHeight;
  $("#scrollProgress").style.width=`${max>0 ? scrollY/max*100 : 0}%`;
});

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting)e.target.classList.add("visible")
}),{threshold:.12});
$$(".reveal").forEach(el=>observer.observe(el));

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const niceDate=v=>new Date(v+"T00:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});

function render(){
  const data=getData();
  const events=[...data.events].sort((a,b)=>a.status===b.status?b.date.localeCompare(a.date):a.status==="upcoming"?-1:1);
  $("#eventsGrid").innerHTML=events.length?events.map(e=>`
    <article class="event-card">
      <div class="event-image" ${e.image?`style="background-image:url('${e.image}')"`:""}><span class="event-status">${e.status.toUpperCase()}</span></div>
      <div class="event-body">
        <span class="event-date">${niceDate(e.date)} • ${esc(e.time)}</span>
        <h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>
        <div class="event-meta"><span>⌖ ${esc(e.venue)}</span></div>
        ${e.status==="upcoming"?`<button class="btn primary register-button" data-id="${esc(e.id)}" data-title="${esc(e.title)}">Register now <span>→</span></button>`:""}
      </div>
    </article>`).join(""):`<div class="panel"><p>No events published yet.</p></div>`;

  $$(".register-button").forEach(btn=>btn.addEventListener("click",()=>{
    $("#eventId").value=btn.dataset.id;$("#modalEventTitle").textContent=btn.dataset.title;
    $("#registrationMessage").textContent="";$("#registrationModal").classList.add("open");$("#registrationModal").setAttribute("aria-hidden","false");
  }));

  $("#magazineGrid").innerHTML=data.magazines.length?data.magazines.map(m=>`
    <article class="magazine-card"><h3>${esc(m.title)}</h3><p>${esc(m.description||"TCC student magazine")}</p><a href="${m.data}" target="_blank" rel="noopener">Read PDF ↗</a></article>`).join(""):`<article class="magazine-card"><h3>First issue coming soon</h3><p>The council's magazine archive will appear here when published.</p></article>`;

  $("#teamGrid").innerHTML=data.team.length?data.team.map(t=>`
    <article class="team-card"><div class="team-photo" style="background-image:url('${t.photo}')"></div><div class="team-body"><h3>${esc(t.name)}</h3><span class="role">${esc(t.position).toUpperCase()}</span><p>${esc(t.introduction)}</p></div></article>`).join(""):`<article class="team-card"><div class="team-photo"><span class="placeholder">TCC</span></div><div class="team-body"><h3>Executive board</h3><p>Board profiles will be published here by the council.</p></div></article>`;
}

function closeModal(){$("#registrationModal").classList.remove("open");$("#registrationModal").setAttribute("aria-hidden","true")}
$("#closeModal").addEventListener("click",closeModal);
$("#registrationModal").addEventListener("click",e=>{if(e.target.id==="registrationModal")closeModal()});

$("#registrationForm").addEventListener("submit",e=>{
  e.preventDefault();
  const form=e.currentTarget, data=getData(), values=Object.fromEntries(new FormData(form));
  const studentId=values.studentId.trim().toUpperCase();
  const email=values.email.trim().toLowerCase();
  const message=$("#registrationMessage");
  if(!/^(SC|MG)\d{2}-\d{4}$/.test(studentId)){message.textContent="Student ID must look like SC26-1234 or MG26-1234.";return}
  if(!/^[A-Za-z0-9._%+-]+\.(SC|MG)\d{2}-\d{4}@trinity\.edu\.np$/i.test(email)){message.textContent="Please use a valid Trinity college email such as example.sc16-1234@trinity.edu.np.";return}
  if(data.registrations.some(r=>r.eventId===values.eventId&&r.studentId===studentId)){message.textContent="This student ID is already registered for this event.";return}
  const event=data.events.find(x=>x.id===values.eventId);
  if(!event||event.status!=="upcoming"){message.textContent="Registration is not available for this event.";return}
  data.registrations.push({...values,studentId,email,registeredAt:new Date().toISOString(),eventTitle:event.title});
  saveData(data);message.textContent="Registration successful. See you at the event!";form.reset();setTimeout(closeModal,1800);
});
render();
