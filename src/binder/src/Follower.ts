/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { h, defineComponent, inject, PropType, nextTick, watch, toRef, ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useMemo, useIsMounted } from 'vooks'
import { BinderInstance, Placement } from './interface'
import { getSlot } from '../../shared/v-node'
import LazyTeleport from '../../lazy-teleport/index'
import {
  getProperPlacementOfFollower,
  getProperTransformOrigin,
  getStyle
} from './get-placement-style'
import { getPointRect, getRect, getScrollParent } from './utils'

export default defineComponent({
  name: 'Follower',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    enabled: {
      type: Boolean,
      default: undefined
    },
    placement: {
      type: String as PropType<Placement>,
      default: 'bottom'
    },
    position: {
      type: String as PropType<'absolute' | 'fixed'>,
      default: 'fixed'
    },
    syncTrigger: {
      type: Array as PropType<Array<'scroll' | 'resize'>>,
      default: ['resize']
    },
    to: {
      type: [String, Object] as PropType<string | HTMLElement>,
      default: undefined
    },
    flip: {
      type: Boolean,
      default: true
    },
    x: {
      type: Number,
      default: undefined
    },
    y: {
      type: Number,
      default: undefined
    },
    width: {
      type: String as PropType<'target' | string>,
      default: undefined
    }
  },
  setup (props) {
    const VBinder = inject<BinderInstance>('VBinder')!
    const mergedEnabledRef = useMemo(() => {
      return props.enabled !== undefined ? props.enabled : props.show
    })
    const followerRef = ref<HTMLElement | null>(null)
    const offsetContainerRef = ref<HTMLElement | null>(null)
    const ensureListeners = (): void => {
      const {
        syncTrigger
      } = props
      if (syncTrigger.includes('scroll')) {
        VBinder.addScrollListener(syncPosition)
      }
      if (syncTrigger.includes('resize')) {
        VBinder.addResizeListener(syncPosition)
      }
    }
    const removeListeners = (): void => {
      VBinder.removeScrollListener(syncPosition)
      VBinder.removeResizeListener(syncPosition)
    }
    onMounted(() => {
      if (mergedEnabledRef.value) {
        syncPosition()
        ensureListeners()
      }
    })
    onBeforeUnmount(() => {
      removeListeners()
    })
    const syncPosition = (): void => {
      if (!mergedEnabledRef.value) {
        return
      }
      const target = VBinder.targetRef!
      const follower = followerRef.value!
      follower.style.position = 'absolute'
      follower.style.zIndex = 'auto'
      const { x, y } = props
      const targetRect = (x !== undefined && y !== undefined)
        ? getPointRect(x, y)
        : getRect(target)
      const { width, placement, flip } = props
      if (width === 'target') {
        follower.style.width = `${targetRect.width}px`
      } else if (width !== undefined) {
        follower.style.width = width
      } else {
        follower.style.width = ''
      }
      const followerRect = getRect(follower)
      const offsetContainerRect = getRect(offsetContainerRef.value!)
      const properPlacement = getProperPlacementOfFollower(
        placement,
        targetRect,
        followerRect,
        flip
      )
      const properTransformOrigin = getProperTransformOrigin(properPlacement)
      const positionStyle = getStyle(properPlacement, offsetContainerRect, targetRect)

      ;['top', 'right', 'left', 'bottom', 'transform'].forEach(prop => {
        follower.style[prop as any] = ''
      })
      Object.keys(positionStyle).forEach((key) => {
        (follower.style as any)[key] = (positionStyle as any)[key]
      })
      follower.style.transformOrigin = properTransformOrigin
    }
    watch(mergedEnabledRef, (value) => {
      if (value) {
        ensureListeners()
        nextTick()
          .then(syncPosition)
          .catch(e => console.error(e))
      } else {
        removeListeners()
      }
    })
    const syncOnNextTick = (): void => {
      nextTick()
        .then(syncPosition)
        .catch(e => console.error(e))
    }
    ;['placement', 'x', 'y', 'flip', 'width']
      .forEach((prop) => {
        watch(toRef(props, prop as any), syncPosition)
      })
    ;['position']
      .forEach((prop) => {
        watch(toRef(props, prop as any), syncOnNextTick)
      })
    watch(toRef(props, 'syncTrigger'), (value) => {
      if (!value.includes('resize')) {
        VBinder.removeResizeListener(syncPosition)
      } else {
        VBinder.addResizeListener(syncPosition)
      }
      if (!value.includes('scroll')) {
        VBinder.removeScrollListener(syncPosition)
      } else {
        VBinder.addScrollListener(syncPosition)
      }
    })
    const offsetContainerStyleRef = computed(() => {
      return props.position === 'fixed' ? {
        zIndex: 'auto',
        pointerEvents: 'none',
        position: props.position,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      } : {
        zIndex: 'auto',
        pointerEvents: 'none',
        position: 'relative'
      }
    })
    const isMountedRef = useIsMounted()
    const mergedToRef = useMemo<string | HTMLElement | undefined>((): HTMLElement | string | undefined => {
      const { to } = props
      if (to !== undefined) return to
      const { position } = props
      if (isMountedRef.value === true && position === 'absolute') {
        const scrollParent = getScrollParent(VBinder.targetRef)
        if (scrollParent === document) return document.body
        if (scrollParent === null) return undefined
        return scrollParent as HTMLElement
      }
      return undefined
    })
    return {
      VBinder,
      mergedEnabled: mergedEnabledRef,
      offsetContainerRef,
      offsetContainerStyle: offsetContainerStyleRef,
      followerRef,
      mergedTo: mergedToRef,
      syncPosition
    }
  },
  render () {
    return h(LazyTeleport, {
      show: this.show,
      to: this.mergedTo
    }, {
      default: () => {
        return h('div', {
          class: 'v-binder-follower-container',
          ref: 'offsetContainerRef',
          style: this.offsetContainerStyle
        }, [
          h('div', {
            class: 'v-binder-follower-content',
            ref: 'followerRef'
          }, [
            getSlot(this.$slots)
          ])
        ])
      }
    })
  }
})
