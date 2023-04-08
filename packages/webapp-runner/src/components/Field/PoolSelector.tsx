// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from "@subwallet/extension-base/background/KoniTypes";
import { PREDEFINED_STAKING_POOL } from "@subwallet/extension-base/constants";
import { Avatar } from "@subwallet-webapp/components/Avatar";
import { BasicInputWrapper } from "@subwallet-webapp/components/Field/Base";
import { FilterModal } from "@subwallet-webapp/components/Modal/FilterModal";
import { SortingModal } from "@subwallet-webapp/components/Modal/SortingModal";
import {
  PoolDetailModal,
  PoolDetailModalId,
} from "@subwallet-webapp/components/Modal/Staking/PoolDetailModal";
import StakingPoolItem from "@subwallet-webapp/components/StakingItem/StakingPoolItem";
import { useFilterModal } from "@subwallet-webapp/hooks/modal/useFilterModal";
import useGetNominatorInfo from "@subwallet-webapp/hooks/screen/staking/useGetNominatorInfo";
import useGetValidatorList, {
  NominationPoolDataType,
} from "@subwallet-webapp/hooks/screen/staking/useGetValidatorList";
import { ThemeProps } from "@subwallet-webapp/types";
import { toShort } from "@subwallet-webapp/util";
import {
  Button,
  Icon,
  InputRef,
  SelectModal,
  useExcludeModal,
} from "@subwallet/react-ui";
import { ModalContext } from "@subwallet/react-ui/es/sw-modal/provider";
import {
  Book,
  CaretLeft,
  FadersHorizontal,
  Lightning,
  SortAscending,
} from "phosphor-react";
import React, {
  ForwardedRef,
  forwardRef,
  SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import { isEthereumAddress } from "@polkadot/util-crypto";

import EmptyAccount from "../Account/EmptyAccount";

interface Props extends ThemeProps, BasicInputWrapper {
  chain: string;
  from: string;
  onClickBookBtn?: (e: SyntheticEvent) => void;
}

const SORTING_MODAL_ID = "pool-sorting-modal";
const FILTER_MODAL_ID = "pool-filter-modal";

const sortingOptions = [
  {
    label: "Lowest commission",
    value: "commission",
  },
  {
    label: "Highest return",
    value: "return",
  },
];

const filterOptions = [
  {
    label: "Active validator",
    value: "",
  },
  {
    label: "Waiting list",
    value: "",
  },
  {
    label: "Locked",
    value: "",
  },
  {
    label: "Destroying",
    value: "",
  },
];

const getFilteredList = (
  items: NominationPoolDataType[],
  filters: string[]
) => {
  const filteredList: NominationPoolDataType[] = [];

  items.forEach((item) => {
    const isValidationPassed = filters.length <= 0;

    // TODO: logic filter
    if (isValidationPassed) {
      filteredList.push(item);
    }
  });

  return filteredList;
};

const renderEmpty = () => <EmptyAccount />;

// todo: update filter for this component, after updating filter for SelectModal
const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const {
    chain,
    className = "",
    disabled,
    from,
    id = "pool-selector",
    label,
    loading,
    onChange,
    onClickBookBtn,
    placeholder,
    statusHelp,
    value,
  } = props;

  useExcludeModal(id);

  const { t } = useTranslation();

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const nominatorMetadata = useGetNominatorInfo(
    chain,
    StakingType.POOLED,
    from
  );
  const items = useGetValidatorList(
    chain,
    StakingType.POOLED
  ) as NominationPoolDataType[];
  const {
    filterSelectionMap,
    onApplyFilter,
    onChangeFilterOption,
    onCloseFilterModal,
    selectedFilters,
  } = useFilterModal(FILTER_MODAL_ID);

  const nominationPoolValueList = useMemo((): string[] => {
    return (
      nominatorMetadata[0]?.nominations.map((item) => item.validatorAddress) ||
      []
    );
  }, [nominatorMetadata]);

  const filteredList = useMemo(() => {
    return getFilteredList(items, selectedFilters);
  }, [items, selectedFilters]);

  const isDisabled = useMemo(
    () => disabled || !!nominationPoolValueList.length || !items.length,
    [disabled, items.length, nominationPoolValueList.length]
  );

  const [viewDetailItem, setViewDetailItem] = useState<
    NominationPoolDataType | undefined
  >(undefined);
  const [sortSelection, setSortSelection] = useState<string>("");

  const _onSelectItem = useCallback(
    (value: string) => {
      onChange && onChange({ target: { value } });
    },
    [onChange]
  );

  const searchFunction = useCallback(
    (item: NominationPoolDataType, searchText: string) => {
      const searchTextLowerCase = searchText.toLowerCase();

      return (
        item.address.toLowerCase().includes(searchTextLowerCase) ||
        (item.name
          ? item.name.toLowerCase().includes(searchTextLowerCase)
          : false)
      );
    },
    []
  );

  const onClickMore = useCallback(
    (item: NominationPoolDataType) => {
      return (e: SyntheticEvent) => {
        e.stopPropagation();
        setViewDetailItem(item);
        activeModal(PoolDetailModalId);
      };
    },
    [activeModal]
  );

  const onClickLightningBtn = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      const poolId = PREDEFINED_STAKING_POOL[chain];

      poolId !== undefined &&
        onChange &&
        onChange({ target: { value: String(poolId) } });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [chain]
  );

  const renderItem = useCallback(
    (item: NominationPoolDataType) => {
      return (
        <StakingPoolItem
          {...item}
          className={"pool-item"}
          onClickMoreBtn={onClickMore(item)}
        />
      );
    },
    [onClickMore]
  );

  const closeSortingModal = useCallback(() => {
    inactiveModal(SORTING_MODAL_ID);
  }, [inactiveModal]);

  const renderSelected = useCallback((item: NominationPoolDataType) => {
    return (
      <div className={"__selected-item"}>
        <div className={"__selected-item-name common-text"}>
          {item.name || toShort(item.address)}
        </div>
      </div>
    );
  }, []);

  const onChangeSortOpt = useCallback(
    (value: string) => {
      setSortSelection(value);
      closeSortingModal();
    },
    [closeSortingModal]
  );

  const onClickActionBtn = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  const onCloseDetail = useCallback(() => {
    inactiveModal(PoolDetailModalId);
  }, [inactiveModal]);

  useEffect(() => {
    onChange && onChange({ target: { value: nominationPoolValueList[0] } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nominationPoolValueList]);

  return (
    <>
      <SelectModal
        actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
        className={`${className} modal-full`}
        closeIcon={<Icon phosphorIcon={CaretLeft} size="md" />}
        disabled={isDisabled}
        id={id}
        inputClassName={`${className} pool-selector-input`}
        itemKey={"idStr"}
        items={filteredList}
        label={label}
        loading={loading}
        onClickActionBtn={onClickActionBtn}
        onSelect={_onSelectItem}
        placeholder={placeholder || t("Select pool")}
        prefix={
          <Avatar
            size={20}
            theme={
              value
                ? isEthereumAddress(value)
                  ? "ethereum"
                  : "polkadot"
                : undefined
            }
            value={value}
          />
        }
        renderItem={renderItem}
        renderSelected={renderSelected}
        renderWhenEmpty={renderEmpty}
        rightIconProps={{
          icon: <Icon phosphorIcon={SortAscending} />,
          onClick: () => {
            activeModal(SORTING_MODAL_ID);
          },
        }}
        searchFunction={searchFunction}
        searchPlaceholder={t<string>("Search validator")}
        searchableMinCharactersCount={2}
        selected={value || ""}
        showActionBtn
        statusHelp={statusHelp}
        suffix={
          <div className="select-pool-suffix">
            <Button
              disabled={isDisabled}
              icon={<Icon phosphorIcon={Book} size="sm" />}
              onClick={onClickBookBtn}
              size="xs"
              type="ghost"
            />
            <Button
              disabled={isDisabled}
              icon={<Icon phosphorIcon={Lightning} size="sm" />}
              onClick={onClickLightningBtn}
              size="xs"
              type="ghost"
            />
          </div>
        }
        title={label || placeholder || t("Select pool")}
      />

      <FilterModal
        id={FILTER_MODAL_ID}
        onApplyFilter={onApplyFilter}
        onCancel={onCloseFilterModal}
        onChangeOption={onChangeFilterOption}
        optionSelectionMap={filterSelectionMap}
        options={filterOptions}
      />

      <SortingModal
        id={SORTING_MODAL_ID}
        onCancel={closeSortingModal}
        onChangeOption={onChangeSortOpt}
        optionSelection={sortSelection}
        options={sortingOptions}
      />

      <PoolDetailModal
        decimals={0}
        onCancel={onCloseDetail}
        selectedNominationPool={viewDetailItem}
        status={"active"}
      />
    </>
  );
};

const PoolSelector = styled(forwardRef(Component))<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".ant-sw-modal-header": {
        paddingTop: token.paddingXS,
        paddingBottom: token.paddingLG,
      },

      ".ant-sw-modal-content": {
        paddingBottom: token.padding,
      },

      "&.pool-selector-input": {
        ".__selected-item": {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: token.colorTextLight1,
          whiteSpace: "nowrap",
          overflow: "hidden",
        },
        ".__selected-item-name": {
          textOverflow: "ellipsis",
          fontWeight: token.headingFontWeight,
          overflow: "hidden",
        },
        ".ant-select-modal-input-wrapper": {
          paddingTop: 0,
          paddingBottom: token.paddingXXS,
        },
      },

      ".ant-select-modal-input-wrapper": {
        height: 44,
      },

      ".select-pool-suffix": {
        marginRight: -token.marginSM + 2,
      },
    };
  }
);

export default PoolSelector;
