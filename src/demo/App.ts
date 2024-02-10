import { defineComponent, h } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { c } from '../shared'

const styles = c([`body {
  font-family: sans-serif;
  font-size: 14px;
}`])

export default defineComponent({
  name: 'VueucDemo',
  setup () {
    styles.mount({ id: 'vdemo' })
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
                to: '/virtual-list-1'
              }, {
                default: () => 'Virtual List(fixed height)'
              })]
            ),
            h('li',
              [h(RouterLink, {
                to: '/virtual-list-2'
              }, {
                default: () => 'Virtual List(dynamic height)'
              })]
            ),
            h('li',
              [h(RouterLink, {
                to: '/virtual-list-3'
              }, {
                default: () => 'Virtual List(keep alive)'
              })]
            ),
            h('li',
              [h(RouterLink, {
                to: '/virtual-list-4'
              }, {
                default: () => 'Virtual List(x-scroll)'
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
            ),
            h('li',
              [h(RouterLink, {
                to: '/overflow'
              }, {
                default: () => 'Overflow'
              })]
            ),
            h('li', [
              h(RouterLink, {
                to: '/focus-trap'
              }, {
                default: () => 'FocusTrap'
              })
            ])
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
