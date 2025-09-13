import { firebaseConfig } from "./firebase.config.js";
import { SERVER_BASE_URL } from "./config.js";

if (!firebase.apps?.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

export function onAuth(cb){ auth.onAuthStateChanged(cb); }
export async function signup(email, pass){ await auth.createUserWithEmailAndPassword(email, pass); }
export async function login(email, pass){ await auth.signInWithEmailAndPassword(email, pass); }
export async function logout(){ await auth.signOut(); }

export async function currentEmailMasked(){
  const u = auth.currentUser; if(!u?.email) return null;
  const [name, dom] = u.email.split("@");
  return `${name.slice(0,2)}***@${dom}`;
}

export async function ensureServerUser(username, lang="bn"){
  const email = auth.currentUser?.email || null;
  const res = await fetch(`${SERVER_BASE_URL}/api/users/ensure`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ username, email, language: lang })
  });
  return res.json();
}
