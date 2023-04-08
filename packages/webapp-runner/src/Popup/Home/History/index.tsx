// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  ExtrinsicStatus,
  ExtrinsicType,
  TransactionDirection,
  TransactionHistoryItem,
} from "@subwallet/extension-base/background/KoniTypes";
import { isAccountAll } from "@subwallet/extension-base/utils";
import { FilterModal, PageWrapper } from "@subwallet-webapp/components";
import EmptyList from "@subwallet-webapp/components/EmptyList";
import { HistoryItem } from "@subwallet-webapp/components/History/HistoryItem";
import { DataContext } from "@subwallet-webapp/contexts/DataContext";
import { useFilterModal } from "@subwallet-webapp/hooks/modal/useFilterModal";
import {
  HistoryDetailModal,
  HistoryDetailModalId,
} from "@subwallet-webapp/Popup/Home/History/Detail";
import { RootState } from "@subwallet-webapp/stores";
import { ThemeProps } from "@subwallet-webapp/types";
import { quickFormatToCompare } from "@subwallet-webapp/util/account/reformatAddress";
import { customFormatDate } from "@subwallet-webapp/util/common/customFormatDate";
import {
  Icon,
  ModalContext,
  SwIconProps,
  SwList,
  SwSubHeader,
} from "@subwallet/react-ui";
import {
  Aperture,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ClockCounterClockwise,
  Database,
  FadersHorizontal,
  Rocket,
  Spinner,
} from "phosphor-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import styled from "styled-components";

type Props = ThemeProps;

export interface TransactionHistoryDisplayData {
  className: string;
  typeName: string;
  name: string;
  title: string;
  icon: SwIconProps["phosphorIcon"];
}
export interface TransactionHistoryDisplayItem extends TransactionHistoryItem {
  displayData: TransactionHistoryDisplayData;
}

const IconMap: Record<string, SwIconProps["phosphorIcon"]> = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  claim_reward: ClockCounterClockwise,
  staking: Database,
  crowdloan: Rocket,
  nft: Aperture,
  processing: Spinner,
  default: ClockCounterClockwise,
};

function getIcon(item: TransactionHistoryItem): SwIconProps["phosphorIcon"] {
  if (item.status === ExtrinsicStatus.PROCESSING) {
    return IconMap.processing;
  }

  if (item.type === ExtrinsicType.SEND_NFT) {
    return IconMap.nft;
  }

  if (item.type === ExtrinsicType.CROWDLOAN) {
    return IconMap.crowdloan;
  }

  if (item.type === ExtrinsicType.STAKING_CLAIM_REWARD) {
    return IconMap.claim_reward;
  }

  if (isTypeStaking(item.type)) {
    return IconMap.staking;
  }

  return IconMap.default;
}

function isTypeTransfer(txType: ExtrinsicType) {
  return [
    ExtrinsicType.TRANSFER_BALANCE,
    ExtrinsicType.TRANSFER_TOKEN,
    ExtrinsicType.TRANSFER_XCM,
  ].includes(txType);
}

function isTypeStaking(txType: ExtrinsicType) {
  return [
    ExtrinsicType.STAKING_JOIN_POOL,
    ExtrinsicType.STAKING_LEAVE_POOL,
    ExtrinsicType.STAKING_BOND,
    ExtrinsicType.STAKING_UNBOND,
    ExtrinsicType.STAKING_WITHDRAW,
    ExtrinsicType.STAKING_COMPOUNDING,
  ].includes(txType);
}

