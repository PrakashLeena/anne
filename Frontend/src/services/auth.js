// Frontend/src/services/auth.js
// Firebase Authentication integration
import auth from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import axios from "axios";

async function registerUserInBackend(user) {
  try {
    await axios.post('/api/users', {
      userId: user.userId,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Failed to register user in backend:', error);
  }
}

function mapUser(u) {
  if (!u) return null;
  // Shape expected by the app: { username, email, userId }
  const username = u.displayName || (u.email ? u.email.split("@")[0] : "User");
  return { 
    username, 
    email: u.email || "", 
    userId: u.uid // Firebase UID as unique user ID
  };
}

export function getCurrentUser() {
  const u = auth.currentUser;
  return mapUser(u);
}

export async function logout() {
  await signOut(auth);
}

export async function login({ email, password }) {
  if (!email || !password) throw new Error("Email and password are required");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = mapUser(cred.user);
  
  // Register/update user in backend
  if (user) {
    await registerUserInBackend(user);
  }
  
  return user;
}

export async function signup({ username, email, password }) {
  if (!username || !email || !password) throw new Error("All fields are required");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Set display name so the UI can show a username
  await updateProfile(cred.user, { displayName: username });
  const user = mapUser(cred.user);
  
  // Register user in backend
  if (user) {
    await registerUserInBackend(user);
  }
  
  return user;
}

export async function updateUsername(newName) {
  const u = auth.currentUser;
  if (!u) throw new Error("Not logged in");
  await updateProfile(u, { displayName: newName });
  return mapUser(auth.currentUser);
}
