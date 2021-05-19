/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  defineComponent,
  provide,
  ref,
  getCurrentInstance,
  onBeforeUnmount
} from 'vue'
import { beforeNextFrameOnce } from 'seemly'
import { getSlot } from '../../shared/v-node'
import { getScrollParent } from './utils'
import { on, off } from 'evtd'

const Binder = defineComponent({
  name: 'Binder',
  setup () {
    provide('VBinder', getCurrentInstance()?.proxy)
    const targetRef = ref<HTMLElement | null>(null)
    const setTargetRef = (el: HTMLElement | null): void => {
      targetRef.value = el
    }
    // scroll related
    let scrollableNodes: Array<Element | Document> = []
    const ensureScrollListener = (): void => {
      let cursor: Element | Document | null = targetRef.value
      while (true) {
        cursor = getScrollParent(cursor)
        if (cursor === null) break
        scrollableNodes.push(cursor)
      }
      for (const el of scrollableNodes) {
        on('scroll', el, onScroll, true)
      }
    }
    const removeScrollListeners = (): void => {
      for (const el of scrollableNodes) {
        off('scroll', el, onScroll, true)
      }
      scrollableNodes = []
    }
    const followerScrollListeners = new Set<() => void>()
    const addScrollListener = (listener: () => void): void => {
      if (followerScrollListeners.size === 0) {
        ensureScrollListener()
      }
      if (!followerScrollListeners.has(listener)) {
        followerScrollListeners.add(listener)
      }
    }
    const removeScrollListener = (listener: () => void): void => {
      if (followerScrollListeners.has(listener)) {
        followerScrollListeners.delete(listener)
      }
      if (followerScrollListeners.size === 0) {
        removeScrollListeners()
      }
    }
    const onScroll = (): void => {
      beforeNextFrameOnce(onScrollRaf)
    }
    const onScrollRaf = (): void => {
      followerScrollListeners.forEach((listener) => listener())
    }
    // resize related
    const followerResizeListeners = new Set<() => void>()
    const addResizeListener = (listener: () => void): void => {
      if (followerResizeListeners.size === 0) {
        on('resize', window, onResize)
      }
      if (!followerResizeListeners.has(listener)) {
        followerResizeListeners.add(listener)
      }
    }
    const removeResizeListener = (listener: () => void): void => {
      if (followerResizeListeners.has(listener)) {
        followerResizeListeners.delete(listener)
      }
      if (followerResizeListeners.size === 0) {
        off('resize', window, onResize)
      }
    }
    const onResize = (): void => {
      followerResizeListeners.forEach((listener) => listener())
    }
    onBeforeUnmount(() => {
      off('resize', window, onResize)
      removeScrollListeners()
    })
    return {
      targetRef,
      setTargetRef,
      addScrollListener,
      removeScrollListener,
      addResizeListener,
      removeResizeListener
    }
  },
  render () {
    return getSlot(this.$slots)
  }
})

export default Binder
