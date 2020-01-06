// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { AvailableThemes, chooseTheme, themes, ThemeSwitchContext, Theme } from '.';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function View ({ children, className }: Props): React.ReactElement<Props> {
  const [theme, setTheme] = useState(chooseTheme());
  const _theme = themes[theme];

  const switchTheme = (theme: AvailableThemes): void => {
    localStorage.setItem('theme', theme);
    setTheme(theme);
  };

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

const BodyTheme = createGlobalStyle<{ theme: Theme }>`
  body {
    background-color: ${({ theme }): string => theme.bodyColor};
  }

  html {
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${({ theme }): string => theme.background};
  color: ${({ theme }): string => theme.textColor};
  font-size: ${({ theme }): string => theme.fontSize};
  line-height: ${({ theme }): string => theme.lineHeight};
  border: 1px solid ${({ theme }): string => theme.inputBorderColor};

  * {
    font-family: ${({ theme }): string => theme.fontFamily};
  }

  > * {
    padding-left: 24px;
    padding-right: 24px;
  }
`;

export default View;
