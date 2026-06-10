"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function NeonBackground() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const ctx: Record<string, any> = {}

    try {
      const s = new THREE.Scene()
      s.background = new THREE.Color(0x004400)

      const c = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 100)
      c.position.z = 5

      ctx.r = new THREE.WebGLRenderer({ antialias: true })
      ctx.r.setSize(el.clientWidth, el.clientHeight)
      el.appendChild(ctx.r.domElement)
      ctx.c = c; ctx.s = s

      const g = new THREE.BoxGeometry(1.5, 1.5, 1.5)
      const m = new THREE.MeshBasicMaterial({ color: 0xff2200 })
      ctx.cube = new THREE.Mesh(g, m)
      s.add(ctx.cube)

      const tick = () => {
        ctx.cube.rotation.x += 0.01
        ctx.cube.rotation.y += 0.02
        ctx.r.render(ctx.s, ctx.c)
        ctx.id = requestAnimationFrame(tick)
      }
      ctx.id = requestAnimationFrame(tick)

      window.addEventListener("resize", () => {
        ctx.c.aspect = el.clientWidth / el.clientHeight
        ctx.c.updateProjectionMatrix()
        ctx.r.setSize(el.clientWidth, el.clientHeight)
      })
    } catch (e) {
      console.error("[test3d]", e)
    }

    return () => {
      try { cancelAnimationFrame(ctx.id) } catch {}
      try { if (ctx.r) { ctx.r.dispose(); if (el.contains(ctx.r.domElement)) el.removeChild(ctx.r.domElement) } } catch {}
    }
  }, [])

  return <div ref={root} className="absolute inset-0 -z-10" />
}
