// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useAccountAvatarInfo from '@subwallet/extension-koni-ui/hooks/account/useAccountAvatarInfo';
import useAccountAvatarTheme from '@subwallet/extension-koni-ui/hooks/account/useAccountAvatarTheme';
import useGetAccountSignModeByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountSignModeByAddress';
import { useIsMantaPayEnabled } from '@subwallet/extension-koni-ui/hooks/account/useIsMantaPayEnabled';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { AccountSignMode } from '@subwallet/extension-koni-ui/types/account';
import { Button, Icon } from '@subwallet/react-ui';
import AccountCard, { AccountCardProps } from '@subwallet/react-ui/es/web3-block/account-card';
import { Eye, PencilSimpleLine, PuzzlePiece, QrCode, ShieldCheck, Swatches } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

export interface _AccountCardProps extends Omit<AccountCardProps, 'avatarIdentPrefix'>, ThemeProps {
  className?: string;
  genesisHash?: string | null;
  type?: KeypairType;
  showMoreBtn?: boolean;
  onPressMoreBtn?: () => void;
  preventPrefix?: boolean;
  source?: string;
  moreIcon?: PhosphorIcon;
}

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

function Component (props: _AccountCardProps): React.ReactElement<_AccountCardProps> {
  const { accountName,
    address,
    className,
    genesisHash,
    moreIcon = PencilSimpleLine,
    onPressMoreBtn,
    preventPrefix,
    showMoreBtn,
    type: givenType } = props;
  const { address: avatarAddress, prefix } = useAccountAvatarInfo(address ?? '', preventPrefix, genesisHash, givenType);
  const avatarTheme = useAccountAvatarTheme(address || '');

  const signMode = useGetAccountSignModeByAddress(address);
  const isMantaPayEnabled = useIsMantaPayEnabled(address);

  const iconProps: IconProps | undefined = useMemo((): IconProps | undefined => {
    switch (signMode) {
      case AccountSignMode.LEDGER:
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

    if (isMantaPayEnabled) {
      return {
        type: 'icon',
        value: ShieldCheck
      };
    }

    return undefined;
  }, [isMantaPayEnabled, signMode]);

  const _onClickMore: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = useCallback((event) => {
    event.stopPropagation();
    onPressMoreBtn && onPressMoreBtn();
  }, [onPressMoreBtn]);

  const renderRightItem = useCallback((x: React.ReactNode): React.ReactNode => {
    return (
      <>
        {x}
        {iconProps && (
          <Button
            className='account-type-icon'
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

        {showMoreBtn && <Button
          icon={
            <Icon
              phosphorIcon={moreIcon}
              size='sm'
            />
          }
          onClick={_onClickMore}
          size='xs'
          type='ghost'
        />}
      </>
    );
  }, [_onClickMore, iconProps, showMoreBtn, moreIcon]);

  return (
    <div className={props.className}>
      <AccountCard
        {...props}
        accountName={accountName || ''}
        address={avatarAddress}
        avatarIdentPrefix={prefix}
        avatarTheme={avatarTheme}
        className={className}
        renderRightItem={renderRightItem}
      />
    </div>
  );
}

const AccountCardBase = styled(Component)<_AccountCardProps>(({ theme: { token } }: _AccountCardProps) => {
  return {
    '.account-type-icon': {
      color: `${token['gray-4']} !important`
    },

    '.logo-image': {
      '--height': `${token.sizeLG}px`
    },

    '.ant-web3-block-middle-item': {
      overflow: 'hidden'
    },

    '.ant-account-card-name': {
      overflow: 'hidden',
      textWrap: 'nowrap',
      textOverflow: 'ellipsis'
    }
  };
});

export default AccountCardBase;
