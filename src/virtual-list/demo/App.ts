import { defineComponent, ref, h, onMounted } from 'vue'
import { ItemData } from '../src/type'
import VirtualList from '../src/VirtualList'
import { basicData } from './data'
import { c } from '../../shared'

const styles = c([
`
  .v-vl {
    max-height: 200px;
    border: 1px solid blue;
  }
  .item {
    height: 34px;
  }
`
])

export default defineComponent({
  name: 'App',
  components: {
    VirtualList
  },
  setup () {
    onMounted(() => styles.mount({ target: 'vdemo/virtual-list' }))
    return {
      basicData: ref(basicData)
    }
  },
  render () {
    return [
      h(VirtualList, {
        itemSize: 34,
        items: basicData
      }, {
        default ({ item }: { item: ItemData }) {
          return h('div', {
            class: 'item',
            key: item.key
          }, [
            item.value
          ])
        }
      }),
      h(VirtualList, {
        itemSize: 34,
        items: basicData,
        showScrollbar: false
      }, {
        default ({ item }: { item: ItemData }) {
          return h('div', {
            class: 'item',
            key: item.key
          }, [
            item.value
          ])
        }
      })
    ]
  }
})
