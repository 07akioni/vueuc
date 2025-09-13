import {
  h,
  defineComponent,
  ref,
  Fragment,
  onMounted,
  onBeforeUnmount,
  PropType,
  watch
} from 'vue'
import { createId, getPreciseEventTarget } from 'seemly'
import { on, off } from 'evtd'
import { focusFirstDescendant, focusLastDescendant } from './utils'
import { resolveTo } from '../../shared'

let stack: string[] = []

export const FocusTrap = defineComponent({
  name: 'FocusTrap',
  props: {
    disabled: Boolean,
    active: Boolean,
    autoFocus: {
      type: Boolean,
      default: true
    },
    onEsc: Function as PropType<(e: KeyboardEvent) => void>,
    initialFocusTo: [String, Function] as PropType<string | (() => HTMLElement | undefined | null)>,
    finalFocusTo: [String, Function] as PropType<string | (() => HTMLElement | undefined | null)>,
    returnFocusOnDeactivated: {
      type: Boolean,
      default: true
    }
  },
  setup (props) {
    const id = createId()
    const focusableStartRef = ref<HTMLElement | null>(null)
    const focusableEndRef = ref<HTMLElement | null>(null)
    let activated = false
    let ignoreInternalFocusChange = false
    const lastFocusedElement: Element | null = typeof document === 'undefined' ? null : document.activeElement

    function isCurrentActive (): boolean {
      const currentActiveId = stack[stack.length - 1]
      return currentActiveId === id
    }

    function handleDocumentKeydown (e: KeyboardEvent): void {
      if (e.code === 'Escape') {
        if (isCurrentActive()) {
          props.onEsc?.(e)
        }
      }
    }

    onMounted(() => {
      watch(
        () => props.active,
        (value) => {
          if (value) {
            activate()
            on('keydown', document, handleDocumentKeydown)
          } else {
            off('keydown', document, handleDocumentKeydown)
            if (activated) {
              deactivate()
            }
          }
        },
        {
          immediate: true
        }
      )
    })
    onBeforeUnmount(() => {
      off('keydown', document, handleDocumentKeydown)
      if (activated) deactivate()
    })

    function handleDocumentFocus (e: FocusEvent): void {
      if (ignoreInternalFocusChange) return
      if (isCurrentActive()) {
        const mainEl = getMainEl()
        if (mainEl === null) return
        if (mainEl.contains(getPreciseEventTarget(e) as Node | null)) return
        // I don't handle shift + tab status since it's too tricky to handle
        // Not impossible but I need to sleep
        resetFocusTo('first')
      }
    }

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
    function activate (): void {
      if (props.disabled) return
      stack.push(id)
      if (props.autoFocus) {
        const { initialFocusTo } = props
        if (initialFocusTo === undefined) {
          resetFocusTo('first')
        } else {
          resolveTo(initialFocusTo)?.focus({ preventScroll: true })
        }
      }
      activated = true
      document.addEventListener('focus', handleDocumentFocus, true)
    }
    function deactivate (): void {
      if (props.disabled) return
      document.removeEventListener('focus', handleDocumentFocus, true)
      stack = stack.filter((idInStack) => idInStack !== id)
      if (isCurrentActive()) return
      const { finalFocusTo } = props
      if (finalFocusTo !== undefined) {
        resolveTo(finalFocusTo)?.focus({ preventScroll: true })
      } else if (props.returnFocusOnDeactivated) {
        if (lastFocusedElement instanceof HTMLElement) {
          ignoreInternalFocusChange = true
          lastFocusedElement.focus({ preventScroll: true })
          ignoreInternalFocusChange = false
        }
      }
    }
    function resetFocusTo (target: 'last' | 'first'): void {
      if (!isCurrentActive()) return
      if (props.active) {
        const focusableStartEl = focusableStartRef.value
        const focusableEndEl = focusableEndRef.value
        if (focusableStartEl !== null && focusableEndEl !== null) {
          const mainEl = getMainEl()
          if (mainEl == null || mainEl === focusableEndEl) {
            ignoreInternalFocusChange = true
            focusableStartEl.focus({ preventScroll: true })
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
            focusableStartEl.focus({ preventScroll: true })
            ignoreInternalFocusChange = false
          }
        }
      }
    }
    function handleStartFocus (e: FocusEvent): void {
      if (ignoreInternalFocusChange) return
      const mainEl = getMainEl()
      if (mainEl === null) return
      if (e.relatedTarget !== null && mainEl.contains(e.relatedTarget as any)) {
        // if it comes from inner, focus last
        resetFocusTo('last')
      } else {
        // otherwise focus first
        resetFocusTo('first')
      }
    }
    function handleEndFocus (e: FocusEvent): void {
      if (ignoreInternalFocusChange) return
      if (
        e.relatedTarget !== null &&
        e.relatedTarget === focusableStartRef.value
      ) {
        // if it comes from first, focus last
        resetFocusTo('last')
      } else {
        // otherwise focus first
        resetFocusTo('first')
      }
    }
    return {
      focusableStartRef,
      focusableEndRef,
      focusableStyle: 'position: absolute; height: 0; width: 0;',
      handleStartFocus,
      handleEndFocus
    }
  },
  render () {
    const { default: defaultSlot } = this.$slots
    if (defaultSlot === undefined) return null
    if (this.disabled) return defaultSlot()
    const { active, focusableStyle } = this
    return h(Fragment, null, [
      h('div', {
        'aria-hidden': 'true',
        tabindex: active ? '0' : '-1',
        ref: 'focusableStartRef',
        style: focusableStyle,
        onFocus: this.handleStartFocus
      }),
      defaultSlot(),
      h('div', {
        'aria-hidden': 'true',
        style: focusableStyle,
        ref: 'focusableEndRef',
        tabindex: active ? '0' : '-1',
        onFocus: this.handleEndFocus
      })
    ])
  }
})
