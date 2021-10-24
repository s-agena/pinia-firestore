<template>
  <div>
    <button @click="increment">increment</button> <br />
    <p>count: {{ counter.count }}</p>
    <Todos />
  </div>
</template>

<script setup lang="ts">
import Todos from "./components/Todos.vue";
import { useCounterStore } from "./stores/counter";
const counter = useCounterStore();
const increment = () => {
  counter.increment();
};
</script>
