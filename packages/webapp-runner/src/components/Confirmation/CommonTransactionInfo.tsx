// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MetaInfo from "@subwallet-webapp/components/MetaInfo";
import useGetAccountByAddress from "@subwallet-webapp/hooks/account/useGetAccountByAddress";
import { RootState } from "@subwallet-webapp/stores";
import { ThemeProps } from "@subwallet-webapp/types";
import { toShort } from "@subwallet-webapp/util";
import CN from "classnames";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import styled from "styled-components";

interface Props extends ThemeProps {
  address: string;
  network: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { address, className, network } = props;

  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  const account = useGetAccountByAddress(address);
  const chainInfo = useMemo(() => {
    return chainInfoMap[network];
  }, [chainInfoMap, network]);

  const { t } = useTranslation();

  return (
    <MetaInfo className={CN(className)} hasBackgroundWrapper={true}>
      <MetaInfo.Account
        address={account?.address || address}
        label={t("Wallet name")}
        name={account?.name}
        networkPrefix={chainInfo?.substrateInfo?.addressPrefix}
      />
      <MetaInfo.Default className={"address-field"} label={t("Address")}>
        {toShort(address)}
      </MetaInfo.Default>
      <MetaInfo.Chain chain={network} label={t("Network")} />
    </MetaInfo>
  );
};

const CommonTransactionInfo = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".address-field": {
        whiteSpace: "nowrap",
      },
    };
  }
);

export default CommonTransactionInfo;
