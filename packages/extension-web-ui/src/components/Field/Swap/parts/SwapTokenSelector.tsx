// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseSelectModal, GeneralEmptyList, TokenItemType } from '@subwallet/extension-web-ui/components';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { Theme, ThemeProps, TokenSelectorItemType } from '@subwallet/extension-web-ui/types';
import { Icon, Logo } from '@subwallet/react-ui';
import TokenItem from '@subwallet/react-ui/es/web3-block/token-item';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback } from 'react';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  items: TokenSelectorItemType[];
  onSelect: (value: string) => void;
  id?: string;
  placeholder?: string;
  title?: string;
  label?: string;
  disabled?: boolean;
  value?: string;
}

const renderEmpty = () => <GeneralEmptyList />;

const Component = (props: Props) => {
  const { className = '', disabled, id = 'swap-token-selector',
    items, label, onSelect, placeholder, value } = props;
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);

  const searchFunction = useCallback((item: TokenItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();
    const chainName = chainInfoMap[item.originChain]?.name?.toLowerCase();
    const symbol = item.symbol.toLowerCase();

    return (
      symbol.includes(searchTextLowerCase) ||
      chainName.includes(searchTextLowerCase)
    );
  }, [chainInfoMap]);

  const renderTokenSelected = useCallback((item: TokenItemType) => {
    return (
      <div className={'__selected-item'}>
        <Logo
          className='token-logo'
          isShowSubLogo={true}
          shape='squircle'
          size={token.sizeXL}
          subNetwork={item.originChain}
          token={item.slug.toLowerCase()}
        />
        <div className={'__item-token-info'}>
          <span>{item.symbol}</span>
          <span className={'__item-token-name'}>{chainInfoMap[item.originChain]?.name}</span>
        </div>
      </div>
    );
  }, [chainInfoMap, token.sizeXL]);

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

  return (
    <BaseSelectModal
      className={`${className} token-selector-modal`}
      disabled={disabled}
      id={id}
      inputClassName={`${className} token-selector-input`}
      itemKey={'slug'}
      items={items}
      label={label}
      onSelect={onSelect}
      placeholder={placeholder || t('Select token')}
      renderItem={renderItem}
      renderSelected={renderTokenSelected}
      renderWhenEmpty={renderEmpty}
      searchFunction={searchFunction}
      searchMinCharactersCount={2}
      searchPlaceholder={t<string>('Enter token name or network name')}
      selected={value || ''}
      title={label || placeholder || t('Select token')}
    />
  );
};

const SwapTokenSelector = styled(Component)<Props>(({ theme: { token } }: Props) => {
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
    '.__selected-item': {
      display: 'flex',
      gap: 8
    },
    '.__item-token-info': {
      display: 'flex',
      flexDirection: 'column',
      color: token.colorWhite,
      overflow: 'hidden'
    },
    '.__item-token-name': {
      color: token.colorTextTertiary,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    '.__token-selector-wrapper .ant-select-modal-input-suffix': {
      color: token.colorWhite
    },

    // TODO: delete this when fix component in ui-base
    '.token-item .ant-network-item-sub-name': {
      display: 'none'
    },

    '.token-logo': {
      bottom: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      margin: '6px 0',

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

export default SwapTokenSelector;
