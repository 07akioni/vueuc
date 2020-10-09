import {
  computed,
  defineComponent,
  PropType,
  ref,
  onMounted,
  h,
  renderSlot,
  renderList
} from 'vue'
import { ItemData } from './type'
import { nextFrame, c } from '../../shared'
import VResizeObserver from '../../resize-observer/src'

const styles = c([
  `.vvl {
    border: 1px solid cornflowerblue;
    width: 400px;
    overflow: scroll;
    height: 350px;
    resize: both;
  }`
])

export default defineComponent({
  name: 'VirtualList',
  props: {
    items: {
      type: Array as PropType<ItemData[]>,
      default: () => []
    },
    itemHeight: {
      type: Number,
      required: true
    }
  },
  setup (props) {
    onMounted(() => {
      styles.mount({
        target: 'vtools/virtual-list'
      })
    })
    const listHeightRef = ref<undefined | number>(undefined)
    const preparedRef = computed(() => listHeightRef.value !== undefined)
    const scrollTopRef = ref(0)
    const startIndexRef = computed(() => {
      return Math.max(
        Math.floor(scrollTopRef.value / props.itemHeight) - 1,
        0
      )
    })
    const viewportItemsRef = computed(() => {
      if (!preparedRef.value) return []
      const startIndex = startIndexRef.value
      const endIndex = Math.min(
        startIndex + Math.ceil(listHeightRef.value as number / props.itemHeight) + 1,
        props.items.length - 1
      )
      const viewportItems = []
      const { items } = props
      for (let i = startIndex; i <= endIndex; ++i) {
        viewportItems.push(items[i])
      }
      return viewportItems
    })
    const listRef = ref<null | Element>(null)
    return {
      listHeight: listHeightRef,
      scrollTop: scrollTopRef,
      itemsWrapperStyle: computed(() => {
        return {
          height: `${props.itemHeight * props.items.length}px`
        }
      }),
      itemsViewportStyle: computed(() => {
        return {
          transform: `translate3d(0, ${startIndexRef.value * props.itemHeight}px, 0)`
        }
      }),
      viewportItems: viewportItemsRef,
      listRef,
      rafFlag: {
        value: false
      }
    }
  },
  methods: {
    handleListScroll () {
      const { rafFlag } = this
      if (!rafFlag.value) {
        nextFrame(this.syncViewport)
        rafFlag.value = true
      }
    },
    handleListResize (entry: ResizeObserverEntry) {
      this.listHeight = entry.contentRect.height
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
          class: 'vvl',
          onScroll: this.handleListScroll,
          ref: 'listRef'
        }, [
          h('div', {
            class: 'vvl-items',
            style: this.itemsWrapperStyle
          }, [
            h('div', {
              class: 'vvl-visible-items',
              style: this.itemsViewportStyle
            },
            renderList(this.viewportItems, (item) => {
              return renderSlot(this.$slots, 'default', item)
            }))
          ])
        ])
      }
    })
  }
})
