/* eslint-disable no-void */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import {
  mergeProps,
  computed,
  defineComponent,
  ref,
  onMounted,
  h,
  onActivated,
  watch,
  nextTick
} from 'vue'
import type { PropType, CSSProperties } from 'vue'
import { pxfy, beforeNextFrameOnce } from 'seemly'
import { useMemo } from 'vooks'
import type { ItemData, VScrollToOptions } from './type'
import { c, cssrAnchorMetaName, FinweckTree } from '../../shared'
import VResizeObserver from '../../resize-observer/src'
import { useSsrAdapter } from '@css-render/vue3-ssr'
import { frameMotion } from '../../frame-motion'
import type { FrameMotionUserControls } from '../../frame-motion'

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
  (options: { left?: number, top?: number } & CommonScrollToOptions): void
  (options: { index: number } & CommonScrollToOptions): void
  (options: { key: string | number } & CommonScrollToOptions): void
  (options: { position: 'top' | 'bottom' } & CommonScrollToOptions): void
}
export interface VirtualListInst {
  listElRef: HTMLElement
  itemsElRef: HTMLElement | null
  scrollTo: ScrollTo
}

type ItemKey = string | number

interface RenderedItem {
  key: ItemKey
  index: number
  original: ItemData
}

function isHideByVShow (el: HTMLElement): boolean {
  let cursor: HTMLElement | null = el
  while (cursor !== null) {
    if (cursor.style.display === 'none') return true
    cursor = cursor.parentElement
  }
  return false
}

function cacheResultFunction<T extends (key: any) => any> (fn: T): T {
  const cache = new Map()
  return ((key) => {
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(key)
    cache.set(key, result)
    return result
  }) as T
}

