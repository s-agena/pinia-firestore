# pinia-firestore

Pinia with Firestore

pinia-firestore is a firestore helper library for pinia inspired by vuex fire.


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
} from "firebase/firestore";
import { defineStore } from "pinia";
import { bind } from "pinia-firestore";

const app = initializeApp({
  projectId: "agena-repo",
});

const db = getFirestore(app);
const colRefTodos = collection(db, "todos");
const unFinishedTodos = query(colRefTodos, where("finished", "==", false));
const finishedTodos = query(colRefTodos, where("finished", "==", true));
let currentTodos = unFinishedTodos;

export type TypeTodo = {
  __id: string;
  text: string;
};

export const useTodosStore = defineStore({
  id: "todos",
  state: () => ({
    todos: [] as TypeTodo[],
  }),
  getters: {
    count: (state) => {
      return state.todos.length;
    },
  },
  actions: {
    toggleBind() {
      currentTodos =
        currentTodos === finishedTodos ? unFinishedTodos : finishedTodos;
      bind(this, "todos", currentTodos);
    },
    init() {
      bind(this, "todos", currentTodos);
    },
    addTodo(text: string) {
      addDoc(colRefTodos, {
        finished: false,
        text,
        create: serverTimestamp(),
      });
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