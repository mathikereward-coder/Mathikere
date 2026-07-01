import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { WARD_NAME } from '../constants'
import LangToggle from './LangToggle'
import SyncBadge from './SyncBadge'

export default function Layout() {
  const { t } = useI18n()
  const { isAdmin, profile, signOut } = useAuth()

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/icon.svg" alt="" className="brand-logo" />
          <div>
            <div className="brand-title">{WARD_NAME}</div>
            <div className="brand-sub">{isAdmin ? t('admin') : t('supporter')}{profile?.full_name ? ` · ${profile.full_name}` : ''}</div>
          </div>
        </div>
        <div className="topbar-actions">
          <SyncBadge />
          <LangToggle />
          <button className="btn-ghost" onClick={signOut}>{t('logout')}</button>
        </div>
      </header>

      <nav className="tabbar">
        <NavLink to="/new" className="tab">➕ {t('new_household')}</NavLink>
        {isAdmin && <NavLink to="/dashboard" className="tab">📊 {t('dashboard')}</NavLink>}
        {isAdmin && <NavLink to="/households" className="tab">🏠 {t('households')}</NavLink>}
      </nav>

      <main className="content"><Outlet /></main>
    </div>
  )
}
