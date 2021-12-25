import { h, defineComponent, ref, Teleport } from 'vue'
import { FocusLocker } from '../../index'

const modalStyle = 'position: fixed; left: 100px; top: 100px;'

export default defineComponent({
  setup () {
    const showRef = ref(false)
    const show2Ref = ref(false)
    return () => {
      return h('div', null, [
        h(
          'button',
          {
            onClick: () => {
              showRef.value = !showRef.value
            }
          },
          ['active:', JSON.stringify(showRef.value)]
        ),
        h(Teleport as any, { to: 'body' }, [
          showRef.value
            ? h('div', { style: modalStyle }, [
              h(
                FocusLocker,
                {
                  active: showRef.value,
                  focusFirstDescendant: true
                },
                {
                  default: () => {
                    return [
                      h(
                        'div',
                        {
                          style: 'padding: 12px; background: #00aa0033;'
                        },
                        [
                          '111',
                          h('input'),
                          h('input'),
                          h('input'),
                          h('input'),
                          h(
                            'button',
                            {
                              onClick: () =>
                                (showRef.value = !showRef.value)
                            },
                            ['close1']
                          ),
                          h(
                            'button',
                            {
                              onClick: () =>
                                (show2Ref.value = !show2Ref.value)
                            },
                            ['open2']
                          )
                        ]
                      )
                    ]
                  }
                }
              )
            ])
            : null
        ]),
        h(Teleport as any, { to: 'body' }, [
          show2Ref.value
            ? h('div', {
              style: modalStyle
            }, [
              h(
                FocusLocker,
                {
                  active: show2Ref.value,
                  focusFirstDescendant: true
                },
                {
                  default: () => {
                    return [
                      h(
                        'div',
                        {
                          style: 'padding: 12px; background: #00aa0033;'
                        },
                        [
                          '111',
                          h('input'),
                          h('input'),
                          h('input'),
                          h('input'),
                          h(
                            'button',
                            {
                              onClick: () =>
                                (show2Ref.value = !show2Ref.value)
                            },
                            ['close']
                          )
                        ]
                      )
                    ]
                  }
                }
              )
            ])
            : null
        ])
      ])
    }
  }
})
