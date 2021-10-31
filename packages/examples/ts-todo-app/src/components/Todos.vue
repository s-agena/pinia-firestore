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
      <input :value="todo.text" @input="updateTodo(todo.__id, $event)" />
      <button @click="removeTodo(todo.__id)">X</button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTodosStore } from "@/stores/todos";
let newTodoText = ref("");
const todos = useTodosStore();
const addTodo = () => {
  if (newTodoText.value) {
    todos.addTodo(newTodoText.value);
    newTodoText.value = "";
  }
};
const updateTodo = (id: string, event: Event) => {
  if (event.target instanceof HTMLInputElement) {
    todos.updateTodo(id, event.target.value);
  }
};
const removeTodo = (id: string) => {
  todos.removeTodo(id);
};
const toggleTodos = async () => {
  await todos.toggleBind();
  console.log("todos length", todos.todos.length);
};
todos.init();
</script>
