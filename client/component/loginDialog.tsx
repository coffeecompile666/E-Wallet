'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Mail, Lock, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import AppDialog from '@/component/atomic/dialog';
import Input from '@/component/atomic/input';
import Button from '@/component/atomic/button';
import PinInput from '@/component/atomic/pinInput';
import { useAppStore } from '@/store/appStore';
import { addAlert } from '@/help/addAlert';

type LoginDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function LoginDialog({ open, onClose }: LoginDialogProps) {
  const setUser = useAppStore((state) => state.setUser);
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Error states
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    pin?: string;
  }>({});

  const validate = () => {
    const tempErrors: typeof errors = {};
    
    // Email validate
    if (!email) {
      tempErrors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Email không đúng định dạng';
    }

    // Password validate
    if (!password) {
      tempErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      tempErrors.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    }

    if (activeTab === 'register') {
      if (password !== confirmPassword) {
        tempErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
      }
      if (pin.length < 6) {
        tempErrors.pin = 'Mã PIN giao dịch phải gồm 6 chữ số';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    // Simulate API Call
    setTimeout(() => {
      setIsLoading(false);
      
      const userName = email.split('@')[0];
      const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
      
      // Set the mock user session
      setUser({
        id: 1,
        email: email,
        name: displayName,
        balance: activeTab === 'register' ? 500000 : 24500000, // starting balance in VND
      } as any);

      addAlert(
        <AlertContent>
          {activeTab === 'login' ? 'Đăng nhập thành công!' : 'Đăng ký tài khoản ví thành công! Nhận ngay 500.000đ trải nghiệm.'}
        </AlertContent>
      );
      
      onClose();
    }, 1500);
  };

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
    setPin('');
  };

  return (
    <AppDialog open={open} onClose={onClose} title="">
      <DialogHeader>
        <LogoArea>
          <LogoIcon />
          <LogoText>Tingting</LogoText>
        </LogoArea>
        <Subtitle>
          {activeTab === 'login'
            ? 'Đăng nhập tài khoản của bạn để giao dịch nhanh chóng'
            : 'Đăng ký ví điện tử Tingting bảo mật và tiện lợi'}
        </Subtitle>
      </DialogHeader>

      <TabContainer>
        <TabButton 
          $active={activeTab === 'login'} 
          onClick={() => handleTabChange('login')}
          type="button"
        >
          <LogIn size={16} /> Đăng nhập
        </TabButton>
        <TabButton 
          $active={activeTab === 'register'} 
          onClick={() => handleTabChange('register')}
          type="button"
        >
          <UserPlus size={16} /> Đăng ký
        </TabButton>
      </TabContainer>

      <Form onSubmit={handleSubmit}>
        <Input
          id="auth-email"
          type="email"
          label="Email đăng nhập"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail />}
          error={errors.email}
          disabled={isLoading}
        />

        <Input
          id="auth-password"
          type={showPassword ? 'text' : 'password'}
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock />}
          rightIcon={
            <IconButton onClick={() => setShowPassword(!showPassword)} type="button">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </IconButton>
          }
          error={errors.password}
          disabled={isLoading}
        />

        {activeTab === 'register' && (
          <>
            <Input
              id="auth-confirm-password"
              type={showPassword ? 'text' : 'password'}
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock />}
              error={errors.confirmPassword}
              disabled={isLoading}
            />

            <PinSection>
              <PinLabel>Mã PIN bảo mật giao dịch (6 chữ số)</PinLabel>
              <PinSubtext>Nhập mã PIN để bảo vệ các giao dịch chuyển tiền của bạn</PinSubtext>
              <PinWrapper>
                <PinInput
                  length={6}
                  value={pin}
                  onChange={(val) => setPin(val)}
                  mask={true}
                />
              </PinWrapper>
              {errors.pin && <PinError>{errors.pin}</PinError>}
            </PinSection>
          </>
        )}

        <SubmitButton 
          variant="primary" 
          type="submit" 
          isLoading={isLoading}
        >
          {activeTab === 'login' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản ví'}
        </SubmitButton>
      </Form>
    </AppDialog>
  );
}

const DialogHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: var(--space-4);
`;

const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
`;

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
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
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin: 0;
  max-width: 320px;
`;

const TabContainer = styled.div`
  display: flex;
  background-color: var(--surface-secondary);
  padding: 4px;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-5);
  border: 1px solid var(--border);
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: none;
  background: ${({ $active }) => ($active ? 'var(--surface)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--text-primary)' : 'var(--text-secondary)')};
  font-family: var(--font-family);
  font-size: var(--font-sm);
  font-weight: ${({ $active }) => ($active ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)')};
  padding: 10px 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  box-shadow: ${({ $active }) => ($active ? 'var(--shadow-sm)' : 'none')};
  transition: all var(--transition-fast);

  &:hover {
    color: var(--text-primary);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    color: var(--text-primary);
  }
`;

const SubmitButton = styled(Button)`
  width: 100%;
  margin-top: var(--space-2);
`;

const PinSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border: 1px dashed var(--border);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background-color: var(--surface-secondary);
`;

const PinLabel = styled.label`
  font-size: var(--font-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
`;

const PinSubtext = styled.span`
  font-size: 11px;
  color: var(--text-muted);
`;

const PinWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: var(--space-2);
`;

const PinError = styled.span`
  font-size: var(--font-xs);
  color: var(--danger);
  font-weight: var(--font-weight-medium);
  text-align: center;
`;

const AlertContent = styled.div`
  display: flex;
  align-items: center;
  font-weight: var(--font-weight-medium);
`;
