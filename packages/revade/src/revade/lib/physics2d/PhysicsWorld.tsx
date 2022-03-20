import { useTicker } from "@hmans/trinity"
import * as miniplex from "miniplex"
import { createContext, FC, useContext, useEffect, useState } from "react"
import { Entity } from "./Entity"
import p2 from "p2-es"

const PhysicsWorldContext = createContext<{
  world: p2.World
  ecs: miniplex.World<Entity>
  bodies: Map<p2.Body, Entity>
}>(null!)

export const PhysicsWorld: FC<{
  gravity?: [number, number]
}> = ({ children, gravity = [0, -9.81] }) => {
  const [ecs] = useState(() => new miniplex.World<Entity>())
  const [bodies] = useState(() => new Map())

  const [world] = useState(
    () =>
      new p2.World({
        gravity
      })
  )

  useEffect(() => {
    world.on("beginContact", (e: p2.BeginContactEvent) => {
      const entityA = bodies.get(e.bodyA)
      const entityB = bodies.get(e.bodyB)

      entityA?.physics2d.onCollisionEnter?.()
      entityB?.physics2d.onCollisionEnter?.()
    })

    world.on("endContact", (e: p2.EndContactEvent) => {
      const entityA = bodies.get(e.bodyA)
      const entityB = bodies.get(e.bodyB)

      entityA?.physics2d.onCollisionExit?.()
      entityB?.physics2d.onCollisionExit?.()
    })

    world.on("preSolve", (e: p2.PreSolveEvent) => {})
  }, [world])

  useTicker("fixed", (dt) => {
    /* Step the physics world */
    world.step(dt)

    /* Apply changes from physics world to scene objects */
    for (const {
      physics2d: { body, transform }
    } of ecs.entities) {
      // if (body.sleep) {
      const pos = body.position
      const rot = body.angle
      transform.position.set(pos[0], pos[1], 0)
      transform.rotation.set(0, 0, rot)
      // }
    }
  })

  return (
    <PhysicsWorldContext.Provider value={{ world, ecs, bodies }}>
      {children}
    </PhysicsWorldContext.Provider>
  )
}

export const usePhysicsWorld = () => useContext(PhysicsWorldContext)
