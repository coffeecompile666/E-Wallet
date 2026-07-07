'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Plus, Trash2, Building2, Link2 } from 'lucide-react';
import Card from '@/component/atomic/card';
import Button from '@/component/atomic/button';
import AppDialog from '@/component/atomic/dialog';
import Input from '@/component/atomic/input';
import { addAlert } from '@/help/addAlert';
import { LinkedBankAccount, SupportedBanks } from '@/api/types';
import { addLinkedBankAccount, removeLinkedBankAccount } from '@/api/payment';

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

interface BankAccountCardProps {
  bankAccounts: LinkedBankAccount[];
  onRefresh: () => void;
}

export default function BankAccountCard({ bankAccounts, onRefresh }: BankAccountCardProps) {
  const [isLinkBankOpen, setIsLinkBankOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<SupportedBanks>('VCB');
  const [bankNumber, setBankNumber] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');
  const [isLinkingLoading, setIsLinkingLoading] = useState(false);

  const handleLinkBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankNumber) {
      addAlert(<>Vui lòng nhập số tài khoản ngân hàng</>);
      return;
    }
    if (!bankHolderName) {
      addAlert(<>Vui lòng nhập tên chủ tài khoản</>);
      return;
    }

    setIsLinkingLoading(true);
    try {
      await addLinkedBankAccount({
        bank: selectedBank,
        number: bankNumber,
        name: bankHolderName.toUpperCase(),
      });
      addAlert(<>Liên kết tài khoản ngân hàng thành công!</>);
      setIsLinkBankOpen(false);
      setBankNumber('');
      setBankHolderName('');
      onRefresh();
    } catch (err: any) {
      addAlert(<>{err.userMessage || 'Liên kết tài khoản ngân hàng thất bại'}</>);
    } finally {
      setIsLinkingLoading(false);
    }
  };

  const handleUnlinkBank = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn hủy liên kết tài khoản ngân hàng này?')) return;
    try {
      await removeLinkedBankAccount(id);
      addAlert(<>Đã hủy liên kết tài khoản ngân hàng thành công!</>);
      onRefresh();
    } catch (err: any) {
      addAlert(<>{err.userMessage || 'Hủy liên kết tài khoản ngân hàng thất bại'}</>);
    }
  };

  return (
    <>
      <Card title="Tài khoản ngân hàng liên kết" extra={
        <Button variant="ghost" size="sm" onClick={() => setIsLinkBankOpen(true)} leftIcon={<Plus size={14} />}>
          Liên kết mới
        </Button>
      }>
        {bankAccounts.length === 0 ? (
          <EmptyBankAccounts>
            <Link2 size={32} />
            <p>Chưa có tài khoản ngân hàng nào được liên kết.</p>
          </EmptyBankAccounts>
        ) : (
          <BankAccountList>
            {bankAccounts.map((acc, index) => {
              const accId = acc.id || (acc as any).ID;
              const bankInfo = SUPPORTED_BANKS.find(b => b.code === acc.Bank);
              return (
                <BankAccountItem key={accId || index}>
                  <BankIconWrapper>
                    {bankInfo ? (
                      <img src={bankInfo.icon} alt={bankInfo.name} width={32} height={32} style={{ borderRadius: '4px' }} />
                    ) : (
                      <Building2 size={20} />
                    )}
                  </BankIconWrapper>
                  <BankAccountDetails>
                    <BankAccountName>{acc.Name}</BankAccountName>
                    <BankAccountNumber>
                      {bankInfo?.name || acc.Bank} • {acc.Number}
                    </BankAccountNumber>
                  </BankAccountDetails>
                  <DeleteAccountButton onClick={() => handleUnlinkBank(accId)} title="Hủy liên kết" type="button">
                    <Trash2 size={16} />
                  </DeleteAccountButton>
                </BankAccountItem>
              );
            })}
          </BankAccountList>
        )}
      </Card>

      {/* Link Bank Account Dialog */}
      <AppDialog open={isLinkBankOpen} onClose={() => setIsLinkBankOpen(false)} title="Liên kết tài khoản ngân hàng">
        <Form onSubmit={handleLinkBankSubmit}>
          <SelectLabel>Chọn ngân hàng</SelectLabel>
          <BankGrid>
            {SUPPORTED_BANKS.map((b) => (
              <BankSelectOption 
                key={b.code} 
                $selected={selectedBank === b.code}
                onClick={() => setSelectedBank(b.code)}
                type="button"
              >
                <img src={b.icon} alt={b.name} width={28} height={28} style={{ borderRadius: '2px' }} />
                <span>{b.name}</span>
              </BankSelectOption>
            ))}
          </BankGrid>

          <Input
            id="bank-number"
            label="Số tài khoản ngân hàng"
            placeholder="Nhập số tài khoản"
            value={bankNumber}
            onChange={(e) => setBankNumber(e.target.value)}
          />

          <Input
            id="bank-holder-name"
            label="Tên chủ tài khoản (viết hoa không dấu)"
            placeholder="NGUYEN VAN A"
            value={bankHolderName}
            onChange={(e) => setBankHolderName(e.target.value)}
          />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLinkBankOpen(false)} type="button">Hủy bỏ</Button>
            <Button variant="primary" type="submit" isLoading={isLinkingLoading}>Liên kết ngay</Button>
          </DialogFooter>
        </Form>
      </AppDialog>
    </>
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

const BankAccountList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const BankAccountItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--surface);
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--primary-soft);
    background-color: var(--surface-secondary);
  }
`;

const BankIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background-color: var(--surface-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  flex-shrink: 0;
  overflow: hidden;
`;

const BankAccountDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const BankAccountName = styled.span`
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
`;

const BankAccountNumber = styled.span`
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
`;

const DeleteAccountButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);

  &:hover {
    color: var(--danger);
    background-color: var(--danger-soft);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const SelectLabel = styled.label`
  font-size: var(--font-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: 2px;
`;

const BankGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
  max-height: 200px;
  overflow-y: auto;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
`;

const BankSelectOption = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid ${({ $selected }) => ($selected ? 'var(--primary)' : 'transparent')};
  background-color: ${({ $selected }) => ($selected ? 'var(--primary-soft)' : 'transparent')};
  color: ${({ $selected }) => ($selected ? 'var(--primary)' : 'var(--text-primary)')};
  font-family: var(--font-family);
  font-size: var(--font-xs);
  font-weight: ${({ $selected }) => ($selected ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)')};
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background-color: var(--surface-secondary);
  }
`;

const DialogFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
`;
