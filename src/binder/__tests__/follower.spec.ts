import { describe, expect, it } from 'vitest'
import { mount, sleepFrame } from '@/test-shared'
import { defineComponent, h } from 'vue'
import { Binder, Target, Follower } from '@/index'

interface MountedFollower {
  unmount: () => void
  contentEl: HTMLElement
  buttonEl: HTMLButtonElement
  hiddenWrapEl: HTMLElement
  hiddenSvgEl: SVGSVGElement
}

async function mountFollower (): Promise<MountedFollower> {
  const wrapper = mount(
    defineComponent({
      render () {
        return h(Binder, null, {
          default: () => [
            h(Target, null, {
              default: () =>
                h(
                  'button',
                  {
                    style: {
                      position: 'fixed',
                      left: '10px',
                      top: '10px',
                      width: '50px',
                      height: '20px'
                    }
                  },
                  'target'
                )
            }),
            h(
              Follower,
              { show: true, placement: 'bottom-start' },
              {
                default: () =>
                  h(
                    'div',
                    {
                      id: 'test-follower-content',
                      style: { width: '120px' }
                    },
                    [
                      h(
                        'button',
                        {
                          id: 'test-follower-button',
                          style: {
                            display: 'block',
                            width: '120px',
                            height: '40px'
                          }
                        },
                        'content'
                      ),
                      h(
                        'div',
                        {
                          id: 'test-follower-hidden-wrap',
                          style: {
                            visibility: 'hidden',
                            width: '120px',
                            height: '40px'
                          }
                        },
                        [
                          h(
                            'svg',
                            {
                              id: 'test-follower-hidden-svg',
                              width: 120,
                              height: 40
                            },
                            [h('rect', { width: 120, height: 40, fill: 'red' })]
                          )
                        ]
                      )
                    ]
                  )
              }
            )
          ]
        })
      }
    }),
    { attach: true }
  )
  await sleepFrame()
  await sleepFrame()
  return {
    unmount: wrapper.unmount,
    contentEl: document.getElementById('test-follower-content')!,
    buttonEl: document.getElementById(
      'test-follower-button'
    ) as HTMLButtonElement,
    hiddenWrapEl: document.getElementById('test-follower-hidden-wrap')!,
    hiddenSvgEl: document.getElementById(
      'test-follower-hidden-svg'
    ) as unknown as SVGSVGElement
  }
}

describe('binder', () => {
  it('keeps follower content interactive', async () => {
    const { unmount, contentEl, buttonEl } = await mountFollower()
    // container has `pointer-events: none`, content should override it
    expect(getComputedStyle(contentEl).pointerEvents).toEqual('auto')
    const rect = buttonEl.getBoundingClientRect()
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    )
    expect(hit).toBe(buttonEl)
    unmount()
  })

  it('does not make hidden svg inside follower content interactive', async () => {
    const { unmount, contentEl, hiddenWrapEl, hiddenSvgEl } =
      await mountFollower()
    // `pointer-events: all` is inherited by svg and would ignore visibility
    expect(getComputedStyle(hiddenSvgEl).pointerEvents).not.toEqual('all')
    const rect = contentEl.getBoundingClientRect()
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.bottom - 20
    )
    expect(hit !== null).toBe(true)
    expect(hiddenWrapEl.contains(hit)).toBe(false)
    unmount()
  })
})
