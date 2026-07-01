import { createContext, useContext, useState, useCallback } from 'react'

// Lightweight bilingual support (English + Kannada). No external i18n library.
const STRINGS = {
  en: {
    app_name: 'Mathikere Ward CRM',
    login: 'Login', logout: 'Logout', email: 'Email', password: 'Password',
    signing_in: 'Signing in…', login_failed: 'Login failed. Check email/password.',
    dashboard: 'Dashboard', new_household: 'New Household', households: 'Households',
    users: 'Field Team', reports: 'Reports',
    // form
    household_details: 'Household Details',
    booth_number: 'Booth Number', part_number: 'Part Number',
    door_no: 'Door Number', street: 'Main & Cross Road', landmark: 'Landmark',
    ration_card: 'Ration Card', schemes: 'Guarantee Schemes',
    issues: 'Issues', issue_note: 'Issue Note',
    voters: 'Voters', voter_name: 'Voter Name', age: 'Age',
    voter_id: 'Voter ID Number', contact: 'Contact Number',
    add_voter: 'Add Voter', remove: 'Remove',
    use_gps: 'Tag GPS location', gps_tagged: 'Location tagged',
    save: 'Save', saved_offline: 'Saved on device — will sync when online',
    saved_synced: 'Saved & synced',
    select: 'Select', none: 'None', yes: 'Yes', no: 'No',
    required_booth: 'Please choose a booth number.',
    required_voter: 'Please add at least one voter with a name.',
    // schemes
    'Shakti': 'Shakti', 'Gruha Jyothi': 'Gruha Jyothi', 'Anna Bhagya': 'Anna Bhagya',
    'Gruha Lakshmi': 'Gruha Lakshmi', 'Yuva Nidhi': 'Yuva Nidhi',
    'Road': 'Road', 'BWSSB': 'BWSSB (Water)', 'Garbage': 'Garbage', 'Others': 'Others',
    'APL': 'APL', 'BPL': 'BPL',
    // sync
    pending_sync: 'waiting to sync', synced: 'All synced', offline: 'Offline', online: 'Online',
    sync_now: 'Sync now',
    // dashboard
    total_households: 'Households', total_voters: 'Voters',
    by_booth: 'By Booth', ration_split: 'Ration Card Split', scheme_coverage: 'Scheme Coverage',
    issues_reported: 'Issues Reported', collector_activity: 'Field Team Activity',
    export_excel: 'Export to Excel', search: 'Search name / voter ID / phone',
    consent_note: 'Collected with the resident’s consent for ward welfare purposes.',
    loading: 'Loading…', no_data: 'No data yet.',
    admin: 'Admin', supporter: 'Field Worker', booths_assigned: 'Booths',
    config_needed: 'Supabase is not connected yet. Add your project URL & key to the .env file, then restart.',
  },
  kn: {
    app_name: 'ಮಾತಿಕೆರೆ ವಾರ್ಡ್ CRM',
    login: 'ಲಾಗಿನ್', logout: 'ಲಾಗ್ ಔಟ್', email: 'ಇಮೇಲ್', password: 'ಪಾಸ್‌ವರ್ಡ್',
    signing_in: 'ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ…', login_failed: 'ಲಾಗಿನ್ ವಿಫಲ. ಇಮೇಲ್/ಪಾಸ್‌ವರ್ಡ್ ಪರಿಶೀಲಿಸಿ.',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', new_household: 'ಹೊಸ ಮನೆ', households: 'ಮನೆಗಳು',
    users: 'ಕ್ಷೇತ್ರ ತಂಡ', reports: 'ವರದಿಗಳು',
    household_details: 'ಮನೆಯ ವಿವರಗಳು',
    booth_number: 'ಬೂತ್ ಸಂಖ್ಯೆ', part_number: 'ಭಾಗ ಸಂಖ್ಯೆ',
    door_no: 'ಮನೆ ಸಂಖ್ಯೆ', street: 'ಮುಖ್ಯ ಮತ್ತು ಅಡ್ಡ ರಸ್ತೆ', landmark: 'ಗುರುತು ಸ್ಥಳ',
    ration_card: 'ಪಡಿತರ ಚೀಟಿ', schemes: 'ಗ್ಯಾರಂಟಿ ಯೋಜನೆಗಳು',
    issues: 'ಸಮಸ್ಯೆಗಳು', issue_note: 'ಸಮಸ್ಯೆ ಟಿಪ್ಪಣಿ',
    voters: 'ಮತದಾರರು', voter_name: 'ಮತದಾರರ ಹೆಸರು', age: 'ವಯಸ್ಸು',
    voter_id: 'ಮತದಾರರ ಗುರುತಿನ ಸಂಖ್ಯೆ', contact: 'ಸಂಪರ್ಕ ಸಂಖ್ಯೆ',
    add_voter: 'ಮತದಾರರನ್ನು ಸೇರಿಸಿ', remove: 'ತೆಗೆದುಹಾಕಿ',
    use_gps: 'GPS ಸ್ಥಳ ಗುರುತಿಸಿ', gps_tagged: 'ಸ್ಥಳ ಗುರುತಿಸಲಾಗಿದೆ',
    save: 'ಉಳಿಸಿ', saved_offline: 'ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ — ಆನ್‌ಲೈನ್ ಆದಾಗ ಸಿಂಕ್ ಆಗುತ್ತದೆ',
    saved_synced: 'ಉಳಿಸಲಾಗಿದೆ ಮತ್ತು ಸಿಂಕ್ ಆಗಿದೆ',
    select: 'ಆಯ್ಕೆಮಾಡಿ', none: 'ಯಾವುದೂ ಇಲ್ಲ', yes: 'ಹೌದು', no: 'ಇಲ್ಲ',
    required_booth: 'ದಯವಿಟ್ಟು ಬೂತ್ ಸಂಖ್ಯೆ ಆಯ್ಕೆಮಾಡಿ.',
    required_voter: 'ದಯವಿಟ್ಟು ಹೆಸರಿನೊಂದಿಗೆ ಕನಿಷ್ಠ ಒಬ್ಬ ಮತದಾರರನ್ನು ಸೇರಿಸಿ.',
    'Shakti': 'ಶಕ್ತಿ', 'Gruha Jyothi': 'ಗೃಹ ಜ್ಯೋತಿ', 'Anna Bhagya': 'ಅನ್ನ ಭಾಗ್ಯ',
    'Gruha Lakshmi': 'ಗೃಹ ಲಕ್ಷ್ಮಿ', 'Yuva Nidhi': 'ಯುವ ನಿಧಿ',
    'Road': 'ರಸ್ತೆ', 'BWSSB': 'BWSSB (ನೀರು)', 'Garbage': 'ಕಸ', 'Others': 'ಇತರೆ',
    'APL': 'APL', 'BPL': 'BPL',
    pending_sync: 'ಸಿಂಕ್ ಬಾಕಿ', synced: 'ಎಲ್ಲಾ ಸಿಂಕ್ ಆಗಿದೆ', offline: 'ಆಫ್‌ಲೈನ್', online: 'ಆನ್‌ಲೈನ್',
    sync_now: 'ಈಗ ಸಿಂಕ್ ಮಾಡಿ',
    total_households: 'ಮನೆಗಳು', total_voters: 'ಮತದಾರರು',
    by_booth: 'ಬೂತ್ ಪ್ರಕಾರ', ration_split: 'ಪಡಿತರ ಚೀಟಿ ವಿಭಜನೆ', scheme_coverage: 'ಯೋಜನೆ ವ್ಯಾಪ್ತಿ',
    issues_reported: 'ವರದಿಯಾದ ಸಮಸ್ಯೆಗಳು', collector_activity: 'ಕ್ಷೇತ್ರ ತಂಡ ಚಟುವಟಿಕೆ',
    export_excel: 'ಎಕ್ಸೆಲ್‌ಗೆ ರಫ್ತು', search: 'ಹೆಸರು / ಮತದಾರ ID / ಫೋನ್ ಹುಡುಕಿ',
    consent_note: 'ವಾರ್ಡ್ ಕಲ್ಯಾಣ ಉದ್ದೇಶಕ್ಕಾಗಿ ನಿವಾಸಿಯ ಒಪ್ಪಿಗೆಯೊಂದಿಗೆ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ.',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…', no_data: 'ಇನ್ನೂ ಡೇಟಾ ಇಲ್ಲ.',
    admin: 'ಆಡ್ಮಿನ್', supporter: 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಕರ್ತ', booths_assigned: 'ಬೂತ್‌ಗಳು',
    config_needed: 'Supabase ಇನ್ನೂ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ. .env ಫೈಲ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಪ್ರಾಜೆಕ್ಟ್ URL ಮತ್ತು ಕೀ ಸೇರಿಸಿ, ನಂತರ ಮರುಪ್ರಾರಂಭಿಸಿ.',
  }
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en')
  const toggle = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'kn' : 'en'
      localStorage.setItem('lang', next)
      return next
    })
  }, [])
  const t = useCallback((key) => (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key, [lang])
  return <I18nContext.Provider value={{ lang, t, toggle }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
