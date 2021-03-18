import { defineComponent, h, ref, computed, nextTick } from 'vue'
import { VOverflow } from '../../index'
import { VOverflowRef } from '../src'

export default defineComponent({
  setup () {
    const overflowRef1 = ref<VOverflowRef | null>(null)
    const overflowRef2 = ref<VOverflowRef | null>(null)
    const tailRef = ref<HTMLElement | null>(null)
    const itemCountRef = ref(3)
    const itemsRef = computed(() => Array.apply(null, { length: itemCountRef.value } as any).map(
      (_, i) => i
    ))
    return {
      getTail: () => tailRef.value,
      updateTail: (count: number) => {
        if (tailRef.value !== null) {
          tailRef.value.textContent = `${count}牛`
        }
      },
      tailRef,
      items: itemsRef,
      itemCount: itemCountRef,
      overflowRef1,
      overflowRef2,
      sync: () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        nextTick(() => {
          overflowRef1.value?.sync()
          overflowRef2.value?.sync()
        })
      }
    }
  },
  render () {
    return h('div', undefined, [
      h(
        'button',
        {
          onClick: () => {
            this.itemCount -= 1
          }
        },
        ['-']
      ),
      this.itemCount,
      h(
        'button',
        {
          onClick: () => {
            this.itemCount += 1
          }
        },
        ['+']
      ),
      h('hr'),
      h(
        VOverflow,
        {
          ref: 'overflowRef1',
          style: {
            width: '120px',
            background: 'grey'
          }
        },
        {
          default: () => {
            return this.items.map(v => h(
              'div',
              {
                style: {
                  display: 'inline-block',
                  border: '1px solid yellow',
                  width: '30px'
                }
              },
              [v + 1]
            ))
          }
        }
      ),
      h(
        VOverflow,
        {
          ref: 'overflowRef2',
          getTail: this.getTail,
          updateTail: this.updateTail,
          style: {
            width: '120px',
            background: 'grey'
          }
        },
        {
          default: () => {
            return this.items.map(v => h(
              'div',
              {
                style: {
                  display: 'inline-block',
                  border: '1px solid yellow',
                  width: '30px'
                }
              },
              [v + 1]
            ))
          },
          tail: () => {
            return h('span', {
              ref: 'tailRef',
              style: {
                display: 'inline-block'
              }
            })
          }
        }
      )
    ])
  }
})
