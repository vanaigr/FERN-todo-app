import { create } from "zustand"
import UUID from "pure-uuid"

const serverUrl = 'http://localhost:2999'


export var currentTodos = []
export var allTodos = {}

// note: tick allows to mutate todos list but still trigger updates when needed
const useTodosTick = create(set => ({
    tick: 0,
    updated: () => set(it => ({ tick: it.tick + 1 }))
}))
function tick() {
    useTodosTick.getState().updated()
}

const todosChangedCallbacks = []
var todosChangedTick = 0 // tick for every update, not just the list
function todosChanged() {
    todosChangedTick++
    todosChangedCallbacks.forEach(it => {
        try { it(todosChangedTick) } catch(e) { console.error(e) }
    })
}
useTodosTick.subscribe(todosChanged)

export function getTodosChangedTick() {
    return todosChangedTick
}

export function onTodosListChanged(cb) {
    return useTodosTick.subscribe(() => cb())
}

export function onTodosChanged(cb) {
    todosChangedCallbacks.push(cb)
}

export function useCurrentTodos() {
    useTodosTick(it => it.tick)
    return currentTodos
}

export function useTodo() {

}

export class Todo {
    // { id, createdAt, rev, deleted, useContents, _unsubContents }

    delete() {
        this.deleted = true
        if(this._unsubContents) this._unsubContents()
    }

    get contents() {
        return this.useContents.getState()
    }
}

export const SyncStatus = {
    local: 0b01,
    synced: 0b10,
    syncedChanged: 0b11,
    shouldSync: (it) => (it & 0b01) !== 0,
    toModified: (it) => it | 0b01,
}

export function createTodo(id, rev, content, createdAt, syncState) {
    var todo = new Todo()

    todo.id = id
    todo.createdAt = createdAt
    todo.deleted = false
    todo.useContents = create(set => ({
        content, rev, syncState,
        updContent: (newContent) => set(cur => ({
            content: newContent,
            rev: genUUID(),
            syncState: SyncStatus.toModified(cur.syncState),
        })),
    }))
    todo._unsubContents = todo.useContents.subscribe(todosChanged)

    return todo
}

export function addTodo() {
    const todo = createTodo(genUUID(), genUUID(), '', new Date(), SyncStatus.local)
    allTodos[todo.id] = todo
    currentTodos.push(todo)
    tick()
    return todo
}

export function removeTodo(id) {
    const todo = allTodos[id]
    if(!todo) return
    if(todo.syncState === SyncStatus.local) delete allTodos[id]
    const i = currentTodos.indexOf(todo)
    if(i !== -1) currentTodos.splice(i, 1)
    todo.delete()
    tick()
}

function setFromOther(dest, prop, src) {
    if(src.hasOwnProperty(prop)) {
        dest[prop] = src[prop]
    }
}

export function setTodosData(newData) {
    console.log('# of old todos:', Object.keys(allTodos).length, '# of new todos:', Object.keys(newData).length)

    const newTodos = {}
    const newCurrentTodos = []

    var created = 0, preserved = 0, modified = 0, deleted = 0

    for(let id in newData) {
        const it = newData[id]
        const orig = allTodos[id]
        let todo
        if(orig == null) {
            todo = createTodo(id, it.rev, it.content, it.createdAt, it.syncState)
            created++
        }
        else {
            delete allTodos[id]
            todo = orig

            setFromOther(todo, 'createdAt', it)

            const oldState = todo.contents
            const newState = { ...oldState }
            setFromOther(newState, 'content', it)
            setFromOther(newState, 'rev', it)
            setFromOther(newState, 'syncState', it)
            if(oldState.content !== newState.content || oldState.rev !== newState.rev || oldState.syncState !== newState.syncState) {
                todo.useContents.setState(newState)
                modified++
            }
            else {
                preserved++
            }
        }

        if(todo.deleted) todo.delete()
        else newCurrentTodos.push(todo)
        newTodos[id] = todo
    }

    for(let id in allTodos) {
        deleted++
        allTodos[id].delete()
    }

    console.log('created:', created, 'preseved:', preserved, 'modified:', modified, 'deleted:', deleted)

    newCurrentTodos.sort((a, b) => a.createdAt - b.createdAt)

    allTodos = newTodos
    currentTodos = newCurrentTodos
    tick()
}


export function genUUID() {
    // note: assumes .export() is little-endian. This should not matter any way
    const arr = new UUID(4).export()
    if(arr.length != 16) throw "Unknown uuid"
    var res = ''
    for(var i = 0; i < 8; i++) {
        res += String.fromCharCode(arr[2*i] | (arr[2*i + 1] << 8))
    }
    return res
}
