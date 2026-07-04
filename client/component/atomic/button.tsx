'use client';

import styled, { css } from 'styled-components';
import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner data-testid="button-spinner" />}
      {!isLoading && leftIcon && <IconWrapper $position="left">{leftIcon}</IconWrapper>}
      <ContentWrapper $isLoading={isLoading}>{children}</ContentWrapper>
      {!isLoading && rightIcon && <IconWrapper $position="right">{rightIcon}</IconWrapper>}
    </StyledButton>
  );
}

const variantStyles = {
  primary: css`
    background-color: var(--primary);
    color: var(--text-inverse);
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background-color: var(--primary-hover);
    }

    &:active:not(:disabled) {
      background-color: var(--primary-active);
    }
  `,
  secondary: css`
    background-color: var(--surface-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);

    &:hover:not(:disabled) {
      background-color: var(--border);
    }

    &:active:not(:disabled) {
      background-color: var(--border-hover);
    }
  `,
  danger: css`
    background-color: var(--danger);
    color: var(--text-inverse);
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background-color: #b91c1c; /* darker red */
    }

    &:active:not(:disabled) {
      background-color: #991b1b;
    }
  `,
  outline: css`
    background-color: transparent;
    color: var(--primary);
    border: 1px solid var(--primary);

    &:hover:not(:disabled) {
      background-color: var(--primary-soft);
    }

    &:active:not(:disabled) {
      background-color: rgba(37, 99, 235, 0.15);
    }
  `,
  ghost: css`
    background-color: transparent;
    color: var(--text-secondary);
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background-color: var(--surface-secondary);
      color: var(--text-primary);
    }

    &:active:not(:disabled) {
      background-color: var(--border);
    }
  `,
};

const sizeStyles = {
  sm: css`
    min-height: 32px;
    padding: 0 12px;
    font-size: var(--font-xs);
    border-radius: var(--radius-sm);
    gap: var(--space-1);
  `,
  md: css`
    min-height: 40px;
    padding: 0 16px;
    font-size: var(--font-sm);
    border-radius: var(--radius-md);
    gap: var(--space-2);
  `,
  lg: css`
    min-height: 48px;
    padding: 0 24px;
    font-size: var(--font-md);
    border-radius: var(--radius-lg);
    gap: var(--space-3);
  `,
};

const StyledButton = styled.button<{ $variant: ButtonVariant; $size: ButtonSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family);
  font-weight: var(--font-weight-medium);
  width: fit-content;
  
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  position: relative;

  ${({ $variant }) => variantStyles[$variant]}
  ${({ $size }) => sizeStyles[$size]}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ContentWrapper = styled.span<{ $isLoading: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  visibility: ${({ $isLoading }) => ($isLoading ? 'hidden' : 'visible')};
`;

const IconWrapper = styled.span<{ $position: 'left' | 'right' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 1.2em;
    height: 1.2em;
  }
`;

const Spinner = styled.div`
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
