
import Vue from 'vue'
import { QueryDocumentSnapshot, DocumentSnapshot, SnapshotMetadata, Unsubscribe, onSnapshot, DocumentReference, DocumentData, CollectionReference, Query } from 'firebase/firestore'
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
  }
}

//////////////////
// External public functions.
//////////////////

type PiniFireDocument = DocumentData & {
  readonly __id: string
  readonly __path: string
  readonly __metadata: SnapshotMetadata
}

function makePiniFireDocument(snapshot: QueryDocumentSnapshot | DocumentSnapshot): PiniFireDocument {
  return {
    __id: snapshot.id,
    __path: snapshot.ref.path,
    __metadata: snapshot.metadata,
    ...snapshot.data()
  }
}

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
      piniaInstance.$state[field] = makePiniFireDocument(snapshot) as any
    })
    store(piniaInstance.$id, field.toString(), unsub, ref.type)
  } else {
    // working area
    const docs: PiniFireDocument[] = piniaInstance.$state[field]
    docs.splice(0, docs.length)
    // Receive real-time updates for multiple documents.
    const unsub = onSnapshot(ref, (querySnapshot) => {
      querySnapshot.docChanges().forEach((change) => {
        debug("listen:", piniaInstance.$id, field.toString(), change.type, change.doc.data())
        if (change.type === "added") {
          docs.splice(change.newIndex, 0, makePiniFireDocument(change.doc))
        } else if (change.type === 'modified') {
          docs.splice(change.newIndex, 1, makePiniFireDocument(change.doc))
        } else if (change.type === 'removed') {
          docs.splice(change.oldIndex, 1)
        }
      })
    })
    store(piniaInstance.$id, field.toString(), unsub, ref.type)    
  }
}

type UnbindOptions = {
  reset: boolean
}

export const unbind = <ID extends string, S extends StateTree, G, A>
(piniaInstance: StoreWithState<ID,S,G,A>, field: keyof S, options: UnbindOptions = { reset: true }) => {
  const item = pick(piniaInstance.$id, field.toString())
  if (item !== undefined) {
    item.unsub()
    remove(piniaInstance.$id, field.toString())

    // Overwrite with reset value
    if (options.reset) {
      if (item.type === 'document') {
        piniaInstance.$state[field] = {} as any
      } else {
        piniaInstance.$state[field] = [] as any
      }
    }
  }
}

//////////////////
// Functions for plugins.
//////////////////

export type CreateOptions = {
  debug: boolean
}

const _op: CreateOptions = {
  debug: false
}

export function createPiniaFirestore(options: CreateOptions = { debug: false }) {
  return {
    install: (app: Vue.App) => {
      _op.debug = options.debug
      debug("install")
    }
  }
}
