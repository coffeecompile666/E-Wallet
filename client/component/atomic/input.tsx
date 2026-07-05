'use client';

import styled, { css } from 'styled-components';
import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, disabled, id, ...props }, ref) => {
    return (
      <InputWrapper>
        {label && <Label htmlFor={id}>{label}</Label>}
        <InputContainer $hasError={!!error} $disabled={disabled}>
          {leftIcon && <IconWrapper $position="left">{leftIcon}</IconWrapper>}
          <StyledInput
            ref={ref}
            id={id}
            disabled={disabled}
            $hasLeftIcon={!!leftIcon}
            $hasRightIcon={!!rightIcon}
            {...props}
          />
          {rightIcon && <IconWrapper $position="right">{rightIcon}</IconWrapper>}
        </InputContainer>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </InputWrapper>
    );
  }
);

Input.displayName = 'Input';

export default Input;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
`;

const Label = styled.label`
  font-size: var(--font-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  user-select: none;
`;

const InputContainer = styled.div<{ $hasError: boolean; $disabled?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  background-color: var(--surface);
  border: 1px solid ${({ $hasError }) => ($hasError ? 'var(--danger)' : 'var(--border)')};
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);

  &:focus-within {
    border-color: ${({ $hasError }) => ($hasError ? 'var(--danger)' : 'var(--primary)')};
    box-shadow: 0 0 0 2px ${({ $hasError }) => ($hasError ? 'var(--danger-soft)' : 'var(--primary-soft)')};
  }

  ${({ $disabled }) =>
    $disabled &&
    css`
      background-color: var(--surface-secondary);
      border-color: var(--border);
      cursor: not-allowed;
      opacity: 0.7;
    `}
`;

const StyledInput = styled.input<{ $hasLeftIcon: boolean; $hasRightIcon: boolean }>`
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  padding-left: ${({ $hasLeftIcon }) => ($hasLeftIcon ? '38px' : '12px')};
  padding-right: ${({ $hasRightIcon }) => ($hasRightIcon ? '38px' : '12px')};
  background-color: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: var(--font-sm);
  outline: none;

  &::placeholder {
    color: var(--text-muted);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const IconWrapper = styled.div<{ $position: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  pointer-events: none;
  
  ${({ $position }) =>
    $position === 'left'
      ? css`
          left: 12px;
        `
      : css`
          right: 12px;
          pointer-events: auto; /* clickable if it contains a button for password toggling */
        `}

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ErrorMessage = styled.span`
  font-size: var(--font-xs);
  color: var(--danger);
  font-weight: var(--font-weight-medium);
  margin-top: 2px;
`;
