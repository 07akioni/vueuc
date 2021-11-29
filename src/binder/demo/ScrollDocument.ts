import { h, defineComponent } from 'vue'
import { Binder, Follower, Target } from '../src/index'
import { demoProps } from './demo-props'

const TrackedContent = defineComponent({
  render () {
    return h('div', {
      style: {
        height: '100px',
        width: '300px',
        backgroundColor: 'grey'
      }
    })
  }
})

const TrackingContent = defineComponent({
  render () {
    return h('div', {
      style: {
        height: '800px',
        backgroundColor: 'green'
      }
    }, [
      'scroll document scroll document scroll document scroll document scroll document scroll document scroll document scroll document scroll document scroll document scroll document scroll document scroll document scroll document scroll document'
    ])
  }
})

export default defineComponent({
  name: 'ScrollNestedDiv',
  props: demoProps,
  render () {
    return [
      'scroll document div',
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
                flip: this.flip,
                flipLevel: this.flipLevel,
                syncTrigger: this.syncTrigger,
                width: this.useTargetWidth ? 'target' : undefined,
                teleportDisabled: this.teleportDisabled,
                overlap: this.overlap,
                x: this.x,
                y: this.y
              }, {
                default () {
                  return h(TrackingContent)
                }
              })
            ]
          }
        })
      ])
    ]
  }
})
