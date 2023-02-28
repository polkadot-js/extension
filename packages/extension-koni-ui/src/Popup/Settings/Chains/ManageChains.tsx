// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEvmCompatible, _isCustomChain, _isSubstrateChain } from '@subwallet/extension-base/services/chain-service/utils';
import ChainItemFooter from '@subwallet/extension-koni-ui/components/ChainItemFooter';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ButtonProps, Checkbox, NetworkItem, SwList } from '@subwallet/react-ui';
import { CheckboxChangeEvent } from '@subwallet/react-ui/es/checkbox';
import Icon from '@subwallet/react-ui/es/icon';
import PageIcon from '@subwallet/react-ui/es/page-icon';
import SwModal from '@subwallet/react-ui/es/sw-modal';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import CN from 'classnames';
import { FadersHorizontal, ListChecks, Plus } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import Layout from '../../../components/Layout';

type Props = ThemeProps

enum FilterValue {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  CUSTOM = 'custom',
  SUBSTRATE = 'substrate',
  EVM = 'evm'
}

const FILTER_OPTIONS = [
  { label: 'EVM chains', value: FilterValue.EVM },
  { label: 'Substrate chains', value: FilterValue.SUBSTRATE },
  { label: 'Custom chains', value: FilterValue.CUSTOM },
  { label: 'Enabled chains', value: FilterValue.ENABLED },
  { label: 'Disabled chains', value: FilterValue.DISABLED }
];

