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
  CSSProperties,
  onActivated,
  onDeactivated,
  toRef
} from 'vue'
import { beforeNextFrameOnce, depx, pxfy } from 'seemly'
import { useMemo } from 'vooks'
import { useSsrAdapter } from '@css-render/vue3-ssr'
import VResizeObserver from '../../resize-observer/src/VResizeObserver'
import { c, cssrAnchorMetaName, FinweckTree } from '../../shared'
import {
  ItemData,
  VScrollToOptions,
  VVirtualListColumn,
  VVirtualListRenderCol,
  VVirtualListRenderItemWithCols
} from './type'
import { ensureMaybeTouch, ensureWheelScale } from './config'
import { setupXScroll } from './xScroll'
import { VirtualListRow } from './VirtualListRow'

const styles = c(
  '.v-vl',
  {
    maxHeight: 'inherit',
    height: '100%',
    overflow: 'auto',
    minWidth: '1px' // a zero width container won't be scrollable
  },
  [
    c(
      '&:not(.v-vl--show-scrollbar)',
      {
        scrollbarWidth: 'none'
      },
      [
        c(
          '&::-webkit-scrollbar, &::-webkit-scrollbar-track-piece, &::-webkit-scrollbar-thumb',
          {
            width: 0,
            height: 0,
            display: 'none'
          }
        )
      ]
    )
  ]
)

export interface CommonScrollToOptions {
  behavior?: ScrollBehavior
  debounce?: boolean
}

