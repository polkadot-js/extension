// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getChainSubstrateAddressPrefix } from "@subwallet/extension-base/services/chain-service/utils";
import useNotification from "@subwallet-webapp/hooks/common/useNotification";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useFetchChainInfo from "@subwallet-webapp/hooks/screen/common/useFetchChainInfo";
import { ThemeProps } from "@subwallet-webapp/types";
import reformatAddress from "@subwallet-webapp/util/account/reformatAddress";
import { Button, Icon } from "@subwallet/react-ui";
import TokenItem, {
  TokenItemProps,
} from "@subwallet/react-ui/es/web3-block/token-item";
import classNames from "classnames";
import { Copy, QrCode } from "phosphor-react";
import React, { useCallback, useMemo } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import styled from "styled-components";

type Props = TokenItemProps &
  ThemeProps & {
    address?: string;
    chain?: string;
    onClickCopyBtn?: () => void;
    onClickQrBtn?: () => void;
  };

function Component({
  address,
  chain,
  className,
  name,
  onClickCopyBtn,
  onClickQrBtn,
  symbol,
  ...restProps
}: Props) {
  const chainInfo = useFetchChainInfo(chain || "");
  const notify = useNotification();
  const { t } = useTranslation();

  const formattedAddress = useMemo(() => {
    const networkPrefix = _getChainSubstrateAddressPrefix(chainInfo);
    const isEvmChain = !!chainInfo.evmInfo;

    return reformatAddress(address || "", networkPrefix, isEvmChain);
  }, [address, chainInfo]);

  const _onCLickCopyBtn = useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation();
      notify({
        message: t("Copied to clipboard"),
      });
      onClickCopyBtn && onClickCopyBtn();
    },
    [notify, onClickCopyBtn, t]
  );

  return (
    <div className={classNames("token-selection-item", className)}>
      <TokenItem
        {...restProps}
        isShowSubLogo
        middleItem={
          <>
            <div className={"ant-network-item-name"}>{symbol}</div>
            <div className={"__chain-name"}>{chainInfo.name}</div>
          </>
        }
        name={name}
        networkMainLogoShape="squircle"
        networkMainLogoSize={40}
        rightItem={
          <>
            <CopyToClipboard text={formattedAddress}>
              <Button
                icon={<Icon phosphorIcon={Copy} size="sm" />}
                onClick={_onCLickCopyBtn}
                size="xs"
                type="ghost"
              />
            </CopyToClipboard>
            <Button
              icon={<Icon phosphorIcon={QrCode} size="sm" />}
              onClick={onClickQrBtn}
              size="xs"
              type="ghost"
            />
          </>
        }
        subName={chainInfo.name}
        symbol={symbol?.toLowerCase()}
      />
    </div>
  );
}

export const TokenSelectionItem = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".ant-web3-block": {
        padding: token.paddingSM,
      },

      ".ant-web3-block-middle-item": {
        ".ant-number": {
          fontSize: token.fontSizeSM,
          lineHeight: token.lineHeightSM,
        },
      },

      ".__chain-name": {
        color: token.colorTextLight4,
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM,
      },

      ".ant-loading-icon": {
        color: "inherit !important",
      },

      ".__icon-wrapper": {
        width: 40,
        display: "flex",
        justifyContent: "center",
        color: token.colorTextLight4,
      },

      ".ant-btn-ghost": {
        color: token.colorTextLight3,
      },

      ".ant-btn-ghost:hover": {
        color: token.colorTextLight2,
      },

      ".ant-balance-item-content:hover": {
        ".__icon-wrapper": {
          color: token.colorTextLight2,
        },
      },
    };
  }
);
