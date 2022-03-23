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
import bezier from 'bezier-easing'
import { useSsrAdapter } from '@css-render/vue3-ssr'
import VResizeObserver from '../../resize-observer/src/VResizeObserver'
import type { FrameMotionController } from '../../shared'
import {
  c,
  cssrAnchorMetaName,
  FinweckTree,
  createFrameMotion
} from '../../shared'
import type { ItemData, VScrollToOptions } from './type'

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

interface ViewportRect {
  top: number
  bottom: number
  height: number
  // TODO: horizontal
}

type ItemKey = string | number

interface RenderedItem {
  key: ItemKey
  index: number
  original: ItemData
}

function createResultMemoFunction<T extends (key: any) => any> (fn: T): T {
  const cache = new Map()
  return ((key) => {
    if (cache.has(key)) return cache.get(key)
    const result = fn(key)
    cache.set(key, result)
    return result
  }) as T
}

function isHideByVShow (el: HTMLElement): boolean {
  let cursor: HTMLElement | null = el
  while (cursor !== null) {
    if (cursor.style.display === 'none') return true
    cursor = cursor.parentElement
  }
  return false
}

const DurationDivisor = 60.0
const ImpulseMaxDurationMs = 500.0
function getScrollAnimationDuration (delta: number): number {
  return Math.max(
    DurationDivisor,
    Math.min(Math.abs(delta), ImpulseMaxDurationMs) * 1.5
  )
}

