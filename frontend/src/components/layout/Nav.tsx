import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import './Nav.css'

const landingSections = [
  { id: 'workflow',   label: 'Workflow' },
  { id: 'roles',      label: 'Three Roles' },
  { id: 'why-canton', label: 'Why Canton' },
]

const appLinks = [
  { to: '/app',       label: 'Desk'      },
  { to: '/positions', label: 'Positions' },
  { to: '/audit',     label: 'Audit'     },
  { to: '/setup',     label: 'Setup'     },
  { to: '/docs',      label: 'Docs'      },
]

export default function Nav() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    if (!isLandingPage) return

    const sectionIds = ['workflow', 'roles', 'why-canton']
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200
      let current = ''
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= scrollPos) {
          current = id
        }
      }
      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isLandingPage])

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
      setActiveSection(id)
      window.history.pushState(null, '', `#${id}`)
    }
  }

  return (
    <header className="nav-wrapper" role="banner">
      <nav className="nav glass-nav" aria-label="Main navigation">
        <Link to="/" className="nav-logo" aria-label="Tacet home">
          <span className="nav-logo-mark">T</span>
          <span className="nav-logo-name">Tacet</span>
        </Link>

        <ul className="nav-links" role="list">
          {isLandingPage
            ? landingSections.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => handleScrollTo(e, id)}
                    className={`nav-link ${activeSection === id ? 'nav-link--active' : ''}`}
                  >
                    {label}
                  </a>
                </li>
              ))
            : appLinks.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link--active' : ''}`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
        </ul>

        <div className="nav-end">
          <span className="nav-tag">Canton / Daml</span>
          <Link to="/app" className="nav-cta" id="nav-open-desk">
            Open Desk
          </Link>
        </div>
      </nav>
    </header>
  )
}
