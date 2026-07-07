'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { CreditCard, Link2, ShieldAlert, ArrowLeft } from 'lucide-react';
import AppDialog from '@/component/atomic/dialog';
import Button from '@/component/atomic/button';
import Input from '@/component/atomic/input';
import PinInput from '@/component/atomic/pinInput';
import { addAlert } from '@/help/addAlert';
import { LinkedBankAccount, SupportedBanks } from '@/api/types';
import { withdraw, getTransferByID, getWalletMe } from '@/api/wallet';
import { useAppStore } from '@/store/appStore';

const SUPPORTED_BANKS = [
  { code: 'VCB' as SupportedBanks, name: 'Vietcombank', icon: 'https://dummyimage.com/64x64/16a34a/ffffff&text=VCB' },
  { code: 'TCB' as SupportedBanks, name: 'Techcombank', icon: 'https://dummyimage.com/64x64/dc2626/ffffff&text=TCB' },
  { code: 'BIDV' as SupportedBanks, name: 'BIDV', icon: 'https://dummyimage.com/64x64/1d4ed8/ffffff&text=BIDV' },
  { code: 'ACB' as SupportedBanks, name: 'ACB', icon: 'https://dummyimage.com/64x64/2563eb/ffffff&text=ACB' },
  { code: 'MB' as SupportedBanks, name: 'MB Bank', icon: 'https://dummyimage.com/64x64/15803d/ffffff&text=MB' },
  { code: 'TPB' as SupportedBanks, name: 'TPBank', icon: 'https://dummyimage.com/64x64/7c3aed/ffffff&text=TPB' },
  { code: 'VPB' as SupportedBanks, name: 'VPBank', icon: 'https://dummyimage.com/64x64/166534/ffffff&text=VPB' },
  { code: 'SCB' as SupportedBanks, name: 'SCB', icon: 'https://dummyimage.com/64x64/0f766e/ffffff&text=SCB' },
] as const;

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  bankAccounts: LinkedBankAccount[];
  onSuccess: () => void;
  onOpenLinkBank: () => void;
}

