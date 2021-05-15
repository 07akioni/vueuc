# Virtual List
## Props
|Prop|Type|Default|Description|
|-|-|-|-|
|items|`ItemData[]`|required||
|item-resizable|`boolean`|`false`|Whether the item's height is dynamic.|
|item-size|`number`|required|The height of the item (min-height when `item-resizable` is `true`)|
|show-scrollbar|`boolean`|`true`||
|on-resize|`(entry: ResizeObserverEntry) => any`|`undefined`||
|on-scroll|`(event: UIEvent) => any`|`undefined`||
|key-field|`string`|`'key'`||

## Slots
|Slot|Type|Default|Description|
|-|-|-|-|
|default|`({ item }) => VNode`|required||

## Instance Property
|Name|Type|Default|Description|
|-|-|-|-|
|listRef|`null \| Element`|`null`||
|itemsRef|`null \| Element`|`null`||