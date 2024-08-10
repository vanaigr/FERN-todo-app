import * as R from 'react'
import './App.css'
import * as db from './db.js'

function Status({ status }) {
    if(!status) return

    return <div>{status}</div>
}

function App() {
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
}

export default App;
