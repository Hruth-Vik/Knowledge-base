import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'quiet' | 'primary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
}

export function Button({
  variant = 'quiet',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[styles.button, styles[variant], className]
        .filter(Boolean)
        .join(' ')}
      type={type}
    />
  );
}
