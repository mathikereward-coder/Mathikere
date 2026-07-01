import { useI18n } from '../i18n'

export default function LangToggle() {
  const { lang, toggle } = useI18n()
  return (
    <button className="lang-toggle" onClick={toggle} title="Language">
      {lang === 'en' ? 'ಕನ್ನಡ' : 'EN'}
    </button>
  )
}
