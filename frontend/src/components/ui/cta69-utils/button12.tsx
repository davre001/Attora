import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import './cta69-utils.css';

export interface Button12Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function Button12({
  label,
  asChild,
  children,
  className,
  ...props
}: Button12Props) {
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    const href = child.props.href || child.props.to || '#';
    const isExternal = typeof href === 'string' && /^https?:\/\//.test(href);

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('cta69-button', child.props.className, className)}
        >
          <span className="cta69-button-label">{label || child.props.children}</span>
          <span className="cta69-button-arrow" aria-hidden="true">→</span>
        </a>
      );
    }

    return (
      <Link
        to={href}
        className={cn('cta69-button', child.props.className, className)}
      >
        <span className="cta69-button-label">{label || child.props.children}</span>
        <span className="cta69-button-arrow" aria-hidden="true">→</span>
      </Link>
    );
  }

  return (
    <button className={cn('cta69-button', className)} {...props}>
      <span className="cta69-button-label">{label || children}</span>
      <span className="cta69-button-arrow" aria-hidden="true">→</span>
    </button>
  );
}

export default Button12;
