import type { Guard, GuardFormValues } from '@segapp/contracts';

export function getEmptyGuardFormValues(): GuardFormValues {
  return {
    fullName: '',
    fatherFullName: '',
    motherFullName: '',
    birthDate: '',
    birthPlace: '',
    employeeNumber: '',
    hiredAt: '',
    phone: '',
    rfc: '',
    curp: '',
    nss: '',
    street: '',
    exteriorNumber: '',
    interiorNumber: '',
    neighborhood: '',
    postalCode: '',
    city: '',
    municipality: '',
    state: '',
    country: '',
    formattedAddress: '',
    latitude: '',
    longitude: '',
    externalPlaceId: '',
  };
}

export function guardToFormValues(guard: Guard): GuardFormValues {
  return {
    fullName: guard.fullName,
    fatherFullName: guard.fatherFullName,
    motherFullName: guard.motherFullName,
    birthDate: guard.birthDate.slice(0, 10),
    birthPlace: guard.birthPlace,
    employeeNumber: guard.employeeNumber,
    hiredAt: guard.hiredAt.slice(0, 10),
    phone: guard.phone ?? '',
    rfc: guard.rfc,
    curp: guard.curp,
    nss: guard.nss,
    street: guard.street ?? '',
    exteriorNumber: guard.exteriorNumber ?? '',
    interiorNumber: guard.interiorNumber ?? '',
    neighborhood: guard.neighborhood ?? '',
    postalCode: guard.postalCode ?? '',
    city: guard.city ?? '',
    municipality: guard.municipality ?? '',
    state: guard.state ?? '',
    country: guard.country ?? '',
    formattedAddress: guard.formattedAddress ?? '',
    latitude: guard.latitude?.toString() ?? '',
    longitude: guard.longitude?.toString() ?? '',
    externalPlaceId: guard.externalPlaceId ?? '',
  };
}

export function calculateGuardAge(birthDate: string): number | null {
  const datePart = birthDate.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) return null;

  const today = new Date();
  let age = today.getFullYear() - year;

  const hasNotHadBirthday =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);

  if (hasNotHadBirthday) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function formatGuardDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');

  return `${day}/${month}/${year}`;
}

export function getGuardAddress(guard: Guard): string {
  if (guard.formattedAddress) {
    return guard.formattedAddress;
  }

  const streetLine = [
    guard.street,
    guard.exteriorNumber,
    guard.interiorNumber ? `Int. ${guard.interiorNumber}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return [
    streetLine,
    guard.neighborhood,
    guard.postalCode,
    guard.city,
    guard.municipality,
    guard.state,
    guard.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export function matchesGuardSearch(guard: Guard, searchValue: string): boolean {
  const search = searchValue.trim().toLowerCase();

  if (!search) return true;

  return [
    guard.fullName,
    guard.employeeNumber,
    guard.phone,
    guard.rfc,
    guard.curp,
    guard.nss,
  ].some((value) => value?.toLowerCase().includes(search));
}

export function getTodayInputDate(): string {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export function hasGuardAddress(values: GuardFormValues): boolean {
  return [
    values.street,
    values.exteriorNumber,
    values.interiorNumber,
    values.neighborhood,
    values.postalCode,
    values.city,
    values.municipality,
    values.state,
    values.country,
  ].some((value) => value.trim() !== '');
}
