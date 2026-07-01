// Shared option lists. Values are stored in the database; labels are translated in i18n.js.

export const WARD_NAME = 'Mathikere Ward'

export const BOOTHS = Array.from({ length: 23 }, (_, i) => i + 1) // 1..23

export const RATION_CARDS = ['APL', 'BPL', 'None']

export const SCHEMES = ['Shakti', 'Gruha Jyothi', 'Anna Bhagya', 'Gruha Lakshmi', 'Yuva Nidhi']

export const ISSUES = ['Road', 'BWSSB', 'Garbage', 'Others']

// Workers log in with a phone number; internally it maps to a synthetic email.
// Admins log in with their real email. This helper accepts either.
export const WORKER_EMAIL_DOMAIN = 'mathikere-ward.app'

export function loginIdToEmail(input) {
  const v = (input || '').trim()
  if (v.includes('@')) return v.toLowerCase()
  const digits = v.replace(/[^0-9]/g, '')
  return `${digits}@${WORKER_EMAIL_DOMAIN}`
}
