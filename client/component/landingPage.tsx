'use client';

import styled from 'styled-components';
import { 
  Wallet, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle, 
  Lock, 
  Smartphone, 
  CreditCard 
} from 'lucide-react';
import Button from '@/component/atomic/button';
import Card from '@/component/atomic/card';
import Badge from '@/component/atomic/badge';

type LandingPageProps = {
  onOpenLogin: () => void;
};

export default function LandingPage({ onOpenLogin }: LandingPageProps) {
  return (
    <Wrapper>
      {/* Navigation Header */}
      <Header>
        <NavContainer>
          <LogoArea>
            <LogoIcon />
            <LogoText>Tingting</LogoText>
          </LogoArea>
          
          <NavMenu>
            <NavLink href="#features">Tính năng</NavLink>
            <NavLink href="#security">Bảo mật</NavLink>
            <NavLink href="#faq">Hỗ trợ</NavLink>
          </NavMenu>

          <AuthButtons>
            <Button variant="ghost" onClick={onOpenLogin}>Đăng nhập</Button>
            <Button variant="primary" onClick={onOpenLogin} size="sm">Bắt đầu ngay</Button>
          </AuthButtons>
        </NavContainer>
      </Header>

      {/* Hero Section */}
      <HeroSection>
        <HeroGrid>
          <HeroInfo>
            <Badge variant="info">Phiên bản mới 2.0</Badge>
            <HeroTitle>Thanh toán thông minh.<br />Tiết kiệm thời gian.</HeroTitle>
            <HeroDesc>
              Ví điện tử Tingting mang đến trải nghiệm thanh toán không tiền mặt bảo mật tuyệt đối, tốc độ chuyển khoản tức thì và hoàn toàn miễn phí dịch vụ.
            </HeroDesc>
            <HeroCTA>
              <Button variant="primary" size="lg" rightIcon={<ArrowRight />} onClick={onOpenLogin}>
                Mở ví miễn phí
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => {
                  const element = document.getElementById('features');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Tìm hiểu thêm
              </Button>
            </HeroCTA>
          </HeroInfo>

          <HeroVisual>
            <InteractiveCard>
              <CardGlow />
              <CardContent>
                <CardTop>
                  <CardTitle>Tingting Card</CardTitle>
                  <Wallet size={24} color="white" />
                </CardTop>
                <CardChip />
                <CardNumber>•••• •••• •••• 8888</CardNumber>
                <CardBottom>
                  <div>
                    <CardLabel>Chủ ví</CardLabel>
                    <CardValue>NGUYEN VAN A</CardValue>
                  </div>
                  <div>
                    <CardLabel>Số dư khả dụng</CardLabel>
                    <CardValue>★★★★★★★★</CardValue>
                  </div>
                </CardBottom>
              </CardContent>
            </InteractiveCard>
          </HeroVisual>
        </HeroGrid>
      </HeroSection>

      {/* Features Section */}
      <FeaturesSection id="features">
        <SectionHeader>
          <SectionTitle>Trải nghiệm dịch vụ ví hiện đại</SectionTitle>
          <SectionDesc>
            Tingting cung cấp đầy đủ các tiện ích tài chính hàng ngày của bạn trong một ứng dụng duy nhất.
          </SectionDesc>
        </SectionHeader>

        <FeaturesGrid>
          <Card variant="default">
            <FeatureIconWrapper $color="var(--primary)">
              <Zap size={24} />
            </FeatureIconWrapper>
            <FeatureTitle>Chuyển khoản tức thì</FeatureTitle>
            <FeatureDesc>
              Gửi và nhận tiền chỉ trong 2 giây, hoạt động 24/7 kể cả ngày lễ và cuối tuần với phí 0đ.
            </FeatureDesc>
          </Card>

          <Card variant="default">
            <FeatureIconWrapper $color="var(--success)">
              <ShieldCheck size={24} />
            </FeatureIconWrapper>
            <FeatureTitle>Bảo mật đa tầng</FeatureTitle>
            <FeatureDesc>
              Mã hóa dữ liệu đầu cuối, xác thực sinh trắc học và mã PIN giao dịch bảo vệ tuyệt đối số tiền của bạn.
            </FeatureDesc>
          </Card>

          <Card variant="default">
            <FeatureIconWrapper $color="var(--warning)">
              <TrendingUp size={24} />
            </FeatureIconWrapper>
            <FeatureTitle>Tích lũy & hoàn tiền</FeatureTitle>
            <FeatureDesc>
              Tự động hoàn tiền lên tới 5% cho mỗi giao dịch thanh toán hóa đơn hoặc dịch vụ ăn uống.
            </FeatureDesc>
          </Card>

          <Card variant="default">
            <FeatureIconWrapper $color="#8b5cf6">
              <CreditCard size={24} />
            </FeatureIconWrapper>
            <FeatureTitle>Thanh toán hóa đơn</FeatureTitle>
            <FeatureDesc>
              Điện, nước, internet, truyền hình cáp hay học phí đều được nhắc nhở và thanh toán tự động tiện lợi.
            </FeatureDesc>
          </Card>
        </FeaturesGrid>
      </FeaturesSection>

      {/* Security Focus Section */}
      <SecuritySection id="security">
        <SecurityGrid>
          <SecurityVisual>
            <ShieldContainer>
              <PulseRing $delay="0s" />
              <PulseRing $delay="1s" />
              <PulseRing $delay="2s" />
              <ShieldIconWrapper>
                <Lock size={48} color="white" />
              </ShieldIconWrapper>
            </ShieldContainer>
          </SecurityVisual>

          <SecurityInfo>
            <SectionBadge>Bảo mật tối tân</SectionBadge>
            <SecurityTitle>Tiền của bạn luôn được bảo vệ nghiêm ngặt</SecurityTitle>
            <SecurityDesc>
              Chúng tôi hiểu rằng an toàn tài chính là ưu tiên số một. Hệ thống bảo mật của Tingting được xây dựng theo tiêu chuẩn quốc tế:
            </SecurityDesc>
            
            <SecurityList>
              <SecurityListItem>
                <CheckCircle size={20} color="var(--success)" />
                <div>
                  <strong>Mã PIN giao dịch 6 chữ số:</strong> Mỗi giao dịch phát sinh đều cần nhập mã PIN bảo mật cá nhân của riêng bạn.
                </div>
              </SecurityListItem>
              <SecurityListItem>
                <CheckCircle size={20} color="var(--success)" />
                <div>
                  <strong>Chứng chỉ bảo mật SSL/TLS:</strong> Mã hóa đường truyền dữ liệu giao dịch giữa thiết bị của bạn và hệ thống máy chủ ví.
                </div>
              </SecurityListItem>
              <SecurityListItem>
                <CheckCircle size={20} color="var(--success)" />
                <div>
                  <strong>Thông báo biến động tức thì:</strong> Nhận cảnh báo thông qua hệ thống Alert ngay khi số dư ví thay đổi.
                </div>
              </SecurityListItem>
            </SecurityList>
          </SecurityInfo>
        </SecurityGrid>
      </SecuritySection>

      {/* App Stats & Trust */}
      <StatsSection>
        <StatsGrid>
          <StatBox>
            <StatNum>10M+</StatNum>
            <StatLabel>Người dùng tin cậy</StatLabel>
          </StatBox>
          <StatBox>
            <StatNum>99.99%</StatNum>
            <StatLabel>Thời gian hoạt động</StatLabel>
          </StatBox>
          <StatBox>
            <StatNum>24/7</StatNum>
            <StatLabel>Hỗ trợ tận tình</StatLabel>
          </StatBox>
        </StatsGrid>
      </StatsSection>

      {/* CTA Section */}
      <CTASection>
        <CTAContainer>
          <CTATitle>Bắt đầu cuộc sống không tiền mặt ngay hôm nay</CTATitle>
          <CTADesc>Đăng ký tài khoản trong 1 phút và nhận ngay những ưu đãi chuyển khoản không giới hạn.</CTADesc>
          <Button variant="primary" size="lg" onClick={onOpenLogin}>
            Bắt đầu trải nghiệm ngay
          </Button>
        </CTAContainer>
      </CTASection>

      {/* Footer */}
      <Footer>
        <FooterContainer>
          <LogoArea>
            <LogoIcon />
            <LogoText>Tingting</LogoText>
          </LogoArea>
          <FooterCopyright>
            © {new Date().getFullYear()} Tingting Corporation. Bảo lưu mọi quyền.
          </FooterCopyright>
        </FooterContainer>
      </Footer>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--background);
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  
  @media (prefers-color-scheme: dark) {
    background-color: rgba(15, 23, 42, 0.8);
  }
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
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
    border: 2px.5 solid white;
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

const NavMenu = styled.nav`
  display: flex;
  gap: var(--space-5);

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: var(--text-secondary);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--primary);
  }
`;

const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const HeroSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) calc(var(--space-8) * 1.5) var(--space-6);
  width: 100%;
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  gap: var(--space-8);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const HeroInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: flex-start;

  @media (max-width: 900px) {
    align-items: center;
  }
`;

const HeroTitle = styled.h1`
  font-size: 42px;
  line-height: 1.15;
  color: var(--text-primary);
  letter-spacing: -1.5px;
  margin: 0;

  @media (max-width: 600px) {
    font-size: var(--font-2xl);
  }
`;

const HeroDesc = styled.p`
  font-size: var(--font-lg);
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
  max-width: 540px;
`;

const HeroCTA = styled.div`
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);

  @media (max-width: 600px) {
    flex-direction: column;
    width: 100%;
    
    button, a {
      width: 100%;
    }
  }
