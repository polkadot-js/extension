// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useAccountAvatarInfo from '@subwallet/extension-koni-ui/hooks/account/useAccountAvatarInfo';
import useAccountAvatarTheme from '@subwallet/extension-koni-ui/hooks/account/useAccountAvatarTheme';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { AccountSignMode, PhosphorIcon } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Logo } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import CN from 'classnames';
import { CheckCircle, Eye, PuzzlePiece, QrCode, Swatches } from 'phosphor-react';
import React, { Context, useCallback, useContext, useMemo } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

import useGetAccountSignModeByAddress from '../../../../hooks/account/useGetAccountSignModeByAddress';

interface AbstractIcon {
  type: 'icon' | 'node',
  value: PhosphorIcon | React.ReactNode
}

interface SwIconProps extends AbstractIcon {
  type: 'icon',
  value: PhosphorIcon
}

interface NodeIconProps extends AbstractIcon {
  type: 'node',
  value: React.ReactNode
}
type IconProps = SwIconProps | NodeIconProps;
export interface _AccountCardItem {
  className?: string;
  isSelected?: boolean;
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
  const { address: formattedAddress } = useAccountAvatarInfo(address ?? '', preventPrefix, genesisHash, givenType);

  const avatarTheme = useAccountAvatarTheme(address || '');

  const truncatedAddress = formattedAddress ? `${formattedAddress.substring(0, 9)}...${formattedAddress.slice(-9)}` : '';
  const _onSelect = useCallback(() => {
    onClick && onClick(address || '');
  },
  [address, onClick]
  );
  const signMode = useGetAccountSignModeByAddress(address);
  // const isMantaPayEnabled = useIsMantaPayEnabled(address);
  const iconProps: IconProps | undefined = useMemo((): IconProps | undefined => {
    switch (signMode) {
      case AccountSignMode.LEGACY_LEDGER:
      case AccountSignMode.GENERIC_LEDGER:
        return {
          type: 'icon',
          value: Swatches
        };
      case AccountSignMode.QR:
        return {
          type: 'icon',
          value: QrCode
        };
      case AccountSignMode.READ_ONLY:
        return {
          type: 'icon',
          value: Eye
        };
      case AccountSignMode.INJECTED:
        // if (source === 'SubWallet') {
        //   return {
        //     type: 'node',
        //     value: (
        //       <Image
        //         className='logo-image'
        //         height='var(--height)'
        //         shape='square'
        //         src={'/images/subwallet/gradient-logo.png'}
        //       />
        //     )
        //   };
        // }

        return {
          type: 'icon',
          value: PuzzlePiece
        };
    }

    return undefined;
  }, [signMode]);

  return (
    <>
      <div
        className={CN(props.className, { '-selected': isSelected })}
        onClick={disabled ? undefined : _onSelect}
      >
        <div className='__item-left-part'>
          <SwAvatar
            isShowSubIcon={true}
            size={40}
            subIcon={ (
              <Logo
                network={avatarTheme}
                shape={'circle'}
                size={16}
              />
            )}
            theme={avatarTheme}
            value={formattedAddress || ''}
          />
        </div>
        <div className='__item-center-part'>
          <div className={'middle-item__name-wrapper'}>
            <div className='__item-name'>{accountName}</div>
            <div className='__item-address'>{truncatedAddress}</div>
          </div>
        </div>

        <div className={'__item-right-part'}>
          {iconProps && (
            <Button
              icon={
                iconProps.type === 'icon'
                  ? (
                    <Icon
                      phosphorIcon={iconProps.value}
                      size='sm'
                    />
                  )
                  : iconProps.value
              }
              size='xs'
              type='ghost'
            />
          )}
          {(showUnSelectedIcon || isSelected) && (
            <Icon
              className={'__select-icon'}
              iconColor={isSelected ? token.colorSuccess : token.colorTextLight4}
              phosphorIcon={CheckCircle}
              size={'sm'}
              weight={'fill'}
            />
          )}
        </div>
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
    borderRadius: token.borderRadiusLG,
    alignItems: 'center',
    display: 'flex',
    cursor: 'pointer',
    transition: `background ${token.motionDurationMid} ease-in-out`,
    marginTop: token.marginXS,
    '&.-selected': {
      backgroundColor: token.colorBgInput
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
      justifyContent: 'center'
    },
    '.__select-icon.__select-icon': {
      minWidth: 40,
      display: 'flex',
      justifyContent: 'center',
      marginRight: -8
    },
    '&:hover': {
      background: token.colorBgInput
    }
  };
});

export default ExportAllSelectItem;
