// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Theme } from './index.js';

import React, { useCallback, useEffect, useState } from 'react';
import { createGlobalStyle } from 'styled-components';

import uiSettings from '@polkadot/ui-settings';

// FIXME We should not import from index when this one is imported there as well
import { chooseTheme, Main, ThemeSwitchContext } from './index.js';

interface Props {
  children: React.ReactNode;
  className?: string;
}

function View ({ children, className }: Props): React.ReactElement<Props> {
  const [theme, setTheme] = useState(chooseTheme());

  const switchTheme = useCallback(
    (theme: Theme): void => {
      localStorage.setItem('theme', theme);

      setTheme(theme);
    },
    []
  );

  useEffect((): void => {
    uiSettings.on('change', (settings): void => {
      document?.documentElement?.setAttribute('data-theme', settings.uiTheme);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect((): void => {
    document?.documentElement?.setAttribute('data-theme', theme);
  }, [theme]);

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
