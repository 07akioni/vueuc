import { defineComponent, ref, h } from 'vue'
import { ItemData } from '../src/type'
import VirtualList from '../src/VirtualList'
import { basicData } from './data'

export default defineComponent({
  name: 'App',
  components: {
    VirtualList
  },
  setup () {
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
