// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps as Props } from '../types';

import React, { useContext, useState } from 'react';

import { ActionContext } from '../components';
import { Button, Box, VerticalSpace, Checkbox, Text, Header, Icon } from '../ui';
import { SvgBull }  from '../assets/images/Bull';

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
      <Header>
      <Icon Asset={SvgBull} width={328} height={140} />
      </Header>
      <Box mt="m">
      <Box><Text>A couple of things to note before we begin:</Text></Box>
      <Box m="s">
        <Box>
          <li><Text>We do not collect keys and passwords in our servers.</Text></li>
          <li><Text>This wallet does not use any trackers or analytics; however, some applications you connect the wallet to may use trackers or analytics.</Text></li>
          <li><Text>Please read our <a rel="noopener noreferrer" target="_blank" href="https://polymath.network/polymesh-aldebaran-testnet/privacy-policy">Privacy Policy</a> to see what information we do collect and how it is processed.</Text></li>
        </Box>
      </Box>
      <Box m="s">
      <Checkbox checked={isPPChecked} onClick={() => setIsPPChecked(!isPPChecked)}
        label={<Text fontSize="0">
          I have read and accept the Polymath <a rel="noopener noreferrer" target="_blank" href="https://polymath.network/polymesh-aldebaran-testnet/privacy-policy">Privacy Policy</a>
        </Text>}
      />
      <Checkbox checked={isTSChecked} onClick={() => setIsTSChecked(!isTSChecked)}
        label={<Text fontSize="0">
          I have read and accept the Polymath <a rel="noopener noreferrer" target="_blank" href="https://polymath.network/polymesh-aldebaran-testnet/wallet-terms">Terms of Service</a>
        </Text>}
      />
      </Box>
      </Box>
      <Box mb="m" mt="l">
        <Button onClick={_onClick} fluid disabled={!isPPChecked || !isTSChecked}>Continue</Button>
      </Box>
    </>
  );
}
