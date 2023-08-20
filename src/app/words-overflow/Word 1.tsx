import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Box, CameraControls, Html, OrbitControls, Plane, RoundedBox, Stats } from '@react-three/drei'
import _ from 'lodash'
import { lerp } from 'three/src/math/MathUtils.js'
import { CuboidCollider, Physics, RapierRigidBody, RigidBody, RigidBodyProps } from '@react-three/rapier'

const shakes = _.times(100, (i) => lerp(-Math.PI / 40, Math.PI / 40, i / 100))
const getShake = (n: number) => shakes[((n * 1000) | 0) % shakes.length]

export interface IWord {
  text: string
  written: number
  color?: string
}

const getPositions = (words: IWord[], n = 3) => {
  const positions = [] as any

  const chunks = _.chunk(words, n > words.length ? n : words.length / n)
  for (let chunkI = 0; chunkI < chunks.length; chunkI++) {
    const chunk = chunks[chunkI]
    const y = chunkI * 20
    const row = []

    for (let i = 0; i < chunk.length; i++) {
      const curr = chunk[i]

      const prevPosititon = row[i - 1]?.position?.[0] ?? 0
      const prevSize = (row[i - 1]?.args?.[0] ?? 0) / 2

      const width = curr.text.length * 4
      row.push({
        args: [width, 15, 4],
        position: [prevPosititon + prevSize + width / 2 + 10, y, 0],
      })
    }

    const avgX = _.mean(_.map(row, 'position.0'))
    positions.push(...row.map((p) => ({ ...p, position: [p.position[0] - avgX, p.position[1], p.position[2]] })))
  }

  const avgY = _.mean(_.map(_.flatten(positions), 'position.1'))
  return positions.map((p) => ({ ...p, position: [p.position[0], p.position[1] - avgY, p.position[2]] }))
}

export const Words = ({ words, width, height }) => {
  const positions = useMemo(() => getPositions(words, 5), [words])
  const camera = useMemo(
    () => ({
      position: [0, 0, 150] as const,
      // left: _.min(_.map(positions, 'position.0')) + 100,
      // right: _.max(_.map(positions, 'position.0')) - 100,
      // top: _.min(_.map(positions, 'position.1')) + 100,
      // bottom: _.max(_.map(positions, 'position.1')) - 100,
    }),
    []
  )

  return (
    <Canvas camera={camera} shadows dpr={[1, 2]}>
      <Stats showPanel={0} className="stats" />

      <CameraControls />
      {/* <OrbitControls /> */}
      {/* <Box /> */}
      <ambientLight intensity={0.5} />
      <color attach="background" args={['lightblue']} />

      <Suspense>
        <Physics gravity={[0, -9.8, 0]} debug>
          {/* <Debug color="black" scale={1.1}> */}
          {/* <Plane position={[0, _.min(_.map(positions, 'position.1')) - 20, 0]} rotation={[-Math.PI / 2, 0, 0]} /> */}
          <CuboidCollider position={[0, _.min(_.map(positions, 'position.1')) - 20, 0]} args={[1000, 1, 1000]} />
          {positions.map((p, i) => (
            <Word key={words[i].text} word={words[i]} {...p} />
          ))}
          {/* <OrbitControls enableRotate={false} /> */}
          {/* </Debug> */}
        </Physics>
      </Suspense>

      <directionalLight position={[2, 10, 1]} castShadow shadow-mapSize={[2048, 2048]} />
    </Canvas>
  )
}

const Word = ({ word, args, position }: { word: IWord } & React.ComponentProps<typeof RoundedBox>) => {
  const written = word.text.substring(0, word.written).split('')
  const remain = word.text.substring(word.written).split('')
  const isEnd = word.text.length <= word.written

  const ref = useRef<any>(null)

  const shake = useRef(false)
  useEffect(() => {
    if (!written.length) return

    shake.current = true
    const id = setTimeout(() => (shake.current = false), 50)
    return () => clearInterval(id)
  }, [written.length])

  // useFrame(({ clock }) => {
  //   if (ref.current) ref.current.rotation.z = shake.current ? getShake(clock.getElapsedTime()) : 0
  // })

  // useEffect(() => {
  //   // if (isEnd) {
  //   //   const dir = _.times(3, () => _.random(-Math.PI, Math.PI, true))
  //   //   api.applyImpulse(dir, position)
  //   // }
  //   console.log(ref)
  //   if (isEnd && ref.current) {
  //     ref.current.setBodyType('dynamic')
  //   }
  // }, [isEnd])

  return (
    <RigidBody mass={1} type={isEnd ? 'dynamic' : 'fixed'}>
      <RoundedBox radius={0.5} castShadow receiveShadow args={args} position={position}>
        <meshLambertMaterial color="#B1B1B1" />
        <Html
          as="div"
          style={{ fontSize: '10rem' }}
          wrapperClass="font-semibold text-[#B1B1B1] text-lg sm:text-xl lg:text-2xl xl:text-3x font-mono"
          transform={true}
        >
          {written.map((x, i) => (
            <span key={x + i} style={{ color: word.color }}>
              {x}
            </span>
          ))}
          {remain.map((x, i) => (
            <span key={x + i}>{x}</span>
          ))}
        </Html>
      </RoundedBox>
    </RigidBody>
  )
}
