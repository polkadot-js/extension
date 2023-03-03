// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import applyPreloadStyle from '@subwallet/extension-koni-ui/preloadStyle';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { generateTheme, SW_THEME_CONFIGS, SwThemeConfig } from '@subwallet/extension-koni-ui/themes';
import { ConfigProvider, theme as reactUiTheme } from '@subwallet/react-ui';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled, { createGlobalStyle, ThemeProvider as StyledComponentThemeProvider } from 'styled-components';

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
    pre: {
      fontFamily: 'inherit',
      whiteSpace: 'pre-wrap'
    },
    '.text-secondary': {
      color: token.colorTextSecondary
    },

    '.text-tertiary': {
      color: token.colorTextTertiary
    },

    '.common-text': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight
    },

    '.text-danger': {
      color: token.colorError
    },

    '.h3-text': {
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      fontWeight: token.headingFontWeight
    },

    '.h4-text': {
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      fontWeight: token.headingFontWeight
    },

    '.h5-text': {
      fontWeight: token.headingFontWeight,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5
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

const getModalContainer = () => document.getElementById('popup-container') || document.body;
const getTooltipContainer = () => document.getElementById('tooltip-container') || document.body;

const TooltipContainer = styled.div`z-index: 10000`;

export function ThemeProvider ({ children }: ThemeProviderProps): React.ReactElement<ThemeProviderProps> {
  const themeName = useSelector((state: RootState) => state.settings.theme);
  const themeConfig = SW_THEME_CONFIGS[themeName];

  return (
    <ConfigProvider
      getModalContainer={getModalContainer}
      getPopupContainer={getTooltipContainer}
      theme={themeConfig}
    >
      <ThemeGenerator themeConfig={themeConfig}>
        <TooltipContainer id='tooltip-container' />
        {children}
      </ThemeGenerator>
    </ConfigProvider>
  );
}
