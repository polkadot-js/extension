// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import { Theme } from './themes';
import addAccountImage from '../assets/addAccount.png';

interface Props {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  type?: keyof Theme['box'];
  to?: string;
  onClick?: () => void;
  imageVisible?: boolean;
}

function AddAccount ({ children, className, header, to, onClick, imageVisible }: Props): React.ReactElement<Props> {
  const _onClick = (): void => {
    onClick && onClick();

    if (to) {
      window.location.hash = to;
    }
  };

  return (
    <div>
      {imageVisible && <Image src={addAccountImage} alt="add account" onClick={_onClick}/>}
      <article className={className}>
        {header && <h3>{header}</h3>}
        <TipText>{children}</TipText>
      </article>
    </div>
  );
}

const TipText = styled.p`
  text-align: center;
  font-size: 16px;
  line-height: 26px;
  margin: 0 30px;
`;

const Image = styled.img`
  display: flex;
  justify-content: center;
  width: 185px;
  height: 185px;
  margin: 30px auto;
`;

export default styled(AddAccount)`
  color: ${({ theme }): string => theme.color};

  h3 {
    color: ${({ theme }): string => theme.color};
    font-weight: normal;
    text-align: center;
  }
`;
