import { api } from "./api.js";
import { t, getLang } from "./i18n.js";
import { ensureServerUser } from "./firebase.js";
import { track } from "./track.js";

export function getOrCreateUsername(){
  let u = localStorage.getItem("sb_username");
  if (!u){ u = `sb_${Math.random().toString(36).slice(2,8)}`; localStorage.setItem("sb_username", u); }
  return u;
}

export async function bootstrapUser(){
  const username = getOrCreateUsername();
  await ensureServerUser(username, getLang());
  return username;
}

export async function loadServices(platform){
  const { items } = await api("/api/services");
  return items.filter(s => s.platform === platform);
}

export function renderServiceOptions(services){
  const wrap = document.getElementById("serviceOptions");
  wrap.innerHTML = "";
  services.forEach(s => {
    const el = document.createElement("label");
    el.className = "badge";
    el.innerHTML = `<input type="radio" name="service" value="${s.key}"> <span>${s.titleBn}</span>`;
    wrap.appendChild(el);
  });
}

export function bindDynamicFields(services){
  const fields = {
    link: document.getElementById("field_link"),
    username: document.getElementById("field_username"),
    dob: document.getElementById("field_dob"),
    months: document.getElementById("field_months"),
    quantity: document.getElementById("field_quantity")
  };
  document.addEventListener("change", (e)=>{
    if (e.target.name === "service"){
      const s = services.find(x => x.key === e.target.value);
      Object.entries(fields).forEach(([k, el])=>{
        el.style.display = s.requires[k] ? "grid" : "none";
      });
    }
  });
}

export async function submitOrder(platform){
  const username = getOrCreateUsername();
  const serviceKey = (document.querySelector('input[name="service"]:checked')||{}).value;
  if(!serviceKey){ alert("Select a service"); return; }
  const payload = {
    username,
    language: getLang(),
    serviceKey,
    details: {
      link: document.getElementById("inp_link")?.value || undefined,
      username: document.getElementById("inp_username")?.value || undefined,
      dob: document.getElementById("inp_dob")?.value || undefined,
      months: parseInt(document.getElementById("inp_months")?.value||"0") || undefined,
      quantity: parseInt(document.getElementById("inp_quantity")?.value||"0") || undefined,
      whatsapp: document.getElementById("inp_wa")?.value || undefined
    }
  };
  const res = await api("/api/orders", { method:"POST", body: JSON.stringify(payload) });
  if(res.ok){
    await track("submit_order", { platform, serviceKey }, username);
    location.href = `/orders.html?justSubmitted=${res.order.id}`;
  } else {
    alert(res.error || "Failed");
  }
}
