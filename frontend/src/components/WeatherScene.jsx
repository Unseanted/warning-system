import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/** Ambient climate animation: rain drops + floating cloud shapes */
export default function WeatherScene() {
  const root = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.cloud', {
        x: '+=40',
        duration: 8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        stagger: 1.2,
      })
      gsap.to('.drop', {
        y: 120,
        opacity: 0,
        duration: 1.2,
        repeat: -1,
        ease: 'power1.in',
        stagger: { each: 0.08, repeat: -1 },
      })
      gsap.to('.glow-orb', {
        scale: 1.15,
        opacity: 0.5,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="glow-orb absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="cloud absolute left-[10%] top-16 h-10 w-28 rounded-full bg-slate-400/10 blur-sm" />
      <div className="cloud absolute right-[15%] top-28 h-8 w-36 rounded-full bg-slate-300/10 blur-sm" />
      <div className="cloud absolute left-[40%] top-12 h-12 w-40 rounded-full bg-sky-400/10 blur-md" />
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="drop absolute top-0 h-3 w-0.5 rounded-full bg-sky-400/40"
          style={{ left: `${8 + i * 5}%`, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}
