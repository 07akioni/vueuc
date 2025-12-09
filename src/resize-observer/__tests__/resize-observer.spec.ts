import { mount } from '@/test-shared'
import { defineComponent, h } from 'vue'
import { VResizeObserver } from '../..'
import { vi } from 'vitest'

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
    const el = (wrapper.instance.$refs.cool as HTMLElement)
    Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 200 })
    Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 200 })
    await vi.waitFor(() => {
      expect(resizeCount).toEqual(1)
    })
    el.style.width = '300px'
    Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 300 })
    await vi.waitFor(() => {
      expect(resizeCount).toEqual(2)
    })
    wrapper.unmount()
  })
})
