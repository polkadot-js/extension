// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';

import { ActionContext, Box, Button, ButtonArea, Header, List, VerticalSpace } from '../components';
import styled from 'styled-components';

const WelcomeLabel = styled.div.attrs(() => ({
  children: 'Welcome'
}))`
  margin: 30px auto 40px auto;
  font-size: 24px;
  line-height: 33px;
`;

const Note = styled.p`
  margin-bottom: 6px;
  margin-top: 0;
`;

type Props = {};

export default function Welcome (): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);

  const _onClick = (): void => {
    window.localStorage.setItem('welcome_read', 'ok');
    onAction();
  };

  return (
    <>
      <Header label='welcome' />
      <WelcomeLabel/>
      <Note>Before we start, just a couple of notes regarding use:</Note>
      <Box>
        <List>
          <li>We do not send any clicks, pageviews or events to a central server</li>
          <li>We do not use any trackers or analytics</li>
          <li>We don&apos;t collect keys, addresses or any information - your information never leaves this machine</li>
        </List>
      </Box>
      <Note>... we are not in the information collection business (even anonymized).</Note>
      <VerticalSpace/>
      <ButtonArea>
        <Button
          label='Understood, let me continue'
          onClick={_onClick}
        />
      </ButtonArea>
    </>
  );
}
