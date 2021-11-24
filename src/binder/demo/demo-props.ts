import { PropType } from 'vue'
import type { Placement, FlipLevel } from '../src/interface'

export const demoProps = {
  placement: {
    type: String as PropType<Placement>
  },
  show: {
    type: Boolean
  },
  syncTrigger: {
    type: Array as PropType<Array<'scroll' | 'resize'>>
  },
  flipLevel: {
    type: Number as PropType<FlipLevel>
  },
  useTargetWidth: {
    type: Boolean
  },
  teleportDisabled: {
    type: Boolean
  },
  x: {
    type: Number
  },
  y: {
    type: Number
  },
  overlap: {
    type: Boolean
  }
} as const
