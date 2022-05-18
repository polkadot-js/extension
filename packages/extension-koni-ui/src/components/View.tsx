// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { ResponseSettingsType, ThemeTypes } from '@subwallet/extension-base/background/KoniTypes';
import { saveTheme, subscribeSettings } from '@subwallet/extension-koni-ui/messaging';
import React, { useCallback, useEffect, useState } from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';

// FIXME We should not import from index when this one is imported there as well
import { chooseTheme, Main, themes, ThemeSwitchContext } from '.';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function View ({ children, className }: Props): React.ReactElement<Props> {
  const [theme, setTheme] = useState(chooseTheme());

  const switchTheme = useCallback(
    (theme: ThemeTypes): void => {
      localStorage.setItem('theme', theme);
      setTheme(theme);
    },
    []
  );

  useEffect(() => {
    const _switchTheme = (data: ResponseSettingsType) => {
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
      <ThemeProvider theme={_theme}>
        <BodyTheme theme={_theme} />
        <Main className={className}>
          {children}
        </Main>
      </ThemeProvider>
    </ThemeSwitchContext.Provider>
  );
}

const BodyTheme = createGlobalStyle<ThemeProps>`
  body {
    background-color: ${({ theme }: ThemeProps): string => theme.bodyColor};
  }

  html {
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export default View;
