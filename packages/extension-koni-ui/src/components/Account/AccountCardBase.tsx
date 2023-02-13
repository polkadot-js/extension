// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { _getSubstrateGenesisHash } from '@subwallet/extension-base/services/chain-service/utils';
import { _ChainInfo } from '@subwallet/chain-list/types';
import { accountAllRecoded, defaultRecoded, recodeAddress } from '@subwallet/extension-koni-ui/util';
import { Recoded } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-base/utils';
import { isEthereumAddress } from '@polkadot/util-crypto';
import AccountCard, { AccountCardProps } from '@subwallet/react-ui/es/web3-block/account-card';
import { KeypairType } from '@polkadot/util-crypto/types';
import { Button } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { Copy, DotsThree } from 'phosphor-react';
import CopyToClipboard from 'react-copy-to-clipboard';

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
  const { address, accountName, genesisHash, type: givenType, className, showCopyBtn, showMoreBtn, onPressCopyBtn, onPressMoreBtn, renderRightItem } = props;
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
    //TODO: change recoded
  }, [accounts, _isAccountAll, address, networkInfo, givenType]);

  const _renderRightItem = (x: React.ReactNode) => {
    if (!!renderRightItem) {
      renderRightItem(x);
    }

    return (
      <>
        {x}
        {showCopyBtn && <CopyToClipboard text={formatted || ''}>
          <Button
            type="ghost"
            size="xs"
            onClick={(event) => {
              event.stopPropagation();
              onPressCopyBtn && onPressCopyBtn()
            }}
            icon={
              <Icon
                phosphorIcon={Copy}
                iconColor="rgba(255, 255, 255, 0.45)"
                size="sm"
              />
            }
          />
        </CopyToClipboard>}

        {showMoreBtn && <Button
          type="ghost"
          size="xs"
          onClick={(event) => {
            event.stopPropagation();
            onPressMoreBtn && onPressMoreBtn();
          }}
          icon={
            <Icon
              phosphorIcon={DotsThree}
              iconColor="rgba(255, 255, 255, 0.45)"
              size="sm"
            />
          }
        />}
      </>
    );
  };

  return (
      <AccountCard
        {...props}
        address={address || ''}
        accountName={accountName || ''}
        avatarIdentPrefix={prefix || 42}
        avatarTheme={iconTheme}
        className={className}
        renderRightItem={_renderRightItem}
      />
  );
}

export default AccountCardBase;
