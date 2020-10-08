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
import { nextFrame } from './utils'
import { CssRender } from 'css-render'

const { c } = CssRender()

const styles = c([
  `.vvl {
    border: 1px solid cornflowerblue;
    width: 400px;
    overflow: scroll;
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
    },
    height: {
      type: Number,
      required: true
    }
  },
  setup (props) {
    onMounted(() => {
      styles.mount({
        target: '@vtools/virtual-list'
      })
    })
    const scrollTopRef = ref(0)
    const startIndexRef = computed(() => {
      return Math.max(
        Math.floor(scrollTopRef.value / props.itemHeight) - 1,
        0
      )
    })
    const viewportItemsRef = computed(() => {
      const startIndex = startIndexRef.value
      const endIndex = Math.min(
        startIndex + Math.ceil(props.height / props.itemHeight) + 1,
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
      scrollTop: scrollTopRef,
      listStyle: computed(() => {
        return {
          height: props.height + 'px'
        }
      }),
      itemsWrapperStyle: computed(() => {
        return {
          height: props.itemHeight * props.items.length + 'px'
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
    syncViewport () {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.scrollTop = this.listRef!.scrollTop
      this.rafFlag.value = false
    }
  },
  render () {
    return h("div", {
      class: "vvl",
      style: this.listStyle,
      onScroll: this.handleListScroll,
      ref: "listRef"
    }, [
      h("div", {
        class: "vvl-items",
        style: this.itemsWrapperStyle
      }, [
        h("div", {
          class: "vvl-visible-items",
          style: this.itemsViewportStyle
        }, 
        renderList(this.viewportItems, (item) => {
          return renderSlot(this.$slots, "default", item)
        }))
      ])
    ])
  }
})