function getDisplayData(
  item: TransactionHistoryItem,
  nameMap: Record<string, string>,
  titleMap: Record<string, string>
): TransactionHistoryDisplayData {
  let displayData: TransactionHistoryDisplayData;
  const time = customFormatDate(item.time, "#hhhh#:#mm#");

  const displayStatus = item.status === ExtrinsicStatus.FAIL ? "fail" : "";

  if (
    item.type === ExtrinsicType.TRANSFER_BALANCE ||
    item.type === ExtrinsicType.TRANSFER_TOKEN ||
    item.type === ExtrinsicType.TRANSFER_XCM ||
    item.type === ExtrinsicType.EVM_EXECUTE
  ) {
    if (item.direction === TransactionDirection.RECEIVED) {
      displayData = {
        className: `-receive -${item.status}`,
        title: titleMap.received,
        name: nameMap.received,
        typeName: `${nameMap.received} ${displayStatus} - ${time}`,
        icon: IconMap.receive,
      };
    } else {
      displayData = {
        className: `-send -${item.status}`,
        title: titleMap.send,
        name: nameMap.send,
        typeName: `${nameMap.send} ${displayStatus} - ${time}`,
        icon: IconMap.send,
      };
    }
  } else {
    const typeName = nameMap[item.type] || nameMap.default;

    displayData = {
      className: `-${item.type} -${item.status}`,
      title: titleMap[item.type],
      typeName: `${typeName} ${displayStatus} - ${time}`,
      name: nameMap[item.type],
      icon: getIcon(item),
    };
  }

  const isProcessing = item.status === ExtrinsicStatus.PROCESSING;

  if (isProcessing) {
    displayData.className = "-processing";
    displayData.typeName = nameMap.processing;
  }

  return displayData;
}

const FILTER_MODAL_ID = "history-filter-id";

enum FilterValue {
  SEND = "send",
  RECEIVED = "received",
  NFT = "nft",
  STAKE = "stake",
  CLAIM = "claim",
  CROWDLOAN = "crowdloan",
  SUCCESSFUL = "successful",
  FAILED = "failed",
}

