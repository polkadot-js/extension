// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwScreenLayout } from '@subwallet/react-ui';

import { Home } from './Home';

type InternalLayoutType = typeof SwScreenLayout;

type CompoundedComponent = InternalLayoutType & {
  Home: typeof Home;
};

const Layout = SwScreenLayout as CompoundedComponent;

Layout.Home = Home;

export default Layout;
