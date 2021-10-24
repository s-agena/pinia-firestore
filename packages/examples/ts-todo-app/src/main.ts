import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import { createPiniaFirestore } from "pinia-firestore";

createApp(App)
  .use(createPinia())
  .use(
    createPiniaFirestore({
      debug: false,
    })
  )
  .mount("#app");
