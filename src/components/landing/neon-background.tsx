"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

// @ts-expect-error - three examples types
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
// @ts-expect-error - three examples types
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
// @ts-expect-error - three examples types
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"

type Beam = {
  x: number
  z: number
  speed: number
  length: number
  phase: number
  color: number
  width: number
}

const BEAM_COUNT = 500
const SPREAD_X = 14
const SPREAD_Z = 8
const VERTICAL_RANGE = 20

export function NeonBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animId: number
    let composer: EffectComposer | null = null

    const el = container

    async function initThree() {
      const width = el.clientWidth
      const height = el.clientHeight

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x000000)

      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
      camera.position.set(0, 0.5, 14)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.0
      el.appendChild(renderer.domElement)

      try {
        composer = new EffectComposer(renderer)
        composer.addPass(new RenderPass(scene, camera))

        const bloom = new UnrealBloomPass(
          new THREE.Vector2(width, height),
          0.5,
          0.3,
          0.1,
        )
        composer.addPass(bloom)
      } catch {
        composer = null
      }

      const beams: Beam[] = []
      for (let i = 0; i < BEAM_COUNT; i++) {
        beams.push({
          x: (Math.random() - 0.5) * SPREAD_X * 2,
          z: (Math.random() - 0.5) * SPREAD_Z * 2,
          speed: 0.04 + Math.random() * 0.1,
          length: 0.4 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
          color: Math.random(),
          width: 0.015 + Math.random() * 0.04,
        })
      }

      const vertsPerBeam = 6
      const totalVerts = BEAM_COUNT * vertsPerBeam
      const positions = new Float32Array(totalVerts * 3)
      const alphas = new Float32Array(totalVerts)
      const colors = new Float32Array(totalVerts * 3)
      const uvY = new Float32Array(totalVerts)

      function buildGeometry(time: number) {
        const cGreen = [0.0, 0.898, 0.6]
        const cBlue = [0.0, 0.639, 1.0]

        for (let i = 0; i < BEAM_COUNT; i++) {
          const b = beams[i]
          const yOffset =
            ((time * b.speed + b.phase) % VERTICAL_RANGE) - VERTICAL_RANGE / 2
          const h = b.length
          const w = b.width
          const x = b.x
          const z = b.z

          const r = cGreen[0] + (cBlue[0] - cGreen[0]) * b.color
          const g = cGreen[1] + (cBlue[1] - cGreen[1]) * b.color
          const bl = cGreen[2] + (cBlue[2] - cGreen[2]) * b.color

          const idx = i * vertsPerBeam * 3

          const x0 = x - w / 2
          const x1 = x + w / 2
          const y0 = yOffset - h / 2
          const y1 = yOffset + h / 2

          positions[idx + 0] = x0
          positions[idx + 1] = y0
          positions[idx + 2] = z
          positions[idx + 3] = x1
          positions[idx + 4] = y0
          positions[idx + 5] = z
          positions[idx + 6] = x1
          positions[idx + 7] = y1
          positions[idx + 8] = z
          positions[idx + 9] = x0
          positions[idx + 10] = y0
          positions[idx + 11] = z
          positions[idx + 12] = x1
          positions[idx + 13] = y1
          positions[idx + 14] = z
          positions[idx + 15] = x0
          positions[idx + 16] = y1
          positions[idx + 17] = z

          for (let v = 0; v < vertsPerBeam; v++) {
            const ci = idx + v * 3
            colors[ci + 0] = r
            colors[ci + 1] = g
            colors[ci + 2] = bl

            const localY = v < 3 ? -0.5 : 0.5
            uvY[i * vertsPerBeam + v] = localY

            const baseAlpha = localY < 0 ? 0.0 : 1.0
            alphas[i * vertsPerBeam + v] = baseAlpha
          }

          alphas[i * vertsPerBeam + 0] = 0.0
          alphas[i * vertsPerBeam + 1] = 0.0
          alphas[i * vertsPerBeam + 2] = 1.0
          alphas[i * vertsPerBeam + 3] = 0.0
          alphas[i * vertsPerBeam + 4] = 1.0
          alphas[i * vertsPerBeam + 5] = 1.0
        }
      }

      buildGeometry(0)

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

      const material = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          attribute float aAlpha;
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            vAlpha = aAlpha;
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          varying vec3 vColor;
          uniform float uTime;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          void main() {
            vec3 col = vColor;
            float grain = hash(gl_FragCoord.xy + uTime * 100.0) * 0.06;
            col += grain;
            float alpha = vAlpha * 0.8;
            gl_FragColor = vec4(col, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexColors: true,
      })

      const aAlpha = new Float32Array(totalVerts)
      for (let i = 0; i < totalVerts; i++) aAlpha[i] = 0
      geometry.setAttribute("aAlpha", new THREE.BufferAttribute(aAlpha, 1))

      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      let mouseX = 0
      let mouseY = 0
      let targetMouseX = 0
      let targetMouseY = 0

      const onMouseMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        targetMouseX = (x - 0.5) * 2
        targetMouseY = (y - 0.5) * 2
      }
      window.addEventListener("mousemove", onMouseMove)

      let elapsed = 0

      function animate() {
        elapsed += 0.016
        const t = elapsed * 0.3

        mouseX += (targetMouseX - mouseX) * 0.05
        mouseY += (targetMouseY - mouseY) * 0.05

        camera.position.x = mouseX * 1.5
        camera.position.y = -mouseY * 1.0
        camera.lookAt(0, 0, 0)

        buildGeometry(t)

        const posAttr = geometry.attributes.position as import("three").BufferAttribute
        posAttr.array.set(positions)
        posAttr.needsUpdate = true

        const alphaAttr = geometry.attributes.aAlpha as import("three").BufferAttribute
        alphaAttr.array.set(alphas)
        alphaAttr.needsUpdate = true

        material.uniforms.uTime.value = t

        if (composer) {
          composer.render()
        } else {
          renderer.render(scene, camera)
        }

        animId = requestAnimationFrame(animate)
      }

      animId = requestAnimationFrame(animate)

      const onResize = () => {
        const w = el.clientWidth
        const h = el.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
        if (composer) composer.setSize(w, h)
      }
      window.addEventListener("resize", onResize)

      return () => {
        window.removeEventListener("mousemove", onMouseMove)
        window.removeEventListener("resize", onResize)
        cancelAnimationFrame(animId)
        geometry.dispose()
        material.dispose()
        renderer.dispose()
        if (composer) composer.dispose()
        if (el.contains(renderer.domElement)) {
          el.removeChild(renderer.domElement)
        }
      }
    }

    const cleanup = initThree()

    return () => {
      cleanup.then((fn) => fn?.())
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 -z-10" />
}
