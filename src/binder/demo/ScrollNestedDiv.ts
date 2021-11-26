import { h, defineComponent } from 'vue'
import { Binder, Follower, Target } from '../src/index'
import { demoProps } from './demo-props'

const TrackedContent = defineComponent({
  render () {
    return h('div', {
      style: {
        marginTop: '400px',
        height: '100px',
        width: '600px',
        backgroundColor: 'grey'
      }
    })
  }
})

const TrackingContent = defineComponent({
  render () {
    return h('div', {
      style: {
        height: '400px',
        backgroundColor: 'green'
      }
    },
    [
      'scroll nested scroll nested scroll nested scroll nested scroll nested scroll nested scroll nested'
    ])
  }
})

export default defineComponent({
  name: 'ScrollNestedDiv',
  props: demoProps,
  render () {
    return [
      'scroll nested div',
      h('div', {
        style: {
          height: '1000px',
          border: '1px solid black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexFlow: 'column'
        }
      }, [
        h('div', {
          style: {
            height: '800px',
            border: '1px solid black',
            overflow: 'auto'
          }
        }, [
          h('div', {
            style: {
              height: '2000px'
            }
          }, [
            h(Binder, null, {
              default: () => {
                return [
                  h(Target, null, {
                    default () {
                      return h(TrackedContent)
                    }
                  }),
                  h(Follower, {
                    show: this.show,
                    placement: this.placement,
                    syncTrigger: this.syncTrigger,
                    flip: this.flip,
                    flipLevel: this.flipLevel,
                    width: this.useTargetWidth ? 'target' : undefined,
                    teleportDisabled: this.teleportDisabled,
                    x: this.x,
                    y: this.y,
                    overlap: this.overlap
                  }, {
                    default () {
                      return h(TrackingContent)
                    }
                  })
                ]
              }
            })
          ])
        ])
      ])
    ]
  }
})
