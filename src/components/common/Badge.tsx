import React from 'react';
import { FirewallDecision } from '../../types';

interface BadgeProps {
  decision: FirewallDecision;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const DecisionBadge: React.FC<BadgeProps> = ({ decision, size = 'md', showIcon = true }) => {
  const config = {
    ALLOW: {
      text: 'ALLOWED',
      className: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
      indicator: 'bg-emerald-500',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )
    },
    APPROVAL_REQUIRED: {
      text: 'APPROVAL REQUIRED',
      className: 'bg-amber-950/60 text-amber-300 border-amber-700/50',
      indicator: 'bg-amber-500',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
    },
    BLOCK: {
      text: 'BLOCKED',
      className: 'bg-rose-950/60 text-rose-300 border-rose-700/50',
      indicator: 'bg-rose-500',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )
    },
    ALERT: {
      text: 'SECURITY ALERT',
      className: 'bg-purple-950/60 text-purple-300 border-purple-700/50',
      indicator: 'bg-purple-500',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    }
  }[decision] || {
    text: decision,
    className: 'bg-slate-800 text-slate-300 border-slate-700',
    indicator: 'bg-slate-400',
    icon: null
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-mono tracking-tight',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-mono tracking-wider font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-mono tracking-wider font-bold'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border shadow-sm select-none ${config.className} ${sizeClasses}`}
    >
      {showIcon && config.icon}
      <span>{config.text}</span>
    </span>
  );
};
