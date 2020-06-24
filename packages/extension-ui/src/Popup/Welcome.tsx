// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps as Props } from '../types';

import React, { useContext } from 'react';
import styled from 'styled-components';

import { ActionContext, Box, Button, ButtonArea, List, VerticalSpace } from '../components';
import { Header } from '../partials';

export default function Welcome (): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);

  const _onClick = (): void => {
    window.localStorage.setItem('welcome_read', 'ok');
    onAction();
  };

  return (
    <>
      <Header text='Welcome'/>
      <Note>Before we start, just a couple of notes regarding use:</Note>
      <TextBox>
        <List>
          <li>We do not send any clicks, pageviews or events to a central server</li>
          <li>We do not use any trackers or analytics</li>
          <li>We don&apos;t collect keys, addresses or any information - your information never leaves this machine</li>
        </List>
      </TextBox>
      <Note>... we are not in the information collection business (even anonymized).</Note>
      <VerticalSpace />
      <ButtonArea>
        <Button onClick={_onClick}>Understood, let me continue</Button>
      </ButtonArea>
    </>
  );
}

const Note = styled.p(({ theme }: Props) => `
  color: ${theme.subTextColor};
  margin-bottom: 6px;
  margin-top: 0;
`);

const TextBox = styled(Box)(({ theme }: Props) => `
  border: 1px solid ${theme.inputBorderColor};
  color: ${theme.subTextColor};
  margin: 0.75rem 24px;
`);
