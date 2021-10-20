
import Vue from 'vue'
import { Unsubscribe, onSnapshot, DocumentReference, DocumentData, CollectionReference, Query } from 'firebase/firestore'

//////////////////
// Keep the unsubscribe functions.
//////////////////

// define type
type TypeUnsubscribe = {
  id: string
  name: string
  unsub: Unsubscribe
  type: string
}

// keep value
const unsubs = {} as { [key: string]: TypeUnsubscribe }

// access methods
function store(id: string, name: string, unsub: Unsubscribe, type: string) {
  const item: TypeUnsubscribe = {
    id,
    name,
    unsub,
    type,
  }
  unsubs[id + ":" + name] = item
  if (_op.log) console.log("[pinia-firestore] store:", item)
}

function pick(id: string, name: string): TypeUnsubscribe {
  const item = unsubs[id + ":" + name]
  if (_op.log) console.log("[pinia-firestore] pick:", id, name, item)
  return item
}

function remove(id: string, name: string) {
  const item = unsubs[id + ":" + name]
  if (item !== undefined) {
    //　If it has already been registered, it will be unsubscribe.
    delete unsubs[id + ":" + name]
    if (_op.log) console.log("[pinia-firestore] remove:", id, name, item)
  } else {
    if (_op.log) console.log("[pinia-firestore] remove(fail):", id, name)
  }
}

//////////////////
// External public functions.
//////////////////

export const bind = (piniaInstance: any, param: string, ref: DocumentReference<DocumentData> | CollectionReference<DocumentData> | Query<DocumentData>) => {
  // Delete bound listen
  const item = pick(piniaInstance.$id, param)
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
    store(piniaInstance.$id, param, unsub, ref.type)
  } else {
    // Receive real-time updates for multiple documents.
    const unsub = onSnapshot(ref, (querySnapshot) => {
      const docs = [] as any[]
      querySnapshot.forEach((snapshot) => {
        if (_op.log) console.log("[pinia-firestore] listen:", piniaInstance.$id, param, snapshot.data())
        docs.push({
          id: snapshot.id,
          ...snapshot.data()
        })
      })
      piniaInstance[param] = docs
    })
    store(piniaInstance.$id, param, unsub, ref.type)    
  }
}

export const unbind = (piniaInstance: any, param: string, val?: any) => {
  const item = pick(piniaInstance.$id, param)
  if (item !== undefined) {
    item.unsub()
    remove(piniaInstance.$id, param)

    // Overwrite with reset value
    if (val !== undefined) {
      piniaInstance[param] = val
    }  
  }
}

//////////////////
// Functions for plugins.
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
