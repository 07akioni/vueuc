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

    const viewportHeightRef = ref(0)
    const scrollTopRef = ref(0)

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
        const { value: top } = scrollTopRef
        const { value: height } = viewportHeightRef
        const bottom = top + height

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

    let allowCompensateVisualBias = false
    let currentScrolFromWheel = false

    const handleListScroll = (e: Event): void => {
      beforeNextFrameOnce(syncViewport)
      props.onScroll?.(e)
      if (!currentScrolFromWheel) {
        allowCompensateVisualBias = true
      }
      if (shouldPositionedTo !== null) {
        shouldPositionedTo = null
      }
    }

    let timer: NodeJS.Timer | null = null
    const handleListWheel = (e: WheelEvent): void => {
      if (Math.abs(e.deltaY) % 100 === 0) {
        allowCompensateVisualBias = false
        currentScrolFromWheel = true

        if (timer !== null) {
          clearTimeout(timer)
        }
        timer = setTimeout(() => {
          currentScrolFromWheel = false
        }, 200)
      }
      props.onWheel?.(e)
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

        if (!shouldMeasurePositioned && allowCompensateVisualBias) {
          const { value: startIndex } = startIndexRef
          if (
            startIndex > preReservation &&
            getIndex(key) < startIndex + preReservation
          ) {
            // Make up for the gap caused by dynamic height
            listElRef.value?.scrollBy(0, increment)
          }
        }
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
          position: listHeightRef.value,
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
      scrollToPosition({
        direction: 'left',
        position: 0,
        behavior
      })
      scrollToPosition(
        {
          direction: 'top',
          position: getPosition(index),
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

    interface ScrollToPositionOptions {
      direction: 'top' | 'left'
      position: number
      behavior?: ScrollBehavior
    }
    const scrollAnimationMap = new Map<string, FrameMotionUserControls>()
    const scrollToPosition = (
      options: ScrollToPositionOptions,
      onComplete?: () => void
    ): void => {
      const { direction, position, behavior = 'auto' } = options
      if (scrollAnimationMap.has(direction)) {
        scrollAnimationMap.get(direction)?.stop()
        scrollAnimationMap.delete(direction)
      }
      shouldPositionedTo = null
      const { value: listEl } = listElRef
      if (listEl === null) {
        return
      }

      const field = `scroll${direction
        .charAt(0)
        .toLocaleUpperCase()}${direction.slice(1)}` as
        | 'scrollTop'
        | 'scrollLeft'
      if (behavior === 'auto') {
        listEl[field] = position
      } else {
        const startPos = listEl[field]
        const distance = position - startPos
        const handleComplete = (): void => {
          if (scrollAnimationMap.get(direction) === animation) {
            scrollAnimationMap.delete(direction)
          }
          onComplete?.()
        }
        const DurationDivisor = 60.0
        const ImpulseMaxDurationMs = 500.0
        const animation = frameMotion({
          duration: Math.max(
            DurationDivisor,
            Math.min(Math.abs(distance), ImpulseMaxDurationMs) * 1.5
          ),
          autoplay: true,
          onComplete: handleComplete,
          easing: bezier(0.42, 0.0, 0.58, 1),
          onUpdate: (progress: number) => {
            if (listEl[field] === position) {
              animation?.stop()
              handleComplete()
              return
            }
            listEl[field] = startPos + distance * progress
          }
        })
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
