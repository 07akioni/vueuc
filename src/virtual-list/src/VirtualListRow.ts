import { PropType, VNodeChild, defineComponent, inject } from 'vue'
import { xScrollInjextionKey } from './context'
import { ItemData } from './type'

export const VirtualListRow = defineComponent({
  name: 'VirtualListRow',
  props: {
    index: { type: Number, required: true },
    item: {
      type: Object as PropType<ItemData>,
      required: true
    }
  },
  setup () {
    const { startIndexRef, endIndexRef, columnsRef, getLeft, renderColRef, renderItemWithColsRef } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(xScrollInjextionKey)!
    return {
      startIndex: startIndexRef,
      endIndex: endIndexRef,
      columns: columnsRef,
      renderCol: renderColRef,
      renderItemWithCols: renderItemWithColsRef,
      getLeft
    }
  },
  render () {
    const { startIndex, endIndex, columns, renderCol, renderItemWithCols, getLeft, item } = this

    if (renderItemWithCols != null) {
      return renderItemWithCols({
        itemIndex: this.index,
        startColIndex: startIndex,
        endColIndex: endIndex,
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