export interface ScrollTo {
  (x: number, y: number): void
  (options: { left?: number, top?: number } & CommonScrollToOptions): void
  (options: { index: number } & CommonScrollToOptions): void
  (options: { key: string | number } & CommonScrollToOptions): void
  (options: { position: 'top' | 'bottom' } & CommonScrollToOptions): void
  (options: VScrollToOptions): void
}
export interface VirtualListInst {
  listElRef: HTMLElement
  itemsElRef: HTMLElement | null
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
    columns: {
      type: Array as PropType<VVirtualListColumn[]>,
      default: () => []
    },
    renderCol: Function as PropType<VVirtualListRenderCol>,
    renderItemWithCols: Function as PropType<VVirtualListRenderItemWithCols>,
    items: {
      type: Array as PropType<ItemData[]>,
      default: () => []
    },
    // it is suppose to be the min height
    itemSize: {
      type: Number,
      required: true
    },
    itemResizable: Boolean,
    itemsStyle: [String, Object] as PropType<string | CSSProperties>,
    visibleItemsTag: {
      type: [String, Object] as PropType<string | object>,
      default: 'div'
    },
    visibleItemsProps: Object,
    ignoreItemResize: Boolean,
    onScroll: Function as PropType<(event: Event) => void>,
    onWheel: Function as PropType<(event: WheelEvent) => void>,
    onResize: Function as PropType<(entry: ResizeObserverEntry) => void>,
    defaultScrollKey: [Number, String],
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
    const ssrAdapter = useSsrAdapter()
    styles.mount({
      id: 'vueuc/virtual-list',
      head: true,
      anchorMetaName: cssrAnchorMetaName,
      ssr: ssrAdapter
    })
    onMounted(() => {
      const { defaultScrollIndex, defaultScrollKey } = props
      if (defaultScrollIndex !== undefined && defaultScrollIndex !== null) {
        scrollTo({ index: defaultScrollIndex })
      } else if (defaultScrollKey !== undefined && defaultScrollKey !== null) {
        scrollTo({ key: defaultScrollKey })
      }
    })
    let isDeactivated = false
    let activateStateInitialized = false
    onActivated(() => {
      isDeactivated = false
      if (!activateStateInitialized) {
        activateStateInitialized = true
        return
      }
      // remount
      scrollTo({ top: scrollTopRef.value, left: scrollLeftRef.value })
    })
    onDeactivated(() => {
      isDeactivated = true
      if (!activateStateInitialized) {
        activateStateInitialized = true
      }
    })
    const totalWidthRef = useMemo(() => {
      if (props.renderCol == null && props.renderItemWithCols == null) {
        return undefined
      }
      if (props.columns.length === 0) return undefined
      let width = 0
      props.columns.forEach((column) => {
        width += column.width
      })
      return width
    })
    const keyIndexMapRef = computed(() => {
      const map = new Map()
      const { keyField } = props
      props.items.forEach((item, index) => {
        map.set(item[keyField], index)
      })
      return map
    })
    const { scrollLeftRef, listWidthRef } = setupXScroll({
      columnsRef: toRef(props, 'columns'),
      renderColRef: toRef(props, 'renderCol'),
      renderItemWithColsRef: toRef(props, 'renderItemWithCols')
    })
    const listElRef = ref<null | HTMLElement>(null)
    const listHeightRef = ref<undefined | number>(undefined)
    const keyToHeightOffset = new Map<string | number, number>()
    const finweckTreeRef = computed(() => {
      const { items, itemSize, keyField } = props
      const ft = new FinweckTree(items.length, itemSize)
      items.forEach((item, index) => {
        const key: string | number = item[keyField]
        const heightOffset = keyToHeightOffset.get(key)
        if (heightOffset !== undefined) {
          ft.add(index, heightOffset)
        }
      })
      return ft
    })
    const finweckTreeUpdateTrigger = ref(0)
    const scrollTopRef = ref(0)
    const startIndexRef = useMemo(() => {
      return Math.max(
        finweckTreeRef.value.getBound(
          scrollTopRef.value - depx(props.paddingTop)
        ) - 1,
        0
      )
    })
    const viewportItemsRef = computed(() => {
      const { value: listHeight } = listHeightRef
      if (listHeight === undefined) return []
      const { items, itemSize } = props
      const startIndex = startIndexRef.value
      const endIndex = Math.min(
        startIndex + Math.ceil(listHeight / itemSize + 1),
        items.length - 1
      )
      const viewportItems: ItemData[] = []
      for (let i = startIndex; i <= endIndex; ++i) {
        viewportItems.push(items[i])
      }
      return viewportItems
    })
    const scrollTo: ScrollTo = (
      options: VScrollToOptions | number,
      y?: number
    ): void => {
      if (typeof options === 'number') {
        scrollToPosition(options, y, 'auto')
        return
      }
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
    let anchorIndex: number | undefined
    let anchorTimerId: number | null = null
    function scrollToIndex (
      index: number,
      behavior: ScrollToOptions['behavior'],
      debounce: boolean
    ): void {
      const { value: ft } = finweckTreeRef
      const targetTop = ft.sum(index) + depx(props.paddingTop)
      if (!debounce) {
        (listElRef.value as HTMLDivElement).scrollTo({
          left: 0,
          top: targetTop,
          behavior
        })
      } else {
        anchorIndex = index
        if (anchorTimerId !== null) {
          window.clearTimeout(anchorTimerId)
        }
        anchorTimerId = window.setTimeout(() => {
          anchorIndex = undefined
          anchorTimerId = null
        }, 16) // use 0 ms may be ealier than resize callback...
        const { scrollTop, offsetHeight } = listElRef.value as HTMLDivElement
        if (targetTop > scrollTop) {
          const itemSize = ft.get(index)
          if (targetTop + itemSize <= scrollTop + offsetHeight) {
            // do nothing
          } else {
            (listElRef.value as HTMLDivElement).scrollTo({
              left: 0,
              top: targetTop + itemSize - offsetHeight,
              behavior
            })
          }
        } else {
          (listElRef.value as HTMLDivElement).scrollTo({
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
      (listElRef.value as HTMLDivElement).scrollTo({
        left,
        top,
        behavior
      })
    }
    function handleItemResize (
      key: string | number,
      entry: ResizeObserverEntry
    ): void {
      if (isDeactivated) return
      if (props.ignoreItemResize) return
      if (isHideByVShow(entry.target as HTMLElement)) return
      const { value: ft } = finweckTreeRef
      const index = keyIndexMapRef.value.get(key)
      const previousHeight = ft.get(index)
      const height =
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
      if (height === previousHeight) return
      // height offset based on itemSize
      // used when rebuild the finweck tree
      const offset = height - props.itemSize
      if (offset === 0) {
        keyToHeightOffset.delete(key)
      } else {
        keyToHeightOffset.set(key, height - props.itemSize)
      }
      // delta height based on finweck tree data
      const delta = height - previousHeight
      if (delta === 0) return
      ft.add(index, delta)
      const listEl = listElRef.value
      if (listEl != null) {
        if (anchorIndex === undefined) {
          const previousHeightSum = ft.sum(index)
          if (listEl.scrollTop > previousHeightSum) {
            listEl.scrollBy(0, delta)
          }
        } else {
          if (index < anchorIndex) {
            listEl.scrollBy(0, delta)
          } else if (index === anchorIndex) {
            const previousHeightSum = ft.sum(index)
            if (
              height + previousHeightSum >
              // Note, listEl shouldn't have border, nor offsetHeight won't be
              // correct
              listEl.scrollTop + listEl.offsetHeight
            ) {
              listEl.scrollBy(0, delta)
            }
          }
        }
        syncViewport()
      }
      finweckTreeUpdateTrigger.value++
    }
    const mayUseWheel = !ensureMaybeTouch()
    let wheelCatched = false
    function handleListScroll (e: UIEvent): void {
      props.onScroll?.(e)
      if (!mayUseWheel || !wheelCatched) {
        syncViewport()
      }
    }
    function handleListWheel (e: WheelEvent): void {
      props.onWheel?.(e)
      if (mayUseWheel) {
        const listEl = listElRef.value
        if (listEl != null) {
          if (e.deltaX === 0) {
            if (listEl.scrollTop === 0 && e.deltaY <= 0) {
              return
            }
            if (
              listEl.scrollTop + listEl.offsetHeight >= listEl.scrollHeight &&
              e.deltaY >= 0
            ) {
              return
            }
          }
          e.preventDefault();
          if (!e.shiftKey) {
            listEl.scrollTop += e.deltaY / ensureWheelScale();
            listEl.scrollLeft += e.deltaX / ensureWheelScale();
          } else {
            listEl.scrollLeft += e.deltaY / ensureWheelScale();
          }
          syncViewport()
          wheelCatched = true
          beforeNextFrameOnce(() => {
            wheelCatched = false
          })
        }
      }
    }
    function handleListResize (entry: ResizeObserverEntry): void {
      if (isDeactivated) return
      // List is HTMLElement
      if (isHideByVShow(entry.target as HTMLElement)) return
      // If height is same, return
      if (props.renderCol == null && props.renderItemWithCols == null) {
        if (entry.contentRect.height === listHeightRef.value) return
      } else {
        if (
          entry.contentRect.height === listHeightRef.value &&
          entry.contentRect.width === listWidthRef.value
        ) { return }
      }
      listHeightRef.value = entry.contentRect.height
      listWidthRef.value = entry.contentRect.width
      const { onResize } = props
      if (onResize !== undefined) onResize(entry)
    }
    function syncViewport (): void {
      const { value: listEl } = listElRef
      // sometime ref el can be null
      // https://github.com/TuSimple/naive-ui/issues/811
      if (listEl == null) return
      scrollTopRef.value = listEl.scrollTop
      scrollLeftRef.value = listEl.scrollLeft
    }
    function isHideByVShow (el: HTMLElement): boolean {
      let cursor: HTMLElement | null = el
      while (cursor !== null) {
        if (cursor.style.display === 'none') return true
        cursor = cursor.parentElement
      }
      return false
    }
    return {
      listHeight: listHeightRef,
      listStyle: {
        overflow: 'auto'
      },
      keyToIndex: keyIndexMapRef,
      itemsStyle: computed(() => {
        const { itemResizable } = props
        const height = pxfy(finweckTreeRef.value.sum())
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        finweckTreeUpdateTrigger.value
        return [
          props.itemsStyle,
          {
            boxSizing: 'content-box',
            width: pxfy(totalWidthRef.value),
            height: itemResizable ? '' : height,
            minHeight: itemResizable ? height : '',
            paddingTop: pxfy(props.paddingTop),
            paddingBottom: pxfy(props.paddingBottom)
          }
        ]
      }),
      visibleItemsStyle: computed(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        finweckTreeUpdateTrigger.value
        return {
          transform: `translateY(${pxfy(
            finweckTreeRef.value.sum(startIndexRef.value)
          )})`
        }
      }),
      viewportItems: viewportItemsRef,
      listElRef,
      itemsElRef: ref<null | Element>(null),
      scrollTo,
      handleListResize,
      handleListScroll,
      handleListWheel,
      handleItemResize
    }
  },
  render () {
    const { itemResizable, keyField, keyToIndex, visibleItemsTag } = this
    return h(
      VResizeObserver,
      {
        onResize: this.handleListResize
      },
      {
        default: () => {
          return h(
            'div',
            mergeProps(this.$attrs, {
              class: ['v-vl', this.showScrollbar && 'v-vl--show-scrollbar'],
              onScroll: this.handleListScroll,
              onWheel: this.handleListWheel,
              ref: 'listElRef'
            }),
            [
              this.items.length !== 0
                ? h(
                  'div',
                  {
                    ref: 'itemsElRef',
                    class: 'v-vl-items',
                    style: this.itemsStyle
                  },
                  [
                    h(
                      visibleItemsTag as any,
                      Object.assign(
                        {
                          class: 'v-vl-visible-items',
                          style: this.visibleItemsStyle
                        },
                        this.visibleItemsProps
                      ),
                      {
                        default: () => {
                          const { renderCol, renderItemWithCols } = this
                          return this.viewportItems.map((item) => {
                            const key = item[keyField]
                            const index = keyToIndex.get(key)
                            const renderedCols =
                                renderCol != null
                                  ? h(VirtualListRow, {
                                    index,
                                    item
                                  })
                                  : undefined
                            const renderedItemWithCols =
                                renderItemWithCols != null
                                  ? h(VirtualListRow, {
                                    index,
                                    item
                                  })
                                  : undefined
                            const itemVNode = (this.$slots.default as any)({
                              item,
                              renderedCols,
                              renderedItemWithCols,
                              index
                            })[0]
                            if (itemResizable) {
                              return h(
                                VResizeObserver,
                                {
                                  key,
                                  onResize: (entry: ResizeObserverEntry) =>
                                    this.handleItemResize(key, entry)
                                },
                                {
                                  default: () => itemVNode
                                }
                              )
                            }
                            itemVNode.key = key
                            return itemVNode
                          })
                        }
                      }
                    )
                  ]
                )
                : this.$slots.empty?.()
            ]
          )
        }
      }
    )
  }
})
