/* Secure administrator panel backed by Supabase. */
let ADMIN_DATA = null;

function initAdminTabs(){
  const buttons = document.querySelectorAll(".admin-side button"), pages = document.querySelectorAll(".admin-tabpage");
  buttons.forEach(btn => btn.addEventListener("click", () => { buttons.forEach(b => b.classList.remove("active")); pages.forEach(p => p.classList.remove("active")); btn.classList.add("active"); document.getElementById("tab-" + btn.dataset.tab).classList.add("active"); }));
}
function renderTable(selector, rows, empty, rowHTML){ document.querySelector(selector).innerHTML = rows.map(rowHTML).join("") || empty; }
function editButton(type, id){ return `<button class="edit-btn" data-id="${id}" data-type="${type}">Edit</button> <button class="del-btn" data-id="${id}" data-type="${type}">Delete</button>`; }
function itemLabel(type, item){ return type === "posts" ? item.title : type === "events" ? item.title : type === "gallery" ? item.title : type === "achievements" ? item.title : item.name; }
function renderAllAdmin(){
  const active = type => ADMIN_DATA[type].filter(item => !item.deletedAt);
  renderTable("#table-achievements tbody", active("achievements"), `<tr><td colspan="3" class="muted">No milestones yet.</td></tr>`, a => `<tr><td>${formatDate(a.date)}</td><td><strong>${escapeHTML(a.title)}</strong><br><span class="muted">${escapeHTML(a.note||"")}</span></td><td>${editButton("achievements",a.id)}</td></tr>`);
  renderTable("#table-posts tbody", active("posts"), `<tr><td colspan="3" class="muted">No posts yet.</td></tr>`, p => `<tr><td>${formatDate(p.date)}</td><td><strong>${escapeHTML(p.title)}</strong><br><span class="muted">${escapeHTML(p.tag||"")}</span></td><td>${editButton("posts",p.id)}</td></tr>`);
  renderTable("#table-events tbody", active("events"), `<tr><td colspan="3" class="muted">No events yet.</td></tr>`, e => `<tr><td>${formatDate(e.date)}${e.time ? " · "+e.time : ""}</td><td><strong>${escapeHTML(e.title)}</strong><br><span class="muted">${escapeHTML(e.location||"")}</span></td><td>${editButton("events",e.id)}</td></tr>`);
  document.getElementById("admin-gallery-grid").innerHTML = active("gallery").map(g => `<div class="card" style="padding:10px;"><div class="post-media" style="margin-bottom:10px; border-radius:8px;">${g.image ? `<img src="${g.image}" alt="${escapeHTML(g.title)}" style="width:100%;height:100%;object-fit:cover;">` : svgPlaceholder("gallery")}</div><p style="margin:0 0 4px; font-weight:700; font-size:.88rem;">${escapeHTML(g.title)}</p><p class="muted" style="margin:0 0 10px; font-size:.8rem;">${escapeHTML(g.category)}</p>${editButton("gallery",g.id)}</div>`).join("") || `<p class="muted">No photos yet.</p>`;
  renderTable("#table-donors tbody", active("donors"), `<tr><td colspan="3" class="muted">No donors listed yet.</td></tr>`, d => `<tr><td><strong>${escapeHTML(d.name)}</strong></td><td>${escapeHTML(d.note||"")}</td><td>${editButton("donors",d.id)}</td></tr>`);
  renderTable("#table-volunteers tbody", ADMIN_DATA.volunteers, `<tr><td colspan="4" class="muted">No volunteer applications yet.</td></tr>`, v => `<tr><td>${new Date(v.date).toLocaleDateString("en-GB")}</td><td><strong>${escapeHTML(v.name)}</strong><br><span class="muted">${escapeHTML(v.email)}</span></td><td>${escapeHTML(v.area||"")}</td><td><button class="del-btn" data-id="${v.id}" data-type="submissions">Delete</button></td></tr>`);
  renderTable("#table-messages tbody", ADMIN_DATA.messages, `<tr><td colspan="4" class="muted">No messages yet.</td></tr>`, m => `<tr><td>${new Date(m.date).toLocaleDateString("en-GB")}</td><td><strong>${escapeHTML(m.name)}</strong><br><span class="muted">${escapeHTML(m.email)}</span></td><td>${escapeHTML(m.kind === "donation-intent" ? `Donation intent — MWK ${m.amount} (${m.method})` : (m.subject||"") + (m.message ? `: ${m.message}` : ""))}</td><td><button class="reply-btn" data-email="${escapeHTML(m.email)}" data-name="${escapeHTML(m.name)}" data-subject="${escapeHTML(m.subject || "Your enquiry to New Community Organization")}">Reply</button> <button class="del-btn" data-id="${m.id}" data-type="submissions">Delete</button></td></tr>`);
  const trashed = ["achievements","posts","events","gallery","donors"].flatMap(type => ADMIN_DATA[type].filter(item => item.deletedAt).map(item => ({type,item}))).concat(ADMIN_DATA.submissions.filter(item => item.deleted_at).map(item => ({type:"submissions",item})));
  renderTable("#table-trash tbody", trashed, `<tr><td colspan="4" class="muted">Trash is empty.</td></tr>`, ({type,item}) => `<tr><td>${escapeHTML(type)}</td><td><strong>${escapeHTML(itemLabel(type,item))}</strong></td><td>${formatDate((item.deletedAt||item.deleted_at).slice(0,10))}</td><td><button class="restore-btn" data-id="${item.id}" data-type="${type}">Restore</button></td></tr>`);
}
async function loadAdminData(){ const content = await loadData(true); const {data: submissions,error} = await ncoSupabase.from("form_submissions").select("*").order("created_at", {ascending:false}); if(error) throw error; return {...content, submissions, volunteers:submissions.filter(s=>s.kind==="volunteer"&&!s.deleted_at).map(s=>({...s,date:s.created_at})), messages:submissions.filter(s=>s.kind!=="volunteer"&&!s.deleted_at).map(s=>({...s,date:s.created_at}))}; }
async function uploadImage(file){ if(!file) return ""; const name=`${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g,"-")}`; const {error}=await ncoSupabase.storage.from("site-images").upload(name,file); if(error) throw error; return ncoSupabase.storage.from("site-images").getPublicUrl(name).data.publicUrl; }
async function persistContent(){ await saveData(ADMIN_DATA); renderAllAdmin(); }
function initContentActions(){
  document.getElementById("admin-shell").addEventListener("click", async e => {
    const restore=e.target.closest(".restore-btn");
    if(restore){ if(restore.dataset.type==="submissions"){const {error}=await ncoSupabase.from("form_submissions").update({deleted_at:null}).eq("id",restore.dataset.id);if(error)throw error;ADMIN_DATA=await loadAdminData();renderAllAdmin();}else{const item=ADMIN_DATA[restore.dataset.type].find(x=>x.id===restore.dataset.id); item.deletedAt=null; await persistContent();} return; }
    const edit=e.target.closest(".edit-btn");
    if(edit){ beginEdit(edit.dataset.type,edit.dataset.id); return; }
    const btn=e.target.closest(".del-btn");
    if(!btn||!confirm("Move this item to Trash? You can restore it later.")) return;
    try { if(btn.dataset.type==="submissions"){ const {error}=await ncoSupabase.from("form_submissions").update({deleted_at:new Date().toISOString()}).eq("id",btn.dataset.id); if(error) throw error; ADMIN_DATA=await loadAdminData();renderAllAdmin(); }else{ const item=ADMIN_DATA[btn.dataset.type].find(x=>x.id===btn.dataset.id); item.deletedAt=new Date().toISOString(); await persistContent(); } }catch(error){ alert(`Could not delete this item: ${error.message}`); }
  });
}
function beginEdit(type,id){
  const item=ADMIN_DATA[type].find(x=>x.id===id), form=document.getElementById({achievements:"form-achievement",posts:"form-post",events:"form-event",gallery:"form-gallery",donors:"form-donor"}[type]);
  form.dataset.editId=id;
  form.querySelector("button[type=submit]").textContent="Save Changes";
  Object.entries(item).forEach(([key,value])=>{const field=form.elements.namedItem(key);if(field&&field.type!=="file"&&typeof value==="string")field.value=value;});
  form.scrollIntoView({behavior:"smooth",block:"start"});
}
function initReplyForm(){
  const form=document.getElementById("reply-form"), msg=document.getElementById("reply-msg");
  document.getElementById("table-messages").addEventListener("click",e=>{const btn=e.target.closest(".reply-btn");if(!btn)return;document.getElementById("reply-email").value=btn.dataset.email;document.getElementById("reply-recipient").textContent=`${btn.dataset.name} (${btn.dataset.email})`;document.getElementById("reply-subject").value=`Re: ${btn.dataset.subject}`;document.getElementById("reply-body").value="";msg.textContent="";form.hidden=false;form.scrollIntoView({behavior:"smooth",block:"start"});});
  document.getElementById("reply-cancel").addEventListener("click",()=>{form.hidden=true;form.reset();});
  form.addEventListener("submit",async e=>{e.preventDefault();const button=form.querySelector("button[type=submit]");button.disabled=true;msg.className="form-msg";msg.textContent="Sending…";try{const {error}=await ncoSupabase.functions.invoke("send-reply",{body:{to:document.getElementById("reply-email").value,subject:document.getElementById("reply-subject").value,message:document.getElementById("reply-body").value}});if(error)throw error;msg.className="form-msg success";msg.textContent="Reply sent successfully.";form.reset();}catch(error){msg.className="form-msg error";msg.textContent=`Could not send reply: ${error.message}`;}finally{button.disabled=false;}});
}
function initAdminForms(){
  const add=(id,type,getItem,buttonText)=>document.getElementById(id).addEventListener("submit",async e=>{e.preventDefault();try{const form=e.target,existing=ADMIN_DATA[type].find(x=>x.id===form.dataset.editId),item=await getItem(new FormData(form),existing);if(existing)Object.assign(existing,item);else ADMIN_DATA[type].push(item);await persistContent();form.reset();delete form.dataset.editId;form.querySelector("button[type=submit]").textContent=buttonText;}catch(error){alert(`Could not save: ${error.message}`);}});
  add("form-achievement","achievements",(fd,old)=>({id:old?.id||uid("a"),title:fd.get("title"),date:fd.get("date"),note:fd.get("note"),deletedAt:old?.deletedAt||null}),"Add Milestone");
  add("form-post","posts",async(fd,old)=>({id:old?.id||uid("p"),title:fd.get("title"),tag:fd.get("tag"),date:fd.get("date"),excerpt:fd.get("excerpt"),body:fd.get("body"),image:fd.get("image").size?await uploadImage(fd.get("image")):old?.image||"",deletedAt:old?.deletedAt||null}),"Publish Post");
  add("form-event","events",(fd,old)=>({id:old?.id||uid("e"),title:fd.get("title"),date:fd.get("date"),time:fd.get("time"),location:fd.get("location"),category:fd.get("category"),deletedAt:old?.deletedAt||null}),"Add Event");
  add("form-gallery","gallery",async(fd,old)=>{const image=fd.get("image").size?await uploadImage(fd.get("image")):old?.image||"";if(!image)throw new Error("Please choose a photo.");return{id:old?.id||uid("g"),title:fd.get("title"),category:fd.get("category"),image,deletedAt:old?.deletedAt||null};},"Upload Photo");
  add("form-donor","donors",(fd,old)=>({id:old?.id||uid("d"),name:fd.get("name"),note:fd.get("note"),deletedAt:old?.deletedAt||null}),"Add to Donor Wall");
}
function initLogin(){ document.getElementById("login-form").addEventListener("submit",async e=>{e.preventDefault();const msg=document.getElementById("login-msg"),email=document.getElementById("login-email").value,password=document.getElementById("login-password").value,{error}=await ncoSupabase.auth.signInWithPassword({email,password});if(error){msg.className="form-msg error";msg.textContent=error.message;return;}await showAdmin();}); document.getElementById("logout-btn").addEventListener("click",async()=>{await ncoSupabase.auth.signOut();location.reload();}); }
async function showAdmin(){ try{ADMIN_DATA=await loadAdminData();document.getElementById("admin-login").hidden=true;document.getElementById("admin-app").hidden=false;initAdminTabs();initContentActions();initReplyForm();initAdminForms();renderAllAdmin();}catch(error){document.getElementById("login-msg").textContent="This account is not an administrator.";await ncoSupabase.auth.signOut();} }
document.addEventListener("DOMContentLoaded",async()=>{initLogin();const {data:{session}}=await ncoSupabase.auth.getSession();if(session)await showAdmin();});
