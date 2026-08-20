/* ==========================================================================
   NEW COMMUNITY ORGANIZATION — script.js
   One shared file that powers every page: navigation, the shared content
   store (blog, events, gallery, achievements, donors), forms, the
   events calendar, the gallery lightbox, and the admin upload panel.

   CONTENT STORE
   -------------
   Content is stored in Supabase and is shared with every visitor.
   ========================================================================== */

function defaultData(){
  return {
    posts: [
      {
        id: "p1",
        title: "First Cohort Graduates from Women's Entrepreneurship Training",
        tag: "Women Empowerment",
        date: "2026-06-14",
        excerpt: "25 women from Mitundu completed an eight-week course in financial literacy, savings groups, and small-business planning.",
        body: "Twenty-five women from the Mitundu area completed our first eight-week entrepreneurship training, covering financial literacy, village savings and loans, and small-business planning. Graduates left with a business plan and access to a starter savings circle to help them launch or grow an income-generating activity.",
        image: ""
      },
      {
        id: "p2",
        title: "Climate-Smart Agriculture Demonstration Plot Launched",
        tag: "Agriculture",
        date: "2026-05-02",
        excerpt: "A new demonstration plot is teaching smallholder farmers conservation farming techniques ahead of the planting season.",
        body: "Ahead of the planting season, we set up a demonstration plot to show smallholder farmers conservation farming, intercropping, and water-harvesting techniques suited to a changing climate. Farmers who attend the demonstration days receive follow-up visits from our agriculture extension volunteers.",
        image: ""
      },
      {
        id: "p3",
        title: "Youth Leadership Program Opens Applications",
        tag: "Youth Empowerment",
        date: "2026-04-10",
        excerpt: "A six-month program for young people in Lilongwe District combining leadership training, mentorship, and community projects.",
        body: "We are opening applications for a six-month youth leadership program combining leadership training, mentorship from local role models, and a community project component. The program is open to young people aged 18-28 in Lilongwe District.",
        image: ""
      }
    ],
    events: [
      { id:"e1", title:"Women's Financial Literacy Workshop", date:"2026-08-22", time:"09:00", location:"Mitundu Community Hall", category:"Training" },
      { id:"e2", title:"Climate-Smart Agriculture Field Day", date:"2026-09-05", time:"08:30", location:"Patsankhondo Demonstration Plot", category:"Agriculture" },
      { id:"e3", title:"Youth Leadership Orientation", date:"2026-09-19", time:"10:00", location:"Lilongwe District Office", category:"Youth" },
      { id:"e4", title:"Community Tree-Planting Day", date:"2026-10-03", time:"07:30", location:"Mitundu Trading Centre", category:"Environment" }
    ],
    gallery: [
      { id:"g1", title:"Savings group meeting", category:"Women", image:"" },
      { id:"g2", title:"Demonstration plot walk-through", category:"Agriculture", image:"" },
      { id:"g3", title:"Youth leadership session", category:"Youth", image:"" },
      { id:"g4", title:"Community outreach day", category:"Community", image:"" },
      { id:"g5", title:"Entrepreneurship training", category:"Women", image:"" },
      { id:"g6", title:"Tree-planting activity", category:"Environment", image:"" }
    ],
    achievements: [
      { id:"a1", title:"25 women completed entrepreneurship training", date:"2026-06-14", note:"First cohort graduated with individual business plans and savings-circle access." },
      { id:"a2", title:"Demonstration plot established", date:"2026-05-02", note:"A conservation-farming demonstration plot is now training smallholder farmers each season." },
      { id:"a3", title:"Founding of New Community Organization", date:"2025-11-01", note:"Registered to focus on women, youth, agriculture, and community development in Lilongwe District." }
    ],
    donors: [
      { id:"d1", name:"Community well-wisher", note:"Supported the entrepreneurship training materials." },
      { id:"d2", name:"Local partner group", note:"Contributed seed and tools for the demonstration plot." }
    ],
    volunteers: [],
    messages: []
  };
}

async function loadData(includeDeleted = false){
  const seed = defaultData();
  const { data, error } = await ncoSupabase.from("site_content").select("section, payload");
  if(error){
    console.warn("Could not load website content from Supabase.", error.message);
    return seed;
  }
  data.forEach(row => { if(Array.isArray(row.payload)) seed[row.section] = row.payload; });
  if(!includeDeleted){
    ["posts", "events", "gallery", "achievements", "donors"].forEach(section => {
      seed[section] = seed[section].filter(item => !item.deletedAt);
    });
  }
  return seed;
}

