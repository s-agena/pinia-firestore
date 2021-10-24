<template>
  <div>
    <button @click="increment">increment</button> <br />
    <p>count: {{ counter.count }}</p>
    <Template></Template>
  </div>
</template>

<script setup lang="ts">
import Template from "./components/Template.vue";
import { useCounterStore } from "./stores/counter";
const counter = useCounterStore();
const increment = () => {
  counter.increment();
};
</script>
