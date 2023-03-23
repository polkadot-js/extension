// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _getMultiChainAsset, _isAssetFungibleToken, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { ReceiveTokensSelectorModalId } from '@subwallet/extension-koni-ui/components';
import { AccountSelectorModalId } from '@subwallet/extension-koni-ui/components/Modal/AccountSelectorModal';
import { RECEIVE_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountType } from '@subwallet/extension-koni-ui/types';
import { getAccountType, isAccountAll as checkIsAccountAll } from '@subwallet/extension-koni-ui/util';
import { findNetworkJsonByGenesisHash } from '@subwallet/extension-koni-ui/util/getNetworkJsonByGenesisHash';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { isEthereumAddress } from '@polkadot/util-crypto';

type ReceiveSelectedResult = {
  selectedAccount?: string;
  selectedNetwork?: string;
};

function getAccountTypeByTokenGroup (
  tokenGroupSlug: string,
  assetRegistryMap: Record<string, _ChainAsset>,
  chainInfoMap: Record<string, _ChainInfo>): AccountType {
  // case tokenGroupSlug is token slug
  if (assetRegistryMap[tokenGroupSlug]) {
    const chainSlug = assetRegistryMap[tokenGroupSlug].originChain;

    if (_isChainEvmCompatible(chainInfoMap[chainSlug])) {
      return 'ETHEREUM';
    } else {
      return 'SUBSTRATE';
    }
  }

  // case tokenGroupSlug is multiChainAsset slug

  const assetRegistryItems: _ChainAsset[] = Object.values(assetRegistryMap);

  const typesCheck: AccountType[] = [];

  for (const assetItem of assetRegistryItems) {
    if (!_isAssetFungibleToken(assetItem) || (_getMultiChainAsset(assetItem) !== tokenGroupSlug)) {
      continue;
    }

    const chainSlug = assetRegistryMap[assetItem.slug].originChain;

    const currentType = _isChainEvmCompatible(chainInfoMap[chainSlug]) ? 'ETHEREUM' : 'SUBSTRATE';

    if (!typesCheck.includes(currentType)) {
      typesCheck.push(currentType);
    }

    if (typesCheck.length === 2) {
      break;
    }
  }

  if (!typesCheck.length || typesCheck.length === 2) {
    return 'ALL';
  }

  return typesCheck[0];
}

export default function useReceiveQR (tokenGroupSlug?: string) {
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const accounts = useSelector((state: RootState) => state.accountState.accounts);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const assetRegistryMap = useSelector((root: RootState) => root.assetRegistry.assetRegistry);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const isAllAccount = useSelector((state: RootState) => state.accountState.isAllAccount);
  const [{ selectedAccount, selectedNetwork }, setReceiveSelectedResult] = useState<ReceiveSelectedResult>(
    { selectedAccount: isAllAccount ? undefined : currentAccount?.address }
  );

  const accountSelectorItems = useMemo<AccountJson[]>(() => {
    if (!isAllAccount) {
      return [];
    }

    if (tokenGroupSlug) {
      const targetAccountType = getAccountTypeByTokenGroup(tokenGroupSlug, assetRegistryMap, chainInfoMap);

      console.log('targetAccountType', targetAccountType);

      if (targetAccountType === 'ALL') {
        return accounts.filter((a) => !checkIsAccountAll(a.address));
      }

      return accounts.filter((a) => getAccountType(a.address) === targetAccountType);
    }

    return accounts.filter((a) => !checkIsAccountAll(a.address));
  }, [isAllAccount, tokenGroupSlug, accounts, assetRegistryMap, chainInfoMap]);

  const tokenSelectorItems = useMemo<_ChainAsset[]>(() => {
    // if selectedAccount is not available or is ethereum type
    if (!selectedAccount) {
      return [];
    }

    // if tokenGroupSlug is token slug
    if (tokenGroupSlug && assetRegistryMap[tokenGroupSlug]) {
      return [];
    }

    return Object.values(assetRegistryMap).filter((asset) => {
      if (_isAssetFungibleToken(asset)) {
        const chainSlug = assetRegistryMap[asset.slug].originChain;

        if (_isChainEvmCompatible(chainInfoMap[chainSlug]) === isEthereumAddress(selectedAccount)) {
          if (tokenGroupSlug) {
            return _getMultiChainAsset(asset) === tokenGroupSlug;
          }

          return true;
        }
      }

      return false;
    });
  }, [selectedAccount, tokenGroupSlug, assetRegistryMap, chainInfoMap]);

  const onOpenReceive = useCallback(() => {
    if (!currentAccount) {
      return;
    }

    if (checkIsAccountAll(currentAccount.address)) {
      activeModal(AccountSelectorModalId);
    } else {
      // if currentAccount is ledger type
      if (currentAccount.originGenesisHash) {
        const network = findNetworkJsonByGenesisHash(chainInfoMap, currentAccount.originGenesisHash);

        if (network) {
          setReceiveSelectedResult((prevState) => ({ ...prevState, selectedNetwork: network.slug }));
          activeModal(RECEIVE_QR_MODAL);

          return;
        }
      }

      if (tokenGroupSlug) {
        if (tokenSelectorItems.length === 1) {
          setReceiveSelectedResult((prev) => ({ ...prev, selectedNetwork: tokenSelectorItems[0].originChain }));
          activeModal(RECEIVE_QR_MODAL);

          return;
        }
      }

      activeModal(ReceiveTokensSelectorModalId);
    }
  }, [activeModal, chainInfoMap, currentAccount, tokenGroupSlug, tokenSelectorItems]);

  const openSelectAccount = useCallback((account: AccountJson) => {
    if (tokenGroupSlug) {
      if (tokenSelectorItems.length === 1) {
        setReceiveSelectedResult({ selectedAccount: account.address, selectedNetwork: tokenSelectorItems[0].originChain });
        activeModal(RECEIVE_QR_MODAL);
        inactiveModal(AccountSelectorModalId);

        return;
      }
    }

    setReceiveSelectedResult({ selectedAccount: account.address });
    activeModal(ReceiveTokensSelectorModalId);
    inactiveModal(AccountSelectorModalId);
  }, [activeModal, inactiveModal, tokenGroupSlug, tokenSelectorItems]);

  const openSelectToken = useCallback((item: _ChainAsset) => {
    setReceiveSelectedResult((prevState) => ({ ...prevState, selectedNetwork: item.originChain }));
  }, []);

  useEffect(() => {
    setReceiveSelectedResult((prev) => ({
      ...prev,
      selectedAccount: currentAccount?.address
    }));
  }, [currentAccount?.address]);

  return {
    onOpenReceive,
    openSelectAccount,
    openSelectToken,
    selectedAccount,
    accountSelectorItems,
    tokenSelectorItems,
    selectedNetwork
  };
}
