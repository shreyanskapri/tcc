const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const niceDate=v=>new Date(v+"T00:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});

function setMessage(selector,text=""){const el=$(selector);if(el)el.textContent=text}
function fileExt(file,fallback){const name=file?.name||"";const ext=name.includes(".")?name.split(".").pop().toLowerCase():fallback;return ext.replace(/[^a-z0-9]/g,"")||fallback}
async function uploadFile(bucket,file){
  const path=`${crypto.randomUUID()}.${fileExt(file,bucket==="magazines"?"pdf":"jpg")}`;
  const {error}=await supabase.storage.from(bucket).upload(path,file,{upsert:false,cacheControl:"3600"});
  if(error)throw error;
  const {data}=supabase.storage.from(bucket).getPublicUrl(path);
  return {path,url:data.publicUrl};
}
async function deleteStorage(bucket,path){if(path)await supabase.storage.from(bucket).remove([path])}

async function isAdmin(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session)return false;
  const {data,error}=await supabase.from("admins").select("user_id").eq("user_id",session.user.id).maybeSingle();
  if(error)console.error(error);
  return !!data;
}

async function showDashboard(){
  const auth=await isAdmin();
  $("#loginPanel").classList.toggle("hidden",auth);$("#dashboard").classList.toggle("hidden",!auth);
  if(auth){
    const {data:{user}}=await supabase.auth.getUser();
    $("#adminEmail").textContent=user?.email||"admin";
    await renderAll();
  }
}

$("#loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const vals=Object.fromEntries(new FormData(e.currentTarget));
  setMessage("#loginMessage","Signing in…");
  const {error}=await supabase.auth.signInWithPassword({email:vals.email,password:vals.password});
  if(error){setMessage("#loginMessage","Invalid email or password.");return}
  setMessage("#loginMessage");await showDashboard();
});

$("#logoutButton").addEventListener("click",async()=>{await supabase.auth.signOut();await showDashboard()});
$$(".tab").forEach(tab=>tab.addEventListener("click",()=>{$$(".tab").forEach(t=>t.classList.remove("active"));tab.classList.add("active");$$(".tab-panel").forEach(p=>p.classList.add("hidden"));$("#"+tab.dataset.panel).classList.remove("hidden")}));

$("#eventForm").addEventListener("submit",async e=>{
  e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f)),file=f.image.files[0];
  setMessage("#eventMessage","Publishing…");let upload=null;
  try{
    if(file){if(file.size>8*1024*1024)throw new Error("Cover image must be smaller than 8 MB.");upload=await uploadFile("event-images",file)}
    const {error}=await supabase.from("events").insert({title:v.title,description:v.description,date:v.date,time:v.time,venue:v.venue,status:v.status,image_url:upload?.url||null,image_path:upload?.path||null});
    if(error)throw error;
    f.reset();setMessage("#eventMessage","Event published successfully.");await renderAll();
  }catch(err){if(upload)await deleteStorage("event-images",upload.path);console.error(err);setMessage("#eventMessage",err.message||"Could not publish event.")}
});

$("#magazineForm").addEventListener("submit",async e=>{
  e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f)),file=f.file.files[0];
  if(!file||file.type!=="application/pdf"){setMessage("#magazineMessage","Please select a PDF file.");return}
  if(file.size>25*1024*1024){setMessage("#magazineMessage","PDF must be smaller than 25 MB.");return}
  setMessage("#magazineMessage","Uploading…");let upload=null;
  try{
    upload=await uploadFile("magazines",file);
    const {error}=await supabase.from("magazines").insert({title:v.title,description:v.description||"",file_url:upload.url,file_path:upload.path,original_name:file.name});
    if(error)throw error;
    f.reset();setMessage("#magazineMessage","Magazine uploaded successfully.");await renderAll();
  }catch(err){if(upload)await deleteStorage("magazines",upload.path);console.error(err);setMessage("#magazineMessage",err.message||"Could not upload magazine.")}
});

