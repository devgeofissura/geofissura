"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

// @ts-expect-error - three addons ship types via @types/three but bundler resolution may not find them
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
// @ts-expect-error - same as above
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
// @ts-expect-error - same as above
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"

const BEAM_COUNT = 600
const VERTICAL_RANGE = 24

const vertexShader = `
attribute float aOffsetX;
attribute float aOffsetZ;
attribute float aSpeed;
attribute float aLength;
attribute float aSeed;
attribute float aColor;

uniform float uTime;

varying float vAlpha;
varying vec3 vColor;

void main() {
  vec3 pos = position;

  float yPos = fract(uTime * aSpeed + aSeed) * VERTICAL_RANGE - VERTICAL_RANGE / 2.0;
  pos.y = pos.y * aLength + yPos;
  pos.x += aOffsetX;
  pos.z += aOffsetZ;

  vec3 colorGreen = vec3(0.0, 0.898, 0.6);
  vec3 colorBlue = vec3(0.0, 0.639, 1.0);
  vColor = mix(colorGreen, colorBlue, aColor);

  float localY = position.y * 0.5 + 0.5;
  vAlpha = 1.0 - localY;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentShader = `
varying float vAlpha;
varying vec3 vColor;

uniform float uTime;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec3 color = vColor;

  float grain = hash(gl_FragCoord.xy + uTime * 0.1) * 0.06;
  color += grain;

  float alpha = vAlpha * 0.7;
  gl_FragColor = vec4(color, alpha);
}
`

export function NeonBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
    camera.position.set(0, 0, 14)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)

    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.6,
      0.2,
      0.1,
    )
    composer.addPass(bloomPass)

    const geometry = new THREE.PlaneGeometry(0.04, 1)

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: vertexShader.replace("VERTICAL_RANGE", VERTICAL_RANGE.toFixed(1)),
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.InstancedMesh(geometry, material, BEAM_COUNT)
    mesh.castShadow = false
    mesh.receiveShadow = false

    const dummy = new THREE.Object3D()
    const offsetsX = new Float32Array(BEAM_COUNT)
    const offsetsZ = new Float32Array(BEAM_COUNT)
    const speeds = new Float32Array(BEAM_COUNT)
    const lengths = new Float32Array(BEAM_COUNT)
    const seeds = new Float32Array(BEAM_COUNT)
    const colors = new Float32Array(BEAM_COUNT)

    const spread = 12

    for (let i = 0; i < BEAM_COUNT; i++) {
      const ox = (Math.random() - 0.5) * spread * 2
      const oz = (Math.random() - 0.5) * 8 - 2
      offsetsX[i] = ox
      offsetsZ[i] = oz
      speeds[i] = 0.05 + Math.random() * 0.12
      lengths[i] = 0.6 + Math.random() * 1.8
      seeds[i] = Math.random() * 10
      colors[i] = Math.random()

      const zFactor = (oz + 4) / 10
      const scale = 0.6 + (1 - zFactor) * 0.8

      dummy.position.set(ox, 0, oz)
      dummy.scale.set(1, lengths[i] * 3, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    const instancedOffsetsX = new THREE.InstancedBufferAttribute(offsetsX, 1)
    const instancedOffsetsZ = new THREE.InstancedBufferAttribute(offsetsZ, 1)
    const instancedSpeeds = new THREE.InstancedBufferAttribute(speeds, 1)
    const instancedLengths = new THREE.InstancedBufferAttribute(lengths, 1)
    const instancedSeeds = new THREE.InstancedBufferAttribute(seeds, 1)
    const instancedColors = new THREE.InstancedBufferAttribute(colors, 1)

    mesh.geometry.setAttribute("aOffsetX", instancedOffsetsX)
    mesh.geometry.setAttribute("aOffsetZ", instancedOffsetsZ)
    mesh.geometry.setAttribute("aSpeed", instancedSpeeds)
    mesh.geometry.setAttribute("aLength", instancedLengths)
    mesh.geometry.setAttribute("aSeed", instancedSeeds)
    mesh.geometry.setAttribute("aColor", instancedColors)

    scene.add(mesh)

    let mouseX = 0
    let mouseY = 0
    let targetMouseX = 0
    let targetMouseY = 0

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      targetMouseX = (x - 0.5) * 2
      targetMouseY = (y - 0.5) * 2
    }

    window.addEventListener("mousemove", onMouseMove)

    const clock = new THREE.Clock()

    const animate = () => {
      const elapsed = clock.getElapsedTime()

      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      camera.position.x = mouseX * 1.5
      camera.position.y = -mouseY * 1.0
      camera.lookAt(0, 0, 0)

      material.uniforms.uTime.value = elapsed * 0.3

      composer.render()
      requestAnimationFrame(animate)
    }

    animate()

    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      composer.setSize(w, h)
    }

    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("resize", onResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      composer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 -z-10" />
}
