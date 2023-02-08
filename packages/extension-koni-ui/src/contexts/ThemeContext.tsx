// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import applyPreloadStyle from '@subwallet/extension-koni-ui/preloadStyle';
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

  applyPreloadStyle(extendToken.bodyBackgroundColor);

  return ({
    body: {
      fontFamily: token.fontFamily,
      color: token.colorText
    },

    html: {
      scrollbarWidth: 'none',

      '&::-webkit-scrollbar': {
        display: 'none'
      }
    },

    '.page': {
      position: 'absolute',
      left: 0,
      right: 0
    },

    '.page-enter': {
      opacity: 0
    },

    '.page-enter-active': {
      opacity: 1,
      transition: 'opacity 300ms, transform 300ms'
    },

    '.page-exit': {
      opacity: 1
    },

    '.page-exit-active': {
      opacity: 0,
      display: 'none',
      transition: 'opacity 0ms, transform 300ms'
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
