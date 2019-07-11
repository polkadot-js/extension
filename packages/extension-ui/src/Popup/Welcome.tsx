// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { OnActionFromCtx } from '../components/types';

import React from 'react';

import { Box, Button, Header, withOnAction } from '../components';

interface Props {
  onAction: OnActionFromCtx;
}

function Welcome ({ onAction }: Props): JSX.Element {
  const onClick = (): void => {
    window.localStorage.setItem('welcome_read', 'ok');
    onAction();
  };

  return (
    <div>
      <Header label='welcome' />
      <Box>
        Before we start, just a couple of notes regarding use -
        <ul>
          <li>We do not send any clicks, pageviews or events to a central server</li>
          <li>We do not use any trackers or analytics</li>
          <li>We don't collect keys, addresses or any information - your information never leaves this machine</li>
        </ul>
        ... we are not in the information collection business (even anonymized).
        <Button
          label='Understood, let me continue'
          onClick={onClick}
        />
      </Box>
    </div>
  );
}

export default withOnAction(Welcome);
