# pinia-firestore

Pinia with Firestore

pinia-firestore is a firestore helper library for [pinia](https://pinia.esm.dev/) inspired by [vuexfire](https://vuefire.vuejs.org/vuexfire/).


## Policy

- Please note that this is an experimental code for commercial use.
- When vuex5 is released, I plan to switch to it.


## Concept

- Using pinia, firebase(firestore) v9 and vue3
- Typescript support
- Use of differential update in real-time update (document unit)


## Sample Code

``` typescript
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  FieldValue,
} from "firebase/firestore";
import { defineStore } from "pinia";
import { bind, DocumentProperties } from "pinia-firestore";

const app = initializeApp({
  projectId: "agena-repo",
});

const db = getFirestore(app);
const colRefTodos = collection(db, "todos");
const unFinishedTodos = query(colRefTodos, where("finished", "==", false));
const finishedTodos = query(colRefTodos, where("finished", "==", true));
let currentTodos = unFinishedTodos;

export type TypeTodo = {
  finished: boolean;
  text: string;
  create: FieldValue;
};

export const useTodosStore = defineStore({
  id: "todos",
  state: () => ({
    todos: [] as (TypeTodo & DocumentProperties)[],
    isLoading: false,
  }),
  getters: {
    count: (state) => {
      return state.todos.length;
    },
  },
  actions: {
    async toggleBind() {
      currentTodos =
        currentTodos === finishedTodos ? unFinishedTodos : finishedTodos;
      this.isLoading = true;
      await bind(this, "todos", currentTodos);
      this.isLoading = false;
    },
    async init() {
      this.isLoading = true;
      await bind(this, "todos", currentTodos);
      this.isLoading = false;
    },
    addTodo(text: string) {
      const addData: TypeTodo = {
        finished: false,
        text,
        create: serverTimestamp(),
      };
      addDoc(colRefTodos, addData);
    },
    updateTodo(id: string, text: string) {
      updateDoc(doc(db, "todos/" + id), { text });
    },
    removeTodo(id: string) {
      deleteDoc(doc(db, "todos/" + id));
    },
  },
});

```


## Caution

Use v9 for firebase library.


## License

[MIT](http://opensource.org/licenses/MIT)

