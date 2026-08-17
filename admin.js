/* ==========================================================================
   admin.js — powers admin.html only.
   Loaded after script.js, so it reuses loadData(), saveData(), uid(),
   formatDate() and escapeHTML() from there.
   ========================================================================== */

let ADMIN_DATA = null;

function fileToDataURL(file){
  return new Promise((resolve, reject) => {
    if(!file){ resolve(""); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function initAdminTabs(){
  const buttons = document.querySelectorAll(".admin-side button");
  const pages = document.querySelectorAll(".admin-tabpage");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      pages.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
  });
}

/* ---------- Achievements / Progress ---------- */
function renderAdminAchievements(){
  const tbody = document.querySelector("#table-achievements tbody");
  tbody.innerHTML = ADMIN_DATA.achievements.map(a => `
    <tr>
      <td>${formatDate(a.date)}</td>
      <td><strong>${escapeHTML(a.title)}</strong><br><span class="muted">${escapeHTML(a.note||"")}</span></td>
      <td><button class="del-btn" data-id="${a.id}" data-type="achievements">Delete</button></td>
    </tr>`).join("") || `<tr><td colspan="3" class="muted">No milestones yet.</td></tr>`;
}

/* ---------- Blog posts ---------- */
function renderAdminPosts(){
  const tbody = document.querySelector("#table-posts tbody");
  tbody.innerHTML = ADMIN_DATA.posts.map(p => `
    <tr>
      <td>${formatDate(p.date)}</td>
      <td><strong>${escapeHTML(p.title)}</strong><br><span class="muted">${escapeHTML(p.tag||"")}</span></td>
      <td><button class="del-btn" data-id="${p.id}" data-type="posts">Delete</button></td>
    </tr>`).join("") || `<tr><td colspan="3" class="muted">No posts yet.</td></tr>`;
}

/* ---------- Events ---------- */
function renderAdminEvents(){
  const tbody = document.querySelector("#table-events tbody");
  tbody.innerHTML = ADMIN_DATA.events.map(e => `
    <tr>
      <td>${formatDate(e.date)}${e.time ? " · "+e.time : ""}</td>
      <td><strong>${escapeHTML(e.title)}</strong><br><span class="muted">${escapeHTML(e.location||"")}</span></td>
      <td><button class="del-btn" data-id="${e.id}" data-type="events">Delete</button></td>
    </tr>`).join("") || `<tr><td colspan="3" class="muted">No events yet.</td></tr>`;
}

/* ---------- Gallery ---------- */
function renderAdminGallery(){
  const wrap = document.getElementById("admin-gallery-grid");
  wrap.innerHTML = ADMIN_DATA.gallery.map(g => `
    <div class="card" style="padding:10px;">
      <div class="post-media" style="margin-bottom:10px; border-radius:8px;">
        ${g.image ? `<img src="${g.image}" alt="${escapeHTML(g.title)}" style="width:100%;height:100%;object-fit:cover;">` : svgPlaceholder("gallery")}
      </div>
      <p style="margin:0 0 4px; font-weight:700; font-size:.88rem;">${escapeHTML(g.title)}</p>
      <p class="muted" style="margin:0 0 10px; font-size:.8rem;">${escapeHTML(g.category)}</p>
      <button class="del-btn" data-id="${g.id}" data-type="gallery">Delete</button>
    </div>`).join("") || `<p class="muted">No photos yet.</p>`;
}

/* ---------- Donors ---------- */
function renderAdminDonors(){
  const tbody = document.querySelector("#table-donors tbody");
  tbody.innerHTML = ADMIN_DATA.donors.map(d => `
    <tr>
      <td><strong>${escapeHTML(d.name)}</strong></td>
      <td>${escapeHTML(d.note||"")}</td>
      <td><button class="del-btn" data-id="${d.id}" data-type="donors">Delete</button></td>
    </tr>`).join("") || `<tr><td colspan="3" class="muted">No donors listed yet.</td></tr>`;
}

/* ---------- Volunteers (read-only, from public form) ---------- */
function renderAdminVolunteers(){
  const tbody = document.querySelector("#table-volunteers tbody");
  tbody.innerHTML = ADMIN_DATA.volunteers.map(v => `
    <tr>
      <td>${new Date(v.date).toLocaleDateString("en-GB")}</td>
      <td><strong>${escapeHTML(v.name)}</strong><br><span class="muted">${escapeHTML(v.email)}</span></td>
      <td>${escapeHTML(v.area||"")}</td>
      <td><button class="del-btn" data-id="${v.id}" data-type="volunteers">Delete</button></td>
    </tr>`).join("") || `<tr><td colspan="4" class="muted">No volunteer applications yet.</td></tr>`;
}

/* ---------- Messages (read-only, from public form) ---------- */
function renderAdminMessages(){
  const tbody = document.querySelector("#table-messages tbody");
  tbody.innerHTML = ADMIN_DATA.messages.map(m => `
    <tr>
      <td>${new Date(m.date).toLocaleDateString("en-GB")}</td>
      <td><strong>${escapeHTML(m.name)}</strong><br><span class="muted">${escapeHTML(m.email)}</span></td>
      <td>${escapeHTML(m.type === "donation-intent" ? ("Donation intent — $"+escapeHTML(m.amount)+" ("+escapeHTML(m.method)+")") : (m.subject||"") + (m.message ? ": "+escapeHTML(m.message) : ""))}</td>
      <td><button class="del-btn" data-id="${m.id}" data-type="messages">Delete</button></td>
    </tr>`).join("") || `<tr><td colspan="4" class="muted">No messages yet.</td></tr>`;
}

function renderAllAdmin(){
  renderAdminAchievements();
  renderAdminPosts();
  renderAdminEvents();
  renderAdminGallery();
  renderAdminDonors();
  renderAdminVolunteers();
  renderAdminMessages();
}

function initDeleteHandlers(){
  document.getElementById("admin-shell").addEventListener("click", (e) => {
    const btn = e.target.closest(".del-btn");
    if(!btn) return;
    const type = btn.dataset.type;
    const id = btn.dataset.id;
    if(!confirm("Delete this item? This cannot be undone.")) return;
    ADMIN_DATA[type] = ADMIN_DATA[type].filter(item => item.id !== id);
    saveData(ADMIN_DATA);
    renderAllAdmin();
  });
}

function initAdminForms(){
  document.getElementById("form-achievement").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    ADMIN_DATA.achievements.push({
      id: uid("a"), title: fd.get("title"), date: fd.get("date"), note: fd.get("note")
    });
    saveData(ADMIN_DATA);
    e.target.reset();
    renderAdminAchievements();
  });

  document.getElementById("form-post").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const image = await fileToDataURL(fd.get("image"));
    ADMIN_DATA.posts.push({
      id: uid("p"), title: fd.get("title"), tag: fd.get("tag"), date: fd.get("date"),
      excerpt: fd.get("excerpt"), body: fd.get("body"), image
    });
    saveData(ADMIN_DATA);
    e.target.reset();
    renderAdminPosts();
  });

  document.getElementById("form-event").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    ADMIN_DATA.events.push({
      id: uid("e"), title: fd.get("title"), date: fd.get("date"), time: fd.get("time"),
      location: fd.get("location"), category: fd.get("category")
    });
    saveData(ADMIN_DATA);
    e.target.reset();
    renderAdminEvents();
  });

  document.getElementById("form-gallery").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const image = await fileToDataURL(fd.get("image"));
    if(!image){ alert("Please choose a photo to upload."); return; }
    ADMIN_DATA.gallery.push({
      id: uid("g"), title: fd.get("title"), category: fd.get("category"), image
    });
    saveData(ADMIN_DATA);
    e.target.reset();
    renderAdminGallery();
  });

  document.getElementById("form-donor").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    ADMIN_DATA.donors.push({ id: uid("d"), name: fd.get("name"), note: fd.get("note") });
    saveData(ADMIN_DATA);
    e.target.reset();
    renderAdminDonors();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ADMIN_DATA = loadData();
  initAdminTabs();
  initDeleteHandlers();
  initAdminForms();
  renderAllAdmin();
});
