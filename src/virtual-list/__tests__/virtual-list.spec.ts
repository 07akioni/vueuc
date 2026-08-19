import { describe, expect, it } from 'vitest'
import { VirtualList } from '@/index'
import { mount, sleepFrame } from '@/test-shared'
import {
  App,
  defineComponent,
  h,
  KeepAlive,
  nextTick,
  onActivated,
  ref,
  version as vueVersion
} from 'vue'

interface Item {
  key: number
  value: number
}

function createItems (length: number): Item[] {
  return Array.from({ length }, (_, i) => ({ key: i, value: i }))
}

function renderItem ({ item }: { item: Item }): ReturnType<typeof h> {
  return h(
    'div',
    {
      key: item.key,
      class: 'vl-item',
      style: { height: '34px' }
    },
    [String(item.value)]
  )
}

async function flushUi (): Promise<void> {
  await nextTick()
  await sleepFrame()
  await nextTick()
  await sleepFrame()
}

function collectVueErrors (app: App): unknown[] {
  const errors: unknown[] = []
  app.config.errorHandler = (err, _instance, info) => {
    errors.push({ err, info, message: err instanceof Error ? err.message : String(err) })
  }
  return errors
}

describe('virtual-list', () => {
  it(`runs on vue ${vueVersion}`, () => {
    expect(vueVersion).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('mounts with empty items', () => {
    const wrapper = mount(VirtualList, {
      props: {
        items: [],
        itemSize: 34
      }
    })
    wrapper.unmount()
  })

  it('should not throw when VirtualList is reactivated inside keep-alive', async () => {
    const showRef = ref(true)
    const items = createItems(20)
    const wrapper = mount(
      defineComponent({
        setup () {
          return { show: showRef }
        },
        render () {
          return h(KeepAlive, null, {
            default: () =>
              this.show === true
                ? h(
                  VirtualList,
                  {
                    items,
                    itemSize: 34,
                    style: { height: '200px' }
                  },
                  { default: renderItem }
                )
                : null
          })
        }
      }),
      { attach: true }
    )
    const errors = collectVueErrors(wrapper.app)
    await flushUi()
    showRef.value = false
    await flushUi()
    showRef.value = true
    await flushUi()
    expect(errors).toEqual([])
    wrapper.unmount()
  })

  it('should not throw when a keep-alive host remounts VirtualList (App3 pattern)', async () => {
    const showRef = ref(true)
    const items = createItems(40)
    const listElOnActivated: Array<HTMLElement | null | undefined> = []
    const ListHost = defineComponent({
      name: 'ListHost',
      setup () {
        const listRef = ref<{ listElRef?: HTMLElement | null } | null>(null)
        onActivated(() => {
          listElOnActivated.push(listRef.value?.listElRef ?? null)
        })
        return { listRef }
      },
      render () {
        return h(
          VirtualList,
          {
            ref: 'listRef',
            items,
            itemSize: 34,
            itemResizable: true,
            style: { height: '200px' }
          },
          { default: renderItem }
        )
      }
    })
    const wrapper = mount(
      defineComponent({
        setup () {
          return { show: showRef }
        },
        render () {
          return h(KeepAlive, null, {
            default: () => (this.show === true ? h(ListHost) : null)
          })
        }
      }),
      { attach: true }
    )
    const errors = collectVueErrors(wrapper.app)
    await flushUi()
    const rootEl = wrapper.instance.$el as HTMLElement | undefined
    if (rootEl != null && typeof rootEl.querySelector === 'function') {
      const listEl = rootEl.querySelector('.v-vl')
      if (listEl instanceof HTMLElement) {
        listEl.scrollTop = 120
      }
    }
    await flushUi()
    showRef.value = false
    await flushUi()
    showRef.value = true
    await flushUi()
    expect(errors).toEqual([])
    expect(listElOnActivated.length).toBeGreaterThan(1)
    expect(listElOnActivated.slice(1).every((el) => el != null)).toBe(true)
    wrapper.unmount()
  })

  it('should not throw when keep-alive switches between two lists', async () => {
    const showFirst = ref(true)
    const items = createItems(20)
    const FirstList = defineComponent({
      name: 'FirstList',
      render () {
        return h(
          VirtualList,
          {
            items,
            itemSize: 34,
            style: { height: '200px' }
          },
          { default: renderItem }
        )
      }
    })
    const SecondList = defineComponent({
      name: 'SecondList',
      render () {
        return h(
          VirtualList,
          {
            items,
            itemSize: 34,
            style: { height: '200px' }
          },
          { default: renderItem }
        )
      }
    })
    const wrapper = mount(
      defineComponent({
        setup () {
          return { showFirst }
        },
        render () {
          return h(KeepAlive, null, {
            default: () => (this.showFirst === true ? h(FirstList) : h(SecondList))
          })
        }
      }),
      { attach: true }
    )
    const errors = collectVueErrors(wrapper.app)
    await flushUi()
    showFirst.value = false
    await flushUi()
    showFirst.value = true
    await flushUi()
    expect(errors).toEqual([])
    wrapper.unmount()
  })
})
