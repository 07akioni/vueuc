import {
  h,
  defineComponent,
  watchEffect,
  ref,
  Fragment,
  onMounted,
  onUnmounted
} from 'vue'
import { createId } from 'seemly'
import { focusFirstDescendant, focusLastDescendant } from './utils'

let stack: string[] = []

export const FocusLocker = defineComponent({
  name: 'FocusLocker',
  props: {
    active: Boolean,
    focusFirstDescendant: Boolean
  },
  setup (props) {
    const id = createId()
    const focusableStartRef = ref<HTMLElement | null>(null)
    const focusableEndRef = ref<HTMLElement | null>(null)
    let mounted = false
    let activated = false
    const lastFocusedElement: Element | null = document.activeElement
    let listenToStartFocus = true
    let onMountedCallback: undefined | (() => void)
    onMounted(() => {
      onMountedCallback?.()
      mounted = true
    })
    onUnmounted(() => {
      if (activated) deactivate()
    })
    function deactivate (): void {
      stack = stack.filter((idInStack) => idInStack !== id)
      if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus()
      }
    }
    watchEffect(() => {
      if (props.active) {
        stack.push(id)
        if (!mounted) {
          onMountedCallback = () => {
            resetFocusTo('first')
            activated = true
          }
        } else {
          resetFocusTo('first')
          activated = true
        }
      } else if (activated) {
        deactivate()
      }
    })
    function resetFocusTo (target: 'last' | 'first'): void {
      const currentActiveId = stack[stack.length - 1]
      if (currentActiveId !== id) return
      if (props.active && props.focusFirstDescendant) {
        const focusableStartEl = focusableStartRef.value
        const focusableEndEl = focusableEndRef.value
        if (focusableStartEl !== null && focusableEndEl !== null) {
          let mainEl: ChildNode | null = focusableStartEl
          while (true) {
            mainEl = mainEl.nextSibling
            if (mainEl === null) break
            if (mainEl instanceof Element && mainEl.tagName === 'DIV') {
              break
            }
          }
          if (mainEl == null || mainEl === focusableEndEl) {
            focusableStartEl.focus()
            return
          }
          const focused =
            target === 'first'
              ? focusFirstDescendant(mainEl)
              : focusLastDescendant(mainEl)
          if (!focused) {
            listenToStartFocus = false
            focusableStartEl.focus()
            listenToStartFocus = true
          }
        }
      }
    }
    function handleStartFocus (): void {
      if (listenToStartFocus) {
        resetFocusTo('last')
      }
    }
    return {
      focusableStartRef,
      focusableEndRef,
      focusableStyle: 'position: absolute; height: 0; width: 0;',
      handleStartFocus,
      handleEndFocus: () => resetFocusTo('first')
    }
  },
  render () {
    const { default: defaultSlot } = this.$slots
    if (defaultSlot === undefined) return null
    const { active, focusableStyle } = this
    return h(Fragment, null, [
      h('div', {
        ariaHidden: 'true',
        tabindex: active ? '0' : '-1',
        ref: 'focusableStartRef',
        style: focusableStyle,
        onFocus: this.handleStartFocus
      }),
      defaultSlot(),
      h('div', {
        ariaHidden: 'true',
        style: focusableStyle,
        ref: 'focusableEndRef',
        tabindex: active ? '0' : '-1',
        onFocus: this.handleEndFocus
      })
    ])
  }
})
