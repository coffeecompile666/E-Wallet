'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Mail, Lock, Eye, EyeOff, UserPlus, LogIn, KeyRound, ArrowLeft } from 'lucide-react';
import AppDialog from '@/component/atomic/dialog';
import Input from '@/component/atomic/input';
import Button from '@/component/atomic/button';
import PinInput from '@/component/atomic/pinInput';
import { useAppStore } from '@/store/appStore';
import { useSignupStore } from '@/store/signupStore';
import { signup, verifyOTP, confirmSignup, signin, getMe, forgotPassword, confirmForgotPassword } from '@/api/auth';
import { getWalletMe } from '@/api/wallet';
import { addAlert } from '@/help/addAlert';

type LoginDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function LoginDialog({ open, onClose }: LoginDialogProps) {
  const setUser = useAppStore((state) => state.setUser);
  
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot_password'>('login');
  
  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup wizard local states
  const signupState = useSignupStore();
  const [otpVal, setOtpVal] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Forgot Password states
  const [forgotEmail, setForgotPasswordEmail] = useState('');
  const [forgotStep, setForgotPasswordStep] = useState<1 | 2>(1); // 1: email input, 2: OTP & new password
  const [forgotOtpVal, setForgotPasswordOtpVal] = useState('');
  const [forgotPasswordVal, setForgotPasswordVal] = useState('');
  const [forgotConfirmPasswordVal, setForgotPasswordConfirmPasswordVal] = useState('');
  const [forgotOtpId, setForgotPasswordOtpId] = useState<number | null>(null);
  const [forgotLoading, setForgotPasswordLoading] = useState(false);

  // Error states
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    otp?: string;
  }>({});

  // Reset states on Dialog open/close
  useEffect(() => {
    if (open) {
      handleTabChange('login');
    }
  }, [open]);

  // Step 3 Automated Verification for Signup
  useEffect(() => {
    if (activeTab === 'register' && signupState.step === 3) {
      const runVerify = async () => {
        try {
          await verifyOTP({
            otp_id: signupState.otpId!,
            otp: signupState.otp,
          });
          signupState.setStep(4);
        } catch (err: any) {
          addAlert(
            <AlertContent>
              Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.
            </AlertContent>
          );
          signupState.setStep(2);
        }
      };
      runVerify();
    }
  }, [signupState.step, activeTab]);

  const handleTabChange = (tab: 'login' | 'register' | 'forgot_password') => {
    setActiveTab(tab);
    setErrors({});
    setLoginPassword('');
    setOtpVal('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    signupState.resetSignup();
    // reset forgot password states
    setForgotPasswordEmail('');
    setForgotPasswordStep(1);
    setForgotPasswordOtpVal('');
    setForgotPasswordVal('');
    setForgotPasswordConfirmPasswordVal('');
    setForgotPasswordOtpId(null);
    setForgotPasswordLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: typeof errors = {};

    if (!loginEmail) {
      tempErrors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/\S+@\S+\.\S+/.test(loginEmail)) {
      tempErrors.email = 'Email không đúng định dạng';
    }

    if (!loginPassword) {
      tempErrors.password = 'Vui lòng nhập mật khẩu';
    }

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) return;

    setLoginLoading(true);
    try {
      const res = await signin({
        email: loginEmail,
        password: loginPassword,
      });

      if (res?.data?.access_token) {
        localStorage.setItem('access_token', res.data.access_token);
        
        const [userRes, walletRes] = await Promise.all([
          getMe(),
          getWalletMe(),
        ]);

        setUser({
          id: userRes.data.id || (userRes.data as any).ID,
          email: userRes.data.Email,
          name: userRes.data.Name,
          balance: walletRes.data.Balance - walletRes.data.LockedAmount,
          walletId: walletRes.data.id || (walletRes.data as any).ID,
          hasTxPin: !!userRes.data.TransactionPin || !!(userRes.data as any).TransactionPIN,
        });

        addAlert(<AlertContent>Đăng nhập thành công!</AlertContent>);
        onClose();
      }
    } catch (err: any) {
      addAlert(<AlertContent>{err.userMessage || 'Email hoặc mật khẩu không chính xác.'}</AlertContent>);
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 1: Submit Email for Signup
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupState.email) {
      setErrors({ email: 'Vui lòng nhập địa chỉ email' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(signupState.email)) {
      setErrors({ email: 'Email không đúng định dạng' });
      return;
    }

    setErrors({});
    signupState.setLoading(true);

    try {
      const res = await signup({ email: signupState.email });
      signupState.setOtpId(res.data);
      signupState.setStep(2);
      addAlert(<AlertContent>Mã OTP đã được gửi đến email của bạn.</AlertContent>);
    } catch (err: any) {
      addAlert(<AlertContent>{err.userMessage || 'Đăng ký thất bại. Vui lòng thử lại.'}</AlertContent>);
    } finally {
      signupState.setLoading(false);
    }
  };

  // Step 2: Submit OTP for Signup
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpVal.length < 6) {
      setErrors({ otp: 'Vui lòng nhập đủ 6 chữ số mã OTP' });
      return;
    }

    setErrors({});
    signupState.setOtp(otpVal);
    signupState.setStep(3); // Automated effect triggers step 3 verify
  };

  // Step 4: Submit Password to Confirm Signup
  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: typeof errors = {};

    if (!signupPassword) {
      tempErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (signupPassword.length < 6) {
      tempErrors.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    }

    if (signupPassword !== signupConfirmPassword) {
      tempErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) return;

    signupState.setLoading(true);
    try {
      await confirmSignup({
        otp_id: signupState.otpId!,
        otp: signupState.otp,
        password: signupPassword,
        password_confirmation: signupConfirmPassword,
      });

      addAlert(
        <AlertContent>
          Đăng ký tài khoản ví thành công! Vui lòng đăng nhập.
        </AlertContent>
      );
      handleTabChange('login');
    } catch (err: any) {
      addAlert(<AlertContent>{err.userMessage || 'Đăng ký xác nhận thất bại. Vui lòng thử lại.'}</AlertContent>);
    } finally {
      signupState.setLoading(false);
    }
  };

  // Forgot Password: Step 1 (Request OTP)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!forgotEmail) {
      setErrors({ email: 'Vui lòng nhập địa chỉ email của bạn' });
      return;
    } else if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      setErrors({ email: 'Email không đúng định dạng' });
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const res = await forgotPassword({ email: forgotEmail });
      if (res?.data) {
        setForgotPasswordOtpId(res.data);
        setForgotPasswordStep(2);
        addAlert(<AlertContent>Mã OTP khôi phục mật khẩu đã gửi qua email.</AlertContent>);
      }
    } catch (err: any) {
      addAlert(<AlertContent>{err.userMessage || 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.'}</AlertContent>);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Forgot Password: Step 2 (Confirm details & reset)
  const handleConfirmForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const tempErrors: typeof errors = {};
    if (forgotOtpVal.length < 6) {
      tempErrors.otp = 'Vui lòng nhập đủ 6 chữ số mã OTP';
    }
    if (forgotPasswordVal.length < 6) {
      tempErrors.password = 'Mật khẩu mới phải có tối thiểu 6 ký tự';
    }
    if (forgotPasswordVal !== forgotConfirmPasswordVal) {
      tempErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) return;

    if (!forgotOtpId) return;

    setForgotPasswordLoading(true);
    try {
      await confirmForgotPassword({
        otp_id: forgotOtpId,
        otp: forgotOtpVal,
        password: forgotPasswordVal,
        password_confirmation: forgotConfirmPasswordVal,
      });

      addAlert(<AlertContent>Đặt lại mật khẩu thành công! Vui lòng đăng nhập.</AlertContent>);
      handleTabChange('login');
    } catch (err: any) {
      addAlert(<AlertContent>{err.userMessage || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại OTP.'}</AlertContent>);
    } finally {
      setForgotPasswordLoading(false);
    }
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
            : activeTab === 'register'
            ? 'Đăng ký ví điện tử Tingting bảo mật và tiện lợi'
            : 'Khôi phục mật khẩu ví điện tử Tingting'}
        </Subtitle>
      </DialogHeader>

      {activeTab !== 'forgot_password' ? (
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
      ) : (
        <BackToLoginRow onClick={() => handleTabChange('login')}>
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </BackToLoginRow>
      )}

      {/* LOGIN TAB */}
      {activeTab === 'login' && (
        <Form onSubmit={handleLoginSubmit}>
          <Input
            id="auth-email"
            type="email"
            label="Email đăng nhập"
            placeholder="email@example.com"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            leftIcon={<Mail />}
            error={errors.email}
            disabled={loginLoading}
          />

          <Input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            leftIcon={<Lock />}
            rightIcon={
              <IconButton onClick={() => setShowPassword(!showPassword)} type="button">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </IconButton>
            }
            error={errors.password}
            disabled={loginLoading}
          />

          <ForgotPasswordLink type="button" onClick={() => handleTabChange('forgot_password')}>
            Quên mật khẩu?
          </ForgotPasswordLink>

          <SubmitButton 
            variant="primary" 
            type="submit" 
            isLoading={loginLoading}
          >
            Đăng nhập ngay
          </SubmitButton>
        </Form>
      )}

      {/* REGISTER TAB */}
      {activeTab === 'register' && (
        <div>
          {/* Step 1: Input Email */}
          {signupState.step === 1 && (
            <Form onSubmit={handleStep1Submit}>
              <Input
                id="signup-email"
                type="email"
                label="Nhập Email đăng ký"
                placeholder="email@example.com"
                value={signupState.email}
                onChange={(e) => signupState.setEmail(e.target.value)}
                leftIcon={<Mail />}
                error={errors.email}
                disabled={signupState.isLoading}
              />
              <SubmitButton 
                variant="primary" 
                type="submit" 
                isLoading={signupState.isLoading}
              >
                Nhận mã OTP
              </SubmitButton>
            </Form>
          )}

          {/* Step 2: Input OTP */}
          {signupState.step === 2 && (
            <Form onSubmit={handleStep2Submit}>
              <OtpSection>
                <OtpLabel>Xác thực mã OTP</OtpLabel>
                <OtpSubtext>Mã xác thực gồm 6 chữ số đã được gửi đến email: <strong>{signupState.email}</strong></OtpSubtext>
                <OtpWrapper>
                  <PinInput
                    length={6}
                    value={otpVal}
                    onChange={(val) => setOtpVal(val)}
                    mask={false}
                  />
                </OtpWrapper>
                {errors.otp && <OtpError>{errors.otp}</OtpError>}
              </OtpSection>
              <SubmitButton 
                variant="primary" 
                type="submit"
                disabled={otpVal.length < 6}
              >
                Xác nhận OTP
              </SubmitButton>
              <BackButton 
                variant="ghost" 
                type="button"
                onClick={() => signupState.setStep(1)}
              >
                Quay lại nhập Email
              </BackButton>
            </Form>
          )}

          {/* Step 3: Verify OTP Loading */}
          {signupState.step === 3 && (
            <VerifyingState>
              <VerifyingIconWrapper>
                <KeyRound size={28} />
              </VerifyingIconWrapper>
              <h4>Đang xác thực OTP</h4>
              <p>Hệ thống đang kiểm tra mã xác thực của bạn...</p>
            </VerifyingState>
          )}

          {/* Step 4: Confirm Signup */}
          {signupState.step === 4 && (
            <Form onSubmit={handleStep4Submit}>
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu của bạn"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                leftIcon={<Lock />}
                rightIcon={
                  <IconButton onClick={() => setShowPassword(!showPassword)} type="button">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                }
                error={errors.password}
                disabled={signupState.isLoading}
              />

              <Input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu mới"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                leftIcon={<Lock />}
                error={errors.confirmPassword}
                disabled={signupState.isLoading}
              />

              <SubmitButton 
                variant="primary" 
                type="submit" 
                isLoading={signupState.isLoading}
              >
                Hoàn tất đăng ký
              </SubmitButton>
            </Form>
          )}
        </div>
      )}

      {/* FORGOT PASSWORD TAB */}
      {activeTab === 'forgot_password' && (
        <div>
          {/* Step 1: Input Email */}
          {forgotStep === 1 && (
            <Form onSubmit={handleForgotPasswordSubmit}>
              <Input
                id="forgot-email"
                type="email"
                label="Nhập Email để lấy lại mật khẩu"
                placeholder="email@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                leftIcon={<Mail />}
                error={errors.email}
                disabled={forgotLoading}
              />
              <SubmitButton 
                variant="primary" 
                type="submit" 
                isLoading={forgotLoading}
              >
                Gửi mã OTP qua Email
              </SubmitButton>
            </Form>
          )}

          {/* Step 2: Input OTP & New Password */}
          {forgotStep === 2 && (
            <Form onSubmit={handleConfirmForgotPasswordSubmit}>
              <OtpSection>
                <OtpLabel>Xác thực mã OTP khôi phục</OtpLabel>
                <OtpSubtext>Mã OTP đã gửi đến email: <strong>{forgotEmail}</strong></OtpSubtext>
                <OtpWrapper>
                  <PinInput
                    length={6}
                    value={forgotOtpVal}
                    onChange={(val) => setForgotPasswordOtpVal(val)}
                    mask={false}
                  />
                </OtpWrapper>
                {errors.otp && <OtpError>{errors.otp}</OtpError>}
              </OtpSection>

              <Input
                id="forgot-new-password"
                type={showPassword ? 'text' : 'password'}
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu mới"
                value={forgotPasswordVal}
                onChange={(e) => setForgotPasswordVal(e.target.value)}
                leftIcon={<Lock />}
                rightIcon={
                  <IconButton onClick={() => setShowPassword(!showPassword)} type="button">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                }
                error={errors.password}
                disabled={forgotLoading}
              />

              <Input
                id="forgot-confirm-new-password"
                type={showPassword ? 'text' : 'password'}
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới"
                value={forgotConfirmPasswordVal}
                onChange={(e) => setForgotPasswordConfirmPasswordVal(e.target.value)}
                leftIcon={<Lock />}
                error={errors.confirmPassword}
                disabled={forgotLoading}
              />

              <SubmitButton 
                variant="primary" 
                type="submit" 
                isLoading={forgotLoading}
              >
                Đồng ý thay đổi
              </SubmitButton>
              <BackButton 
                variant="ghost" 
                type="button"
                onClick={() => setForgotPasswordStep(1)}
              >
                Quay lại nhập Email
              </BackButton>
            </Form>
          )}
        </div>
      )}
    </AppDialog>
  );
}

// Styled Components
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

const ForgotPasswordLink = styled.button`
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: var(--font-xs);
  font-weight: var(--font-weight-medium);
  text-align: right;
  cursor: pointer;
  align-self: flex-end;
  padding: 0;
  margin-top: -4px;

  &:hover {
    text-decoration: underline;
  }
`;

const BackToLoginRow = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: var(--font-sm);
  font-family: var(--font-family);
  cursor: pointer;
  padding: var(--space-2) 0;
  margin-bottom: var(--space-4);
  align-self: flex-start;

  &:hover {
    color: var(--primary);
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

const BackButton = styled(Button)`
  width: 100%;
  margin-top: var(--space-1);
`;

const OtpSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border: 1px dashed var(--border);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background-color: var(--surface-secondary);
`;

const OtpLabel = styled.label`
  font-size: var(--font-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
`;

const OtpSubtext = styled.span`
  font-size: 11px;
  color: var(--text-muted);
  
  strong {
    color: var(--text-primary);
  }
`;

const OtpWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: var(--space-2);
`;

const OtpError = styled.span`
  font-size: var(--font-xs);
  color: var(--danger);
  font-weight: var(--font-weight-medium);
  text-align: center;
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
  font-weight: var(--font-weight-medium);
`;
