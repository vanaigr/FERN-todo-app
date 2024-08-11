import { create } from "zustand"
import * as UUID from "pure-uuid"

const serverUrl = 'http://localhost:2999'


export var todosOrder = []
export var todos = {}

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

export function useTodosOrdered() {
    useTodosTick(it => it.tick)
    return todosOrder
}

export class Todo {
    constructor(id, rev, content, createdAt) {
        this.id = id
        this.rev = rev
        this.createdAt = createdAt
        this.useContents = create(set => ({
            content, rev,
            updContent: (newContent) => set({ content: newContent, rev: genUUID() }),
        }))

        this.useContents.subscribe(todosChanged)
    }

    get contents() {
        return this.useContents.getState()
    }
}

export function addTodo() {
    const id = genUUID()
    const rev = genUUID()
    const todo = new Todo(id, rev, '', new Date())
    todos[id] = todo
    todosOrder.push(todo)
    tick()
    return todo
}

export function removeTodo(id) {
    const todo = todos[id]
    delete todos[id]
    const i = todosOrder.indexOf(todo)
    if(i !== -1) todosOrder.splice(i, 1)
    tick()
}

export function setTodos(newTodos) {
    const newTodosOrder = []
    for(var id in newTodos) {
        const todo = newTodos[id]
        newTodosOrder.push(todo)
    }
    newTodosOrder.sort((a, b) => a.createdAt - b.createdAt)

    todos = newTodos
    todosOrder = newTodosOrder

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
