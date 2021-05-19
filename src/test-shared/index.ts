import { createApp, Component, App, ComponentPublicInstance } from 'vue'

interface Wrapper {
  app: App
  instance: ComponentPublicInstance
  unmount: () => void
}

interface MountOptions {
  props?: Record<string, any>
  attach?: boolean
}

export function mount (comp: Component, options: MountOptions = {}): Wrapper {
  const { props = {}, attach = false } = options
  const div = document.createElement('div')
  if (attach) {
    document.body.appendChild(div)
  }
  const app = createApp(
    {
      render () {
        return null
      },
      ...comp
    },
    props
  )
  const instance = app.mount(div)
  return {
    app,
    instance,
    unmount: () => {
      app.unmount()
      if (attach) {
        document.body.removeChild(div)
      }
    }
  }
}

export async function sleep (ms: number): Promise<void> {
  return await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function sleepFrame (): Promise<void> {
  return await new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}