async function saveData(data){
  const sections = ["posts", "events", "gallery", "achievements", "donors"];
  const rows = sections.map(section => ({ section, payload: data[section], updated_at: new Date().toISOString() }));
  const { error } = await ncoSupabase.from("site_content").upsert(rows);
  if(error) throw error;
}

function uid(prefix){
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

function formatDate(iso){
  const d = new Date(iso + "T00:00:00");
  if(isNaN(d)) return iso;
  return d.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
}

/* ==========================================================================
   NAV: mobile toggle + active link
   ========================================================================== */
function initNav(){
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if(toggle && links){
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));
  }
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(a => {
    const href = a.getAttribute("href");
    if(href === path || (path === "" && href === "index.html")){
      a.classList.add("active");
    }
  });
}

/* ==========================================================================
   HOME PAGE renderers
   ========================================================================== */
function renderHomeFeatured(data){
  const el = document.getElementById("home-posts");
  if(!el) return;
  const posts = [...data.posts].sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,3);
  el.innerHTML = posts.map(p => postCardHTML(p)).join("") || emptyState("No news posted yet.");
}

function renderHomeEvents(data){
  const el = document.getElementById("home-events");
  if(!el) return;
  const upcoming = [...data.events].filter(e => new Date(e.date) >= new Date(new Date().toDateString()))
    .sort((a,b)=> new Date(a.date)-new Date(b.date)).slice(0,3);
  el.innerHTML = upcoming.map(e => eventRowHTML(e)).join("") || emptyState("No upcoming events yet — check back soon.");
}

function renderHomeGallery(data){
  const el = document.getElementById("home-gallery");
  if(!el) return;
  const items = data.gallery.slice(0,6);
  el.innerHTML = items.map(g => galleryItemHTML(g)).join("") || emptyState("Gallery coming soon.");
  attachLightboxHandlers();
}

function renderImpactStrip(data){
  const el = document.getElementById("impact-strip");
  if(!el) return;
  el.querySelector("[data-stat='achievements']") && (el.querySelector("[data-stat='achievements']").textContent = data.achievements.length);
  el.querySelector("[data-stat='events']") && (el.querySelector("[data-stat='events']").textContent = data.events.length);
  el.querySelector("[data-stat='posts']") && (el.querySelector("[data-stat='posts']").textContent = data.posts.length);
}

/* ==========================================================================
   Shared card builders
   ========================================================================== */
function postCardHTML(p){
  return `
  <article class="post-card">
    <div class="post-media">${p.image ? `<img src="${p.image}" alt="${escapeHTML(p.title)}">` : svgPlaceholder("post")}</div>
    <div class="post-body">
      <span class="post-tag">${escapeHTML(p.tag||"Update")}</span>
      <span class="post-meta">${formatDate(p.date)}</span>
      <h3>${escapeHTML(p.title)}</h3>
      <p>${escapeHTML(p.excerpt||"")}</p>
      <a class="post-link" href="blog.html#${p.id}">Read more &rarr;</a>
    </div>
  </article>`;
}

function eventRowHTML(e){
  const d = new Date(e.date+"T00:00:00");
  const day = isNaN(d) ? "--" : d.getDate();
  const mon = isNaN(d) ? "" : d.toLocaleDateString("en-GB",{month:"short"});
  return `
  <div class="event-row">
    <div class="event-date"><strong>${day}</strong><span>${mon}</span></div>
    <div class="event-info">
      <span class="event-tag">${escapeHTML(e.category||"Event")}</span>
      <h3>${escapeHTML(e.title)}</h3>
      <p>${e.time?e.time+" &middot; ":""}${escapeHTML(e.location||"")}</p>
    </div>
    <a class="btn btn-secondary btn-sm" href="events.html#${e.id}">Details</a>
  </div>`;
}

function galleryItemHTML(g){
  return `
  <div class="gallery-item" data-category="${escapeHTML(g.category||"Community")}" data-img="${g.image||''}" data-caption="${escapeHTML(g.title||'')}">
    ${g.image ? `<img src="${g.image}" alt="${escapeHTML(g.title)}">` : svgPlaceholder("gallery")}
    <div class="gallery-caption">${escapeHTML(g.title||"")}</div>
  </div>`;
}

function achievementHTML(a){
  return `
  <div class="achievement-item">
    <div class="a-icon">&#9733;</div>
    <div>
      <time>${formatDate(a.date)}</time>
      <h4>${escapeHTML(a.title)}</h4>
      <p>${escapeHTML(a.note||"")}</p>
    </div>
  </div>`;
}

