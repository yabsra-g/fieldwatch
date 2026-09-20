import React from 'react';
import { TERipple } from 'tw-elements-react';

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ripple tint: use "light" on dark buttons and "dark" on light ones. */
  rippleColor?: 'light' | 'dark' | 'primary' | 'success' | 'danger';
  /** Corner radius class for the wrapper so the ripple is clipped to the button shape. */
  rounded?: string;
  wrapperClassName?: string;
}

/**
 * Tailwind Elements ripple wrapped around a button, plus a subtle press-down
 * scale, so clicks give the material-style feedback used by most modern systems.
 */
export const RippleButton: React.FC<RippleButtonProps> = ({
  rippleColor = 'light',
  rounded = 'rounded-md',
  wrapperClassName = '',
  className = '',
  children,
  ...props
}) => (
  <TERipple
    rippleColor={rippleColor}
    className={`inline-block ${rounded} ${wrapperClassName}`}
  >
    <button
      className={`${rounded} transition-transform duration-150 ease-out active:scale-[0.96] motion-reduce:transform-none cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  </TERipple>
);
