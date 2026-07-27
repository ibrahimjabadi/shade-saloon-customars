/* ===================== SHADI SALOON — unified app shell =====================
   Bottom-tab-bar app: Home (browse + book) / My Bookings / Profile.
   Booking happens as a full-screen in-app overlay, not a separate page —
   this file merges what used to be branch.js + customer.js into one shell.
   Translation strings live in i18n.js (loaded before this file) as the `t`
   object; tr(key) below reads from it.

   TWO RULES FOR ANYONE ADDING NEW render()-style functions in this file:

   1. Any backend-supplied text placed into the HTML string — names,
      categories, titles, descriptions, addresses, anything an admin typed
      into a form somewhere — MUST go through escHtml(...). This app already
      had a real XSS bug from a service category name skipping this once;
      don't reintroduce it. When in doubt, escape it.

   2. Never build an onclick="..." attribute by interpolating a backend
      value into the string (e.g. onclick="doThing('${x.id}')"). A stray
      quote in that value breaks out of the attribute and runs arbitrary JS.
      Use data-action / data-id / data-index / data-date attributes instead
      and add a case to the single delegated click handler near the top of
      this file (search for "Central click dispatcher"). Static onclick
      handlers with no interpolated value (onclick="bookingNext()") are fine
      as-is. */

const DAY_KEYS=["sun","mon","tue","wed","thu","fri","sat"];

// All customer-token/account persistence goes through this one object.
// Today it's localStorage (simplest option that works with a cross-origin
// backend without extra CORS/cookie coordination). It's XSS-exposed in
// principle, same as any localStorage-held credential — moving to an
// httpOnly cookie would remove that exposure, but requires the *backend* to
// set the cookie on register/login and to allow credentialed cross-origin
// requests (this app and its backend are typically on different domains).
// That's a backend-side change outside this package. Keeping every read/
// write behind these three functions means that migration, whenever it
// happens, only touches this one spot instead of ~10 scattered call sites.
const authStorage={
  getToken(){ return localStorage.getItem("customerToken")||""; },
  getAccount(){ try{ return JSON.parse(localStorage.getItem("customerAccount")||"null"); }catch(e){ return null; } },
  save(token,account){ localStorage.setItem("customerToken",token); localStorage.setItem("customerAccount",JSON.stringify(account)); },
  clear(){ localStorage.removeItem("customerToken"); localStorage.removeItem("customerAccount"); }
};

const state={
  lang:localStorage.getItem("customerLang")||"ar",
  token:authStorage.getToken(),
  account:authStorage.getAccount(),
  settings:null, branches:[], services:[], barbers:[],
  branchId:localStorage.getItem("customerBranchId")||"",
  tab:"home", homeTab:"services",
  myBookings:null, myBookingsError:null, myBookingsLoading:false, myBookingsActionError:null,
  booking:null, reschedule:null, last:null, error:null
};

const API_BASE=(typeof window!=="undefined" && window.SHADI_API_BASE) || "";
function tr(k){return t[state.lang][k]||k}
function app(){return document.getElementById("app")}
function escHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
const CURRENCY_ALIASES={JD:"JOD"};
function money(v){
  const raw=(state.settings?.currency||"JOD").toUpperCase();
  const code=CURRENCY_ALIASES[raw]||raw;
  const amount=Number(v||0);
  try{
    return new Intl.NumberFormat(state.lang==="ar"?"ar":"en",{style:"currency",currency:code,minimumFractionDigits:2,maximumFractionDigits:2}).format(amount);
  }catch(e){
    return `${amount.toFixed(2)} ${raw}`;
  }
}
function serviceName(s){return state.lang==="ar"?(s.nameAr||s.name):s.name}
function val(id){return document.getElementById(id)?.value||""}
function applyLang(){document.documentElement.lang=state.lang;document.documentElement.dir=state.lang==="ar"?"rtl":"ltr";document.body.dir=state.lang==="ar"?"rtl":"ltr"}
function setLang(l){state.lang=l;localStorage.setItem("customerLang",l);applyLang();render()}
async function api(url,opt={}){
  const h={"Content-Type":"application/json",...(opt.headers||{})};
  if(state.token)h["x-customer-token"]=state.token;
  let r;
  try{
    r=await fetch(API_BASE+url,{...opt,headers:h});
  }catch(networkErr){
    // fetch() itself throws for offline/DNS/CORS failures — before we even
    // get a response to read. These have nothing to do with the backend's
    // business logic, so always show the same localized network message
    // instead of a raw browser error like "Failed to fetch".
    if(networkErr.name==="AbortError") throw networkErr; // deliberate cancellation, let callers handle it
    throw new Error(tr("errNetwork"));
  }
  const d=await r.json().catch(()=>({}));
  if(!r.ok){
    // Best-effort normalization: the backend is a separate project we don't
    // fully control, so we can't map every possible error string it might
    // send. If it gives us a message, we pass it through as-is (may be
    // English even in an Arabic UI — tracked as a known limitation until the
    // backend adopts a stable `code` field we can map 1:1 to tr() keys).
    // If it gives us nothing at all, fall back to a localized generic message
    // rather than showing "Request failed" or an empty string.
    throw new Error(d.error || tr("errGeneric"));
  }
  return d;
}
if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})})}

state.offline = typeof navigator!=="undefined" && "onLine" in navigator ? !navigator.onLine : false;
window.addEventListener("online", ()=>{ state.offline=false; render(); });
window.addEventListener("offline", ()=>{ state.offline=true; render(); });
// Keeps Tab-key focus cycling inside whichever modal is currently open,
// instead of letting it escape to the page content behind it.
function trapTabKey(e,containerSelector){
  const container=document.querySelector(containerSelector);
  if(!container) return false;
  const focusables=Array.from(container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>el.offsetParent!==null);
  if(!focusables.length) return false;
  const first=focusables[0], last=focusables[focusables.length-1];
  if(!container.contains(document.activeElement)){ e.preventDefault(); first.focus(); return true; }
  if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); return true; }
  if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); return true; }
  return true;
}
// Central click dispatcher (event delegation): every interactive element
// that needs a *dynamic* value (an id, index, or date coming from data —
// not a hardcoded string) uses data-action/data-id/data-index/data-date
// instead of embedding that value inside an onclick="..." string. This
// avoids ever building a JS-string-inside-an-HTML-attribute again, which is
// exactly the shape of bug that caused the category XSS fix earlier.
// One listener here covers the whole app, including modals appended
// directly to <body> (year calendar, staff lightbox), since it's bound at
// the document level and doesn't need to be re-attached after re-renders.
document.addEventListener("click",(e)=>{
  const el=e.target.closest("[data-action]");
  if(!el) return;
  const action=el.dataset.action, id=el.dataset.id, date=el.dataset.date;
  const index=el.dataset.index!==undefined?Number(el.dataset.index):undefined;
  switch(action){
    case "toggle-lang": setLang(state.lang==="ar"?"en":"ar"); break;
    case "set-tab": setTab(id); break;
    case "open-booking": openBooking(id); break;
    case "open-staff": openStaffLightbox(id); break;
    case "switch-branch": switchBranch(id); break;
    case "set-home-tab": setHomeTab(id); break;
    case "pick-cat": pickBkCat(index); break;
    case "toggle-bk-service": toggleBkService(id); break;
    case "pick-barber": state.booking.barberId=id; state.booking.slot=null; render(); break;
    case "pick-quick-day": state.booking.date=date; state.booking.slot=null; render(); setTimeout(loadSlots,0); break;
    case "pick-year-day": state.booking.date=date; state.booking.slot=null; document.getElementById("yearModal")?.remove(); render(); setTimeout(loadSlots,0); break;
    case "pick-slot": pickSlot(index); break;
    case "cancel-booking": cancelMyBooking(id,el); break;
    case "open-reschedule": openReschedule(id); break;
    case "close-reschedule": closeReschedule(); break;
    case "pick-reschedule-quick-day": if(state.reschedule){ state.reschedule.date=date; state.reschedule.slot=null; render(); setTimeout(loadRescheduleSlots,0); } break;
    case "pick-reschedule-slot": pickRescheduleSlot(index); break;
    case "confirm-reschedule": confirmReschedule(el); break;
  }
});
window.addEventListener("keydown", (e)=>{
  if(e.key==="Tab"){
    // Precedence matches the Escape handler below: innermost open overlay wins.
    if(document.querySelector(".year-modal")){ trapTabKey(e,".year-modal"); return; }
    if(state.booking||state.reschedule){ trapTabKey(e,".booking-overlay"); return; }
    return;
  }
  if(e.key!=="Escape") return;
  const modal=document.getElementById("yearModal");
  if(modal){ modal.remove(); return; }
  const lightbox=document.querySelector(".year-modal");
  if(lightbox){ lightbox.remove(); return; }
  if(state.reschedule){ closeReschedule(); return; }
  if(state.booking){ closeBooking(); }
});

