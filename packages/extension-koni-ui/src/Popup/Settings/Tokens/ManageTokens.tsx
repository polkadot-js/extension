// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainAsset } from '@subwallet/chain-list/types';
import { _getAssetType, _isAssetFungibleToken, _isCustomAsset, _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import TokenItemFooter from '@subwallet/extension-koni-ui/Popup/Settings/Tokens/component/TokenItemFooter';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ButtonProps, Checkbox, SwList } from '@subwallet/react-ui';
import { CheckboxChangeEvent } from '@subwallet/react-ui/es/checkbox';
import Icon from '@subwallet/react-ui/es/icon';
import PageIcon from '@subwallet/react-ui/es/page-icon';
import SwModal from '@subwallet/react-ui/es/sw-modal';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import TokenItem from '@subwallet/react-ui/es/web3-block/token-item';
import CN from 'classnames';
import { Coin, FadersHorizontal, Plus } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import Layout from '../../../components/Layout';
import {AssetSetting} from "@subwallet/extension-base/background/KoniTypes";

type Props = ThemeProps

const TOKENS_PER_PAGE = 10;

enum FilterValue {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  CUSTOM = 'custom'
}

const FILTER_OPTIONS = [
  { label: 'Enabled tokens', value: FilterValue.ENABLED },
  { label: 'Disabled tokens', value: FilterValue.DISABLED },
  { label: 'Custom tokens', value: FilterValue.CUSTOM }
];

