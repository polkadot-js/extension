// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, ScreenTab } from "@subwallet-webapp/components"
import { Button, Icon, Input } from "@subwallet/react-ui"
import { ThemeProps } from "@subwallet-webapp/types"
import CN from "classnames"
import { DownloadSimple, MagnifyingGlass } from "phosphor-react"
import TokenTable from "@subwallet-webapp/components/TokenTable"
import TokenTab from "./TokenTab"
import NFTTab from "./NFTTab"

export type Props = ThemeProps

function Component({ className }: Props): React.ReactElement<Props> {
  const rightSection: React.ReactElement = (
    <div className="right-section">
      <Button
        type="ghost"
        icon={<Icon phosphorIcon={DownloadSimple} size="sm" />}
      />
      <Input
        className="search-input"
        size="md"
        placeholder="Token name"
        prefix={<Icon phosphorIcon={MagnifyingGlass} />}
      />
    </div>
  )

  return (
    <Layout.Main className={CN(className, "porfolio")}>
      <ScreenTab rightSection={rightSection}>
        <ScreenTab.SwTabPanel label="Tab title">
          <>
            <TokenTab />
          </>
        </ScreenTab.SwTabPanel>
        <ScreenTab.SwTabPanel label="Tab title">
          <>
            <NFTTab />
          </>
        </ScreenTab.SwTabPanel>
      </ScreenTab>
    </Layout.Main>
  )
}

export default Component
