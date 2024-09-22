import { defineComponent, ref, h, onBeforeMount, VNodeChild } from 'vue'
import { ItemData, VVirtualListColumn } from '../src/type'
import VirtualList from '../src/VirtualList'
import { randomHeightData } from './data'
import { c } from '../../shared'

const styles = c([
  `
  .v-vl {
    margin: 12px 0;
    max-height: 200px;
    box-shadow: 0 0 0 2px blue;
  }
  .item {
    box-sizing: border-box;
    border: 2px solid green;
    min-height: 34px;
  }
  .wrapper.expand-enter-from, .wrapper.expand-leave-to {
    max-height: 0;
  }
  .wrapper.expand-enter-to, .wrapper.expand-leave-from {
    max-height: 68px;
  }
  .wrapper.expand-enter-active, .wrapper.expand-leave-active {
    transition: max-height .3s linear;
  }
`
])

const columnCount = 1000

const xData = randomHeightData.slice(0, 1000).map((v, index) => {
  const res = { ...v }
  for (let i = 0; i < columnCount; ++i) {
    res[`col${i}`] = `${index}-${i}`
  }
  return res
})

const cols: VVirtualListColumn[] = []

for (let i = 0; i < columnCount; ++i) {
  cols.push({
    key: i,
    width: 100
  })
}

export default defineComponent({
  name: 'App',
  setup () {
    onBeforeMount(() => styles.mount({ id: 'vdemo/virtual-list' }))
    return {
      debounce: ref(false),
      scrollBehavior: ref<'auto' | 'smooth'>('auto'),
      listElRef: ref<any>(null)
    }
  },
  render () {
    return [
      h('div', [
        h(
          'button',
          {
            onClick: () => {
              this.listElRef.scrollTo({
                index: 10,
                behavior: this.scrollBehavior,
                debounce: this.debounce
              })
            }
          },
          ['scrollTo({ index: 10 })']
        ),
        h(
          'button',
          {
            onClick: () => {
              this.listElRef.scrollTo({
                key: 2000,
                behavior: this.scrollBehavior,
                debounce: this.debounce
              })
            }
          },
          ['scrollTo({ key: 2000 })']
        ),
        h(
          'button',
          {
            onClick: () => {
              this.listElRef.scrollTo({
                position: 'top',
                behavior: this.scrollBehavior,
                debounce: this.debounce
              })
            }
          },
          ["scrollTo({ position: 'top' })"]
        ),
        h(
          'button',
          {
            onClick: () => {
              this.scrollBehavior === 'auto'
                ? (this.scrollBehavior = 'smooth')
                : (this.scrollBehavior = 'auto')
            }
          },
          ['behavior:', this.scrollBehavior]
        ),
        h(
          'button',
          {
            onClick: () => {
              this.debounce = !this.debounce
            }
          },
          ['debounce:', this.debounce ? 'true' : 'false']
        )
      ]),
      h(
        VirtualList,
        {
          itemSize: 34,
          items: xData,
          itemResizable: true,
          columns: cols,
          renderCol: ({ column, item, left }) => {
            return h(
              'div',
              {
                key: column.key,
                style: {
                  position: 'absolute',
                  left: `${left}px`,
                  top: 0,
                  bottom: 0,
                  width: `${column.width}px`
                }
              },
              [item[`col${column.key as number}`]]
            )
          },
          ref: 'listElRef'
        },
        {
          default ({ item, cells }: { item: ItemData, cells: VNodeChild[] }) {
            return h(
              'div',
              {
                class: 'item',
                key: item.key,
                style: {
                  position: 'relative',
                  minHeight: `${item.height as number}px`
                }
              },
              cells
            )
          }
        }
      )
    ]
  }
})
