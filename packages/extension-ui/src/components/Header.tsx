// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import logo from '../assets/pjs.svg';
import gear from '../assets/gear.svg';
import { useOutsideClick } from '../hooks';

import Svg from '@polkadot/extension-ui/components/Svg';
import Settings from './Settings';
import ArrowLeftImage from '../assets/arrowLeft.svg';
import Link from './Link';

interface Props {
  children?: React.ReactNode;
  className?: string;
  showSettings?: boolean;
  text?: string;
  showBackArrow?: boolean;
}

function Header ({ children, className, showSettings, text, showBackArrow }: Props): React.ReactElement<Props> {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsRef = useRef(null);
  useOutsideClick(actionsRef, () => (showActionsMenu && setShowActionsMenu(!showActionsMenu)));

  return (
    <div className={className}>
      <Container>
        <Branding>
          {showBackArrow ? (
            <BackLink to={'/'}>
              <ArrowLeft/>
            </BackLink>
          ) : <Logo src={logo}/>
          }
          <LogoText>{text || 'polkadot{.js}'}</LogoText>
        </Branding>
        {showSettings && (
          <SettingsToggle onClick={(): void => setShowActionsMenu(!showActionsMenu)}>
            <Gear isSelected={showActionsMenu} />
          </SettingsToggle>
        )}
        {showActionsMenu && (
          <Settings reference={actionsRef}/>
        )}
        {children}
      </Container>
    </div>
  );
}

const BackLink = styled(Link)`
  width: min-content;
  text-decoration: underline;
  color: ${({ theme }): string => theme.labelColor};
  min-height: 52px;

  &:visited {
    color: ${({ theme }): string => theme.labelColor};
  }
`;

const ArrowLeft = styled(Svg).attrs(() => ({
  src: ArrowLeftImage
}))`
  width: 12px;
  height: 12px;
  margin-right: 13px;
  background: ${({ theme }): string => theme.labelColor};
`;

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    border-bottom: 1px solid ${({ theme }): string => theme.inputBorderColor};
    min-height: 70px;
`;

const Branding = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }): string => theme.labelColor};
  font-family: ${({ theme }): string => theme.fontFamily};
  text-align: center;
  margin-left: 24px;
`;

const Logo = styled.img`
  height: 28px;
  width: 28px;
  margin: 8px 12px 12px 0;
`;

interface GearProps {
  isSelected: boolean;
}

const Gear = styled(Svg).attrs(() => ({
  src: gear
}))<GearProps>`
  height: 18px;
  width: 18px;
  margin-right: 24px;
  align-self: center;
  background: ${({ theme, isSelected }): string => isSelected ? theme.primaryColor : theme.iconNeutralColor};
`;

Gear.displayName = 'Gear';

const LogoText = styled.span`
  color: ${({ theme }): string => theme.textColor};
  font-family: ${({ theme }): string => theme.fontFamily};
  font-size: 20px;
  line-height: 27px;
`;

const SettingsToggle = styled.div`
  align-self: center;
  &:hover {
    cursor: pointer;
  }
`;

SettingsToggle.displayName = 'SettingsToggle';

export default styled(Header)`
  max-width: 100%;
  box-sizing: border-box;
  font-weight: normal;
  margin: 0;
  position: relative;
  margin-bottom: 25px;

  && {
    padding: 0 0 0;
  }
`;
