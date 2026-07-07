'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Search, User, ArrowRight, ShieldAlert, ArrowLeft, CircleCheck, Wallet, FileText, Landmark, CreditCard } from 'lucide-react';
import AppDialog from '@/component/atomic/dialog';
import Button from '@/component/atomic/button';
import Input from '@/component/atomic/input';
import PinInput from '@/component/atomic/pinInput';
import { addAlert } from '@/help/addAlert';
import { User as ApiUser, SupportedBanks } from '@/api/types';
import { searchUsers } from '@/api/auth';
import { transferToUser, transferOut, getWalletMe, getTransferByID } from '@/api/wallet';
import { useAppStore } from '@/store/appStore';

const SUPPORTED_BANKS = [
  { code: 'VCB' as SupportedBanks, name: 'Vietcombank' },
  { code: 'TCB' as SupportedBanks, name: 'Techcombank' },
  { code: 'BIDV' as SupportedBanks, name: 'BIDV' },
  { code: 'ACB' as SupportedBanks, name: 'ACB' },
  { code: 'MB' as SupportedBanks, name: 'MB Bank' },
  { code: 'TPB' as SupportedBanks, name: 'TPBank' },
  { code: 'VPB' as SupportedBanks, name: 'VPBank' },
  { code: 'SCB' as SupportedBanks, name: 'SCB' },
] as const;

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferModal({ open, onClose, onSuccess }: TransferModalProps) {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  // Transfer Mode: 'internal' (within Tingting) or 'external' (to other bank)
  const [mode, setMode] = useState<'select' | 'internal' | 'external'>('select');
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 3 PIN
  const [txPin, setTxPin] = useState('');

  // Mode: INTERNAL state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<ApiUser | null>(null);
  const [internalAmount, setInternalAmount] = useState('');
  const [internalNote, setInternalNote] = useState('Chuyển tiền ví Tingting');

  // Mode: EXTERNAL state
  const [selectedBank, setSelectedBank] = useState<SupportedBanks>('VCB');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [externalAmount, setExternalAmount] = useState('');
  const [externalNote, setExternalNote] = useState('Chuyển khoản liên ngân hàng');
  const [pollingTransferId, setPollingTransferId] = useState<number | null>(null);

  // Reset states when opening modal
  useEffect(() => {
    if (open) {
      setMode('select');
      setStep(1);
      setTxPin('');
      setError('');
      
      // Internal
      setSearchQuery('');
      setSearchResults([]);
      setSelectedRecipient(null);
      setInternalAmount('');
      setInternalNote('Chuyển tiền ví Tingting');

      // External
      setSelectedBank('VCB');
      setAccountNumber('');
      setAccountName('');
      setExternalAmount('');
      setExternalNote('Chuyển khoản liên ngân hàng');
      setPollingTransferId(null);
    }
  }, [open]);

  // Polling transfer status effect (only for external transfer)
  useEffect(() => {
    if (!pollingTransferId) return;

    let timer: any;
    const checkStatus = async () => {
      try {
        const res = await getTransferByID(pollingTransferId);
        const status = res.data.Status;

        if (status === 'COMPLETED' || status === 'FAILED') {
          setPollingTransferId(null);
          
          if (status === 'COMPLETED') {
            addAlert(<>Chuyển khoản ngân hàng thành công {formatVND(parseFloat(externalAmount))}!</>);
            if (user) {
              const walletRes = await getWalletMe();
              setUser({ ...user, balance: walletRes.data.Balance - walletRes.data.LockedAmount });
            }
            onSuccess();
          } else {
            addAlert(<>Chuyển khoản ngoài hệ thống thất bại từ phía ngân hàng.</>);
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
  }, [pollingTransferId, user, setUser, onSuccess, onClose, externalAmount]);

  // Handle Internal User Search
  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await searchUsers(val);
      const filtered = (res.users || []).filter(
        (u) => (u.id || (u as any).ID) !== user?.id
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const selectRecipient = (recipient: ApiUser) => {
    setSelectedRecipient(recipient);
    setStep(2);
    setError('');
  };

  // Step 2 submissions
  const handleInternalDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(internalAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Số tiền chuyển không hợp lệ');
      return;
    }

    if (!user) return;
    if (amt > user.balance) {
      setError('Số tiền chuyển vượt quá số dư khả dụng');
      return;
    }

    setStep(3);
  };

  const handleExternalDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accountNumber) {
      setError('Vui lòng nhập số tài khoản nhận');
      return;
    }
    if (!accountName) {
      setError('Vui lòng nhập tên tài khoản nhận');
      return;
    }

    const amt = parseFloat(externalAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Số tiền chuyển không hợp lệ');
      return;
    }

    if (!user) return;
    if (amt > user.balance) {
      setError('Số tiền chuyển vượt quá số dư khả dụng');
      return;
    }

    setStep(2);
  };

  // Submit PIN for Internal
  const handleInternalPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (txPin.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã PIN giao dịch');
      return;
    }

    const amt = parseFloat(internalAmount);
    const walletId = user?.walletId || (user as any)?.WalletID || (user as any)?.wallet_id;
    if (!walletId) {
      addAlert(<>Không tìm thấy thông tin ví người dùng</>);
      return;
    }

    const recipientId = selectedRecipient?.id || (selectedRecipient as any)?.ID;
    if (!recipientId) {
      addAlert(<>Không tìm thấy thông tin người nhận</>);
      return;
    }

    setIsLoading(true);
    try {
      await transferToUser({
        wallet_id: walletId,
        receiver_id: recipientId,
        amount: amt,
        note: internalNote,
        tx_pin: txPin,
      });

      addAlert(<>Chuyển tiền thành công {formatVND(amt)}!</>);

      try {
        const walletRes = await getWalletMe();
        if (user) {
          setUser({ ...user, balance: walletRes.data.Balance - walletRes.data.LockedAmount });
        }
      } catch (balanceErr) {
        console.error('Failed to reload balance after transfer:', balanceErr);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.code === 1047) {
        if (user) setUser({ ...user, hasTxPin: false });
        addAlert(<>Tài khoản chưa thiết lập mã PIN giao dịch. Đang chuyển sang màn hình thiết lập...</>);
        onClose();
      } else {
        setError(err.userMessage || 'Chuyển tiền thất bại. Vui lòng kiểm tra lại mã PIN.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Submit PIN for External
  const handleExternalPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (txPin.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã PIN giao dịch');
      return;
    }

    const amt = parseFloat(externalAmount);
    const walletId = user?.walletId || (user as any)?.WalletID || (user as any)?.wallet_id;
    if (!walletId) {
      addAlert(<>Không tìm thấy thông tin ví người dùng</>);
      return;
    }

    setIsLoading(true);
    try {
      const res = await transferOut({
        wallet_id: walletId,
        amount: amt,
        bank: selectedBank,
        number: accountNumber,
        name: accountName,
        note: externalNote,
        tx_pin: txPin,
      });

      if (res?.data) {
        setPollingTransferId(res.data);
        setStep(3); // Go to polling step
        addAlert(<>Đang liên hệ cổng thanh toán ngân hàng. Vui lòng đợi...</>);
      }
    } catch (err: any) {
      if (err.code === 1047) {
        if (user) setUser({ ...user, hasTxPin: false });
        addAlert(<>Tài khoản chưa thiết lập mã PIN giao dịch. Đang chuyển sang màn hình thiết lập...</>);
        onClose();
      } else {
        setError(err.userMessage || 'Chuyển khoản thất bại. Vui lòng kiểm tra lại mã PIN.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <AppDialog 
      open={open} 
      onClose={() => !isLoading && pollingTransferId === null && onClose()} 
      title={
        mode === 'select' 
          ? 'Chuyển tiền' 
          : mode === 'internal' 
          ? 'Chuyển tiền ví Tingting' 
          : 'Chuyển khoản ngân hàng'
      }
    >
      {/* 1. SELECT MODE */}
      {mode === 'select' && (
        <SelectionGrid>
          <SelectionCard onClick={() => { setMode('internal'); setStep(1); }}>
            <IconBox $bg="var(--primary-soft)" $color="var(--primary)">
              <User size={24} />
            </IconBox>
            <h3>Chuyển ví Tingting</h3>
            <p>Chuyển tiền nội bộ, miễn phí giao dịch và nhận tiền tức thì</p>
          </SelectionCard>

          <SelectionCard onClick={() => { setMode('external'); setStep(1); }}>
            <IconBox $bg="var(--warning-soft)" $color="var(--warning)">
              <Landmark size={24} />
            </IconBox>
            <h3>Chuyển ngoài hệ thống</h3>
            <p>Chuyển khoản tới hơn 40 ngân hàng đối tác liên thông</p>
          </SelectionCard>
        </SelectionGrid>
      )}

      {/* 2. MODE: INTERNAL (WIRED STEP WIZARD) */}
      {mode === 'internal' && (
        <>
          <StepsProgressBar>
            <StepDot $active={step >= 1} $completed={step > 1}>1</StepDot>
            <StepLine $active={step > 1} />
            <StepDot $active={step >= 2} $completed={step > 2}>2</StepDot>
            <StepLine $active={step > 2} />
            <StepDot $active={step >= 3} $completed={step > 3}>3</StepDot>
          </StepsProgressBar>

          {/* Internal Step 1: Search User */}
          {step === 1 && (
            <Content>
              <BackButton type="button" onClick={() => setMode('select')}>
                <ArrowLeft size={16} /> Chọn lại hình thức
              </BackButton>

              <SearchWrapper>
                <Search size={18} color="var(--text-secondary)" />
                <SearchInput
                  placeholder="Nhập tên người nhận ví Tingting..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                />
              </SearchWrapper>

              {searchResults.length > 0 ? (
                <ResultsList>
                  {searchResults.map((u) => {
                    const uId = u.id || (u as any).ID;
                    const name = u.Name || (u as any).name;
                    const email = u.Email || (u as any).email;
                    return (
                      <ResultItem key={uId} onClick={() => selectRecipient(u)}>
                        <AvatarWrapper>
                          <User size={18} />
                        </AvatarWrapper>
                        <ResultDetails>
                          <ResultName>{name}</ResultName>
                          <ResultEmail>{email}</ResultEmail>
                        </ResultDetails>
                        <ArrowRight size={16} color="var(--text-muted)" />
                      </ResultItem>
                    );
                  })}
                </ResultsList>
              ) : searchQuery.trim().length >= 2 ? (
                <NoResults>Không tìm thấy người dùng phù hợp</NoResults>
              ) : (
                <SearchPlaceholder>
                  <User size={32} color="var(--text-muted)" />
                  <p>Hãy nhập tên bạn bè để tìm kiếm tài khoản ví Tingting.</p>
                </SearchPlaceholder>
              )}
            </Content>
          )}

          {/* Internal Step 2: Details Form */}
          {step === 2 && selectedRecipient && (
            <Form onSubmit={handleInternalDetailsSubmit}>
              <BackButton type="button" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Quay lại
              </BackButton>

              <RecipientHeader>
                <AvatarWrapper $large>
                  <User size={24} />
                </AvatarWrapper>
                <h3>{selectedRecipient.Name || (selectedRecipient as any).name}</h3>
                <span>{selectedRecipient.Email || (selectedRecipient as any).email}</span>
              </RecipientHeader>

              <Input
                id="tx-internal-amount"
                label="Số tiền chuyển (VND)"
                type="number"
                placeholder="Nhập số tiền chuyển"
                value={internalAmount}
                onChange={(e) => setInternalAmount(e.target.value)}
                leftIcon={<Wallet size={16} />}
                autoFocus
              />

              <Input
                id="tx-internal-note"
                label="Lời nhắn chuyển tiền"
                placeholder="Nội dung chuyển tiền"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                leftIcon={<FileText size={16} />}
              />

              {error && <ErrorText>{error}</ErrorText>}

              <Footer>
                <Button variant="ghost" type="button" onClick={onClose}>Hủy bỏ</Button>
                <Button variant="primary" type="submit">Tiếp tục</Button>
              </Footer>
            </Form>
          )}

          {/* Internal Step 3: PIN Input */}
          {step === 3 && (
            <Form onSubmit={handleInternalPinSubmit}>
              <BackButton type="button" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> Quay lại
              </BackButton>

              <IconWrapper>
                <ShieldAlert size={30} color="var(--primary)" />
              </IconWrapper>
              <h4 style={{ textAlign: 'center', margin: 'var(--space-2) 0' }}>Nhập PIN giao dịch</h4>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 var(--space-2) 0' }}>
                Vui lòng nhập mã PIN giao dịch 6 chữ số để xác thực chuyển {formatVND(parseFloat(internalAmount))} cho {selectedRecipient?.Name || (selectedRecipient as any)?.name}.
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
                <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>Hủy bỏ</Button>
                <Button variant="primary" type="submit" isLoading={isLoading}>Xác nhận chuyển</Button>
              </Footer>
            </Form>
          )}
        </>
      )}

      {/* 3. MODE: EXTERNAL (BANK WIZARD) */}
      {mode === 'external' && (
        <>
          <StepsProgressBar>
            <StepDot $active={step >= 1} $completed={step > 1}>1</StepDot>
            <StepLine $active={step > 1} />
            <StepDot $active={step >= 2} $completed={step > 2}>2</StepDot>
            <StepLine $active={step > 2} />
            <StepDot $active={step >= 3} $completed={step > 3}>3</StepDot>
          </StepsProgressBar>

          {/* External Step 1: Details Form */}
          {step === 1 && (
            <Form onSubmit={handleExternalDetailsSubmit}>
              <BackButton type="button" onClick={() => setMode('select')}>
                <ArrowLeft size={16} /> Chọn lại hình thức
              </BackButton>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <SelectLabel>Chọn ngân hàng đối tác</SelectLabel>
                <select 
                  value={selectedBank} 
                  onChange={(e) => setSelectedBank(e.target.value as SupportedBanks)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--font-sm)',
                    width: '100%'
                  }}
                >
                  {SUPPORTED_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>

              <Input
                id="tx-external-number"
                label="Số tài khoản thụ hưởng"
                placeholder="Nhập số tài khoản ngân hàng"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                leftIcon={<CreditCard size={16} />}
              />

              <Input
                id="tx-external-name"
                label="Tên chủ tài khoản"
                placeholder="NHAP TEN KHONG DAU"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                leftIcon={<User size={16} />}
              />

              <Input
                id="tx-external-amount"
                label="Số tiền chuyển (VND)"
                type="number"
                placeholder="Nhập số tiền cần chuyển"
                value={externalAmount}
                onChange={(e) => setExternalAmount(e.target.value)}
                leftIcon={<Wallet size={16} />}
              />

              <Input
                id="tx-external-note"
                label="Lời nhắn chuyển khoản"
                placeholder="Nội dung chuyển khoản"
                value={externalNote}
                onChange={(e) => setExternalNote(e.target.value)}
                leftIcon={<FileText size={16} />}
              />

              {error && <ErrorText>{error}</ErrorText>}

              <Footer>
                <Button variant="ghost" type="button" onClick={onClose}>Hủy bỏ</Button>
                <Button variant="primary" type="submit">Tiếp tục</Button>
              </Footer>
            </Form>
          )}

          {/* External Step 2: PIN Verification */}
          {step === 2 && (
            <Form onSubmit={handleExternalPinSubmit}>
              <BackButton type="button" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Quay lại
              </BackButton>

              <IconWrapper>
                <ShieldAlert size={30} color="var(--primary)" />
              </IconWrapper>
              <h4 style={{ textAlign: 'center', margin: 'var(--space-2) 0' }}>Nhập PIN giao dịch</h4>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 var(--space-2) 0' }}>
                Xác thực chuyển khoản {formatVND(parseFloat(externalAmount))} tới tài khoản {accountName} ({selectedBank}).
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
                <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>Hủy bỏ</Button>
                <Button variant="primary" type="submit" isLoading={isLoading}>Xác nhận chuyển</Button>
              </Footer>
            </Form>
          )}

          {/* External Step 3: Polling */}
          {step === 3 && (
            <VerifyingState>
              <VerifyingIconWrapper>
                <Landmark size={28} />
              </VerifyingIconWrapper>
              <h4>Đang liên thông ngân hàng</h4>
              <p>Hệ thống đang kết nối ngân hàng thụ hưởng thụ lý giao dịch. Vui lòng không đóng cửa sổ này...</p>
            </VerifyingState>
          )}
        </>
      )}
    </AppDialog>
  );
}

// Styled Components
const SelectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  padding: var(--space-4) 0;
`;

const SelectionCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-5) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  background-color: var(--surface);
  transition: all var(--transition-normal);

  &:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  h3 {
    margin: var(--space-3) 0 var(--space-1) 0;
    font-size: var(--font-sm);
    color: var(--text-primary);
  }

  p {
    margin: 0;
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.4;
  }
`;

const IconBox = styled.div<{ $bg: string; $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StepsProgressBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-5);
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
  gap: var(--space-4);
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--surface-secondary);

  &:focus-within {
    border-color: var(--primary);
    background-color: var(--surface);
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--font-sm);
  color: var(--text-primary);
  width: 100%;
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 200px;
  overflow-y: auto;
  padding: 2px;
`;

const ResultItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  background-color: var(--surface);
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--primary-soft);
    background-color: var(--surface-secondary);
  }
`;

const AvatarWrapper = styled.div<{ $large?: boolean }>`
  width: ${({ $large }) => ($large ? '48px' : '36px')};
  height: ${({ $large }) => ($large ? '48px' : '36px')};
  border-radius: 50%;
  background-color: var(--primary-soft);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ResultDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const ResultName = styled.span`
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
`;

const ResultEmail = styled.span`
  font-size: 11px;
  color: var(--text-muted);
`;

const NoResults = styled.div`
  text-align: center;
  padding: var(--space-6);
  font-size: var(--font-sm);
  color: var(--text-muted);
`;

const SearchPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-6);
  color: var(--text-muted);
  gap: var(--space-2);

  p {
    margin: 0;
    font-size: var(--font-sm);
    max-width: 250px;
  }
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

const RecipientHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: var(--space-2);

  h3 {
    margin: var(--space-2) 0 2px 0;
    color: var(--text-primary);
  }

  span {
    font-size: var(--font-xs);
    color: var(--text-muted);
  }
`;

const SelectLabel = styled.label`
  font-size: var(--font-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: 2px;
  display: block;
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

const AlertContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;
