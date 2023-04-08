// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from "@subwallet/extension-base/background/KoniTypes";
import { Layout, PageWrapper } from "@subwallet-webapp/components";
import InfoIcon from "@subwallet-webapp/components/Icon/InfoIcon";
import { StakingNetworkDetailModalId } from "@subwallet-webapp/components/Modal/Staking/StakingNetworkDetailModal";
import { TRANSACTION_TITLE_MAP } from "@subwallet-webapp/constants";
import { DataContext } from "@subwallet-webapp/contexts/DataContext";
import useAssetChecker from "@subwallet-webapp/hooks/chain/useAssetChecker";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import { RootState } from "@subwallet-webapp/stores";
import { Theme, ThemeProps } from "@subwallet-webapp/types";
import { ButtonProps, ModalContext, SwSubHeader } from "@subwallet/react-ui";
import CN from "classnames";
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import styled from "styled-components";

import { isEthereumAddress } from "@polkadot/util-crypto";

interface Props extends ThemeProps {
  title: string;

  transactionType: string;
}

export interface TransactionFormBaseProps {
  from: string;
  chain: string;
  asset: string;
}

export interface TransactionContextProps extends TransactionFormBaseProps {
  transactionType: ExtrinsicType;
  setTransactionType: Dispatch<SetStateAction<ExtrinsicType>>;
  setFrom: Dispatch<SetStateAction<string>>;
  setChain: Dispatch<SetStateAction<string>>;
  setAsset: Dispatch<SetStateAction<string>>;
  onDone: (extrinsicHash: string) => void;
  onClickRightBtn: () => void;
  setShowRightBtn: Dispatch<SetStateAction<boolean>>;
  setDisabledRightBtn: Dispatch<SetStateAction<boolean>>;
}

export const TransactionContext = React.createContext<TransactionContextProps>({
  transactionType: ExtrinsicType.TRANSFER_BALANCE,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setTransactionType: (value) => {},
  from: "",
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setFrom: (value) => {},
  chain: "",
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setChain: (value) => {},
  asset: "",
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setAsset: (value) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onDone: (extrinsicHash) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onClickRightBtn: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setShowRightBtn: (value) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledRightBtn: (value) => {},
});

function Component({ className }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeModal } = useContext(ModalContext);
  const dataContext = useContext(DataContext);
  const { currentAccount, isAllAccount } = useSelector(
    (root: RootState) => root.accountState
  );
  const [from, setFrom] = useState(
    !isAllAccount ? currentAccount?.address || "" : ""
  );
  const [chain, setChain] = useState("");
  const [asset, setAsset] = useState("");
  const [transactionType, setTransactionType] = useState<ExtrinsicType>(
    ExtrinsicType.TRANSFER_BALANCE
  );
  const [showRightBtn, setShowRightBtn] = useState<boolean>(false);
  const [disabledRightBtn, setDisabledRightBtn] = useState<boolean>(false);
  const titleMap = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(TRANSACTION_TITLE_MAP)) {
      result[key] = t(value);
    }

    return result;
  }, [t]);
  const { goBack } = useDefaultNavigate();

  const checkAsset = useAssetChecker();

  useEffect(() => {
    asset !== "" && checkAsset(asset);
  }, [asset, checkAsset]);

  // Navigate to finish page
  const onDone = useCallback(
    (extrinsicHash: string) => {
      const chainType = isEthereumAddress(from) ? "ethereum" : "substrate";

      navigate(`/transaction/done/${chainType}/${chain}/${extrinsicHash}`, {
        replace: true,
      });
    },
    [from, chain, navigate]
  );

  const onClickRightBtn = useCallback(() => {
    if (transactionType === ExtrinsicType.STAKING_JOIN_POOL) {
      activeModal(StakingNetworkDetailModalId);
    }
  }, [activeModal, transactionType]);

  const subHeaderButton: ButtonProps[] = useMemo(() => {
    return showRightBtn
      ? [
          {
            disabled: disabledRightBtn,
            icon: <InfoIcon />,
            onClick: () => onClickRightBtn(),
          },
        ]
      : [];
  }, [disabledRightBtn, onClickRightBtn, showRightBtn]);

  return (
    <Layout.Home showFilterIcon showTabBar={false}>
      <TransactionContext.Provider
        value={{
          transactionType,
          from,
          setFrom,
          chain,
          setChain,
          setTransactionType,
          onDone,
          onClickRightBtn,
          setShowRightBtn,
          setDisabledRightBtn,
          asset,
          setAsset,
        }}
      >
        <PageWrapper
          resolve={dataContext.awaitStores([
            "chainStore",
            "assetRegistry",
            "balance",
          ])}
        >
          <div className={CN(className, "transaction-wrapper")}>
            <SwSubHeader
              background={"transparent"}
              center
              className={"transaction-header"}
              onBack={goBack}
              rightButtons={subHeaderButton}
              showBackButton
              title={titleMap[transactionType]}
            />
            <Outlet />
          </div>
        </PageWrapper>
      </TransactionContext.Provider>
    </Layout.Home>
  );
}

const Transaction = styled(Component)(({ theme }) => {
  const token = (theme as Theme).token;

  return {
    height: "100%",
    display: "flex",
    flexDirection: "column",

    ".transaction-header": {
      paddingTop: token.paddingSM,
      paddingBottom: token.paddingSM,
      flexShrink: 0,
    },

    ".transaction-content": {
      flex: "1 1 400px",
      paddingLeft: token.padding,
      paddingRight: token.padding,
      overflow: "auto",
    },

    ".transaction-footer": {
      display: "flex",
      flexWrap: "wrap",
      padding: `${token.paddingMD}px ${token.padding}px`,
      paddingBottom: token.paddingLG,
      gap: token.paddingXS,

      ".error-messages": {
        width: "100%",
        color: token.colorError,
      },

      ".warning-messages": {
        width: "100%",
        color: token.colorWarning,
      },

      ".ant-btn": {
        flex: 1,
      },

      ".full-width": {
        minWidth: "100%",
      },
    },
  };
});

export default Transaction;
