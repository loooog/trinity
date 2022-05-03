import { Tag } from "miniplex"
import { insideSphere } from "randomish"
import { Suspense, useMemo } from "react"
import T, {
  Application,
  FancyRenderPipeline,
  GLTFAsset,
  makeInstancedMesh,
  useApplication,
  useGLTF,
  useTicker
} from "react-trinity"
import {
  BoxCollider,
  ConvexHullCollider,
  PhysicsWorld,
  RigidBody,
  SphereCollider
} from "react-trinity/physics3d"
import { Mesh, Object3D, Quaternion, Vector3 } from "three"
import { LoadingProgress } from "../lib/LoadingProgress"
import { ECS } from "./ecs"
import { PlayerController } from "./PlayerController"
import { Skybox } from "./Skybox"

const useInstancedMesh = (...args: Parameters<typeof makeInstancedMesh>) =>
  useMemo(() => makeInstancedMesh(...args), [])

const useInstancedGLTF = (url: string) => {
  const gltf = useGLTF(url)
  const mesh = gltf.scene.children[0] as Mesh

  return {
    ...useInstancedMesh({ geometry: mesh.geometry, material: mesh.material }),
    mesh
  }
}

const Asteroids = () => {
  const Asset = useInstancedGLTF("/models/asteroid03.gltf")

  return (
    <Asset.Root>
      <ECS.ManagedEntities tag="isAsteroid" initial={500}>
        {() => {
          const position = insideSphere(300)

          return (
            <RigidBody
              position={[position.x, position.y, position.z]}
              quaternion={new Quaternion().random()}
              scale={1 + Math.pow(Math.random(), 4) * 10}
            >
              <ConvexHullCollider geometry={Asset.mesh.geometry}>
                <Asset.Instance />
              </ConvexHullCollider>
            </RigidBody>
          )
        }}
      </ECS.ManagedEntities>
    </Asset.Root>
  )
}

const Player = () => {
  const Asset = useInstancedGLTF("/models/spaceship25.gltf")

  return (
    <Asset.Root>
      <ECS.Entity>
        <ECS.Component name="isPlayer" data={Tag} />
        <ECS.Component name="transform">
          <RigidBody position={[0, 0, 130]} allowSleep={false}>
            <PlayerController />
            <T.PointLight intensity={2.5} position-y={3} />

            <ConvexHullCollider
              geometry={Asset.mesh.geometry}
              rotation-x={-Math.PI / 2}
            >
              <Asset.Instance />
            </ConvexHullCollider>
          </RigidBody>
        </ECS.Component>
      </ECS.Entity>
    </Asset.Root>
  )
}

export const Game = () => (
  <Suspense fallback={<p>LOADING...</p>}>
    <LoadingProgress>
      <Application renderPipeline={FancyRenderPipeline}>
        {({ setCamera }) => (
          <>
            <T.Fog args={["#000", 64, 128]} />

            <T.AmbientLight intensity={0.8} />
            <T.DirectionalLight position={[100, 300, 100]} intensity={1} />

            <ECS.Entity>
              <ECS.Component name="isCamera" data={Tag} />
              <ECS.Component name="transform">
                <T.PerspectiveCamera position={[0, 0, 140]} ref={setCamera} />
              </ECS.Component>
            </ECS.Entity>

            <Skybox />

            <Systems />

            <PhysicsWorld gravity={[0, 0, 0]}>
              <Asteroids />
              <Player />
            </PhysicsWorld>
          </>
        )}
      </Application>
    </LoadingProgress>
  </Suspense>
)

export const Systems = () => {
  const { camera } = useApplication()

  const archetypes = {
    player: ECS.useArchetype("isPlayer")
  }

  useTicker("update", () => {
    /* Camera follows player */
    const player = archetypes.player.entities[0]
    if (player && camera) {
      const targetPosition = new Vector3(0, 3, 10)
        .applyQuaternion(player.transform.quaternion)
        .add(player.transform.position)

      camera.position.lerp(targetPosition, 0.02)

      camera.quaternion.slerp(player.transform.quaternion, 0.02)
    }
  })

  return null
}
