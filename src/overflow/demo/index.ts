import { defineComponent, h, ref, computed } from 'vue'
import { VOverflow } from '../../index'

export default defineComponent({
  setup () {
    const tailRef = ref<HTMLElement | null>(null)
    const tailContentRef = ref<HTMLElement | null>(null)
    const itemCountRef = ref(3)
    const itemsRef = computed(() => Array.apply(null, { length: itemCountRef.value } as any).map(
      (_, i) => i
    ))
    return {
      getTail: () => tailRef.value,
      updateTail: (count: number) => {
        if (tailContentRef.value !== null) {
          tailContentRef.value.textContent = `${count}牛`
        }
      },
      tailRef,
      tailContentRef,
      items: itemsRef,
      itemCount: itemCountRef
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
          getTail: this.getTail,
          updateTail: this.updateTail,
          items: this.items,
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
          tail: ({
            rest,
            overflow
          }: any) => {
            return h('span', {
              ref: 'tailRef',
              style: {
                position: 'relative',
                display: 'inline-block'
              }
            }, [
              h('span', {
                ref: 'tailContentRef'
              }),
              h('div', {
                style: {
                  position: 'absolute',
                  top: '100%',
                  left: '0'
                }
              }, [
                JSON.stringify(overflow), JSON.stringify(rest)
              ])
            ])
          }
        }
      )
    ])
  }
})
