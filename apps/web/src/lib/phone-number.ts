import {
  getCountryCallingCode,
  isValidPhoneNumber,
  parseDigits,
  type CountryCode,
} from 'libphonenumber-js/min';

export function buildE164PhoneNumber(
  country: CountryCode,
  nationalNumber: string,
): string {
  const digits = parseDigits(nationalNumber);

  if (!digits) {
    return '';
  }

  return `+${getCountryCallingCode(country)}${digits}`;
}

export function getNationalPhoneDigits(
  value: string,
  country: CountryCode,
): string {
  const digits = parseDigits(value);
  const callingCode = getCountryCallingCode(country);

  return digits.startsWith(callingCode)
    ? digits.slice(callingCode.length)
    : digits;
}

export function isValidE164PhoneNumber(value: string): boolean {
  return isValidPhoneNumber(value);
}
