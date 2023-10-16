// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo } from '@subwallet/extension-base/background/KoniTypes';
import { useSelectModalInputHelper, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, InputRef, Logo, Web3Block } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { ForwardedRef, forwardRef, useCallback, useEffect, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

import { GeneralEmptyList } from '../EmptyList';
import { BaseSelectModal } from '../Modal';
import { BasicInputWrapper } from './Base';

interface Props extends ThemeProps, BasicInputWrapper {
  items: YieldPoolInfo[];
  showChainInSelected?: boolean;
}

const renderEmpty = () => <GeneralEmptyList />;

function Component (props: Props, ref: ForwardedRef<InputRef>): React.ReactElement<Props> {
  const { className = '', disabled, id = 'token-select', items, label, placeholder, showChainInSelected = false, statusHelp, tooltip, value } = props;
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { onSelect } = useSelectModalInputHelper(props, ref);

  const chainLogo = useMemo(() => {
    const chainInfo = items.find((x) => x.slug === value);

    return chainInfo &&
      (
        <Logo
          className='token-logo'
          network={chainInfo.chain}
          shape='squircle'
          size={token.controlHeightSM}
        />
      );
  }, [token.controlHeightSM, items, value]);

  const renderMethodSelected = useCallback((item: YieldPoolInfo) => {
    return (
      <div className={'__selected-item'}>
        {item.name}
        {showChainInSelected}
      </div>
    );
  }, [showChainInSelected]);

  const searchFunction = useCallback((item: YieldPoolInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return item.name.toLowerCase().includes(searchTextLowerCase);
  }, []);

  const renderItem = useCallback((item: YieldPoolInfo, selected: boolean) => {
    return (
      <Web3Block
        className={CN('earning-method-item', { selected: selected })}
        leftItem={(
          <Logo
            network={item.chain}
            size={36}
          />
        )}
        middleItem={(
          <div className='token-info-container'>
            <div className='token-symbol'>
              {item.name}
            </div>
            {/* <Tag bgType={'default'} color={TagTypes()[item.type].color}  icon={TagTypes()[item.type].icon}>{TagTypes()[item.type].label}</Tag> */}
          </div>
        )}
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
      />
    );
  }, [token.colorSuccess]);

  useEffect(() => {
    if (!value) {
      onSelect(items[0]?.slug || '');
    } else {
      const existed = items.find((item) => item.slug === value);

      if (!existed) {
        onSelect(items[0]?.slug || '');
      }
    }
  }, [value, items, onSelect]);

  return (
    <BaseSelectModal
      className={`${className} chain-selector-modal`}
      disabled={disabled}
      id={id}
      inputClassName={`${className} chain-selector-input`}
      itemKey={'slug'}
      items={items}
      label={label}
      onSelect={onSelect}
      placeholder={placeholder || t('Select protocol')}
      prefix={value !== '' && chainLogo}
      renderItem={renderItem}
      renderSelected={renderMethodSelected}
      renderWhenEmpty={renderEmpty}
      searchFunction={searchFunction}
      searchMinCharactersCount={2}
      searchPlaceholder={t<string>('Enter protocol name')}
      selected={value || ''}
      statusHelp={statusHelp}
      title={label || placeholder || t('Select protocol')}
      tooltip={tooltip}
    />
  );
}

export const EarningMethodSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
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

    '.token-symbol': {
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextBase
    },

    '.token-original-chain': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextDescription
    },

    '.earning-method-item': {
      borderRadius: token.borderRadiusLG,
      backgroundColor: token.colorBgSecondary,

      '&.selected, &:hover': {
        backgroundColor: token.colorBgInput
      },

      '.ant-web3-block-right-item': {
        marginRight: 0
      }
    }
  });
});
