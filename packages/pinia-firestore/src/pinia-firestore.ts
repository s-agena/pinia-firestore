import Vue from "vue";
import {
  QueryDocumentSnapshot,
  DocumentSnapshot,
  SnapshotMetadata,
  Unsubscribe,
  onSnapshot,
  DocumentReference,
  DocumentData,
  CollectionReference,
  Query,
} from "firebase/firestore";
import { StateTree, StoreWithState } from "pinia";

//////////////////
// define firestore type
//////////////////

export type FirestoreReference =
  | DocumentReference<DocumentData>
  | CollectionReference<DocumentData>
  | Query<DocumentData>;

//////////////////
// Output debug log.
//////////////////

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debug(message: string, ...data: any[]): void {
  if (_op.debug) console.log("[pinia-firestore] " + message, data);
}

//////////////////
// Keep the unsubscribe functions.
//////////////////

// define type
type TypeUnsubscribe = {
  id: string;
  name: string;
  unsub: Unsubscribe;
  type: string;
};

// keep value
const unsubs = {} as { [key: string]: TypeUnsubscribe };

// access methods
function store(id: string, name: string, unsub: Unsubscribe, type: string) {
  const item: TypeUnsubscribe = {
    id,
    name,
    unsub,
    type,
  };
  unsubs[id + ":" + name] = item;
  debug("store:", item);
}

function pick(id: string, name: string): TypeUnsubscribe {
  const item = unsubs[id + ":" + name];
  debug("pick:", id, name, item);
  return item;
}

function remove(id: string, name: string) {
  const item = unsubs[id + ":" + name];
  if (item !== undefined) {
    // If it has already been registered, it will be unsubscribe.
    delete unsubs[id + ":" + name];
    debug("remove:", id, name, item);
  }
}

//////////////////
// External public functions.
//////////////////

export type DocumentProperties = {
  readonly __id: string;
  readonly __path: string;
  readonly __metadata: SnapshotMetadata;
};

function makeDocumentData(
  snapshot: QueryDocumentSnapshot | DocumentSnapshot
): DocumentData {
  let doc = snapshot.data() || {};
  doc = Object.defineProperty(doc, "__id", { value: snapshot.id });
  doc = Object.defineProperty(doc, "__path", { value: snapshot.ref.path });
  doc = Object.defineProperty(doc, "__metadata", { value: snapshot.metadata });
  return doc;
}

export const bind = <ID extends string, S extends StateTree, G, A>(
  piniaInstance: StoreWithState<ID, S, G, A>,
  field: keyof S,
  ref: FirestoreReference
): Promise<void> => {
  return new Promise((resolve) => {
    let notified = false;
    // Delete bound listen
    const item = pick(piniaInstance.$id, field.toString());
    if (item !== undefined) {
      item.unsub();
    }

    // Receive real-time updates
    if (ref.type === "document") {
      // Receive real-time updates for a single document.
      const unsub = onSnapshot(
        ref,
        (snapshot) => {
          debug(
            "listen:",
            piniaInstance.$id,
            field.toString(),
            snapshot.data()
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          piniaInstance.$state[field] = makeDocumentData(snapshot) as any;

          // Notify the completion of the first update
          if (!notified) {
            notified = true;
            resolve();
          }
        },
        (error) => {
          debug("error", error);
          // https://firebase.google.com/docs/firestore/query-data/listen?hl=ja#handle_listen_errors
          remove(piniaInstance.$id, field.toString());

          // Notify the completion of the first update
          if (!notified) {
            notified = true;
            resolve();
          }
        }
      );
      store(piniaInstance.$id, field.toString(), unsub, ref.type);
    } else {
      // working area
      const docs: DocumentData[] = piniaInstance.$state[field];
      docs.splice(0, docs.length);
      // Receive real-time updates for multiple documents.
      const unsub = onSnapshot(
        ref,
        (querySnapshot) => {
          console.log("change len", querySnapshot.docChanges().length);
          querySnapshot.docChanges().forEach((change) => {
            debug(
              "listen:",
              piniaInstance.$id,
              field.toString(),
              change.type,
              change.doc.data()
            );
            if (change.type === "added") {
              docs.splice(change.newIndex, 0, makeDocumentData(change.doc));
            } else if (change.type === "modified") {
              docs.splice(change.newIndex, 1, makeDocumentData(change.doc));
            } else if (change.type === "removed") {
              docs.splice(change.oldIndex, 1);
            }
          });

          // Notify the completion of the first update
          if (!notified) {
            notified = true;
            resolve();
          }
        },
        (error) => {
          debug("error", error);
          // https://firebase.google.com/docs/firestore/query-data/listen?hl=ja#handle_listen_errors
          remove(piniaInstance.$id, field.toString());

          // Notify the completion of the first update
          if (!notified) {
            notified = true;
            resolve();
          }
        }
      );
      store(piniaInstance.$id, field.toString(), unsub, ref.type);
    }
  });
};

type UnbindOptions = {
  reset: boolean;
};

export const unbind = <ID extends string, S extends StateTree, G, A>(
  piniaInstance: StoreWithState<ID, S, G, A>,
  field: keyof S,
  options: UnbindOptions = { reset: true }
): void => {
  const item = pick(piniaInstance.$id, field.toString());
  if (item !== undefined) {
    item.unsub();
    remove(piniaInstance.$id, field.toString());

    // Overwrite with reset value
    if (options.reset) {
      if (item.type === "document") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        piniaInstance.$state[field] = {} as any;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        piniaInstance.$state[field] = [] as any;
      }
    }
  }
};

//////////////////
// Functions for plugins.
//////////////////

export type CreateOptions = {
  debug: boolean;
};

const _op: CreateOptions = {
  debug: false,
};

export function createPiniaFirestore(
  options: CreateOptions = { debug: false }
): Vue.Plugin {
  return {
    install: () => {
      _op.debug = options.debug;
      debug("install");
    },
  };
}
