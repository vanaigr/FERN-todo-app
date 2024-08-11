import { create } from "zustand"
import * as todos from "./todos.js"

var savedTick
todos.onTodosChanged((tick) => {
    if(tick === savedTick) return
    const res = []
    for(var key in todos.todos) {
        const it = todos.todos[key]
        const contents = it.contents
        res.push([it.id, contents.rev, contents.content, it.createdAt.getTime()])
    }
    localStorage.setItem('todos', JSON.stringify(res))
    savedTick = tick
})

export function loadLocalTodos() {
    try {
        const newTodosJ = JSON.parse(localStorage.getItem('todos'))
        const newTodos = {}
        for(var i = 0; i < newTodosJ.length; i++) {
            const it = newTodosJ[i]
            const todo = new todos.Todo(it[0], it[1], it[2], new Date(it[3]))
            newTodos[todo.id] = todo
        }

        const newChangedTick = todos.getTodosChangedTick() + 1
        const prevSavedTick = savedTick
        savedTick = newChangedTick
        try {
            todos.setTodos(newTodos)
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
