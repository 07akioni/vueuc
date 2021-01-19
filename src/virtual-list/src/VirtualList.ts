/* eslint-disable @typescript-eslint/restrict-plus-operands */
import {
  mergeProps,
  computed,
  defineComponent,
  PropType,
  ref,
  onMounted,
  h,
  renderSlot,
  renderList,
  onBeforeMount
} from 'vue'
import { depx, pxfy } from 'seemly'
import { ItemData, VScrollToOptions } from './type'
import { nextFrame, c } from '../../shared'
import VResizeObserver from '../../resize-observer/src'

const styles = c('.v-vl', {
  overflow: 'auto'
}, [
  c('&:not(.v-vl--show-scrollbar)', {
    scrollbarWidth: 'none'
  }, [
    c('&::-webkit-scrollbar', {
      width: 0,
      height: 0
    })
  ])
])

interface CommonScrollToOptions {
  behavior?: ScrollBehavior
  debounce?: boolean
}

interface ScrollTo {
  (options: { left?: number, top?: number } & CommonScrollToOptions): void
  (options: { index: number } & CommonScrollToOptions): void
  (options: { key: string | number } & CommonScrollToOptions): void
  (options: { position: 'top' | 'bottom' } & CommonScrollToOptions): void
}
export interface VirtualListRef {
  listRef: HTMLElement
  itemsRef: HTMLElement | null
  scrollTo: ScrollTo
}

