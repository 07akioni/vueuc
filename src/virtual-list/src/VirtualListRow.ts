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
    const { startIndexRef, endIndexRef, columnsRef, getLeft, renderColRef, renderColsForRowRef } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(xScrollInjextionKey)!
    return {
      startIndex: startIndexRef,
      endIndex: endIndexRef,
      columns: columnsRef,
      renderCol: renderColRef,
      renderColsForRow: renderColsForRowRef,
      getLeft
    }
  },
  render () {
    const { startIndex, endIndex, columns, renderCol, renderColsForRow, getLeft, item } = this

    if (renderColsForRow != null) {
      return renderColsForRow({
        startIndex,
        endIndex,
        allColumns: columns,
        item,
        getLeft
      })
    }

    if (renderCol != null) {
      const items: VNodeChild[] = []
      for (let i = startIndex; i <= endIndex; ++i) {
        const column = columns[i]
        items.push(renderCol({ column, left: getLeft(i), item }))
      }
      return items
    }

    return null
  }
})
