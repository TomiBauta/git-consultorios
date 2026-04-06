"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export function CustomCursor() {
  const [visible, setVisible] = useState(false)
  const [clicking, setClicking] = useState(false)
  const [hovering, setHovering] = useState(false)

  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  // Dot follows instantly
  const dotX = useSpring(mouseX, { stiffness: 1000, damping: 50, mass: 0.1 })
  const dotY = useSpring(mouseY, { stiffness: 1000, damping: 50, mass: 0.1 })

  // Ring lags behind
  const ringX = useSpring(mouseX, { stiffness: 200, damping: 28, mass: 0.5 })
  const ringY = useSpring(mouseY, { stiffness: 200, damping: 28, mass: 0.5 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      if (!visible) setVisible(true)
    }

    const down = () => setClicking(true)
    const up   = () => setClicking(false)

    const checkHover = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      const isInteractive = el.closest(
        'a, button, input, select, textarea, label, [role="button"], [tabindex]'
      )
      setHovering(!!isInteractive)
    }

    window.addEventListener("mousemove", move)
    window.addEventListener("mousemove", checkHover)
    window.addEventListener("mousedown", down)
    window.addEventListener("mouseup", up)
    document.documentElement.style.cursor = "none"

    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mousemove", checkHover)
      window.removeEventListener("mousedown", down)
      window.removeEventListener("mouseup", up)
      document.documentElement.style.cursor = ""
    }
  }, [mouseX, mouseY, visible])

  if (!visible) return null

  return (
    <>
      {/* Dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          width:  clicking ? 6 : hovering ? 8 : 7,
          height: clicking ? 6 : hovering ? 8 : 7,
          backgroundColor: hovering ? "#0891B2" : "#1B3A6B",
          transition: "width 0.15s, height 0.15s, background-color 0.2s",
        }}
      />

      {/* Ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9998] rounded-full border"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          width:  clicking ? 24 : hovering ? 40 : 32,
          height: clicking ? 24 : hovering ? 40 : 32,
          borderColor: hovering ? "#0891B2" : "#1B3A6B",
          opacity: clicking ? 0.5 : 0.35,
          transition: "width 0.2s, height 0.2s, border-color 0.2s, opacity 0.15s",
        }}
      />
    </>
  )
}
