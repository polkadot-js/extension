// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _isAssetFungibleToken } from '@subwallet/extension-base/services/chain-service/utils';
import { BasicInputWrapper } from '@subwallet/extension-web-ui/components/Field/Base';
import { BaseSelectModal } from '@subwallet/extension-web-ui/components/Modal/BaseSelectModal';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { useChainAssets } from '@subwallet/extension-web-ui/hooks/assets';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { useSelectModalInputHelper } from '@subwallet/extension-web-ui/hooks/form/useSelectModalInputHelper';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon, InputRef, Logo } from '@subwallet/react-ui';
import TokenItem from '@subwallet/react-ui/es/web3-block/token-item';
import { CheckCircle } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, useCallback, useEffect, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

import { GeneralEmptyList } from '../EmptyList';

// todo: use TokenSelectorItemType instead
export type TokenItemType = {
  name: string;
  slug: string;
  symbol: string;
  originChain: string;
};

interface Props extends ThemeProps, BasicInputWrapper {
  items: TokenItemType[];
  showChainInSelected?: boolean;
  prefixShape?: 'circle' | 'none' | 'squircle' | 'square';
  filterFunction?: (chainAsset: _ChainAsset) => boolean;
}

const renderEmpty = () => <GeneralEmptyList />;

const convertChainActivePriority = (active?: boolean) => active ? 1 : 0;

function Component (props: Props, ref: ForwardedRef<InputRef>): React.ReactElement<Props> {
  const { className = '', disabled, filterFunction = _isAssetFungibleToken, id = 'token-select', items, label, placeholder, showChainInSelected = false, statusHelp, tooltip, value } = props;
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;

  const assetRegistry = useChainAssets({}).chainAssetRegistry;
  const { chainInfoMap, chainStateMap } = useSelector((state) => state.chainStore);

  const { onSelect } = useSelectModalInputHelper(props, ref);

  const filteredItems = useMemo((): TokenItemType[] => {
    const raw = items.filter((item) => {
      const chainAsset = assetRegistry[item.slug];

      return chainAsset ? filterFunction(chainAsset) : false;
    });

    raw.sort((a, b) => {
      return convertChainActivePriority(chainStateMap[b.originChain]?.active) - convertChainActivePriority(chainStateMap[a.originChain]?.active);
    });

    return raw;
  }, [assetRegistry, chainStateMap, filterFunction, items]);

  const chainLogo = useMemo(() => {
    const tokenInfo = filteredItems.find((x) => x.slug === value);

    return tokenInfo &&
      (
        <Logo
          className='token-logo'
          isShowSubLogo={true}
          shape='squircle'
          size={token.controlHeightSM}
          subNetwork={tokenInfo.originChain}
          token={tokenInfo.slug.toLowerCase()}
        />
      );
  }, [filteredItems, token.controlHeightSM, value]);

  const renderTokenSelected = useCallback((item: TokenItemType) => {
    return (
      <div className={'__selected-item'}>
        {item.symbol}
        {showChainInSelected}
      </div>
    );
  }, [showChainInSelected]);

  const searchFunction = useCallback((item: TokenItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();
    const chainName = chainInfoMap[item.originChain]?.name?.toLowerCase();
    const symbol = item.symbol.toLowerCase();

    return (
      symbol.includes(searchTextLowerCase) ||
      chainName.includes(searchTextLowerCase)
    );
  }, [chainInfoMap]);

  const renderItem = useCallback((item: TokenItemType, selected: boolean) => {
    return (
      <TokenItem
        className={'token-item'}
        isShowSubLogo={true}
        middleItem={(
          <div className='token-info-container'>
            <div className='token-info'>
              <span>{item.symbol}</span>
              {
                item.name && (
                  <span className='__token-name'>
                    &nbsp;(
                    <span className='name'>{item.name}</span>
                    )
                  </span>
                )
              }
            </div>
            <div className='token-original-chain'>
              {chainInfoMap[item.originChain]?.name || item.originChain}
            </div>
          </div>
        )}
        name={item.symbol}
        networkMainLogoShape='squircle'
        networkMainLogoSize={40}
        networkSubLogoShape='circle'
        rightItem={
          selected &&
          (
            <div className={'__check-icon'}>
              <Icon
                customSize={'20px'}
                iconColor={token.colorSuccess}
                phosphorIcon={CheckCircle}
                type='phosphor'
                weight='fill'
              />
            </div>
          )
        }
        subName=''
        subNetworkKey={item.originChain}
        symbol={item.slug.toLowerCase()}
      />
    );
  }, [chainInfoMap, token.colorSuccess]);

  useEffect(() => {
    if (!value) {
      if (filteredItems[0]?.slug) {
        onSelect(filteredItems[0].slug);
      }
    } else {
      const existed = filteredItems.find((item) => item.slug === value);

      if (!existed) {
        onSelect(filteredItems[0]?.slug || '');
      }
    }
  }, [value, filteredItems, onSelect]);

  return (
    <BaseSelectModal
      className={`${className} chain-selector-modal`}
      disabled={disabled}
      id={id}
      inputClassName={`${className} chain-selector-input`}
      itemKey={'slug'}
      items={filteredItems}
      label={label}
      onSelect={onSelect}
      placeholder={placeholder || t('Select token')}
      prefix={value !== '' && chainLogo}
      renderItem={renderItem}
      renderSelected={renderTokenSelected}
      renderWhenEmpty={renderEmpty}
      searchFunction={searchFunction}
      searchMinCharactersCount={2}
      searchPlaceholder={t<string>('Enter token name or network name')}
      selected={value || ''}
      statusHelp={statusHelp}
      title={label || placeholder || t('Select token')}
      tooltip={tooltip}
    />
  );
}

export const TokenSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.ant-select-modal-input-container .ant-select-modal-input-wrapper': {
      paddingLeft: 12,
      paddingRight: 12
    },

    '&.chain-selector-input .__selected-item': {
      color: token.colorText,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      textWrap: 'nowrap',
      whiteSpace: 'nowrap'
    },

    // TODO: delete this when fix component in ui-base
    '.token-item .ant-network-item-sub-name': {
      display: 'none'
    },

    '.token-logo': {
      bottom: 0,
      right: 0,
      margin: '-1px 0',

      '.-sub-logo': {
        '.ant-image': {
          display: 'flex'
        }
      }
    },

    '.ant-network-item-content': {
      padding: token.paddingSM
    },

    '.token-item .__check-icon': {
      display: 'flex',
      width: 40,
      justifyContent: 'center'
    },

    '.token-info': {
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden',

      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      fontWeight: token.fontWeightStrong,
      color: token.colorWhite,

      '.__token-name': {
        color: token.colorTextTertiary,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',

        '.name': {
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }
      }
    },

    '.token-original-chain': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextDescription
    }
  });
});
