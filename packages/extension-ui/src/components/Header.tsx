// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, {useRef, useState, useEffect} from 'react';
import styled from 'styled-components';
import logo from '../assets/pjs.svg';
import gear from '../assets/gear.svg';
import settings from '@polkadot/ui-settings';
import {useOutsideClick} from '../hooks';
import Dropdown from './Dropdown';

import Svg from '@polkadot/extension-ui/components/Svg';
import Menu from '@polkadot/extension-ui/components/Menu';
import Checkbox from '@polkadot/extension-ui/components/Checkbox';
import {setSS58Format} from '@polkadot/util-crypto';
import {Title} from '.';

interface Option {
  text: string;
  value: string;
}

interface Props {
  children?: React.ReactNode;
  className?: string;
  showSettings?: boolean;
}

const prefixOptions = settings.availablePrefixes.map(({text, value}): Option => ({
  text: value === -1
    ? 'Default'
    : text,
  value: `${value}`
}));

function Header({children, className, showSettings}: Props): React.ReactElement<Props> {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsRef = useRef(null);
  useOutsideClick(actionsRef, () => (showActionsMenu && setShowActionsMenu(!showActionsMenu)));

  const [camera, setCamera] = useState(settings.camera === 'on');
  const [prefix, setPrefix] = useState(`${settings.prefix}`);

  useEffect(() => {
    if(camera){
      settings.set({camera: 'on'});
    } else {
      settings.set({camera: 'off'});
    }
  }, [camera])

  // FIXME check against index, we need a better solution
  const _onChangePrefix = (value: string): void => {
    const prefix = parseInt(value, 10);

    setSS58Format(prefix === -1 ? 42 : prefix);
    setPrefix(value);

    settings.set({prefix});
    location.reload();
  };

  return (
    <h2 className={className}>
      <Container>
        {showSettings && <Space />}
        <Branding>
          <Logo src={logo} />
          <LogoText>polkadot</LogoText>
        </Branding>
        {showSettings &&
          <Settings onClick={(): void => setShowActionsMenu(!showActionsMenu)}>
            {showActionsMenu ? <ActiveGear /> : <Gear />}
          </Settings>
        }
        {showActionsMenu &&
        <div ref={actionsRef}>

        <MenuSettings>
          <Title>External QR accounts and Access</Title>
          <CheckboxSettings checked={camera} onChange={setCamera} label='Allow Camera Access'/>
          <Title>Display address format For:</Title>
          <DropdownSettings
            label=''
            onChange={_onChangePrefix}
            options={prefixOptions}
            value={`${prefix}`}
            />
        </MenuSettings>
            </div>}
        {children}
      </Container>
    </h2>
  );
}

const DropdownSettings = styled(Dropdown)`
  background: #000;

`;

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    border-bottom: 1px solid ${({theme}): string => theme.inputBorderColor};
`;

const Branding = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({theme}): string => theme.labelColor};
  font-family: ${({theme}): string => theme.fontFamily};
  text-align: center;
  width: 100%;
`;

const Space = styled.div`
  width: 21px;
  margin-left: 1rem;
`;

const Logo = styled.img`
  height: 28px;
  width: 28px;
  margin: 12px;
`;

const Gear = styled(Svg).attrs(() => ({
  src: gear
}))`
  height: 18px;
  width: 18px;
  margin-right: 1rem;
  align-self: center;
  background: ${({theme}): string => theme.iconNeutralColor};
`;

Gear.displayName = 'Gear';

const ActiveGear = styled(Gear)`
  background: ${({theme}): string => theme.primaryColor};
`;

ActiveGear.displayName = 'ActiveGear';

const LogoText = styled.span`
  color: ${({theme}): string => theme.textColor};
  font-family: ${({theme}): string => theme.fontFamily};
`;

const Settings = styled.div`
  align-self: center;
  &:hover {
    cursor: pointer;
    background: ${({theme}): string => theme.readonlyInputBackground};
  }
`;

const MenuSettings = styled(Menu)`
  margin-top: 56px;
  right: 20px;
  padding-right: 0 16px;
`;

Settings.displayName = 'Settings';

const CheckboxSettings = styled(Checkbox)`
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: ${({theme}): string => theme.textColor};
`;

export default styled(Header)`
  box-sizing: border-box;
  font-weight: normal;
  margin: 0 -1rem;
  padding: 0 1rem 0.75rem 1rem;
  position: relative;
`;
