import React, { createContext, FC, ReactNode, useContext, useMemo } from "react"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { Update } from "../ticker"
import { useRenderer } from "./Renderer"

const ComposerContext = createContext<EffectComposer>(null!)

export const Composer: FC<{ children?: ReactNode }> = ({ children }) => {
  const renderer = useRenderer()
  const composer = useMemo(() => new EffectComposer(renderer), [renderer])

  return (
    <ComposerContext.Provider value={composer}>
      <Update stage="render">{() => composer.render()}</Update>

      {children}
    </ComposerContext.Provider>
  )
}

export const useComposer = () => useContext(ComposerContext)
