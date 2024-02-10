import { PropType, VNodeChild, defineComponent, inject } from 'vue'
import { xScrollInjextionKey } from './context'
import { ItemData } from './type'

export const VirtualListRow = defineComponent({
  name: 'VirtualListRow',
  props: {
    item: {
      type: Object as PropType<ItemData>,
      required: true
    }
  },
  setup () {
    const { startIndexRef, endIndexRef, columnsRef, getLeft, renderCellRef } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(xScrollInjextionKey)!
    return {
      startIndex: startIndexRef,
      endIndex: endIndexRef,
      columns: columnsRef,
      renderCell: renderCellRef,
      getLeft
    }
  },
  render () {
    const { startIndex, endIndex, columns, renderCell, getLeft, item } = this
    if (renderCell == null) return null
    const items: VNodeChild[] = []
    for (let i = startIndex; i <= endIndex; ++i) {
      const column = columns[i]
      items.push(renderCell({ column, left: getLeft(i), item }))
    }
    return items
  }
})
