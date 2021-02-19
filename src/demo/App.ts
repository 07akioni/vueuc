import { defineComponent, h, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { c } from '../shared'

const styles = c([
  `
  body {
    font-family: sans-serif;
    font-size: 14px;
  }
  `
])

export default defineComponent({
  name: 'VueucDemo',
  setup () {
    onMounted(() => styles.mount({ target: 'vdemo' }))
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
            ),
            h('li',
              [h(RouterLink, {
                to: '/binder'
              }, {
                default: () => 'Binder'
              })]
            ),
            h('li',
              [h(RouterLink, {
                to: '/x-scroll'
              }, {
                default: () => 'XScroll'
              })]
            )
          ])
        ]),
        h('div', {
          style: {
            flex: 1,
            overflow: 'hidden',
            paddingLeft: '24px'
          }
        }, [
          h(RouterView)
        ])
      ])
    }
  }
})
