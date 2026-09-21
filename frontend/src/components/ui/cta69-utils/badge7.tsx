import React from 'react';
import { cn } from '../../../lib/utils';
import './cta69-utils.css';

export interface Badge7Props {
  label: string;
  className?: string;
}

export function Badge7({ label, className }: Badge7Props) {
  return (
    <div className={cn('cta69-badge', className)}>
      <span className="cta69-badge-dot" aria-hidden="true" />
      <span className="cta69-badge-text">{label}</span>
    </div>
  );
}

export default Badge7;
