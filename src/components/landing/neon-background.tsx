"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

const N = 280
const CONNECT = 4.5
const SX = 24, SY = 14, SZ = 10

interface Pt {
  bx: number; by: number; bz: number
  s: number; b: number
  f: Float32Array  // [f1x, p1x, f2x, p2x, f1y, p1y, f2y, p2y, f1z, p1z, f2z, p2z]
}

export function NeonBackground() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const ctx: Record<string, any> = {}

    try {
      const W = el.clientWidth, H = el.clientHeight

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x030712)

      const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100)
      camera.position.set(0, 0.5, 16)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      renderer.setSize(W, H, true)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      el.appendChild(renderer.domElement)
      ctx.r = renderer

      // ── Points ──
      const rng = (a: number, b: number) => a + Math.random() * (b - a)

      const pts: Pt[] = []
      for (let i = 0; i < N; i++) {
        const f = new Float32Array(12)
        for (let j = 0; j < 12; j += 2) {
          f[j] = rng(0.15, 0.5)    // frequency
          f[j + 1] = rng(0, Math.PI * 2)  // phase
        }
        pts.push({
          bx: rng(-SX, SX), by: rng(-SY, SY), bz: rng(-SZ, SZ),
          s: rng(0.03, 0.12),
          b: rng(0.5, 1.0),
          f,
        })
      }

      const PP = new Float32Array(N * 3)
      const PS = new Float32Array(N)
      const PC = new Float32Array(N * 3)

      for (let i = 0; i < N; i++) {
        const p = pts[i]
        PS[i] = p.s
        const bi = p.b
        PC[i * 3] = 0
        PC[i * 3 + 1] = 0.898 * bi
        PC[i * 3 + 2] = 0.6 * bi
      }

      // ── Line buffers ──
      const MAX_LINES = N * 6
      const LP = new Float32Array(MAX_LINES * 6)
      const LC = new Float32Array(MAX_LINES * 6)
      let activeLines = 0

      // ── Geometries ──
      const pg = new THREE.BufferGeometry()
      pg.setAttribute("position", new THREE.BufferAttribute(PP, 3))
      pg.setAttribute("color", new THREE.BufferAttribute(PC, 3))

      const lg = new THREE.BufferGeometry()
      lg.setAttribute("position", new THREE.BufferAttribute(LP, 3))
      lg.setAttribute("color", new THREE.BufferAttribute(LC, 3))
      lg.setDrawRange(0, 0)

      const lm = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      pg.setAttribute("size", new THREE.BufferAttribute(PS, 1))

      const pm = new THREE.ShaderMaterial({
        uniforms: { uPR: { value: Math.min(window.devicePixelRatio, 2) } },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (420.0 * uPR / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float a = 1.0 - smoothstep(0.0, 0.5, d);
            gl_FragColor = vec4(vColor, a * 0.85);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      scene.add(new THREE.LineSegments(lg, lm))
      scene.add(new THREE.Points(pg, pm))
      ctx.pg = pg; ctx.lg = lg; ctx.lm = lm; ctx.pm = pm

      // ── Mouse ──
      let mx = 0, my = 0, tmx = 0, tmy = 0
      window.addEventListener("pointermove", (e: PointerEvent) => {
        const rect = el.getBoundingClientRect()
        tmx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
        tmy = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      })

      // ── Temp arrays to avoid allocation in hot loop ──
      const pos = new Float32Array(N * 3)

      const tick = () => {
        const t = performance.now() / 1000

        mx += (tmx - mx) * 0.04
        my += (tmy - my) * 0.04

        camera.position.x = mx * 0.8
        camera.position.y = -my * 0.5
        camera.lookAt(0, 0, 0)

        // Update point positions with organic motion
        for (let i = 0; i < N; i++) {
          const p = pts[i]
          const f = p.f
          const pi = i * 3
          const x = p.bx + Math.sin(t * f[0] + f[1]) * 0.3 + Math.sin(t * f[2] + f[3]) * 0.2
          const y = p.by + Math.sin(t * f[4] + f[5]) * 0.3 + Math.sin(t * f[6] + f[7]) * 0.2
          const z = p.bz + Math.sin(t * f[8] + f[9]) * 0.3 + Math.sin(t * f[10] + f[11]) * 0.2
          PP[pi] = x; PP[pi + 1] = y; PP[pi + 2] = z
          pos[pi] = x; pos[pi + 1] = y; pos[pi + 2] = z
        }

        // Build connections — fase 1: nearest neighbor (garante zero retas desconexas)
        const edgeSet = new Set<string>()
        const cd2 = CONNECT * CONNECT
        let li = 0

        for (let i = 0; i < N && li < MAX_LINES; i++) {
          let minD2 = Infinity, minJ = -1
          const ix = pos[i * 3], iy = pos[i * 3 + 1], iz = pos[i * 3 + 2]
          for (let j = 0; j < N; j++) {
            if (i === j) continue
            const dx = ix - pos[j * 3], dy = iy - pos[j * 3 + 1], dz = iz - pos[j * 3 + 2]
            const d2 = dx * dx + dy * dy + dz * dz
            if (d2 < minD2) { minD2 = d2; minJ = j }
          }
          const key = i < minJ ? `${i},${minJ}` : `${minJ},${i}`
          if (!edgeSet.has(key)) {
            edgeSet.add(key)
            const dist = Math.sqrt(minD2)
            const alpha = Math.max(0.06, 1 - dist / 22)
            const lp = li * 6, ic = i * 3, jc = minJ * 3
            LP[lp] = ix; LP[lp + 1] = iy; LP[lp + 2] = iz
            LP[lp + 3] = pos[minJ * 3]; LP[lp + 4] = pos[minJ * 3 + 1]; LP[lp + 5] = pos[minJ * 3 + 2]
            LC[lp] = PC[ic] * alpha; LC[lp + 1] = PC[ic + 1] * alpha; LC[lp + 2] = PC[ic + 2] * alpha
            LC[lp + 3] = PC[jc] * alpha; LC[lp + 4] = PC[jc + 1] * alpha; LC[lp + 5] = PC[jc + 2] * alpha
            li++
          }
        }

        // Fase 2: conexões extras por proximidade
        for (let i = 0; i < N && li < MAX_LINES; i++) {
          const ix = pos[i * 3], iy = pos[i * 3 + 1], iz = pos[i * 3 + 2]
          for (let j = i + 1; j < N && li < MAX_LINES; j++) {
            const key = `${i},${j}`
            if (edgeSet.has(key)) continue
            const dx = ix - pos[j * 3], dy = iy - pos[j * 3 + 1], dz = iz - pos[j * 3 + 2]
            const d2 = dx * dx + dy * dy + dz * dz
            if (d2 < cd2) {
              edgeSet.add(key)
              const dist = Math.sqrt(d2)
              const alpha = 1 - dist / CONNECT
              const lp = li * 6, ic = i * 3, jc = j * 3
              LP[lp] = ix; LP[lp + 1] = iy; LP[lp + 2] = iz
              LP[lp + 3] = pos[j * 3]; LP[lp + 4] = pos[j * 3 + 1]; LP[lp + 5] = pos[j * 3 + 2]
              LC[lp] = PC[ic] * alpha; LC[lp + 1] = PC[ic + 1] * alpha; LC[lp + 2] = PC[ic + 2] * alpha
              LC[lp + 3] = PC[jc] * alpha; LC[lp + 4] = PC[jc + 1] * alpha; LC[lp + 5] = PC[jc + 2] * alpha
              li++
            }
          }
        }
        activeLines = li

        pg.attributes.position.needsUpdate = true
        lg.attributes.position.array.set(LP)
        lg.attributes.position.needsUpdate = true
        lg.attributes.color.array.set(LC)
        lg.attributes.color.needsUpdate = true
        lg.setDrawRange(0, activeLines * 2)

        renderer.render(scene, camera)
        ctx.id = requestAnimationFrame(tick)
      }

      ctx.id = requestAnimationFrame(tick)

      window.addEventListener("resize", () => {
        const w = el.clientWidth, h = el.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h, true)
      })
    } catch (e) {
      console.error("[NeonBackground]", e)
    }

    return () => {
      try { cancelAnimationFrame(ctx.id) } catch {}
      try { ctx.pg?.dispose(); ctx.lg?.dispose(); ctx.lm?.dispose(); ctx.pm?.dispose() } catch {}
      try { if (ctx.r) { ctx.r.dispose(); if (el.contains(ctx.r.domElement)) el.removeChild(ctx.r.domElement) } } catch {}
    }
  }, [])

  return <div ref={root} className="absolute inset-0" />
}
