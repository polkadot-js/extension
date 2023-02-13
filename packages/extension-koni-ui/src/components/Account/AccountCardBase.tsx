// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _getSubstrateGenesisHash } from '@subwallet/extension-base/services/chain-service/utils';
import { isAccountAll } from '@subwallet/extension-koni-base/utils';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Recoded } from '@subwallet/extension-koni-ui/types';
import { accountAllRecoded, defaultRecoded, recodeAddress } from '@subwallet/extension-koni-ui/util';
import { Button } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import AccountCard, { AccountCardProps } from '@subwallet/react-ui/es/web3-block/account-card';
import { Copy, DotsThree } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useSelector } from 'react-redux';

import { isEthereumAddress } from '@polkadot/util-crypto';
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
  const { accountName, address, className, genesisHash, onPressCopyBtn, onPressMoreBtn, renderRightItem, showCopyBtn, showMoreBtn, type: givenType } = props;
  const { accounts } = useSelector((state: RootState) => state.accountState);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const [{ formatted, genesisHash: recodedGenesis, prefix }, setRecoded] = useState<Recoded>(defaultRecoded);
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

  const _onCopy: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = useCallback((event) => {
    event.stopPropagation();
    onPressCopyBtn && onPressCopyBtn();
  }, [onPressCopyBtn]);

  const _onClickMore: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = useCallback((event) => {
    event.stopPropagation();
    onPressMoreBtn && onPressMoreBtn();
  }, [onPressMoreBtn]);

  const defaultRenderRightItem = useCallback((x: React.ReactNode) => {
    return (
      <>
        {x}
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
      </>
    );
  }, [_onClickMore, _onCopy, formatted, showCopyBtn, showMoreBtn]);

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
