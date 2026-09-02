import type { StylesConfig } from 'react-select';

export type AssignmentSelectOption = {
  value: string;
  label: string;
};

export function getAssignmentSelectStyles(
  hasError: boolean,
): StylesConfig<AssignmentSelectOption, false> {
  return {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      borderRadius: '12px',
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
      borderColor: hasError
        ? 'var(--danger)'
        : state.isFocused
          ? 'var(--brand)'
          : 'var(--line)',
      boxShadow: state.isFocused
        ? '0 0 0 3px rgba(79, 124, 255, 0.15)'
        : 'none',
      cursor: 'pointer',
      transition: 'border-color 0.2s, box-shadow 0.2s',

      '&:hover': {
        borderColor: hasError ? 'var(--danger)' : 'var(--brand)',
      },
    }),

    valueContainer: (base) => ({
      ...base,
      padding: '2px 12px',
    }),

    input: (base) => ({
      ...base,
      color: 'var(--text)',
    }),

    singleValue: (base) => ({
      ...base,
      color: 'var(--text)',
    }),

    placeholder: (base) => ({
      ...base,
      color: 'var(--muted)',
    }),

    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? 'var(--text)' : 'var(--muted)',

      '&:hover': {
        color: 'var(--text)',
      },
    }),

    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: 'var(--line)',
    }),

    menu: (base) => ({
      ...base,
      zIndex: 30,
      overflow: 'hidden',
      padding: '4px',
      border: '1px solid var(--line)',
      borderRadius: '12px',
      backgroundColor: '#0b1020',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
    }),

    menuList: (base) => ({
      ...base,
      padding: 0,
    }),

    option: (base, state) => ({
      ...base,
      borderRadius: '8px',
      backgroundColor: state.isSelected
        ? 'rgba(79, 124, 255, 0.35)'
        : state.isFocused
          ? 'rgba(255, 255, 255, 0.08)'
          : 'transparent',
      color: 'var(--text)',
      cursor: 'pointer',

      '&:active': {
        backgroundColor: 'rgba(79, 124, 255, 0.25)',
      },
    }),

    noOptionsMessage: (base) => ({
      ...base,
      color: 'var(--muted)',
    }),
  };
}
