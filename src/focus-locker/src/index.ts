import { h, defineComponent, watchEffect, ref, Fragment, onMounted } from 'vue'
import { createId } from 'seemly'
import { focusFirstDescendant } from './utils'

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
    let onMountedCallback: undefined | (() => void)
    onMounted(() => {
      onMountedCallback?.()
      mounted = true
    })
    watchEffect(() => {
      if (props.active) {
        stack.push(id)
        if (!mounted) {
          onMountedCallback = () => {
            resetFocus()
            activated = true
          }
        } else {
          resetFocus()
          activated = true
        }
      } else if (activated) {
        activated = false
        stack = stack.filter((idInStack) => idInStack !== id)
        if (lastFocusedElement instanceof HTMLElement) {
          lastFocusedElement.focus()
        }
      }
    })
    function resetFocus (): void {
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
          focusFirstDescendant(mainEl)
        }
      }
    }
    return {
      focusableStartRef,
      focusableEndRef,
      focusableStyle: 'position: absolute; height: 0; width: 0;',
      resetFocus
    }
  },
  render () {
    const { default: defaultSlot } = this.$slots
    if (defaultSlot === undefined) return null
    const { active, focusableStyle } = this
    return h(Fragment, null, [
      h('div', {
        tabindex: active ? '0' : '-1',
        ref: 'focusableStartRef',
        style: focusableStyle
      }),
      defaultSlot(),
      h('div', {
        onFocus: this.resetFocus,
        style: focusableStyle,
        ref: 'focusableEndRef',
        tabindex: active ? '0' : '-1'
      })
    ])
  }
})
