import { Ref, computed, provide, ref } from 'vue'
import { useMemo } from 'vooks'
import { FenwickTree } from '../../shared'
import type { VVirtualListColumn, VVirtualListRenderCol, VVirtualListRenderItemWithCols } from './type'
import { xScrollInjectionKey } from './context'

export function setupXScroll ({
  columnsRef,
  renderColRef,
  renderItemWithColsRef
}: {
  columnsRef: Ref<VVirtualListColumn[]>
  renderColRef: Ref<VVirtualListRenderCol | undefined>
  renderItemWithColsRef: Ref<VVirtualListRenderItemWithCols | undefined>
}): {
    listWidthRef: Ref<number>
    scrollLeftRef: Ref<number>
  } {
  const listWidthRef = ref(0)
  const scrollLeftRef = ref(0)
  const xFenwickTreeRef = computed(() => {
    const columns = columnsRef.value
    if (columns.length === 0) {
      return null
    }
    const ft = new FenwickTree(columns.length, 0)
    columns.forEach((column, index) => {
      ft.add(index, column.width)
    })
    return ft
  })
  const startIndexRef = useMemo(() => {
    const xFenwickTree = xFenwickTreeRef.value
    if (xFenwickTree !== null) {
      return Math.max(xFenwickTree.getBound(scrollLeftRef.value) - 1, 0)
    } else {
      return 0
    }
  })
  const getLeft = (index: number): number => {
    const xFenwickTree = xFenwickTreeRef.value
    if (xFenwickTree !== null) {
      return xFenwickTree.sum(index)
    } else {
      return 0
    }
  }
  const endIndexRef = useMemo(() => {
    const xFenwickTree = xFenwickTreeRef.value
    if (xFenwickTree !== null) {
      return Math.min(
        xFenwickTree.getBound(scrollLeftRef.value + listWidthRef.value) + 1,
        columnsRef.value.length - 1
      )
    } else {
      return 0
    }
  })
  provide(xScrollInjectionKey, {
    startIndexRef,
    endIndexRef,
    columnsRef,
    renderColRef,
    renderItemWithColsRef,
    getLeft
  })
  return {
    listWidthRef,
    scrollLeftRef
  }
}
