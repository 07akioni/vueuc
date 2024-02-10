import { ComputedRef, InjectionKey, Ref } from 'vue'
import { VVirtualListColumn, VVirtualListRenderCell } from './type'

export const xScrollInjextionKey = 'VVirtualListXScroll' as unknown as InjectionKey<{
  startIndexRef: ComputedRef<number>
  endIndexRef: ComputedRef<number>
  columnsRef: Ref<VVirtualListColumn[]>
  renderCellRef: Ref<VVirtualListRenderCell | undefined>
  getLeft: (index: number) => number
}>
