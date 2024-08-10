import { initializeApp } from "firebase/app"
import * as firebaseAuth from "firebase/auth"
import * as firebaseUi from "firebaseui"

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
const ui = new firebaseUi.auth.AuthUI(auth)

export const serverUrl = 'http://localhost:2999'

const authProvider = new firebaseAuth.GoogleAuthProvider()
firebaseAuth.signInWithRedirect(auth, authProvider).then((result) => {
    console.log(result)
}).catch((error) => {
    console.error(error)
})

ui.start('#firebaseui-auth-container', { signInOptions: [], });
