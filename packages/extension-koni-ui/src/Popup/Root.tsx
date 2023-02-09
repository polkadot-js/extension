// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Main } from '@subwallet/extension-koni-ui/components';
import { Debugger } from '@subwallet/extension-koni-ui/Popup/Debugger';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import Bowser from 'bowser';
import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

export function initRootPromise () {
  // Init Application with some default data if not existed
  const VARIANTS = ['beam', 'marble', 'pixel', 'sunset', 'bauhaus', 'ring'];

  function getRandomVariant (): string {
    const random = Math.floor(Math.random() * 6);

    return VARIANTS[random];
  }

  const browser = Bowser.getParser(window.navigator.userAgent);

  if (!window.localStorage.getItem('randomVariant') || !window.localStorage.getItem('randomNameForLogo')) {
    const randomVariant = getRandomVariant();

    window.localStorage.setItem('randomVariant', randomVariant);
    window.localStorage.setItem('randomNameForLogo', `${Date.now()}`);
  }

  if (!!browser.getBrowser() && !!browser.getBrowser().name && !!browser.getOS().name) {
    window.localStorage.setItem('browserInfo', browser.getBrowser().name as string);
    window.localStorage.setItem('osInfo', browser.getOS().name as string);
  }

  // Todo: Fetching data and setup store here
  // Todo: Loading all basic data for root with promise.all()
  // Todo: Settings data
  // Todo: Accounts data
  return true;
}

function _Root ({ className }: ThemeProps): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/') {
      // Todo: check conditional an navigate to default page
      navigate('/home/nfts');
    }
  },
  [location.pathname, navigate]
  );

  return (
    <Main className={className}>
      <Debugger />

      <div className='main-layout'>
        <Outlet />
      </div>
    </Main>
  );
}

export const Root = styled(_Root)(() => ({
  '.main-layout': {
    flex: 1,
    overflow: 'hidden'
  }
}));
