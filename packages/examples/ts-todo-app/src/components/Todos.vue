<template>
  <button @click="toggleTodos">Toggle todos</button> count {{ todos.count
  }}<br />
  <input
    v-model.trim="newTodoText"
    @keyup.enter="addTodo"
    placeholder="Add new todo"
  />
  <ul>
    <li v-for="(todo, index) in todos.todos" v-bind:key="index">
      <input :value="todo.text" @input="updateTodo(todo, $event)" />
      <button @click="removeTodo(todo)">X</button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTodosStore, TypeTodo } from "@/stores/todos";
let newTodoText = ref("");
const todos = useTodosStore();
const addTodo = () => {
  if (newTodoText.value) {
    todos.addTodo(newTodoText.value);
    newTodoText.value = "";
  }
};
const updateTodo = (todo: TypeTodo, event: Event) => {
  if (event.target instanceof HTMLInputElement) {
    todos.updateTodo(todo.__id, event.target.value);
  }
};
const removeTodo = (todo: TypeTodo) => {
  todos.removeTodo(todo.__id);
};
const toggleTodos = () => {
  todos.toggleBind();
};
todos.init();
</script>
