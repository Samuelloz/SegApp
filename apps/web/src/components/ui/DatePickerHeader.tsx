'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ReactDatePickerCustomHeaderProps } from 'react-datepicker';

import styles from './gloablUiCss/DatePickerHeader.module.css';

type CalendarView = 'days' | 'months' | 'years';

type DatePickerHeaderProps = ReactDatePickerCustomHeaderProps & {
  minDate: Date;
  maxDate: Date;
};

const MONTHS = Array.from({ length: 12 }, (_, month) =>
  format(new Date(2020, month, 1), 'MMM', { locale: es }),
);

const YEARS_PER_PAGE = 12;

function getFirstYearInPage(year: number) {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

export default function DatePickerHeader({
  date,
  changeMonth,
  changeYear,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
  minDate,
  maxDate,
}: DatePickerHeaderProps) {
  const [view, setView] = useState<CalendarView>('days');
  const [firstYearInPage, setFirstYearInPage] = useState(() =>
    getFirstYearInPage(date.getFullYear()),
  );

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();
  const minMonthKey = minDate.getFullYear() * 12 + minDate.getMonth();
  const maxMonthKey = maxDate.getFullYear() * 12 + maxDate.getMonth();
  const years = Array.from(
    { length: YEARS_PER_PAGE },
    (_, index) => firstYearInPage + index,
  );

  const isPreviousDisabled =
    view === 'days'
      ? prevMonthButtonDisabled
      : view === 'months'
        ? currentYear <= minDate.getFullYear()
        : firstYearInPage <= minDate.getFullYear();

  const isNextDisabled =
    view === 'days'
      ? nextMonthButtonDisabled
      : view === 'months'
        ? currentYear >= maxDate.getFullYear()
        : firstYearInPage + YEARS_PER_PAGE > maxDate.getFullYear();

  function handlePrevious() {
    if (view === 'days') {
      decreaseMonth();
      return;
    }

    if (view === 'months') {
      changeYear(currentYear - 1);
      return;
    }

    setFirstYearInPage((year) => year - YEARS_PER_PAGE);
  }

  function handleNext() {
    if (view === 'days') {
      increaseMonth();
      return;
    }

    if (view === 'months') {
      changeYear(currentYear + 1);
      return;
    }

    setFirstYearInPage((year) => year + YEARS_PER_PAGE);
  }

  function handleOpenMonths() {
    setView('months');
  }

  function handleOpenYears() {
    setFirstYearInPage(getFirstYearInPage(currentYear));
    setView('years');
  }

  function handleMonthChange(month: number) {
    changeMonth(month);
    setView('days');
  }

  function handleYearChange(year: number) {
    changeYear(year);
    setView('months');
  }

  return (
    <div className={styles.header}>
      <button
        type="button"
        className={`${styles.navigationButton} ${styles.previousButton}`}
        onClick={handlePrevious}
        disabled={isPreviousDisabled}
        aria-label={view === 'days' ? 'Mes anterior' : 'Periodo anterior'}
      >
        ‹
      </button>

      <div className={styles.dateNavigation}>
        <button
          type="button"
          className={styles.dateButton}
          onClick={handleOpenMonths}
        >
          {format(date, 'MMMM', { locale: es })}
        </button>

        <button
          type="button"
          className={styles.dateButton}
          onClick={handleOpenYears}
        >
          {currentYear}
        </button>
      </div>

      <button
        type="button"
        className={`${styles.navigationButton} ${styles.nextButton}`}
        onClick={handleNext}
        disabled={isNextDisabled}
        aria-label={view === 'days' ? 'Mes siguiente' : 'Periodo siguiente'}
      >
        ›
      </button>

      {view === 'months' && (
        <div className={styles.selectionPanel}>
          <div className={styles.monthGrid}>
            {MONTHS.map((monthName, month) => {
              const monthKey = currentYear * 12 + month;
              const isDisabled =
                monthKey < minMonthKey || monthKey > maxMonthKey;

              return (
                <button
                  key={monthName}
                  type="button"
                  className={`${styles.optionButton} ${
                    month === currentMonth ? styles.selectedOption : ''
                  }`}
                  onClick={() => handleMonthChange(month)}
                  disabled={isDisabled}
                >
                  {monthName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === 'years' && (
        <div className={styles.selectionPanel}>
          <div className={styles.yearGrid}>
            {years.map((year) => {
              const isDisabled =
                year < minDate.getFullYear() || year > maxDate.getFullYear();

              return (
                <button
                  key={year}
                  type="button"
                  className={`${styles.optionButton} ${
                    year === currentYear ? styles.selectedOption : ''
                  }`}
                  onClick={() => handleYearChange(year)}
                  disabled={isDisabled}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
