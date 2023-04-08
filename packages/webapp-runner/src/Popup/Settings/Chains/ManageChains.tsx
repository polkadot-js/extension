// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  _isChainEvmCompatible,
  _isCustomChain,
  _isSubstrateChain,
} from "@subwallet/extension-base/services/chain-service/utils";
import { Layout, PageWrapper } from "@subwallet-webapp/components";
import EmptyList from "@subwallet-webapp/components/EmptyList";
import { FilterModal } from "@subwallet-webapp/components/Modal/FilterModal";
import NetworkToggleItem from "@subwallet-webapp/components/NetworkToggleItem";
import { DataContext } from "@subwallet-webapp/contexts/DataContext";
import useChainInfoWithState, {
  ChainInfoWithState,
} from "@subwallet-webapp/hooks/chain/useChainInfoWithState";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import { useFilterModal } from "@subwallet-webapp/hooks/modal/useFilterModal";
import { ThemeProps } from "@subwallet-webapp/types";
import { ButtonProps, Icon, ModalContext, SwList } from "@subwallet/react-ui";
import { FadersHorizontal, ListChecks, Plus } from "phosphor-react";
import React, { SyntheticEvent, useCallback, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

type Props = ThemeProps;

const FILTER_MODAL_ID = "filterTokenModal";

enum FilterValue {
  ENABLED = "enabled",
  DISABLED = "disabled",
  CUSTOM = "custom",
  SUBSTRATE = "substrate",
  EVM = "evm",
}

const FILTER_OPTIONS = [
  { label: "EVM chains", value: FilterValue.EVM },
  { label: "Substrate chains", value: FilterValue.SUBSTRATE },
  { label: "Custom chains", value: FilterValue.CUSTOM },
  { label: "Enabled chains", value: FilterValue.ENABLED },
  { label: "Disabled chains", value: FilterValue.DISABLED },
];

function Component({ className = "" }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { activeModal } = useContext(ModalContext);
  const chainInfoList = useChainInfoWithState();
  const {
    filterSelectionMap,
    onApplyFilter,
    onChangeFilterOption,
    onCloseFilterModal,
    selectedFilters,
  } = useFilterModal(FILTER_MODAL_ID);
  const filterFunction = useMemo<(item: ChainInfoWithState) => boolean>(() => {
    return (chainInfo) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === FilterValue.CUSTOM) {
          if (_isCustomChain(chainInfo.slug)) {
            return true;
          }
        } else if (filter === FilterValue.ENABLED) {
          if (chainInfo.active) {
            return true;
          }
        } else if (filter === FilterValue.DISABLED) {
          if (!chainInfo.active) {
            return true;
          }
        } else if (filter === FilterValue.SUBSTRATE) {
          if (_isSubstrateChain(chainInfo)) {
            return true;
          }
        } else if (filter === FilterValue.EVM) {
          if (_isChainEvmCompatible(chainInfo)) {
            return true;
          }
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const searchToken = useCallback(
    (chainInfo: ChainInfoWithState, searchText: string) => {
      const searchTextLowerCase = searchText.toLowerCase();

      return chainInfo.name.toLowerCase().includes(searchTextLowerCase);
    },
    []
  );

  const renderChainItem = useCallback((chainInfo: ChainInfoWithState) => {
    return (
      <NetworkToggleItem
        chainInfo={chainInfo}
        isShowSubLogo={true}
        key={chainInfo.slug}
      />
    );
  }, []);

  const emptyTokenList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t<string>("Your chain will appear here.")}
        emptyTitle={t<string>("No chain found")}
        phosphorIcon={ListChecks}
      />
    );
  }, [t]);

  const subHeaderButton: ButtonProps[] = useMemo(() => {
    return [
      {
        icon: <Icon phosphorIcon={Plus} size="md" type="phosphor" />,
        onClick: () => {
          navigate("/settings/chains/import", {
            state: { isExternalRequest: false },
          });
        },
      },
    ];
  }, [navigate]);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const openFilterModal = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      activeModal(FILTER_MODAL_ID);
    },
    [activeModal]
  );

  return (
    <PageWrapper
      className={`manage_chains ${className}`}
      resolve={dataContext.awaitStores(["chainStore"])}
    >
      <Layout.Base
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={"transparent"}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>("Manage chains")}
      >
        <SwList.Section
          actionBtnIcon={
            <Icon phosphorIcon={FadersHorizontal} size="sm" weight={"fill"} />
          }
          className={"manage_chains__container"}
          enableSearchInput
          filterBy={filterFunction}
          list={chainInfoList}
          mode={"boxed"}
          onClickActionBtn={openFilterModal}
          renderItem={renderChainItem}
          renderWhenEmpty={emptyTokenList}
          searchFunction={searchToken}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>("Search chain")}
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
      </Layout.Base>
    </PageWrapper>
  );
}

const ManageChains = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    ".ant-sw-screen-layout-body": {
      display: "flex",
    },

    ".ant-sw-list-wrapper.ant-sw-list-wrapper:before": {
      zIndex: 0,
      borderRadius: token.borderRadiusLG,
    },

    ".ant-sw-list-section.-boxed-mode .ant-sw-list": {
      paddingLeft: token.padding,
      paddingTop: token.paddingXS,
      paddingBottom: token.paddingXS,
    },

    ".ant-sw-list-section.-boxed-mode .ant-sw-list.-ignore-scrollbar": {
      paddingRight: token.padding + 6,
    },

    ".ant-network-item.-with-divider": {
      position: "relative",
      zIndex: 1,
    },

    "&__inner": {
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },

    ".manage_chains__container": {
      paddingTop: token.padding,
      paddingBottom: token.paddingSM,
      flex: 1,
    },

    ".ant-network-item-content .__toggle-area": {
      marginRight: -token.marginXXS,

      "button + button": {
        marginLeft: token.marginXS,
      },
    },
  };
});

export default ManageChains;
