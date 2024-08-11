/* global BigInt */

import { create } from "zustand"
import * as UUID from 'pure-uuid'

const serverUrl = 'http://localhost:2999'


const todosOrder = []
const todos = {}

// note: tick allows to mutate todos list but still trigger updates when needed
const useTodosTick = create(set => ({
    tick: 0,
    updated: () => set(it => ({ tick: it.tick + 1 }))
}))
function tick() {
    useTodosTick.getState().updated()
}

export function getTodo(id) {
    return todos[id]
}

export function onTodosChanged(cb) {
    return useTodosTick.subscribe(() => cb())
}

export function useTodosOrdered() {
    useTodosTick(it => it.tick)
    return todosOrder
}

export function addTodo() {
    const id = genUUID()
    const rev = genUUID()
    const todo = {
        id, createdAt: new Date(),
        useContent: create(set => ({
            content: '', rev,
            updContent: (newContent) => set({ content: newContent, rev: genUUID() }),
        })),
    }
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
