'use client';

import styled from 'styled-components';
import { useRef, ClipboardEvent, KeyboardEvent, ChangeEvent, useEffect } from 'react';

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  mask?: boolean;
}

export default function PinInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  mask = true,
}: PinInputProps) {
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Split value into array, pad with empty strings up to length
  const values = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focusInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!val) return;

    // Only allow digits
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal) {
      e.target.value = '';
      return;
    }

    const nextValues = [...values];
    // Take only the last character if multiple are entered somehow
    nextValues[index] = cleanVal.slice(-1);
    const newValueString = nextValues.join('');
    onChange(newValueString);

    // Auto-focus next input if not at the end
    if (index < length - 1 && cleanVal) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const nextValues = [...values];
      
      if (nextValues[index] !== '') {
        // If current box is not empty, clear it
        nextValues[index] = '';
        onChange(nextValues.join(''));
      } else if (index > 0) {
        // If current box is empty, go to previous and clear it
        nextValues[index - 1] = '';
        onChange(nextValues.join(''));
        focusInput(index - 1);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1);
      e.preventDefault();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData('text');
    const cleanDigits = pastedData.replace(/\D/g, '').slice(0, length);
    
    if (cleanDigits) {
      onChange(cleanDigits);
      // Focus the last filled box, or the last box if all are filled
      const nextFocusIndex = Math.min(cleanDigits.length, length - 1);
      focusInput(nextFocusIndex);
    }
  };

  return (
    <PinInputContainer>
      {Array(length)
        .fill(null)
        .map((_, index) => (
          <PinBox
            key={index}
            ref={(el) => {
              if (el) {
                inputRefs.current[index] = el;
              }
            }}
            type={mask ? 'password' : 'text'}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={values[index]}
            disabled={disabled}
            onChange={(e) => handleInputChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            $hasValue={!!values[index]}
          />
        ))}
    </PinInputContainer>
  );
}

const PinInputContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  width: 100%;
`;

const PinBox = styled.input<{ $hasValue: boolean }>`
  width: 48px;
  height: 56px;
  text-align: center;
  font-family: var(--font-family);
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  background-color: var(--surface);
  border: 2px solid ${({ $hasValue }) => ($hasValue ? 'var(--primary)' : 'var(--border)')};
  border-radius: var(--radius-md);
  outline: none;
  transition: all var(--transition-fast);

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-soft);
    transform: scale(1.05);
  }

  &:disabled {
    background-color: var(--surface-secondary);
    border-color: var(--border);
    color: var(--text-disabled);
    cursor: not-allowed;
  }
`;
