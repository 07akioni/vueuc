# Vueuc
[![codecov](https://codecov.io/gh/07akioni/vueuc/branch/main/graph/badge.svg)](https://codecov.io/gh/07akioni/vueuc)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/07akioni/vueuc.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/07akioni/vueuc/alerts/)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://img.shields.io/badge/license-MIT-blue)

Util Components for Vue.
## Preview
[https://vueuc.vercel.app](https://vueuc.vercel.app)

## Components
### VBinder
Includes `v-binder`, `v-follower` and `v-target`.

Content in `v-follower` will track `v-target`. Use `v-binder` to wrap 1 `v-target` and 1 or more `v-target`.

For more API please read the source code. I'm too lazy to write them since I'm the only one that uses the library.

```tsx
<v-binder>
  <v-target>
    <target-element />
  </v-target>
  <v-follower show placement="top">
    <follwer-element-1 />
  <v-follower>
  <v-follower show placement="bottom">
    <follwer-element-1 />
  <v-follower>
</v-binder>
```

### VVirtialList
A simple virtual list which supports flexable-height items

### VXScroll
All content inside it to be scroll in X direction when you wheel at Y direction.

### VResizeObserver
```html
<v-resize-observer :on-resize="handleResize">
  <el />
</v-resize-observer>
```

