'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { 
  Wallet, 
  Send, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  LogOut, 
  Eye, 
  EyeOff, 
  User, 
  TrendingUp, 
  ArrowRight,
  Shield,
  Clock,
  CircleCheck,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { addAlert } from '@/help/addAlert';
import Button from '@/component/atomic/button';
import Card from '@/component/atomic/card';
import Input from '@/component/atomic/input';
import Badge from '@/component/atomic/badge';
import PinInput from '@/component/atomic/pinInput';
import AppDialog from '@/component/atomic/dialog';

type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  time: string;
  status: 'success' | 'pending' | 'failed';
};

export default function Dashboard() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const clearUser = useAppStore((state) => state.clearUser);
  const setAppDialog = useAppStore((state) => state.setAppDialog);

  // UI state
  const [showBalance, setShowBalance] = useState(true);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500000');
  
  // Transfer Form state
  const [receiver, setReceiver] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('Chuyển tiền ví Tingting');
  
  // Error states
  const [errors, setErrors] = useState<{ receiver?: string; amount?: string }>({});

  // Mock Transaction Log State
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-1',
      title: 'Nạp tiền từ Vietcombank',
      amount: 10000000,
      type: 'income',
      time: '14:23 - 04/07/2026',
      status: 'success',
    },
    {
      id: 'tx-2',
      title: 'Thanh toán hóa đơn điện',
      amount: 850000,
      type: 'expense',
      time: '09:12 - 03/07/2026',
      status: 'success',
    },
    {
      id: 'tx-3',
      title: 'Nhận tiền từ Nguyen Van B',
      amount: 1500000,
      type: 'income',
      time: '18:45 - 01/07/2026',
      status: 'success',
    },
    {
      id: 'tx-4',
      title: 'Mua thẻ điện thoại Viettel',
      amount: 100000,
      type: 'expense',
      time: '12:00 - 30/06/2026',
      status: 'success',
    },
  ]);

  if (!user) return null;

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' đ';
  };

  const handleDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      addAlert(<>Số tiền nạp không hợp lệ</>);
      return;
    }

    const updatedBalance = user.balance + amt;
    setUser({ ...user, balance: updatedBalance });

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: 'Nạp tiền vào ví',
      amount: amt,
      type: 'income',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN'),
      status: 'success',
    };

    setTransactions([newTx, ...transactions]);
    setIsDepositOpen(false);
    addAlert(<>Đã nạp thành công {formatVND(amt)} vào ví!</>);
  };

  const startTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    const tempErrors: typeof errors = {};
    if (!receiver) {
      tempErrors.receiver = 'Vui lòng nhập Email hoặc Số điện thoại người nhận';
    }
    
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      tempErrors.amount = 'Số tiền chuyển không hợp lệ';
    } else if (amt > user.balance) {
      tempErrors.amount = 'Số tiền vượt quá số dư khả dụng';
    }

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) return;

    // Trigger PIN verification dialog
    openPinVerification(amt);
  };

  const openPinVerification = (amt: number) => {
    setAppDialog(
      <PinVerifyModal 
        amount={amt} 
        receiver={receiver} 
        message={transferMessage}
        onVerifySuccess={() => confirmTransfer(amt)}
      />
    );
  };

  const confirmTransfer = (amt: number) => {
    // Process transfer
    const updatedBalance = user.balance - amt;
    setUser({ ...user, balance: updatedBalance });

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: `Chuyển tiền đến ${receiver}`,
      amount: amt,
      type: 'expense',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN'),
      status: 'success',
    };

    setTransactions([newTx, ...transactions]);
    
    // Clear forms
    setReceiver('');
    setTransferAmount('');
    setTransferMessage('Chuyển tiền ví Tingting');
    
    // Close modal
    setAppDialog(undefined);
    
    addAlert(
      <AlertContent>
        <CircleCheck size={18} color="var(--success)" />
        <span>Giao dịch chuyển tiền {formatVND(amt)} đã hoàn thành!</span>
      </AlertContent>
    );
  };

  return (
    <Container>
      {/* Top Navbar */}
      <Navbar>
        <LogoArea>
          <LogoIcon />
          <LogoText>Tingting</LogoText>
        </LogoArea>
        
        <UserMenu>
          <UserIconWrapper>
            <User size={18} />
          </UserIconWrapper>
          <UserInfo>
            <UserName>{user.name}</UserName>
            <UserEmail>{user.email}</UserEmail>
          </UserInfo>
          <LogoutButton onClick={clearUser} title="Đăng xuất">
            <LogOut size={18} />
          </LogoutButton>
        </UserMenu>
      </Navbar>

      <DashboardGrid>
        {/* Left Column: Wallet Balance & Actions + Quick Transfer */}
        <LeftCol>
          {/* Balance card */}
          <BalanceCard>
            <BalanceHeader>
              <BalanceTitle>Số dư khả dụng</BalanceTitle>
              <EyeToggle onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </EyeToggle>
            </BalanceHeader>
            <BalanceAmount>
              {showBalance ? formatVND(user.balance) : '••••••••'}
            </BalanceAmount>
            
            <ActionRow>
              <ActionButton onClick={() => setIsDepositOpen(true)}>
                <ActionIconWrapper $color="var(--success)">
                  <PlusCircle size={20} />
                </ActionIconWrapper>
                <span>Nạp tiền</span>
              </ActionButton>
              
              <ActionButton onClick={() => addAlert(<>Tính năng Rút tiền đang được nâng cấp!</>)}>
                <ActionIconWrapper $color="var(--primary)">
                  <ArrowUpRight size={20} />
                </ActionIconWrapper>
                <span>Rút tiền</span>
              </ActionButton>
            </ActionRow>
          </BalanceCard>

          {/* Quick Transfer Card */}
          <Card title="Chuyển tiền nhanh" extra={<Badge variant="success">Bảo mật</Badge>}>
            <Form onSubmit={startTransfer}>
              <Input
                id="transfer-receiver"
                label="Người nhận (Email hoặc SĐT)"
                placeholder="nhap.email@example.com hoặc SĐT"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                leftIcon={<User size={16} />}
                error={errors.receiver}
              />
              
              <Input
                id="transfer-amount"
                label="Số tiền chuyển (VND)"
                type="number"
                placeholder="Nhập số tiền chuyển"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                leftIcon={<Wallet size={16} />}
                error={errors.amount}
              />

              <Input
                id="transfer-message"
                label="Lời nhắn chuyển tiền"
                placeholder="Nội dung chuyển tiền"
                value={transferMessage}
                onChange={(e) => setTransferMessage(e.target.value)}
              />

              <Button variant="primary" type="submit" style={{ width: '100%', marginTop: '8px' }} rightIcon={<ArrowRight />}>
                Tiếp tục giao dịch
              </Button>
            </Form>
          </Card>
        </LeftCol>

        {/* Right Column: Transaction Log */}
        <RightCol>
          <Card title="Lịch sử giao dịch gần đây" extra={<Badge variant="info"><Clock size={12} style={{ marginRight: '4px' }} /> 24/7</Badge>}>
            <TransactionList>
              {transactions.map((tx) => (
                <TransactionItem key={tx.id}>
                  <TxIconWrapper $type={tx.type}>
                    {tx.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </TxIconWrapper>
                  
                  <TxDetails>
                    <TxTitle>{tx.title}</TxTitle>
                    <TxTime>{tx.time}</TxTime>
                  </TxDetails>

                  <TxRight>
                    <TxAmount $type={tx.type}>
                      {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                    </TxAmount>
                    <Badge variant={tx.status === 'success' ? 'success' : 'warning'}>
                      {tx.status === 'success' ? 'Thành công' : 'Đang xử lý'}
                    </Badge>
                  </TxRight>
                </TransactionItem>
              ))}
            </TransactionList>
          </Card>
        </RightCol>
      </DashboardGrid>

      {/* Deposit Dialog */}
      <AppDialog open={isDepositOpen} onClose={() => setIsDepositOpen(false)} title="Nạp tiền vào ví">
        <DepositContent>
          <p>Chọn số tiền cần nạp từ ngân hàng liên kết của bạn.</p>
          <DepositOptions>
            {['100000', '200000', '500000', '1000000', '2000000', '5000000'].map((val) => (
              <OptionButton 
                key={val} 
                $selected={depositAmount === val}
                onClick={() => setDepositAmount(val)}
              >
                {formatVND(parseFloat(val))}
              </OptionButton>
            ))}
          </DepositOptions>

          <Input
            id="custom-deposit-amount"
            type="number"
            label="Hoặc nhập số tiền khác"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />

          <DepositFooter>
            <Button variant="ghost" onClick={() => setIsDepositOpen(false)}>Hủy bỏ</Button>
            <Button variant="primary" onClick={handleDeposit}>Xác nhận nạp tiền</Button>
          </DepositFooter>
        </DepositContent>
      </AppDialog>
    </Container>
  );
}

// PIN Verification Dialog Component
function PinVerifyModal({ 
  amount, 
  receiver, 
  message,
  onVerifySuccess 
}: { 
  amount: number; 
  receiver: string; 
  message: string;
  onVerifySuccess: () => void;
}) {
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

    // Simulate PIN check
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
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-6) var(--space-8) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const Navbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
  padding-bottom: var(--space-4);
`;

const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%);
  position: relative;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);

  &::after {
    content: '';
    position: absolute;
    top: 25%;
    left: 25%;
    width: 50%;
    height: 50%;
    border: 3px solid white;
    border-radius: 50%;
    border-top-color: transparent;
  }
`;

const LogoText = styled.span`
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.5px;
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background-color: var(--surface);
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: var(--radius-lg);
`;

const UserIconWrapper = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-soft);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  
  @media (max-width: 600px) {
    display: none;
  }
