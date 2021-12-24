import { h, defineComponent, ref } from 'vue'
import { FocusLocker } from '../../index'

export default defineComponent({
  setup () {
    const showRef = ref(false)
    return () => {
      return h('div', null, [
        h('button', {
          onClick: () => {
            showRef.value = !showRef.value
          }
        }, [
          'active:',
          JSON.stringify(showRef.value)
        ]),
        h(
          FocusLocker,
          {
            active: showRef.value,
            focusFirstDescendant: true
          },
          {
            default: () => {
              return [
                h('div', {
                  style: 'padding: 12px; background: #00aa0033;'
                }, [
                  h('input'),
                  h('input'),
                  h('input'),
                  h('input'),
                  h('button', {}, [
                    'test'
                  ])
                ])
              ]
            }
          }
        )
      ])
    }
  }
})
