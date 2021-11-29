/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  h,
  defineComponent,
  inject,
  PropType,
  nextTick,
  watch,
  toRef,
  ref,
  onMounted,
  onBeforeUnmount,
  withDirectives
} from 'vue'
import { zindexable } from 'vdirs'
import { useMemo, useIsMounted, onFontsReady } from 'vooks'
import { useSsrAdapter } from '@css-render/vue3-ssr'
import { BinderInstance, Placement, FlipLevel } from './interface'
import { c } from '../../shared'
import LazyTeleport from '../../lazy-teleport/src/index'
import {
  getPlacementAndOffsetOfFollower,
  getProperTransformOrigin,
  getOffset
} from './get-placement-style'
import { getPointRect, getRect } from './utils'

const style = c([
  c('.v-binder-follower-container', {
    position: 'absolute',
    left: '0',
    right: '0',
    top: '0',
    height: '0',
    pointerEvents: 'none',
    zIndex: 'auto'
  }),
  c(
    '.v-binder-follower-content',
    {
      position: 'absolute',
      zIndex: 'auto'
    },
    [
      c('> *', {
        pointerEvents: 'all'
      })
    ]
  )
])

export interface FollowerInst {
  syncPosition: () => void
}

export default defineComponent({
  name: 'Follower',
  inheritAttrs: false,
  props: {
    show: Boolean,
    enabled: {
      type: Boolean as PropType<boolean | undefined>,
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
    to: [String, Object] as PropType<string | HTMLElement>,
    flip: {
      type: Boolean,
      default: true
    },
    flipLevel: {
      type: Number as PropType<FlipLevel>,
      default: 1 // do not apply offset by default
    },
    x: Number,
    y: Number,
    width: String as PropType<'target' | string>,
    minWidth: String as PropType<'target' | string>,
    containerClass: String,
    teleportDisabled: Boolean,
    zindexable: {
      type: Boolean,
      default: true
    },
    zIndex: Number,
    overlap: Boolean
  },
  setup (props) {
    const VBinder = inject<BinderInstance>('VBinder')!
    const mergedEnabledRef = useMemo(() => {
      return props.enabled !== undefined ? props.enabled : props.show
    })
    const followerRef = ref<HTMLElement | null>(null)
    const offsetContainerRef = ref<HTMLElement | null>(null)
    const ensureListeners = (): void => {
      const { syncTrigger } = props
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
    const ssrAdapter = useSsrAdapter()
    style.mount({
      id: 'vueuc/binder',
      head: true,
      ssr: ssrAdapter
    })
    onBeforeUnmount(() => {
      removeListeners()
    })
    onFontsReady(() => {
      if (mergedEnabledRef.value) {
        syncPosition()
      }
    })
    const syncPosition = (): void => {
      if (!mergedEnabledRef.value) {
        return
      }
      const follower = followerRef.value
      // sometimes watched props change before its dom is ready
      // for example: show=false, x=undefined, y=undefined
      //              show=true,  x=0,         y=0
      // will cause error
      // I may optimize the watch start point later
      if (follower === null) return
      const target = VBinder.targetRef!
      const { x, y, overlap } = props
      const targetRect =
        x !== undefined && y !== undefined
          ? getPointRect(x, y)
          : getRect(target)
      const { width, minWidth, placement, flipLevel, flip } = props

      follower.setAttribute('v-placement', placement)
      if (overlap) {
        follower.setAttribute('v-overlap', '')
      } else {
        follower.removeAttribute('v-overlap')
      }
      const { style } = follower
      if (width === 'target') {
        style.width = `${targetRect.width}px`
      } else if (width !== undefined) {
        style.width = width
      } else {
        style.width = ''
      }
      if (minWidth === 'target') {
        style.minWidth = `${targetRect.width}px`
      } else if (minWidth !== undefined) {
        style.minWidth = minWidth
      } else {
        style.minWidth = ''
      }
      const followerRect = getRect(follower)
      const offsetContainerRect = getRect(offsetContainerRef.value!)
      const {
        left: offsetLeftToStandardPlacement,
        top: offsetTopToStandardPlacement,
        placement: properPlacement
      } = getPlacementAndOffsetOfFollower(
        placement,
        targetRect,
        followerRect,
        flipLevel,
        flip,
        overlap
      )
      const properTransformOrigin = getProperTransformOrigin(
        properPlacement,
        overlap
      )
      const { left, top, transform } = getOffset(
        properPlacement,
        offsetContainerRect,
        targetRect,
        offsetTopToStandardPlacement,
        offsetLeftToStandardPlacement,
        overlap
      )
      // we assume that the content size doesn't change after flip,
      // nor we need to make sync logic more complex
      follower.setAttribute('v-placement', properPlacement)
      // TODO: add it
      // follower.style.setProperty('--v-offset-left', `${Math.round(offsetLeftToStandardPlacement)}px`)
      // follower.style.setProperty('--v-offset-top', `${Math.round(offsetTopToStandardPlacement)}px`)
      follower.style.transform = `translateX(${left}) translateY(${top}) ${transform}`
      follower.style.transformOrigin = properTransformOrigin
    }
    watch(mergedEnabledRef, (value) => {
      if (value) {
        ensureListeners()
        syncOnNextTick()
      } else {
        removeListeners()
      }
    })
    const syncOnNextTick = (): void => {
      nextTick()
        .then(syncPosition)
        .catch((e) => console.error(e))
    };
    (
      ['placement', 'x', 'y', 'flipLevel', 'flip', 'width', 'overlap', 'minWidth'] as const
    ).forEach((prop) => {
      watch(toRef(props, prop), syncPosition)
    });
    (['teleportDisabled'] as const).forEach((prop) => {
      watch(toRef(props, prop), syncOnNextTick)
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
    const mergedToRef = useMemo<string | HTMLElement | undefined>(():
    | HTMLElement
    | string
    | undefined => {
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
    return h(
      LazyTeleport,
      {
        show: this.show,
        to: this.mergedTo,
        disabled: this.teleportDisabled
      },
      {
        default: () => {
          const vNode = h(
            'div',
            {
              class: ['v-binder-follower-container', this.containerClass],
              ref: 'offsetContainerRef'
            },
            [
              h(
                'div',
                {
                  class: 'v-binder-follower-content',
                  ref: 'followerRef'
                },
                this.$slots
              )
            ]
          )
          if (this.zindexable) {
            return withDirectives(vNode, [
              [
                zindexable,
                {
                  enabled: this.mergedEnabled,
                  zIndex: this.zIndex
                }
              ]
            ])
          }
          return vNode
        }
      }
    )
  }
})
