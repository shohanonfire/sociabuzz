import { SERVER_BASE_URL } from "./config.js";

export async function api(path, opts={}){
  const res = await fetch(`${SERVER_BASE_URL}${path}`, {
    credentials:"omit",
    headers: {"Content-Type":"application/json", ...(opts.headers||{})},
    ...opts
  });
  return res.json();
}
