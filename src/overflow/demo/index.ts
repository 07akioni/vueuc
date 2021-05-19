import { defineComponent, h, ref, computed, nextTick } from 'vue'
import { VOverflow } from '../../index'
import { VOverflowInst } from '../src'

export default defineComponent({
  setup () {
    const overflowRef1 = ref<VOverflowInst | null>(null)
    const overflowRef2 = ref<VOverflowInst | null>(null)
    const counterRef1 = ref<HTMLElement | null>(null)
    const counterRef2 = ref<HTMLElement | null>(null)
    const tailRef1 = ref<HTMLElement | null>(null)
    const itemCountRef = ref(3)
    const itemsElRef = computed(() => Array.apply(null, { length: itemCountRef.value } as any).map(
      (_, i) => i
    ))
    return {
      getCounter1: () => counterRef1.value,
      updateCounter1: (count: number) => {
        if (counterRef1.value !== null) {
          counterRef1.value.textContent = `${count}牛`
        }
      },
      getCounter2: () => counterRef2.value,
      updateCounter2: (count: number) => {
        if (counterRef2.value !== null) {
          counterRef2.value.textContent = `${count}牛`
        }
      },
      getTail: () => tailRef1.value,
      tailValue: ref('tail'),
      counterRef1,
      counterRef2,
      tailRef1,
      items: itemsElRef,
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
      h('input', {
        value: this.tailValue,
        onInput: (e: InputEvent): void => { this.tailValue = (e.target as HTMLInputElement).value }
      }),
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
          getCounter: this.getCounter1,
          updateCounter: this.updateCounter1,
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
          counter: () => {
            return h('span', {
              ref: 'counterRef1',
              style: {
                display: 'inline-block'
              }
            })
          }
        }
      ),
      h(
        VOverflow,
        {
          getCounter: this.getCounter2,
          updateCounter: this.updateCounter2,
          getTail: this.getTail,
          style: {
            whiteSpace: 'nowrap',
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
          counter: () => {
            return h('span', {
              ref: 'counterRef2',
              style: {
                display: 'inline-block'
              }
            })
          },
          tail: () => {
            return h('span', {
              ref: 'tailRef1',
              style: {
                border: '1px solid red',
                display: 'inline-block'
              }
            }, [
              this.tailValue
            ])
          }
        }
      )
    ])
  }
})
