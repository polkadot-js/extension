// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme } from '@subwallet/extension-koni-ui/components';
import React from 'react';
import styled from 'styled-components';

interface Props {
  className?: string;
  title?: string;
}

function _Welcome ({ className, title = 'content' }: Props): React.ReactElement<Props> {
  return (
    <>
      <div className={className}>
        <div className='content'>
          {title}
        </div>
      </div>
    </>
  );
}

export const Welcome = styled(_Welcome)<Props>(({ theme }) => {
  const { token } = theme as Theme;

  return ({
    background: token.colorPrimary,
    paddingTop: 100,
    paddingRight: 50,
    paddingBottom: 100,
    paddingLeft: 50,

    '.content': {
      fontSize: 20,
      color: token.colorSecondary
    }
  });
});
