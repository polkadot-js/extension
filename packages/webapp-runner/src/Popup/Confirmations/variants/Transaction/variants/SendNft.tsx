// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  ExtrinsicDataTypeMap,
  ExtrinsicType,
} from "@subwallet/extension-base/background/KoniTypes";
import MetaInfo from "@subwallet-webapp/components/MetaInfo";
import { RootState } from "@subwallet-webapp/stores";
import CN from "classnames";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import styled from "styled-components";

import { BaseTransactionConfirmationProps } from "./Base";

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;
  const data = transaction.data as ExtrinsicDataTypeMap[ExtrinsicType.SEND_NFT];

  const { t } = useTranslation();

  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  const chainInfo = useMemo(() => {
    return chainInfoMap[transaction.chain];
  }, [chainInfoMap, transaction.chain]);

  return (
    <div className={CN(className)}>
      <MetaInfo hasBackgroundWrapper>
        <MetaInfo.Account address={data.senderAddress} label={t("Sender")} />

        <MetaInfo.Account
          address={data.recipientAddress}
          label={t("Recipient")}
        />

        <MetaInfo.Chain chain={chainInfo.slug} label={t("Network")} />
      </MetaInfo>
      <MetaInfo hasBackgroundWrapper={true}>
        {data.nftItemName && (
          <MetaInfo.Default label={t("NFT")}>
            {data.nftItemName}
          </MetaInfo.Default>
        )}
        <MetaInfo.Number
          decimals={chainInfo?.substrateInfo?.decimals || 0}
          label={t("Estimated fee")}
          suffix={chainInfo?.substrateInfo?.symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
    </div>
  );
};

const SendNftTransactionConfirmation = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {};
  }
);

export default SendNftTransactionConfirmation;
