'use client';

import styled, { css } from 'styled-components';
import { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'default' | 'clickable' | 'bordered';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: CardVariant;
  padding?: string;
  title?: ReactNode;
  extra?: ReactNode;
  footer?: ReactNode;
}

export default function Card({
  children,
  variant = 'default',
  padding,
  title,
  extra,
  footer,
  ...props
}: CardProps) {
  return (
    <StyledCard $variant={variant} {...props}>
      {(title || extra) && (
        <CardHeader>
          {title && typeof title === 'string' ? <CardTitle>{title}</CardTitle> : title}
          {extra && <CardExtra>{extra}</CardExtra>}
        </CardHeader>
      )}
      <CardBody $padding={padding}>{children}</CardBody>
      {footer && <CardFooter>{footer}</CardFooter>}
    </StyledCard>
  );
}

const variantStyles = {
  default: css`
    background-color: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
  `,
  clickable: css`
    background-color: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    user-select: none;

    &:hover {
      border-color: var(--border-hover);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  `,
  bordered: css`
    background-color: transparent;
    border: 1.5px dashed var(--border);
  `,
};

const StyledCard = styled.div<{ $variant: CardVariant }>`
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all var(--transition-normal);
  width: 100%;

  ${({ $variant }) => variantStyles[$variant]}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border);
  min-height: 56px;
  background-color: transparent;
`;

const CardTitle = styled.h3`
  font-size: var(--font-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
`;

const CardExtra = styled.div`
  font-size: var(--font-xs);
  color: var(--primary);
  display: flex;
  align-items: center;
`;

const CardBody = styled.div<{ $padding?: string }>`
  padding: ${({ $padding }) => $padding || 'var(--space-5)'};
  flex-grow: 1;
`;

const CardFooter = styled.div`
  padding: var(--space-3) var(--space-5);
  background-color: var(--surface-secondary);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: var(--font-xs);
  color: var(--text-secondary);
`;
