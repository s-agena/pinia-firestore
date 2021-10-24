<template>
  <button @click="toggleTodos">Toggle todos</button> <br />
  <input
    v-model.trim="newTodoText"
    @keyup.enter="addTodo"
    placeholder="Add new todo"
  />
  <ul>
    <li v-for="(todo, index) in todos" v-bind:key="index">
      <input :value="todo.text" @input="updateTodoText(todo, $event)" />
      <button @click="removeTodo(todo)">X</button>
    </li>
  </ul>
  <p>config:</p>
  <pre>
    {{ config }}
  </pre>
  <p>todos:</p>
  <pre>
    {{ todos }}
  </pre>
  <p>count: {{ counter.count }}</p>
</template>

<script lang="ts">
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  serverTimestamp,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { defineStore } from "pinia";
import {
  bind,
  FirestoreReference,
} from "../../../../pinia-firestore/dist/pinia-firestore";
import { computed, ref, defineComponent } from "vue";

const app = initializeApp({
  projectId: "agena-repo",
});

const db = getFirestore(app);
const colRefTodos = collection(db, "todos");
const unFinishedTodos = query(colRefTodos, where("finished", "==", false));
const finishedTodos = query(colRefTodos, where("finished", "==", true));
var currentTodos = finishedTodos;
const docRefConfig = doc(db, "system/config");

type TypeTodo = {
  __id: string;
  text: string;
};

type TypeTodoState = {
  todos: TypeTodo[];
  config: {
    env: string;
    projectID: string;
  };
};

const useStore = defineStore("todo", {
  state: () =>
    ({
      todos: [],
      config: {
        env: "",
        projectID: "",
      },
    } as TypeTodoState),
  actions: {
    bindRef(name: keyof TypeTodoState, ref: FirestoreReference) {
      bind(this, name, ref);
    },
    init() {
      bind(this, "config", docRefConfig);
      bind(this, "todos", currentTodos);
    },
  },
});

const useCounterStore = defineStore("counter", {
  state: () => ({
    rowCount: 0,
  }),
  actions: {
    increment() {
      this.rowCount++;
    },
  },
  getters: {
    count: (state) => {
      return state.rowCount;
    },
  },
});

export default defineComponent({
  name: "App",
  setup() {
    const counter = useCounterStore();
    const count = computed(() => {
      return counter.count;
    });
    var newTodoText = ref("");
    const store = useStore();
    const todos = computed(() => {
      return store.todos;
    });
    const config = computed(() => {
      return store.config;
    });
    const addTodo = () => {
      console.log("addTodo", newTodoText);
      if (newTodoText.value) {
        addDoc(colRefTodos, {
          finished: false,
          text: newTodoText.value,
          create: serverTimestamp(),
        });
        newTodoText.value = "";
      }
    };
    const updateTodoText = (todo: TypeTodo, event: Event) => {
      if (event.target instanceof HTMLInputElement) {
        updateDoc(doc(db, "todos/" + todo.__id), { text: event.target.value });
      }
    };
    const removeTodo = (todo: TypeTodo) => {
      console.log(todo);
      deleteDoc(doc(db, "todos/" + todo.__id));
    };
    const toggleTodos = () => {
      currentTodos =
        currentTodos === unFinishedTodos ? finishedTodos : unFinishedTodos;
      store.bindRef("todos", currentTodos);
      console.log(store.$state);
      counter.increment();
    };
    store.init();
    return {
      newTodoText,
      todos,
      config,
      addTodo,
      updateTodoText,
      removeTodo,
      toggleTodos,
      count,
      counter,
    };
  },
});
</script>
