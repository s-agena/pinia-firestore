
import Vue from 'vue'
import { defineStore } from 'pinia'
import { Unsubscribe } from 'firebase/firestore'
import { onSnapshot, DocumentReference, DocumentData, CollectionReference, Query } from 'firebase/firestore'

//////////////////
// 
//////////////////

type TypeUnsubscribe = {
  id: string
  name: string
  unsub: Unsubscribe
  type: string
}

 const useStore = defineStore('pinia-firestore', {
  state: () => ({
    unsubs: {} as { [key: string]: TypeUnsubscribe }
  }),

  getters: {
  },

  actions: {
    store(id: string, name: string, unsub: Unsubscribe, type: string) {
      const item: TypeUnsubscribe = {
        id,
        name,
        unsub,
        type,
      }
      this.unsubs[id + ":" + name] = item
      if (_op.log) console.log("[pinia-firestore] store:", item)
    },
    pick(id: string, name: string): TypeUnsubscribe {
      const item = this.unsubs[id + ":" + name]
      if (_op.log) console.log("[pinia-firestore] pick:", id, name, item)
      return item
    },
    remove(id: string, name: string) {
      const item = this.unsubs[id + ":" + name]
      if (item !== undefined) {
        //　If it has already been registered, it will be unsubscribe.
        delete this.unsubs[id + ":" + name]
        if (_op.log) console.log("[pinia-firestore] remove:", id, name, item)
      } else {
        if (_op.log) console.log("[pinia-firestore] remove(fail):", id, name)
      }
    }
  }
})

export const bind = (piniaInstance: any, param: string, ref: DocumentReference<DocumentData> | CollectionReference<DocumentData> | Query<DocumentData>) => {
  const store = useStore()

  // Delete bound listen
  const item = store.pick(piniaInstance.$id, param)
  if (item !== undefined) {
    item.unsub()
  }

  // Receive real-time updates
  if (ref.type === 'document') {
    // Receive real-time updates for a single document.
    const unsub = onSnapshot(ref, (snapshot) => {
      if (_op.log) console.log("[pinia-firestore] listen:", piniaInstance.$id, param, snapshot.data())
      piniaInstance[param] = snapshot.data()
    })
    store.store(piniaInstance.$id, param, unsub, ref.type)
  } else {
    // Receive real-time updates for multiple documents.
    const unsub = onSnapshot(ref, (querySnapshot) => {
      const docs = [] as any[]
      querySnapshot.forEach((snapshot) => {
        if (_op.log) console.log("[pinia-firestore] listen:", piniaInstance.$id, param, snapshot.data())
        docs.push(snapshot.data())
      })
      piniaInstance[param] = docs
    })
    store.store(piniaInstance.$id, param, unsub, ref.type)    
  }
}

export const unbind = (piniaInstance: any, param: string, val?: any) => {
  const store = useStore()
  const item = store.pick(piniaInstance.$id, param)
  if (item !== undefined) {
    item.unsub()
    store.remove(piniaInstance.$id, param)

    // Overwrite with reset value
    if (val !== undefined) {
      piniaInstance[param] = val
    }  
  }
}

//////////////////
// 
//////////////////

export type Options = {
  log: boolean
}

const _op: Options = {
  log: false
}

export function createPiniaFirestore(options: Options | undefined) {
  return {
    install: (app: Vue.App) => {
      if (options !== undefined) {
        _op.log = options.log
      }
      if (_op.log) console.log("install")
    }
  }
}
