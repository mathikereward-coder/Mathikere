import { createContext, useContext, useState, useCallback } from 'react'

// Lightweight bilingual support (English + Kannada). No external i18n library.
const STRINGS = {
  en: {
    app_name: 'Mathikere Ward CRM',
    login: 'Login', logout: 'Logout', email: 'Email', password: 'Password',
    login_id: 'Phone number or Email', login_id_hint: 'Workers: enter your phone number',
    signing_in: 'Signing in…', login_failed: 'Login failed. Check your phone/email and password.',
    dashboard: 'Dashboard', new_household: 'New Entry', households: 'Residents',
    users: 'Field Team', reports: 'Reports',
    // new fields / UI
    gender: 'Gender', male: 'Male', female: 'Female',
    house_ownership: 'House', own: 'Own', rented: 'Rented', booth_na: '0 - NA',
    mark_special: 'Mark Special', special_list: 'Special List', all_residents: 'All Residents',
    note_on_issues: 'Note on Issues', contact_invalid: 'Contact number must be exactly 10 digits.',
    submitted_title: 'Entry Submitted!', start_new_entry: 'New Entry',
    allow_special: 'Allow Special', hide_special: 'Hide Special', sees_special: 'sees special',
    'Voter ID Related': 'Voter ID Related', 'Drainage Issues': 'Drainage Issues', 'Water Supply': 'Water Supply',
    'Garbage Clearance': 'Garbage Clearance', 'Street Light Complaints': 'Street Light Complaints',
    'Pension & Government Scheme Assistance': 'Pension & Scheme Help', 'Road Repairs': 'Road Repairs',
    'Other Civic Issues': 'Other Civic Issues',
    // team management
    field_team: 'Field Team', add_worker: 'Add Worker', worker_name: 'Worker Name',
    phone_number: 'Phone Number', set_password: 'Set Password', assign_booths: 'Assign Booths (1–23)',
    create_worker: 'Create Worker', cancel: 'Cancel', reset_password: 'Reset Password',
    new_password: 'New Password', deactivate: 'Deactivate', activate: 'Activate',
    make_admin: 'Make Admin', make_worker: 'Make Field Worker', role_admin: 'Admin', role_worker: 'Field Worker',
    active_label: 'Active', inactive_label: 'No access', no_workers: 'No workers yet. Add your first one above.',
    worker_created: 'Worker created. Share their phone + password so they can log in.',
    booths_label: 'Booths', all: 'All', edit_booths: 'Edit Booths', save_booths: 'Save Booths',
    saved_ok: 'Saved', confirm_deactivate: 'Remove this person’s access?',
    login_as_worker: 'They log in at this same web address using phone number + password.',
    sees_mobile: 'sees mobile', hide_mobile: 'Hide Mobile', allow_mobile: 'Allow Mobile',
    // roles / super admin
    super_admin: 'Super Admin', you: 'You', members_title: 'Members', field_workers: 'Field Workers',
    add_member: 'Add Member', member_help: 'Members have full admin rights (max 5). They can manage workers but not other members.',
    no_members: 'No members yet.', role_member: 'Member', remove_admin: 'Remove Admin', make_member: 'Make Member',
    // households view
    captured_by: 'Captured by', tap_details: 'tap for details', all_booths: 'All booths',
    contact_hidden: 'Hidden — ask admin', details: 'Details', close: 'Close',
    // form
    household_details: 'Household Details',
    booth_number: 'Booth', part_number: 'Serial No',
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
    login_id: 'ಫೋನ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್', login_id_hint: 'ಕಾರ್ಯಕರ್ತರು: ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ',
    signing_in: 'ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ…', login_failed: 'ಲಾಗಿನ್ ವಿಫಲ. ಫೋನ್/ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಪರಿಶೀಲಿಸಿ.',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', new_household: 'ಹೊಸ ನಮೂದು', households: 'ನಿವಾಸಿಗಳು',
    users: 'ಕ್ಷೇತ್ರ ತಂಡ', reports: 'ವರದಿಗಳು',
    gender: 'ಲಿಂಗ', male: 'ಪುರುಷ', female: 'ಮಹಿಳೆ',
    house_ownership: 'ಮನೆ', own: 'ಸ್ವಂತ', rented: 'ಬಾಡಿಗೆ', booth_na: '0 - ಗೊತ್ತಿಲ್ಲ',
    mark_special: 'ವಿಶೇಷ ಗುರುತಿಸಿ', special_list: 'ವಿಶೇಷ ಪಟ್ಟಿ', all_residents: 'ಎಲ್ಲಾ ನಿವಾಸಿಗಳು',
    note_on_issues: 'ಸಮಸ್ಯೆಗಳ ಟಿಪ್ಪಣಿ', contact_invalid: 'ಸಂಪರ್ಕ ಸಂಖ್ಯೆ ನಿಖರವಾಗಿ 10 ಅಂಕಿಗಳಾಗಿರಬೇಕು.',
    submitted_title: 'ನಮೂದು ಸಲ್ಲಿಸಲಾಗಿದೆ!', start_new_entry: 'ಹೊಸ ನಮೂದು',
    allow_special: 'ವಿಶೇಷ ಅನುಮತಿಸಿ', hide_special: 'ವಿಶೇಷ ಮರೆಮಾಡಿ', sees_special: 'ವಿಶೇಷ ನೋಡಬಹುದು',
    'Voter ID Related': 'ಮತದಾರ ID ಸಂಬಂಧಿ', 'Drainage Issues': 'ಚರಂಡಿ ಸಮಸ್ಯೆ', 'Water Supply': 'ನೀರು ಪೂರೈಕೆ',
    'Garbage Clearance': 'ಕಸ ವಿಲೇವಾರಿ', 'Street Light Complaints': 'ಬೀದಿ ದೀಪ ದೂರು',
    'Pension & Government Scheme Assistance': 'ಪಿಂಚಣಿ ಮತ್ತು ಯೋಜನೆ ಸಹಾಯ', 'Road Repairs': 'ರಸ್ತೆ ದುರಸ್ತಿ',
    'Other Civic Issues': 'ಇತರ ನಾಗರಿಕ ಸಮಸ್ಯೆ',
    field_team: 'ಕ್ಷೇತ್ರ ತಂಡ', add_worker: 'ಕಾರ್ಯಕರ್ತರನ್ನು ಸೇರಿಸಿ', worker_name: 'ಕಾರ್ಯಕರ್ತರ ಹೆಸರು',
    phone_number: 'ಫೋನ್ ಸಂಖ್ಯೆ', set_password: 'ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿಸಿ', assign_booths: 'ಬೂತ್‌ಗಳನ್ನು ನಿಯೋಜಿಸಿ (1–23)',
    create_worker: 'ಕಾರ್ಯಕರ್ತರನ್ನು ರಚಿಸಿ', cancel: 'ರದ್ದುಮಾಡಿ', reset_password: 'ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ',
    new_password: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್', deactivate: 'ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ', activate: 'ಸಕ್ರಿಯಗೊಳಿಸಿ',
    make_admin: 'ಆಡ್ಮಿನ್ ಮಾಡಿ', make_worker: 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಕರ್ತ ಮಾಡಿ', role_admin: 'ಆಡ್ಮಿನ್', role_worker: 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಕರ್ತ',
    active_label: 'ಸಕ್ರಿಯ', inactive_label: 'ಪ್ರವೇಶವಿಲ್ಲ', no_workers: 'ಇನ್ನೂ ಕಾರ್ಯಕರ್ತರಿಲ್ಲ. ಮೇಲೆ ಮೊದಲಿಗರನ್ನು ಸೇರಿಸಿ.',
    worker_created: 'ಕಾರ್ಯಕರ್ತ ರಚಿಸಲಾಗಿದೆ. ಲಾಗಿನ್ ಆಗಲು ಅವರ ಫೋನ್ + ಪಾಸ್‌ವರ್ಡ್ ಹಂಚಿಕೊಳ್ಳಿ.',
    booths_label: 'ಬೂತ್‌ಗಳು', all: 'ಎಲ್ಲಾ', edit_booths: 'ಬೂತ್‌ಗಳನ್ನು ಸಂಪಾದಿಸಿ', save_booths: 'ಬೂತ್‌ಗಳನ್ನು ಉಳಿಸಿ',
    saved_ok: 'ಉಳಿಸಲಾಗಿದೆ', confirm_deactivate: 'ಈ ವ್ಯಕ್ತಿಯ ಪ್ರವೇಶವನ್ನು ತೆಗೆದುಹಾಕುವುದೇ?',
    login_as_worker: 'ಅವರು ಇದೇ ವೆಬ್ ವಿಳಾಸದಲ್ಲಿ ಫೋನ್ ಸಂಖ್ಯೆ + ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ ಲಾಗಿನ್ ಆಗುತ್ತಾರೆ.',
    sees_mobile: 'ಮೊಬೈಲ್ ನೋಡಬಹುದು', hide_mobile: 'ಮೊಬೈಲ್ ಮರೆಮಾಡಿ', allow_mobile: 'ಮೊಬೈಲ್ ಅನುಮತಿಸಿ',
    super_admin: 'ಸೂಪರ್ ಅಡ್ಮಿನ್', you: 'ನೀವು', members_title: 'ಸದಸ್ಯರು', field_workers: 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಕರ್ತರು',
    add_member: 'ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ', member_help: 'ಸದಸ್ಯರಿಗೆ ಪೂರ್ಣ ಅಡ್ಮಿನ್ ಹಕ್ಕುಗಳಿವೆ (ಗರಿಷ್ಠ 5). ಅವರು ಕಾರ್ಯಕರ್ತರನ್ನು ನಿರ್ವಹಿಸಬಹುದು, ಆದರೆ ಇತರ ಸದಸ್ಯರನ್ನಲ್ಲ.',
    no_members: 'ಇನ್ನೂ ಸದಸ್ಯರಿಲ್ಲ.', role_member: 'ಸದಸ್ಯ', remove_admin: 'ಅಡ್ಮಿನ್ ತೆಗೆದುಹಾಕಿ', make_member: 'ಸದಸ್ಯರನ್ನಾಗಿ ಮಾಡಿ',
    captured_by: 'ದಾಖಲಿಸಿದವರು', tap_details: 'ವಿವರಗಳಿಗೆ ಟ್ಯಾಪ್ ಮಾಡಿ', all_booths: 'ಎಲ್ಲಾ ಬೂತ್‌ಗಳು',
    contact_hidden: 'ಮರೆಮಾಡಲಾಗಿದೆ — ಆಡ್ಮಿನ್‌ರನ್ನು ಕೇಳಿ', details: 'ವಿವರಗಳು', close: 'ಮುಚ್ಚಿ',
    household_details: 'ಮನೆಯ ವಿವರಗಳು',
    booth_number: 'ಬೂತ್', part_number: 'ಕ್ರಮ ಸಂಖ್ಯೆ',
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
