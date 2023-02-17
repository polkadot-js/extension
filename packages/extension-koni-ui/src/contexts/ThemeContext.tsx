// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import applyPreloadStyle from '@subwallet/extension-koni-ui/preloadStyle';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { generateTheme, SW_THEME_CONFIGS, SwThemeConfig } from '@subwallet/extension-koni-ui/themes';
import { ConfigProvider, theme as reactUiTheme } from '@subwallet/react-ui';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createGlobalStyle, ThemeProvider as StyledComponentThemeProvider } from 'styled-components';

import { Theme } from '../types';

interface Props {
  children: React.ReactNode;
  themeConfig: SwThemeConfig
}

const { useToken } = reactUiTheme;

const GlobalStyle = createGlobalStyle<ThemeProps>(({ theme }) => {
  const { extendToken, token } = theme as Theme;

  applyPreloadStyle(extendToken.bodyBackgroundColor);

  return ({
    body: {
      fontFamily: token.fontFamily,
      color: token.colorText,
      fontWeight: token.bodyFontWeight
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
    },

    '.modal-full': {
      height: '100%',

      '.ant-sw-modal-content': {
        borderRadius: 0,
        height: '100%',
        padding: 0
      },

      '.ant-sw-modal-body': {
        borderRadius: 0,
        height: '100%',
        maxHeight: '100%',
        padding: 0,
        margin: 0
      }
    },

    'input, button, select, optgroup, textarea': {
      margin: 0,
      color: 'inherit',
      fontSize: 'inherit',
      fontFamily: 'inherit',
      lineHeight: 'inherit'
    },

    '.text-center': {
      textAlign: 'center'
    },

    '.text-left': {
      textAlign: 'left'
    },

    '.text-right': {
      textAlign: 'right'
    },

    '.text-secondary': {
      color: token.colorTextSecondary
    },

    '.text-tertiary': {
      color: token.colorTextTertiary
    },

    '.squircle-border-bg': {
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgo8bWFzayBpZD0ibWFzazBfODY0XzczMDgyIiBzdHlsZT0ibWFzay10eXBlOmFscGhhIiBtYXNrVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4PSIzMyIgeT0iMzMiIHdpZHRoPSI1NCIgaGVpZ2h0PSI1NCI+CjxwYXRoIGQ9Ik02MCAzMy4zOTk5QzgwLjE3MDUgMzMuMzk5OSA4Ni42IDM5LjgyOTQgODYuNiA1OS45OTk5Qzg2LjYgODAuMTcwNCA4MC4xNzA1IDg2LjU5OTkgNjAgODYuNTk5OUMzOS44Mjk1IDg2LjU5OTkgMzMuNCA4MC4xNzA0IDMzLjQgNTkuOTk5OUMzMy40IDM5LjgyOTQgMzkuODI5NSAzMy4zOTk5IDYwIDMzLjM5OTlaIiBmaWxsPSIjMDA0QkZGIi8+CjwvbWFzaz4KPHBhdGggZD0iTTYwIDE2LjVDNzYuNjU5OCAxNi41IDg3LjQ3OSAxOS4xNjI1IDk0LjE1ODIgMjUuODQxOEMxMDAuODM3IDMyLjUyMSAxMDMuNSA0My4zNDAyIDEwMy41IDYwQzEwMy41IDc2LjY1OTggMTAwLjgzNyA4Ny40NzkgOTQuMTU4MiA5NC4xNTgyQzg3LjQ3OSAxMDAuODM3IDc2LjY1OTggMTAzLjUgNjAgMTAzLjVDNDMuMzQwMiAxMDMuNSAzMi41MjEgMTAwLjgzNyAyNS44NDE4IDk0LjE1ODJDMTkuMTYyNSA4Ny40NzkgMTYuNSA3Ni42NTk4IDE2LjUgNjBDMTYuNSA0My4zNDAyIDE5LjE2MjUgMzIuNTIxIDI1Ljg0MTggMjUuODQxOEMzMi41MjEgMTkuMTYyNSA0My4zNDAyIDE2LjUgNjAgMTYuNVoiIHN0cm9rZT0iIzIxMjEyMSIvPgo8cGF0aCBkPSJNNjAgMC41QzgyLjcyNjEgMC41IDk3LjU0NTMgNC4xMjkzOCAxMDYuNzA4IDEzLjI5MkMxMTUuODcxIDIyLjQ1NDcgMTE5LjUgMzcuMjczOSAxMTkuNSA2MEMxMTkuNSA4Mi43MjYxIDExNS44NzEgOTcuNTQ1MyAxMDYuNzA4IDEwNi43MDhDOTcuNTQ1MyAxMTUuODcxIDgyLjcyNjEgMTE5LjUgNjAgMTE5LjVDMzcuMjczOSAxMTkuNSAyMi40NTQ3IDExNS44NzEgMTMuMjkyIDEwNi43MDhDNC4xMjkzOCA5Ny41NDUzIDAuNSA4Mi43MjYxIDAuNSA2MEMwLjUgMzcuMjczOSA0LjEyOTM4IDIyLjQ1NDcgMTMuMjkyIDEzLjI5MkMyMi40NTQ3IDQuMTI5MzggMzcuMjczOSAwLjUgNjAgMC41WiIgc3Ryb2tlPSIjMjEyMTIxIi8+Cjwvc3ZnPgo=)'
    }
  });
});

function ThemeGenerator ({ children, themeConfig }: Props): React.ReactElement<Props> {
  const { token } = useToken();

  // Generate theme from config
  const theme = useMemo<Theme>(() => {
    return generateTheme(themeConfig, token);
  }, [themeConfig, token]);

  return (
    <StyledComponentThemeProvider theme={theme}>
      <GlobalStyle theme={theme} />
      {children}
    </StyledComponentThemeProvider>
  );
}

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider ({ children }: ThemeProviderProps): React.ReactElement<ThemeProviderProps> {
  const themeName = useSelector((state: RootState) => state.settings.theme);
  const themeConfig = SW_THEME_CONFIGS[themeName];

  return (
    <ConfigProvider theme={themeConfig}>
      <ThemeGenerator themeConfig={themeConfig}>
        {children}
      </ThemeGenerator>
    </ConfigProvider>
  );
}
