import * as todos from "./todos.js"
import * as auth from "./auth.js"

type SavedTodo = [
    id: todos.TodoUUID,
    content: string,
    rev: todos.TodoUUID,
    createdAt: number,
    deleted: 1 | 0,
    syncState: todos.SyncStatus,
]

const enum LocalStorage {
    currentVersion = 3
}

var savedTick: number | undefined
todos.onTodosChanged((tick) => {
    if(tick === savedTick) return
    const res: SavedTodo[] = []
    for(var key in todos.allTodos) {
        const it = todos.allTodos[key]
        const contents = it.contents
        res.push([it.id, contents.content, contents.rev, it.createdAt.getTime(), it.deleted ? 1 : 0, it.contents.syncState])
    }
    localStorage.setItem('todos', JSON.stringify({ ver: LocalStorage.currentVersion, res }))
    savedTick = tick
})

function clearLocalTodos() {
    localStorage.removeItem('todos')
}

export function loadLocalTodos() {
    try {
        const newTodosJ = JSON.parse(localStorage.getItem('todos') ?? '{}')
        if(newTodosJ == null) return
        if(newTodosJ.ver !== LocalStorage.currentVersion) {
            localStorage.removeItem('todos')
            return
        }
        const stored = newTodosJ.res as SavedTodo[]
        const newData: Record<todos.TodoUUID, todos.TodoData> = {}
        for(var i = 0; i < stored.length; i++) {
            const it = stored[i]
            newData[it[0]] = { content: it[1], rev: it[2], createdAt: new Date(it[3]), deleted: it[4] !== 0, syncState: it[5] }
        }

        const newChangedTick = todos.getTodosChangedTick() + 1
        const prevSavedTick = savedTick
        savedTick = newChangedTick
        try {
            todos.setTodosData(newData)
        }
        catch(e) {
            savedTick = prevSavedTick
            throw e
        }
    }
    catch(e) {
        console.error(e)
    }
}

type TodoRequest = {
    id: todos.TodoUUID,
    rev?: todos.TodoUUID,
    content?: string,
    syncState?: todos.SyncStatus,
    createdAt?: number
}

async function handleSyncResponse(_todosRequest: TodoRequest[], response: Response) {
    const orig = todos.allTodos

    const result = await response.json().catch(e => { console.error(e) })
    if(!response.ok || !result) {
        return console.error("Could not sync: " + (typeof(result) == 'object' ? JSON.stringify(result) : result))
    }

    const newData: Record<todos.TodoUUID, todos.TodoData> = {}
    for(const id in result) {
        const r = result[id]
        const it = orig[id]
        if(r.content == null) {
            newData[id] = { syncState: todos.SyncStatus.synced }
        }
        else if(it) {
            newData[id] = { content: r.content, rev: r.rev, syncState: todos.SyncStatus.synced }
        }
        else {
            newData[id] = { content: r.content, rev: r.rev, createdAt: new Date(r.createdAt), syncState: todos.SyncStatus.synced }
        }
    }

    todos.setTodosData(newData)
}

export const serverUrl = __SERVER_URL__

async function syncTodosForToken(force: boolean, idToken: string) {
    const tds = todos.allTodos
    const todosR: TodoRequest[] = []
    let notSynced = false
    for(const id in tds) {
        const it = tds[id]
        if(it.deleted) {
            notSynced = true
            todosR.push({ id: it.id })
        }
        else if(todos.SyncStatusF.shouldSync(it.contents.syncState)) {
            notSynced = true
            const contents = it.contents
            todosR.push({ id: it.id, rev: contents.rev, content: contents.content, createdAt: it.createdAt.getTime() })
        }
        else {
            todosR.push({ id: it.id, rev: it.contents.rev })
        }
    }

    if(!force && !notSynced) return

    preventAutosave = true
    try {
        const response = await fetch(new URL('api/sync-notes', serverUrl), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': idToken,
            },
            body: JSON.stringify(todosR)
        })
        await handleSyncResponse(todosR, response)
    }
    catch(e) {
        console.error(e)
    }
    finally {
        preventAutosave = false
    }
}

export async function syncTodos(force: boolean) {
    const it = auth.useAccount.getState()
    if(!it.ok) return
    const u = it.user!
    const idToken = await u.getIdToken()
    await syncTodosForToken(force, idToken)
}

auth.onBeforeLogout(async() => {
    await syncTodos(false)
    clearLocalTodos()
    todos.setTodosData({})
})

auth.useAccount.subscribe(_ => syncTodos(true))

var prevSaveTimer: any, prevSaveInterval: any, preventAutosave: boolean
function transitionAutosave() {
    if(!preventAutosave) syncTodos(false)
    prevSaveInterval = setInterval(() => {
        if(!preventAutosave) syncTodos(true)
    }, 5000)
}
function resetAutosave() {
    clearTimeout(prevSaveTimer)
    clearInterval(prevSaveInterval)
    prevSaveTimer = setTimeout(transitionAutosave, 1000)
}
todos.onTodosChanged(resetAutosave)
