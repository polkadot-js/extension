// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect } from 'react';
import { createGlobalStyle } from 'styled-components';

// FIXME We should not import from index when this one is imported there as well
import { chooseTheme, Main, ThemeSwitchContext } from './index.js';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function setGlobalTheme (theme: string): void {
  const _theme = theme === 'dark'
    ? 'dark'
    : 'light';

  localStorage.setItem('theme', _theme);
  document?.documentElement?.setAttribute('data-theme', _theme);
}

function View ({ children, className }: Props): React.ReactElement<Props> {
  useEffect((): void => {
    setGlobalTheme(chooseTheme());
  }, []);

  return (
    <ThemeSwitchContext.Provider value={setGlobalTheme}>
      <BodyTheme />
      <Main className={className}>
        {children}
      </Main>
    </ThemeSwitchContext.Provider>
  );
}

const BodyTheme = createGlobalStyle`
  body {
    background-color: var(--bodyColor);
  }

  html {
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export default View;
