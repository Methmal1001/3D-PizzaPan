// Frontend-only form validation for the checkout.

export const CITIES = [
  'Colombo 01 – Fort',
  'Colombo 03 – Kollupitiya',
  'Colombo 04 – Bambalapitiya',
  'Colombo 05 – Havelock Town',
  'Colombo 06 – Wellawatte',
  'Colombo 07 – Cinnamon Gardens',
  'Colombo 08 – Borella',
  'Rajagiriya',
  'Battaramulla',
  'Nugegoda',
  'Dehiwala',
  'Mount Lavinia',
  'Kotte',
]

export const normalisePhone = (v) => String(v || '').replace(/[\s()-]/g, '')

/** Sri Lankan mobile numbers: 07XXXXXXXX or +947XXXXXXXX */
export const isValidMobile = (v) => /^(?:\+94|0094|0)?7\d{8}$/.test(normalisePhone(v))

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim())

/**
 * @returns {Record<string,string>} map of field -> error message (empty when valid)
 */
export function validateCustomer(customer, deliveryMethod = 'delivery') {
  const errors = {}
  const name = String(customer.fullName || '').trim()
  if (!name) errors.fullName = 'Please enter your full name.'
  else if (name.length < 3) errors.fullName = 'Name looks too short.'
  else if (!/^[\p{L} .'-]+$/u.test(name)) errors.fullName = 'Use letters, spaces, apostrophes or hyphens only.'

  if (!String(customer.mobile || '').trim()) errors.mobile = 'Mobile number is required so the rider can reach you.'
  else if (!isValidMobile(customer.mobile)) errors.mobile = 'Enter a valid Sri Lankan mobile, e.g. 077 123 4567.'

  if (String(customer.email || '').trim() && !isValidEmail(customer.email)) {
    errors.email = 'That email address doesn’t look right.'
  }

  if (deliveryMethod === 'delivery') {
    const address = String(customer.address || '').trim()
    if (!address) errors.address = 'Delivery address is required.'
    else if (address.length < 8) errors.address = 'Please add a little more detail (house no., street).'
    if (!customer.city) errors.city = 'Choose your city / delivery area.'
  }

  if (String(customer.instructions || '').length > 200) {
    errors.instructions = 'Please keep instructions under 200 characters.'
  }
  return errors
}
