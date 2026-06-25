'use client';

import { useAppStore } from '@/store/appStore';
import styled from 'styled-components';
import { CircleCheck } from 'lucide-react';

export default function NotificationDisplayer() {
  const appDialog = useAppStore((state) => state.appDialog);
  const alerts = useAppStore((state) => state.alerts);
  const setAlerts = useAppStore((state) => state.setAlerts);

  const removeAlertByIndex = (index: number) => {
    setAlerts(alerts?.filter((_, i) => i != index) || []);
  };

  return (
    <div>
      {appDialog}
      <AlertContainer>
        {alerts?.map((alert, i) => (
          <AlertElement key={i} onClick={() => removeAlertByIndex(i)}>
            <CircleCheck />
            {alert}
          </AlertElement>
        ))}
      </AlertContainer>
    </div>
  );
}

const AlertContainer = styled.div`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;

  display: flex;
  flex-direction: column;
  gap: 12px;

  pointer-events: none;
`;

const AlertElement = styled.div`
  min-width: 100px;
  max-width: 400px;
  width: fit-content;

  padding: 12px 16px;
  margin-left: auto;

  border-radius: 8px;
  background: #ffffff;
  color: #171717;

  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);

  pointer-events: auto;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  * {
    flex-shrink: 0;
  }
`;
