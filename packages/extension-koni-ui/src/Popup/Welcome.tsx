// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeTypes } from '@subwallet/extension-base/background/KoniTypes';
import { updateTheme } from '@subwallet/extension-koni-ui/stores/updater';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { Button } from '@subwallet/react-ui';
import React from 'react';
import styled from 'styled-components';

interface Props {
  className?: string;
  title?: string;
}

function _Welcome ({ className, title = 'content' }: Props): React.ReactElement<Props> {
  const changeTheme = (theme: ThemeTypes) => {
    return () => {
      updateTheme(theme);
    };
  };

  return (
    <>
      <div className={className}>
        <div className='content'>
          {title}

          <Button onClick={changeTheme(ThemeTypes.DARK)} block>Theme Dark</Button>
          <Button onClick={changeTheme(ThemeTypes.LIGHT)} block>Theme Light</Button>
        </div>
      </div>
    </>
  );
}

export const Welcome = styled(_Welcome)<Props>(({ theme }) => {
  const { token } = theme as Theme;

  return ({
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
