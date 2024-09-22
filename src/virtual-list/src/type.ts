import { VNodeChild } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type ItemData = Record<string, any>

export interface VScrollToOptions extends ScrollToOptions {
  index?: number
  key?: number | string
  position?: 'top' | 'bottom'
  debounce?: boolean
}

export interface VVirtualListColumn extends Record<string, any> {
  key?: number | string
  width: number
}

export type VVirtualListRenderCol = (props: {
  item: ItemData
  column: VVirtualListColumn
  left: number
}) => VNodeChild

export type VVirtualListRenderItemWithCols = (props: {
  itemIndex: number
  startColIndex: number
  endColIndex: number
  allColumns: VVirtualListColumn[]
  item: ItemData
  getLeft: (index: number) => number
}) => VNodeChild
