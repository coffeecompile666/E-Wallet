'use client';

import styled, { css } from 'styled-components';
import { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export default function Badge({ variant = 'info', children, ...props }: BadgeProps) {
  return (
    <StyledBadge $variant={variant} {...props}>
      {children}
    </StyledBadge>
  );
}

const variantStyles = {
  success: css`
    background-color: var(--success-soft);
    color: var(--success);
  `,
  warning: css`
    background-color: var(--warning-soft);
    color: var(--warning);
  `,
  danger: css`
    background-color: var(--danger-soft);
    color: var(--danger);
  `,
  info: css`
    background-color: var(--primary-soft);
    color: var(--primary);
  `,
};

const StyledBadge = styled.span<{ $variant: BadgeVariant }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  padding: 4px 10px;
  border-radius: 9999px; /* Pill shape */
  
  font-family: var(--font-family);
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: capitalize;
  line-height: 1;
  width: fit-content;
  white-space: nowrap;

  ${({ $variant }) => variantStyles[$variant]}
`;
