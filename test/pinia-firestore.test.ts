import { createApp } from 'vue'
import { createPinia, defineStore } from 'pinia' 
import { bind, unbind, createPiniaFirestore } from '../src/pinia-firestore'
import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore, doc, collection, setDoc, deleteDoc } from 'firebase/firestore'

createApp({}).use(createPinia()).use(createPiniaFirestore({debug:true}))

const app = initializeApp({
  projectId: "test"
})
connectFirestoreEmulator(getFirestore(), 'localhost', 58080)

const _sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type DummyDoc = {
  string: string
  number: number
}

test('document reference', async () => {
  // dummy data
  setDoc(doc(getFirestore(), "test/doc1"), {"string": "abc", "number": 123})
  
  const useTestStore = defineStore('test', {
    state: () => ({
      doc: {
        string: "not bind"
      } as DummyDoc,
      docs: [] as DummyDoc[]
    }),
    actions: {
      docBind() {
        bind(this, "doc", doc(getFirestore(), "test/doc1"))
        bind(this, "docs", collection(getFirestore(), "test"))
      },
      docUnbind() {
        unbind(this, "doc")
        unbind(this, "docs")
      }
    }
  })

  const store = useTestStore()
  store.docBind()
  store.docBind()

  await _sleep(300);

  expect(store.doc.string).toBe("abc")
  expect(store.docs.length).toBe(1)

  setDoc(doc(getFirestore(), "test/doc2"), {"string": "abc", "number": 123})

  await _sleep(300);

  expect(store.docs.length).toBe(2)

  deleteDoc(doc(getFirestore(), "test/doc1"))

  await _sleep(300);

  expect(store.docs.length).toBe(1)

  setDoc(doc(getFirestore(), "test/doc2"), {"string": "123", "number": 123})

  await _sleep(300);

  expect(store.docs[0].string).toBe("123")

  deleteDoc(doc(getFirestore(), "test/doc2"))

  await _sleep(300);

  expect(store.docs.length).toBe(0)

  store.docUnbind()
  store.docUnbind()
})