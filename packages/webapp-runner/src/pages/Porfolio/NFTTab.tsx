// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, ScreenTab } from "@subwallet-webapp/components"
import { Button, DappItem, Icon, Input } from "@subwallet/react-ui"
import { ThemeProps } from "@subwallet-webapp/types"
import CN from "classnames"
import { DownloadSimple, MagnifyingGlass } from "phosphor-react"
import TokenTable from "@subwallet-webapp/components/TokenTable"
import styled from "styled-components"
import TokenItem from "@subwallet/react-ui/es/web3-block/token-item"
import NftCollections from "@subwallet-webapp/Popup/Home/Nfts/NftCollections"

export type Props = ThemeProps

function Component({ className }: Props): React.ReactElement<Props> {
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: () => (
        <DappItem
          dAppName="1Beam"
          src="https://via.placeholder.com/200/004BFF"
          dAppTitle="1Beam"
        />
      ),
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Operations",
      dataIndex: "",
      key: "operations",
    },
  ]

  const data = [
    { name: "Jack", age: 28, address: "some where", key: "1" },
    { name: "Rose", age: 36, address: "some where", key: "2" },
  ]

  return (
    <>
      <NftCollections />
    </>
  )
}

const NFTTab = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {}
})

export default NFTTab
