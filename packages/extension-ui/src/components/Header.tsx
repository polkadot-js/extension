// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import logo from '../assets/pjs.svg';
import gear from '../assets/gear.svg';
import { Link } from '.';

interface Props {
  children?: React.ReactNode;
  className?: string;
  showSettings?: boolean;
}

function Header ({ children, className, showSettings }: Props): React.ReactElement<Props> {
  return (
    <h2 className={className}>
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
    </h2>
  );
}

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    border-bottom: 1px solid ${({ theme }): string => theme.inputBorder};
`;

const Branding = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }): string => theme.hdrColor};
  font-family: ${({ theme }): string => theme.fontFamily};
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

const Gear = styled.img`
  height: 18px;
  width: 18px;
  margin-right: 1rem;
  align-self: center;
`;

const LogoText = styled.span`
  color: ${({ theme }): string => theme.color};
  font-family: ${({ theme }): string => theme.fontFamily};
`;

export default styled(Header)`
  background: ${({ theme }): string => theme.hdrBg};
  box-sizing: border-box;
  font-weight: normal;
  margin: 0 -1rem;
  padding: 0 1rem 0.75rem 1rem;
  position: relative;
`;
