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
      box-sizing: border-box;
      border: 1px solid green;
      min-height: 34px;
    }
  `
])

export default defineComponent({
  name: 'App',
  setup () {
    onBeforeMount(() => styles.mount({ id: 'vdemo/virtual-list' }))
    return {
      scrollBehavior: ref<'auto' | 'smooth'>('auto'),
      listElRef: ref<any>(null),
      basicData: ref(basicData)
    }
  },
  render () {
    return [
      h('div', [
        h('button', {
          onClick: () => {
            this.listElRef.scrollTo({ index: 10, behavior: this.scrollBehavior })
          }
        }, [
          'scrollTo({ index: 10 })'
        ]),
        h('button', {
          onClick: () => {
            this.listElRef.scrollTo({ key: 2000, behavior: this.scrollBehavior })
          }
        }, [
          'scrollTo({ key: 2000 })'
        ]),
        h('button', {
          onClick: () => {
            this.listElRef.scrollTo({ position: 'top', behavior: this.scrollBehavior })
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
        ref: 'listElRef'
      }, {
        default ({ item }: { item: ItemData }) {
          return h('div', {
            class: 'item'
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
      }),
      h(VirtualList, {
        itemSize: 34,
        items: basicData,
        defaultScrollIndex: 300,
        paddingTop: 100,
        paddingBottom: '100px'
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
