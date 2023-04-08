// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from "@subwallet/extension-base/background/KoniTypes";
import { _STAKING_CHAIN_GROUP } from "@subwallet/extension-base/services/chain-service/constants";
import { BasicInputWrapper } from "@subwallet-webapp/components/Field/Base";
import { FilterModal } from "@subwallet-webapp/components/Modal/FilterModal";
import { SortingModal } from "@subwallet-webapp/components/Modal/SortingModal";
import {
  ValidatorDetailModal,
  ValidatorDetailModalId,
} from "@subwallet-webapp/components/Modal/Staking/ValidatorDetailModal";
import StakingValidatorItem from "@subwallet-webapp/components/StakingItem/StakingValidatorItem";
import { useFilterModal } from "@subwallet-webapp/hooks/modal/useFilterModal";
import { useSelectValidators } from "@subwallet-webapp/hooks/modal/useSelectValidators";
import useGetChainStakingMetadata from "@subwallet-webapp/hooks/screen/staking/useGetChainStakingMetadata";
import useGetNominatorInfo from "@subwallet-webapp/hooks/screen/staking/useGetNominatorInfo";
import useGetValidatorList, {
  ValidatorDataType,
} from "@subwallet-webapp/hooks/screen/staking/useGetValidatorList";
import { ThemeProps } from "@subwallet-webapp/types";
import { getValidatorKey } from "@subwallet-webapp/util/transaction/stake";
import {
  Button,
  Icon,
  InputRef,
  SwList,
  SwModal,
  useExcludeModal,
} from "@subwallet/react-ui";
import { ModalContext } from "@subwallet/react-ui/es/sw-modal/provider";
import {
  CaretLeft,
  CheckCircle,
  FadersHorizontal,
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

import GeneralEmptyList from "../GeneralEmptyList";
import SelectValidatorInput from "../SelectValidatorInput";

interface Props extends ThemeProps, BasicInputWrapper {
  chain: string;
  from: string;
  onClickBookBtn?: (e: SyntheticEvent) => void;
  onClickLightningBtn?: (e: SyntheticEvent) => void;
  isSingleSelect?: boolean;
}

const SORTING_MODAL_ID = "nominated-sorting-modal";
const FILTER_MODAL_ID = "nominated-filter-modal";

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
    value: "1",
  },
  {
    label: "Waiting list",
    value: "2",
  },
  {
    label: "Locked",
    value: "3",
  },
  {
    label: "Destroying",
    value: "4",
  },
];

const renderEmpty = () => <GeneralEmptyList />;
const defaultModalId = "multi-validator-selector";

