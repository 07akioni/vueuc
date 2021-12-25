import {
  h,
  defineComponent,
  watchEffect,
  ref,
  Fragment,
  onMounted,
  onBeforeUnmount
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
    let activated = false
    let ignoreInternalFocusChange = false
    const lastFocusedElement: Element | null = document.activeElement

    // I can't use onMounted in watchEffect
    onMounted(() => {
      watchEffect(() => {
        if (props.active) {
          stack.push(id)
          resetFocusTo('first')
          activated = true
        } else if (activated) {
          deactivate()
        }
      })
    })
    onBeforeUnmount(() => {
      if (activated) deactivate()
    })
    function getMainEl (): ChildNode | null {
      const focusableStartEl = focusableStartRef.value
      if (focusableStartEl === null) return null
      let mainEl: ChildNode | null = focusableStartEl
      while (true) {
        mainEl = mainEl.nextSibling
        if (mainEl === null) break
        if (mainEl instanceof Element && mainEl.tagName === 'DIV') {
          break
        }
      }
      return mainEl
    }
    function deactivate (): void {
      stack = stack.filter((idInStack) => idInStack !== id)
      if (lastFocusedElement instanceof HTMLElement) {
        ignoreInternalFocusChange = true
        lastFocusedElement.focus()
        ignoreInternalFocusChange = false
      }
    }
    function resetFocusTo (target: 'last' | 'first'): void {
      const currentActiveId = stack[stack.length - 1]
      if (currentActiveId !== id) return
      if (props.active && props.focusFirstDescendant) {
        const focusableStartEl = focusableStartRef.value
        const focusableEndEl = focusableEndRef.value
        if (focusableStartEl !== null && focusableEndEl !== null) {
          const mainEl = getMainEl()
          if (mainEl == null || mainEl === focusableEndEl) {
            ignoreInternalFocusChange = true
            focusableStartEl.focus()
            ignoreInternalFocusChange = false
            return
          }
          ignoreInternalFocusChange = true

          const focused =
            target === 'first'
              ? focusFirstDescendant(mainEl)
              : focusLastDescendant(mainEl)
          ignoreInternalFocusChange = false
          if (!focused) {
            ignoreInternalFocusChange = true
            focusableStartEl.focus()
            ignoreInternalFocusChange = false
          }
        }
      }
    }
    function handleStartFocus (): void {
      if (ignoreInternalFocusChange) return
      resetFocusTo('last')
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
