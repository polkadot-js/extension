// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useAccountAvatarTheme from '@subwallet/extension-koni-ui/hooks/account/useAccountAvatarTheme';
import useAccountRecoded from '@subwallet/extension-koni-ui/hooks/account/useAccountRecoded';
import { Button } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import AccountCard, { AccountCardProps } from '@subwallet/react-ui/es/web3-block/account-card';
import { Copy, DotsThree } from 'phosphor-react';
import React, { useCallback } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import { KeypairType } from '@polkadot/util-crypto/types';

export interface _AccountCardProps extends AccountCardProps {
  className?: string;
  genesisHash?: string | null;
  type?: KeypairType;
  showCopyBtn?: boolean;
  showMoreBtn?: boolean;
  onPressCopyBtn?: () => void;
  onPressMoreBtn?: () => void;
}

function AccountCardBase (props: Partial<_AccountCardProps>): React.ReactElement<Partial<_AccountCardProps>> {
  const { accountName, address, className, genesisHash, onPressCopyBtn, onPressMoreBtn, showCopyBtn, showMoreBtn, type: givenType } = props;
  const { formatted, prefix } = useAccountRecoded(address || '', genesisHash, givenType);
  const avatarTheme = useAccountAvatarTheme(address || '');

  const _onCopy: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = useCallback((event) => {
    event.stopPropagation();
    onPressCopyBtn && onPressCopyBtn();
  }, [onPressCopyBtn]);

  const _onClickMore: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = useCallback((event) => {
    event.stopPropagation();
    onPressMoreBtn && onPressMoreBtn();
  }, [onPressMoreBtn]);

  return (
    <AccountCard
      {...props}
      accountName={accountName || ''}
      address={address || ''}
      avatarIdentPrefix={prefix || 42}
      avatarTheme={avatarTheme}
      className={className}
      rightItem={<>
        {showCopyBtn && <CopyToClipboard text={formatted || ''}>
          <Button
            icon={
              <Icon
                iconColor='rgba(255, 255, 255, 0.45)'
                phosphorIcon={Copy}
                size='sm'
              />
            }
            onClick={_onCopy}
            size='xs'
            type='ghost'
          />
        </CopyToClipboard>}

        {showMoreBtn && <Button
          icon={
            <Icon
              iconColor='rgba(255, 255, 255, 0.45)'
              phosphorIcon={DotsThree}
              size='sm'
            />
          }
          onClick={_onClickMore}
          size='xs'
          type='ghost'
        />}
      </>}
    />
  );
}

export default AccountCardBase;