function Component({ className = "" }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const { accounts, currentAccount } = useSelector(
    (root: RootState) => root.accountState
  );
  const { historyList: rawHistoryList } = useSelector(
    (root: RootState) => root.transactionHistory
  );

  const {
    filterSelectionMap,
    onApplyFilter,
    onChangeFilterOption,
    onCloseFilterModal,
    selectedFilters,
  } = useFilterModal(FILTER_MODAL_ID);

  const filterFunction = useMemo<
    (item: TransactionHistoryDisplayItem) => boolean
  >(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === FilterValue.SEND) {
          if (
            isTypeTransfer(item.type) &&
            item.direction === TransactionDirection.SEND
          ) {
            return true;
          }
        } else if (filter === FilterValue.RECEIVED) {
          if (
            isTypeTransfer(item.type) &&
            item.direction === TransactionDirection.RECEIVED
          ) {
            return true;
          }
        } else if (filter === FilterValue.NFT) {
          if (item.type === ExtrinsicType.SEND_NFT) {
            return true;
          }
        } else if (filter === FilterValue.STAKE) {
          if (isTypeStaking(item.type)) {
            return true;
          }
        } else if (filter === FilterValue.CLAIM) {
          if (item.type === ExtrinsicType.STAKING_CLAIM_REWARD) {
            return true;
          }
        } else if (filter === FilterValue.CROWDLOAN) {
          if (item.type === ExtrinsicType.CROWDLOAN) {
            return true;
          }
        } else if (filter === FilterValue.SUCCESSFUL) {
          if (item.status === ExtrinsicStatus.SUCCESS) {
            return true;
          }
        } else if (filter === FilterValue.FAILED) {
          if (item.status === ExtrinsicStatus.FAIL) {
            return true;
          }
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const filterOptions = useMemo(() => {
    return [
      { label: t("Send token transaction"), value: FilterValue.SEND },
      { label: t("Receive token transaction"), value: FilterValue.RECEIVED },
      { label: t("NFT transaction"), value: FilterValue.NFT },
      { label: t("Stake transaction"), value: FilterValue.STAKE },
      { label: t("Claim reward transaction"), value: FilterValue.CLAIM },
      // { label: t('Crowdloan transaction'), value: FilterValue.CROWDLOAN }, // support crowdloan later
      { label: t("Successful transaction"), value: FilterValue.SUCCESSFUL },
      { label: t("Failed transaction"), value: FilterValue.FAILED },
    ];
  }, [t]);

  const accountMap = useMemo(() => {
    return accounts.reduce((accMap, cur) => {
      accMap[cur.address.toLowerCase()] = cur.name || "";

      return accMap;
    }, {} as Record<string, string>);
  }, [accounts]);

  const typeNameMap: Record<string, string> = useMemo(
    () => ({
      default: t("Transaction"),
      processing: t("Processing..."),
      send: t("Send"),
      received: t("Receive"),
      [ExtrinsicType.SEND_NFT]: t("NFT"),
      [ExtrinsicType.CROWDLOAN]: t("Crowdloan"),
      [ExtrinsicType.STAKING_JOIN_POOL]: t("Stake"),
      [ExtrinsicType.STAKING_LEAVE_POOL]: t("Unstake"),
      [ExtrinsicType.STAKING_BOND]: t("Bond"),
      [ExtrinsicType.STAKING_UNBOND]: t("Unbond"),
      [ExtrinsicType.STAKING_CLAIM_REWARD]: t("Claim Reward"),
      [ExtrinsicType.EVM_EXECUTE]: t("EVM Transaction"),
    }),
    [t]
  );

  const typeTitleMap: Record<string, string> = useMemo(
    () => ({
      default: t("Transaction"),
      send: t("Send transaction"),
      received: t("Receive transaction"),
      [ExtrinsicType.SEND_NFT]: t("NFT transaction"),
      [ExtrinsicType.CROWDLOAN]: t("Crowdloan transaction"),
      [ExtrinsicType.STAKING_JOIN_POOL]: t("Stake transaction"),
      [ExtrinsicType.STAKING_LEAVE_POOL]: t("Unstake transaction"),
      [ExtrinsicType.STAKING_BOND]: t("Bond transaction"),
      [ExtrinsicType.STAKING_UNBOND]: t("Unbond transaction"),
      [ExtrinsicType.STAKING_CLAIM_REWARD]: t("Claim Reward transaction"),
      [ExtrinsicType.EVM_EXECUTE]: t("EVM Transaction"),
    }),
    [t]
  );

  // Fill display data to history list
  const historyList = useMemo(() => {
    const currentAddress = currentAccount?.address || "";
    const currentAddressLowerCase = currentAddress.toLowerCase();
    const isFilterByAddress =
      currentAccount?.address && !isAccountAll(currentAddress);
    const finalHistoryList: TransactionHistoryDisplayItem[] = [];

    rawHistoryList.forEach((item: TransactionHistoryItem) => {
      // Filter account by current account
      if (
        isFilterByAddress &&
        currentAddressLowerCase !== quickFormatToCompare(item.address)
      ) {
        return;
      }

      // Format display name for account by address
      const fromName = accountMap[quickFormatToCompare(item.from) || ""];
      const toName = accountMap[quickFormatToCompare(item.to) || ""];

      finalHistoryList.push({
        ...item,
        fromName,
        toName,
        displayData: getDisplayData(item, typeNameMap, typeTitleMap),
      });
    });

    return finalHistoryList.sort((a, b) => b.time - a.time);
  }, [
    accountMap,
    rawHistoryList,
    typeNameMap,
    typeTitleMap,
    currentAccount?.address,
  ]);

  // Handle detail modal
  const { chain, extrinsicHash } = useParams();
  const [selectedItem, setSelectedItem] =
    useState<TransactionHistoryDisplayItem | null>(null);
  const [openDetailLink, setOpenDetailLink] = useState<boolean>(
    !!chain && !!extrinsicHash
  );

  const onOpenDetail = useCallback(
    (item: TransactionHistoryDisplayItem) => {
      return () => {
        setSelectedItem(item);
        activeModal(HistoryDetailModalId);
      };
    },
    [activeModal]
  );

  const onCloseDetail = useCallback(() => {
    inactiveModal(HistoryDetailModalId);
    setSelectedItem(null);
    setOpenDetailLink(false);
  }, [inactiveModal]);

  const onClickActionBtn = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  useEffect(() => {
    if (extrinsicHash && chain && openDetailLink) {
      const existed = historyList.find(
        (item) => item.chain === chain && item.extrinsicHash === extrinsicHash
      );

      if (existed) {
        setSelectedItem(existed);
        activeModal(HistoryDetailModalId);
      }
    }
  }, [activeModal, chain, extrinsicHash, openDetailLink, historyList]);

  useEffect(() => {
    if (checkActive(HistoryDetailModalId)) {
      setSelectedItem((selected) => {
        if (selected) {
          return (
            historyList.find(
              (x) =>
                x.chain === selected.chain &&
                x.address === selected.address &&
                x.extrinsicHash === selected.extrinsicHash
            ) || selected
          );
        } else {
          return selected;
        }
      });
    }
  }, [checkActive, historyList]);

  const emptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t("Your transactions history will appear here!")}
        emptyTitle={t("No transactions yet")}
        phosphorIcon={Clock}
      />
    );
  }, [t]);

  const renderItem = useCallback(
    (item: TransactionHistoryDisplayItem) => {
      return (
        <HistoryItem
          item={item}
          key={`${item.extrinsicHash}-${item.address}`}
          onClick={onOpenDetail(item)}
        />
      );
    },
    [onOpenDetail]
  );

  const searchFunc = useCallback(
    (item: TransactionHistoryItem, searchText: string) => {
      const searchTextLowerCase = searchText.toLowerCase();

      return (
        !!item.fromName &&
        item.fromName.toLowerCase().includes(searchTextLowerCase)
      );
    },
    []
  );

  const groupBy = useCallback((item: TransactionHistoryItem) => {
    return customFormatDate(item.time, "#MMM# #DD#, #YYYY#");
  }, []);

  const groupSeparator = useCallback(
    (group: TransactionHistoryItem[], idx: number, groupLabel: string) => {
      return <div className="__group-separator">{groupLabel}</div>;
    },
    []
  );

  return (
    <>
      <PageWrapper
        className={`history ${className}`}
        resolve={dataContext.awaitStores(["transactionHistory"])}
      >
        <SwSubHeader
          background={"transparent"}
          center={false}
          className={"history-header"}
          paddingVertical
          // todo: enable this code if support download feature
          // rightButtons={[
          //   {
          //     icon: (
          //       <Icon
          //         phosphorIcon={DownloadSimple}
          //         size={'md'}
          //         type='phosphor'
          //       />
          //     )
          //   }
          // ]}
          showBackButton={false}
          title={t("History")}
        />

        <SwList.Section
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          enableSearchInput
          filterBy={filterFunction}
          groupBy={groupBy}
          groupSeparator={groupSeparator}
          list={historyList}
          onClickActionBtn={onClickActionBtn}
          renderItem={renderItem}
          renderWhenEmpty={emptyList}
          searchFunction={searchFunc}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>("Search history")}
          showActionBtn
        />
      </PageWrapper>

      <HistoryDetailModal data={selectedItem} onCancel={onCloseDetail} />

      <FilterModal
        id={FILTER_MODAL_ID}
        onApplyFilter={onApplyFilter}
        onCancel={onCloseFilterModal}
        onChangeOption={onChangeFilterOption}
        optionSelectionMap={filterSelectionMap}
        options={filterOptions}
      />
    </>
  );
}

const History = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: "flex",
    flexDirection: "column",

    ".history-header.ant-sw-sub-header-container": {
      marginBottom: 0,
    },

    ".ant-sw-list-section": {
      flex: 1,
    },
    ".ant-sw-sub-header-container": {
      marginBottom: token.marginXS,
    },
    ".history-item + .history-item, .history-item + .___list-separator": {
      marginTop: token.marginXS,
    },
    ".___list-separator": {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight3,
      fontWeight: token.headingFontWeight,
      marginBottom: token.marginXS,
    },
  };
});

export default History;
