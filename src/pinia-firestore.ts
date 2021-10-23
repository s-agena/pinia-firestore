
import Vue from 'vue'
import { Unsubscribe, onSnapshot, DocumentReference, DocumentData, CollectionReference, Query } from 'firebase/firestore'
import { StateTree, StoreWithState } from 'pinia'

//////////////////
// define firestore type
//////////////////

type FirestoreReference = DocumentReference<DocumentData> | CollectionReference<DocumentData> | Query<DocumentData>

//////////////////
// Output debug log.
//////////////////

function debug(message: string, ...data: any[]): void {
  if (_op.debug) console.log("[pinia-firestore] "+message, data)
}

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
  debug("store:", item)
}

function pick(id: string, name: string): TypeUnsubscribe {
  const item = unsubs[id + ":" + name]
  debug("pick:", id, name, item)
  return item
}

function remove(id: string, name: string) {
  const item = unsubs[id + ":" + name]
  if (item !== undefined) {
    //　If it has already been registered, it will be unsubscribe.
    delete unsubs[id + ":" + name]
    debug("remove:", id, name, item)
  } else {
    debug("remove(fail):", id, name)
  }
}

//////////////////
// External public functions.
//////////////////


export const bind = <ID extends string, S extends StateTree, G, A>
(piniaInstance: StoreWithState<ID,S,G,A>, field: keyof S, ref: FirestoreReference) => {
  // Delete bound listen
  const item = pick(piniaInstance.$id, field.toString())
  if (item !== undefined) {
    item.unsub()
  }

  // Receive real-time updates
  if (ref.type === 'document') {
    // Receive real-time updates for a single document.
    const unsub = onSnapshot(ref, (snapshot) => {
      debug("listen:", piniaInstance.$id, field.toString(), snapshot.data())
      piniaInstance.$state[field] = snapshot.data() as any
    })
    store(piniaInstance.$id, field.toString(), unsub, ref.type)
  } else {
    // Receive real-time updates for multiple documents.
    const unsub = onSnapshot(ref, (querySnapshot) => {
      const docs = [] as any[]
      /*
      querySnapshot.docChanges().forEach((change) => {
        console.log("debug:", change)
        console.log("debug:", change.doc.data())
      }),
      */
      querySnapshot.forEach((snapshot) => {
        debug("listen:", piniaInstance.$id, field.toString(), snapshot.data())
        docs.push({
          id: snapshot.id,
          ...snapshot.data()
        })
      })
      piniaInstance.$state[field] = docs as any
    })
    store(piniaInstance.$id, field.toString(), unsub, ref.type)    
  }
}

export const unbind = <ID extends string, S extends StateTree, G, A>
(piniaInstance: StoreWithState<ID,S,G,A>, field: keyof S, val?: any) => {
  const item = pick(piniaInstance.$id, field.toString())
  if (item !== undefined) {
    item.unsub()
    remove(piniaInstance.$id, field.toString())

    // Overwrite with reset value
    if (val !== undefined) {
      piniaInstance.$state[field] = val
    }  
  }
}

//////////////////
// Functions for plugins.
//////////////////

export type Options = {
  debug: boolean
}

const _op: Options = {
  debug: false
}

export function createPiniaFirestore(options?: Options) {
  return {
    install: (app: Vue.App) => {
      if (options !== undefined) {
        _op.debug = options.debug
      }
      debug("install")
    }
  }
}