`;

const UserName = styled.span`
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1.2;
`;

const UserEmail = styled.span`
  font-size: 10px;
  color: var(--text-muted);
`;

const LogoutButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);

  &:hover {
    background-color: var(--surface-secondary);
    color: var(--danger);
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: var(--space-6);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const LeftCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const RightCol = styled.div`
  display: flex;
  flex-direction: column;
`;

const BalanceCard = styled.div`
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const BalanceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BalanceTitle = styled.span`
  font-size: var(--font-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: var(--font-weight-semibold);
`;

const EyeToggle = styled.button`
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  
  &:hover {
    color: white;
  }
`;

const BalanceAmount = styled.h2`
  font-size: 32px;
  color: white;
  margin: 0;
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.5px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: var(--space-4);
  margin-top: var(--space-2);
`;

const ActionButton = styled.button`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: white;
  font-family: var(--font-family);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
`;

const ActionIconWrapper = styled.div<{ $color: string }>`
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const TransactionItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const TxIconWrapper = styled.div<{ $type: 'income' | 'expense' }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${({ $type }) => ($type === 'income' ? 'var(--success-soft)' : 'var(--danger-soft)')};
  color: ${({ $type }) => ($type === 'income' ? 'var(--income)' : 'var(--expense)')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const TxDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const TxTitle = styled.span`
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
`;

const TxTime = styled.span`
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
`;

const TxRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const TxAmount = styled.span<{ $type: 'income' | 'expense' }>`
  font-size: var(--font-sm);
  font-weight: var(--font-weight-bold);
  color: ${({ $type }) => ($type === 'income' ? 'var(--income)' : 'var(--expense)')};
`;

const DepositContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  p {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    margin: 0;
  }
`;

const DepositOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
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

const DepositFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
`;

// Verify PIN styled components
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

const AlertContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;
