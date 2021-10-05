/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { defineComponent, inject, withDirectives } from 'vue'
import { BinderInstance } from './interface'
import { getFirstVNode } from '../../shared/v-node'

export default defineComponent({
  name: 'Target',
  setup () {
    const { setTargetRef, syncTargetOnMounted } =
      inject<BinderInstance>('VBinder')!
    const setTargetDirective = {
      mounted: setTargetRef,
      updated: setTargetRef
    }
    return {
      syncTargetOnMounted,
      setTargetDirective
    }
  },
  render () {
    const { syncTargetOnMounted, setTargetDirective } = this
    if (syncTargetOnMounted) {
      return withDirectives(getFirstVNode(this.$slots), [[setTargetDirective]])
    }
    return getFirstVNode(this.$slots)
  }
})
