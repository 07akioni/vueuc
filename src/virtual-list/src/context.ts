import { ComputedRef, InjectionKey, Ref } from 'vue'
import { VVirtualListColumn, VVirtualListRenderCol, VVirtualListRenderItemWithCols } from './type'

export const xScrollInjectionKey = 'VVirtualListXScroll' as unknown as InjectionKey<{
  startIndexRef: ComputedRef<number>
  endIndexRef: ComputedRef<number>
  columnsRef: Ref<VVirtualListColumn[]>
  renderColRef: Ref<VVirtualListRenderCol | undefined>
  renderItemWithColsRef: Ref<VVirtualListRenderItemWithCols | undefined>
  getLeft: (index: number) => number
}>
