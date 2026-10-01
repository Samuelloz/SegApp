'use client';

import {
  type CountryCode,
  formatIncompletePhoneNumber,
  getCountries,
  getCountryCallingCode,
  parseDigits,
} from 'libphonenumber-js/min';
import { useMemo, useState } from 'react';
import Select from 'react-select';

import {
  buildE164PhoneNumber,
  getNationalPhoneDigits,
} from '@/lib/phone-number';

import Input from './Input';
import { type AppSelectOption, getSelectStyles } from './select.styles';

import styles from './InternationalPhoneField.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  inputId?: string;
  label?: string;
};

const countryNames = new Intl.DisplayNames(['es'], { type: 'region' });

export default function InternationalPhoneField({
  value,
  onChange,
  onBlur,
  error,
  inputId = 'international-phone',
  label = 'Teléfono',
}: Props) {
  const [country, setCountry] = useState<CountryCode>('MX');

  const countryOptions = useMemo<Array<AppSelectOption<CountryCode>>>(() => {
    return getCountries()
      .map((countryCode) => ({
        countryCode,
        name: countryNames.of(countryCode) ?? countryCode,
      }))
      .sort((first, second) =>
        first.name.localeCompare(second.name, 'es', {
          sensitivity: 'base',
        }),
      )
      .map(({ countryCode, name }) => ({
        value: countryCode,
        label: `${name} (+${getCountryCallingCode(countryCode)})`,
      }));
  }, []);

  const nationalDigits = getNationalPhoneDigits(value, country);
  const displayedNumber = formatIncompletePhoneNumber(nationalDigits, country);
  const errorId = `${inputId}-error`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>

      <div className={styles.inputs}>
        <Select<AppSelectOption<CountryCode>, false>
          instanceId={`${inputId}-country`}
          inputId={`${inputId}-country`}
          aria-label="País y prefijo telefónico"
          value={
            countryOptions.find((option) => option.value === country) ?? null
          }
          options={countryOptions}
          onChange={(option) => {
            const nextCountry = option?.value ?? 'MX';
            const currentNationalNumber = getNationalPhoneDigits(
              value,
              country,
            );

            setCountry(nextCountry);
            onChange(buildE164PhoneNumber(nextCountry, currentNationalNumber));
          }}
          onBlur={onBlur}
          isSearchable
          styles={getSelectStyles<CountryCode>(Boolean(error), {
            menuMinWidth: 240,
          })}
          noOptionsMessage={() => 'No se encontró el país'}
          formatOptionLabel={(option, { context }) => (
            <span className={styles.countryOption}>
              <span
                className={`${styles.countryFlag} flag:${option.value}`}
                aria-hidden="true"
              />
              <span>
                {context === 'value'
                  ? `+${getCountryCallingCode(option.value)}`
                  : option.label}
              </span>
            </span>
          )}
        />

        <Input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="871 144 0644"
          value={displayedNumber}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(
              buildE164PhoneNumber(country, parseDigits(event.target.value)),
            );
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
