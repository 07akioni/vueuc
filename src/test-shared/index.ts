import {
  createApp,
  Component,
  App,
  ComponentPublicInstance
} from 'vue'

interface Wrapper {
  app: App
  instance: ComponentPublicInstance
  unmount: () => void
}

interface MountOptions {
  props?: Record<string, any>
}

export function mount (comp: Component, options: MountOptions = {}): Wrapper {
  const {
    props = {}
  } = options
  const div = document.createElement('div')
  const app = createApp({
    render () {
      return null
    },
    ...comp
  }, props)
  const instance = app.mount(div)
  return {
    app,
    instance,
    unmount: () => app.unmount(div)
  }
}
