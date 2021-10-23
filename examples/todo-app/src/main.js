import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { createPiniaFirestore } from '../../../dist/pinia-firestore'

createApp(App).use(createPinia()).use(createPiniaFirestore({
  debug: true
})).mount('#app')