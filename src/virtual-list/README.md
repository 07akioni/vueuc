# Virtual List
## Props
|Prop|Type|Default|Description|
|-|-|-|-|
|items|`ItemData[]`|required||
|item-size|`number`|required||
|show-scrollbar|`boolean`|`true`||
|on-resize|`(entry: ResizeObserverEntry) => any`|`undefined`||
|on-scroll|`(event: UIEvent) => any`|`undefined`||
## Slots
|Slot|Type|Default|Description|
|-|-|-|-|
|default|`({ item }) => VNode`|required||
## Instance Property
|Name|Type|Default|Description|
|-|-|-|-|
|listRef|`null \| Element`|`null`||
|itemsRef|`null \| Element`|`null`||