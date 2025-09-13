import { api } from "./api.js";

export async function track(event, meta={}, username){
  try{ await api(`/api/track`, { method:"POST", body: JSON.stringify({ event, meta, username }) }); }catch{}
}