export default defineComponent({
  name: 'VirtualList',
  inheritAttrs: false,
  props: {
    showScrollbar: {
      type: Boolean,
      default: true
    },
    items: {
      type: Array as PropType<ItemData[]>,
      default: () => []
    },
    itemSize: {
      type: Number,
      required: true
    },
    onScroll: {
      type: Function as PropType<(event: UIEvent) => any>
    },
    onResize: {
      type: Function as PropType<(entry: ResizeObserverEntry) => any>
    },
    defaultScrollKey: {
      type: Number,
      default: undefined
    },
    defaultScrollIndex: {
      type: Number,
      default: undefined
    },
    // Whether it is a good API?
    // ResizeObserver + footer & header is not enough.
    // Too complex for simple case
    paddingTop: {
      type: [Number, String],
      default: 0
    },
    paddingBottom: {
      type: [Number, String],
      default: 0
    }
  },
  setup (props) {
    onBeforeMount(() => {
      styles.mount({
        target: 'vueuc/virtual-list',
        count: false
      })
    })
    onMounted(() => {
      const {
        defaultScrollIndex,
        defaultScrollKey
      } = props
      if (defaultScrollIndex !== undefined && defaultScrollIndex !== null) {
        scrollTo({ index: defaultScrollIndex })
      } else if (defaultScrollKey !== undefined && defaultScrollKey !== null) {
        scrollTo({ key: defaultScrollKey })
      }
    })
    const keyIndexMapRef = computed(() => {
      const map = new Map()
      props.items.forEach((item, index) => {
        map.set(item.key, index)
      })
      return map
    })
    const listRef = ref<null | Element>(null)
    const listHeightRef = ref<undefined | number>(undefined)
    const preparedRef = computed(() => listHeightRef.value !== undefined)
    const scrollTopRef = ref(0)
    const startIndexRef = computed(() => {
      return Math.max(
        Math.floor((scrollTopRef.value - depx(props.paddingTop)) / props.itemSize) - 1,
        0
      )
    })
    const viewportItemsRef = computed(() => {
      if (!preparedRef.value) return []
      const { items, itemSize, paddingTop } = props
      const startIndex = startIndexRef.value
      const endIndex = Math.min(
        startIndex + Math.ceil(
          Math.min(
            listHeightRef.value as number,
            itemSize * items.length + depx(paddingTop) - scrollTopRef.value
          ) / itemSize
        ) + 1,
        items.length - 1
      )
      const viewportItems = []
      for (let i = startIndex; i <= endIndex; ++i) {
        viewportItems.push(items[i])
      }
      return viewportItems
    })
    const scrollTo: ScrollTo = (options: VScrollToOptions): void => {
      const {
        left,
        top,
        index,
        key,
        position,
        behavior,
        debounce = true
      } = options
      if (left !== undefined || top !== undefined) {
        scrollToPosition(left, top, behavior)
      } else if (index !== undefined) {
        scrollToIndex(index, behavior, debounce)
      } else if (key !== undefined) {
        const toIndex = keyIndexMapRef.value.get(key)
        if (toIndex !== undefined) scrollToIndex(toIndex, behavior, debounce)
      } else if (position === 'bottom') {
        scrollToPosition(0, Number.MAX_SAFE_INTEGER, behavior)
      } else if (position === 'top') {
        scrollToPosition(0, 0, behavior)
      }
    }
    function scrollToIndex (index: number, behavior: ScrollToOptions['behavior'], debounce: boolean): void {
      const targetTop = index * props.itemSize + depx(props.paddingTop)
      if (!debounce) {
        (listRef.value as HTMLDivElement).scrollTo({
          left: 0,
          top: targetTop,
          behavior
        })
      } else {
        const {
          scrollTop,
          offsetHeight
        } = listRef.value as HTMLDivElement
        if (targetTop > scrollTop) {
          if (targetTop + props.itemSize <= scrollTop + offsetHeight) {
            // do nothing
          } else {
            (listRef.value as HTMLDivElement).scrollTo({
              left: 0,
              top: targetTop + depx(props.itemSize) - offsetHeight,
              behavior
            })
          }
        } else {
          (listRef.value as HTMLDivElement).scrollTo({
            left: 0,
            top: targetTop,
            behavior
          })
        }
      }
    }
    function scrollToPosition (
      left: number | undefined,
      top: number | undefined,
      behavior: ScrollToOptions['behavior']
    ): void {
      (listRef.value as HTMLDivElement).scrollTo({
        left,
        top,
        behavior
      })
    }
    return {
      listHeight: listHeightRef,
      scrollTop: scrollTopRef,
      listStyle: {
        overflow: 'auto'
      },
      itemsStyle: computed(() => {
        return {
          boxSizing: 'padding-box',
          height: pxfy(props.itemSize * props.items.length),
          paddingTop: pxfy(props.paddingTop),
          paddingBottom: pxfy(props.paddingBottom)
        }
      }),
      visibleItemsStyle: computed(() => {
        return {
          transform: `translate3d(0, ${pxfy(startIndexRef.value * props.itemSize)}, 0)`
        }
      }),
      viewportItems: viewportItemsRef,
      keyIndexMap: keyIndexMapRef,
      listRef,
      itemsRef: ref<null | Element>(null),
      rafFlag: {
        value: false
      },
      scrollTo
    }
  },
  methods: {
    handleListScroll (e: UIEvent) {
      const { rafFlag } = this
      if (!rafFlag.value) {
        nextFrame(this.syncViewport)
        rafFlag.value = true
      }
      const { onScroll } = this
      if (onScroll !== undefined) onScroll(e)
    },
    handleListResize (entry: ResizeObserverEntry) {
      this.listHeight = entry.contentRect.height
      const { onResize } = this
      if (onResize !== undefined) onResize(entry)
    },
    syncViewport () {
      this.scrollTop = (this.listRef as Element).scrollTop
      this.rafFlag.value = false
    }
  },
  render () {
    return h(VResizeObserver, {
      onResize: this.handleListResize
    }, {
      default: () => {
        return h('div', mergeProps(
          this.$attrs, {
            class: [
              'v-vl',
              {
                'v-vl--show-scrollbar': this.showScrollbar
              }
            ],
            onScroll: this.handleListScroll,
            ref: 'listRef'
          }), [
          this.items.length !== 0
            ? h('div', {
              ref: 'itemsRef',
              class: 'v-vl-items',
              style: this.itemsStyle
            }, [
              h('div', {
                class: 'v-vl-visible-items',
                style: this.visibleItemsStyle
              },
              renderList(this.viewportItems, (item, index) => {
                return renderSlot(this.$slots, 'default', { item, index })
              }))
            ])
            : this.$slots.empty?.()
        ])
      }
    })
  }
})
