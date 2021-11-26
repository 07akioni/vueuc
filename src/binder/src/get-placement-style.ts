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

const offsetDirection: Record<Position, boolean> = {
  top: true,
  bottom: false,
  left: true,
  right: false
}

const transformProperOrigin: Record<Position, Align> = {
  top: 'end',
  bottom: 'start',
  left: 'end',
  right: 'start'
}

interface ProperPlacement {
  top?: string
  left?: string
  properPlacement: Placement
}

export function getProperPlacementOfFollower (
  placement: Placement,
  targetRect: Rect,
  followerRect: Rect,
  flipLevel: FlipLevel,
  flip: boolean,
  overlap: boolean
): ProperPlacement {
  if (!flip || overlap) {
    return { properPlacement: placement }
  }
  const [position, align] = placement.split('-') as [Position, Align]
  let properAlign = align ?? 'center'
  let left = 0
  let top = 0

  // calculate offset
  const calcOffset = (oppositeAlignCssSizeProp: 'width' | 'height', currentAlignCssPositionProp: Position, isVertical: boolean): void => {
    const diff = followerRect[oppositeAlignCssSizeProp] - targetRect[currentAlignCssPositionProp] - targetRect[oppositeAlignCssSizeProp]
    if (diff > 0 && flipLevel === 2) {
      if (isVertical) {
        top = offsetDirection[currentAlignCssPositionProp] ? diff : -diff
      } else {
        left = offsetDirection[currentAlignCssPositionProp] ? diff : -diff
      }
    }
  }

  // NonCenterPlacement choose exist proper placement
  if (properAlign !== 'center') {
    const oppositeAlignCssPositionProp = oppositeAlignCssPositionProps[placement as NonCenterPlacement]
    const isVertical = oppositeAlignCssPositionProp === 'top' || oppositeAlignCssPositionProp === 'bottom'
    const currentAlignCssPositionProp = oppositionPositions[oppositeAlignCssPositionProp]
    const oppositeAlignCssSizeProp = propToCompare[oppositeAlignCssPositionProp]
    // if follower rect is larger than target rect in align direction
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
            calcOffset(oppositeAlignCssSizeProp, currentAlignCssPositionProp, isVertical)
          } else {
            calcOffset(oppositeAlignCssSizeProp, oppositeAlignCssPositionProp, isVertical)
          }
        } else {
          // 'center' align is better
          properAlign = 'center'
        }
      }
    }
    // if follower rect is smaller than target rect in align direction
    if (followerRect[oppositeAlignCssSizeProp] < targetRect[oppositeAlignCssSizeProp]) {
      if (
        targetRect[currentAlignCssPositionProp] < 0 &&
        // opposite align has larger space
        targetRect[oppositeAlignCssPositionProp] > targetRect[currentAlignCssPositionProp]
      ) {
        properAlign = oppositeAligns[align]
      }
    }
  } else {
    const isVertical = position === 'top' || position === 'bottom'
    const oppositeAlignCssPositionProp = isVertical ? 'left' : 'top'
    const currentAlignCssPositionProp = oppositionPositions[oppositeAlignCssPositionProp]
    const oppositeAlignCssSizeProp = propToCompare[oppositeAlignCssPositionProp]
    const followerOverTargetSize = (followerRect[oppositeAlignCssSizeProp] - targetRect[oppositeAlignCssSizeProp]) / 2
    // center is not enough
    if ((targetRect[oppositeAlignCssPositionProp] < followerOverTargetSize) || (targetRect[currentAlignCssPositionProp] < followerOverTargetSize)) {
      // current position's space is larger
      if (targetRect[oppositeAlignCssPositionProp] > targetRect[currentAlignCssPositionProp]) {
        properAlign = transformProperOrigin[oppositeAlignCssPositionProp]
        calcOffset(oppositeAlignCssSizeProp, oppositeAlignCssPositionProp, !isVertical)
      } else {
        // opposite position's space is larger
        properAlign = transformProperOrigin[currentAlignCssPositionProp]
        calcOffset(oppositeAlignCssSizeProp, currentAlignCssPositionProp, !isVertical)
      }
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
    properPlacement: properAlign !== 'center' ? `${properPosition}-${properAlign}` as Placement : properPosition,
    left: `${left}px`,
    top: `${top}px`
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
export function getOffset (
  placement: Placement,
  offsetRect: Rect,
  targetRect: Rect,
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
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left)}px`,
        transform: ''
      }
    case 'bottom-end':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
        transform: 'translateX(-100%)'
      }
    case 'top-start':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left)}px`,
        transform: 'translateY(-100%)'
      }
    case 'top-end':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
        transform: 'translateX(-100%) translateY(-100%)'
      }
    case 'right-start':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
        transform: ''
      }
    case 'right-end':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
        transform: 'translateY(-100%)'
      }
    case 'left-start':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left)}px`,
        transform: 'translateX(-100%)'
      }
    case 'left-end':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left)}px`,
        transform: 'translateX(-100%) translateY(-100%)'
      }
    case 'top':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width / 2)}px`,
        transform: 'translateY(-100%) translateX(-50%)'
      }
    case 'right':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height / 2)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width)}px`,
        transform: 'translateY(-50%)'
      }
    case 'left':
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height / 2)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left)}px`,
        transform: 'translateY(-50%) translateX(-100%)'
      }
    case 'bottom':
    default:
      return {
        top: `${Math.round(targetRect.top - offsetRect.top + targetRect.height)}px`,
        left: `${Math.round(targetRect.left - offsetRect.left + targetRect.width / 2)}px`,
        transform: 'translateX(-50%)'
      }
  }
}
