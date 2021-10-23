<template>
  <button @click="toggleTodos">Toggle todos</button> <br />
  <input v-model.trim="newTodoText" @keyup.enter="addTodo" placeholder="Add new todo" />
  <ul>
    <li v-for="todo, index in todos" v-bind:key="index">
      <input :value="todo.text" @input="updateTodoText(todo, $event.target)" />
      <button @click="removeTodo(todo)">X</button>
    </li>
  </ul>
  <p>config:</p>
  <pre>
    {{ config }}
  </pre>
</template>

<script>
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, collection, query, where, serverTimestamp, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import * as pinifire from '../../../dist/pinia-firestore'
import { computed, ref } from 'vue'

const app = initializeApp({
  projectId: 'agena-repo'
})

const db = getFirestore(app)
const colRefTodos = collection(db, 'todos')
const unFinishedTodos = query(colRefTodos, where('finished', '==', false))
const finishedTodos = query(colRefTodos, where('finished', '==', true))
var currentTodos = finishedTodos
const docRefConfig = doc(db, "system/config")

const useStore = defineStore('todo', {
  state: () => ({
    todos: [],
    config: {},
  }),
  actions: {
    bindRef(name, ref) {
      pinifire.bind(this, name, ref)
    },
    init() {
      pinifire.bind(this, 'config', docRefConfig)
      pinifire.bind(this, 'todos', currentTodos)
    }
  }
})

export default {
  name: 'App',
  setup() {
    var newTodoText = ref('')
    const store = useStore()
    const todos = computed(() => {return store.todos})
    const config = computed(() => {return store.config})
    const addTodo = () => {
      console.log("addTodo", newTodoText)
      if (newTodoText.value) {
        addDoc(colRefTodos, {
          finished: false,
          text: newTodoText.value,
          create: serverTimestamp()
        })
        newTodoText.value = ''
      }
    }
    const updateTodoText = (todo, newText) => {
      updateDoc(doc(db, 'todos/' + todo.id), { text: newText })
    }
    const removeTodo = (todo) => {
      console.log(todo)
      deleteDoc(doc(db, 'todos/' + todo.id))
    }
    const toggleTodos = () => {
      currentTodos = currentTodos === unFinishedTodos ? finishedTodos : unFinishedTodos
      store.bindRef('todos', currentTodos)
    }
    store.init()
    return {
      newTodoText,
      todos,
      config,
      addTodo,
      updateTodoText,
      removeTodo,
      toggleTodos,
    }
  }
}
</script>
