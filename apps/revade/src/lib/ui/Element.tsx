import {
  CSSProperties,
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  HTMLProps,
  ReactNode
} from "react"

const defaultStyles: CSSProperties = {
  boxSizing: "border-box"
}

type Anchor =
  | "center"
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left"
  | "top-left"

const anchorStyles: Partial<Record<Anchor, CSSProperties>> = {
  top: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translate(-50%)"
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: "translate(-50%)"
  },
  "top-left": {
    position: "absolute",
    top: 0,
    left: 0
  }
}

export type ElementProps<T = HTMLDivElement> = HTMLProps<T> & {
  children?: ReactNode
  anchor?: Anchor
}

export const Element: FC<ElementProps & {
  tagName?: keyof JSX.IntrinsicElements
}> = ({ tagName = "div", children, anchor, style = {}, ...props }) => {
  const Tag = tagName

  return (
    <Tag
      {...props}
      style={{
        ...defaultStyles,
        ...(anchor ? anchorStyles[anchor] : {}),
        ...style
      }}
    >
      {children}
    </Tag>
  )
}
