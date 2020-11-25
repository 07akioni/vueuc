import { h, defineComponent, PropType } from 'vue'
import { Binder, Follower, Target } from '../src/index'
import { Placement } from '../src/interface'

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
        height: '400px',
        backgroundColor: 'green'
      }
    }, [
      'scroll document scroll document scroll document scroll document scroll document scroll document scroll document'
    ])
  }
})

export default defineComponent({
  name: 'ScrollNestedDiv',
  props: {
    placement: {
      type: String as PropType<Placement>
    },
    show: {
      type: Boolean
    },
    syncTrigger: {
      type: Array as PropType<Array<'scroll' | 'resize'>>
    },
    flip: {
      type: Boolean
    },
    useTargetWidth: {
      type: Boolean
    }
  },
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
                syncTrigger: this.syncTrigger,
                width: this.useTargetWidth ? 'target' : undefined
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
