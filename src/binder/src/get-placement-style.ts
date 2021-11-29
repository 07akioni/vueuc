import { Placement, FlipLevel, NonCenterPlacement, Rect, Align, Position, TransformOrigin } from './interface'

const oppositionPositions: Record<Position, Position> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left'
}

const oppositeAligns: Record<Align, Align> = {
  start: 'end',
  center: 'center',
  end: 'start'
}

const propToCompare: Record<Position, 'width' | 'height'> = {
  top: 'height',
  bottom: 'height',
  left: 'width',
  right: 'width'
}

const transformOrigins: Record<Placement, TransformOrigin> = {
  'bottom-start': 'top left',
  bottom: 'top center',
  'bottom-end': 'top right',
  'top-start': 'bottom left',
  top: 'bottom center',
  'top-end': 'bottom right',
  'right-start': 'top left',
  right: 'center left',
  'right-end': 'bottom left',
  'left-start': 'top right',
  left: 'center right',
  'left-end': 'bottom right'
}

const overlapTransformOrigin: Record<Placement, TransformOrigin> = {
  'bottom-start': 'bottom left',
  bottom: 'bottom center',
  'bottom-end': 'bottom right',
  'top-start': 'top left',
  top: 'top center',
  'top-end': 'top right',
  'right-start': 'top right',
  right: 'center right',
  'right-end': 'bottom right',
  'left-start': 'top left',
  left: 'center left',
  'left-end': 'bottom left'
}

const oppositeAlignCssPositionProps: Record<NonCenterPlacement, Position> = {
  'bottom-start': 'right',
  'bottom-end': 'left',
  'top-start': 'right',
  'top-end': 'left',
  'right-start': 'bottom',
  'right-end': 'top',
  'left-start': 'bottom',
  'left-end': 'top'
}

// const keepOffsetDirection: Record<Position, boolean> = {
//   top: true, // top++
//   bottom: false, // top--
//   left: true, // left++
//   right: false // left--
// }

const cssPositionToOppositeAlign: Record<Position, Align> = {
  top: 'end',
  bottom: 'start',
  left: 'end',
  right: 'start'
}

interface PlacementAndOffset {
  top: number
  left: number
  placement: Placement
}

export function getPlacementAndOffsetOfFollower (
  placement: Placement,
  targetRect: Rect,
  followerRect: Rect,
  flipLevel: FlipLevel,
  flip: boolean,
  overlap: boolean
): PlacementAndOffset {
  if (!flip || overlap) {
    return { placement: placement, top: 0, left: 0 }
  }
  const [position, align] = placement.split('-') as [Position, Align]
  let properAlign = align ?? 'center'
  const left = 0
  const top = 0

  // TODO: fix it
  // calculate offset
  // const deriveOffset = (
  //   oppositeAlignCssSizeProp: 'width' | 'height',
  //   currentAlignCssPositionProp: Position,
  //   offsetVertically: boolean
  // ): void => {
  //   if (flipLevel < 2) return
  //   const diff = followerRect[oppositeAlignCssSizeProp] - targetRect[currentAlignCssPositionProp] - targetRect[oppositeAlignCssSizeProp]
  //   if (diff) {
  //     if (offsetVertically) {
  //       top = keepOffsetDirection[currentAlignCssPositionProp] ? diff : -diff
  //     } else {
  //       left = keepOffsetDirection[currentAlignCssPositionProp] ? diff : -diff
  //     }
  //   }
  // }
  // const offsetVertically = position === 'left' || position === 'right'

  // choose proper placement for non-center align
  if (properAlign !== 'center') {
    const oppositeAlignCssPositionProp = oppositeAlignCssPositionProps[placement as NonCenterPlacement]
    const currentAlignCssPositionProp = oppositionPositions[oppositeAlignCssPositionProp]
    const oppositeAlignCssSizeProp = propToCompare[oppositeAlignCssPositionProp]
    // if follower rect is larger than target rect in align direction
    //           [ target ]
    //           [     follower     ]
    // [     follower     ] <---->
    if (followerRect[oppositeAlignCssSizeProp] > targetRect[oppositeAlignCssSizeProp]) {
      if (
        // current space is not enough
        targetRect[oppositeAlignCssPositionProp] + targetRect[oppositeAlignCssSizeProp] < followerRect[oppositeAlignCssSizeProp]
      ) {
        const followerOverTargetSize = (followerRect[oppositeAlignCssSizeProp] - targetRect[oppositeAlignCssSizeProp]) / 2
        if ((targetRect[oppositeAlignCssPositionProp] < followerOverTargetSize) || (targetRect[currentAlignCssPositionProp] < followerOverTargetSize)) {
          // opposite align has larger space
          if (targetRect[oppositeAlignCssPositionProp] < targetRect[currentAlignCssPositionProp]) {
            properAlign = oppositeAligns[align]
          }
          // TODO: fix it
          // deriveOffset(oppositeAlignCssSizeProp, oppositeAlignCssPositionProp, offsetVertically)
        } else {
          // 'center' align is better
          properAlign = 'center'
        }
      }
    }
    // if follower rect is smaller than target rect in align direction
    // [     target     ]
    // [ follower ]         <---->
    else if (followerRect[oppositeAlignCssSizeProp] < targetRect[oppositeAlignCssSizeProp]) {
      // TODO: maybe center is better
      if (
        targetRect[currentAlignCssPositionProp] < 0 &&
        // opposite align has larger space
        targetRect[oppositeAlignCssPositionProp] > targetRect[currentAlignCssPositionProp]
      ) {
        properAlign = oppositeAligns[align]
      }
    }
  } else {
    const possibleAlternativeAlignCssPositionProp1 = (position === 'bottom' || position === 'top') ? 'left' : 'top'
    const possibleAlternativeAlignCssPositionProp2 = oppositionPositions[possibleAlternativeAlignCssPositionProp1]
    const alternativeAlignCssSizeProp = propToCompare[possibleAlternativeAlignCssPositionProp1]
    const followerOverTargetSize = (followerRect[alternativeAlignCssSizeProp] - targetRect[alternativeAlignCssSizeProp]) / 2
    if (
      // center is not enough
      (targetRect[possibleAlternativeAlignCssPositionProp1] < followerOverTargetSize) ||
      (targetRect[possibleAlternativeAlignCssPositionProp2] < followerOverTargetSize)
    ) {
      // alternative 2 position's space is larger
      if (targetRect[possibleAlternativeAlignCssPositionProp1] > targetRect[possibleAlternativeAlignCssPositionProp2]) {
        properAlign = cssPositionToOppositeAlign[possibleAlternativeAlignCssPositionProp1]
      } else {
        // alternative 1 position's space is larger
        properAlign = cssPositionToOppositeAlign[possibleAlternativeAlignCssPositionProp2]
      }
      // TODO: fix it
      // deriveOffset(alternativeAlignCssSizeProp, possibleAlternativeAlignCssPositionProp1, offsetVertically)
    }
  }

  let properPosition = position
  if (
    // space is not enough
    targetRect[position] < followerRect[propToCompare[position]] &&
    // opposite position's space is larger
    targetRect[position] < targetRect[oppositionPositions[position]]
  ) {
    properPosition = oppositionPositions[position]
  }
  return {
    placement: properAlign !== 'center' ? `${properPosition}-${properAlign}` as Placement : properPosition,
    left,
    top
  }
}

