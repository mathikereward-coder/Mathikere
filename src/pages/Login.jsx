import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { isConfigured } from '../supabaseClient'
import { WARD_NAME } from '../constants'
import LangToggle from '../components/LangToggle'

export default function Login() {
  const { t } = useI18n()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      await signIn(email.trim(), password)
      navigate('/new')
    } catch (err) {
      setError(t('login_failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-head">
          <img src="/icon.svg" className="login-logo" alt="" />
          <LangToggle />
        </div>
        <h1>{WARD_NAME}</h1>
        <p className="muted">{t('app_name')}</p>

        {!isConfigured && <div className="banner-warn">{t('config_needed')}</div>}

        <form onSubmit={onSubmit}>
          <label>{t('email')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                 autoComplete="username" required disabled={!isConfigured} />
          <label>{t('password')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                 autoComplete="current-password" required disabled={!isConfigured} />
          {error && <div className="banner-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={busy || !isConfigured}>
            {busy ? t('signing_in') : t('login')}
          </button>
        </form>
      </div>
    </div>
  )
}
