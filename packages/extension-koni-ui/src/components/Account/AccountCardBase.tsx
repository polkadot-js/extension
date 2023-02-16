// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _getSubstrateGenesisHash } from '@subwallet/extension-base/services/chain-service/utils';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import useAccountAvatarTheme from '@subwallet/extension-koni-ui/hooks/account/useAccountAvatarTheme';
import useAccountRecoded from '@subwallet/extension-koni-ui/hooks/account/useAccountRecoded';
import useGetAccountSignModeByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountSignModeByAddress';
import { Button, Icon, SwIconProps } from '@subwallet/react-ui';
import AccountCard, { AccountCardProps } from '@subwallet/react-ui/es/web3-block/account-card';
import { DotsThree, Eye, QrCode, Swatches } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';

import { KeypairType } from '@polkadot/util-crypto/types';

export interface _AccountCardProps extends AccountCardProps {
  className?: string;
  genesisHash?: string | null;
  type?: KeypairType;
  showMoreBtn?: boolean;
  onPressMoreBtn?: () => void;
}

function AccountCardBase (props: Partial<_AccountCardProps>): React.ReactElement<Partial<_AccountCardProps>> {
  const { accountName, address, className, genesisHash, onPressMoreBtn, showMoreBtn, type: givenType } = props;
  const { prefix } = useAccountRecoded(address || '', genesisHash, givenType);
  const avatarTheme = useAccountAvatarTheme(address || '');

  const signMode = useGetAccountSignModeByAddress(address);

  const iconProps: SwIconProps | undefined = useMemo((): SwIconProps | undefined => {
    switch (signMode) {
      case SIGN_MODE.LEDGER:
        return {
          type: 'phosphor',
          phosphorIcon: Swatches
        };
      case SIGN_MODE.QR:
        return {
          type: 'phosphor',
          phosphorIcon: QrCode
        };
      case SIGN_MODE.READ_ONLY:
        return {
          type: 'phosphor',
          phosphorIcon: Eye
        };
    }

    return undefined;
  }, [signMode]);

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
            icon={
              <Icon
                { ...iconProps}
                size='sm'
              />
            }
            size='xs'
            type='ghost'
          />
        )}

        {showMoreBtn && <Button
          icon={
            <Icon
              phosphorIcon={DotsThree}
              size='sm'
            />
          }
          onClick={_onClickMore}
          size='xs'
          type='ghost'
        />}
      </>
    );
  }, [_onClickMore, iconProps, showMoreBtn]);

  return (
    <AccountCard
      {...props}
      accountName={accountName || ''}
      address={address || ''}
      avatarIdentPrefix={prefix || 42}
      avatarTheme={avatarTheme}
      className={className}
      renderRightItem={renderRightItem}
    />
  );
}

export default AccountCardBase;
