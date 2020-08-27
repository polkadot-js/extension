// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from "../types";

import React, { useState } from "react";
import styled, { createGlobalStyle, ThemeProvider } from "styled-components";


// FIXME We should not import from index when this one is imported there as well
import { AvailableThemes, chooseTheme, themes, ThemeSwitchContext } from ".";

interface Props {
  children: React.ReactNode;
  className?: string;
}

function View({ children, className }: Props): React.ReactElement<Props> {
  const [theme, setTheme] = useState(chooseTheme());
  const _theme = themes[theme];

  const switchTheme = (theme: AvailableThemes): void => {
    localStorage.setItem("theme", theme);
    setTheme(theme);
  };

  return (
    <ThemeSwitchContext.Provider value={switchTheme}>
      <ThemeProvider theme={_theme}>
        <BodyTheme theme={_theme} />
        <Main className={className}>{children}</Main>
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

const Main = styled.main`
  display: flex;
  flex-direction: column;
  height: 100%;
  color: ${({ theme }: ThemeProps): string => theme.textColor};
  font-size: ${({ theme }: ThemeProps): string => theme.fontSize};
  line-height: ${({ theme }: ThemeProps): string => theme.lineHeight};

  * {
    font-family: ${({ theme }: ThemeProps): string => theme.fontFamily};
  }

  > * {
    padding-left: 24px;
    padding-right: 24px;
  }
`;

export default View;
