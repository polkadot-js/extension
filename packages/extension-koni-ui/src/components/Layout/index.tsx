// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Base from './base/Base';
import { Home } from './base/Home';

type CompoundedComponent = {
  Home: typeof Home;
  Base: typeof Base;
};

const Layout: CompoundedComponent = {
  Home: Home,
  Base: Base
};

export default Layout;
