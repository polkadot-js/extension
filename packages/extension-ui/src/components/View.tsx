// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useState } from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';

import localStorageStores from '@polkadot/extension-base/utils/localStorageStores';

import { ThemeSwitchContext } from './contexts';
import Main from './Main';
import { AvailableThemes, chooseTheme, themes } from './themes';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function View({ children, className }: Props): React.ReactElement<Props> {
  const [theme, setTheme] = useState(chooseTheme());

  const switchTheme = useCallback(async (theme: AvailableThemes): Promise<void> => {
    await localStorageStores.theme.set(theme);

    setTheme(theme);
  }, []);

  const _theme = themes[theme];

  return (
    <ThemeSwitchContext.Provider value={switchTheme}>
      <ThemeProvider theme={_theme}>
        <BodyTheme theme={_theme} />
        <Main className={className}>{children}</Main>
      </ThemeProvider>
    </ThemeSwitchContext.Provider>
  );
}

export const BodyTheme = createGlobalStyle<ThemeProps>`
  body {
    height: 100%;
    margin: 0;
    background: ${({ theme }: ThemeProps): string => theme.background};
    font-family: ${({ theme }: ThemeProps): string => theme.primaryFontFamily};
    -webkit-font-smoothing: antialiased;
    box-sizing: border-box;
  }

  html {
    height: 100%;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  div#root {
    height: 100%;
    margin: 0 auto;
    max-width: 100%;
    padding: 0;
  }
`;

export default View;
