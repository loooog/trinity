import React, {
  createContext,
  FC,
  useContext,
  useLayoutEffect,
  useState
} from "react"
import { useAnimationFrame } from "./useAnimationFrame"

export type TickerStage = "early" | "fixed" | "update" | "late" | "render"

const TickerContext = createContext<TickerImpl>(null!)

export type TickerCallback = (dt: number) => void

class TickerImpl {
  timeScale = 1
  fixedStep = 1 / 60
  maxDelta = 1
  lastTime = performance.now()

  private callbacks: Map<TickerStage, TickerCallback[]> = new Map()
  private acc: number = 0

  on(stage: TickerStage, callback: TickerCallback) {
    if (!this.callbacks.has(stage)) this.callbacks.set(stage, [])
    this.callbacks.get(stage)!.push(callback)
  }

  off(stage: TickerStage, callback: TickerCallback) {
    const callbacks = this.callbacks.get(stage)!
    const pos = callbacks.indexOf(callback)
    callbacks.splice(pos, 1)
  }

  tick() {
    /* Calculate frame delta */
    const now = performance.now()
    const frameDelta = (now - this.lastTime) / 1000
    this.lastTime = now

    /* Clamp the deltatime to prevent situations where thousands of frames are executed after
    the user returns from another tab. */
    const dt = Math.max(
      0,
      this.maxDelta ? Math.min(frameDelta, this.maxDelta) : frameDelta
    )

    /* Run the normale update callbacks. */
    this.execute("early", dt * this.timeScale)

    /* Run fixed-steps callbacks, based on our internal accumulator. */
    this.acc += dt * this.timeScale
    while (this.acc >= this.fixedStep) {
      this.execute("fixed", this.fixedStep)
      this.acc -= this.fixedStep
    }

    this.execute("update", dt * this.timeScale)
    this.execute("late", dt * this.timeScale)
    this.execute("render", dt * this.timeScale)
  }

  private execute(stage: TickerStage, dt: number) {
    const callbacks = this.callbacks.get(stage)
    if (callbacks) {
      for (const callback of callbacks) callback(dt)
    }
  }
}

export const Ticker: FC<{ timeScale?: number }> = ({
  children,
  timeScale = 1
}) => {
  const [ticker] = useState(() => new TickerImpl())

  useLayoutEffect(() => {
    ticker.timeScale = timeScale
    return () => void (ticker.timeScale = 1)
  }, [ticker, timeScale])

  useAnimationFrame(ticker.tick.bind(ticker))

  return (
    <TickerContext.Provider value={ticker}>{children}</TickerContext.Provider>
  )
}

export const useTicker = (stage: TickerStage, callback: TickerCallback) => {
  const ticker = useContext(TickerContext)

  useLayoutEffect(() => {
    ticker.on(stage, callback)
    return () => ticker.off(stage, callback)
  })
}
