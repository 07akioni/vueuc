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
|default|`({ item, index }) => VNode`|required||