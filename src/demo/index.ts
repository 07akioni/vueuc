import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import VirtualListDemo from '../virtual-list/demo'
import ResizeObserverDemo from '../resize-observer/demo'
import BinderDemo from '../binder/demo'
import XScrollDemo from '../x-scroll/demo'
import OverflowDemo from '../overflow/demo'
import App from './App'

const routes = [
  {
    path: '/virtual-list',
    component: VirtualListDemo
  },
  {
    path: '/resize-observer',
    component: ResizeObserverDemo
  },
  {
    path: '/binder',
    component: BinderDemo
  },
  {
    path: '/x-scroll',
    component: XScrollDemo
  },
  {
    path: '/overflow',
    component: OverflowDemo
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)

app.use(router)

app.mount('#app')