`;

const HeroVisual = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const InteractiveCard = styled.div`
  width: 340px;
  height: 200px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%);
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(30, 58, 138, 0.3);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;

  &:hover {
    transform: translateY(-8px) rotate(1deg);
  }
`;

const CardGlow = styled.div`
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%);
  pointer-events: none;
`;

const CardContent = styled.div`
  padding: var(--space-5);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardTitle = styled.span`
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 1px;
  opacity: 0.8;
  text-transform: uppercase;
`;

const CardChip = styled.div`
  width: 40px;
  height: 30px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: var(--radius-sm);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
`;

const CardNumber = styled.div`
  font-size: var(--font-lg);
  letter-spacing: 2px;
  font-family: monospace;
`;

const CardBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const CardLabel = styled.div`
  font-size: 9px;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: 2px;
`;

const CardValue = styled.div`
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.5px;
`;

const FeaturesSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
  width: 100%;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: var(--space-8);
`;

const SectionTitle = styled.h2`
  font-size: var(--font-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-3) 0;
`;

const SectionDesc = styled.p`
  font-size: var(--font-md);
  color: var(--text-secondary);
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-6);
`;

const FeatureIconWrapper = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: ${({ $color }) => $color}15;
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
`;

const FeatureTitle = styled.h3`
  font-size: var(--font-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
`;

