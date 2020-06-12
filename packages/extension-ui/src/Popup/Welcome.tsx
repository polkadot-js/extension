// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps as Props } from '../types';

import React, { useContext, useState } from 'react';
import styled from 'styled-components';

import { ActionContext, Box, Button, ButtonArea, List, VerticalSpace, Checkbox } from '../components';
import { Header } from '../partials';

export default function Welcome (): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);

  const [isPPChecked, setIsPPChecked] = useState<boolean>(false);
  const [isTSChecked, setIsTSChecked] = useState<boolean>(false);

  const _onClick = (): void => {
    window.localStorage.setItem('welcome_read', 'ok');
    onAction();
  };

  return (
    <>
      <Header text='Welcome'/>
      <Note>A couple of things to note before we begin:</Note>
      <TextBox>
        <List>
          <li>We do not collect keys and passwords in our servers.</li>
          <li>This wallet does not use any trackers or analytics; however, some applications you connect the wallet to may use trackers or analytics.</li>
          <li>Please read our <a rel="noopener noreferrer" target="_blank" href="https://polymath.network/polymesh-aldebaran-testnet/privacy-policy">Privacy Policy</a></li> to see what information we do collect and how it is processed.
        </List>
      </TextBox>
      <List>
        <Checkbox checked={isPPChecked} onClick={() => setIsPPChecked(!isPPChecked)}
          label={<>
            I have read and accept the Polymath <a rel="noopener noreferrer" target="_blank" href="https://polymath.network/polymesh-aldebaran-testnet/privacy-policy">Privacy Policy</a>
          </>}
        />
        <Checkbox checked={isTSChecked} onClick={() => setIsTSChecked(!isTSChecked)}
          label={<>
            I have read and accept the Polymath <a rel="noopener noreferrer" target="_blank" href="https://polymath.network/polymesh-aldebaran-testnet/wallet-terms">Terms of Service</a>
          </>}
        />
      </List>
      <VerticalSpace />
      <ButtonArea>
        <Button onClick={_onClick} isDisabled={!isPPChecked || !isTSChecked}>Continue</Button>
      </ButtonArea>
    </>
  );
}

const Note = styled.p`
  margin-bottom: 6px;
  margin-top: 0;
  color: ${({ theme }: Props): string => theme.subTextColor};
`;

const TextBox = styled(Box)`
  margin: 0.75rem 24px;
  border: 1px solid ${({ theme }: Props): string => theme.inputBorderColor};
  color: ${({ theme }: Props): string => theme.subTextColor};
`;
