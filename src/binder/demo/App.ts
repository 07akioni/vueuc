import { defineComponent, h, Fragment, ref, computed } from 'vue'
import { Placement } from '../src/interface'
import PlacementGroup from './PlacementGroup'
import ScrollDocument from './ScrollDocument'
import ScrollNestedDiv from './ScrollNestedDiv'

export default defineComponent({
  name: 'BinderDemo',
  setup () {
    const syncOnResizeRef = ref(false)
    const syncOnScrollRef = ref(false)
    return {
      showPart: ref('document'),
      // demo
      placement: ref<Placement>('bottom'),
      position: ref<'absolute' | 'fixed'>('fixed'),
      show: ref(false),
      teleportDisabled: ref(false),
      syncOnResize: syncOnResizeRef,
      syncOnScroll: syncOnScrollRef,
      flip: ref(false),
      shift: ref(false),
      useTargetWidth: ref(false),
      x: ref<number | undefined>(undefined),
      y: ref<number | undefined>(undefined),
      overlap: ref(false),
      syncTrigger: computed<Array<'scroll' | 'resize'>>(() => {
        const triggers: Array<'scroll' | 'resize'> = []
        if (syncOnResizeRef.value) {
          triggers.push('resize')
        }
        if (syncOnScrollRef.value) {
          triggers.push('scroll')
        }
        return triggers
      })
    }
  },
  render () {
    const followerProps = {
      placement: this.placement,
      show: this.show,
      syncTrigger: this.syncTrigger,
      flip: this.flip,
      shift: this.shift,
      useTargetWidth: this.useTargetWidth,
      teleportDisabled: this.teleportDisabled,
      x: this.x,
      y: this.y,
      overlap: this.overlap
    }
    return h(Fragment, [
      h(
        'button',
        {
          onClick: () => {
            this.showPart === 'document'
              ? (this.showPart = 'nested')
              : (this.showPart = 'document')
          }
        },
        ['scroll: ', this.showPart]
      ),
      h(
        'button',
        {
          onClick: () => {
            this.flip = !this.flip
          }
        },
        ['flip: ', this.flip.toString()]
      ),
      h(
        'button',
        {
          onClick: () => {
            this.shift = !this.shift
          }
        },
        ['shift: ', this.shift.toString()]
      ),
      h(
        'button',
        {
          onClick: () => {
            this.teleportDisabled = !this.teleportDisabled
          }
        },
        ['teleport disabled: ', this.teleportDisabled.toString()]
      ),
      h(
        'button',
        {
          onClick: () => {
            this.useTargetWidth = !this.useTargetWidth
          }
        },
        ['use target width: ', this.useTargetWidth.toString()]
      ),
      h(
        'button',
        {
          onClick: () => {
            this.show = !this.show
          }
        },
        ['show: ', this.show.toString()]
      ),
      h(
        'button',
        {
          onClick: () => {
            if (this.x === 100) {
              this.x = undefined
              this.y = undefined
            } else {
              this.x = 100
              this.y = 100
            }
          }
        },
        ['x=100 & y=100: ', (this.x === 100).toString()]
      ),
      h(
        'button',
        {
          onClick: () => {
            this.syncOnResize = !this.syncOnResize
          }
        },
        ['syncOnResize: ', this.syncOnResize.toString()]
      ),
      h(
        'button',
        {
          onClick: () => {
            this.syncOnScroll = !this.syncOnScroll
          }
        },
        ['syncOnScroll: ', this.syncOnScroll.toString()]
      ),
      h(
        'button',
        {
          onClick: () => {
            this.overlap = !this.overlap
          }
        },
        ['overlap: ', this.overlap.toString()]
      ),
      h(PlacementGroup, {
        placement: this.placement,
        onChange: (placement: Placement) => {
          this.placement = placement
        }
      }),
      this.showPart === 'document'
        ? h(ScrollDocument, followerProps)
        : h(ScrollNestedDiv, followerProps)
    ])
  }
})
