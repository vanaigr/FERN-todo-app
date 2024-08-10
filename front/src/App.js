import * as R from 'react'
import './App.css'
import * as auth from './auth.js'

export function AccountHeader() {
    const account = auth.useAccount(it => it)

    let child;
    if(!account.ok) {
        child = <button onClick={auth.login}>Sign in with Google</button>
    }
    else {
        child = (<>
            Signed in as {account.user.displayName}
            <button onClick={auth.logout}>log out</button>
        </>)
    }

    return <div className="account">{child}</div>
}

export default function App() {
    console.log('app')
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