function emptyState(msg){
  return `<div class="gallery-empty">${escapeHTML(msg)}</div>`;
}

function svgPlaceholder(kind){
  return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M4 16l4.5-6 4 5 2.5-3L20 16" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="3" y="4" width="18" height="16" rx="2" stroke-linecap="round"/>
    <circle cx="8" cy="9" r="1.4"/>
  </svg>`;
}

function escapeHTML(str){
  return String(str||"").replace(/[&<>"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]));
}

/* ==========================================================================
   BLOG PAGE
   ========================================================================== */
function renderBlogPage(data){
  const el = document.getElementById("blog-list");
  if(!el) return;
  const posts = [...data.posts].sort((a,b)=> new Date(b.date)-new Date(a.date));
  el.innerHTML = posts.map(p => `
    <article class="post-card" id="${p.id}">
      <div class="post-media">${p.image ? `<img src="${p.image}" alt="${escapeHTML(p.title)}">` : svgPlaceholder("post")}</div>
      <div class="post-body">
        <span class="post-tag">${escapeHTML(p.tag||"Update")}</span>
        <span class="post-meta">${formatDate(p.date)}</span>
        <h3>${escapeHTML(p.title)}</h3>
        <p>${escapeHTML(p.body || p.excerpt || "")}</p>
      </div>
    </article>`).join("") || emptyState("No posts yet. Add one from the admin panel.");
}

/* ==========================================================================
   EVENTS PAGE + CALENDAR
   ========================================================================== */
function renderEventsPage(data){
  const el = document.getElementById("events-list");
  if(el){
    const events = [...data.events].sort((a,b)=> new Date(a.date)-new Date(b.date));
    el.innerHTML = events.map(e => `<div id="${e.id}">${eventRowHTML(e)}</div>`).join("") || emptyState("No events scheduled yet.");
  }
  buildCalendar(data.events);
}

let calState = { year:null, month:null };
function buildCalendar(events){
  const wrap = document.getElementById("calendar");
  if(!wrap) return;
  const today = new Date();
  if(calState.year===null){ calState.year = today.getFullYear(); calState.month = today.getMonth(); }

  const first = new Date(calState.year, calState.month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(calState.year, calState.month+1, 0).getDate();
  const monthName = first.toLocaleDateString("en-GB",{month:"long", year:"numeric"});

  const eventDays = new Set(events
    .filter(e => { const d = new Date(e.date+"T00:00:00"); return d.getFullYear()===calState.year && d.getMonth()===calState.month; })
    .map(e => new Date(e.date+"T00:00:00").getDate()));

  let cells = "";
  for(let i=0;i<startDow;i++) cells += `<div class="day empty"></div>`;
  for(let d=1; d<=daysInMonth; d++){
    cells += `<div class="day${eventDays.has(d)?' has-event':''}" title="${eventDays.has(d)?'Event scheduled':''}">${d}</div>`;
  }

  wrap.innerHTML = `
    <div class="cal-head">
      <h3>${monthName}</h3>
      <div class="cal-nav">
        <button type="button" id="cal-prev" aria-label="Previous month">&#8249;</button>
        <button type="button" id="cal-next" aria-label="Next month">&#8250;</button>
      </div>
    </div>
    <div class="cal-grid">
      <div class="dow">Su</div><div class="dow">Mo</div><div class="dow">Tu</div><div class="dow">We</div>
      <div class="dow">Th</div><div class="dow">Fr</div><div class="dow">Sa</div>
      ${cells}
    </div>`;

  document.getElementById("cal-prev").addEventListener("click", ()=>{
    calState.month--; if(calState.month<0){ calState.month=11; calState.year--; }
    buildCalendar(events);
  });
  document.getElementById("cal-next").addEventListener("click", ()=>{
    calState.month++; if(calState.month>11){ calState.month=0; calState.year++; }
    buildCalendar(events);
  });
}

/* ==========================================================================
   GALLERY PAGE
   ========================================================================== */
function renderGalleryPage(data){
  const el = document.getElementById("gallery-grid");
  if(!el) return;
  el.innerHTML = data.gallery.map(g => galleryItemHTML(g)).join("") || emptyState("No photos yet. Add some from the admin panel.");
  attachLightboxHandlers();

  const filterBar = document.getElementById("gallery-filters");
  if(filterBar){
    filterBar.addEventListener("click", (ev)=>{
      const btn = ev.target.closest(".filter-btn");
      if(!btn) return;
      filterBar.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.filter;
      el.querySelectorAll(".gallery-item").forEach(item=>{
        item.style.display = (cat==="all" || item.dataset.category===cat) ? "" : "none";
      });
    });
  }
}

function attachLightboxHandlers(){
  document.querySelectorAll(".gallery-item").forEach(item=>{
    item.addEventListener("click", ()=>{
      const img = item.dataset.img;
      const caption = item.dataset.caption;
      openLightbox(img, caption);
    });
  });
}

function openLightbox(img, caption){
  let lb = document.querySelector(".lightbox");
  if(!lb){
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `<button class="lightbox-close" aria-label="Close">&times;</button><img alt=""><div class="lightbox-caption"></div>`;
    document.body.appendChild(lb);
    lb.addEventListener("click", (e)=>{ if(e.target===lb || e.target.classList.contains("lightbox-close")) lb.classList.remove("open"); });
  }
  lb.querySelector("img").src = img || "";
  lb.querySelector("img").style.display = img ? "block" : "none";
  lb.querySelector(".lightbox-caption").textContent = caption || "";
  lb.classList.add("open");
}

/* ==========================================================================
   ACHIEVEMENTS / PROGRESS (used on About + Home)
   ========================================================================== */
function renderAchievements(data){
  const el = document.getElementById("achievements-list");
  if(!el) return;
  const items = [...data.achievements].sort((a,b)=> new Date(b.date)-new Date(a.date));
  el.innerHTML = items.map(achievementHTML).join("") || emptyState("Progress updates will appear here.");
}

/* ==========================================================================
   DONORS
   ========================================================================== */
function renderDonors(data){
  const el = document.getElementById("donor-wall");
  if(!el) return;
  el.innerHTML = data.donors.map(d => `
    <div class="donor-card"><strong>${escapeHTML(d.name)}</strong><span class="muted">${escapeHTML(d.note||"")}</span></div>
  `).join("") || emptyState("Be the first supporter on our donor wall.");
}

/* ==========================================================================
   FORMS: contact, volunteer, donate, newsletter
   ========================================================================== */
function handleFormSubmit(formId, onValid){
  const form = document.getElementById(formId);
  if(!form) return;
  const msg = form.querySelector(".form-msg");
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }
    try{
      await onValid(new FormData(form));
      form.reset();
      if(msg){ msg.className = "form-msg success"; msg.textContent = "Thank you — your submission has been received."; }
    }catch(error){
      console.error(error);
      if(msg){ msg.className = "form-msg error"; msg.textContent = "We could not send your submission. Please try again."; }
    }
  });
}

async function submitForm(payload){
  const { error } = await ncoSupabase.from("form_submissions").insert(payload);
  if(error) throw error;
  ncoSupabase.functions.invoke("send-notification", { body: payload }).catch(error => console.warn("Notification email was not sent.", error));
}

function initContactForm(){
  handleFormSubmit("contact-form", (fd)=> submitForm({
    kind:"contact", name: fd.get("name"), email: fd.get("email"),
    subject: fd.get("subject"), message: fd.get("message")
  }));
}

function initVolunteerForm(){
  handleFormSubmit("volunteer-form", (fd)=> submitForm({
    kind:"volunteer", name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone"),
    area: fd.get("area"), availability: fd.get("availability"), message: fd.get("message")
  }));
}

function initDonateForm(){
  const amountBtns = document.querySelectorAll(".donate-amount");
  const customInput = document.getElementById("donate-custom");
  amountBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      amountBtns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      if(customInput) customInput.value = btn.dataset.amount;
    });
  });
  handleFormSubmit("donate-form", (fd)=> submitForm({
    kind:"donation-intent", name: fd.get("name"), email: fd.get("email"),
    amount: Number(fd.get("amount")), method: fd.get("method")
  }));
}

function initNewsletterForm(){
  const form = document.getElementById("newsletter-form");
  if(!form) return;
  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const btn = form.querySelector("button");
    const original = btn.textContent;
    btn.textContent = "Subscribed ✓";
    form.reset();
    setTimeout(()=> btn.textContent = original, 2500);
  });
}

/* ==========================================================================
   PAGE BOOTSTRAP
   ========================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  initNav();
  const data = await loadData();

  renderHomeFeatured(data);
  renderHomeEvents(data);
  renderHomeGallery(data);
  renderImpactStrip(data);

  renderBlogPage(data);
  renderEventsPage(data);
  renderGalleryPage(data);
  renderAchievements(data);
  renderDonors(data);

  initContactForm();
  initVolunteerForm();
  initDonateForm();
  initNewsletterForm();

  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
});
