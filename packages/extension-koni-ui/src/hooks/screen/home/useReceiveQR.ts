// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _getMultiChainAsset, _isAssetFungibleToken, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { AccountSelectorModalId } from '@subwallet/extension-koni-ui/components/Modal/AccountSelectorModal';
import { RECEIVE_QR_MODAL, RECEIVE_TOKEN_SELECTOR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { AccountType } from '@subwallet/extension-koni-ui/types';
import { findAccountByAddress, getAccountType, isAccountAll as checkIsAccountAll } from '@subwallet/extension-koni-ui/utils';
import { findNetworkJsonByGenesisHash } from '@subwallet/extension-koni-ui/utils/chain/getNetworkJsonByGenesisHash';
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
  const { accounts, currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const { assetRegistry: assetRegistryMap } = useSelector((root: RootState) => root.assetRegistry);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const [tokenSelectorItems, setTokenSelectorItems] = useState<_ChainAsset[]>([]);
  const [{ selectedAccount, selectedNetwork }, setReceiveSelectedResult] = useState<ReceiveSelectedResult>(
    { selectedAccount: isAllAccount ? undefined : currentAccount?.address }
  );

  const accountSelectorItems = useMemo<AccountJson[]>(() => {
    if (!isAllAccount) {
      return [];
    }

    if (tokenGroupSlug) {
      const targetAccountType = getAccountTypeByTokenGroup(tokenGroupSlug, assetRegistryMap, chainInfoMap);

      if (targetAccountType === 'ALL') {
        return accounts.filter((a) => !checkIsAccountAll(a.address));
      }

      return accounts.filter((a) => getAccountType(a.address) === targetAccountType);
    }

    return accounts.filter((a) => !checkIsAccountAll(a.address));
  }, [isAllAccount, tokenGroupSlug, accounts, assetRegistryMap, chainInfoMap]);

  const getTokenSelectorItems = useCallback((_selectedAccount: string) => {
    // if selectedAccount is not available or is ethereum type
    if (!_selectedAccount) {
      return [];
    }

    // if tokenGroupSlug is token slug
    if (tokenGroupSlug && assetRegistryMap[tokenGroupSlug]) {
      return [assetRegistryMap[tokenGroupSlug]];
    }

    const isEvmAddress = isEthereumAddress(_selectedAccount);
    const acc = findAccountByAddress(accounts, _selectedAccount);

    return Object.values(assetRegistryMap).filter((asset) => {
      const availableGen: string[] = acc?.availableGenesisHashes || [];

      if (acc?.isHardware && !isEvmAddress && !availableGen.includes(chainInfoMap[asset.originChain].substrateInfo?.genesisHash || '')) {
        return false;
      }

      if (_isAssetFungibleToken(asset)) {
        if (_isChainEvmCompatible(chainInfoMap[asset.originChain]) === isEvmAddress) {
          if (tokenGroupSlug) {
            return _getMultiChainAsset(asset) === tokenGroupSlug;
          }

          return true;
        }
      }

      return false;
    });
  }, [tokenGroupSlug, assetRegistryMap, chainInfoMap, accounts]);

  const onOpenReceive = useCallback(() => {
    if (!currentAccount) {
      return;
    }

    if (checkIsAccountAll(currentAccount.address)) {
      activeModal(AccountSelectorModalId);
    } else {
      // if currentAccount is ledger type
      if (currentAccount.isHardware) {
        if (!isEthereumAddress(currentAccount.address)) {
          const availableGen: string[] = currentAccount.availableGenesisHashes || [];
          const networks = availableGen
            .map((gen) => findNetworkJsonByGenesisHash(chainInfoMap, gen)?.slug)
            .filter((slug) => slug) as string[];

          if (networks.length === 1) {
            setReceiveSelectedResult((prevState) => ({ ...prevState, selectedNetwork: networks[0] }));
            activeModal(RECEIVE_QR_MODAL);

            return;
          }
        }
      }

      const _tokenSelectorItems = getTokenSelectorItems(currentAccount.address);

      setTokenSelectorItems(_tokenSelectorItems);

      if (tokenGroupSlug) {
        if (_tokenSelectorItems.length === 1) {
          setReceiveSelectedResult((prev) => ({ ...prev, selectedNetwork: _tokenSelectorItems[0].originChain }));
          activeModal(RECEIVE_QR_MODAL);

          return;
        }
      }

      activeModal(RECEIVE_TOKEN_SELECTOR_MODAL);
    }
  }, [activeModal, chainInfoMap, currentAccount, getTokenSelectorItems, tokenGroupSlug]);

  const openSelectAccount = useCallback((account: AccountJson) => {
    setReceiveSelectedResult({ selectedAccount: account.address });
    const _tokenSelectorItems = getTokenSelectorItems(account.address);

    setTokenSelectorItems(_tokenSelectorItems);

    if (tokenGroupSlug) {
      if (_tokenSelectorItems.length === 1) {
        setReceiveSelectedResult((prev) => ({ ...prev, selectedNetwork: _tokenSelectorItems[0].originChain }));
        activeModal(RECEIVE_QR_MODAL);
        inactiveModal(AccountSelectorModalId);

        return;
      }
    }

    activeModal(RECEIVE_TOKEN_SELECTOR_MODAL);
    inactiveModal(AccountSelectorModalId);
  }, [activeModal, getTokenSelectorItems, inactiveModal, tokenGroupSlug]);

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
