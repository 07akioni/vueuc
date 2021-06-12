import { defineComponent, h } from 'vue'
import VResizeObserver from '../src'
import { c } from '../../shared'

const styles = c('.resize-observer-demo', [
  c('.resizable', {
    raw: `
      border: 2px solid;
      padding: 20px; 
      width: 300px;
      resize: both;
      overflow: auto;
    `
  })
])

export default defineComponent({
  name: 'ResizeObserverDemo',
  setup () {
    styles.mount({
      id: 'resize-observer-demo'
    })
    return {
      handleResize () {
        console.log('element resize')
      }
    }
  },
  render () {
    return h('div', {
      class: 'resize-observer-demo'
    }, [
      h(VResizeObserver, {
        onResize: this.handleResize
      }, {
        default: () => {
          return h('div', {
            class: 'resizable'
          }, [
            'resizable'
          ])
        }
      })
    ])
  }
})
