import { defineComponent, h, KeepAlive, ref } from 'vue'
import { ItemData } from '../src/type'
import VirtualList from '../src/VirtualList'
import { randomHeightData, basicData } from './data'

const Component1 = defineComponent({
  render () {
    return h(
      VirtualList,
      {
        itemSize: 34,
        items: randomHeightData,
        itemResizable: true,
        ref: 'listElRef',
        style: {
          height: '300px'
        }
      },
      {
        default ({ item }: { item: ItemData }) {
          return h(
            'div',
            {
              class: 'item',
              key: item.key,
              style: {
                minHeight: `${item.height as number}px`,
                border: '1px solid blue',
                boxSizing: 'border-box'
              }
            },
            [item.value]
          )
        }
      }
    )
  }
})

const Component2 = defineComponent({
  render () {
    return h(
      VirtualList,
      {
        itemSize: 34,
        items: basicData,
        ref: 'listElRef',
        style: {
          height: '300px'
        }
      },
      {
        default ({ item }: { item: ItemData }) {
          return h(
            'div',
            {
              class: 'item',
              key: item.key,
              style: {
                minHeight: '34px',
                border: '1px solid blue',
                boxSizing: 'border-box'
              }
            },
            [item.value]
          )
        }
      }
    )
  }
})

export default defineComponent({
  name: 'App',
  setup () {
    return {
      showVirtualList: ref(true)
    }
  },
  render () {
    return [
      h(
        'button',
        {
          onClick: () => {
            this.showVirtualList = !this.showVirtualList
          }
        },
        [`showVirtualList ${String(this.showVirtualList)}`]
      ),
      h(KeepAlive, null, {
        default: () => {
          return this.showVirtualList ? h(Component1) : null
        }
      }),
      h(KeepAlive, null, {
        default: () => {
          return this.showVirtualList ? h(Component2) : null
        }
      })
    ]
  }
})
