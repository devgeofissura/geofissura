"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

// ── Procedural structure generator ──────────────────────────────────

function buildStruct(
  w: number, h: number, d: number,
  floors: number, roof: boolean, cross: boolean,
): { v: Float32Array; e: Uint16Array } {
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

// ── Three.js component ──────────────────────────────────────────────

export function NeonBackground() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const W = el.clientWidth
    const H = el.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x030712)

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100)
    camera.position.set(0, 0.5, 16)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    el.appendChild(renderer.domElement)

    // ── Generate instances ────────────────────────────────────────

    const rng = (a: number, b: number) => a + Math.random() * (b - a)
    const rand = Math.random

    interface Inst {
      struct: { v: Float32Array; e: Uint16Array }
      x: number; y: number; z: number
      scale: number; rot0: number; rotSpeed: number
      phase: number; speed: number
      mouse: boolean; spread: number
    }

    const insts: Inst[] = []
    for (let i = 0; i < 30; i++) {
      const big = rand() < 0.25
      const w = big ? rng(1.5, 2.5) : rng(0.5, 1.2)
      const h = big ? rng(2, 3.5) : rng(0.6, 1.8)
      const d = big ? rng(1, 2) : rng(0.3, 0.8)
      const fl = Math.max(1, Math.round(h / 0.7))
      const struct = buildStruct(w, h, d, fl, rand() < 0.3, rand() < 0.35)
      insts.push({
        struct,
        x: rng(-7, 7), y: rng(-3.5, 2.5), z: rng(-5, 2),
        scale: rng(0.5, 1.0),
        rot0: rng(0, Math.PI * 2),
        rotSpeed: rng(-0.08, 0.08),
        phase: rng(0, Math.PI * 2),
        speed: rng(0.12, 0.3),
        mouse: rand() < 0.35,
        spread: rng(3, 6),
      })
    }

    // ── Build geometry buffers ──────────────────────────────────────

    let totalVerts = 0
    let totalEdges = 0
    for (const inst of insts) {
      totalVerts += inst.struct.v.length / 3
      totalEdges += inst.struct.e.length / 2
    }

    // Unique-vertex buffers (shared by LineSegments index + Points)
    const pos = new Float32Array(totalVerts * 3)
    const col = new Float32Array(totalVerts * 3)
    const idx = new Uint16Array(totalEdges * 2)
    const soff = new Float32Array(totalVerts * 3)
    const vtxInst = new Uint16Array(totalVerts)
    const vtxLocal = new Uint16Array(totalVerts)

    let vo = 0
    let eo = 0
    for (let ii = 0; ii < insts.length; ii++) {
      const inst = insts[ii]
      const { v, e } = inst.struct
      const vc = v.length / 3
      const ec = e.length / 2

      for (let j = 0; j < ec; j++) {
        idx[(eo + j) * 2] = e[j * 2] + vo
        idx[(eo + j) * 2 + 1] = e[j * 2 + 1] + vo
      }

      for (let j = 0; j < vc; j++) {
        const gp = (vo + j) * 3
        const theta = rand() * Math.PI * 2
        const phi = Math.acos(2 * rand() - 1)
        const rad = inst.spread * Math.cbrt(rand())
        soff[gp] = rad * Math.sin(phi) * Math.cos(theta)
        soff[gp + 1] = rad * Math.sin(phi) * Math.sin(theta)
        soff[gp + 2] = rad * Math.cos(phi)

        const b = 0.6 + rand() * 0.4
        col[gp] = 0
        col[gp + 1] = 0.898 * b
        col[gp + 2] = 0.6 * b

        vtxInst[vo + j] = ii
        vtxLocal[vo + j] = j
      }

      vo += vc
      eo += ec
    }

    // ── Three.js objects ────────────────────────────────────────────

    const geom = new THREE.BufferGeometry()
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    geom.setAttribute("color", new THREE.BufferAttribute(col, 3))
    geom.setIndex(new THREE.BufferAttribute(idx, 1))

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const pointMat = new THREE.PointsMaterial({
      size: 0.07,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const lines = new THREE.LineSegments(geom, lineMat)
    const points = new THREE.Points(geom, pointMat)
    scene.add(lines)
    scene.add(points)

    // ── Mouse parallax ──────────────────────────────────────────────

    let mx = 0, my = 0, tmx = 0, tmy = 0
    const onPointer = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      tmx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      tmy = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
    window.addEventListener("pointermove", onPointer)

    // ── Animation ───────────────────────────────────────────────────

    let animId = 0
    const start = performance.now()

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

    function update(now: number) {
      const elapsed = (now - start) / 1000

      mx += (tmx - mx) * 0.05
      my += (tmy - my) * 0.05
      const mox = mx * 0.5
      const moy = -my * 0.3

      const pa = geom.attributes.position as THREE.BufferAttribute
      const arr = pa.array as Float32Array

      for (let i = 0; i < totalVerts; i++) {
        const ii = vtxInst[i]
        const inst = insts[ii]
        const sv = inst.struct.v
        const loc = vtxLocal[i]

        const t = (Math.sin(elapsed * inst.speed + inst.phase) + 1) * 0.5

        const angle = inst.rot0 + inst.rotSpeed * elapsed
        const ca = Math.cos(angle)
        const sa = Math.sin(angle)

        const lx = sv[loc * 3] * inst.scale
        const ly = sv[loc * 3 + 1] * inst.scale
        const lz = sv[loc * 3 + 2] * inst.scale

        const mo = inst.mouse ? 1 : 0
        const fx = lx * ca - lz * sa + inst.x + mox * mo
        const fy = ly + inst.y + moy * mo
        const fz = lx * sa + lz * ca + inst.z

        const gp = i * 3
        const sx = inst.x + soff[gp] + mox * mo
        const sy = inst.y + soff[gp + 1] + moy * mo
        const sz = inst.z + soff[gp + 2]

        arr[gp] = lerp(sx, fx, t)
        arr[gp + 1] = lerp(sy, fy, t)
        arr[gp + 2] = lerp(sz, fz, t)
      }

      pa.needsUpdate = true
      renderer.render(scene, camera)
      animId = requestAnimationFrame(update)
    }

    animId = requestAnimationFrame(update)

    // ── Resize ──────────────────────────────────────────────────────

    const onResize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", onResize)

    // ── Cleanup ─────────────────────────────────────────────────────

    return () => {
      window.removeEventListener("pointermove", onPointer)
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(animId)
      geom.dispose()
      lineMat.dispose()
      pointMat.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={root}
      className="absolute inset-0 -z-10"
      style={{
        filter:
          "drop-shadow(0 0 4px #00e59944) drop-shadow(0 0 12px #00e59922)",
      }}
    />
  )
}
