import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/people', label: 'People' },
  { to: '/events', label: 'Events' },
  { to: '/projects', label: 'Projects' },
  { to: '/directory', label: 'Directory' },
]

const navClass = ({ isActive }) => (isActive ? 'font-bold text-maroon' : 'hover:text-maroon')

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const accountLinks = user ? (
    <>
      <NavLink to="/profile" className="rounded-full border border-maroon px-4 py-1.5 text-center">
        {user.preferred_name}
      </NavLink>
      <button onClick={handleLogout} className="rounded-full bg-maroon px-4 py-1.5 text-white">
        Logout
      </button>
    </>
  ) : (
    <>
      <NavLink to="/login" className="rounded-full border border-maroon px-4 py-1.5 text-center">
        Login
      </NavLink>
      <NavLink to="/register" className="rounded-full bg-maroon px-4 py-1.5 text-center text-white">
        Register
      </NavLink>
    </>
  )

  return (
    <>
      <div className="bg-maroon-dark py-2 text-xs text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-x-4 gap-y-1 px-4 sm:px-6">
          <span>University of Peradeniya | Alumni Relations Office | pdn.ac.lk</span>
          <a href="mailto:aro@pdn.ac.lk" className="hover:underline">
            Contact: aro@pdn.ac.lk
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-maroon bg-white">
              <img src="/images/uop-logo.png" className="h-full w-full rounded-full object-cover" alt="UOP Logo" />
            </div>
            <div>
              <div className="font-bold text-maroon">University of Peradeniya</div>
              <div className="text-xs text-gray-500">Global Alumni Connect</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}
            {accountLinks}
          </nav>

          <button
            className="rounded-lg p-2 text-maroon lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {open ? <path d="M6 18 18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {open && (
          <nav className="flex flex-col gap-3 border-t px-4 py-4 text-sm font-medium lg:hidden">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex gap-3">{accountLinks}</div>
          </nav>
        )}
      </header>
    </>
  )
}
