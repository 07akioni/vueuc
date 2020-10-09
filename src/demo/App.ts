import { defineComponent, h } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

export default defineComponent({
  name: 'VueucDemo',
  setup () {
    return () => {
      return h('main', {
        style: {
          display: 'flex'
        }
      }, [
        h('aside', {
          style: {
            paddingRight: '24px',
            borderRight: '1px solid grey'
          }
        }, [
          h('ul', [
            h('li',
              [h(RouterLink, {
                to: '/virtual-list'
              }, {
                default: () => 'Virtual List'
              })]
            ),
            h('li',
              [h(RouterLink, {
                to: '/resize-observer'
              }, {
                default: () => 'Resize Observer'
              })]
            )
          ])
        ]),
        h('div', {
          style: {
            flex: 1,
            paddingLeft: '24px'
          }
        }, [
          h(RouterView)
        ])
      ])
    }
  }
})
