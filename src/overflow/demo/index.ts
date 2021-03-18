import { defineComponent, h, ref } from 'vue'
import { VOverflow } from '../../index'

export default defineComponent({
  setup () {
    const tailRef = ref<HTMLElement | null>(null)
    return {
      getTail: () => tailRef.value,
      updateTail: (count: number) => {
        if (tailRef.value !== null) {
          tailRef.value.textContent = `${count}牛`
        }
      },
      tailRef,
      itemCount: ref(3)
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
            return Array.apply(null, { length: this.itemCount } as any).map(
              (_, i) =>
                h(
                  'div',
                  {
                    style: {
                      display: 'inline-block',
                      border: '1px solid yellow',
                      width: '30px'
                    }
                  },
                  [i + 1]
                )
            )
          }
        }
      ),
      h(
        VOverflow,
        {
          getTail: this.getTail,
          updateTail: this.updateTail,
          style: {
            width: '120px',
            background: 'grey'
          }
        },
        {
          default: () => {
            return Array.apply(null, { length: this.itemCount } as any).map(
              (_, i) =>
                h(
                  'div',
                  {
                    style: {
                      display: 'inline-block',
                      border: '1px solid yellow',
                      width: '30px'
                    }
                  },
                  [i + 1]
                )
            )
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
