import { defineComponent, ref, h, onMounted } from 'vue'
import { ItemData } from '../src/type'
import VirtualList from '../src/VirtualList'
import { basicData } from './data'
import { c } from '../../shared'

const styles = c([
  `.item {
    height: 34px;
  }`
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
    return h(VirtualList, {
      height: 34 * 7,
      itemHeight: 34,
      items: basicData
    }, {
      default (item: ItemData) {
        return h('div', {
          class: 'item',
          key: item.key
        }, [
          item.value
        ])
      }
    })
  }
})
