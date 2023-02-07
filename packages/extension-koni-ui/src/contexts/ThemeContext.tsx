// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { chooseTheme } from '@subwallet/extension-koni-ui/themes';
import { ConfigProvider, theme as reactUiTheme } from '@subwallet/react-ui';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createGlobalStyle, ThemeProvider as _ThemeProvider } from 'styled-components';

import { Theme } from '../types';

interface Props {
  children: React.ReactNode;
}

const { useToken } = reactUiTheme;

const GlobalStyle = createGlobalStyle<ThemeProps>(({ theme }) => {
  const { extendToken, token } = theme as Theme;

  return ({
    body: {
      backgroundColor: extendToken.bodyBackgroundColor,
      fontFamily: token.fontFamily,
      color: token.colorText
    },

    html: {
      scrollbarWidth: 'none',

      '&::-webkit-scrollbar': {
        display: 'none'
      }
    }
  });
});

function ThemeWrapper ({ children }: Props): React.ReactElement<Props> {
  const themeType = useSelector((state: RootState) => state.settings.theme);
  const { token } = useToken();
  const theme = useMemo<Theme>(() => {
    return chooseTheme(themeType, token);
  }, [themeType, token]);

  return (
    <_ThemeProvider theme={theme}>
      <GlobalStyle theme={theme} />
      <ConfigProvider theme={{ token: theme.token }}>
        {children}
      </ConfigProvider>
    </_ThemeProvider>
  );
}

export function ThemeProvider ({ children }: Props): React.ReactElement<Props> {
  return (
    <ConfigProvider theme={{ algorithm: reactUiTheme.darkAlgorithm }}>
      <ThemeWrapper>
        {children}
      </ThemeWrapper>
    </ConfigProvider>
  );
}
