import * as R from 'react'
import './App.css'
import * as auth from './auth.js'
import * as todos from './todos.js'
import { create, useShallow } from "zustand"

function AccountHeader() {
    const account = auth.useAccount(it => it)

    let child;
    if(!account.ok) {
        child = <button onClick={auth.login}>Sign in with Google</button>
    }
    else {
        child = (<>
            Signed in as {account.user.displayName}
            <div className="v-bar" />
            <button onClick={auth.logout}>log out</button>
        </>)
    }

    return <div className="account">{child}</div>
}

const selectedTodoStorage = create(set => null)
todos.onTodosListChanged(() => {
    const cur = selectedTodoStorage.getState()
    if(cur) {
        const todo = todos.allTodos[cur]
        if(todo === undefined || todo.deleted) selectedTodoStorage.setState(null)
    }
})
function useIsTodoSelected(id) {
    const isSelected = selectedTodoStorage(it => it === id)
    const setSelected = () => selectedTodoStorage.setState(id)
    return[isSelected, setSelected]
}

function formatTodoDate(date) {
    const options = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }
    return date.toLocaleString(undefined, options)
}

function Todo({ todo }) {
    const [isSelected, setSelected] = useIsTodoSelected(todo.id)
    const content = todo.useContents(it => it.content.substring(0, 60))

    var desc
    if(!content) {
        desc = <div className="todo-desc todo-desc-empty">Enter your note in the space on the right...</div>
    }
    else {
        desc = <div className="todo-desc">{content}</div>
    }

    return (
        <div onClick={setSelected} className={`todo ${isSelected ? 'todo-selected' : ''}`}>
            <div className="date">{formatTodoDate(todo.createdAt)}</div>
            {desc}
        </div>
    )
}

function DeleteButton() {
    const selectedId = selectedTodoStorage(it => it)
    return <button disabled={selectedId == null} onClick={() => todos.removeTodo(selectedId)}>Delete</button>
}

function Todos() {
    const todosOrdered = todos.useCurrentTodos()
    const todosArr = new Array(todosOrdered.length)
    for(var i = 0; i < todosOrdered.length; i++) {
        const it = todosOrdered[i]
        todosArr[todosOrdered.length-1 - i] = <Todo key={it.id} todo={it} />
    }
    return <div className="todo-area">
        <div className="todo-buttons">
            <button onClick={() => selectedTodoStorage.setState(todos.addTodo().id)}>Add</button>
            <DeleteButton />
        </div>
        <div className="todo-list">
            {todosArr}
        </div>
    </div>
}

function ContentEditable({ value, onInput, className, contentEditable }) {
    const thisRef = R.useRef(null)

    R.useLayoutEffect(() => {
        if (thisRef.current.textContent !== value) {
            thisRef.current.textContent = value
        }
    })

    return (
        <div className={className} ref={thisRef} onInput={event => onInput(event.target.textContent)}
            contentEditable={contentEditable ?? true}
        />
    );
}

function TodoEditArea({ uid }) {
    if(uid === null) {
        return <ContentEditable className="edit-area" contentEditable="false" />
    }
    // note: hook is different per id, so this is a separate component to avoid bugs
    const contents = todos.allTodos[uid].useContents(it => it)

    function changed(content) {
        contents.updContent(content)
    }

    return <ContentEditable className="edit-area editable" onInput={changed} value={contents.content} />
}

function EditArea() {
    const selectedId = selectedTodoStorage(it => it)
    return <TodoEditArea key={selectedId} uid={selectedId} />
}

function Content() {
    return <div className="content">
        <Todos />
        <EditArea />
    </div>
}

export default function App() {
    return (
        <div className="app">
            <div className="header">
                <div className="title">FERN TO-DO App</div>
                <AccountHeader />
            </div>
            <Content />
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
