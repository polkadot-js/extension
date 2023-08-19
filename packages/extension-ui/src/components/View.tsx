// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Theme } from './index.js';

import React, { useCallback, useEffect } from 'react';
import { createGlobalStyle } from 'styled-components';

// FIXME We should not import from index when this one is imported there as well
import { chooseTheme, Main, ThemeSwitchContext } from './index.js';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function setGlobalTheme (theme: string): void {
  document?.documentElement?.setAttribute('data-theme', theme);
}

function View ({ children, className }: Props): React.ReactElement<Props> {
  useEffect((): void => {
    setGlobalTheme(chooseTheme());
  }, []);

  const switchTheme = useCallback(
    (theme: Theme): void => {
      localStorage.setItem('theme', theme);
      setGlobalTheme(theme);
    },
    []
  );

  return (
    <ThemeSwitchContext.Provider value={switchTheme}>
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
