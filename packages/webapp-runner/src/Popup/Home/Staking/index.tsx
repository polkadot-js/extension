// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from "@subwallet/extension-base/background/KoniTypes";
import {
  EmptyList,
  FilterModal,
  Layout,
  PageWrapper,
  SwStakingItem,
} from "@subwallet-webapp/components";
import { ALL_KEY } from "@subwallet-webapp/constants";
import { DataContext } from "@subwallet-webapp/contexts/DataContext";
import {
  useFilterModal,
  useGetStakingList,
  usePreCheckReadOnly,
  useSelector,
  useTranslation,
} from "@subwallet-webapp/hooks";
import { StakingDataType, ThemeProps } from "@subwallet-webapp/types";
import { isAccountAll } from "@subwallet-webapp/util";
import { ButtonProps, Icon, ModalContext, SwList } from "@subwallet/react-ui";
import { FadersHorizontal, Plus, Trophy } from "phosphor-react";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import MoreActionModal, { MORE_ACTION_MODAL } from "./MoreActionModal";
import StakingDetailModal, {
  STAKING_DETAIL_MODAL_ID,
} from "./StakingDetailModal";

type Props = ThemeProps;

const FILTER_MODAL_ID = "staking-filter-modal";

enum FilterValue {
  NOMINATED = "nominated",
  POOLED = "pooled",
}

const FILTER_OPTIONS = [
  { label: "Nominated", value: StakingType.NOMINATED },
  { label: "Pooled", value: StakingType.POOLED },
];

const rightIcon = <Icon phosphorIcon={Plus} size="sm" type="phosphor" />;

function Component({ className = "" }: Props): React.ReactElement<Props> {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const dataContext = useContext(DataContext);
  const { activeModal } = useContext(ModalContext);

  const { data: stakingItems, priceMap } = useGetStakingList();

  const { currentAccount } = useSelector((state) => state.accountState);

  const [selectedItem, setSelectedItem] = useState<StakingDataType | undefined>(
    undefined
  );
  const {
    filterSelectionMap,
    onApplyFilter,
    onChangeFilterOption,
    onCloseFilterModal,
    selectedFilters,
  } = useFilterModal(FILTER_MODAL_ID);
  const filterFunction = useMemo<(item: StakingDataType) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === FilterValue.NOMINATED) {
          if (item.staking.type === StakingType.NOMINATED) {
            return true;
          }
        } else if (filter === StakingType.POOLED) {
          if (item.staking.type === StakingType.POOLED) {
            return true;
          }
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const onClickActionBtn = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  const onClickRightIcon = useCallback(
    (item: StakingDataType) => {
      setSelectedItem(item);
      activeModal(MORE_ACTION_MODAL);
    },
    [activeModal]
  );

  const onClickItem = useCallback(
    (item: StakingDataType) => {
      if (!isAccountAll(item.staking.address)) {
        setSelectedItem(item);

        setTimeout(() => {
          activeModal(STAKING_DETAIL_MODAL_ID);
        }, 100);
      }
    },
    [activeModal]
  );

  const preCheckReadOnly = usePreCheckReadOnly(currentAccount?.address);

  const subHeaderButton: ButtonProps[] = useMemo(
    () => [
      {
        icon: rightIcon,
        onClick: preCheckReadOnly(() =>
          navigate(`/transaction/stake/${ALL_KEY}/${ALL_KEY}`)
        ),
      },
    ],
    [preCheckReadOnly, navigate]
  );

  const renderItem = useCallback(
    (item: StakingDataType) => {
      return (
        <SwStakingItem
          className="staking-item"
          decimals={item.decimals}
          key={`${item.staking.chain}-${item.staking.type}-${item.staking.address}`}
          onClickItem={onClickItem}
          onClickRightIcon={onClickRightIcon}
          priceMap={priceMap}
          stakingData={item}
        />
      );
    },
    [onClickItem, onClickRightIcon, priceMap]
  );

  const searchFunction = useCallback(
    (item: StakingDataType, searchText: string) => {
      const searchTextLowerCase = searchText.toLowerCase();

      return item.staking.name.toLowerCase().includes(searchTextLowerCase);
    },
    []
  );

  const emptyStakingList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t("Your staking accounts will appear here!")}
        emptyTitle={t("No staking")}
        phosphorIcon={Trophy}
      />
    );
  }, [t]);

  return (
    <PageWrapper
      className={`staking ${className}`}
      resolve={dataContext.awaitStores(["staking", "price"])}
    >
      <Layout.Base
        showSubHeader={true}
        subHeaderBackground={"transparent"}
        subHeaderCenter={false}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t("Staking")}
      >
        <SwList.Section
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} size="sm" />}
          enableSearchInput={true}
          filterBy={filterFunction}
          list={stakingItems}
          onClickActionBtn={onClickActionBtn}
          renderItem={renderItem}
          renderWhenEmpty={emptyStakingList}
          searchFunction={searchFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>("Search project")}
          showActionBtn
        />

        <FilterModal
          id={FILTER_MODAL_ID}
          onApplyFilter={onApplyFilter}
          onCancel={onCloseFilterModal}
          onChangeOption={onChangeFilterOption}
          optionSelectionMap={filterSelectionMap}
          options={FILTER_OPTIONS}
        />

        {!!(
          selectedItem &&
          selectedItem.nominatorMetadata &&
          selectedItem.chainStakingMetadata
        ) && (
          <StakingDetailModal
            chainStakingMetadata={selectedItem.chainStakingMetadata}
            nominatorMetadata={selectedItem.nominatorMetadata}
          />
        )}
        <MoreActionModal
          chainStakingMetadata={selectedItem?.chainStakingMetadata}
          nominatorMetadata={selectedItem?.nominatorMetadata}
          reward={selectedItem?.reward}
          staking={selectedItem?.staking}
        />
      </Layout.Base>
    </PageWrapper>
  );
}

export const Staking = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      color: token.colorTextLight1,
      fontSize: token.fontSizeLG,

      ".ant-sw-screen-layout-body": {
        display: "flex",
      },

      ".ant-sw-list-section": {
        flex: 1,
      },

      ".staking__filter_option": {
        width: "100%",
      },

      ".staking__filter_option_wrapper": {
        display: "flex",
        flexDirection: "column",
        gap: token.marginLG,
      },

      ".staking-item": {
        marginBottom: token.marginXS,
      },
    };
  }
);

export default Staking;
