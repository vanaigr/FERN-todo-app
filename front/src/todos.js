import { create } from "zustand"
import * as UUID from "pure-uuid"

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
    constructor(id, rev, content, createdAt, local, synced, changed) {
        this.id = id
        this.createdAt = typeof(createdAt) == 'number' ? new Date(createdAt) : createdAt
        this.deleted = false
        this.local = local
        this.useContents = create(set => ({
            content, rev, synced, changed,
            updContent: (newContent) => set({
                content: newContent,
                rev: genUUID(),
                synced: false,
                changed: false,
            }),
        }))
        this._unsubContents = this.useContents.subscribe(todosChanged)
    }

    delete() {
        this.deleted = true
        if(this._unsubContents) this._unsubContents()
    }

    get contents() {
        return this.useContents.getState()
    }
}

export function addTodo() {
    const id = genUUID()
    const rev = genUUID()
    const todo = new Todo(id, rev, '', new Date(), true, false, true)

    allTodos[id] = todo
    currentTodos.push(todo)
    tick()
    return todo
}

export function removeTodo(id) {
    const todo = allTodos[id]
    if(!todo) return
    if(todo.local) delete allTodos[id]
    const i = currentTodos.indexOf(todo)
    if(i !== -1) currentTodos.splice(i, 1)
    todo.delete()
    tick()
}

export function setTodos(newTodos) {
    const newCurrentTodos = []
    for(var id in newTodos) {
        const todo = newTodos[id]
        if(!todo.deleted) newCurrentTodos.push(todo)
    }
    newCurrentTodos.sort((a, b) => a.createdAt - b.createdAt)

    currentTodos.forEach(it => it.delete())
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