function filterFungibleTokens (assetRegistry: Record<string, _ChainAsset>, assetSettingMap: Record<string, AssetSetting>, filters: FilterValue[]): _ChainAsset[] {
  const filteredTokenList: _ChainAsset[] = [];

  Object.values(assetRegistry).forEach((chainAsset) => {
    let isValidationPassed = filters.length <= 0;

    for (const filter of filters) {
      switch (filter) { // TODO: add filter to ENABLED and DISABLED
        case FilterValue.CUSTOM:
          isValidationPassed = _isCustomAsset(chainAsset.slug);
          break;
        case FilterValue.ENABLED:
          isValidationPassed = assetSettingMap[chainAsset.slug] && assetSettingMap[chainAsset.slug].visible;
          break;
        case FilterValue.DISABLED:
          isValidationPassed = !assetSettingMap[chainAsset.slug] || !assetSettingMap[chainAsset.slug].visible;
          break;
        default:
          isValidationPassed = false;
          break;
      }

      if (isValidationPassed) {
        break; // only need to satisfy 1 filter (OR)
      }
    }

    if (_isAssetFungibleToken(chainAsset) && isValidationPassed) {
      filteredTokenList.push(chainAsset);
    }
  });

  return filteredTokenList;
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { token } = useTheme() as Theme;
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const [selectedFilters, setSelectedFilters] = useState<FilterValue[]>([]);
  const [changeFilters, setChangeFilters] = useState<FilterValue[]>(selectedFilters);

  const { assetRegistry, assetSettingMap } = useSelector((state: RootState) => state.assetRegistry);

  const [fungibleTokenList, setFungibleTokenList] = useState<_ChainAsset[]>([]);
  const allFungibleTokens = useMemo(() => {
    return filterFungibleTokens(assetRegistry, assetSettingMap, selectedFilters);
  }, [assetRegistry, selectedFilters]);

  const [paging, setPaging] = useState(TOKENS_PER_PAGE);

  useEffect(() => {
    setFungibleTokenList(allFungibleTokens.slice(0, TOKENS_PER_PAGE));
    setPaging(TOKENS_PER_PAGE);
  }, [allFungibleTokens]);

  const hasMore = useMemo(() => {
    return allFungibleTokens.length > fungibleTokenList.length;
  }, [allFungibleTokens.length, fungibleTokenList.length]);

  const loadMoreTokens = useCallback(() => {
    setTimeout(() => { // delayed to avoid lagging on scroll
      if (hasMore) {
        const nextPaging = paging + TOKENS_PER_PAGE;
        const to = nextPaging > allFungibleTokens.length ? allFungibleTokens.length : nextPaging;

        setFungibleTokenList(allFungibleTokens.slice(0, to));
        setPaging(nextPaging);
      }
    }, 50);
  }, [allFungibleTokens, hasMore, paging]);

  const searchToken = useCallback((token: _ChainAsset, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      token.name.toLowerCase().includes(searchTextLowerCase) ||
      token.symbol.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const renderTokenRightItem = useCallback((tokenInfo: _ChainAsset) => {
    const assetSetting = assetSettingMap[tokenInfo.slug];

    return (
      <TokenItemFooter
        assetSetting={assetSetting}
        navigate={navigate}
        tokenInfo={tokenInfo}
      />
    );
  }, [assetSettingMap, navigate]);

  const renderTokenItem = useCallback((tokenInfo: _ChainAsset) => {
    return (
      <TokenItem
        isShowSubLogo={true}
        key={tokenInfo.slug}
        name={tokenInfo.symbol}
        rightItem={renderTokenRightItem(tokenInfo)}
        subName={tokenInfo.originChain}
        subNetworkKey={tokenInfo.originChain}
        symbol={tokenInfo.symbol.toLowerCase()}
        withDivider={true}
      />
    );
  }, [renderTokenRightItem]);

  const emptyTokenList = useCallback(() => {
    return (
      <div className={'manage_tokens__empty_container'}>
        <div className={'manage_tokens__empty_icon_wrapper'}>
          <PageIcon
            color={token['gray-3']}
            iconProps={{
              phosphorIcon: Coin,
              weight: 'fill'
            }}
          />
        </div>

        <div className={'manage_tokens__empty_text_container'}>
          <div className={'manage_tokens__empty_title'}>{t<string>('No token')}</div>
          <div className={'manage_tokens__empty_subtitle'}>{t<string>('Your token will appear here.')}</div>
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
          navigate('/settings/tokens/import', { state: { isExternalRequest: false } });
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
        <span className={'manage_tokens__token_filter_button'}>{t('Apply filter')}</span>
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
      className={`manage_tokens ${className}`}
      resolve={dataContext.awaitStores(['assetRegistry'])}
    >
      <Layout.Base
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Manage tokens')}
      >
        <SwList.Section
          actionBtnIcon={<Icon
            customSize={'20px'}
            phosphorIcon={FadersHorizontal}
            size='sm'
            type='phosphor'
            weight={'fill'}
          />}
          className={'manage_tokens__container'}
          enableSearchInput={true}
          gridGap={'14px'}
          list={fungibleTokenList}
          minColumnWidth={'172px'}
          onClickActionBtn={openFilterModal}
          pagination={{
            hasMore,
            loadMore: loadMoreTokens
          }}
          renderItem={renderTokenItem}
          renderOnScroll={false}
          renderWhenEmpty={emptyTokenList}
          searchFunction={searchToken}
          searchPlaceholder={t<string>('Search token')}
          showActionBtn={true}
        />

        <SwModal
          className={CN('manage_tokens__token_filter_modal')}
          footer={filterModalFooter()}
          id={'filterTokenModal'}
          onCancel={closeFilterModal}
          onOk={closeFilterModal}
          title={t<string>('Filter')}
          wrapClassName={className}
        >
          <div className={'manage_tokens__filter_option_wrapper'}>
            {
              FILTER_OPTIONS.map((filterOption) => {
                return (
                  <div
                    className={'manage_tokens__filter_option'}
                    key={filterOption.label}
                  >
                    <Checkbox
                      checked={changeFilters.includes(filterOption.value)}
                      onChange={onChangeFilterOption}
                      value={filterOption.value}
                    >
                      <span className={'manage_tokens__filter_option_label'}>{filterOption.label}</span>
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

const ManageTokens = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&__inner': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.manage_tokens__container': {
      paddingTop: 14,
      flex: 1
    },

    '.manage_tokens__empty_container': {
      marginTop: 44,
      display: 'flex',
      flexWrap: 'wrap',
      gap: token.padding,
      flexDirection: 'column',
      alignContent: 'center'
    },

    '.manage_tokens__empty_text_container': {
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap'
    },

    '.manage_tokens__empty_title': {
      fontWeight: token.headingFontWeight,
      textAlign: 'center',
      fontSize: token.fontSizeLG,
      color: token.colorText
    },

    '.manage_tokens__empty_subtitle': {
      marginTop: 6,
      textAlign: 'center',
      color: token.colorTextTertiary
    },

    '.manage_tokens__empty_icon_wrapper': {
      display: 'flex',
      justifyContent: 'center'
    },

    '.manage_tokens__token_filter_button': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      fontWeight: token.headingFontWeight
    },

    '.manage_tokens__filter_option_wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginLG
    },

    '.manage_tokens__filter_option': {
      width: '100%'
    },

    '.manage_tokens__filter_option_label': {
      color: token.colorTextLight1
    },

    '.ant-web3-block': {
      cursor: 'default'
    },

    '.manage_tokens__right_item_container': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  });
});

export default ManageTokens;
