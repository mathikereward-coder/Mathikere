// Shared option lists. Values are stored in the database; labels are translated in i18n.js.

export const WARD_NAME = 'Mathikere Ward'

// Booths 1..35 (used when assigning workers). The entry form also allows 0 = NA.
export const BOOTHS = Array.from({ length: 35 }, (_, i) => i + 1)
export const FORM_BOOTHS = [0, ...BOOTHS] // 0 shown as "0 - NA (don't know)"

export const RATION_CARDS = ['APL', 'BPL', 'None']

export const HOUSE_OWNERSHIP = ['Own', 'Rented']

export const GENDERS = ['M', 'F']

// Guarantee schemes (multi-select). 'None' is exclusive.
export const SCHEMES = ['None', 'Shakti', 'Gruha Jyothi', 'Anna Bhagya', 'Gruha Lakshmi', 'Yuva Nidhi']

// Civic issues (multi-select). 'None' is exclusive.
export const ISSUES = [
  'Voter ID Related', 'Drainage Issues', 'Water Supply', 'Garbage Clearance',
  'Street Light Complaints', 'Pension & Government Scheme Assistance', 'Road Repairs',
  'Other Civic Issues', 'None'
]

export const ISSUE_ICONS = {
  'Voter ID Related': '🪪', 'Drainage Issues': '🕳️', 'Water Supply': '🚰',
  'Garbage Clearance': '🗑️', 'Street Light Complaints': '💡',
  'Pension & Government Scheme Assistance': '🏛️', 'Road Repairs': '🛣️',
  'Other Civic Issues': '🧾', 'None': '✖️'
}

// Workers log in with a phone number; internally it maps to a synthetic email.
// Admins log in with their real email. This helper accepts either.
export const WORKER_EMAIL_DOMAIN = 'mathikere-ward.app'

export function loginIdToEmail(input) {
  const v = (input || '').trim()
  if (v.includes('@')) return v.toLowerCase()
  const digits = v.replace(/[^0-9]/g, '')
  return `${digits}@${WORKER_EMAIL_DOMAIN}`
}
