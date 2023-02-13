// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Home } from './base/Home';
import Base from './base/Base';

type CompoundedComponent = {
  Home: typeof Home;
  Base: typeof Base;
};

const Layout: CompoundedComponent = {
  Home: Home,
  Base: Base
};

export default Layout;
