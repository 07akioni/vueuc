import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import VirtualListDemo from '../virtual-list/demo'
import ResizeObserverDemo from '../resize-observer/demo'
import App from './App'

const routes = [
  {
    path: '/virtual-list',
    component: VirtualListDemo
  },
  {
    path: '/resize-observer',
    component: ResizeObserverDemo
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)

app.use(router)

app.mount('#app')