const preReservation = 1
const postReservation = 4

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

    const resizeableRef = computed(
      () => props.itemResizable && !props.ignoreItemResize
    )

    const listElRef = ref<null | Element>(null)
    const listHeightRef = computed(() => {
      const height = props.items.length * props.itemSize
      if (!resizeableRef.value) {
        return height
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      finweckTreeUpdateTrigger.value
      return height + offsetFinweckTreeRef.value.sum()
    })

    const scrollTopRef = ref(0)
    const viewportHeightRef = ref(0)
    const getViewportRect = (): {
      height: number
      top: number
      bottom: number
    } => {
      const { value: height } = viewportHeightRef
      const { value: top } = scrollTopRef
      return {
        height,
        top,
        bottom: top + height
      }
    }

    const finweckTreeUpdateTrigger = ref(0)
    const offsetFinweckTreeRef = computed(() => {
      return new FinweckTree(resizeableRef.value ? props.items.length : 0)
    })

    const renderedItemsRef = ref<RenderedItem[]>([])
    const renderedItemIndexMap = new Map<ItemKey, number>()
    const renderedItemOffsetMap = new Map<ItemKey, number>()
    const setItemOffset = (key: ItemKey, offset: number): void => {
      const perviousOffset = renderedItemOffsetMap.get(key)
      if (perviousOffset !== offset) {
        const index = getIndex(key)
        if (validateIndex(index)) {
          renderedItemOffsetMap.set(key, offset)

          offsetFinweckTreeRef.value.update(index, offset)
          finweckTreeUpdateTrigger.value++
        }
      }
    }

    const validateIndex = (index?: number): boolean => {
      return index !== undefined || index !== -1 || index < props.items.length
    }

    const getIndex = (key: ItemKey): number => {
      let index = renderedItemIndexMap.get(key)

      if (index === undefined) {
        const { keyField } = props
        index = props.items.findIndex((item) => item[keyField] === key)
        if (index === -1) {
          return -1
        }
        renderedItemIndexMap.set(key, index)
      }

      return index
    }

    const getHeight = (index: number): number => {
      const { itemSize } = props
      if (!resizeableRef.value) {
        return itemSize
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      finweckTreeUpdateTrigger.value
      return itemSize + offsetFinweckTreeRef.value.get(index)
    }

    const getPosition = (index: number): number => {
      if (index === 0) return 0
      const position = index * props.itemSize
      if (!resizeableRef.value) {
        return position
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      finweckTreeUpdateTrigger.value
      return (
        position +
        offsetFinweckTreeRef.value.sum(Math.min(index, props.items.length))
      )
    }

    const getRelativeIndex = (scrollTop: number): number =>
      Math.round(scrollTop / props.itemSize)

    const getNewestVisibleIndex = (
      scrollTop: number,
      getItemHeight = getHeight
    ): number => {
      const relativeIndex = getRelativeIndex(scrollTop)
      if (!resizeableRef.value) {
        return relativeIndex
      } else {
        return measureNewestVisibleIndex(
          scrollTop,
          relativeIndex,
          getItemHeight
        )
      }
    }

    const measureNewestVisibleIndex = (
      scrollTop: number,
      relativeIndex: number,
      getItemHeight = getHeight
    ): number => {
      if (!resizeableRef.value) {
        return Math.round(scrollTop / props.itemSize)
      } else {
        const { items } = props
        let newestVisibleIndex = relativeIndex
        let startPosition = getPosition(newestVisibleIndex)

        const shouldBackwards = startPosition > scrollTop
        if (shouldBackwards) {
          while (startPosition > scrollTop && newestVisibleIndex > 0) {
            /**
             *      ┏━ ━━ ━┓
             *        ┌──┐
             *      ┃ │  │ ┃
             *        └──┘
             *      ┗━ ━━ ━┛
             */
            newestVisibleIndex--
            startPosition -= getItemHeight(newestVisibleIndex)
          }
        } else {
          const { length } = items
          while (startPosition < scrollTop && newestVisibleIndex < length - 1) {
            /**
             *        ┌──┐
             *      ┏━│━━│━┓
             *        └──┘
             *      ┃      ┃
             *
             *      ┗━ ━━ ━┛
             */
            newestVisibleIndex++
            startPosition += getItemHeight(newestVisibleIndex)
          }

          if (startPosition > scrollTop && newestVisibleIndex > 0) {
            /**
             *      ┏━ ━━ ━┓
             *        ┌──┐
             *      ┃ │  │ ┃
             *        └──┘
             *      ┗━ ━━ ━┛
             */
            newestVisibleIndex--
          }
        }

        return newestVisibleIndex
      }
    }

    const getRenderCandidates = (newestVisibleIdx: number): RenderedItem[] => {
      let startIdx = newestVisibleIdx
      let endIdx
      // The heights of all items are known and equal, which newestVisibleIndex === startIndex
      if (!resizeableRef.value) {
        endIdx =
          newestVisibleIdx +
          Math.round(viewportHeightRef.value / props.itemSize)
      } else {
        // There is a dynamically changing height, which may be newestVisibleIndex !== startIndex
        // Need to further calculate the position of startIndex
        const { items } = props
        const { length } = items
        const { top, bottom } = getViewportRect()

        // avoid repeated runs
        const getItemHeight = cacheResultFunction(getHeight)

        startIdx = measureNewestVisibleIndex(
          top,
          newestVisibleIdx,
          getItemHeight
        )
        endIdx = startIdx

        let endPosition = getPosition(startIdx)
        while (endPosition < bottom && endIdx < length - 1) {
          /**
           *      ┏━ ━━ ━┓
           *
           *      ┃      ┃
           *        ┌──┐
           *      ┗━│━━│━┛
           *        └──┘
           */
          endIdx++
          endPosition += getItemHeight(endIdx)
        }
      }

      startIdx = Math.max(0, startIdx - preReservation)
      endIdx += postReservation

      const { items, keyField } = props
      return items
        .slice(startIdx, endIdx)
        .reduce<RenderedItem[]>((candidates, item, index) => {
        candidates.push({
          index: index + startIdx,
          key: item[keyField],
          original: item
        })
        return candidates
      }, [])
    }

    const newestVisibleIndexRef = useMemo(() =>
      Math.round(scrollTopRef.value / props.itemSize)
    )

    const getFinalRenderedItemsMemoized = (): RenderedItem[] => {
      const renderedItems = getRenderCandidates(newestVisibleIndexRef.value)
      const { keyField } = props
      renderedItems.forEach((item) => {
        renderedItemIndexMap.set(item.original[keyField], item.index)
      })
      return renderedItems
    }

    watch(getFinalRenderedItemsMemoized, (finalRenderedItems) => {
      const { value: renderedItems } = renderedItemsRef
      if (
        renderedItems.length !== finalRenderedItems.length ||
        renderedItems.some((item, index) => {
          return (
            item.key !== finalRenderedItems[index].key ||
            item.index !== finalRenderedItems[index].index
          )
        })
      ) {
        renderedItemsRef.value = finalRenderedItems
      }
    })

    // Scroll
    const startIndexRef = useMemo(() => renderedItemsRef.value[0]?.index ?? -1)
    const itemsPositionRef = computed(() => {
      const { value: startIndex } = startIndexRef
      if (!validateIndex(startIndex)) {
        return 0
      }
      const position = startIndex * props.itemSize
      if (!resizeableRef.value) {
        return position
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      finweckTreeUpdateTrigger.value
      return position + offsetFinweckTreeRef.value.sum(startIndex)
    })

    const handleListScroll = (e: Event): void => {
      beforeNextFrameOnce(syncViewport)
      props.onScroll?.(e)

      if (shouldPositionedTo !== null) {
        shouldPositionedTo = null
      }
    }

    const syncViewport = (): void => {
      const { value: listEl } = listElRef
      // sometime ref el can be null
      // https://github.com/TuSimple/naive-ui/issues/811
      if (listEl !== null) {
        scrollTopRef.value = (listEl as HTMLElement).scrollTop
      }
    }

    // Resize
    const handleItemResize = (
      key: ItemKey,
      entry: ResizeObserverEntry
    ): void => {
      if (isHideByVShow(entry.target as HTMLElement)) {
        return
      }
      const shouldMeasurePositioned = shouldPositionedTo !== null

      const height = entry.borderBoxSize[0].blockSize
      const offset = height - props.itemSize
      const increment = offset - (renderedItemOffsetMap.get(key) ?? 0)

      if (increment !== 0) {
        setItemOffset(key, offset)
      }
      // measure
      if (shouldMeasurePositioned) {
        beforeNextFrameOnce(measurePositionedIndex)
      }
    }

    const handleListResize = (entry: ResizeObserverEntry): void => {
      if (isHideByVShow(entry.target as HTMLElement)) {
        return
      }
      // If height is same, return
      if (entry.contentRect.height === listHeightRef.value) return
      viewportHeightRef.value = entry.contentRect.height
      props.onResize?.(entry)
    }

    watch(offsetFinweckTreeRef, () => {
      renderedItemOffsetMap.forEach((offset, key) => {
        setItemOffset(key, offset)
      })
    })

    watch(
      computed(() => props.itemSize),
      (size, perviousSize) => {
        const sizeOffset = size - perviousSize
        renderedItemOffsetMap.forEach((offset, key) => {
          setItemOffset(key, offset + sizeOffset)
        })
      }
    )

    onActivated(() => {
      scrollTo({ top: scrollTopRef.value })
    })
    onMounted(() => {
      const { defaultScrollIndex, defaultScrollKey } = props
      if (defaultScrollIndex !== undefined && defaultScrollIndex !== null) {
        scrollTo({ index: defaultScrollIndex })
      } else if (defaultScrollKey !== undefined && defaultScrollKey !== null) {
        scrollTo({ key: defaultScrollKey })
      }
    })

    // Scroll Methods
    let scrollFrame: FrameMotionUserControls | null = null
    let shouldPositionedTo: { index: number, debounce?: boolean } | null = null

    const measurePositionedIndex = (): void => {
      if (shouldPositionedTo === null) {
        return
      }
      const { index, debounce } = shouldPositionedTo
      shouldPositionedTo = null

      const newestVisibleIndex = getNewestVisibleIndex(scrollTopRef.value)
      if (
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        debounce &&
        index >= newestVisibleIndex &&
        getPosition(Math.min(props.items.length, index + 1)) <=
          scrollTopRef.value + viewportHeightRef.value
      ) {
        // If debounce is true, just need it in the viewport
        return
      }
      if (index !== newestVisibleIndex) {
        scrollToIndex(index, 'auto', debounce)
      }
    }

    const scrollTo: ScrollTo = (options: VScrollToOptions): void => {
      const {
        left,
        top,
        index,
        key,
        position,
        behavior,
        debounce = false
      } = options
      if (left !== undefined || top !== undefined) {
        scrollToPosition({
          left,
          top,
          behavior
        })
      } else if (index !== undefined) {
        scrollToIndex(index, behavior, debounce)
      } else if (key !== undefined) {
        scrollToKey(key, behavior, debounce)
      } else if (position === 'bottom') {
        scrollToPosition({
          top: listHeightRef.value,
          left: 0,
          behavior
        })
      } else if (position === 'top') {
        scrollToPosition({
          top: 0,
          left: 0,
          behavior
        })
      }
    }

    const scrollToKey = (
      key: ItemKey,
      behavior?: ScrollBehavior,
      debounce?: boolean
    ): void => {
      scrollToIndex(getIndex(key), behavior, debounce)
    }

    const scrollToIndex = (
      index: number,
      behavior?: ScrollBehavior,
      debounce?: boolean
    ): void => {
      if (!validateIndex(index)) {
        return
      }
      scrollToPosition(
        {
          top: getPosition(index),
          left: 0,
          behavior
        },
        (): void => {
          resizeableRef.value &&
            requestAnimationFrame(() => {
              // Wait until the scroll event fires before assigning
              shouldPositionedTo = {
                index,
                debounce
              }
              void nextTick(measurePositionedIndex)
            })
        }
      )
    }

    const scrollToPosition = (
      options: ScrollToOptions,
      callback?: Function
    ): void => {
      if (scrollFrame !== null) {
        scrollFrame.stop()
        scrollFrame = null
      }
      shouldPositionedTo = null

      const { value: listEl } = listElRef
      if (listEl === null) {
        return
      }

      const {
        top = listEl.scrollTop,
        left = listEl.scrollLeft,
        behavior = 'auto'
      } = options

      if (behavior === 'auto') {
        listEl.scrollTop = top
        listEl.scrollLeft = left
        callback?.()
      } else {
        const startTop = listEl.scrollTop
        const startLeft = listEl.scrollLeft
        const distanceTop = top - startTop
        const distanceLeft = left - startLeft

        const duration = Math.max(
          Math.min(575, Math.abs(distanceTop) * 1.2),
          16
        )
        const onComplete = (): void => {
          cur === scrollFrame && (scrollFrame = null)
          callback?.()
        }

        const cur = (scrollFrame = frameMotion({
          duration,
          autoplay: true,
          onComplete,
          onUpdate: (progress: number) => {
            if (listEl.scrollTop === top && listEl.scrollLeft === left) {
              cur.stop()
              onComplete()
              return
            }
            listEl.scrollTop = startTop + distanceTop * progress
            listEl.scrollLeft = startLeft + distanceLeft * progress
          }
        }))
      }
    }

    return {
      listStyle: {
        overflow: 'auto'
      },
      itemsStyle: computed(() => {
        const { itemResizable } = props
        const height = pxfy(listHeightRef.value)
        return [
          props.itemsStyle,
          {
            boxSizing: 'content-box',
            height: itemResizable ? '' : height,
            minHeight: itemResizable ? height : '',
            paddingTop: pxfy(props.paddingTop),
            paddingBottom: pxfy(props.paddingBottom)
          }
        ]
      }),
      itemsPosition: itemsPositionRef,
      listElRef,
      itemsElRef: ref<null | Element>(null),
      resizeable: resizeableRef,
      renderedItems: renderedItemsRef,
      handleListResize,
      handleListScroll,
      handleItemResize,
      scrollTo
    }
  },
  render () {
    const { visibleItemsTag } = this
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
              onWheel: this.onWheel,
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
                          style: {
                            transform: `translateY(${this.itemsPosition}px)`
                          }
                        },
                        this.visibleItemsProps
                      ),
                      {
                        default: () => {
                          const { resizeable, handleItemResize } = this
                          return this.renderedItems.map((item) => {
                            const { key, index, original } = item
                            const itemVNode = (this.$slots.default as any)({
                              item: original,
                              index
                            })[0]
                            if (resizeable) {
                              return h(
                                VResizeObserver,
                                {
                                  key,
                                  onResize: handleItemResize.bind(null, key)
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
