'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Shield } from 'lucide-react';
import Button from '@/component/atomic/button';
import PinInput from '@/component/atomic/pinInput';
import { useAppStore } from '@/store/appStore';

interface PinVerifyModalProps {
  amount: number;
  receiver: string;
  message: string;
  onVerifySuccess: () => void;
}

export default function PinVerifyModal({ amount, receiver, message, onVerifySuccess }: PinVerifyModalProps) {
  const setAppDialog = useAppStore((state) => state.setAppDialog);
  const [pinValue, setPinValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' đ';
  };

  const handleVerify = () => {
    if (pinValue.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã PIN');
      return;
    }
    
    setIsLoading(true);
    setError('');

    // Simulate PIN check (to be replaced with actual check later)
    setTimeout(() => {
      setIsLoading(false);
      onVerifySuccess();
    }, 1500);
  };

  return (
    <div>
      <VerifyHeader>
        <Shield size={32} color="var(--primary)" />
        <h3>Xác thực giao dịch</h3>
        <p>Bạn đang thực hiện chuyển tiền bảo mật</p>
      </VerifyHeader>

      <TxSummary>
        <SummaryItem>
          <span>Người nhận:</span>
          <strong>{receiver}</strong>
        </SummaryItem>
        <SummaryItem>
          <span>Số tiền chuyển:</span>
          <AmountHighlight>{formatVND(amount)}</AmountHighlight>
        </SummaryItem>
        <SummaryItem>
          <span>Lời nhắn:</span>
          <span>{message}</span>
        </SummaryItem>
      </TxSummary>

      <PinForm>
        <label>Nhập mã PIN giao dịch để xác nhận</label>
        <PinWrapper>
          <PinInput
            length={6}
            value={pinValue}
            onChange={(val) => setPinValue(val)}
            mask={true}
          />
        </PinWrapper>
        {error && <PinError>{error}</PinError>}
      </PinForm>

      <VerifyFooter>
        <Button variant="ghost" onClick={() => setAppDialog(undefined)} disabled={isLoading}>
          Hủy giao dịch
        </Button>
        <Button variant="primary" onClick={handleVerify} isLoading={isLoading}>
          Xác nhận chuyển
        </Button>
      </VerifyFooter>
    </div>
  );
}

// Styled Components
const VerifyHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: var(--space-4);

  h3 {
    margin: var(--space-2) 0 0 0;
    color: var(--text-primary);
  }

  p {
    margin: 4px 0 0 0;
    font-size: var(--font-xs);
    color: var(--text-secondary);
  }
`;

const TxSummary = styled.div`
  background-color: var(--surface-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: var(--font-sm);
  color: var(--text-secondary);

  strong {
    color: var(--text-primary);
  }
`;

const AmountHighlight = styled.strong`
  color: var(--primary) !important;
  font-size: var(--font-md);
`;

const PinForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-5);

  label {
    font-size: var(--font-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    text-align: center;
  }
`;

const PinWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const PinError = styled.span`
  font-size: var(--font-xs);
  color: var(--danger);
  text-align: center;
  margin-top: 4px;
`;

const VerifyFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
`;
