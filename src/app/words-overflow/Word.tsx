import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Box,
  CameraControls,
  ContactShadows,
  Html,
  OrbitControls,
  PresentationControls,
  RoundedBox,
  SoftShadows,
  Stats,
  useHelper,
} from '@react-three/drei'
import _, { takeRight } from 'lodash'
import { lerp } from 'three/src/math/MathUtils.js'
import { Debug, Physics, useBox, usePlane } from '@react-three/cannon'
import { DirectionalLightHelper, PointLightHelper, SpotLightHelper } from 'three'

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
  const ppp = positions.map((p) => ({ ...p, position: [p.position[0], p.position[1] - avgY, p.position[2]] }))
  const left = _.minBy(ppp, 'position.0')!.position[0]
  const right = _.maxBy(ppp, 'position.0')!.position[0]
  const top = _.maxBy(ppp, 'position.1')!.position[1]
  const bottom = _.minBy(ppp, 'position.1')!.position[1]
  return [ppp, left, right, top, bottom]
}

export const Words = ({ words, width, height }) => {
  const [positions, left, right, top, bottom] = useMemo(() => getPositions(words, 5), [words])
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
      <PresentationControls
        config={{ mass: 2, tension: 500 }}
        snap={{ mass: 4, tension: 1500 }}
        rotation={[0, 0, 0]}
        polar={[-Math.PI / 4, Math.PI / 4]}
        azimuth={[-Math.PI / 4, Math.PI / 4]}
        global={true}
      >
        <Physics gravity={[0, -120, 0]}>
          {/* <Debug color="black" scale={1.1}> */}
          {positions.map((p, i) => (
            <Word key={words[i].text} word={words[i]} {...p} />
          ))}
          <Plane position={[0, bottom - 20, 0]} />
          {/* </Debug> */}
        </Physics>

        <pointLight position={[left - 15, top + 50, 20]} castShadow={true} distance={1000} intensity={0.1} />
        <ambientLight intensity={0.5} />
        {/* <SoftShadows samples={3} /> */}
      </PresentationControls>
      <color attach="background" args={['lightblue']} />
      {/* <OrbitControls enableRotate={false} /> */}
    </Canvas>
  )
}

const Plane = (props) => {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }))
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[1000, 1000]} />
      <shadowMaterial color="#171717" opacity={0.1} transparent={true} />
    </mesh>
  )
}

const Word = ({ word, args, position }: { word: IWord } & React.ComponentProps<typeof RoundedBox>) => {
  const written = word.text.substring(0, word.written).split('')
  const remain = word.text.substring(word.written).split('')
  const isEnd = word.text.length === word.written

  const [ref, api] = useBox(
    () => ({ mass: isEnd ? word.text.length : 0, position, args, castShadow: true, receiveShadow: true }),
    undefined,
    [isEnd]
  )

  const shake = useRef(false)
  useEffect(() => {
    if (!written.length) return

    shake.current = true
    const id = setTimeout(() => (shake.current = false), 50)
    return () => clearInterval(id)
  }, [written.length])

  useFrame(({ clock }) => {
    // if (ref.current) ref.current.rotation.z = shake.current ? getShake(clock.getElapsedTime()) : 0
    // if (ref.current) ref.current.rotation.z = shake.current ? getShake(clock.getElapsedTime()) : 0
    // api.applyImpulse([shake.current ? getShake(clock.getElapsedTime()) : 0, 0, 0], position)
    // api.applyLocalImpulse([shake.current ? getShake(clock.getElapsedTime()) : 0, 0, 0], position)
  })

  useEffect(() => {
    if (isEnd) {
      const dir = _.times(3, () => _.random(-Math.PI - 2, Math.PI + 2, true))
      api.applyImpulse(dir, position)
    }
  }, [api, isEnd, ...position])

  return (
    <Box ref={ref} castShadow receiveShadow args={args}>
      <Html
        as="div"
        style={{ fontSize: '10rem' }}
        wrapperClass="font-semibold text-[#B1B1B1] text-lg sm:text-xl lg:text-2xl xl:text-3x font-mono"
        transform={true}
        occlude="raycast"
        position={[0, 0, 2.5]}
        zIndexRange={[0, 40]}
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
      <meshLambertMaterial color={isEnd ? word.color : '#B1B1B1'} opacity={isEnd ? 0.2 : 1} />
    </Box>
  )
}
