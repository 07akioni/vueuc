import { VirtualList } from '@/index'
import { mount } from '@/test-shared/index'

describe('virtual-list', () => {
  it('needs tests', () => {
    mount(VirtualList, {
      props: {
        items: [],
        itemSize: 34
      }
    })
    expect('').toEqual('')
  })
})
