import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'newtonlab-theme'

const current = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

/** Switches between light and dark. The choice is remembered; until then the page follows the system setting. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(current)

  // Follow the system setting until the visitor picks a theme themselves.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      let saved: string | null = null
      try {
        saved = localStorage.getItem(STORAGE_KEY)
      } catch {
        // storage blocked: just follow the system
      }
      if (saved) return
      document.documentElement.dataset.theme = e.matches ? 'dark' : 'light'
      setTheme(current())
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  const toggle = () => {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // private mode or blocked storage: the switch still works for this visit
    }
    setTheme(next)
  }

  return (
    <button className="btn icon" onClick={toggle} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}
