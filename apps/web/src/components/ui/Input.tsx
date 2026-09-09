'use client';

import type { InputHTMLAttributes } from 'react';

import styles from './gloablUiCss/Input.module.css';

export default function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const inputClassName = `${styles.input} ${className ?? ''}`.trim();

  return <input {...props} className={inputClassName} />;
}
