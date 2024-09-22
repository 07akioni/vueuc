import { ComputedRef, InjectionKey, Ref } from 'vue'
import { VVirtualListColumn, VVirtualListRenderCol, VVirtualListRenderColsForRow } from './type'

export const xScrollInjextionKey = 'VVirtualListXScroll' as unknown as InjectionKey<{
  startIndexRef: ComputedRef<number>
  endIndexRef: ComputedRef<number>
  columnsRef: Ref<VVirtualListColumn[]>
  renderColRef: Ref<VVirtualListRenderCol | undefined>
  renderColsForRowRef: Ref<VVirtualListRenderColsForRow | undefined>
  getLeft: (index: number) => number
}>
