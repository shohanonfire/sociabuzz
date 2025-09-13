import { t, getLang, setLang } from "./i18n.js";
import { currentEmailMasked, logout } from "./firebase.js";

export function showLoader(ms=1000){
  const el = document.getElementById("loader");
  if(!el) return; el.classList.add("active");
  setTimeout(()=>el.classList.remove("active"), ms);
}

export async function renderHeader(){
  const container = document.querySelector(".header .nav .actions");
  const emailMasked = await currentEmailMasked();
  const accountEl = document.getElementById("accountLabel");
  if (accountEl) accountEl.textContent = emailMasked || t("notAssigned");

  const langBtn = document.getElementById("langBtn");
  if (langBtn) {
    langBtn.textContent = getLang()==="bn" ? "EN" : "BN";
    langBtn.onclick = ()=> setLang(getLang()==="bn"? "en":"bn");
  }

  if (container){
    const isLoggedIn = !!emailMasked;
    const loginLink = container.querySelector('a[href="/login.html"]');
    const signupLink = container.querySelector('a[href="/signup.html"]');
    if (loginLink) loginLink.style.display = isLoggedIn ? "none" : "";
    if (signupLink) signupLink.style.display = isLoggedIn ? "none" : "";
  }
}

export function bindHamburger(){
  const hamOpen = document.getElementById("hamOpen");
  const ham = document.getElementById("hamburger");
  const close = document.getElementById("hamClose");
  hamOpen?.addEventListener("click", ()=> ham?.classList.add("active"));
  close?.addEventListener("click", ()=> ham?.classList.remove("active"));
}

export function bindLogout(){
  const btn = document.getElementById("logoutBtn");
  if(!btn) return;
  btn.onclick = async ()=>{ try{ await logout(); location.reload(); }catch{} };
}
