'use client';

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import styled from 'styled-components';
import { ReactNode } from 'react';

type AppDialogProps = {
  children: ReactNode;
  onClose(): void;
  open: boolean;
  title?: string;
};

export default function AppDialog({
  open,
  title,
  children,
  onClose,
}: AppDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <Backdrop />

      <Container>
        <Panel>
          {title && <DialogTitle>{title}</DialogTitle>}
          {children}
        </Panel>
      </Container>
    </Dialog>
  );
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
`;

const Container = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 16px;
`;

const Panel = styled(DialogPanel)`
  width: 100%;
  max-width: 500px;

  background: white;
  border-radius: 12px;

  padding: 24px;

  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
`;
