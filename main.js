const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const seedEvents = [
  {id:"e1",title:"TCC Orientation & Tech Talk",description:"Meet the council, explore technology projects, and learn how to get involved.",date:"2026-09-25",time:"11:00",venue:"Trinity College Auditorium",status:"upcoming",image:""},
  {id:"e2",title:"Web Development Bootcamp",description:"A hands-on session on building modern responsive websites.",date:"2026-08-22",time:"12:30",venue:"Computer Lab",status:"past",image:""}
];

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const niceDate=v=>new Date(v+"T00:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});
const setMessage=(selector,text="")=>{const el=$(selector);if(el)el.textContent=text};

async function ensureSeedEvents(){
  const {count,error}=await supabase.from("events").select("id",{count:"exact",head:true});
  if(error||count!==0)return;
  const {error:insertError}=await supabase.from("events").insert(seedEvents);
  if(insertError)console.warn("Could not seed events:",insertError.message);
}

async function getData(){
  const [events,magazines,team]=await Promise.all([
    supabase.from("events").select("*").order("date",{ascending:false}),
    supabase.from("magazines").select("*").order("created_at",{ascending:false}),
    supabase.from("team_members").select("*").order("created_at",{ascending:true})
  ]);
  if(events.error)throw events.error;
  if(magazines.error)throw magazines.error;
  if(team.error)throw team.error;
  return {events:events.data||[],magazines:magazines.data||[],team:team.data||[]};
}

async function render(){
  try{
    await ensureSeedEvents();
    const data=await getData();
    const events=[...data.events].sort((a,b)=>a.status===b.status?b.date.localeCompare(a.date):a.status==="upcoming"?-1:1);
    $("#eventsGrid").innerHTML=events.length?events.map(e=>`
      <article class="event-card">
        <div class="event-image" ${e.image_url?`style="background-image:url('${esc(e.image_url)}')"`:""}><span class="event-status">${esc(e.status).toUpperCase()}</span></div>
        <div class="event-body">
          <span class="event-date">${niceDate(e.date)} • ${esc(e.time)}</span>
          <h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>
          <div class="event-meta"><span>⌖ ${esc(e.venue)}</span></div>
          ${e.status==="upcoming"?`<button class="btn primary register-button" data-id="${esc(e.id)}" data-title="${esc(e.title)}">Register now <span>→</span></button>`:""}
        </div>
      </article>`).join(""):`<div class="panel"><p>No events published yet.</p></div>`;

    $$(".register-button").forEach(btn=>btn.addEventListener("click",()=>{
      $("#eventId").value=btn.dataset.id;$("#modalEventTitle").textContent=btn.dataset.title;
      setMessage("#registrationMessage");$("#registrationModal").classList.add("open");$("#registrationModal").setAttribute("aria-hidden","false");
    }));

    $("#magazineGrid").innerHTML=data.magazines.length?data.magazines.map(m=>`
      <article class="magazine-card"><h3>${esc(m.title)}</h3><p>${esc(m.description||"TCC student magazine")}</p><a href="${esc(m.file_url)}" target="_blank" rel="noopener">Read PDF ↗</a></article>`).join(""):`<article class="magazine-card"><h3>First issue coming soon</h3><p>The council's magazine archive will appear here when published.</p></article>`;

    $("#teamGrid").innerHTML=data.team.length?data.team.map(t=>`
      <article class="team-card"><div class="team-photo" ${t.photo_url?`style="background-image:url('${esc(t.photo_url)}')"`:""}></div><div class="team-body"><h3>${esc(t.name)}</h3><span class="role">${esc(t.position).toUpperCase()}</span><p>${esc(t.introduction)}</p></div></article>`).join(""):`<article class="team-card"><div class="team-photo"><span class="placeholder">TCC</span></div><div class="team-body"><h3>Executive board</h3><p>Board profiles will be published here by the council.</p></div></article>`;
  }catch(error){
    console.error(error);
    $("#eventsGrid").innerHTML=`<div class="panel"><p>Unable to load website data. Please check your Supabase setup.</p></div>`;
  }
}

$("#year").textContent=new Date().getFullYear();
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$$("nav a").forEach(a=>a.addEventListener("click",()=>$("#mainNav").classList.remove("open")));
window.addEventListener("scroll",()=>{const max=document.documentElement.scrollHeight-innerHeight;$("#scrollProgress").style.width=`${max>0?scrollY/max*100:0}%`});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.12});
$$(".reveal").forEach(el=>observer.observe(el));

function closeModal(){$("#registrationModal").classList.remove("open");$("#registrationModal").setAttribute("aria-hidden","true")}
$("#closeModal").addEventListener("click",closeModal);
$("#registrationModal").addEventListener("click",e=>{if(e.target.id==="registrationModal")closeModal()});

$("#registrationForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const form=e.currentTarget,values=Object.fromEntries(new FormData(form)),message=$("#registrationMessage");
  const studentId=values.studentId.trim().toUpperCase();
  const email=values.email.trim().toLowerCase();
  if(!/^(SC|MG)\d{2}-\d{4}$/.test(studentId)){message.textContent="Student ID must look like SC26-1234 or MG26-1234.";return}
  if(!/^[A-Za-z0-9._%+-]+\.(SC|MG)\d{2}-\d{4}@trinity\.edu\.np$/i.test(email)){message.textContent="Please use a valid Trinity college email such as example.sc16-1234@trinity.edu.np.";return}
  message.textContent="Submitting…";
  const {data:event,error:eventError}=await supabase.from("events").select("id,title,status").eq("id",values.eventId).maybeSingle();
  if(eventError||!event||event.status!=="upcoming"){message.textContent="Registration is not available for this event.";return}
  const {error}=await supabase.from("registrations").insert({event_id:event.id,event_title:event.title,full_name:values.fullName,student_id:studentId,email,class_name:values.className,section:values.section,stream:values.stream,shift:values.shift});
  if(error){
    message.textContent=error.code==="23505"?"This student ID is already registered for this event.":"Registration failed. Please try again.";
    return;
  }
  message.textContent="Registration successful. See you at the event!";
  form.reset();setTimeout(closeModal,1800);
});

render();