export default function WithdrawModal({ open, onClose, bankAccounts, onSuccess, onOpenLinkBank }: WithdrawModalProps) {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  const [modalStep, setModalStep] = useState<'form' | 'pin' | 'polling'>('form');
  const [withdrawAmount, setWithdrawAmount] = useState('500000');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | undefined>(undefined);
  const [txPin, setTxPin] = useState('');
  const [pollingTransferId, setPollingTransferId] = useState<number | null>(null);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset modal step and inputs when dialog opens
  useEffect(() => {
    if (open) {
      setModalStep('form');
      setTxPin('');
      setError('');
    }
  }, [open]);

  // Auto select first bank account on load
  useEffect(() => {
    if (bankAccounts.length > 0) {
      const firstAccId = bankAccounts[0].id || (bankAccounts[0] as any).ID;
      setSelectedBankAccountId(firstAccId);
    }
  }, [bankAccounts]);

  // Polling transfer status effect
  useEffect(() => {
    if (!pollingTransferId) return;

    let timer: any;
    const checkStatus = async () => {
      try {
        const res = await getTransferByID(pollingTransferId);
        const status = res.data.Status;

        if (status === 'COMPLETED' || status === 'FAILED') {
          setPollingTransferId(null);
          setModalStep('form');

          if (status === 'COMPLETED') {
            addAlert(<>Rút tiền thành công!</>);
            if (user) {
              const walletRes = await getWalletMe();
              setUser({ ...user, balance: walletRes.data.Balance - walletRes.data.LockedAmount });
            }
            onSuccess();
          } else {
            addAlert(<>Rút tiền thất bại từ phía ngân hàng.</>);
          }
          onClose();
        }
      } catch (err) {
        console.error('Error polling transfer status:', err);
      }
    };

    timer = setInterval(checkStatus, 2000);

    return () => {
      clearInterval(timer);
    };
  }, [pollingTransferId, user, setUser, onSuccess, onClose]);

  const handleFormSubmit = () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      addAlert(<>Số tiền rút không hợp lệ</>);
      return;
    }

    if (!user) {
      addAlert(<>Vui lòng đăng nhập</>);
      return;
    }

    if (amt > user.balance) {
      addAlert(<>Số tiền rút vượt quá số dư ví khả dụng</>);
      return;
    }

    if (!selectedBankAccountId) {
      addAlert(<>Vui lòng liên kết và chọn tài khoản ngân hàng để rút tiền</>);
      return;
    }

    setModalStep('pin');
    setTxPin('');
    setError('');
  };

  const handleWithdrawExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (txPin.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã PIN giao dịch');
      return;
    }

    const amt = parseFloat(withdrawAmount);
    const walletId = user?.walletId || (user as any)?.WalletID || (user as any)?.wallet_id;
    if (!walletId) {
      addAlert(<>Không tìm thấy thông tin ví người dùng</>);
      return;
    }

    setIsWithdrawLoading(true);
    try {
      const res = await withdraw({
        wallet_id: walletId,
        amount: amt,
        bank_account_id: selectedBankAccountId!,
        tx_pin: txPin,
      });

      if (res?.data) {
        setPollingTransferId(res.data);
        setModalStep('polling');
        addAlert(<>Yêu cầu rút tiền đã được gửi tới ngân hàng. Vui lòng đợi...</>);
      }
    } catch (err: any) {
      if (err.code === 1047) {
        if (user) setUser({ ...user, hasTxPin: false });
        addAlert(<>Tài khoản chưa thiết lập mã PIN giao dịch. Đang chuyển sang màn hình thiết lập...</>);
        onClose();
      } else {
        setError(err.userMessage || 'Rút tiền thất bại. Vui lòng kiểm tra lại mã PIN.');
      }
    } finally {
      setIsWithdrawLoading(false);
    }
  };

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <AppDialog open={open} onClose={() => modalStep !== 'polling' && onClose()} title="Rút tiền về ngân hàng">
      {modalStep === 'polling' && (
        <VerifyingState>
          <VerifyingIconWrapper>
            <CreditCard size={28} />
          </VerifyingIconWrapper>
          <h4>Đang xử lý rút tiền</h4>
          <p>Ngân hàng đang xử lý giao dịch rút tiền của bạn. Vui lòng không đóng cửa sổ này...</p>
        </VerifyingState>
      )}

      {modalStep === 'pin' && (
        <Form onSubmit={handleWithdrawExecute}>
          <BackButton type="button" onClick={() => setModalStep('form')}>
            <ArrowLeft size={16} /> Quay lại
          </BackButton>
          
          <IconWrapper>
            <ShieldAlert size={30} color="var(--primary)" />
          </IconWrapper>
          <h4 style={{ textAlign: 'center', margin: 'var(--space-2) 0' }}>Nhập PIN giao dịch</h4>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 var(--space-2) 0' }}>
            Vui lòng nhập mã PIN giao dịch 6 chữ số để xác thực rút {formatVND(parseFloat(withdrawAmount))}.
          </p>

          <PinCenterWrapper>
            <PinInput
              length={6}
              value={txPin}
              onChange={(val) => setTxPin(val)}
              mask={true}
            />
          </PinCenterWrapper>

          {error && <ErrorText>{error}</ErrorText>}

          <Footer>
            <Button variant="ghost" type="button" onClick={onClose} disabled={isWithdrawLoading}>Hủy bỏ</Button>
            <Button variant="primary" type="submit" isLoading={isWithdrawLoading}>Xác nhận</Button>
          </Footer>
        </Form>
      )}

      {modalStep === 'form' && (
        bankAccounts.length === 0 ? (
          <EmptyBankAccounts>
            <Link2 size={32} />
            <p>Bạn cần liên kết tài khoản ngân hàng trước khi rút tiền.</p>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={onOpenLinkBank}
            >
              Liên kết ngân hàng ngay
            </Button>
          </EmptyBankAccounts>
        ) : (
          <WithdrawContent>
            <SelectLabel>Chọn tài khoản ngân hàng nhận</SelectLabel>
            <select 
              value={selectedBankAccountId || ''} 
              onChange={(e) => setSelectedBankAccountId(Number(e.target.value))}
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-sm)',
                width: '100%',
                marginBottom: 'var(--space-2)'
              }}
            >
              {bankAccounts.map((acc) => {
                const accId = acc.id || (acc as any).ID;
                const bankInfo = SUPPORTED_BANKS.find(b => b.code === acc.Bank);
                return (
                  <option key={accId} value={accId}>
                    {bankInfo?.name || acc.Bank} - {acc.Number}
                  </option>
                );
              })}
            </select>

            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 'var(--space-2) 0' }}>
              Chọn số tiền rút
            </p>
            <WithdrawOptions>
              {['100000', '200000', '500000', '1000000', '2000000', '5000000'].map((val) => (
                <OptionButton 
                  key={val} 
                  $selected={withdrawAmount === val}
                  onClick={() => setWithdrawAmount(val)}
                  type="button"
                >
                  {formatVND(parseFloat(val))}
                </OptionButton>
              ))}
            </WithdrawOptions>

            <Input
              id="custom-withdraw-amount"
              type="number"
              label="Hoặc nhập số tiền khác"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />

            <WithdrawFooter>
              <Button variant="ghost" onClick={onClose}>Hủy bỏ</Button>
              <Button variant="primary" onClick={handleFormSubmit}>Tiếp tục</Button>
            </WithdrawFooter>
          </WithdrawContent>
        )
      )}
    </AppDialog>
  );
}

// Styled Components
const EmptyBankAccounts = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  text-align: center;
  color: var(--text-muted);
  gap: var(--space-2);

  p {
    margin: 0;
    font-size: var(--font-sm);
  }
`;

const SelectLabel = styled.label`
  font-size: var(--font-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: 2px;
  display: block;
`;

const WithdrawContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const WithdrawOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-2);
`;

const OptionButton = styled.button<{ $selected: boolean }>`
  padding: 10px;
  font-size: var(--font-xs);
  font-family: var(--font-family);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  border: 1px solid ${({ $selected }) => ($selected ? 'var(--primary)' : 'var(--border)')};
  background-color: ${({ $selected }) => ($selected ? 'var(--primary-soft)' : 'var(--surface)')};
  color: ${({ $selected }) => ($selected ? 'var(--primary)' : 'var(--text-primary)')};
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--primary);
  }
`;

const WithdrawFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: var(--font-xs);
  cursor: pointer;
  align-self: flex-start;
  padding: 0;
  
  &:hover {
    color: var(--primary);
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
  margin: 0 auto;
`;

const PinCenterWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const ErrorText = styled.div`
  color: var(--danger);
  font-size: var(--font-xs);
  text-align: center;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-2);
`;

const VerifyingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-6) 0;

  h4 {
    margin: var(--space-3) 0 var(--space-1) 0;
    color: var(--text-primary);
  }

  p {
    margin: 0;
    font-size: var(--font-xs);
    color: var(--text-secondary);
    max-width: 250px;
  }
`;

const VerifyingIconWrapper = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--primary-soft);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
    }
  }
`;
