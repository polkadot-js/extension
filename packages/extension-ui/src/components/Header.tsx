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

interface Props {
  children?: React.ReactNode;
  className?: string;
  showSettings?: boolean;
}

function Header ({ children, className, showSettings }: Props): React.ReactElement<Props> {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsRef = useRef(null);
  useOutsideClick(actionsRef, () => (showActionsMenu && setShowActionsMenu(!showActionsMenu)));

  return (
    <div className={className}>
      <Container>
        {showSettings && <Space />}
        <Branding>
          <Logo src={logo} />
          <LogoText>{'polkadot{.js}'}</LogoText>
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

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    border-bottom: 1px solid ${({ theme }): string => theme.inputBorderColor};
`;

const Branding = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }): string => theme.labelColor};
  font-family: ${({ theme }): string => theme.fontFamily};
  text-align: center;
  width: 100%;
`;

const Space = styled.div`
  width: 22px;
  margin-left: 24px;
`;

const Logo = styled.img`
  height: 28px;
  width: 28px;
  margin: 12px 12px 12px 0;
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
  box-sizing: border-box;
  font-weight: normal;
  margin: 0 -24px;
  padding: 0 24px 0.75rem 24px;
  position: relative;
`;