const FeatureDesc = styled.p`
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
`;

const SecuritySection = styled.section`
  background-color: var(--surface-secondary);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: var(--space-8) var(--space-6);
  width: 100%;
`;

const SecurityGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  align-items: center;
  gap: var(--space-8);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const SecurityVisual = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ShieldContainer = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ShieldIconWrapper = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--success) 0%, #22c55e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 10px 25px rgba(22, 163, 74, 0.3);
`;

const PulseRing = styled.div<{ $delay: string }>`
  position: absolute;
  width: 100%;
  height: 100%;
  border: 1px solid var(--success);
  border-radius: 50%;
  animation: pulse 3s linear infinite;
  animation-delay: ${({ $delay }) => $delay};
  opacity: 0;
  z-index: 1;

  @keyframes pulse {
    0% {
      transform: scale(0.5);
      opacity: 0.5;
    }
    100% {
      transform: scale(1.1);
      opacity: 0;
    }
  }
`;

const SecurityInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const SectionBadge = styled.span`
  color: var(--success);
  font-size: var(--font-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const SecurityTitle = styled.h2`
  font-size: var(--font-xl);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.25;
`;

const SecurityDesc = styled.p`
  font-size: var(--font-md);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
`;

const SecurityList = styled.ul`
  list-style: none;
  padding: 0;
  margin: var(--space-2) 0 0 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const SecurityListItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  strong {
    color: var(--text-primary);
  }

  div {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    line-height: 1.5;
  }
`;

const StatsSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
  width: 100%;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
  text-align: center;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const StatBox = styled.div`
  padding: var(--space-4) 0;
`;

const StatNum = styled.div`
  font-size: 40px;
  font-weight: var(--font-weight-bold);
  color: var(--primary);
  line-height: 1;
  margin-bottom: var(--space-2);
`;

const StatLabel = styled.div`
  font-size: var(--font-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
`;

const CTASection = styled.section`
  background: linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%);
  color: white;
  padding: calc(var(--space-8) * 1.5) var(--space-6);
  text-align: center;
  width: 100%;
`;

const CTAContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);

  p {
    color: rgba(255, 255, 255, 0.8);
  }
`;

const CTATitle = styled.h2`
  font-size: var(--font-xl);
  color: white;
  margin: 0;
  line-height: 1.25;
`;

const CTADesc = styled.p`
  font-size: var(--font-md);
  margin: 0 var(--space-4);
`;

const Footer = styled.footer`
  border-top: 1px solid var(--border);
  background-color: var(--background);
  padding: var(--space-6) var(--space-6);
  width: 100%;
`;

const FooterContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
  }
`;

const FooterCopyright = styled.span`
  font-size: var(--font-xs);
  color: var(--text-muted);
`;
