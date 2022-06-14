import { defineComponent, ref, h, onBeforeMount, Transition } from 'vue'
import { ItemData } from '../src/type'
import VirtualList from '../src/VirtualList'
import { randomHeightData } from './data'
import { c } from '../../shared'
import { createId } from 'seemly'

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

const ExpandableNode = defineComponent({
  name: 'ExpandableNode',
  props: ['onAfterNextEnter', 'onAfterSelfLeave', 'item'],
  setup () {
    return {
      showSelf: ref(true),
      showNext: ref(false),
      nextEntered: ref(false),
      pendingItem: ref<ItemData | null>(null)
    }
  },
  render () {
    return h(Transition, {
      name: 'expand',
      onAfterLeave: this.onAfterSelfLeave
    }, {
      default: () => {
        return this.showSelf
          ? h('div', { class: 'wrapper' }, [
            h('div', {
              class: 'item',
              style: {
                minHeight: `${this.item.height as number}px`
              }
            }, [
              h('button', {
                onClick: () => {
                  if (this.pendingItem !== null) return
                  this.nextEntered = false
                  this.showNext = true
                  const newKey = createId()
                  this.pendingItem = { key: newKey, height: 68, value: `item_${newKey}x` }
                }
              }, ['insertAfter']),
              h('button', {
                onClick: () => {
                  this.showSelf = false
                }
              }, ['remove']),
              h('span', {
              }, [this.item.value])
            ]),
            !this.nextEntered
              ? h(Transition, {
                name: 'expand',
                appear: true,
                onAfterEnter: () => {
                  this.onAfterNextEnter(this.pendingItem)
                  this.nextEntered = true
                  this.pendingItem = null
                  this.showNext = false
                }
              }, {
                default: () => {
                  return this.showNext
                    ? h(ExpandableNode, {
                      item: this.pendingItem
                    })
                    : null
                }
              })
              : null
          ])
          : null
      }
    })
  }
})

export default defineComponent({
  name: 'App',
  setup () {
    onBeforeMount(() => styles.mount({ id: 'vdemo/virtual-list' }))
    return {
      debounce: ref(false),
      scrollBehavior: ref<'auto' | 'smooth'>('auto'),
      listElRef: ref<any>(null),
      mutableData: ref(Array.from(randomHeightData))
    }
  },
  render () {
    return [
      h('div', [
        h('button', {
          onClick: () => {
            this.listElRef.scrollTo({ index: 10, behavior: this.scrollBehavior, debounce: this.debounce })
          }
        }, [
          'scrollTo({ index: 10 })'
        ]),
        h('button', {
          onClick: () => {
            this.listElRef.scrollTo({ key: 2000, behavior: this.scrollBehavior, debounce: this.debounce  })
          }
        }, [
          'scrollTo({ key: 2000 })'
        ]),
        h('button', {
          onClick: () => {
            this.listElRef.scrollTo({ position: 'top', behavior: this.scrollBehavior, debounce: this.debounce })
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
        ]),
        h('button', {
          onClick: () => {
            this.debounce = !this.debounce
          }
        }, [
          'debounce:',
          `${this.debounce}`
        ])
      ]),
      h(VirtualList, {
        itemSize: 34,
        items: randomHeightData,
        itemResizable: true,
        ref: 'listElRef'
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
      // h(VirtualList, {
      //   itemSize: 34,
      //   items: this.mutableData,
      //   itemResizable: true,
      //   ref: 'listElRef'
      // }, {
      //   default: ({ item, index }: { item: ItemData, index: number }) => {
      //     return h(ExpandableNode, {
      //       onAfterNextEnter: (newItem: ItemData) => {
      //         this.mutableData.splice(index + 1, 0, newItem)
      //       },
      //       onAfterSelfLeave: () => {
      //         this.mutableData.splice(index, 1)
      //       },
      //       key: item.key,
      //       item
      //     })
      //   }
      // })
    ]
  }
})
