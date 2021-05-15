import { defineComponent, ref, h, onBeforeMount } from 'vue'
import { ItemData } from '../src/type'
import VirtualList from '../src/VirtualList'
import { randomHeightData } from './data'
import { c } from '../../shared'

const styles = c([
`
  .v-vl {
    max-height: 200px;
    border: 1px solid blue;
  }
  .item {
    box-sizing: border-box;
    border: 1px solid green;
    height: 34px;
  }
`
])

export default defineComponent({
  name: 'App',
  setup () {
    onBeforeMount(() => styles.mount({ target: 'vdemo/virtual-list' }))
    return {
      scrollBehavior: ref<'auto' | 'smooth'>('auto'),
      listRef: ref<any>(null),
      basicData: ref(randomHeightData)
    }
  },
  render () {
    return [
      h('div', [
        h('button', {
          onClick: () => {
            this.listRef.scrollTo({ index: 100, behavior: this.scrollBehavior })
          }
        }, [
          'scrollTo({ index: 100 })'
        ]),
        h('button', {
          onClick: () => {
            this.listRef.scrollTo({ key: 200, behavior: this.scrollBehavior })
          }
        }, [
          'scrollTo({ key: 200 })'
        ]),
        h('button', {
          onClick: () => {
            this.listRef.scrollTo({ position: 'top', behavior: this.scrollBehavior })
          }
        }, [
          'scrollTo({ position: \'top\' })'
        ]),
        h('button', {
          onClick: () => {
            this.scrollBehavior === 'auto' ? this.scrollBehavior = 'smooth' : this.scrollBehavior = 'auto'
          }
        }, [
          'behavior:',
          this.scrollBehavior
        ])
      ]),
      h(VirtualList, {
        itemSize: 34,
        items: randomHeightData,
        itemResizable: true,
        ref: 'listRef'
      }, {
        default ({ item }: { item: ItemData }) {
          return h('div', {
            class: 'item',
            key: item.key,
            style: {
              minHeight: `${item.height as number}px`
            }
          }, [
            item.value
          ])
        }
      })
    ]
  }
})