const PRE_RESERVATION = 1
const POST_RESERVATION = 4

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

    const scrollTopRef = ref(0)
    const listElRef = ref<null | Element>(null)
    const listHeightRef = ref(0)
    const getViewportRect = (): ViewportRect => {
      const { value: top } = scrollTopRef
      const { value: height } = listHeightRef
      return {
        top: top - +(props.paddingTop ?? 0),
        height,
        bottom: top + height
      }
    }

    const offsetFinweckTreeRef = computed(() => {
      return new FinweckTree(resizeableRef.value ? props.items.length : 0)
    })
    const finweckTreeUpdateTrigger = ref(0)

    const resizeableRef = computed(
      () => props.itemResizable && !props.ignoreItemResize
    )
    const itemsSizeRef = computed(() => {
      const { length } = props.items
      const assumedItemsSize = length * props.itemSize
      if (!resizeableRef.value) {
        return assumedItemsSize
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      finweckTreeUpdateTrigger.value
      return assumedItemsSize + offsetFinweckTreeRef.value.sum(length)
    })

    const renderedItemsRef = ref<RenderedItem[]>([])
    const renderedItemIndexMap = new Map<ItemKey, number>()
    const renderedItemOffsetMap = new Map<ItemKey, number>()
    const setItemOffset = (key: ItemKey, offset: number): void => {
      const perviousOffset = renderedItemOffsetMap.get(key)
      if (perviousOffset !== offset) {
        const index = getItemIndex(key)
        if (validateIndex(index)) {
          renderedItemOffsetMap.set(key, offset)

          offsetFinweckTreeRef.value.update(index, offset)
          finweckTreeUpdateTrigger.value++
        }
      }
    }

    const validateIndex = (index?: number): boolean => {
      return index !== undefined && index >= 0 && index < props.items.length
    }
    const getItemIndex = (key: ItemKey): number => {
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

    const getItemSize = (index: number): number => {
      const { itemSize: assumedItemSize } = props
      if (!resizeableRef.value) {
        return assumedItemSize
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      finweckTreeUpdateTrigger.value
      return assumedItemSize + offsetFinweckTreeRef.value.get(index)
    }

    const getItemPosition = (index: number): number => {
      if (index === 0) return 0
      const assumedPosition = index * props.itemSize
      if (!resizeableRef.value) {
        return assumedPosition
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      finweckTreeUpdateTrigger.value
      return assumedPosition + offsetFinweckTreeRef.value.sum(index)
    }

    const getFirstVisibleIndexByPosition = (position: number): number =>
      Math.floor((position / itemsSizeRef.value) * props.items.length)

    const measureFirstVisibleIndex = (index: number, top: number): number => {
      const { items } = props
      let start = getItemPosition(index)
      if (start > top) {
        /**
         *      ┏━ ━━ ━┓
         *        ┌──┐
         *      ┃ │  │ ┃
         *        └──┘
         *      ┗━ ━━ ━┛
         */
        while (start > top && index > 0) {
          index--
          start -= getItemSize(index)
        }
      } else {
        const { length } = items
        /**
         *        ┌──┐
         *      ┏━│━━│━┓
         *        └──┘
         *      ┃      ┃
         *
         *      ┗━ ━━ ━┛
         */
        while (start < top && index < length - 1) {
          index++
          start += getItemSize(index)
        }

        /**
         *      ┏━ ━━ ━┓
         *        ┌──┐
         *      ┃ │  │ ┃
         *        └──┘
         *      ┗━ ━━ ━┛
         */
        if (start > top && index > 0) {
          index--
        }
      }
      return index
    }

    const getNewestVisibleIndex = (position: number): number => {
      if (!resizeableRef.value) {
        return getFirstVisibleIndexByPosition(position)
      } else {
        return measureFirstVisibleIndex(
          getFirstVisibleIndexByPosition(position),
          position
        )
      }
    }

    const getRenderCandidates = (
      firstVisibleIdx: number,
      viewportRect: ViewportRect
    ): RenderedItem[] => {
      let startIdx = firstVisibleIdx
      let endIdx
      // The heights of all items are known and equal,
      // which newestVisibleIndex === startIndex
      if (!resizeableRef.value) {
        endIdx = startIdx + getFirstVisibleIndexByPosition(listHeightRef.value)
      } else {
        // avoid repeated runs
        const getItemSizeMemo = createResultMemoFunction(getItemSize)
        // There is a dynamically changing size, which may be newestVisibleIndex !== startIndex
        // Need to further calculate the position of startIndex
        const { length } = props.items
        const { bottom } = viewportRect

        endIdx = startIdx
        let end = getItemPosition(startIdx)
        while (end < bottom && endIdx++ < length - 1) {
          end += getItemSizeMemo(endIdx)
        }
      }

      startIdx = Math.max(0, startIdx - PRE_RESERVATION)
      endIdx += POST_RESERVATION

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

    const firstVisibleIndexRef = useMemo(() =>
      getNewestVisibleIndex(getViewportRect().top)
    )
    const getFinalRenderedItemsMemoized = (): RenderedItem[] => {
      const renderedItems = getRenderCandidates(
        firstVisibleIndexRef.value,
        getViewportRect()
      )
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
          const finalRenderedItem = finalRenderedItems[index]
          return (
            item.key !== finalRenderedItem.key ||
            item.index !== finalRenderedItem.index
          )
        })
      ) {
        renderedItemsRef.value = finalRenderedItems
      }
    })

    // Scroll
    const startIndexRef = useMemo(() => renderedItemsRef.value[0]?.index ?? 0)
    const itemsPositionRef = computed(() => {
      const { value: startIndex } = startIndexRef
      if (!validateIndex(startIndex)) {
        return 0
      }
      const assumedPosition = startIndex * props.itemSize
      if (!resizeableRef.value) {
        return assumedPosition
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      finweckTreeUpdateTrigger.value
      return assumedPosition + offsetFinweckTreeRef.value.sum(startIndex)
    })

    let allowCompensateVisualBias = false
    let wheelTriggeredRecently = false

    const handleListScroll = (e: Event): void => {
      beforeNextFrameOnce(syncViewport)
      props.onScroll?.(e)
      if (!wheelTriggeredRecently) {
        allowCompensateVisualBias = true
      }
      scrollToIndexOptions = null
    }

    let wheelTriggeredTimerId: number | null = null
    const handleListWheel = (e: WheelEvent): void => {
      props.onWheel?.(e)

      if (Math.abs(e.deltaY) % 100 === 0) {
        wheelTriggeredRecently = true
        allowCompensateVisualBias = false

        if (wheelTriggeredTimerId !== null) {
          window.clearTimeout(wheelTriggeredTimerId)
        }
        wheelTriggeredTimerId = window.setTimeout(() => {
          wheelTriggeredRecently = false
        }, 200)
      }

      // abort smooth scroll
      // https://drafts.csswg.org/cssom-view/#scrolling
      if (scrollMotionController !== null) {
        scrollMotionController.abort()
        scrollMotionController = null
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
      const shouldMeasurePositioned = scrollToIndexOptions !== null

      const height = entry.borderBoxSize[0].blockSize
      const offset = height - props.itemSize
      const increment = offset - (renderedItemOffsetMap.get(key) ?? 0)

      if (increment !== 0) {
        setItemOffset(key, offset)

        if (!shouldMeasurePositioned && allowCompensateVisualBias) {
          const { value: startIndex } = startIndexRef
          if (
            startIndex > PRE_RESERVATION &&
            getItemIndex(key) < startIndex + PRE_RESERVATION
          ) {
            // Make up for the gap caused by dynamic height
            listElRef.value?.scrollBy(0, increment)
          }
        }
      }
      // measure
      if (shouldMeasurePositioned) {
        beforeNextFrameOnce(measurePositionToIndexCompleted)
      }
    }

    const handleListResize = (entry: ResizeObserverEntry): void => {
      if (isHideByVShow(entry.target as HTMLElement)) {
        return
      }
      // If height is same, return
      if (entry.contentRect.height === itemsSizeRef.value) return
      listHeightRef.value = entry.contentRect.height
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

    // Scroll methods
    let scrollToIndexOptions: { index: number, debounce?: boolean } | null =
      null
    // to ensure that the correct index is reached
    const measurePositionToIndexCompleted = (): void => {
      if (scrollToIndexOptions === null) {
        return
      }
      const { index, debounce } = scrollToIndexOptions
      scrollToIndexOptions = null

      const { value: scrollTop } = scrollTopRef
      const currentVisibleIndex = getNewestVisibleIndex(scrollTop)
      if (
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        debounce &&
        index >= currentVisibleIndex &&
        getItemPosition(index + 1) <= scrollTop + listHeightRef.value
      ) {
        // If debounce is true, just need it in the viewport
        return
      }
      if (index !== currentVisibleIndex) {
        // continue to complete the mission
        scrollToIndex(index, 'auto', debounce)
      }
    }

    const scrollTo: ScrollTo = (options: VScrollToOptions): void => {
      const { behavior, debounce } = options
      if (options.left !== undefined) {
        scrollToPosition({
          direction: 'left',
          position: options.left,
          behavior
        })
      } else if (options.top !== undefined) {
        scrollToPosition({
          direction: 'top',
          position: options.top,
          behavior
        })
      } else if (options.index !== undefined) {
        scrollToIndex(options.index, behavior, debounce)
      } else if (options.key !== undefined) {
        scrollToKey(options.key, behavior, debounce)
      }
      const { position } = options
      if (position === 'bottom') {
        scrollToPosition({
          direction: 'top',
          position: itemsSizeRef.value,
          behavior
        })
      } else if (position === 'top') {
        scrollToPosition({
          direction: 'top',
          position: 0,
          behavior
        })
      }
    }

    const scrollToKey = (
      key: ItemKey,
      behavior?: ScrollBehavior,
      debounce?: boolean
    ): void => scrollToIndex(getItemIndex(key), behavior, debounce)

    const scrollToIndex = (
      index: number,
      behavior?: ScrollBehavior,
      debounce?: boolean
    ): void => {
      if (!validateIndex(index)) {
        return
      }
      scrollToPosition({
        direction: 'left',
        position: 0,
        behavior
      })
      scrollToPosition(
        {
          direction: 'top',
          position: getItemPosition(index) + +(props.paddingTop ?? 0),
          behavior
        },
        (): void => {
          resizeableRef.value &&
            requestAnimationFrame(() => {
              // Wait until the scroll event fires before assigning
              scrollToIndexOptions = {
                index,
                debounce
              }
              void nextTick(measurePositionToIndexCompleted)
            })
        }
      )
    }

    type ScrollDirection = 'top' | 'left'
    interface ScrollToPositionOptions {
      direction: ScrollDirection
      position: number
      behavior?: ScrollBehavior
    }
    let scrollMotionController: FrameMotionController | null = null
    const scrollToPosition = (
      options: ScrollToPositionOptions,
      onComplete?: () => void
    ): void => {
      // If there is a new scroll work, stop last work
      scrollToIndexOptions = null
      const { direction, position, behavior = 'auto' } = options
      if (scrollMotionController !== null) {
        scrollMotionController.abort()
        scrollMotionController = null
      }
      const { value: listEl } = listElRef
      if (listEl === null) {
        return
      }

      const setScrollPosition =
        direction === 'left'
          ? (value: number) => {
              listEl.scrollLeft = value
            }
          : (value: number) => {
              listEl.scrollTop = value
            }

      if (behavior === 'auto') {
        setScrollPosition(options.position)
        return
      }

      const handleComplete = (): void => {
        if (scrollMotionController !== null) {
          scrollMotionController.abort()
          scrollMotionController = null
        }
        onComplete?.()
      }

      const getScrollPosition =
        direction === 'left' ? () => listEl.scrollLeft : () => listEl.scrollTop

      const startPosition = getScrollPosition()
      const delta = position - startPosition
      const duration = getScrollAnimationDuration(delta)
      scrollMotionController = createFrameMotion({
        duration,
        easing: bezier(0.42, 0.0, 0.58, 1),
        onComplete: handleComplete,
        onUpdate: (progress) => {
          setScrollPosition(startPosition + delta * progress)
        }
      })
      scrollMotionController.play()
    }

    return {
      listStyle: {
        overflow: 'auto'
      },
      itemsStyle: computed(() => {
        const { itemResizable } = props
        const height = pxfy(itemsSizeRef.value)
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
      handleListWheel,
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