function filterChains (chainInfoMap: Record<string, _ChainInfo>, chainStateMap: Record<string, _ChainState>, filters: FilterValue[]): _ChainInfo[] {
  const filteredChainList: _ChainInfo[] = [];

  Object.values(chainInfoMap).forEach((chainInfo) => {
    let isValidationPassed = filters.length <= 0;

    for (const filter of filters) {
      switch (filter) {
        case FilterValue.CUSTOM:
          isValidationPassed = _isCustomChain(chainInfo.slug);
          break;
        case FilterValue.ENABLED:
          isValidationPassed = chainStateMap[chainInfo.slug].active;
          break;
        case FilterValue.DISABLED:
          isValidationPassed = !chainStateMap[chainInfo.slug].active;
          break;
        case FilterValue.SUBSTRATE:
          isValidationPassed = _isSubstrateChain(chainInfo);
          break;
        case FilterValue.EVM:
          isValidationPassed = _isChainEvmCompatible(chainInfo);
          break;
        default:
          isValidationPassed = false;
          break;
      }

      if (isValidationPassed) {
        break; // only need to satisfy 1 filter (OR)
      }
    }

    if (isValidationPassed) {
      filteredChainList.push(chainInfo);
    }
  });

  return filteredChainList;
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const [selectedFilters, setSelectedFilters] = useState<FilterValue[]>([]);
  const [changeFilters, setChangeFilters] = useState<FilterValue[]>(selectedFilters);

  const { chainInfoMap, chainStateMap } = useSelector((state: RootState) => state.chainStore);

  const allChains = useMemo(() => {
    return filterChains(chainInfoMap, chainStateMap, selectedFilters);
  }, [chainInfoMap, chainStateMap, selectedFilters]);

  const searchToken = useCallback((chainInfo: _ChainInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      chainInfo.name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const renderNetworkRightItem = useCallback((chainInfo: _ChainInfo) => {
    const chainState = chainStateMap[chainInfo.slug];

    return (
      <ChainItemFooter
        chainInfo={chainInfo}
        chainState={chainState}
        navigate={navigate}
        showDetailNavigation={true}
      />
    );
  }, [chainStateMap, navigate]);

  const renderChainItem = useCallback((chainInfo: _ChainInfo) => {
    return (
      <NetworkItem
        isShowSubLogo={true}
        key={chainInfo.slug}
        name={chainInfo.name}
        networkKey={chainInfo.slug}
        rightItem={renderNetworkRightItem(chainInfo)}
        withDivider={true}
      />
    );
  }, [renderNetworkRightItem]);

  const emptyTokenList = useCallback(() => {
    return (
      <div className={'manage_chains__empty_container'}>
        <div className={'manage_chains__empty_icon_wrapper'}>
          <PageIcon
            color={token['gray-3']}
            iconProps={{
              phosphorIcon: ListChecks,
              weight: 'fill'
            }}
          />
        </div>

        <div className={'manage_chains__empty_text_container'}>
          <div className={'manage_chains__empty_title'}>{t<string>('No chain found')}</div>
          <div className={'manage_chains__empty_subtitle'}>{t<string>('Your chain will appear here.')}</div>
        </div>
      </div>
    );
  }, [t, token]);

  const subHeaderButton: ButtonProps[] = useMemo(() => {
    return [
      {
        icon: <Icon
          phosphorIcon={Plus}
          size='sm'
          type='phosphor'
        />,
        onClick: () => {
          navigate('/settings/chains/import', { state: { isExternalRequest: false } });
        }
      }
    ];
  }, [navigate]);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const openFilterModal = useCallback(() => {
    activeModal('filterTokenModal');
  }, [activeModal]);

  const closeFilterModal = useCallback(() => {
    inactiveModal('filterTokenModal');
  }, [inactiveModal]);

  const onApplyFilter = useCallback(() => {
    inactiveModal('filterTokenModal');
    setSelectedFilters(changeFilters);
  }, [changeFilters, inactiveModal]);

  const filterModalFooter = useCallback(() => {
    return (
      <Button
        block={true}
        icon={<Icon
          phosphorIcon={FadersHorizontal}
          type='phosphor'
          weight={'bold'}
        />}
        onClick={onApplyFilter}
      >
        <span className={'manage_chains__token_filter_button'}>{t('Apply filter')}</span>
      </Button>
    );
  }, [t, onApplyFilter]);

  const onChangeFilterOption = useCallback((e: CheckboxChangeEvent) => {
    const changedValue = e.target.value as FilterValue;

    if (e.target.checked) {
      setChangeFilters([...changeFilters, changedValue]);
    } else {
      const newSelectedFilters: FilterValue[] = [];

      changeFilters.forEach((filterValue) => {
        if (filterValue !== changedValue) {
          newSelectedFilters.push(filterValue);
        }
      });

      setChangeFilters(newSelectedFilters);
    }
  }, [changeFilters]);

  return (
    <PageWrapper
      className={`manage_chains ${className}`}
      resolve={dataContext.awaitStores(['chainStore'])}
    >
      <Layout.Base
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Manage chains')}
      >
        <SwList.Section
          actionBtnIcon={<Icon
            customSize={'20px'}
            phosphorIcon={FadersHorizontal}
            size='sm'
            type='phosphor'
            weight={'fill'}
          />}
          className={'manage_chains__container'}
          enableSearchInput={true}
          ignoreScrollbar={allChains.length > 2}
          list={allChains}
          mode={'boxed'}
          onClickActionBtn={openFilterModal}
          renderItem={renderChainItem}
          renderOnScroll={true}
          renderWhenEmpty={emptyTokenList}
          searchFunction={searchToken}
          searchMinCharactersCount={1}
          searchPlaceholder={t<string>('Search chain')}
          showActionBtn={true}
        />

        <SwModal
          className={CN('manage_chains__token_filter_modal')}
          footer={filterModalFooter()}
          id={'filterTokenModal'}
          onCancel={closeFilterModal}
          onOk={closeFilterModal}
          title={t<string>('Filter')}
          wrapClassName={className}
        >
          <div className={'manage_chains__filter_option_wrapper'}>
            {
              FILTER_OPTIONS.map((filterOption) => {
                return (
                  <div
                    className={'manage_chains__filter_option'}
                    key={filterOption.label}
                  >
                    <Checkbox
                      checked={changeFilters.includes(filterOption.value)}
                      onChange={onChangeFilterOption}
                      value={filterOption.value}
                    >
                      <span className={'manage_chains__filter_option_label'}>{filterOption.label}</span>
                    </Checkbox>
                  </div>
                );
              })
            }
          </div>
        </SwModal>
      </Layout.Base>
    </PageWrapper>
  );
}

const ManageChains = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&__inner': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.manage_chains__container': {
      paddingTop: 14,
      flex: 1
    },

    '.manage_chains__empty_container': {
      marginTop: 44,
      display: 'flex',
      flexWrap: 'wrap',
      gap: token.padding,
      flexDirection: 'column',
      alignContent: 'center'
    },

    '.manage_chains__empty_text_container': {
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap'
    },

    '.manage_chains__empty_title': {
      fontWeight: token.headingFontWeight,
      textAlign: 'center',
      fontSize: token.fontSizeLG,
      color: token.colorText
    },

    '.manage_chains__empty_subtitle': {
      marginTop: 6,
      textAlign: 'center',
      color: token.colorTextTertiary
    },

    '.manage_chains__empty_icon_wrapper': {
      display: 'flex',
      justifyContent: 'center'
    },

    '.manage_chains__token_filter_button': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      fontWeight: token.headingFontWeight
    },

    '.manage_chains__filter_option_wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginLG
    },

    '.manage_chains__filter_option': {
      width: '100%'
    },

    '.manage_chains__filter_option_label': {
      color: token.colorTextLight1
    },

    '.ant-web3-block': {
      cursor: 'default'
    },

    '.manage_chains__right_item_container': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  });
});

export default ManageChains;
