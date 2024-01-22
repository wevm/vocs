import {
  FloatingArrow,
  arrow,
  offset,
  safePolygon,
  shift,
  useFloating,
  useHover,
  useInteractions,
} from '@floating-ui/react'
import { type ReactElement, useRef, useState } from 'react'
import { primitiveColorVars } from '../../styles/vars.css.js'

export function TwoslashPopover({ children, ...props }: { children: ReactElement[] }) {
  const [popover, target] = children

  const arrowRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const { context, refs, floatingStyles } = useFloating({
    middleware: [
      arrow({
        element: arrowRef,
      }),
      offset(8),
      shift(),
    ],
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
  })
  const hover = useHover(context, { handleClose: safePolygon() })

  const { getReferenceProps, getFloatingProps } = useInteractions([hover])

  const targetChildren = target.props.children
  const popoverChildren = popover.props.children

  return (
    <span {...props}>
      <span className="twoslash-target" ref={refs.setReference} {...getReferenceProps()}>
        {targetChildren}
      </span>
      {isOpen && (
        <div
          className="twoslash-popup-info-hover"
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <FloatingArrow
            ref={arrowRef}
            context={context}
            fill={primitiveColorVars.background5}
            height={3}
            stroke={primitiveColorVars.border2}
            strokeWidth={1}
            width={7}
          />
          <div className="twoslash-popup-scroll-container">{popoverChildren}</div>
        </div>
      )}
    </span>
  )
}