/* ===================== bootstrap ===================== */
async function bootstrap(){
  applyLang();
  render();
  try{
    const d=await api("/api/bootstrap");
    Object.assign(state,{
      settings:d.settings,
      branches:d.branches.filter(b=>b.active),
      services:d.services.filter(s=>s.active),
      barbers:d.barbers.filter(b=>b.active)
    });
    // Legacy deep link support: /branch/xyz still preselects that branch.
    const m=window.location.pathname.match(/^\/branch\/([^/]+)/);
    if(m) state.branchId=decodeURIComponent(m[1]);
    if(!state.branchId || !state.branches.some(b=>b.id===state.branchId)) state.branchId=state.branches[0]?.id;
    if(state.token){
      try{ state.account=await api("/api/customer/me"); }
      catch(e){ state.token=""; state.account=null; authStorage.clear(); }
    }
  }catch(e){
    state.error=e.message;
  }
  render();
}

/* ===================== shell render ===================== */
function skeletonHome(){
  return `<div role="status" aria-live="polite"><span class="sr-only">${tr("loading")}</span></div>
    <div aria-hidden="true">
      <div class="skel-hero skel"></div>
      <div class="skel-tabs">${Array.from({length:4}).map(()=>`<div class="skel"></div>`).join("")}</div>
      ${Array.from({length:4}).map(()=>`<div class="skel-row"><div style="flex:1"><div class="skel skel-line w-60"></div><div class="skel skel-line w-40"></div></div><div class="skel skel-btn"></div></div>`).join("")}
    </div>`;
}
function render(){
  if(state.error){ app().innerHTML=configErrorHtml({message:state.error}); return; }
  if(!state.settings){ app().innerHTML=shellHtml(skeletonHome()); return; }
  let content="";
  if(state.tab==="home") content=homeView();
  else if(state.tab==="bookings") content=bookingsView();
  else content=profileView();
  app().innerHTML = shellHtml(content) + (state.booking ? bookingOverlayHtml() : "") + (state.reschedule ? rescheduleOverlayHtml() : "");
  if(state.booking){
    const closeBtn=document.querySelector(".booking-overlay .booking-close");
    if(closeBtn && document.activeElement!==closeBtn) closeBtn.focus({preventScroll:true});
  }
  if(state.reschedule && !state.reschedule.focused){
    // Focus once, the first time this overlay paints — not on every
    // render() while it's open (picking a quick-day or a slot both call
    // render() too, and re-stealing focus each time would yank it away
    // from whatever the person just clicked, same trap avoided for the
    // year-calendar modal above).
    state.reschedule.focused=true;
    const closeBtn=document.querySelector('[data-action="close-reschedule"]');
    if(closeBtn && document.activeElement!==closeBtn) closeBtn.focus({preventScroll:true});
  }
}
function shellHtml(content){
  return `
    ${state.offline?`<div class="offline-banner" role="status">${tr("offline")}</div>`:""}
    <div class="app-topbar">
      <img class="app-logo" src="/assets/shadi-logo.png" alt="SHADI SALOON">
      <button class="app-lang-btn" aria-label="${state.lang==="ar"?"Switch to English":"التبديل للعربية"}" data-action="toggle-lang">${state.lang==="ar"?"EN":"عربي"}</button>
    </div>
    <div class="app-content"><div class="app-content-inner">${content}</div></div>
    <div class="app-tabbar" role="tablist" aria-label="${state.lang==="ar"?"التنقل الرئيسي":"Main navigation"}">
      ${tabBtn("home",iconHome(),tr("home"))}
      ${tabBtn("bookings",iconCalendar(),tr("myBookings"))}
      ${tabBtn("profile",iconUser(),tr("profile"))}
    </div>
  `;
}
function tabBtn(id,icon,label){
  const active=state.tab===id;
  return `<button class="app-tab ${active?"active":""}" role="tab" aria-selected="${active}" aria-current="${active?"page":"false"}" data-action="set-tab" data-id="${escHtml(id)}"><span class="tab-icon-wrap" aria-hidden="true">${icon}</span><span>${label}</span></button>`;
}
function setTab(id){
  state.tab=id;
  render();
  if(id==="bookings") loadMyBookings();
}
function iconHome(){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/></svg>`}
function iconCalendar(){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>`}
function iconUser(){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5"/></svg>`}

/* ===================== business-hours helpers ===================== */
function parseHM(s){ if(!s||typeof s!=="string"||!/^\d{1,2}:\d{2}$/.test(s)) return null; const [h,m]=s.split(":").map(Number); return h*60+m; }
function zonedNow(timezone){
  if(timezone){
    try{
      const fmt=new Intl.DateTimeFormat("en-US",{timeZone:timezone,weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false});
      const parts=fmt.formatToParts(new Date());
      const map={}; parts.forEach(p=>map[p.type]=p.value);
      const weekdayMap={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
      const weekday=weekdayMap[map.weekday];
      let hour=Number(map.hour); if(hour===24)hour=0;
      if(weekday!=null && !Number.isNaN(hour) && !Number.isNaN(Number(map.minute))){
        return {weekday, minutes:hour*60+Number(map.minute)};
      }
    }catch(e){ /* invalid timezone string — fall through to browser time below */ }
  }
  const d=new Date();
  return {weekday:d.getDay(), minutes:d.getHours()*60+d.getMinutes()};
}
function computeOpenStatus(hours,timezone){
  if(!hours || typeof hours!=="object") return null;
  const zn=zonedNow(timezone);
  const nowMin=zn.minutes;
  const key=DAY_KEYS[zn.weekday];
  const today=hours[key];
  const yest=hours[DAY_KEYS[(zn.weekday+6)%7]];
  if(yest && !yest.closed){
    const yo=parseHM(yest.open), yc=parseHM(yest.close);
    if(yo!=null && yc!=null && yc<=yo && nowMin<yc) return {open:true,closesAt:yest.close};
  }
  if(!today || today.closed) return {open:false,next:findNextOpen(hours,zn.weekday)};
  const o=parseHM(today.open), c=parseHM(today.close);
  if(o==null||c==null) return {open:false,next:findNextOpen(hours,zn.weekday)};
  let isOpen;
  if(c>o){ isOpen = nowMin>=o && nowMin<c; } else { isOpen = nowMin>=o; }
  if(isOpen) return {open:true,closesAt:today.close};
  if(nowMin<o) return {open:false,opensAt:today.open};
  return {open:false,next:findNextOpen(hours,zn.weekday)};
}
function findNextOpen(hours,fromWeekday){
  for(let i=1;i<=7;i++){
    const idx=(fromWeekday+i)%7;
    const d=hours[DAY_KEYS[idx]];
    if(d && !d.closed && parseHM(d.open)!=null) return {day:DAY_KEYS[idx],time:d.open};
  }
  return null;
}
function renderOpenBadge(hours,timezone){
  const status=computeOpenStatus(hours,timezone);
  if(!status) return "";
  if(status.open) return `<span class="status-badge open">● ${tr("openNow")} · ${tr("closesAt")} ${escHtml(status.closesAt)}</span>`;
  if(status.opensAt) return `<span class="status-badge closed">● ${tr("closedNow")} · ${tr("opensAt")} ${escHtml(status.opensAt)}</span>`;
  if(status.next) return `<span class="status-badge closed">● ${tr("closedNow")} · ${tr("opensAt")} ${escHtml(tr(status.next.day))} ${escHtml(status.next.time)}</span>`;
  return `<span class="status-badge closed">● ${tr("closedNow")}</span>`;
}
function renderHoursTable(hours,timezone){
  if(!hours || typeof hours!=="object") return "";
  const tKey=DAY_KEYS[zonedNow(timezone).weekday];
  return `<div class="hours-table">${DAY_KEYS.map(k=>{
    const d=hours[k]; const isToday=k===tKey;
    const line=(!d||d.closed)?`<span class="hours-closed">${tr("closedDay")}</span>`:`<span>${escHtml(d.open)} – ${escHtml(d.close)}</span>`;
    return `<div class="hours-row${isToday?" today":""}"><span class="hours-day">${tr(k)}${isToday?` (${tr("today")})`:""}</span>${line}</div>`;
  }).join("")}</div>`;
}
const AMENITY_ICONS={
  parking:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 16V8h4a3 3 0 0 1 0 6H9"/></svg>`,
  wheelchair:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="5" r="1.6"/><path d="M11 8v5l-3 7M11 13h5l3 6M8 13h8"/></svg>`,
  wifi:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 9a11 11 0 0 1 14 0M8 12.5a7 7 0 0 1 8 0M11 16a3 3 0 0 1 2 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></svg>`,
  card:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/></svg>`,
  kids:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="6" r="2.6"/><path d="M6 20c0-4 2.7-6.5 6-6.5S18 16 18 20"/></svg>`,
  transport:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="12" rx="3"/><path d="M4 12h16M8 20l1.4-2M16 20l-1.4-2"/><circle cx="8" cy="16" r=".6" fill="currentColor"/><circle cx="16" cy="16" r=".6" fill="currentColor"/></svg>`
};
const AMENITY_LABELS={
  parking:{ar:"موقف سيارات",en:"Parking"}, wheelchair:{ar:"دخول كراسي متحركة",en:"Wheelchair accessible"},
  wifi:{ar:"واي فاي مجاني",en:"Free WiFi"}, card:{ar:"الدفع بالبطاقة",en:"Card payment"},
  kids:{ar:"مناسب للأطفال",en:"Kid friendly"}, transport:{ar:"قريب من مواصلات",en:"Near public transport"}
};
function renderAmenities(list){
  if(!Array.isArray(list)||!list.length) return "";
  return `<div class="amenity-grid">${list.map(key=>{
    const icon=AMENITY_ICONS[key]||`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12l5 5L19 7"/></svg>`;
    const label=AMENITY_LABELS[key]?AMENITY_LABELS[key][state.lang]:String(key);
    return `<div class="amenity-item"><span class="amenity-icon">${icon}</span><span>${escHtml(label)}</span></div>`;
  }).join("")}</div>`;
}

/* ===================== HOME tab ===================== */
function currentBranch(){ return state.branches.find(b=>b.id===state.branchId); }
function switchBranch(id){ state.branchId=id; localStorage.setItem("customerBranchId",id); state.homeTab="services"; render(); }
function setHomeTab(id){ state.homeTab=id; render(); }

function homeView(){
  const b=currentBranch();
  if(!b) return `<div class="empty-state">${tr("notFound")}</div>`;
  const desc=state.lang==="ar"?(b.descriptionAr||b.description):b.description;
  const hasHours=b.businessHours && typeof b.businessHours==="object";
  const hasAmenities=Array.isArray(b.amenities)&&b.amenities.length>0;
  const statusBadge=hasHours?renderOpenBadge(b.businessHours,b.timezone):"";
  const servicesByCategory={};
  (b.services||state.services.filter(s=>!s.branchId||s.branchId===b.id)||[]).forEach(s=>{
    const cat=s.category||tr("services"); (servicesByCategory[cat]=servicesByCategory[cat]||[]).push(s);
  });

  const tabs=[{id:"services",label:tr("services")},{id:"photos",label:tr("photos")},{id:"staff",label:tr("staff")},{id:"info",label:tr("info")}];
  const active=state.homeTab||"services";

  let panel="";
  if(active==="services"){
    panel=Object.keys(servicesByCategory).length
      ? Object.entries(servicesByCategory).map(([cat,list])=>`
        <div class="service-category"><h3>${escHtml(cat)}</h3><div class="grid">
          ${list.map(s=>{
            const sel=(state.booking?.selectedServices||[]).includes(s.id);
            return `<div class="service-row">
              <div><strong>${serviceName(s)}</strong><div class="meta">${s.duration} ${tr("min")} · ${money(s.price)}</div></div>
              <button class="service-book-btn ${sel?"added":""}" data-action="open-booking" data-id="${escHtml(s.id)}">${sel?"✓ "+tr("added"):tr("book")}</button>
            </div>`;
          }).join("")}
        </div></div>`).join("")
      : `<p class="muted">${tr("noServices")}</p>`;
  } else if(active==="photos"){
    panel=b.galleryPhotos?.length
      ? `<div class="gallery-grid">${b.galleryPhotos.map(p=>`<div class="gallery-item"><img src="${escHtml(p.url)}" alt="${escHtml(p.caption||"")}" loading="lazy"></div>`).join("")}</div>`
      : `<p class="muted">${tr("noPhotos")}</p>`;
  } else if(active==="staff"){
    panel=b.staff?.length
      ? `<div class="staff-grid">${b.staff.map(s=>`<div class="staff-card" data-action="open-staff" data-id="${escHtml(s.id)}"><div class="staff-photo" ${s.photoUrl?`style="background-image:url('${escHtml(s.photoUrl)}')"`:""}>${s.photoUrl?"":escHtml((s.name||"?").trim()[0]||"?")}</div><strong>${escHtml(s.name)}</strong><span class="muted">${escHtml(s.title||"")}</span></div>`).join("")}</div>`
      : `<p class="muted">${tr("noStaff")}</p>`;
  } else {
    panel=`
      ${desc?`<h3>${tr("about")}</h3><p class="muted">${escHtml(desc)}</p>`:""}
      ${hasHours?`<h3>${tr("workingHours")}</h3>${renderHoursTable(b.businessHours,b.timezone)}`:""}
      ${hasAmenities?`<h3>${tr("amenities")}</h3>${renderAmenities(b.amenities)}`:""}
      <div class="contact-actions">
        ${b.phone?`<a class="btn secondary" href="tel:${escHtml(b.phone)}">${tr("callUs")}</a>`:""}
        ${b.googleMapsUrl?`<a class="btn secondary" href="${escHtml(b.googleMapsUrl)}" target="_blank" rel="noopener">${tr("getDirections")}</a>`:""}
      </div>
      ${(!desc && !hasHours && !hasAmenities && !b.phone && !b.googleMapsUrl)?`<p class="muted">${tr("noPhotos")}</p>`:""}
    `;
  }

  return `
    ${state.branches.length>1?`<div class="branch-switcher">${state.branches.map(br=>`<button class="branch-switch-chip ${br.id===b.id?"active":""}" data-action="switch-branch" data-id="${escHtml(br.id)}">${escHtml(br.name)}</button>`).join("")}</div>`:""}
    <div class="home-hero" ${b.galleryPhotos?.[0]?`style="background-image:linear-gradient(180deg,rgba(10,10,11,.35),rgba(10,10,11,.96)),url('${escHtml(b.galleryPhotos[0].url)}')"`:""}>
      <h1>${escHtml(b.name)}</h1>
      <p>${escHtml(b.address||b.city||"")}</p>
      ${statusBadge}
      <div class="home-hero-actions">
        <button class="btn gold" onclick="openBooking()">${tr("bookNow")}</button>
        ${b.phone?`<a class="btn secondary" href="tel:${escHtml(b.phone)}">${tr("callUs")}</a>`:""}
      </div>
    </div>
    <div class="home-tabs">${tabs.map(tb=>`<button class="home-tab ${tb.id===active?"active":""}" data-action="set-home-tab" data-id="${escHtml(tb.id)}">${escHtml(tb.label)}</button>`).join("")}</div>
    <div>${panel}</div>
  `;
}
function openStaffLightbox(staffId){
  const b=currentBranch();
  const s=(b?.staff||[]).find(x=>x.id===staffId);
  if(!s)return;
  const photos=s.portfolioPhotos||[];
  const box=document.createElement("div");
  box.className="year-modal";
  box.setAttribute("role","dialog");
  box.setAttribute("aria-modal","true");
  box.setAttribute("aria-label",s.name||"");
  box.onclick=(e)=>{ if(e.target===box) box.remove(); };
  box.innerHTML=`<div class="year-panel"><div class="year-top"><h2>${escHtml(s.name)}</h2><button class="modal-init-focus" aria-label="${state.lang==="ar"?"إغلاق":"Close"}" onclick="this.closest('.year-modal').remove()">×</button></div>${photos.length?`<div class="gallery-grid">${photos.map(p=>`<div class="gallery-item"><img src="${escHtml(p.url)}" alt=""></div>`).join("")}</div>`:`<p class="muted">${tr("noPhotos")}</p>`}</div>`;
  document.body.appendChild(box);
  box.querySelector(".modal-init-focus")?.focus({preventScroll:true});
}

/* ===================== MY BOOKINGS tab ===================== */
async function loadMyBookings(){
  if(!state.account){ render(); return; }
  state.myBookingsLoading=true; state.myBookingsError=null; state.myBookingsActionError=null; render();
  try{
    const d=await api("/api/customer/bookings");
    state.myBookings=d.bookings||(Array.isArray(d)?d:[]);
  }catch(e){
    state.myBookingsError=e.message;
    state.myBookings=null;
  }
  state.myBookingsLoading=false;
  render();
}
function bookingsView(){
  if(!state.account){
    return `<div class="empty-state"><p>${tr("myBookingsLoginPrompt")}</p><button class="btn gold" style="width:auto;margin-top:10px" onclick="setTab('profile')">${tr("goToProfile")}</button></div>`;
  }
  if(state.myBookingsLoading && !state.myBookings) return `<div role="status" aria-live="polite"><span class="sr-only">${tr("loading")}</span></div><div aria-hidden="true">${Array.from({length:3}).map(()=>`<div class="skel-card"><div class="skel skel-line" style="width:40%"></div><div class="skel skel-line" style="width:70%"></div><div class="skel skel-line" style="width:50%"></div></div>`).join("")}</div>`;
  if(state.myBookingsError) return `<div class="empty-state"><p>${escHtml(tr("myBookingsUnavailable"))}</p></div>`;
  const list=state.myBookings||[];
  if(!list.length) return `<div class="empty-state"><p>${tr("myBookingsEmpty")}</p><p class="muted">${tr("myBookingsEmptyHint")}</p></div>`;
  const now=Date.now();
  const s=state.settings||{};
  const errBanner=state.myBookingsActionError?`<div class="item" style="margin-bottom:12px;border-color:rgba(180,60,60,.4)">${escHtml(state.myBookingsActionError)}</div>`:"";
  return errBanner+list.map(bk=>{
    const startMs=new Date(bk.start).getTime();
    const status=bk.status || (startMs<now ? "completed":"upcoming");
    const svcNames=(bk.services||[]).map(s=>s.nameAr||s.name).join("، ");
    const dateLabel=bk.startLabel || new Date(bk.start).toLocaleString(state.lang);
    // Only an active, still-future booking can be touched at all — mirrors
    // the exact same status check the backend enforces server-side, so the
    // buttons don't promise something the API will then reject.
    const editable=!["cancelled","completed","no_show"].includes(bk.status) && startMs>now;
    const canCancel=editable && s.allowCustomerCancel!==false;
    const canReschedule=editable && s.allowCustomerReschedule!==false;
    return `<div class="booking-card">
      <div class="bk-top"><strong>${escHtml(bk.branch?.name||"")}</strong><span class="bk-status ${status}">${tr(status)||status}</span></div>
      <div class="muted" style="margin-top:6px">${escHtml(svcNames||"-")}</div>
      <div class="muted" style="margin-top:4px">${escHtml(dateLabel)} ${bk.barber?.name?" · "+escHtml(bk.barber.name):""}</div>
      <div style="margin-top:8px;font-weight:800">${money(bk.total)}</div>
      ${(canCancel||canReschedule)?`<div class="bk-actions">
        ${canReschedule?`<button class="btn secondary" style="width:auto" data-action="open-reschedule" data-id="${escHtml(bk.id)}">${tr("rescheduleBooking")}</button>`:""}
        ${canCancel?`<button class="btn danger" style="width:auto" data-action="cancel-booking" data-id="${escHtml(bk.id)}">${tr("cancelBooking")}</button>`:""}
      </div>`:""}
    </div>`;
  }).join("");
}

/* ---- Cancel a booking ---- */
async function cancelMyBooking(bookingId,btn){
  if(btn && btn.disabled) return; // already in flight
  // A native confirm() here, same choice as closeBooking()'s unsaved-progress
  // warning — this is a rare, consequential-but-not-catastrophic action, so a
  // full custom modal isn't worth the extra code for one confirmation.
  if(!window.confirm(`${tr("cancelConfirmTitle")}\n${tr("cancelConfirmBody")}`)) return;
  const originalLabel=btn?btn.innerText:"";
  if(btn){ btn.disabled=true; btn.innerText=tr("loading"); }
  try{
    await api(`/api/customer/bookings/${encodeURIComponent(bookingId)}/cancel`,{method:"POST"});
    state.myBookingsActionError=null;
    await loadMyBookings(); // re-fetch so status/actions reflect the server, not a local guess
  }catch(e){
    if(btn){ btn.disabled=false; btn.innerText=originalLabel; }
    state.myBookingsActionError=e.message;
    render();
  }
}

/* ---- Reschedule a booking (lightweight overlay: quick-day picker + slot
   grid, reusing the same /api/availability endpoint the new-booking flow
   uses — deliberately simpler than the full booking wizard since branch,
   barber, and services are already fixed by the existing booking). ---- */
function openReschedule(bookingId){
  const bk=(state.myBookings||[]).find(x=>x.id===bookingId);
  if(!bk) return;
  state.reschedule={bookingId,barberId:bk.barberId,serviceIds:bk.serviceIds||[],branchId:bk.branchId,date:new Date().toISOString().slice(0,10),slot:null,submitting:false};
  render();
  loadRescheduleSlots();
}
function closeReschedule(){ state.reschedule=null; render(); }
function rescheduleOverlayHtml(){
  const r=state.reschedule;
  return `<div class="booking-overlay" role="dialog" aria-modal="true" aria-label="${tr("rescheduleTitle")}">
    <div class="booking-head"><h2>${tr("rescheduleTitle")}</h2><button class="booking-close" aria-label="${state.lang==="ar"?"إغلاق":"Close"}" data-action="close-reschedule">×</button></div>
    <div class="booking-body">
      <div class="quick-days">${nextDays(14).map(d=>`<button class="quick-day ${r.date===d?"selected":""}" data-action="pick-reschedule-quick-day" data-date="${d}">${new Date(d).toLocaleDateString(state.lang,{weekday:'short',day:'numeric'})}</button>`).join("")}</div>
      <div id="reschedule-slots" style="margin-top:14px"></div>
    </div>
    <div class="booking-footer">
      <div></div>
      <button class="btn gold" style="width:auto" ${!r.slot||r.submitting?"disabled":""} data-action="confirm-reschedule">${r.submitting?tr("loading"):tr("rescheduleConfirm")}</button>
    </div>
  </div>`;
}
let __rescheduleSlotsAbort=null;
async function loadRescheduleSlots(){
  const box=document.getElementById("reschedule-slots"); if(!box)return;
  const r=state.reschedule; if(!r)return;
  if(__rescheduleSlotsAbort) __rescheduleSlotsAbort.abort();
  const controller=new AbortController();
  __rescheduleSlotsAbort=controller;
  box.innerHTML=`<div role="status" aria-live="polite"><span class="sr-only">${tr("loadingSlots")}</span></div><div class="skel-slot-grid" aria-hidden="true">${Array.from({length:9}).map(()=>`<div class="skel"></div>`).join("")}</div>`;
  try{
    const d=await api(`/api/availability?businessDate=${r.date}&barberId=${r.barberId}&serviceIds=${r.serviceIds.join(",")}&branchId=${r.branchId}`,{signal:controller.signal});
    if(controller.signal.aborted) return;
    window.__rescheduleSlotCache=d.slots||[];
    if(!d.slots.length){ box.innerHTML=`<div class="item">${tr("noSlots")}<br><span class="meta">${tr("noSlotsHint")}</span></div>`; return; }
    box.innerHTML=`<div class="slot-grid">${d.slots.map((s,i)=>`<button class="slot ${r.slot?.start===s.start?"selected":""}" data-action="pick-reschedule-slot" data-index="${i}">${s.label}<small>${s.endLabel}</small></button>`).join("")}</div>`;
  }catch(e){
    if(e.name==="AbortError") return;
    box.innerHTML=`<div class="item">${escHtml(e.message)}</div>`;
  }
}
function pickRescheduleSlot(i){
  const s=(window.__rescheduleSlotCache||[])[i]; if(!s||!state.reschedule)return;
  state.reschedule.slot=s;
  render();
}
async function confirmReschedule(btn){
  const r=state.reschedule;
  if(!r || !r.slot || r.submitting) return;
  r.submitting=true;
  const originalLabel=btn?btn.innerText:"";
  if(btn){ btn.disabled=true; btn.innerText=tr("loading"); }
  try{
    await api(`/api/customer/bookings/${encodeURIComponent(r.bookingId)}/reschedule`,{method:"PATCH",body:JSON.stringify({start:r.slot.start})});
    state.reschedule=null;
    state.myBookingsActionError=null;
    await loadMyBookings(); // this renders once the fresh list is in
  }catch(e){
    r.submitting=false;
    // Deliberately no render() here: rescheduleOverlayHtml() always emits an
    // *empty* #reschedule-slots div (its content is filled in imperatively
    // by loadRescheduleSlots()/pickRescheduleSlot, not derived from state),
    // so re-rendering the whole overlay right now would immediately wipe out
    // the error message below along with the person's chosen slot. Just
    // restore the button and show the error where they already are.
    if(btn){ btn.disabled=false; btn.innerText=originalLabel; }
    const box=document.getElementById("reschedule-slots");
    if(box){ const msg=document.createElement("div"); msg.className="muted"; msg.style.marginTop="10px"; msg.innerText=e.message; box.appendChild(msg); }
  }
}

/* ===================== PROFILE tab ===================== */
function consentBlockHtml(){
  const s=state.settings||{};
  const policy=state.lang==="ar"?s.privacyPolicyAr:s.privacyPolicyEn;
  const terms=state.lang==="ar"?s.termsAr:s.termsEn;
  const marketingText=state.lang==="ar"?s.marketingConsentAr:s.marketingConsentEn;
  if(s.privacyPolicyEnabled===false && !s.requireCustomerConsent && !s.requireMarketingConsent) return "";
  return `<div class="consent-block">
    ${policy?`<details class="consent-policy"><summary>${tr("privacyPolicy")}</summary><p>${escHtml(policy)}</p>${terms?`<h4>${tr("terms")}</h4><p>${escHtml(terms)}</p>`:""}</details>`:""}
    ${s.requireCustomerConsent!==false?`<label class="consent-check"><input type="checkbox" id="accConsent"><span>${tr("consentAgree")}</span></label>`:""}
    ${s.requireMarketingConsent===true?`<label class="consent-check"><input type="checkbox" id="accMarketing"><span>${escHtml(marketingText||tr("marketingAgree"))}</span></label>`:""}
  </div>`;
}
function profileView(){
  if(state.account){
    return `<div class="card profile-card">
      <strong>${escHtml(state.account.name)}</strong>
      <span class="muted">${escHtml(state.account.phone)}</span>
      ${state.account.email?`<span class="muted">${escHtml(state.account.email)}</span>`:""}
    </div>
    <button class="btn secondary" style="margin-top:14px" onclick="logoutAccount()">${tr("logout")}</button>`;
  }
  return `<div class="card"><h2>${tr("account")}</h2><div class="grid">
    <label>${tr("name")}<input id="accName" autocomplete="name"></label>
    <label>${tr("phone")}<input id="accPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+962 7X XXX XXXX"></label>
    <label>${tr("email")}<input id="accEmail" type="email" inputmode="email" autocomplete="email"></label>
    ${consentBlockHtml()}
    <button class="btn gold" onclick="createAccount(false,this)">${tr("createAccount")}</button>
    <div id="accMsg" class="muted"></div>
  </div></div>`;
}
// Lenient client-side checks — the backend is still the source of truth and
// re-validates everything; this is just to catch obvious typos before a
// round-trip, not to replace server-side validation.
function validatePhone(v){
  const digits=String(v||"").replace(/[\s\-()]/g,"");
  return /^(\+?962|0)?7[789]\d{7}$/.test(digits);
}
function validateEmail(v){
  if(!v) return true; // email is optional in this form
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}
async function createAccount(fromBooking,btn){
  if(btn && btn.disabled) return; // already in flight — ignore extra clicks/taps
  const m=document.getElementById("accMsg");
  const name=val("accName"), phone=val("accPhone"), email=val("accEmail");
  if(!name.trim()){ if(m)m.innerText=tr("errRequiredName"); document.getElementById("accName")?.focus(); return; }
  if(!phone.trim()){ if(m)m.innerText=tr("errRequiredPhone"); document.getElementById("accPhone")?.focus(); return; }
  if(!validatePhone(phone)){ if(m)m.innerText=tr("errInvalidPhone"); document.getElementById("accPhone")?.focus(); return; }
  if(!validateEmail(email)){ if(m)m.innerText=tr("errInvalidEmail"); document.getElementById("accEmail")?.focus(); return; }
  const s=state.settings||{};
  if(s.requireCustomerConsent!==false && !document.getElementById("accConsent")?.checked){
    if(m)m.innerText=tr("consentRequired");
    return;
  }
  const marketingConsent=!!document.getElementById("accMarketing")?.checked;
  // Deliberately avoid a full render() here: the name/phone/email inputs
  // aren't tracked in state (read on submit via val()), so re-rendering the
  // whole tree while a request is in flight would wipe out whatever the
  // person just typed. Toggle the button directly instead.
  const originalLabel=btn?btn.innerText:"";
  if(btn){ btn.disabled=true; btn.innerText=tr("loading"); }
  try{
    const d=await api("/api/customer/register",{method:"POST",body:JSON.stringify({
      name,phone,email,
      consent:document.getElementById("accConsent")?document.getElementById("accConsent").checked:true,
      marketingConsent
    })});
    state.token=d.customerToken; state.account=d.account;
    authStorage.save(d.customerToken,d.account);
    if(fromBooking && state.booking) state.booking.step=4;
    render();
  }catch(e){
    if(m)m.innerText=e.message;
    if(btn){ btn.disabled=false; btn.innerText=originalLabel; }
  }
}
function logoutAccount(){
  state.token=""; state.account=null;
  authStorage.clear();
  state.myBookings=null;
  render();
}

/* ===================== BOOKING overlay ===================== */
function openBooking(serviceId){
  state.booking={step:0,selectedServices:serviceId?[serviceId]:[],barberId:"",date:new Date().toISOString().slice(0,10),slot:null,cat:"all",success:null};
  render();
}
function bookingHasUnsavedProgress(){
  const b=state.booking;
  if(!b || b.success) return false; // nothing to lose once it's actually booked
  return b.selectedServices.length>0 || !!b.barberId || !!b.slot;
}
function closeBooking(force){
  if(!force && bookingHasUnsavedProgress()){
    // A plain confirm() is a deliberate, minimal choice here — it's a rare,
    // low-frequency interruption (closing mid-booking), so a native dialog
    // is fine and avoids building a whole second modal system for one case.
    if(!window.confirm(`${tr("unsavedTitle")}\n${tr("unsavedBody")}`)) return;
  }
  state.booking=null; render();
}
function bkSelectedServices(){ return (state.booking?.selectedServices||[]).map(id=>state.services.find(s=>s.id===id)).filter(Boolean); }
function bkTotal(){ return bkSelectedServices().reduce((a,s)=>a+s.price,0); }
function bkDur(){ return bkSelectedServices().reduce((a,s)=>a+s.duration,0); }
function toggleBkService(id){
  const b=state.booking; const i=b.selectedServices.indexOf(id);
  i>=0?b.selectedServices.splice(i,1):b.selectedServices.push(id);
  b.slot=null; render();
}
function bkStepsList(){ return state.account ? [0,1,2,4] : [0,1,2,3,4]; }
function bookingNext(){
  const b=state.booking; if(!b || b.success) return;
  if(b.step===0 && !b.selectedServices.length) return;
  if(b.step===1 && !b.barberId) return;
  if(b.step===2 && !b.slot) return;
  if(b.step===3 && !state.account) return;
  let next=b.step+1;
  if(next===3 && state.account) next=4;
  b.step=Math.min(4,next);
  render();
  if(b.step===2) setTimeout(loadSlots,0);
}
function bookingPrev(){
  const b=state.booking; if(!b) return;
  let prev=b.step-1;
  if(prev===3 && state.account) prev=2;
  b.step=Math.max(0,prev);
  render();
  if(b.step===2) setTimeout(loadSlots,0);
}
function bookingOverlayHtml(){
  const b=state.booking;
  const titles={0:tr("services"),1:tr("barber"),2:tr("time"),3:tr("account"),4:tr("details")};
  if(b.success){
    return `<div class="booking-overlay" role="dialog" aria-modal="true" aria-label="${tr("success")}"><div class="booking-head"><h2>${tr("success")}</h2><button class="booking-close" aria-label="${state.lang==="ar"?"إغلاق":"Close"}" onclick="closeBooking()">×</button></div><div class="booking-body">${successHtml(b.success)}</div></div>`;
  }
  const stepsList=bkStepsList();
  const pos=stepsList.indexOf(b.step);
  return `<div class="booking-overlay" role="dialog" aria-modal="true" aria-label="${escHtml(titles[b.step])}">
    <div class="booking-head"><h2>${titles[b.step]}</h2><button class="booking-close" aria-label="${state.lang==="ar"?"إغلاق":"Close"}" onclick="closeBooking()">×</button></div>
    <div class="booking-progress">${stepsList.map((s,i)=>`<div class="booking-progress-dot ${i<pos?"done":""} ${i===pos?"active":""}"></div>`).join("")}</div>
    <div class="booking-body">${bookingStepView(b)}</div>
    <div class="booking-footer">
      <div><div class="summary-line">${bkSelectedServices().length} ${tr("services")} · ${bkDur()} ${tr("min")}</div><div class="total-line">${money(bkTotal())}</div></div>
      <div style="display:flex;gap:8px">
        ${b.step>0?`<button class="btn secondary" style="width:auto" onclick="bookingPrev()">${tr("back")}</button>`:""}
        ${b.step<4?`<button class="btn gold" style="width:auto" onclick="bookingNext()">${tr("next")}</button>`:`<button class="btn gold" style="width:auto" ${b.submitting?"disabled":""} onclick="confirmBooking()">${b.submitting?tr("loading"):tr("confirmBooking")}</button>`}
      </div>
    </div>
  </div>`;
}
function bookingStepView(b){
  if(b.step===0) return bkServicesStep(b);
  if(b.step===1) return bkBarberStep(b);
  if(b.step===2) return bkTimeStep(b);
  if(b.step===3) return bkAccountStep();
  return bkConfirmStep();
}
function pickBkCat(i){
  const cats=["all",...new Set(state.services.map(s=>s.category))];
  state.booking.cat=cats[i];
  render();
}
function bkServicesStep(b){
  const cats=["all",...new Set(state.services.map(s=>s.category))];
  const list=b.cat==="all"?state.services:state.services.filter(s=>s.category===b.cat);
  // NOTE: category names are free text set by the salon admin — never interpolate
  // them raw into an onclick handler (breaks out of the JS string / injects code).
  // We pass the array index instead and look the real value up server-side of the
  // click, so the only thing embedded in the HTML is a safe integer.
  return `<div class="chips">${cats.map((c,i)=>`<button class="chip ${b.cat===c?"active":""}" data-action="pick-cat" data-index="${i}">${c==="all"?(state.lang==="ar"?"الكل":"All"):escHtml(c)}</button>`).join("")}</div>
  <div class="grid">${list.map(s=>{
    const sel=b.selectedServices.includes(s.id);
    return `<div class="service-row"><div data-action="toggle-bk-service" data-id="${escHtml(s.id)}" style="cursor:pointer"><strong>${serviceName(s)}</strong><div class="meta">${s.duration} ${tr("min")} · ${money(s.price)}</div></div><button class="service-book-btn ${sel?"added":""}" data-action="toggle-bk-service" data-id="${escHtml(s.id)}">${sel?"✓ "+tr("added"):tr("book")}</button></div>`;
  }).join("")}</div>`;
}
function bkBarberStep(b){
  const bs=state.barbers.filter(x=>x.branchId===state.branchId);
  return `<div class="grid">${bs.map(x=>`<div class="item barber-card ${b.barberId===x.id?"selected":""}" data-action="pick-barber" data-id="${escHtml(x.id)}"><div class="barber-avatar" ${x.photoUrl?`style="background-image:url('${escHtml(x.photoUrl)}')"`:""}>${x.photoUrl?"":escHtml((x.name||"?").trim()[0]||"?")}</div><div><strong>${escHtml(x.name)}</strong><div class="meta">${escHtml(x.title||"")}</div></div></div>`).join("")}</div>`;
}
function bkTimeStep(b){
  return `<div class="mini-date-head">
    <button class="btn secondary" onclick="openYearCalendar()">📅 ${b.date}</button>
    <button class="btn secondary" onclick="loadSlots()">${state.lang==="ar"?"عرض الأوقات":"Show times"}</button>
  </div>
  <div class="quick-days">${nextDays(7).map(d=>`<button class="quick-day ${b.date===d?"selected":""}" data-action="pick-quick-day" data-date="${d}">${new Date(d).toLocaleDateString(state.lang,{weekday:'short',day:'numeric'})}</button>`).join("")}</div>
  <div id="slots" class="slot-grid"></div>`;
}
function nextDays(n){ let a=[]; for(let i=0;i<n;i++){ let d=new Date(); d.setDate(d.getDate()+i); a.push(d.toISOString().slice(0,10)); } return a; }
function openYearCalendar(){
  const b=state.booking;
  let activeYear=Number((b.date||new Date().toISOString()).slice(0,4))||new Date().getFullYear();
  const monthNames=state.lang==="ar"?["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const old=document.getElementById("yearModal"); if(old)old.remove();
  const wrap=document.createElement("div"); wrap.id="yearModal"; wrap.className="year-modal";
  wrap.setAttribute("role","dialog");
  wrap.setAttribute("aria-modal","true");
  wrap.setAttribute("aria-label",state.lang==="ar"?"اختيار التاريخ":"Choose date");
  document.body.appendChild(wrap);
  function daysInMonth(y,m){return new Date(y,m+1,0).getDate()}
  function firstDay(y,m){return new Date(y,m,1).getDay()}
  function draw(){
    wrap.innerHTML=`<div class="year-panel">
      <div class="year-top"><h2>📅 ${activeYear}</h2><div><button onclick="window.__yearPrev()">‹</button><button onclick="window.__yearToday()">${state.lang==="ar"?"اليوم":"Today"}</button><button onclick="window.__yearNext()">›</button><button class="modal-init-focus" aria-label="${state.lang==="ar"?"إغلاق":"Close"}" onclick="document.getElementById('yearModal').remove()">×</button></div></div>
      <div class="customer-year-grid">
        ${monthNames.map((mn,m)=>{
          const blanks=Array.from({length:firstDay(activeYear,m)},()=>`<span></span>`).join("");
          const days=Array.from({length:daysInMonth(activeYear,m)},(_,i)=>{
            const v=`${activeYear}-${String(m+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`;
            return `<button class="year-day ${v===b.date?"selected":""}" data-action="pick-year-day" data-date="${v}">${i+1}</button>`;
          }).join("");
          return `<div class="month-card"><h3>${mn}</h3><div class="week-row"><span>س</span><span>ح</span><span>ن</span><span>ث</span><span>ر</span><span>خ</span><span>ج</span></div><div class="month-days">${blanks}${days}</div></div>`;
        }).join("")}
      </div>
    </div>`;
  }
  window.__yearPrev=()=>{activeYear--;draw()};
  window.__yearNext=()=>{activeYear++;draw()};
  window.__yearToday=()=>{activeYear=new Date().getFullYear();draw()};
  draw();
  // Focus once on open only — draw() also re-runs on prev/next/today clicks,
  // and re-focusing the close button on every one of those would yank focus
  // away from the nav button the person is actively using.
  wrap.querySelector(".modal-init-focus")?.focus({preventScroll:true});
}
// Tracks the in-flight availability request so a fast date/barber switch
// cancels the stale request instead of letting it race the newest one and
// overwrite the UI with outdated slots.
let __slotsAbort=null;
async function loadSlots(){
  const box=document.getElementById("slots"); if(!box)return;
  const b=state.booking;
  if(__slotsAbort) __slotsAbort.abort();
  const controller=new AbortController();
  __slotsAbort=controller;
  box.innerHTML=`<div role="status" aria-live="polite"><span class="sr-only">${tr("loadingSlots")}</span></div><div class="skel-slot-grid" aria-hidden="true">${Array.from({length:9}).map(()=>`<div class="skel"></div>`).join("")}</div>`;
  try{
    const d=await api(`/api/availability?businessDate=${b.date}&barberId=${b.barberId}&serviceIds=${b.selectedServices.join(",")}&branchId=${state.branchId}`,{signal:controller.signal});
    if(controller.signal.aborted) return; // a newer request already took over
    window.__slotCache=d.slots||[];
    if(!d.slots.length){ box.innerHTML=`<div class="item">${tr("noSlots")}<br><span class="meta">${tr("noSlotsHint")}</span></div>`; return; }
    const periods=[
      {key:"morning",label:tr("morning"),test:h=>h<12},
      {key:"afternoon",label:tr("afternoon"),test:h=>h>=12&&h<17},
      {key:"evening",label:tr("evening"),test:h=>h>=17},
    ];
    const grouped=periods.map(p=>({...p,slots:d.slots.map((s,i)=>({...s,i})).filter(s=>p.test(new Date(s.start).getHours()))})).filter(p=>p.slots.length);
    box.innerHTML=grouped.map(p=>`<div><h4 class="muted">${p.label}</h4><div class="slot-grid">${p.slots.map(s=>`<button class="slot ${b.slot?.start===s.start?"selected":""}" data-action="pick-slot" data-index="${s.i}">${s.label}<small>${s.endLabel}</small></button>`).join("")}</div></div>`).join("");
  }catch(e){
    if(e.name==="AbortError") return; // cancelled on purpose, not a real error
    box.innerHTML=`<div class="item">${escHtml(e.message)}</div>`;
  }
}
function pickSlot(i){ state.booking.slot=(window.__slotCache||[])[i]; render(); setTimeout(loadSlots,0); }
function bkAccountStep(){
  return `<div class="grid">
    <label>${tr("name")}<input id="accName" autocomplete="name"></label>
    <label>${tr("phone")}<input id="accPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+962 7X XXX XXXX"></label>
    <label>${tr("email")}<input id="accEmail" type="email" inputmode="email" autocomplete="email"></label>
    ${consentBlockHtml()}
    <button class="btn gold" onclick="createAccount(true,this)">${tr("createAccount")}</button>
    <div id="accMsg" class="muted"></div>
  </div>`;
}
function bkConfirmStep(){
  const br=currentBranch(); const bb=state.barbers.find(x=>x.id===state.booking.barberId);
  return `<div class="card">
    <div class="muted">${tr("changeBranch")==="Our branches"?"":""}</div>
    <div style="margin-bottom:8px"><strong>${escHtml(br?.name||"-")}</strong></div>
    <div class="muted">${bkSelectedServices().map(serviceName).join(", ")||"-"}</div>
    <div class="muted" style="margin-top:6px">${tr("barber")}: <strong>${escHtml(bb?.name||"-")}</strong></div>
    <div class="muted" style="margin-top:6px">${tr("time")}: <strong>${state.booking.slot?state.booking.slot.label:"-"}</strong></div>
    <h2 style="margin-top:10px">${money(bkTotal())}</h2>
  </div>`;
}
async function confirmBooking(){
  const b=state.booking;
  if(b.submitting) return; // already in flight — ignore extra clicks/taps
  b.submitting=true;
  render();
  try{
    const res=await api("/api/customer/bookings",{method:"POST",body:JSON.stringify({branchId:state.branchId,barberId:b.barberId,serviceIds:b.selectedServices,start:b.slot.start,notes:""})});
    state.booking.success=res;
    state.myBookings=null; // force a refresh next time the tab is opened
    render();
  }catch(e){
    b.submitting=false;
    render();
    const box=document.querySelector(".booking-body");
    if(box){ const msg=document.createElement("div"); msg.className="muted"; msg.style.marginTop="10px"; msg.innerText=e.message; box.appendChild(msg); }
  }
}
function successHtml(b){
  const br=b.branch||{}; const bb=b.barber||{};
  const svcNames=(b.services||[]).map(s=>s.nameAr||s.name).join("، ");
  const calUrl=buildCalendarLink(b,br);
  return `<div class="success-card">
    <div class="success-check">✓</div>
    <p class="muted">${tr("seeYouSoon")}</p>
    <div class="success-details">
      <div class="success-row"><span>${tr("bookingRef")}</span><strong>${escHtml(b.id)}</strong></div>
      <div class="success-row"><span>${tr("changeBranch")}</span><strong>${escHtml(br.name||"-")}</strong></div>
      <div class="success-row"><span>${tr("services")}</span><strong>${escHtml(svcNames||"-")}</strong></div>
      <div class="success-row barber-row"><span>${tr("barber")}</span><span class="success-barber">${bb.photoUrl?`<span class="success-barber-avatar" style="background-image:url('${escHtml(bb.photoUrl)}')"></span>`:""}<strong>${escHtml(bb.name||"-")}</strong></span></div>
      <div class="success-row"><span>${tr("time")}</span><strong>${b.startLabel} → ${b.endLabel}</strong></div>
      <div class="success-row"><span>${tr("total")}</span><strong>${money(b.total)}</strong></div>
    </div>
    <a class="btn secondary" href="${calUrl}" target="_blank" rel="noopener">📅 ${tr("addToCalendar")}</a>
    <button class="btn gold" onclick="closeBooking();setTab('bookings')">${tr("done")}</button>
  </div>`;
}
function buildCalendarLink(b,br){
  const fmt=d=>new Date(d).toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  const text=encodeURIComponent(`${tr("changeBranch")}: ${br.name||""}`);
  const loc=encodeURIComponent(br.address||br.name||"");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("SHADI SALOON")}&dates=${fmt(b.start)}/${fmt(b.end)}&details=${text}&location=${loc}`;
}

/* ===================== errors ===================== */
function configErrorHtml(e){
  const isPlaceholder=API_BASE.includes("YOUR-BACKEND-URL-HERE")||!API_BASE;
  const title=isPlaceholder?"لسا ما ضبطتي رابط السيرفر":"تعذّر الاتصال بالسيرفر";
  const detail=isPlaceholder
    ?"افتحي ملف public/config.js وحطي رابط السيرفر الرئيسي الفعلي بدل النص التجريبي، ثم أعيدي تحميل الصفحة."
    :`تأكد أن رابط السيرفر بملف config.js صحيح وأن السيرفر يعمل. (${escHtml(e.message)})`;
  return `<div style="padding:60px 20px;text-align:center;max-width:520px;margin:0 auto">
    <h2 style="margin-bottom:10px">${title}</h2>
    <p class="muted">${detail}</p>
    <div style="margin-top:24px;padding:14px;border:1px solid var(--line);border-radius:12px">
      <p class="muted" style="margin:0 0 6px">الرابط الحالي المقروء من config.js:</p>
      <code style="word-break:break-all">${escHtml(API_BASE||"(فارغ / empty)")}</code>
    </div>
  </div>`;
}

bootstrap();
