// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { ThemeTypes, UiSettings } from '@subwallet/extension-base/background/KoniTypes';
import { AvailableThemes, chooseTheme, Main, themes, ThemeSwitchContext } from '@subwallet/extension-koni-ui/components';
import { saveTheme, subscribeSettings } from '@subwallet/extension-koni-ui/messaging';
import { ConfigProvider, theme } from '@subwallet/react-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';

import { Theme } from '../types';

interface Props {
  children: React.ReactNode;
  className?: string;
}

interface ThemeWrapperProps {
  children: React.ReactNode;
  theme: Theme;
}

const { useToken } = theme;

const BodyTheme = createGlobalStyle<ThemeProps>`
  html {
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

function ThemeWrapper ({ children, theme }: ThemeWrapperProps): React.ReactElement<ThemeWrapperProps> {
  const { token } = useToken();

  return (
    <ThemeProvider theme={{ ...theme, token }}>
      {children}
    </ThemeProvider>
  );
}

function View ({ children, className }: Props): React.ReactElement<Props> {
  const [theme, setTheme] = useState(chooseTheme());

  const switchTheme = useCallback(
    (theme: AvailableThemes): void => {
      localStorage.setItem('theme', theme);
      setTheme(theme);
    },
    []
  );

  useEffect(() => {
    const _switchTheme = (data: UiSettings) => {
      if (!data.theme) {
        const theme = localStorage.getItem('theme');

        saveTheme(theme as ThemeTypes, () => {
          console.log('theme', theme);
        }).catch(() => console.log('There is problem when initTheme'));
      } else {
        if (data.theme !== localStorage.getItem('theme')) {
          switchTheme(data.theme);
        }
      }
    };

    subscribeSettings(null, _switchTheme)
      .then(_switchTheme)
      .catch((e) => console.log('There is problem when subscribeSettings', e));
  }, [switchTheme]);

  const _theme = themes[theme];

  return (
    <ThemeSwitchContext.Provider value={switchTheme}>
      <ConfigProvider theme={{ token: _theme.token }}>
        <ThemeWrapper theme={_theme}>
          <BodyTheme theme={_theme} />
          <Main className={className}>
            {children}
          </Main>
        </ThemeWrapper>
      </ConfigProvider>
    </ThemeSwitchContext.Provider>
  );
}

export default View;
