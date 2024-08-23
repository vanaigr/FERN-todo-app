import * as zustand from "zustand"
import UUID from "pure-uuid"

// const serverUrl = 'http://localhost:2999'

export var currentTodos: Todo[] = []
export var allTodos: Record<TodoUUID, Todo> = {}

// note: tick allows to mutate todos list but still trigger updates when needed
const useTodosTick = zustand.create<number>((_set) => 0)
function tick() {
    useTodosTick.setState(it => it + 1)
}

export type TodosListChangedCb = () => void
export type TodosChangedCb = (changedTick: number) => void

const todosChangedCallbacks: TodosChangedCb[] = []
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

export function onTodosListChanged(cb: TodosListChangedCb) {
    return useTodosTick.subscribe(() => cb())
}

export function onTodosChanged(cb: TodosChangedCb) {
    todosChangedCallbacks.push(cb)
}

export function useCurrentTodos() {
    useTodosTick(it => it)
    return currentTodos
}

export function useTodo() {

}

export enum SyncStatus {
    local = 0b01,
    synced = 0b10,
    syncedChanged = 0b11,
}

export const SyncStatusF = {
    shouldSync: (it: SyncStatus): boolean => (it & 0b01) !== 0,
    toModified: (it: SyncStatus): SyncStatus => it | 0b01,
} as const

export type TodoUUID = string
export type TodoContents = {
    content: string, rev: TodoUUID,
    syncState: SyncStatus,
    updContent: (newContent: string) => void
}

export class Todo {
    id!: TodoUUID
    createdAt!: Date
    deleted!: boolean
    useContents!: zustand.UseBoundStore<zustand.StoreApi<TodoContents>>
    _unsubContents!: () => void

    delete() {
        this.deleted = true
        if(this._unsubContents) this._unsubContents()
    }

    get contents() {
        return this.useContents.getState()
    }
}

export function createTodo(id: TodoUUID, rev: TodoUUID, content: string, createdAt: Date, syncState: SyncStatus) {
    var todo = new Todo()

    todo.id = id
    todo.createdAt = createdAt
    todo.deleted = false
    todo.useContents = zustand.create<TodoContents>(set => ({
        content, rev, syncState,
        updContent: (newContent) => set(cur => ({
            content: newContent,
            rev: genUUID(),
            syncState: SyncStatusF.toModified(cur.syncState),
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

export function removeTodo(id: TodoUUID) {
    const todo = allTodos[id]
    if(!todo) return
    if(todo.contents.syncState === SyncStatus.local) delete allTodos[id]
    const i = currentTodos.indexOf(todo)
    if(i !== -1) currentTodos.splice(i, 1)
    todo.delete()
    tick()
}
function setFromOther(dest: any, prop: any, src: any) {
    if(src.hasOwnProperty(prop)) {
        dest[prop] = src[prop]
    }
}

export type TodoData = Partial<{ rev: TodoUUID , content: string , createdAt: Date, syncState: SyncStatus, deleted: boolean }>

export function setTodosData(newData: Record<TodoUUID, TodoData>) {
    console.log('# of old todos:', Object.keys(allTodos).length, '# of new todos:', Object.keys(newData).length)

    const newTodos: typeof allTodos = {}
    const newCurrentTodos = []

    var created = 0, preserved = 0, modified = 0, deleted = 0

    for(let id in newData) {
        const it = newData[id]
        const orig: Todo | undefined = allTodos[id]
        let todo: Todo
        if(orig == null) {
            if(it.rev == null || it.content == null || it.createdAt == null || it.syncState == null) {
                console.error("Todo " + id + " is new and should have all properties ", JSON.stringify(it))
                continue
            }
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

            if(todo.deleted) todo.delete
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
    newCurrentTodos.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

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
