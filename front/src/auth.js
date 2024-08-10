import { initializeApp } from "firebase/app"
import * as firebaseAuth from "firebase/auth"
import { create } from "zustand"

export const serverUrl = 'http://localhost:2999'

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

export async function login() {
    try {
        const result = await firebaseAuth.signInWithPopup(auth, new firebaseAuth.GoogleAuthProvider())
        const credential = firebaseAuth.GoogleAuthProvider.credentialFromResult(result)
        const token = credential.accessToken
        console.log(useAccount.account)
        useAccount.setState({ ok: true, user: result.user, token })
    } catch(e) {
        console.error(e)
        useAccount.setState({ ok: false })
    }
}

export async function logout() {
    await firebaseAuth.signOut(auth).catch(e => console.error(e))
    useAccount.setState({ ok: false })
}
