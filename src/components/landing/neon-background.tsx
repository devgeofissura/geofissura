"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

function buildStruct(
  w: number, h: number, d: number,
  floors: number, roof: boolean, cross: boolean,
) {
  const verts: number[] = []
  const edges: number[] = []
  const nl = floors + 1
  const fh = h / floors
  for (let f = 0; f < nl; f++) {
    const y = -h / 2 + f * fh
    verts.push(-w / 2, y, -d / 2, w / 2, y, -d / 2, w / 2, y, d / 2, -w / 2, y, d / 2)
  }
  for (let f = 0; f < floors; f++) {
    const i = f * 4
    edges.push(i, i + 1, i + 1, i + 2, i + 2, i + 3, i + 3, i)
    edges.push(i, i + 4, i + 1, i + 5, i + 2, i + 6, i + 3, i + 7)
    if (cross) {
      edges.push(i, i + 5, i + 1, i + 4, i + 2, i + 7, i + 3, i + 6)
    }
  }
  const l = floors * 4
  edges.push(l, l + 1, l + 1, l + 2, l + 2, l + 3, l + 3, l)
  if (roof) {
    const p = verts.length / 3
    verts.push(0, h / 2 + h * 0.25, 0)
    edges.push(p, l, p, l + 1, p, l + 2, p, l + 3)
  }
  return { v: new Float32Array(verts), e: new Uint16Array(edges) }
}