export function getProperTransformOrigin (placement: Placement, overlap: boolean): TransformOrigin {
  if (overlap) return overlapTransformOrigin[placement]
  return transformOrigins[placement]
}

interface PlacementOffset {
  top: string
  left: string
  transform: string
}

// ------------
// |  offset  |
// |          |
// | [target] |
// |          |
// ------------

// TODO: refactor it to remove dup logic
export function getOffset (
  placement: Placement,
  offsetRect: Rect,
  targetRect: Rect,
  offsetTopToStandardPlacement: number,
  offsetLeftToStandardPlacement: number,
  overlap: boolean
): PlacementOffset {
  if (overlap) {
    switch (placement) {
      case 'bottom-start':
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left)}px`,
          transform: 'translateY(-100%)'
        }
      case 'bottom-end':
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
          transform: 'translateX(-100%) translateY(-100%)'
        }
      case 'top-start':
        return {
          top: `${Math.round(targetRect.top - offsetRect.top)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left)}px`,
          transform: ''
        }
      case 'top-end':
        return {
          top: `${Math.round(targetRect.top - offsetRect.top)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
          transform: 'translateX(-100%)'
        }
      case 'right-start':
        return {
          top: `${Math.round(targetRect.top - offsetRect.top)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
          transform: 'translateX(-100%)'
        }
      case 'right-end':
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
          transform: 'translateX(-100%) translateY(-100%)'
        }
      case 'left-start':
        return {
          top: `${Math.round(targetRect.top - offsetRect.top)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left)}px`,
          transform: ''
        }
      case 'left-end':
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left)}px`,
          transform: 'translateY(-100%)'
        }
      case 'top':
        return {
          top: `${Math.round(targetRect.top - offsetRect.top)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width / 2)}px`,
          transform: 'translateX(-50%)'
        }
      case 'right':
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height / 2)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
          transform: 'translateX(-100%) translateY(-50%)'
        }
      case 'left':
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height / 2)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left)}px`,
          transform: 'translateY(-50%)'
        }
      case 'bottom':
      default:
        return {
          top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
          left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width / 2)}px`,
          transform: 'translateX(-50%) translateY(-100%)'
        }
    }
  }

  switch (placement) {
    case 'bottom-start':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + offsetLeftToStandardPlacement)}px`,
        transform: ''
      }
    case 'bottom-end':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width + offsetLeftToStandardPlacement)}px`,
        transform: 'translateX(-100%)'
      }
    case 'top-start':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + offsetLeftToStandardPlacement)}px`,
        transform: 'translateY(-100%)'
      }
    case 'top-end':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width + offsetLeftToStandardPlacement)}px`,
        transform: 'translateX(-100%) translateY(-100%)'
      }
    case 'right-start':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width + offsetLeftToStandardPlacement)}px`,
        transform: ''
      }
    case 'right-end':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width + offsetLeftToStandardPlacement)}px`,
        transform: 'translateY(-100%)'
      }
    case 'left-start':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + offsetLeftToStandardPlacement)}px`,
        transform: 'translateX(-100%)'
      }
    case 'left-end':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + offsetLeftToStandardPlacement)}px`,
        transform: 'translateX(-100%) translateY(-100%)'
      }
    case 'top':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width / 2 + offsetLeftToStandardPlacement)}px`,
        transform: 'translateY(-100%) translateX(-50%)'
      }
    case 'right':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height / 2 + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width + offsetLeftToStandardPlacement)}px`,
        transform: 'translateY(-50%)'
      }
    case 'left':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height / 2 + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + offsetLeftToStandardPlacement)}px`,
        transform: 'translateY(-50%) translateX(-100%)'
      }
    case 'bottom':
    default:
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height + offsetTopToStandardPlacement)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width / 2 + offsetLeftToStandardPlacement)}px`,
        transform: 'translateX(-50%)'
      }
  }
}
