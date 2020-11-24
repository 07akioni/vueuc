## Case1
```html
<v-binder :show="true" :enabled="displayed">
  <template #target>
    <v-binder :show="false" :enabled="">
      <template #target>
        <n-selection />
      </template>
      <v-transition>
        <n-select-menu v-if="true"/>
      </v-transition>
    </v-binder>
  </template>
  <v-transition>
    <n-cascader-menu v-if="true"/>
  </v-transition>
</v-binder>
```

```html
<n-selection ref="targetRef" />
<v-follower :show="xxx" :target="targetRef">
  <transition>
    <n-select-menu v-if="true"/>
  </transition>
</v-follower>
<v-follower :show="xxx" :target="targetRef">
  <transition>
    <n-select-menu v-if="true"/>
  </transition>
</v-follower>
```

## Case2
```html
<v-binder
  :enabled="{
    'follower-1': true,
    'follower-2': true
  }"
  :show="{
    'follower-1': true,
    'follower-2': true
  }"
  :placement="{
    'follower-1': true,
    'follower-2': true
  }"
>
  <template #target>
    <n-selection />
  </template>
  <template #follower-1>
  </template>
  <template #follower-2>
  </template>
</v-binder>
```

```js
function useFollow ({
  targetRef,
  followerRef,
  enabledRef,
  
}) {

}

const 
```

```html
<v-binder>
  <v-target>
    <v-selection />
  <v-target>
  <v-follower>
    <v-menu-a />
  </v-follower>
  <v-follower>
    <v-menu-b />
  </v-follower>
</v-binder>
```