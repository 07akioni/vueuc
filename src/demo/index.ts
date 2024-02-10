import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import {
  VlDemo1,
  VlDemo2,
  VlDemo3,
  VlDemo4
} from '../virtual-list/demo'
import ResizeObserverDemo from '../resize-observer/demo'
import BinderDemo from '../binder/demo'
import XScrollDemo from '../x-scroll/demo'
import OverflowDemo from '../overflow/demo'
import App from './App'
import FocusTrapDemo from '../focus-trap/demo'

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
    path: '/virtual-list-3',
    component: VlDemo3
  },
  {
    path: '/virtual-list-4',
    component: VlDemo4
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
  },
  {
    path: '/focus-trap',
    component: FocusTrapDemo
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)

app.use(router)

app.mount('#app')
