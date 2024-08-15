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
    const contents = todo.useContents(it => it)
    const content = contents.content.substring(0, 60)
    const isSynced = contents.syncState === todos.SyncStatus.synced

    var desc
    if(!content) {
        desc = <div className="todo-desc todo-desc-empty">Enter your note in the space on the right...</div>
    }
    else {
        desc = <div className="todo-desc">{content}</div>
    }

    return (
        <div onClick={setSelected} className={`todo ${isSelected ? 'todo-selected' : ''}`}>
            <div className="todo-top-bar">
                <div className="sync-icon" data-synced={isSynced}></div>
                <div className="date">{formatTodoDate(todo.createdAt)}</div>
            </div>
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

function TodoEditArea({ uid }) {
    if(uid === null) {
        return <div className="edit-area hint" data-hint="Select a note on the right..." contentEditable="false" />
    }
    // note: hook is different per id, so this is a separate component to avoid bugs
    const contents = todos.allTodos[uid].useContents(it => it)

    function updContent(it) {
        if(!it) return
        const content = contents.content
        if (it.innerText === content) return
        it.innerText = content ?? ''
    }

    return <div className={"edit-area hint"} ref={updContent} data-hint="Type here..."
        onInput={event => contents.updContent(event.target.innerText)} contentEditable={true} />
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
