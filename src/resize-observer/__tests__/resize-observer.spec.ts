import { mount, sleepFrame } from '@/test-shared'
import { defineComponent, h } from 'vue'
import { VResizeObserver } from '../..'

describe('resize-observer', () => {
  it('works', async () => {
    let resizeCount = 0
    const onResize = (): void => {
      resizeCount++
    }
    const wrapper = mount(
      defineComponent({
        render () {
          return h(
            VResizeObserver,
            {
              onResize
            },
            {
              default: () =>
                h('div', {
                  ref: 'cool',
                  style: {
                    width: '200px',
                    height: '200px'
                  }
                })
            }
          )
        }
      }),
      { attach: true }
    )
    await sleepFrame()
    await sleepFrame()
    expect(resizeCount).toEqual(1);
    (wrapper.instance.$refs.cool as any).style.width = '300px'
    await sleepFrame()
    await sleepFrame()
    expect(resizeCount).toEqual(2)
    wrapper.unmount()
  })
})