export function NeonBackground() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const ctx: Record<string, any> = {}

    try {
      const W = el.clientWidth
      const H = el.clientHeight

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

      const rng = (a: number, b: number) => a + Math.random() * (b - a)

      const insts: Array<{
        struct: { v: Float32Array; e: Uint16Array }
        x: number; y: number; z: number
        scale: number; rot0: number; rotSpeed: number
        phase: number; speed: number
        mouse: boolean; spread: number
      }> = []

      for (let i = 0; i < 28; i++) {
        const big = Math.random() < 0.25
        const w = big ? rng(1.5, 2.5) : rng(0.5, 1.2)
        const h = big ? rng(2, 3.5) : rng(0.6, 1.8)
        const d = big ? rng(1, 2) : rng(0.3, 0.8)
        const fl = Math.max(1, Math.round(h / 0.7))
        const struct = buildStruct(w, h, d, fl, Math.random() < 0.3, Math.random() < 0.35)
        insts.push({
          struct,
          x: rng(-7, 7), y: rng(-3.5, 2.5), z: rng(-5, 2),
          scale: rng(0.5, 1.0),
          rot0: rng(0, Math.PI * 2),
          rotSpeed: rng(-0.08, 0.08),
          phase: rng(0, Math.PI * 2),
          speed: rng(0.12, 0.3),
          mouse: Math.random() < 0.35,
          spread: rng(3, 6),
        })
      }

      let totalVerts = 0
      let totalEdges = 0
      for (const inst of insts) {
        totalVerts += inst.struct.v.length / 3
        totalEdges += inst.struct.e.length / 2
      }

      const U = new Float32Array(totalVerts * 3)
      const C = new Float32Array(totalVerts * 3)
      const S = new Float32Array(totalVerts * 3)
      const VI = new Uint16Array(totalVerts)
      const VL = new Uint16Array(totalVerts)
      const EP = new Uint16Array(totalEdges * 2)
      const LP = new Float32Array(totalEdges * 6)
      const LC = new Float32Array(totalEdges * 6)

      let vo = 0, eo = 0
      for (let ii = 0; ii < insts.length; ii++) {
        const inst = insts[ii]
        const { v, e } = inst.struct
        const vc = v.length / 3
        const ec = e.length / 2
        for (let j = 0; j < ec; j++) {
          EP[(eo + j) * 2] = e[j * 2] + vo
          EP[(eo + j) * 2 + 1] = e[j * 2 + 1] + vo
        }
        for (let j = 0; j < vc; j++) {
          const gp = (vo + j) * 3
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          const rad = inst.spread * Math.cbrt(Math.random())
          S[gp] = rad * Math.sin(phi) * Math.cos(theta)
          S[gp + 1] = rad * Math.sin(phi) * Math.sin(theta)
          S[gp + 2] = rad * Math.cos(phi)
          const b = 0.6 + Math.random() * 0.4
          C[gp] = 0; C[gp + 1] = 0.898 * b; C[gp + 2] = 0.6 * b
          VI[vo + j] = ii; VL[vo + j] = j
        }
        vo += vc; eo += ec
      }

      for (let i = 0; i < totalVerts; i++) {
        const ii = VI[i], inst = insts[ii], gp = i * 3
        U[gp] = inst.x + S[gp]
        U[gp + 1] = inst.y + S[gp + 1]
        U[gp + 2] = inst.z + S[gp + 2]
      }

      for (let k = 0; k < totalEdges; k++) {
        const a = EP[k * 2], b = EP[k * 2 + 1]
        const ap = a * 3, bp = b * 3, dp = k * 6
        LP[dp] = U[ap]; LP[dp + 1] = U[ap + 1]; LP[dp + 2] = U[ap + 2]
        LP[dp + 3] = U[bp]; LP[dp + 4] = U[bp + 1]; LP[dp + 5] = U[bp + 2]
        LC[dp] = C[ap]; LC[dp + 1] = C[ap + 1]; LC[dp + 2] = C[ap + 2]
        LC[dp + 3] = C[bp]; LC[dp + 4] = C[bp + 1]; LC[dp + 5] = C[bp + 2]
      }

      const pg = new THREE.BufferGeometry()
      pg.setAttribute("position", new THREE.BufferAttribute(U, 3))
      pg.setAttribute("color", new THREE.BufferAttribute(C, 3))

      const lg = new THREE.BufferGeometry()
      lg.setAttribute("position", new THREE.BufferAttribute(LP, 3))
      lg.setAttribute("color", new THREE.BufferAttribute(LC, 3))

      const lm = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.4,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const pm = new THREE.PointsMaterial({
        size: 0.07, sizeAttenuation: true, vertexColors: true,
        transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })

      scene.add(new THREE.LineSegments(lg, lm))
      scene.add(new THREE.Points(pg, pm))
      ctx.pg = pg; ctx.lg = lg; ctx.lm = lm; ctx.pm = pm; ctx.scene = scene; ctx.camera = camera

      let mx = 0, my = 0, tmx = 0, tmy = 0
      const onPointer = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect()
        tmx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
        tmy = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      }
      window.addEventListener("pointermove", onPointer)

      const start = performance.now()

      const tick = () => {
        const elapsed = (performance.now() - start) / 1000

        mx += (tmx - mx) * 0.05
        my += (tmy - my) * 0.05
        const mox = mx * 0.5
        const moy = -my * 0.3

        for (let i = 0; i < totalVerts; i++) {
          const ii = VI[i]
          const inst = insts[ii]
          const sv = inst.struct.v
          const loc = VL[i]
          const t = (Math.sin(elapsed * inst.speed + inst.phase) + 1) * 0.5
          const angle = inst.rot0 + inst.rotSpeed * elapsed
          const ca = Math.cos(angle), sa = Math.sin(angle)
          const lx = sv[loc * 3] * inst.scale
          const ly = sv[loc * 3 + 1] * inst.scale
          const lz = sv[loc * 3 + 2] * inst.scale
          const mo = inst.mouse ? 1 : 0
          const fx = lx * ca - lz * sa + inst.x + mox * mo
          const fy = ly + inst.y + moy * mo
          const fz = lx * sa + lz * ca + inst.z
          const gp = i * 3
          const sx = inst.x + S[gp] + mox * mo
          const sy = inst.y + S[gp + 1] + moy * mo
          const sz = inst.z + S[gp + 2]
          U[gp] = sx + (fx - sx) * t
          U[gp + 1] = sy + (fy - sy) * t
          U[gp + 2] = sz + (fz - sz) * t
        }

        for (let k = 0; k < totalEdges; k++) {
          const a = EP[k * 2], b = EP[k * 2 + 1]
          const ap = a * 3, bp = b * 3, dp = k * 6
          LP[dp] = U[ap]; LP[dp + 1] = U[ap + 1]; LP[dp + 2] = U[ap + 2]
          LP[dp + 3] = U[bp]; LP[dp + 4] = U[bp + 1]; LP[dp + 5] = U[bp + 2]
        }

        pg.attributes.position.needsUpdate = true
        lg.attributes.position.needsUpdate = true
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
      try {
        if (ctx.r) { ctx.r.dispose(); if (el.contains(ctx.r.domElement)) el.removeChild(ctx.r.domElement) }
      } catch {}
    }
  }, [])

  return <div ref={root} className="absolute inset-0" />
}
