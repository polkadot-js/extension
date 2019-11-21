// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import logo from '../assets/pjs.svg';
import gear from '../assets/gear.svg';
import Link from './Link';
import Svg from './Svg';

interface Props {
  children?: React.ReactNode;
  className?: string;
  showSettings?: boolean;
}

function Header ({ children, className, showSettings }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <Container>
        {showSettings && <Space/>}
        <Branding>
          <Logo src={logo} />
          <LogoText>polkadot</LogoText>
        </Branding>
        {showSettings && <Link to='/settings'>
          <Gear src={gear} />
        </Link>}
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
  margin: 12px;
`;

const Gear = styled(Svg)`
  height: 18px;
  width: 18px;
  margin-right: 24px;
  align-self: center;
`;

const LogoText = styled.span`
  color: ${({ theme }): string => theme.textColor};
  font-family: ${({ theme }): string => theme.fontFamily};
  font-size: 20px;
  line-height: 27px;
`;

export default styled(Header)`
  box-sizing: border-box;
  font-weight: normal;
  margin: 0 -24px;
  padding: 0 24px 0.75rem 24px;
  position: relative;
`;
