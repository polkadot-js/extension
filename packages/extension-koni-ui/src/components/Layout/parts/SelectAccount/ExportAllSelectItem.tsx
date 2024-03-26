// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useAccountAvatarInfo from '@subwallet/extension-koni-ui/hooks/account/useAccountAvatarInfo';
import useAccountAvatarTheme from '@subwallet/extension-koni-ui/hooks/account/useAccountAvatarTheme';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { getValidatorKey } from '@subwallet/extension-koni-ui/utils';
import { BackgroundIcon, Icon, Web3Block } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { Context, useCallback, useContext } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

export interface _AccountCardItem {
  className?: string;
  onPressMoreButton?: () => void;
  source?: string;
  isSelected?: boolean;
  onClickQrButton?: (address: string) => void;
  accountName?: string;
  address?: string;
  genesisHash?: string | null;
  preventPrefix?: boolean;
  type?: KeypairType;
  showUnSelectedIcon?: boolean;
  disabled?: boolean;
  onClick?: (value: string) => void;
}

function Component (props: _AccountCardItem): React.ReactElement<_AccountCardItem> {
  const { accountName,
    address,
    disabled,
    genesisHash,
    isSelected,
    onClick,
    preventPrefix,
    showUnSelectedIcon,
    type: givenType } = props;

  const token = useContext<Theme>(ThemeContext as Context<Theme>).token;
  const { address: formattedAddress, prefix } = useAccountAvatarInfo(address ?? '', preventPrefix, genesisHash, givenType);

  const notify = useNotification();
  const { t } = useTranslation();

  const avatarTheme = useAccountAvatarTheme(address || '');

  const truncatedAddress = formattedAddress ? `${formattedAddress.substring(0, 9)}...${formattedAddress.slice(-9)}` : '';
  const _onSelect = useCallback(() => {
    onClick && onClick(getValidatorKey(address));
  },
  [address, onClick]
  );

  return (
    <>
      <div
        className={CN(props.className)}
        onClick={disabled ? undefined : _onSelect}
      >
        <Web3Block
          className={'export-all-account-item'}
          leftItem={
            <SwAvatar
              isShowSubIcon={true}
              size={40}
              subIcon={<BackgroundIcon
                backgroundColor={token.colorSuccess}
                phosphorIcon={CheckCircle}
                size={'xs'}
                weight={'fill'}
              />}
              theme={avatarTheme}
              value={formattedAddress || ''}
            />
          }
          middleItem={
            <>
              <div className={'middle-item__name-wrapper'}>
                <div className='__item-name'>{accountName}</div>
                <div className='__item-address'>{truncatedAddress}</div>
              </div>
            </>
          }

          rightItem={
            <>
              {(showUnSelectedIcon || isSelected) && <Icon
                className={'right-item__select-icon'}
                iconColor={isSelected ? token.colorSuccess : token.colorTextLight4}
                phosphorIcon={CheckCircle}
                size={'sm'}
                weight={'fill'}
              />}
            </>
          }
        />
      </div>
    </>
  );
}

const ExportAllSelectItem = styled(Component)<_AccountCardItem>(({ theme }) => {
  const { token } = theme as Theme;

  return {
    height: 68,
    background: token.colorBgSecondary,
    padding: token.paddingSM,
    paddingRight: token.paddingXXS,
    borderRadius: token.borderRadiusLG,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    cursor: 'pointer',
    transition: `background ${token.motionDurationMid} ease-in-out`,
    flex: 1,

    '.export-all-account-item': {
      display: 'flex',
      flex: 1
    },
    '.__item-left-part': {
      paddingRight: token.paddingXS
    },
    '.__item-center-part': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flex: 1
    },
    '.__item-name': {
      fontSize: token.fontSizeLG,
      color: token.colorTextLight1,
      lineHeight: token.lineHeightLG,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      'white-space': 'nowrap'
    },
    '.__item-address': {
      fontSize: token.fontSizeSM,
      color: token.colorTextLight4,
      lineHeight: token.lineHeightSM,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      'white-space': 'nowrap'
    },
    '.__item-right-part': {
      marginLeft: 'auto',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative'
    }
  };
});

export default ExportAllSelectItem;
