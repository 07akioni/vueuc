import { defineComponent, ref, h, onBeforeMount } from 'vue'
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
    onBeforeMount(() => styles.mount({ target: 'vdemo/virtual-list' }))
    return {
      scrollBehavior: ref<'auto' | 'smooth'>('auto'),
      listRef: ref<any>(null),
      basicData: ref(basicData)
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
        items: basicData,
        ref: 'listRef'
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
      }),
      h(VirtualList, {
        itemSize: 34,
        items: basicData,
        defaultScrollIndex: 300
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
