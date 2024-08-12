import { initializeApp } from "firebase/app"
import * as firebaseAuth from "firebase/auth"
import { create } from "zustand"

const firebaseConfig = {
  apiKey: "AIzaSyAgUq87gB8lXUL8UtYqnloosoH3sVp8yAk",
  authDomain: "fern-test-d7b52.firebaseapp.com",
  databaseURL: "https://fern-test-d7b52-default-rtdb.firebaseio.com",
  projectId: "fern-test-d7b52",
  storageBucket: "fern-test-d7b52.appspot.com",
  messagingSenderId: "941573793010",
  appId: "1:941573793010:web:feb0f6dd459a9ec6965c6b"
}

const app = initializeApp(firebaseConfig)
const auth = firebaseAuth.getAuth(app)

export const useAccount = create((set) => ({}))

export function login() {
    firebaseAuth.signInWithPopup(auth, new firebaseAuth.GoogleAuthProvider())
}

firebaseAuth.onAuthStateChanged(auth, user => {
    if(user) {
        useAccount.setState({ ok: true, user }, true)
    }
    else {
        useAccount.setState({ ok: false }, true)
    }
})

export function logout() {
    firebaseAuth.signOut(auth)
}
