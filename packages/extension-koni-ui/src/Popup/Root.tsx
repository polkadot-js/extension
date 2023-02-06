// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Main } from '@subwallet/extension-koni-ui/components';
import Bowser from 'bowser';
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Link } from 'react-router-dom';

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

export default function Root (): React.ReactElement {
  const location = useLocation();
  // Todo: Navigate to default page

  useEffect(() => {
    // Todo: Redirect to default page depend on condition
  }, []);

  return (
    <Main>
      <div>
        <div>Current path: {location.pathname} </div>
        <div>Current state: {JSON.stringify(location.state)} </div>
        <Link
          style={{ marginRight: '8px' }}
          to={'/welcome'}
        >Welcome</Link>
        <Link
          style={{ marginRight: '8px' }}
          to={'/home'}
        >Home</Link>
        <Link
          style={{ marginRight: '8px' }}
          to={'/home/crypto'}
        >Crypto</Link>
        <Link
          style={{ marginRight: '8px' }}
          to={'/home/nft'}
        >NFT</Link>
      </div>
      <Outlet />
    </Main>
  );
}
