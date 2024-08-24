import * as zustand from 'zustand'

type ItemStorage<K, E> = Map<K, zustand.UseBoundStore<zustand.StoreApi<E>>>

export class StateMap<K, E extends {}> {
    _items: ItemStorage<K, E>
    _useItemsChanged: zustand.UseBoundStore<zustand.StoreApi<number>>

    constructor() {
        this._items = new Map()
        this._useItemsChanged = zustand.create(_ => 0)
    }

    useKeys() {
        this._useItemsChanged()
        return this._items.keys()
    }

    useValue(key: K): E | undefined {
        this._useItemsChanged()
        const eStorage = this._items.get(key)
        if(eStorage == null) return
        return eStorage()
    }

    setValue(key: K, value: E) {
        this._items.set(key, zustand.create(() => value))
        this._useItemsChanged.setState(it => it + 1)
        return true
    }

    removeValue(key: K) {
        const changed = this._items.delete(key)
        if(changed) this._useItemsChanged.setState(it => it + 1)
        return changed
    }
}
