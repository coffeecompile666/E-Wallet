'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Shield, KeyRound, ArrowRight, CircleCheck, CheckCircle2, Lock } from 'lucide-react';
import AppDialog from '@/component/atomic/dialog';
import Button from '@/component/atomic/button';
import PinInput from '@/component/atomic/pinInput';
import { addAlert } from '@/help/addAlert';
import { createTransactionPin, confirmTransactionPin, verifyOTP } from '@/api/auth';
import { useAppStore } from '@/store/appStore';

interface CreateTxPinModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateTxPinModal({ open, onClose }: CreateTxPinModalProps) {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otpId, setOtpId] = useState<number | null>(null);

  // Form states
  const [otpValue, setOtpValue] = useState('');
  const [pinValue, setPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [error, setError] = useState('');

  // Step 1: Request OTP
  const handleRequestOtp = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await createTransactionPin();
      if (res?.data) {
        setOtpId(res.data);
        setStep(2);
        addAlert(<>Mã OTP đã được gửi đến email của bạn.</>);
      }
    } catch (err: any) {
      setError(err.userMessage || 'Không thể gửi yêu cầu thiết lập PIN. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpValue.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    if (!otpId) {
      setError('Không tìm thấy phiên OTP. Vui lòng bắt đầu lại.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP({
        otp_id: otpId,
        otp: otpValue,
      });
      setStep(3);
      addAlert(<>Xác thực OTP thành công. Vui lòng thiết lập PIN mới.</>);
    } catch (err: any) {
      setError(err.userMessage || 'Xác thực mã OTP thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Enter PIN
  const handleEnterPin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pinValue.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã PIN');
      return;
    }

    setStep(4);
  };

  // Step 4: Confirm PIN & Call API
  const handleConfirmPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (confirmPinValue.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã PIN xác nhận');
      return;
    }

    if (pinValue !== confirmPinValue) {
      setError('Xác nhận mã PIN không trùng khớp');
      return;
    }

    if (!otpId) {
      setError('Không tìm thấy phiên OTP. Vui lòng bắt đầu lại.');
      return;
    }

    setIsLoading(true);
    try {
      await confirmTransactionPin({
        OTP: otpValue,
        OtpID: otpId,
        PIN: pinValue,
      });

      if (user) {
        setUser({ ...user, hasTxPin: true });
      }

      addAlert(<>Tạo mã PIN giao dịch thành công!</>);
      onClose();
    } catch (err: any) {
      setError(err.userMessage || 'Thiết lập mã PIN thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppDialog open={open} onClose={() => {}} title="Thiết lập PIN giao dịch">
      {/* Steps Indicator Progress Bar */}
      <StepsProgressBar>
        <StepDot $active={step >= 1} $completed={step > 1}>1</StepDot>
        <StepLine $active={step > 1} />
        <StepDot $active={step >= 2} $completed={step > 2}>2</StepDot>
        <StepLine $active={step > 2} />
        <StepDot $active={step >= 3} $completed={step > 3}>3</StepDot>
        <StepLine $active={step > 3} />
        <StepDot $active={step >= 4} $completed={step > 4}>4</StepDot>
      </StepsProgressBar>

      {step === 1 && (
        <Content>
          <IconWrapper>
            <Shield size={36} color="var(--primary)" />
          </IconWrapper>
          <h3>Bảo vệ tài khoản của bạn</h3>
          <p>
            Bạn cần thiết lập Mã PIN giao dịch (6 chữ số) để thực hiện các thao tác chuyển tiền hoặc rút tiền. Hệ thống sẽ gửi một mã OTP qua email để bắt đầu.
          </p>
          {error && <ErrorText>{error}</ErrorText>}
          <Footer>
            <Button 
              variant="primary" 
              onClick={handleRequestOtp} 
              isLoading={isLoading}
              rightIcon={<ArrowRight size={16} />}
              style={{ width: '100%' }}
            >
              Gửi mã OTP qua Email
            </Button>
          </Footer>
        </Content>
      )}

      {step === 2 && (
        <Form onSubmit={handleVerifyOtp}>
          <IconWrapper style={{ margin: '0 auto' }}>
            <Lock size={30} color="var(--primary)" />
          </IconWrapper>
          <h4 style={{ textAlign: 'center', margin: 'var(--space-2) 0' }}>Xác thực Email của bạn</h4>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 var(--space-2) 0' }}>
            Nhập mã xác thực OTP gồm 6 chữ số đã được gửi qua email.
          </p>

          <InputSection>
            <PinCenterWrapper>
              <PinInput
                length={6}
                value={otpValue}
                onChange={(val) => setOtpValue(val)}
                mask={false}
              />
            </PinCenterWrapper>
          </InputSection>

          {error && <ErrorText style={{ textAlign: 'center' }}>{error}</ErrorText>}

          <Footer>
            <Button 
              variant="primary" 
              type="submit"
              isLoading={isLoading}
              style={{ width: '100%' }}
            >
              Xác thực OTP
            </Button>
          </Footer>
        </Form>
      )}

      {step === 3 && (
        <Form onSubmit={handleEnterPin}>
          <IconWrapper style={{ margin: '0 auto' }}>
            <KeyRound size={30} color="var(--primary)" />
          </IconWrapper>
          <h4 style={{ textAlign: 'center', margin: 'var(--space-2) 0' }}>Mã PIN giao dịch mới</h4>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 var(--space-2) 0' }}>
            Nhập mã PIN giao dịch gồm 6 chữ số mới của bạn.
          </p>

          <InputSection>
            <PinCenterWrapper>
              <PinInput
                length={6}
                value={pinValue}
                onChange={(val) => setPinValue(val)}
                mask={true}
              />
            </PinCenterWrapper>
          </InputSection>

          {error && <ErrorText style={{ textAlign: 'center' }}>{error}</ErrorText>}

          <Footer>
            <Button 
              variant="primary" 
              type="submit"
              isLoading={isLoading}
              style={{ width: '100%' }}
            >
              Tiếp tục
            </Button>
          </Footer>
        </Form>
      )}

      {step === 4 && (
        <Form onSubmit={handleConfirmPinSubmit}>
          <IconWrapper style={{ margin: '0 auto' }}>
            <CheckCircle2 size={30} color="var(--primary)" />
          </IconWrapper>
          <h4 style={{ textAlign: 'center', margin: 'var(--space-2) 0' }}>Xác nhận mã PIN</h4>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 var(--space-2) 0' }}>
            Nhập lại mã PIN giao dịch mới để xác nhận.
          </p>

          <InputSection>
            <PinCenterWrapper>
              <PinInput
                length={6}
                value={confirmPinValue}
                onChange={(val) => setConfirmPinValue(val)}
                mask={true}
              />
            </PinCenterWrapper>
          </InputSection>

          {error && <ErrorText style={{ textAlign: 'center' }}>{error}</ErrorText>}

          <Footer>
            <Button 
              variant="primary" 
              type="submit"
              isLoading={isLoading}
              style={{ width: '100%' }}
            >
              Hoàn tất thiết lập
            </Button>
          </Footer>
        </Form>
      )}
    </AppDialog>
  );
}

// Styled Components
const StepsProgressBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
  padding: 0 var(--space-4);
`;

const StepDot = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${({ $completed, $active }) => 
    $completed ? 'var(--success)' : $active ? 'var(--primary)' : 'var(--border)'};
  color: ${({ $active }) => ($active ? 'white' : 'var(--text-muted)')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xs);
  font-weight: var(--font-weight-bold);
  transition: all var(--transition-normal);
`;

const StepLine = styled.div<{ $active: boolean }>`
  flex-grow: 1;
  height: 2px;
  background-color: ${({ $active }) => ($active ? 'var(--primary)' : 'var(--border)')};
  margin: 0 var(--space-2);
  transition: all var(--transition-normal);
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-2) 0;

  h3 {
    margin: var(--space-3) 0 var(--space-2) 0;
    color: var(--text-primary);
  }

  p {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0 0 var(--space-4) 0;
  }
`;

const IconWrapper = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-2) 0;
`;

const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const PinCenterWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const ErrorText = styled.div`
  color: var(--danger);
  font-size: var(--font-xs);
  margin-top: var(--space-1);
`;

const Footer = styled.div`
  display: flex;
  width: 100%;
  margin-top: var(--space-2);
`;

const AlertContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;
