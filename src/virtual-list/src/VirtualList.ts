import {
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

export default defineComponent({
  name: 'VirtualList',
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
    }
  },
  setup (props) {
    onBeforeMount(() => {
      styles.mount({
        target: 'vueuc/virtual-list'
      })
    })
    onMounted(() => {
      const {
        defaultScrollIndex,
        defaultScrollKey
      } = props
      if (defaultScrollIndex !== undefined && defaultScrollIndex !== null) {
        (listRef.value as Element).scrollTop = defaultScrollIndex * props.itemSize
      } else if (defaultScrollKey !== undefined && defaultScrollKey !== null) {
        const index = keyIndexMapRef.value.get(defaultScrollKey)
        if (index === undefined) return
        (listRef.value as Element).scrollTop = index * props.itemSize
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
        Math.floor(scrollTopRef.value / props.itemSize) - 1,
        0
      )
    })
    const viewportItemsRef = computed(() => {
      if (!preparedRef.value) return []
      const startIndex = startIndexRef.value
      const endIndex = Math.min(
        startIndex + Math.ceil(listHeightRef.value as number / props.itemSize) + 1,
        props.items.length - 1
      )
      const viewportItems = []
      const { items } = props
      for (let i = startIndex; i <= endIndex; ++i) {
        viewportItems.push(items[i])
      }
      return viewportItems
    })
    return {
      listHeight: listHeightRef,
      scrollTop: scrollTopRef,
      listStyle: computed(() => {
        return {
          overflow: 'auto'
        }
      }),
      itemsStyle: computed(() => {
        return {
          height: `${props.itemSize * props.items.length}px`
        }
      }),
      visibleItemsStyle: computed(() => {
        return {
          transform: `translate3d(0, ${startIndexRef.value * props.itemSize}px, 0)`
        }
      }),
      viewportItems: viewportItemsRef,
      keyIndexMap: keyIndexMapRef,
      listRef,
      itemsRef: ref<null | Element>(null),
      rafFlag: {
        value: false
      }
    }
  },
  methods: {
    scrollTo (options: VScrollToOptions) {
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
        this.scrollToPosition(left, top, behavior)
      } else if (index !== undefined) {
        this.scrollToIndex(index, behavior, debounce)
      } else if (key !== undefined) {
        const {
          keyIndexMap
        } = this
        const toIndex = keyIndexMap.get(key)
        if (toIndex !== undefined) this.scrollToIndex(toIndex, behavior, debounce)
      } else if (position === 'bottom') {
        this.scrollToPosition(0, Number.MAX_SAFE_INTEGER, behavior)
      } else if (position === 'top') {
        this.scrollToPosition(0, 0, behavior)
      }
    },
    scrollToIndex (index: number, behavior: ScrollToOptions['behavior'], debounce: boolean) {
      const { listRef, itemSize } = this
      const targetTop = index * itemSize
      if (!debounce) {
        (listRef as HTMLDivElement).scrollTo({
          left: 0,
          top: targetTop,
          behavior
        })
      } else {
        console.log('debounce')
        const {
          scrollTop,
          offsetHeight
        } = listRef as HTMLDivElement
        if (targetTop > scrollTop) {
          if (targetTop + itemSize <= scrollTop + offsetHeight) {
            // do nothing
          } else {
            (listRef as HTMLDivElement).scrollTo({
              left: 0,
              top: targetTop + itemSize - offsetHeight,
              behavior
            })
          }
        } else {
          (listRef as HTMLDivElement).scrollTo({
            left: 0,
            top: targetTop,
            behavior
          })
        }
      }
    },
    scrollToPosition (
      left: number | undefined,
      top: number | undefined,
      behavior: ScrollToOptions['behavior']
    ) {
      ;(this.listRef as Element).scrollTo({
        left,
        top,
        behavior
      })
    },
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
        return h('div', {
          class: [
            'v-vl',
            {
              'v-vl--show-scrollbar': this.showScrollbar
            }
          ],
          onScroll: this.handleListScroll,
          ref: 'listRef'
        }, [
          h('div', {
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
        ])
      }
    })
  }
})
