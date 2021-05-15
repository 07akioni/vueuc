import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import {
  VlDemo1,
  VlDemo2
} from '../virtual-list/demo'
import ResizeObserverDemo from '../resize-observer/demo'
import BinderDemo from '../binder/demo'
import XScrollDemo from '../x-scroll/demo'
import OverflowDemo from '../overflow/demo'
import App from './App'

const routes = [
  {
    path: '/virtual-list-1',
    component: VlDemo1
  },
  {
    path: '/virtual-list-2',
    component: VlDemo2
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
