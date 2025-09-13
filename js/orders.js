import { api } from "./api.js";
import { getOrCreateUsername } from "./services.js";
import { t } from "./i18n.js";

function fmtDate(s){ return new Date(s).toLocaleString(); }

function renderOrder(o, positions){
  const link = (o.details?.link || o.details?.username || "-");
  const pos = positions[o.id] || null;
  const eta = pos ? (pos-1)*5 : null;
  const payActive = o.status === "CONFIRMED" && o.payDeadline && new Date(o.payDeadline) > new Date();
  const remainingPct = payActive ? Math.max(0, (new Date(o.payDeadline) - new Date()) / (2*60*1000)) * 100 : 0;

  return `
  <div class="order" data-id="${o.id}">
    <div class="row"><div class="key">ID</div><div class="value">${o.id}</div></div>
    <div class="row"><div class="key">Time</div><div class="value">${fmtDate(o.createdAt)}</div></div>
    <div class="row"><div class="key">Service</div><div class="value">${o.serviceKey}</div></div>
    <div class="row"><div class="key">${t('status')}</div><div class="value status">${o.status}</div></div>
    <div class="row"><div class="key">${t('link')}</div><div class="value"><div class="linkbox">${link}</div></div></div>
    ${o.details?.quantity?`<div class="row"><div class="key">${t('quantity')}</div><div class="value">${o.details.quantity}</div></div>`:""}
    ${pos?`<div class="row"><div class="key">Queued</div><div class="value">#${pos} (${eta} min est)</div></div>`:""}
    ${payActive?`
      <div class="row"><div class="key">${t('remainingTime')}</div><div class="value">
        <div class="progress"><div class="bar" style="width:${remainingPct}%"></div></div>
      </div></div>
      <div class="cta"><button class="btn primary pay-now">${t('payNow')}</button></div>
    `:""}
  </div>`;
}

async function poll(){
  const username = getOrCreateUsername();
  const { items, positions } = await api(`/api/orders/poll/${username}`);
  const list = document.getElementById("ordersList");
  list.innerHTML = items.length? items.map(o => renderOrder(o, positions)).join("") : `<div class="panel">${t('ordersEmpty')}</div>`;

  document.querySelectorAll('.pay-now').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      alert('Redirecting to payment gateway...');
    });
  });
}

setInterval(poll, 2000);
window.addEventListener("load", poll);
