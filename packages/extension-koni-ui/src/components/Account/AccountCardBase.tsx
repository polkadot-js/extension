// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _getSubstrateGenesisHash } from '@subwallet/extension-base/services/chain-service/utils';
import { isAccountAll } from '@subwallet/extension-koni-base/utils';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import useGetAccountSignModeByAddress from '@subwallet/extension-koni-ui/hooks/useGetAccountSignModeByAddress';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Recoded } from '@subwallet/extension-koni-ui/types';
import { accountAllRecoded, defaultRecoded, recodeAddress } from '@subwallet/extension-koni-ui/util';
import { Button, SwIconProps } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import AccountCard, { AccountCardProps } from '@subwallet/react-ui/es/web3-block/account-card';
import { DotsThree, Eye, QrCode, Swatches } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { isEthereumAddress } from '@polkadot/util-crypto';
import { KeypairType } from '@polkadot/util-crypto/types';

export interface _AccountCardProps extends AccountCardProps {
  className?: string;
  genesisHash?: string | null;
  type?: KeypairType;
  showMoreBtn?: boolean;
  onPressMoreBtn?: () => void;
}

function AccountCardBase (props: Partial<_AccountCardProps>): React.ReactElement<Partial<_AccountCardProps>> {
  const { accountName, address, className, genesisHash, onPressMoreBtn, renderRightItem, showMoreBtn, type: givenType } = props;
  const { accounts } = useSelector((state: RootState) => state.accountState);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const [{ genesisHash: recodedGenesis, prefix }, setRecoded] = useState<Recoded>(defaultRecoded);

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

  const getChainInfoByGenesisHash = useCallback((hash?: string | null): _ChainInfo | null => {
    if (!hash) {
      return null;
    }

    for (const n in chainInfoMap) {
      if (!Object.prototype.hasOwnProperty.call(chainInfoMap, n)) {
        continue;
      }

      const networkInfo = chainInfoMap[n];

      if (_getSubstrateGenesisHash(networkInfo) === hash) {
        return networkInfo;
      }
    }

    return null;
  }, [chainInfoMap]);
  const _isAccountAll = address && isAccountAll(address);
  const networkInfo = getChainInfoByGenesisHash(genesisHash || recodedGenesis);
  const iconTheme = useMemo((): 'polkadot'|'ethereum' => {
    if (!address) {
      return 'polkadot';
    }

    if (isEthereumAddress(address)) {
      return 'ethereum';
    }

    return 'polkadot';
  }, [address]);

  useEffect((): void => {
    if (!address) {
      setRecoded(defaultRecoded);

      return;
    }

    if (_isAccountAll) {
      setRecoded(accountAllRecoded);

      return;
    }

    setRecoded(recodeAddress(address, accounts, networkInfo, givenType));
    // TODO: change recoded
  }, [accounts, _isAccountAll, address, networkInfo, givenType]);

  const _onClickMore: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = useCallback((event) => {
    event.stopPropagation();
    onPressMoreBtn && onPressMoreBtn();
  }, [onPressMoreBtn]);

  const defaultRenderRightItem = useCallback((x: React.ReactNode) => {
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
      avatarTheme={iconTheme}
      className={className}
      renderRightItem={renderRightItem || defaultRenderRightItem}
    />
  );
}

export default AccountCardBase;
