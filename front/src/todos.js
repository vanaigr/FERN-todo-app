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

export function useMapTodos(mapper) {
    useTodosTick(it => it.tick)
    return todosOrder.map(id => mapper(todos[id]))
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
    todosOrder.push(id)
    tick()
    return todo
}

export function removeTodo(id) {
    delete todos[id]
    const i = todosOrder.indexOf(id)
    if(i !== -1) todosOrder.splice(i, 1)
    tick()
}


function genUUID() {
    // note: assumes .export() is little-endian. This should not matter any way
    const arr = new UUID(4).export()
    if(arr.length != 16) throw "Unknown uuid"
    var res = BigInt(arr[0])
    for(let i = 1; i < 16; i++) {
        res |= BigInt(arr[i]) << BigInt(i * 8)
    }
    return res
}
