import * as R from 'react'
import './App.css'
import * as auth from './auth.js'

export function AccountHeader() {
    const [account, setAccount] = R.useState(auth.getAccount())
    console.log(account)
    let child;
    if(!account || !account.ok) {
        child = <button onClick={() => { auth.authenticate().finally(() => setAccount(auth.getAccount())) }}>Sign in with Google</button>
    }
    else {
        child = `Signed in as ${account.user.displayName}`
    }

    return <div className="account">{child}</div>
}

export default function App() {
    return (
        <div className="header">
            <AccountHeader />
        </div>
    )
}

/*
    const [status, setStatus] = R.useState(null)

    const nameR = R.useRef(null)
    async function send() {
        const name = nameR.current.value
        const json = { name, data: { val: 'test' } }

        try {
            const response = await fetch(db.serverUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(json),
            })

            const res = await response.json().catch(() => {})
            if(!response.ok || !res) {
                const msg = res ? res.msg : 'response not json'
                console.error(`Error: ${response.status}: ${msg}`)
                return setStatus('Error: ' + msg)
            }

            return setStatus('Ok: ' + res.msg)
        }
        catch(e) {
            return setStatus(e.message)
        }
    }
    return (
        <>
            <input ref={nameR} type="text" />
            <button onClick={send}>Send</button>
            <Status status={status} />
        </>
    );
*/
