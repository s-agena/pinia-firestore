import { defineStore } from "pinia";

export const useCounterStore = defineStore({
  id: "counter",
  state: () => ({
    /** @type {number} */
    count: 0,
  }),
  actions: {
    increment() {
      this.count++;
    },
  },
});