const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const {
    chain,
    className = "",
    from,
    id = defaultModalId,
    isSingleSelect: _isSingleSelect = false,
    onChange,
    value,
    loading,
  } = props;
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  useExcludeModal(id);

  const items = useGetValidatorList(
    chain,
    StakingType.NOMINATED
  ) as ValidatorDataType[];
  const nominatorMetadata = useGetNominatorInfo(
    chain,
    StakingType.NOMINATED,
    from
  );
  const chainStakingMetadata = useGetChainStakingMetadata(chain);

  const maxCount = chainStakingMetadata?.maxValidatorPerNominator || 1;

  const isRelayChain = useMemo(
    () => _STAKING_CHAIN_GROUP.relay.includes(chain),
    [chain]
  );
  const nominations = useMemo(
    () => nominatorMetadata[0]?.nominations,
    [nominatorMetadata]
  );
  const isSingleSelect = useMemo(
    () => _isSingleSelect || !isRelayChain,
    [_isSingleSelect, isRelayChain]
  );

  const nominatorValueList = useMemo(() => {
    return nominations && nominations.length
      ? nominations.map((item) =>
          getValidatorKey(item.validatorAddress, item.validatorIdentity)
        )
      : [];
  }, [nominations]);

  const [viewDetailItem, setViewDetailItem] = useState<
    ValidatorDataType | undefined
  >(undefined);
  const [sortSelection, setSortSelection] = useState<string>("");
  const {
    filterSelectionMap,
    onApplyFilter,
    onChangeFilterOption,
    onCloseFilterModal,
    selectedFilters,
  } = useFilterModal(FILTER_MODAL_ID);

  const filterFunction = useMemo<(item: ValidatorDataType) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      // todo: logic filter here

      return false;
    };
  }, [selectedFilters]);

  const {
    changeValidators,
    onApplyChangeValidators,
    onCancelSelectValidator,
    onChangeSelectedValidator,
    onInitValidators,
  } = useSelectValidators(id, maxCount, onChange, isSingleSelect);

  const closeSortingModal = useCallback(() => {
    inactiveModal(SORTING_MODAL_ID);
  }, [inactiveModal]);

  const onChangeSortOpt = useCallback(
    (value: string) => {
      setSortSelection(value);
      closeSortingModal();
    },
    [closeSortingModal]
  );

  const onClickItem = useCallback(
    (value: string) => {
      onChangeSelectedValidator(value);
    },
    [onChangeSelectedValidator]
  );

  const onClickMore = useCallback(
    (item: ValidatorDataType) => {
      return (e: SyntheticEvent) => {
        e.stopPropagation();
        setViewDetailItem(item);
        activeModal(ValidatorDetailModalId);
      };
    },
    [activeModal]
  );

  const renderItem = useCallback(
    (item: ValidatorDataType) => {
      const key = getValidatorKey(item.address, item.identity);
      const selected = changeValidators.includes(key);
      const nominated = nominatorValueList.includes(key);

      return (
        <StakingValidatorItem
          apy={"15"}
          className={"pool-item"}
          disabled={!isRelayChain && nominated}
          isNominated={nominated}
          isSelected={selected}
          key={item.address}
          onClick={onClickItem}
          onClickMoreBtn={onClickMore(item)}
          validatorInfo={item}
        />
      );
    },
    [
      changeValidators,
      isRelayChain,
      nominatorValueList,
      onClickItem,
      onClickMore,
    ]
  );

  const onClickActionBtn = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  const searchFunction = useCallback(
    (item: ValidatorDataType, searchText: string) => {
      const searchTextLowerCase = searchText.toLowerCase();

      return (
        item.address.toLowerCase().includes(searchTextLowerCase) ||
        (item.identity
          ? item.identity.toLowerCase().includes(searchTextLowerCase)
          : false)
      );
    },
    []
  );

  const onActiveValidatorSelector = useCallback(() => {
    activeModal(id);
  }, [activeModal, id]);

  useEffect(() => {
    const selected =
      nominations
        ?.map((item) =>
          getValidatorKey(item.validatorAddress, item.validatorIdentity)
        )
        .join(",") || "";

    onInitValidators(selected);
    onChange && onChange({ target: { value: selected } });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nominations, onInitValidators]);

  return (
    <>
      <SelectValidatorInput
        disabled={!chain || !from}
        label={t("Select validator")}
        loading={loading}
        onClick={onActiveValidatorSelector}
        value={value || ""}
      />
      <SwModal
        className={`${className} modal-full`}
        closeIcon={<Icon phosphorIcon={CaretLeft} size="md" />}
        footer={
          <Button
            block
            disabled={!changeValidators.length}
            icon={<Icon phosphorIcon={CheckCircle} weight={"fill"} />}
            onClick={onApplyChangeValidators}
          >
            {t(`Apply ${changeValidators.length} validators`)}
          </Button>
        }
        id={id}
        onCancel={onCancelSelectValidator}
        rightIconProps={{
          icon: <Icon phosphorIcon={SortAscending} />,
          onClick: () => {
            activeModal(SORTING_MODAL_ID);
          },
        }}
        title={t("Select validator")}
      >
        <SwList.Section
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          enableSearchInput={true}
          filterBy={filterFunction}
          list={items}
          onClickActionBtn={onClickActionBtn}
          renderItem={renderItem}
          renderWhenEmpty={renderEmpty}
          searchFunction={searchFunction}
          searchPlaceholder={t<string>("Search validator")}
          searchableMinCharactersCount={2}
          showActionBtn
        />
      </SwModal>

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

      {viewDetailItem && (
        <ValidatorDetailModal
          status={"active"}
          validatorItem={viewDetailItem}
        />
      )}
    </>
  );
};

const MultiValidatorSelector = styled(forwardRef(Component))<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".ant-sw-modal-header": {
        paddingTop: token.paddingXS,
        paddingBottom: token.paddingLG,
      },

      ".ant-sw-modal-body": {
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      },

      ".ant-sw-modal-footer": {
        margin: 0,
      },

      ".pool-item:not(:last-child)": {
        marginBottom: token.marginXS,
      },
    };
  }
);

export default MultiValidatorSelector;
