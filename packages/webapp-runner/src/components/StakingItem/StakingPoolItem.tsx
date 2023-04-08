// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominationPoolDataType } from "@subwallet-webapp/hooks/screen/staking/useGetValidatorList";
import { ThemeProps } from "@subwallet-webapp/types";
import { Button, Icon, Number, Web3Block } from "@subwallet/react-ui";
import SwAvatar from "@subwallet/react-ui/es/sw-avatar";
import { DotsThree } from "phosphor-react";
import React, { SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import { isEthereumAddress } from "@polkadot/util-crypto";

type Props = NominationPoolDataType &
  ThemeProps & {
    onClickMoreBtn: (e: SyntheticEvent) => void;
  };

const Component: React.FC<Props> = (props: Props) => {
  const { address, bondedAmount, className, id, name, onClickMoreBtn, symbol } =
    props;

  const { t } = useTranslation();

  return (
    <Web3Block
      className={className}
      leftItem={
        <SwAvatar
          identPrefix={42}
          size={40}
          theme={isEthereumAddress(address) ? "ethereum" : "polkadot"}
          value={address}
        />
      }
      middleItem={
        <div className={"middle-item"}>
          <div className={"middle-item__name"}>{name || `Pool #${id}`}</div>
          <div className={"middle-item__bond-amount"}>
            <span className={"middle-item__bond-amount-label"}>
              {t("Bonded: ")}
            </span>
            <Number
              className={"middle-item__bond-amount-number"}
              decimal={0}
              decimalOpacity={0.45}
              intOpacity={0.45}
              size={12}
              suffix={symbol}
              unitOpacity={0.45}
              value={bondedAmount}
            />
          </div>
        </div>
      }
      rightItem={
        <Button
          icon={<Icon phosphorIcon={DotsThree} />}
          onClick={onClickMoreBtn}
          size="xs"
          type="ghost"
        />
      }
    />
  );
};

const StakingPoolItem = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      padding: token.paddingSM,
      borderRadius: token.borderRadiusLG,
      background: token.colorBgSecondary,

      ".ant-web3-block-middle-item": {
        paddingRight: token.padding,
      },

      ".middle-item__name": {
        fontSize: token.fontSizeLG,
        lineHeight: token.lineHeightLG,
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
      },

      ".middle-item__bond-amount-label, .middle-item__bond-amount-number": {
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM,
        color: token.colorTextLight4,
      },

      ".middle-item__bond-amount-label": {
        paddingRight: token.paddingXXS,
      },

      ".middle-item__bond-amount": {
        display: "flex",
        alignItems: "center",
      },
    };
  }
);

export default StakingPoolItem;
