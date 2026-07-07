'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Wallet, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  LogOut, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight,
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
import { logout } from '@/api/auth';
import { getLinkedBankAccounts } from '@/api/payment';
import { getTransactions } from '@/api/wallet';
import { LinkedBankAccount, Transfer } from '@/api/types';

// Modular Subcomponents
import BankAccountCard from './dashboard/BankAccountCard';
import DepositModal from './dashboard/DepositModal';
import WithdrawModal from './dashboard/WithdrawModal';
import PinVerifyModal from './dashboard/PinVerifyModal';

export default function Dashboard() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const clearUser = useAppStore((state) => state.clearUser);
  const setAppDialog = useAppStore((state) => state.setAppDialog);

  // States
  const [showBalance, setShowBalance] = useState(true);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isLinkBankOpenForce, setIsLinkBankOpenForce] = useState(false); // Helper to open Link Bank Modal from Deposit Modal
  const [bankAccounts, setBankAccounts] = useState<LinkedBankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transfer[]>([]);

  // Transfer Form state
  const [receiver, setReceiver] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('Chuyển tiền ví Tingting');
  const [errors, setErrors] = useState<{ receiver?: string; amount?: string }>({});

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' đ';
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await getLinkedBankAccounts();
      setBankAccounts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch linked bank accounts:', err);
    }
  };

  const fetchTransactions = async () => {
    const walletId = user?.walletId || (user as any)?.WalletID || (user as any)?.wallet_id;
    if (!walletId) return;
    try {
      const res = await getTransactions({
        wallet_id: walletId,
        start: 0,
        end: 20,
      });
      setTransactions(res.items || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    const walletId = user?.walletId || (user as any)?.WalletID || (user as any)?.wallet_id;
    if (walletId) {
      fetchTransactions();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearUser();
    }
  };

  const startTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: typeof errors = {};
    if (!receiver) {
      tempErrors.receiver = 'Vui lòng nhập Email hoặc Số điện thoại người nhận';
    }
    
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      tempErrors.amount = 'Số tiền chuyển không hợp lệ';
    } else if (amt > user!.balance) {
      tempErrors.amount = 'Số tiền vượt quá số dư khả dụng';
    }

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) return;

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
    if (!user) return;
    const updatedBalance = user.balance - amt;
    setUser({ ...user, balance: updatedBalance });

    setReceiver('');
    setTransferAmount('');
    setTransferMessage('Chuyển tiền ví Tingting');
    setAppDialog(undefined);
    
    addAlert(
      <AlertContent>
        <CircleCheck size={18} color="var(--success)" />
        <span>Giao dịch chuyển tiền {formatVND(amt)} đã hoàn thành!</span>
      </AlertContent>
    );
    fetchTransactions();
  };

  if (!user) return null;

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
          <LogoutButton onClick={handleLogout} title="Đăng xuất">
            <LogOut size={18} />
          </LogoutButton>
        </UserMenu>
      </Navbar>

      <DashboardGrid>
        {/* Left Column: Wallet Balance & Actions + Quick Transfer + Link Bank */}
        <LeftCol>
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
              
              <ActionButton onClick={() => setIsWithdrawOpen(true)}>
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

          {/* Linked Bank Accounts Card */}
          <BankAccountCard 
            bankAccounts={bankAccounts} 
            onRefresh={fetchBankAccounts} 
          />
        </LeftCol>

        {/* Right Column: Transaction Log */}
        <RightCol>
          <Card title="Lịch sử giao dịch gần đây" extra={<Badge variant="info"><Clock size={12} style={{ marginRight: '4px' }} /> 24/7</Badge>}>
            {transactions.length === 0 ? (
              <EmptyTransactions>
                <Clock size={32} color="var(--text-muted)" />
                <p>Chưa có giao dịch nào được thực hiện.</p>
              </EmptyTransactions>
            ) : (
              <TransactionList>
                {transactions.map((tx, index) => (
                  <TransactionItem key={tx.id || (tx as any).ID || index}>
                    <TxIconWrapper $type={tx.Type === 'DEPOSIT' ? 'income' : 'expense'}>
                      {tx.Type === 'DEPOSIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </TxIconWrapper>
                    
                    <TxDetails>
                      <TxTitle>
                        {tx.Type === 'DEPOSIT'
                          ? 'Nạp tiền vào ví'
                          : tx.Type === 'WITHDRAWAL'
                          ? 'Rút tiền về ngân hàng'
                          : tx.Type === 'TRANSFER_OUT'
                          ? 'Chuyển tiền ra ngân hàng'
                          : 'Giao dịch chuyển tiền'}
                      </TxTitle>
                      <TxTime>
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(tx.created_at).toLocaleDateString('vi-VN')
                          : ''}
                      </TxTime>
                    </TxDetails>

                    <TxRight>
                      <TxAmount $type={tx.Type === 'DEPOSIT' ? 'income' : 'expense'}>
                        {tx.Type === 'DEPOSIT' ? '+' : '-'}{formatVND(tx.Amount)}
                      </TxAmount>
                      <Badge variant={tx.Status === 'COMPLETED' ? 'success' : tx.Status === 'PENDING' ? 'warning' : 'danger'}>
                        {tx.Status === 'COMPLETED' ? 'Thành công' : tx.Status === 'PENDING' ? 'Đang xử lý' : 'Thất bại'}
                      </Badge>
                    </TxRight>
                  </TransactionItem>
                ))}
              </TransactionList>
            )}
          </Card>
        </RightCol>
      </DashboardGrid>

      {/* Deposit Dialog */}
      <DepositModal 
        open={isDepositOpen} 
        onClose={() => setIsDepositOpen(false)} 
        bankAccounts={bankAccounts} 
        onSuccess={() => {
          fetchTransactions();
        }}
        onOpenLinkBank={() => {
          setIsDepositOpen(false);
          addAlert(<>Vui lòng nhấp vào nút "Liên kết mới" ở thẻ Tài khoản liên kết.</>);
        }}
      />

      {/* Withdraw Dialog */}
      <WithdrawModal 
        open={isWithdrawOpen} 
        onClose={() => setIsWithdrawOpen(false)} 
        bankAccounts={bankAccounts} 
        onSuccess={() => {
          fetchTransactions();
        }}
        onOpenLinkBank={() => {
          setIsWithdrawOpen(false);
          addAlert(<>Vui lòng nhấp vào nút "Liên kết mới" ở thẻ Tài khoản liên kết.</>);
        }}
      />
    </Container>
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

const EmptyTransactions = styled.div`
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

const AlertContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;
