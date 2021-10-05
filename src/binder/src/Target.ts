/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { defineComponent, inject, withDirectives } from 'vue'
import { BinderInstance } from './interface'
import { getFirstVNode } from '../../shared/v-node'

export default defineComponent({
  name: 'Target',
  setup () {
    const { setTargetRef, syncTarget } = inject<BinderInstance>('VBinder')!
    const setTargetDirective = {
      mounted: setTargetRef,
      updated: setTargetRef
    }
    return {
      syncTarget,
      setTargetDirective
    }
  },
  render () {
    const { syncTarget, setTargetDirective } = this
    /**
     * If you are using VBinder as a child of VBinder, the children wouldn't be
     * a valid DOM or component that can be attached to by directive.
     * So we won't sync target on those kind of situation and control the
     * target sync logic manually.
     */
    if (syncTarget) {
      return withDirectives(getFirstVNode(this.$slots), [[setTargetDirective]])
    }
    return getFirstVNode(this.$slots)
  }
})
