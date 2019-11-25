// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';
import styled from 'styled-components';
import addAccountImage from '../assets/addAccount.png';
import { ActionContext } from '@polkadot/extension-ui/components/contexts';

interface Props {
  className?: string;
}

function AddAccount ({ className }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);

  return (
    <div className={className}>
      <Image src={addAccountImage} alt="add account" onClick={(): void => onAction('/account/create')}/>
      <div>
        <h3>Add Account</h3>
        <TipText>You currently don&apos;t have any accounts. Either create a new account or if you have an existing account you wish to use, import it with the seed phrase.</TipText>
      </div>
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
  color: ${({ theme }): string => theme.textColor};
  height: 100%;

  h3 {
    color: ${({ theme }): string => theme.textColor};
    font-weight: normal;
    text-align: center;
  }
`;
