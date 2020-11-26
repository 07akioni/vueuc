/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { h, defineComponent, inject, PropType, nextTick, watch, toRef, ref, onMounted, onBeforeUnmount } from 'vue'
import { useMemo, useIsMounted } from 'vooks'
import { BinderInstance, Placement } from './interface'
import { getSlot } from '../../shared/v-node'
import LazyTeleport from '../../lazy-teleport/src/index'
import {
  getProperPlacementOfFollower,
  getProperTransformOrigin,
  getOffset
} from './get-placement-style'
import { getPointRect, getRect } from './utils'

const offsetContainerStyle = {
  position: 'absolute',
  left: '0',
  right: '0',
  top: '0',
  height: '0',
  pointerEvents: 'none',
  zIndex: 'auto'
}

function setCommonFollowerStyle (follower: HTMLElement): void {
  follower.style.position = 'absolute'
  follower.style.zIndex = 'auto'
  follower.style.pointerEvents = 'all'
}

export default defineComponent({
  name: 'Follower',
  inheritAttrs: false,
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
    syncTrigger: {
      type: Array as PropType<Array<'scroll' | 'resize'>>,
      default: ['resize', 'scroll']
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
    },
    containerClass: {
      type: String,
      default: undefined
    },
    teleportDisabled: {
      type: Boolean,
      default: false
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
      setCommonFollowerStyle(follower)
      const { x, y } = props
      const targetRect = (x !== undefined && y !== undefined)
        ? getPointRect(x, y)
        : getRect(target)
      const { width, placement, flip } = props

      follower.setAttribute('v-placement', placement)
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
      const { left, top, transform } = getOffset(properPlacement, offsetContainerRect, targetRect)

      // we assume that the content size doesn't change after flip,
      // nor we need to make sync logic more complex
      follower.setAttribute('v-placement', properPlacement)
      follower.style.transform = `translateX(${left}) translateY(${top}) ${transform}`
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
    ;['teleportDisabled']
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
    const isMountedRef = useIsMounted()
    const mergedToRef = useMemo<string | HTMLElement | undefined>((): HTMLElement | string | undefined => {
      const { to } = props
      if (to !== undefined) return to
      if (isMountedRef.value) {
        // TODO: find proper container
        return undefined
      }
      return undefined
    })
    return {
      VBinder,
      mergedEnabled: mergedEnabledRef,
      offsetContainerRef,
      followerRef,
      mergedTo: mergedToRef,
      syncPosition
    }
  },
  render () {
    return h(LazyTeleport, {
      show: this.show,
      to: this.mergedTo,
      disabled: this.teleportDisabled
    }, {
      default: () => {
        return h('div', {
          class: [
            'v-binder-follower-container',
            this.containerClass
          ],
          style: offsetContainerStyle,
          ref: 'offsetContainerRef'
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
