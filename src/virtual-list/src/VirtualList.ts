/* eslint-disable no-void */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import {
  mergeProps,
  computed,
  defineComponent,
  PropType,
  ref,
  onMounted,
  h,
  onBeforeMount,
  CSSProperties,
  nextTick
} from 'vue'
import { depx, pxfy } from 'seemly'
import { ItemData, VScrollToOptions } from './type'
import { nextFrame, c, FinweckTree } from '../../shared'
import VResizeObserver from '../../resize-observer/src'
import { useMemo } from 'vooks'

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

export interface CommonScrollToOptions {
  behavior?: ScrollBehavior
  debounce?: boolean
}

export interface ScrollTo {
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
    // it is suppose to be the min height
    itemSize: {
      type: Number,
      required: true
    },
    itemResizable: {
      type: Boolean,
      default: false
    },
    onScroll: Function as PropType<(event: Event) => any>,
    onResize: Function as PropType<(entry: ResizeObserverEntry) => any>,
    defaultScrollKey: Number,
    defaultScrollIndex: Number,
    keyField: {
      type: String,
      default: 'key'
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
    let rafFlag = false
    const keyIndexMapRef = computed(() => {
      const map = new Map()
      const { keyField } = props
      props.items.forEach((item, index) => {
        map.set(item[keyField], index)
      })
      return map
    })
    const listRef = ref<null | Element>(null)
    const listHeightRef = ref<undefined | number>(undefined)
    const finweckTreeRef = computed(() => new FinweckTree(props.items.length, props.itemSize))
    const finweckTreeUpdateTrigger = ref(0)
    const scrollTopRef = ref(0)
    const startIndexRef = useMemo(() => {
      return Math.max(
        finweckTreeRef.value.getBound(scrollTopRef.value - depx(props.paddingTop)) - 1,
        0
      )
    })
    const viewportItemsRef = computed(() => {
      const { value: listHeight } = listHeightRef
      if (listHeight === undefined) return []
      const { items, itemSize } = props
      const startIndex = startIndexRef.value
      const endIndex = Math.min(startIndex + Math.ceil(listHeight / itemSize + 1), items.length - 1)
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
      const { value: ft } = finweckTreeRef
      const targetTop = ft.sum(index) + depx(props.paddingTop)
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
          const itemSize = ft.get(index)
          if (targetTop + itemSize <= scrollTop + offsetHeight) {
            // do nothing
          } else {
            (listRef.value as HTMLDivElement).scrollTo({
              left: 0,
              top: targetTop + itemSize - offsetHeight,
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
    function handleItemResize (key: string | number, entry: ResizeObserverEntry): void {
      const { value: ft } = finweckTreeRef
      const index = keyIndexMapRef.value.get(key)
      const offset = entry.contentRect.height - ft.get(index)
      if (lastStartIndex !== undefined && index < lastStartIndex) {
        void nextTick(() => {
          listRef.value?.scrollBy(0, offset)
        })
      }
      ft.add(index, offset)
      finweckTreeUpdateTrigger.value++
    }
    function handleListScroll (e: UIEvent): void {
      if (!rafFlag) {
        nextFrame(syncViewport)
        rafFlag = true
      }
      const { onScroll } = props
      if (onScroll !== undefined) onScroll(e)
    }
    function handleListResize (entry: ResizeObserverEntry): void {
      listHeightRef.value = entry.contentRect.height
      const { onResize } = props
      if (onResize !== undefined) onResize(entry)
    }
    let lastStartIndex: number | undefined
    function syncViewport (): void {
      lastStartIndex = startIndexRef.value
      scrollTopRef.value = (listRef.value as Element).scrollTop
      rafFlag = false
    }
    return {
      listHeight: listHeightRef,
      scrollTop: scrollTopRef,
      listStyle: {
        overflow: 'auto'
      },
      itemsStyle: computed<CSSProperties>(() => {
        const { itemResizable } = props
        const height = pxfy(finweckTreeRef.value.sum())
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        finweckTreeUpdateTrigger.value
        return {
          boxSizing: 'content-box',
          height: itemResizable ? '' : height,
          minHeight: itemResizable ? height : '',
          paddingTop: pxfy(props.paddingTop),
          paddingBottom: pxfy(props.paddingBottom)
        }
      }),
      visibleItemsStyle: computed(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        finweckTreeUpdateTrigger.value
        return {
          transform: `translate3d(0, ${pxfy(finweckTreeRef.value.sum(startIndexRef.value))}, 0)`
        }
      }),
      viewportItems: viewportItemsRef,
      listRef,
      itemsRef: ref<null | Element>(null),
      scrollTo,
      handleListResize,
      handleListScroll,
      handleItemResize
    }
  },
  render () {
    const { itemResizable, keyField } = this
    return h(VResizeObserver, {
      onResize: this.handleListResize
    }, {
      default: () => {
        return h('div', mergeProps(
          this.$attrs, {
            class: [
              'v-vl',
              this.showScrollbar && 'v-vl--show-scrollbar'
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
              }, this.viewportItems.map(item => {
                const itemVNode = (this.$slots.default as any)({ item })[0]
                const key = item[keyField]
                if (itemResizable) {
                  return h(VResizeObserver, {
                    key,
                    onResize: (entry: ResizeObserverEntry) => this.handleItemResize(key, entry)
                  }, {
                    default: () => itemVNode
                  })
                }
                itemVNode.key = key
                return itemVNode
              }))
            ])
            : this.$slots.empty?.()
        ])
      }
    })
  }
})
