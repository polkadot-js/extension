import React, { ReactNode } from 'react';
import styled from 'styled-components';

import animDanger from '../../assets/anim_danger.svg';
import animDeclined from '../../assets/anim_declined.svg';
import animDisconnect from '../../assets/anim_disconnect.svg';
import animatedLock from '../../assets/anim_locked.svg';
import animSigned from '../../assets/anim_signed.svg';
import animTrusted from '../../assets/anim_trusted.svg';
import animForget from '../../assets/anim_vanish.svg';
import animWarning from '../../assets/anim_warning.svg';
import azeroLogo from '../../assets/azeroLogo.svg';
import secureImg from '../../assets/secure.svg';

const TYPE_TO_SRC = {
  aleph: azeroLogo,
  danger: animDanger,
  disconnect: animDisconnect,
  failure: animDeclined,
  forget: animForget,
  lock: animatedLock,
  secure: secureImg,
  success: animSigned,
  trust: animTrusted,
  warning: animWarning
};

type IconType = keyof typeof TYPE_TO_SRC;

type Props = {
  className?: string;
  children?: ReactNode;
  headerText: string;
  iconType: IconType;
};

const Hero = ({ children, className, headerText, iconType }: Props) => (
  <Container className={className}>
    <Icon src={TYPE_TO_SRC[iconType]} />
    <HeaderText>{headerText}</HeaderText>
    <DescriptionContainer>{children}</DescriptionContainer>
  </Container>
);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  & > :not(:last-child) {
    margin-bottom: 16px;
  }
`;

const Icon = styled.img`
  width: 96px;
  height: 96px;
`;

const HeaderText = styled.h2`
  margin: 0 24px;

  font-family: ${({ theme }) => theme.secondaryFontFamily};
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 120%;
  letter-spacing: 0.035em;
  text-align: center;

  color: ${({ theme }) => theme.textColor};
`;

const DescriptionContainer = styled.div`
  font-family: ${({ theme }) => theme.primaryFontFamily};
  font-style: normal;
  font-weight: 300;
  font-size: 14px;
  line-height: 145%;
  letter-spacing: 0.07em;
  text-align: center;

  color: ${({ theme }) => theme.textColorSuggestion};
`;

export default Hero;
