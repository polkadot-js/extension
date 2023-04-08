// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Base from "./base/Base"
import { Home } from "./base/Home"
import Main from "./base/Main"
import { WithSubHeaderOnly } from "./base/WithSubHeaderOnly"

type CompoundedComponent = {
  Home: typeof Home
  Base: typeof Base
  WithSubHeaderOnly: typeof WithSubHeaderOnly
  Main: typeof Main
}

const Layout: CompoundedComponent = {
  Home: Home,
  Base: Base,
  WithSubHeaderOnly: WithSubHeaderOnly,
  Main: Main,
}

export default Layout
