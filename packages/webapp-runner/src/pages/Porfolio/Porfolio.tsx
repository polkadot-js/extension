// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, ScreenTab } from "@subwallet-webapp/components"
import { ThemeProps } from "@subwallet-webapp/types"
import CN from "classnames"

export type Props = ThemeProps

function Component({ className }: Props): React.ReactElement<Props> {
  return (
    <Layout.Main className={CN(className)}>
      Yppppp
      <ScreenTab>
        <ScreenTab.SwTabPanel label="Tab 1">
          <>tab 1</>
        </ScreenTab.SwTabPanel>
        <ScreenTab.SwTabPanel label="Tab 2">
          <>tab 2</>
        </ScreenTab.SwTabPanel>
      </ScreenTab>
    </Layout.Main>
  )
}

export default Component