$("#teamForm").addEventListener("submit",async e=>{
  e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f)),file=f.photo.files[0];
  if(!file||!file.type.startsWith("image/")){setMessage("#teamMessage","Please select an image.");return}
  if(file.size>8*1024*1024){setMessage("#teamMessage","Photo must be smaller than 8 MB.");return}
  setMessage("#teamMessage","Uploading…");let upload=null;
  try{
    upload=await uploadFile("team-photos",file);
    const {error}=await supabase.from("team_members").insert({name:v.name,position:v.position,introduction:v.introduction,photo_url:upload.url,photo_path:upload.path});
    if(error)throw error;
    f.reset();setMessage("#teamMessage","Executive member added.");await renderAll();
  }catch(err){if(upload)await deleteStorage("team-photos",upload.path);console.error(err);setMessage("#teamMessage",err.message||"Could not add member.")}
});

async function renderAll(){
  try{
    const [events,magazines,team,registrations]=await Promise.all([
      supabase.from("events").select("*").order("date",{ascending:false}),
      supabase.from("magazines").select("*").order("created_at",{ascending:false}),
      supabase.from("team_members").select("*").order("created_at",{ascending:true}),
      supabase.from("registrations").select("*").order("registered_at",{ascending:false})
    ]);
    for(const result of [events,magazines,team,registrations])if(result.error)throw result.error;
    const d={events:events.data||[],magazines:magazines.data||[],team:team.data||[],registrations:registrations.data||[]};
    $("#adminEvents").innerHTML=d.events.length?d.events.map(x=>`<div class="admin-item"><div class="admin-item-main"><strong>${esc(x.title)}</strong><small>${esc(x.status)} • ${niceDate(x.date)} • ${esc(x.venue)}</small></div><button class="delete-btn" data-type="events" data-id="${esc(x.id)}">Delete</button></div>`).join(""):"<p>No events.</p>";
    $("#adminMagazines").innerHTML=d.magazines.length?d.magazines.map(x=>`<div class="admin-item"><div class="admin-item-main"><strong>${esc(x.title)}</strong><small>${esc(x.original_name)}</small></div><a class="delete-btn" href="${esc(x.file_url)}" target="_blank" rel="noopener">View</a><button class="delete-btn" data-type="magazines" data-id="${esc(x.id)}" data-path="${esc(x.file_path||"")}">Delete</button></div>`).join(""):"<p>No magazines.</p>";
    $("#adminTeam").innerHTML=d.team.length?d.team.map(x=>`<div class="admin-item"><img class="admin-thumb" src="${esc(x.photo_url||"")}" alt=""><div class="admin-item-main"><strong>${esc(x.name)}</strong><small>${esc(x.position)}</small></div><button class="delete-btn" data-type="team_members" data-id="${esc(x.id)}" data-path="${esc(x.photo_path||"")}">Delete</button></div>`).join(""):"<p>No team members.</p>";
    $("#registrationsBody").innerHTML=d.registrations.length?d.registrations.map(r=>`<tr><td>${esc(r.event_title)}</td><td>${esc(r.full_name)}</td><td>${esc(r.student_id)}</td><td>${esc(r.email)}</td><td>${esc(r.class_name)}</td><td>${esc(r.section)}</td><td>${esc(r.stream)}</td><td>${esc(r.shift)}</td></tr>`).join(""):"<tr><td colspan='8'>No registrations yet.</td></tr>";
    $$(".delete-btn[data-type]").forEach(b=>b.addEventListener("click",async()=>{
      if(!confirm("Delete this item?"))return;
      const table=b.dataset.type,id=b.dataset.id;
      const bucket=table==="magazines"?"magazines":table==="team_members"?"team-photos":"event-images";
      const {error}=await supabase.from(table).delete().eq("id",id);
      if(error){alert(error.message);return}
      if(b.dataset.path)await deleteStorage(bucket,b.dataset.path);
      await renderAll();
    }));
  }catch(error){console.error(error);alert("Could not load admin data. Check the Supabase SQL/RLS setup.")}
}

$("#exportRegistrations").addEventListener("click",async()=>{
  const {data:rows,error}=await supabase.from("registrations").select("*").order("registered_at",{ascending:false});
  if(error){alert(error.message);return}
  const headers=["Event","Full Name","Student ID","Email","Class","Section","Stream","Shift","Registered At"];
  const csv=[headers,...(rows||[]).map(r=>[r.event_title,r.full_name,r.student_id,r.email,r.class_name,r.section,r.stream,r.shift,r.registered_at])].map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="tcc-registrations.csv";a.click();URL.revokeObjectURL(url);
});

supabase.auth.onAuthStateChange(()=>showDashboard());
showDashboard();
