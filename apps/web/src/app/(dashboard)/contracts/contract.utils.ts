import type { Contract, ContractFormValues } from '@segapp/contracts';

export function getEmptyContractFormValues(): ContractFormValues {
  return {
    name: '',
    clientLegalName: '',
    clientRfc: '',
    startDate: '',
    endDate: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    requiredGuardCount: 1,
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

export function contractToFormValues(contract: Contract): ContractFormValues {
  return {
    name: contract.name,
    clientLegalName: contract.clientLegalName,
    clientRfc: contract.clientRfc,
    startDate: contract.startDate.slice(0, 10),
    endDate: contract.endDate?.slice(0, 10) ?? '',
    contactName: contract.contactName,
    contactPhone: contract.contactPhone,
    contactEmail: contract.contactEmail ?? '',
    requiredGuardCount: contract.requiredGuardCount,
    street: contract.street ?? '',
    exteriorNumber: contract.exteriorNumber ?? '',
    interiorNumber: contract.interiorNumber ?? '',
    neighborhood: contract.neighborhood ?? '',
    postalCode: contract.postalCode ?? '',
    city: contract.city ?? '',
    municipality: contract.municipality ?? '',
    state: contract.state ?? '',
    country: contract.country ?? '',
    formattedAddress: contract.formattedAddress ?? '',
    latitude: contract.latitude?.toString() ?? '',
    longitude: contract.longitude?.toString() ?? '',
    externalPlaceId: contract.externalPlaceId ?? '',
  };
}

export function formatContractDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');

  return `${day}/${month}/${year}`;
}

export function getContractAddress(contract: Contract): string {
  if (contract.formattedAddress) {
    return contract.formattedAddress;
  }

  const streetLine = [
    contract.street,
    contract.exteriorNumber,
    contract.interiorNumber ? `Int. ${contract.interiorNumber}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return [
    streetLine,
    contract.neighborhood,
    contract.postalCode,
    contract.city,
    contract.municipality,
    contract.state,
    contract.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export function matchesContractSearch(
  contract: Contract,
  searchValue: string,
): boolean {
  const search = searchValue.trim().toLowerCase();

  if (!search) return true;

  return [
    contract.name,
    contract.clientLegalName,
    contract.clientRfc,
    contract.contactName,
    contract.contactEmail,
  ].some((value) => value?.toLowerCase().includes(search));
}

export function hasContractAddress(values: ContractFormValues): boolean {
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
    values.formattedAddress,
  ].some((value) => value.trim() !== '');
}
