// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import State, { AuthUrls, Resolver } from '@subwallet/extension-base/background/handlers/State';
import { AccountRefMap, APIItemState, ApiMap, AuthRequestV2, BalanceItem, BalanceJson, ChainRegistry, ConfirmationDefinitions, ConfirmationsQueue, ConfirmationType, CrowdloanItem, CrowdloanJson, CurrentAccountInfo, CustomEvmToken, DeleteEvmTokenParams, EvmSendTransactionParams, EvmTokenJson, NETWORK_STATUS, NetworkJson, NftCollection, NftCollectionJson, NftItem, NftJson, NftTransferExtra, PriceJson, RequestAccountExportPrivateKey, RequestConfirmationComplete, RequestSettingsType, ResponseAccountExportPrivateKey, ResultResolver, ServiceInfo, StakingItem, StakingJson, StakingRewardJson, TokenInfo, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import { AuthorizeRequest, RequestAuthorizeTab } from '@subwallet/extension-base/background/types';
import { getId } from '@subwallet/extension-base/utils/getId';
import { getTokenPrice } from '@subwallet/extension-koni-base/api/coingecko';
import { initApi } from '@subwallet/extension-koni-base/api/dotsama';
import { cacheRegistryMap, getRegistry } from '@subwallet/extension-koni-base/api/dotsama/registry';
import { PREDEFINED_GENESIS_HASHES, PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { DEFAULT_STAKING_NETWORKS } from '@subwallet/extension-koni-base/api/staking';
// eslint-disable-next-line camelcase
import { DotSamaCrowdloan_crowdloans_nodes } from '@subwallet/extension-koni-base/api/subquery/__generated__/DotSamaCrowdloan';
import { fetchDotSamaCrowdloan } from '@subwallet/extension-koni-base/api/subquery/crowdloan';
import { DEFAULT_EVM_TOKENS } from '@subwallet/extension-koni-base/api/web3/defaultEvmToken';
import { initWeb3Api } from '@subwallet/extension-koni-base/api/web3/web3';
import { EvmRpcError } from '@subwallet/extension-koni-base/background/errors/EvmRpcError';
import { ALL_ACCOUNT_KEY, ALL_GENESIS_HASH } from '@subwallet/extension-koni-base/constants';
import { CurrentAccountStore, NetworkMapStore, PriceStore } from '@subwallet/extension-koni-base/stores';
import AccountRefStore from '@subwallet/extension-koni-base/stores/AccountRef';
import AuthorizeStore from '@subwallet/extension-koni-base/stores/Authorize';
import CustomEvmTokenStore from '@subwallet/extension-koni-base/stores/CustomEvmToken';
import SettingsStore from '@subwallet/extension-koni-base/stores/Settings';
import TransactionHistoryStore from '@subwallet/extension-koni-base/stores/TransactionHistory';
import { convertFundStatus, getCurrentProvider } from '@subwallet/extension-koni-base/utils/utils';
import SimpleKeyring from 'eth-simple-keyring';
import { BehaviorSubject, Subject } from 'rxjs';
import Web3 from 'web3';
import { TransactionConfig } from 'web3-core';

import { decodePair } from '@polkadot/keyring/pair/decode';
import { keyring } from '@polkadot/ui-keyring';
import { accounts } from '@polkadot/ui-keyring/observable/accounts';
import { assert, BN, u8aToHex } from '@polkadot/util';
import { base64Decode, isEthereumAddress } from '@polkadot/util-crypto';

function generateDefaultBalanceMap () {
  const balanceMap: Record<string, BalanceItem> = {};

  Object.keys(PREDEFINED_NETWORKS).forEach((networkKey) => {
    balanceMap[networkKey] = {
      state: APIItemState.PENDING,
      free: '0',
      reserved: '0',
      miscFrozen: '0',
      feeFrozen: '0'
    };
  });

  return balanceMap;
}

function generateDefaultStakingMap () {
  const stakingMap: Record<string, StakingItem> = {};

  Object.keys(DEFAULT_STAKING_NETWORKS).forEach((networkKey) => {
    stakingMap[networkKey] = {
      name: PREDEFINED_NETWORKS[networkKey].chain,
      chainId: networkKey,
      nativeToken: PREDEFINED_NETWORKS[networkKey].nativeToken,
      state: APIItemState.PENDING
    } as StakingItem;
  });

  return stakingMap;
}

function generateDefaultCrowdloanMap () {
  const crowdloanMap: Record<string, CrowdloanItem> = {};

  Object.keys(PREDEFINED_NETWORKS).forEach((networkKey) => {
    crowdloanMap[networkKey] = {
      state: APIItemState.PENDING,
      contribute: '0'
    };
  });

  return crowdloanMap;
}

export function mergeNetworkProviders (customNetwork: NetworkJson, predefinedNetwork: NetworkJson) { // merge providers for 2 networks with the same genesisHash
  if (customNetwork.customProviders) {
    const parsedCustomProviders: Record<string, string> = {};
    const currentProvider = customNetwork.customProviders[customNetwork.currentProvider];
    const currentProviderMethod = currentProvider.startsWith('http') ? 'http' : 'ws';
    let parsedProviderKey = '';

    for (const customProvider of Object.values(customNetwork.customProviders)) {
      let exist = false;

      for (const [key, provider] of Object.entries(predefinedNetwork.providers)) {
        if (currentProvider === provider) { // point currentProvider to predefined
          parsedProviderKey = key;
        }

        if (provider === customProvider) {
          exist = true;
          break;
        }
      }

      if (!exist) {
        const index = Object.values(parsedCustomProviders).length;

        parsedCustomProviders[`custom_${index}`] = customProvider;
      }
    }

    for (const [key, parsedProvider] of Object.entries(parsedCustomProviders)) {
      if (currentProvider === parsedProvider) {
        parsedProviderKey = key;
      }
    }

    return { currentProviderMethod, parsedProviderKey, parsedCustomProviders };
  } else {
    return { currentProviderMethod: '', parsedProviderKey: '', parsedCustomProviders: {} };
  }
}

export default class KoniState extends State {
  public readonly authSubjectV2: BehaviorSubject<AuthorizeRequest[]> = new BehaviorSubject<AuthorizeRequest[]>([]);

  private readonly networkMapStore = new NetworkMapStore(); // persist custom networkMap by user
  private readonly customEvmTokenStore = new CustomEvmTokenStore();
  private readonly priceStore = new PriceStore();
  private readonly currentAccountStore = new CurrentAccountStore();
  private readonly settingsStore = new SettingsStore();
  private readonly accountRefStore = new AccountRefStore();
  private readonly authorizeStore = new AuthorizeStore();
  readonly #authRequestsV2: Record<string, AuthRequestV2> = {};
  private priceStoreReady = false;
  private readonly transactionHistoryStore = new TransactionHistoryStore();

  private readonly confirmationsQueueSubject = new BehaviorSubject<ConfirmationsQueue>({
    addNetworkRequest: {},
    switchNetworkRequest: {},
    evmSignatureRequest: {},
    evmSendTransactionRequest: {}
  });

  private readonly confirmationsPromiseMap: Record<string, { resolver: Resolver<any>, validator?: (rs: any) => Error | undefined }> = {};

  private networkMap: Record<string, NetworkJson> = {}; // mapping to networkMapStore, for uses in background
  private networkMapSubject = new Subject<Record<string, NetworkJson>>();
  private lockNetworkMap = false;

  private apiMap: ApiMap = { dotSama: {}, web3: {} };

  private serviceInfoSubject = new Subject<ServiceInfo>();
  private evmTokenState: EvmTokenJson = { erc20: [], erc721: [] };
  private evmTokenSubject = new Subject<EvmTokenJson>();
  private balanceMap: Record<string, BalanceItem> = generateDefaultBalanceMap();
  private balanceSubject = new Subject<BalanceJson>();
  private nftState: NftJson = {
    total: 0,
    nftList: []
  };

  private nftCollectionState: NftCollectionJson = {
    ready: false,
    nftCollectionList: []
  };

  // Only for rendering nft after transfer
  private nftTransferState: NftTransferExtra = {
    cronUpdate: false,
    forceUpdate: false
  };

  private stakingMap: Record<string, StakingItem> = generateDefaultStakingMap();
  private stakingRewardState: StakingRewardJson = {
    ready: false,
    details: []
  } as StakingRewardJson;

  // eslint-disable-next-line camelcase
  private crowdloanFundMap: Record<string, DotSamaCrowdloan_crowdloans_nodes> = {};
  private crowdloanMap: Record<string, CrowdloanItem> = generateDefaultCrowdloanMap();
  private crowdloanSubject = new Subject<CrowdloanJson>();
  private nftTransferSubject = new Subject<NftTransferExtra>();
  private nftSubject = new Subject<NftJson>();
  private nftCollectionSubject = new Subject<NftCollectionJson>();
  private stakingSubject = new Subject<StakingJson>();
  private stakingRewardSubject = new Subject<StakingRewardJson>();
  private historyMap: Record<string, TransactionHistoryItemType[]> = {};
  private historySubject = new Subject<Record<string, TransactionHistoryItemType[]>>();

  // Todo: persist data to store later
  private chainRegistryMap: Record<string, ChainRegistry> = {};
  private chainRegistrySubject = new Subject<Record<string, ChainRegistry>>();

  private lazyMap: Record<string, unknown> = {};

  // init networkMap, apiMap and chainRegistry (first time only)
  public initNetworkStates () {
    this.networkMapStore.get('NetworkMap', (storedNetworkMap) => {
      if (!storedNetworkMap) { // first time init extension
        this.networkMapStore.set('NetworkMap', PREDEFINED_NETWORKS);
        this.networkMap = PREDEFINED_NETWORKS;
      } else { // merge custom providers in stored data with predefined data
        const mergedNetworkMap: Record<string, NetworkJson> = PREDEFINED_NETWORKS;

        for (const [key, storedNetwork] of Object.entries(storedNetworkMap)) {
          if (key in PREDEFINED_NETWORKS) {
            // check change and override custom providers if exist
            if ('customProviders' in storedNetwork) {
              mergedNetworkMap[key].customProviders = storedNetwork.customProviders;
            }

            mergedNetworkMap[key].active = storedNetwork.active;
            mergedNetworkMap[key].currentProvider = storedNetwork.currentProvider;
            mergedNetworkMap[key].coinGeckoKey = storedNetwork.coinGeckoKey;
            mergedNetworkMap[key].crowdloanUrl = storedNetwork.crowdloanUrl;
            mergedNetworkMap[key].blockExplorer = storedNetwork.blockExplorer;
            mergedNetworkMap[key].currentProviderMode = mergedNetworkMap[key].currentProvider.startsWith('http') ? 'http' : 'ws';
          } else {
            if (Object.keys(PREDEFINED_GENESIS_HASHES).includes(storedNetwork.genesisHash)) { // merge networks with same genesis hash
              // @ts-ignore
              const targetKey = PREDEFINED_GENESIS_HASHES[storedNetwork.genesisHash];

              const { currentProviderMethod, parsedCustomProviders, parsedProviderKey } = mergeNetworkProviders(storedNetwork, PREDEFINED_NETWORKS[targetKey]);

              mergedNetworkMap[targetKey].customProviders = parsedCustomProviders;
              mergedNetworkMap[targetKey].currentProvider = parsedProviderKey;
              mergedNetworkMap[targetKey].active = storedNetwork.active;
              // @ts-ignore
              mergedNetworkMap[targetKey].currentProviderMode = currentProviderMethod;
            } else {
              mergedNetworkMap[key] = storedNetwork;
            }
          }
        }

        this.networkMapStore.set('NetworkMap', mergedNetworkMap);
        this.networkMap = mergedNetworkMap; // init networkMap state
      }

      for (const [key, network] of Object.entries(this.networkMap)) {
        if (network.active) {
          this.apiMap.dotSama[key] = initApi(key, getCurrentProvider(network), network.isEthereum);

          if (network.isEthereum && network.isEthereum) {
            this.apiMap.web3[key] = initWeb3Api(getCurrentProvider(network));
          }
        }
      }

      this.initEvmTokenState();
    });
  }

  public mergeTransactionHistory () {
    setTimeout(() => {
      const addressList = Object.keys(accounts.subject.value);

      for (const address of addressList) {
        for (const networkJson of Object.values(this.networkMap)) {
          if (!networkJson.key.includes('custom_')) {
            this.transactionHistoryStore.get(`${address}_custom_${networkJson.genesisHash}`, (txHistory) => {
              if (txHistory) {
                const parsedTxHistory: TransactionHistoryItemType[] = txHistory.map((item) => {
                  return {
                    time: item.time,
                    networkKey: networkJson.key,
                    change: item.change,
                    changeSymbol: item.changeSymbol,
                    fee: item.fee,
                    feeSymbol: item.feeSymbol,
                    isSuccess: item.isSuccess,
                    action: item.action,
                    extrinsicHash: item.extrinsicHash
                  };
                });

                this.transactionHistoryStore.set(this.getTransactionKey(address, networkJson.key), parsedTxHistory);
                // TODO: update historyMap state correctly according to address
                this.historyMap[networkJson.key] = parsedTxHistory;
                this.historySubject.next(this.historyMap);

                this.transactionHistoryStore.remove(`${address}_custom_${networkJson.genesisHash}`);
              }
            });
          }
        }
      }
    }, 5000); // had to use timeout because keyring doesn't return immediately
  }

  public initEvmTokenState () {
    this.customEvmTokenStore.get('EvmToken', (storedEvmTokens) => {
      if (!storedEvmTokens) {
        this.evmTokenState = DEFAULT_EVM_TOKENS;
      } else {
        const _evmTokenState = storedEvmTokens;

        for (const storedToken of DEFAULT_EVM_TOKENS.erc20) {
          let exist = false;

          for (const defaultToken of storedEvmTokens.erc20) {
            if (defaultToken.smartContract === storedToken.smartContract && defaultToken.chain === storedToken.chain) {
              exist = true;
              break;
            }
          }

          if (!exist) {
            _evmTokenState.erc20.push(storedToken);
          }
        }

        for (const storedToken of DEFAULT_EVM_TOKENS.erc721) {
          let exist = false;

          for (const defaultToken of storedEvmTokens.erc721) {
            if (defaultToken.smartContract === storedToken.smartContract && defaultToken.chain === storedToken.chain) {
              exist = true;
              break;
            }
          }

          if (!exist) {
            _evmTokenState.erc721.push(storedToken);
          }
        }

        // Update networkKey in case networkMap change
        for (const token of _evmTokenState.erc20) {
          if (!(token.chain in this.networkMap)) {
            let newKey = '';
            const genesisHash = token.chain.split('custom_')[1]; // token from custom network has key with prefix custom_

            for (const [key, network] of Object.entries(this.networkMap)) {
              if (network.genesisHash.toLowerCase() === genesisHash.toLowerCase()) {
                newKey = key;
                break;
              }
            }

            token.chain = newKey;
          }
        }

        for (const token of _evmTokenState.erc721) {
          if (!(token.chain in this.networkMap)) {
            let newKey = '';
            const genesisHash = token.chain.split('custom_')[1]; // token from custom network has key with prefix custom_

            for (const [key, network] of Object.entries(this.networkMap)) {
              if (network.genesisHash.toLowerCase() === genesisHash.toLowerCase()) {
                newKey = key;
                break;
              }
            }

            token.chain = newKey;
          }
        }

        this.evmTokenState = _evmTokenState;
      }

      this.customEvmTokenStore.set('EvmToken', this.evmTokenState);
      this.evmTokenSubject.next(this.evmTokenState);

      this.initChainRegistry();
    });
  }

  private lazyNext = (key: string, callback: () => void) => {
    if (this.lazyMap[key]) {
      // @ts-ignore
      clearTimeout(this.lazyMap[key]);
    }

    const lazy = setTimeout(() => {
      callback();
      clearTimeout(lazy);
    }, 300);

    this.lazyMap[key] = lazy;
  };

  public getAuthRequestV2 (id: string): AuthRequestV2 {
    return this.#authRequestsV2[id];
  }

  public get numAuthRequestsV2 (): number {
    return Object.keys(this.#authRequestsV2).length;
  }

  public get allAuthRequestsV2 (): AuthorizeRequest[] {
    return Object
      .values(this.#authRequestsV2)
      .map(({ id, request, url }): AuthorizeRequest => ({ id, request, url }));
  }

  public setAuthorize (data: AuthUrls, callback?: () => void): void {
    this.authorizeStore.set('authUrls', data, callback);
  }

  public getAuthorize (update: (value: AuthUrls) => void): void {
    this.authorizeStore.get('authUrls', update);
  }

  private updateIconV2 (shouldClose?: boolean): void {
    const authCount = this.numAuthRequestsV2;
    const text = (
      authCount
        ? 'Auth'
        : ''
    );

    withErrorLog(() => chrome.browserAction.setBadgeText({ text }));

    if (shouldClose && text === '') {
      this.popupClose();
    }
  }

  public getAuthList (): Promise<AuthUrls> {
    return new Promise<AuthUrls>((resolve, reject) => {
      this.getAuthorize((rs: AuthUrls) => {
        resolve(rs);
      });
    });
  }

  getAddressList (value = false): Record<string, boolean> {
    const addressList = Object.keys(accounts.subject.value);

    return addressList.reduce((addressList, v) => ({ ...addressList, [v]: value }), {});
  }

  private updateIconAuthV2 (shouldClose?: boolean): void {
    this.authSubjectV2.next(this.allAuthRequestsV2);
    this.updateIconV2(shouldClose);
  }

  private authCompleteV2 = (id: string, resolve: (result: boolean) => void, reject: (error: Error) => void): Resolver<ResultResolver> => {
    const isAllowedMap = this.getAddressList();

    const complete = (result: boolean | Error, cb: () => void, accounts?: string[]) => {
      const isAllowed = result === true;

      if (accounts && accounts.length) {
        accounts.forEach((acc) => {
          isAllowedMap[acc] = true;
        });
      } else {
        // eslint-disable-next-line no-return-assign
        Object.keys(isAllowedMap).forEach((address) => isAllowedMap[address] = false);
      }

      const { accountAuthType, idStr, request: { allowedAccounts, origin }, url } = this.#authRequestsV2[id];

      if (accountAuthType !== 'both') {
        const isEvmType = accountAuthType === 'evm';

        const backupAllowed = [...(allowedAccounts || [])].filter((a) => {
          const isEth = isEthereumAddress(a);

          return isEvmType ? !isEth : isEth;
        });

        backupAllowed.forEach((acc) => {
          isAllowedMap[acc] = true;
        });
      }

      this.getAuthorize((value) => {
        let authorizeList = {} as AuthUrls;

        if (value) {
          authorizeList = value;
        }

        const existed = authorizeList[this.stripUrl(url)];

        authorizeList[this.stripUrl(url)] = {
          count: 0,
          id: idStr,
          isAllowed,
          isAllowedMap,
          origin,
          url,
          accountAuthType: (existed && existed.accountAuthType !== accountAuthType) ? 'both' : accountAuthType
        };

        this.setAuthorize(authorizeList, () => {
          cb();
          delete this.#authRequestsV2[id];
          this.updateIconAuthV2(true);
        });
      });
    };

    return {
      reject: (error: Error): void => {
        complete(error, () => {
          reject(error);
        });
      },
      resolve: ({ accounts, result }: ResultResolver): void => {
        complete(result, () => {
          resolve(result);
        }, accounts);
      }
    };
  };

  public async authorizeUrlV2 (url: string, request: RequestAuthorizeTab): Promise<boolean> {
    let authList = await this.getAuthList();
    const accountAuthType = request.accountAuthType || 'substrate';

    request.accountAuthType = accountAuthType;

    if (!authList) {
      authList = {};
    }

    const idStr = this.stripUrl(url);
    // Do not enqueue duplicate authorization requests.
    const isDuplicate = Object.values(this.#authRequestsV2)
      .some((request) => request.idStr === idStr);

    assert(!isDuplicate, `The source ${url} has a pending authorization request`);

    const existedAuth = authList[idStr];
    const existedAccountAuthType = existedAuth?.accountAuthType;
    const confirmAnotherType = existedAccountAuthType !== 'both' && existedAccountAuthType !== request.accountAuthType;

    if (existedAuth && !confirmAnotherType && !request.reConfirm) {
      // this url was seen in the past
      const isConnected = Object.keys(existedAuth.isAllowedMap)
        .some((address) => existedAuth.isAllowedMap[address]);

      assert(isConnected, `The source ${url} is not allowed to interact with this extension`);

      return false;
    }

    return new Promise((resolve, reject): void => {
      const id = getId();

      if (existedAuth) {
        request.allowedAccounts = Object.entries(existedAuth.isAllowedMap)
          .map(([address, allowed]) => (allowed ? address : ''))
          .filter((item) => (item !== ''));
      }

      this.#authRequestsV2[id] = {
        ...this.authCompleteV2(id, resolve, reject),
        id,
        idStr,
        request,
        url,
        accountAuthType: accountAuthType
      };

      this.updateIconAuthV2();

      if (Object.keys(this.#authRequestsV2).length < 2) {
        this.popupOpen();
      }
    });
  }

  public getStaking (): StakingJson {
    return { ready: true, details: this.stakingMap } as StakingJson;
  }

  public subscribeStaking () {
    return this.stakingSubject;
  }

  public ensureUrlAuthorizedV2 (url: string): boolean {
    const idStr = this.stripUrl(url);

    this.getAuthorize((value) => {
      if (!value) {
        value = {};
      }

      const isConnected = Object.keys(value[idStr].isAllowedMap)
        .some((address) => value[idStr].isAllowedMap[address]);
      const entry = Object.keys(value).includes(idStr);

      assert(entry, `The source ${url} has not been enabled yet`);
      assert(isConnected, `The source ${url} is not allowed to interact with this extension`);
    });

    return true;
  }

  public setStakingItem (networkKey: string, item: StakingItem): void {
    this.stakingMap[networkKey] = item;
    this.lazyNext('setStakingItem', () => {
      this.stakingSubject.next(this.getStaking());
    });
  }

  public setNftTransfer (data: NftTransferExtra, callback?: (data: NftTransferExtra) => void): void {
    this.nftTransferState = data;

    if (callback) {
      callback(data);
    }

    this.nftTransferSubject.next(data);
  }

  public getNftTransfer (): NftTransferExtra {
    return this.nftTransferState;
  }

  public getNftTransferSubscription (update: (value: NftTransferExtra) => void): void {
    update(this.nftTransferState);
  }

  public subscribeNftTransfer () {
    return this.nftTransferSubject;
  }

  public setNftCollection (data: NftCollectionJson, callback?: (data: NftCollectionJson) => void): void {
    this.nftCollectionState = data;

    if (callback) {
      callback(data);
    }

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  public updateNftCollection (data: NftCollection, callback?: (data: NftCollection) => void): void {
    this.nftCollectionState.nftCollectionList.push(data);

    if (callback) {
      callback(data);
    }

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  public updateNftReady (ready: boolean, callback?: (ready: boolean) => void): void {
    this.nftCollectionState.ready = ready;

    if (callback) {
      callback(ready);
    }

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  public resetNftCollection (): void {
    this.nftCollectionState = {
      ready: false,
      nftCollectionList: []
    } as NftCollectionJson;

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  public getNftCollection () {
    return this.nftCollectionState;
  }

  public getNftCollectionSubscription (update: (value: NftCollectionJson) => void): void {
    update(this.nftCollectionState);
  }

  public subscribeNftCollection () {
    return this.nftCollectionSubject;
  }

  public resetNft (): void {
    this.nftState = {
      total: 0,
      nftList: []
    } as NftJson;

    this.nftSubject.next(this.nftState);
  }

  public setNft (data: NftJson, callback?: (nftData: NftJson) => void): void {
    this.nftState = data;

    if (callback) {
      callback(data);
    }

    this.nftSubject.next(this.nftState);
  }

  public updateNft (nftData: NftItem, callback?: (nftData: NftItem) => void): void {
    this.nftState.nftList.push(nftData);

    if (callback) {
      callback(nftData);
    }

    this.nftSubject.next(this.nftState);
  }

  public getNft () {
    return this.nftState;
  }

  public getNftSubscription (update: (value: NftJson) => void): void {
    update(this.nftState);
  }

  public subscribeNft () {
    return this.nftSubject;
  }

  public setStakingReward (stakingRewardData: StakingRewardJson, callback?: (stakingRewardData: StakingRewardJson) => void): void {
    this.stakingRewardState = stakingRewardData;

    if (callback) {
      callback(stakingRewardData);
    }

    this.stakingRewardSubject.next(stakingRewardData);
  }

  public updateStakingRewardReady (ready: boolean) {
    this.stakingRewardState.ready = ready;
    this.stakingRewardSubject.next(this.stakingRewardState);
  }

  public getAccountRefMap (callback: (refMap: Record<string, Array<string>>) => void) {
    const refMap: AccountRefMap = {};

    this.accountRefStore.get('refList', (refList) => {
      if (refList) {
        refList.forEach((accRef) => {
          accRef.forEach((acc) => {
            refMap[acc] = [...accRef].filter((r) => !(r === acc));
          });
        });
      }

      callback(refMap);
    });
  }

  public addAccountRef (addresses: string[], callback: () => void) {
    this.accountRefStore.get('refList', (refList) => {
      const newList = refList ? [...refList] : [];

      newList.push(addresses);

      this.accountRefStore.set('refList', newList, callback);
    });
  }

  public removeAccountRef (address: string, callback: () => void) {
    this.accountRefStore.get('refList', (refList) => {
      if (refList) {
        refList.forEach((accRef) => {
          if (accRef.indexOf(address) > -1) {
            accRef.splice(accRef.indexOf(address), 1);
          }

          if (accRef.length < 2) {
            refList.splice(refList.indexOf(accRef), 1);
          }
        });

        this.accountRefStore.set('refList', refList, () => {
          callback();
        });
      } else {
        callback();
      }
    });
  }

  public getStakingReward (update: (value: StakingRewardJson) => void): void {
    update(this.stakingRewardState);
  }

  public subscribeStakingReward () {
    return this.stakingRewardSubject;
  }

  public setHistory (historyMap: Record<string, TransactionHistoryItemType[]>) {
    this.historyMap = historyMap;

    this.historySubject.next(this.historyMap);
  }

  public getCurrentAccount (update: (value: CurrentAccountInfo) => void): void {
    this.currentAccountStore.get('CurrentAccountInfo', update);
  }

  public setCurrentAccount (data: CurrentAccountInfo, callback?: () => void): void {
    this.currentAccountStore.set('CurrentAccountInfo', data, callback);

    this.updateServiceInfo();
  }

  public setAccountTie (address: string, genesisHash: string | null): boolean {
    if (address !== ALL_ACCOUNT_KEY) {
      const pair = keyring.getPair(address);

      assert(pair, 'Unable to find pair');

      keyring.saveAccountMeta(pair, { ...pair.meta, genesisHash });
    }

    this.getCurrentAccount((accountInfo) => {
      if (address === accountInfo.address) {
        accountInfo.currentGenesisHash = genesisHash as string || ALL_GENESIS_HASH;

        this.setCurrentAccount(accountInfo);
      }
    });

    return true;
  }

  public async switchNetworkAccount (id: string, url: string, networkKey: string, changeAddress?: string): Promise<boolean> {
    const selectNetwork = this.getNetworkMap()[networkKey];

    const { address, currentGenesisHash } = await new Promise<CurrentAccountInfo>((resolve) => {
      this.getCurrentAccount(resolve);
    });

    return this.addConfirmation(id, url, 'switchNetworkRequest', { networkKey, address: changeAddress })
      .then(({ isApproved }) => {
        if (isApproved) {
          const useAddress = changeAddress || address;

          if (useAddress !== ALL_ACCOUNT_KEY) {
            const pair = keyring.getPair(useAddress);

            assert(pair, 'Unable to find pair');

            keyring.saveAccountMeta(pair, { ...pair.meta, genesisHash: selectNetwork?.genesisHash });
          }

          if (address !== changeAddress || selectNetwork?.genesisHash !== currentGenesisHash || isApproved) {
            this.setCurrentAccount({
              address: useAddress,
              currentGenesisHash: selectNetwork?.genesisHash
            });
          }
        }

        return isApproved;
      });
  }

  public async addNetworkConfirm (id: string, url: string, networkData: NetworkJson) {
    networkData.requestId = id;

    return this.addConfirmation(id, url, 'addNetworkRequest', networkData)
      .then(({ isApproved }) => {
        return isApproved;
      });
  }

  public getSettings (update: (value: RequestSettingsType) => void): void {
    this.settingsStore.get('Settings', (value) => {
      if (!value) {
        update({ isShowBalance: false, accountAllLogo: '', theme: 'dark' });
      } else {
        update(value);
      }
    });
  }

  public setSettings (data: RequestSettingsType, callback?: () => void): void {
    this.settingsStore.set('Settings', data, callback);
  }

  public subscribeSettingsSubject (): Subject<RequestSettingsType> {
    return this.settingsStore.getSubject();
  }

  public subscribeCurrentAccount (): Subject<CurrentAccountInfo> {
    return this.currentAccountStore.getSubject();
  }

  public getAccountAddress () {
    return new Promise((resolve, reject) => {
      this.getCurrentAccount((account) => {
        if (account) {
          resolve(account.address);
        } else {
          resolve(null);
        }
      });
    });
  }

  public getBalance (): BalanceJson {
    return { details: this.balanceMap } as BalanceJson;
  }

  public resetBalanceMap () {
    Object.values(this.balanceMap).forEach((balance) => {
      balance.state = APIItemState.PENDING;
    });
    this.balanceSubject.next(this.getBalance());
  }

  public resetStakingMap () {
    Object.values(this.stakingMap).forEach((staking) => {
      staking.state = APIItemState.PENDING;
    });
    this.stakingSubject.next(this.getStaking());
  }

  public resetCrowdloanMap () {
    Object.values(this.crowdloanMap).forEach((item) => {
      item.state = APIItemState.PENDING;
    });
    this.crowdloanSubject.next(this.getCrowdloan());
  }

  public setBalanceItem (networkKey: string, item: BalanceItem) {
    this.balanceMap[networkKey] = item;
    this.lazyNext('setBalanceItem', () => {
      this.balanceSubject.next(this.getBalance());
    });
  }

  public subscribeBalance () {
    return this.balanceSubject;
  }

  public async fetchCrowdloanFundMap () {
    this.crowdloanFundMap = await fetchDotSamaCrowdloan();
  }

  public getCrowdloan (): CrowdloanJson {
    return { details: this.crowdloanMap } as CrowdloanJson;
  }

  public setCrowdloanItem (networkKey: string, item: CrowdloanItem) {
    // Fill para state
    const crowdloanFundNode = this.crowdloanFundMap[networkKey];

    if (crowdloanFundNode) {
      item.paraState = convertFundStatus(crowdloanFundNode.status);
    }

    // Update crowdloan map
    this.crowdloanMap[networkKey] = item;
    this.lazyNext('setCrowdloanItem', () => {
      this.crowdloanSubject.next(this.getCrowdloan());
    });
  }

  public subscribeCrowdloan () {
    return this.crowdloanSubject;
  }

  public getChainRegistryMap (): Record<string, ChainRegistry> {
    return this.chainRegistryMap;
  }

  public setChainRegistryItem (networkKey: string, registry: ChainRegistry) {
    this.chainRegistryMap[networkKey] = registry;
    this.lazyNext('setChainRegistry', () => {
      this.chainRegistrySubject.next(this.getChainRegistryMap());
    });
  }

  public upsertChainRegistry (tokenData: CustomEvmToken) {
    const chainRegistry = this.chainRegistryMap[tokenData.chain];
    let tokenKey = '';

    for (const [key, token] of Object.entries(chainRegistry.tokenMap)) {
      if (token.erc20Address === tokenData.smartContract) {
        tokenKey = key;
        break;
      }
    }

    if (tokenKey !== '') {
      chainRegistry.tokenMap[tokenKey] = {
        isMainToken: false,
        symbol: tokenData.symbol,
        name: tokenData.name,
        erc20Address: tokenData.smartContract,
        decimals: tokenData.decimals
      } as TokenInfo;
    } else {
      // @ts-ignore
      chainRegistry.tokenMap[tokenData.symbol] = {
        isMainToken: false,
        symbol: tokenData.symbol,
        name: tokenData.symbol,
        erc20Address: tokenData.smartContract,
        decimals: tokenData.decimals
      } as TokenInfo;
    }

    cacheRegistryMap[tokenData.chain] = chainRegistry;
    this.chainRegistrySubject.next(this.getChainRegistryMap());
  }

  public initChainRegistry () {
    this.chainRegistryMap = {};
    this.getEvmTokenStore((evmTokens) => {
      const erc20Tokens: CustomEvmToken[] = evmTokens ? evmTokens.erc20 : [];

      if (evmTokens) {
        evmTokens.erc20.forEach((token) => {
          if (!token.isDeleted) {
            erc20Tokens.push(token);
          }
        });
      }

      Object.entries(this.apiMap.dotSama).forEach(([networkKey, { api }]) => {
        getRegistry(networkKey, api, erc20Tokens)
          .then((rs) => {
            this.setChainRegistryItem(networkKey, rs);
          })
          .catch(console.error);
      });
    });

    Object.entries(this.apiMap.dotSama).forEach(([networkKey, { api }]) => {
      getRegistry(networkKey, api)
        .then((rs) => {
          this.setChainRegistryItem(networkKey, rs);
        })
        .catch(console.error);
    });
  }

  public subscribeChainRegistryMap () {
    return this.chainRegistrySubject;
  }

  private getTransactionKey (address: string, networkKey: string): string {
    return `${address}_${networkKey}`;
  }

  public getTransactionHistory (address: string, networkKey: string, update: (items: TransactionHistoryItemType[]) => void): void {
    this.transactionHistoryStore.get(this.getTransactionKey(address, networkKey), (items) => {
      if (!items) {
        update([]);
      } else {
        update(items);
      }
    });
  }

  public getTransactionHistoryByMultiNetworks (address: string, networkKeys: string[], update: (items: TransactionHistoryItemType[]) => void): void {
    const keys: string[] = networkKeys.map((n) => this.getTransactionKey(address, n));

    this.transactionHistoryStore.getByMultiKeys(keys, (items) => {
      if (!items) {
        update([]);
      } else {
        items.sort((a, b) => b.time - a.time);

        update(items);
      }
    });
  }

  public subscribeHistory () {
    return this.historySubject;
  }

  public getHistoryMap (): Record<string, TransactionHistoryItemType[]> {
    return this.historyMap;
  }

  public setTransactionHistory (address: string, networkKey: string, item: TransactionHistoryItemType, callback?: (items: TransactionHistoryItemType[]) => void): void {
    this.getTransactionHistory(address, networkKey, (items) => {
      if (!items || !items.length) {
        items = [item];
      } else {
        items.unshift(item);
      }

      this.transactionHistoryStore.set(this.getTransactionKey(address, networkKey), items, () => {
        callback && callback(items);
      });
    });
  }

  public setTransactionHistoryV2 (address: string, networkKey: string, items: TransactionHistoryItemType[]) {
    this.transactionHistoryStore.set(this.getTransactionKey(address, networkKey), items);
  }

  public setPrice (priceData: PriceJson, callback?: (priceData: PriceJson) => void): void {
    this.priceStore.set('PriceData', priceData, () => {
      if (callback) {
        callback(priceData);
        this.priceStoreReady = true;
      }
    });
  }

  public getPrice (update: (value: PriceJson) => void): void {
    this.priceStore.get('PriceData', (rs) => {
      if (this.priceStoreReady) {
        update(rs);
      } else {
        const activeNetworks: string[] = [];

        Object.values(this.networkMap).forEach((network) => {
          if (network.active && network.coinGeckoKey) {
            activeNetworks.push(network.coinGeckoKey);
          }
        });

        getTokenPrice(activeNetworks)
          .then((rs) => {
            this.setPrice(rs);
            update(rs);
          })
          .catch((err) => {
            console.error(err);
            throw err;
          });
      }
    });
  }

  public subscribePrice () {
    return this.priceStore.getSubject();
  }

  public subscribeEvmToken () {
    return this.evmTokenSubject;
  }

  public getEvmTokenState () {
    return this.evmTokenState;
  }

  public getActiveErc20Tokens () {
    const filteredErc20Tokens: CustomEvmToken[] = [];

    this.evmTokenState.erc20.forEach((token) => {
      if (!token.isDeleted) {
        filteredErc20Tokens.push(token);
      }
    });

    return filteredErc20Tokens;
  }

  public getActiveErc721Tokens () {
    const filteredErc721Tokens: CustomEvmToken[] = [];

    this.evmTokenState.erc721.forEach((token) => {
      if (!token.isDeleted) {
        filteredErc721Tokens.push(token);
      }
    });

    return filteredErc721Tokens;
  }

  public getEvmTokenStore (callback: (data: EvmTokenJson) => void) {
    return this.customEvmTokenStore.get('EvmToken', (data) => {
      callback(data);
    });
  }

  public upsertEvmToken (data: CustomEvmToken) {
    let isExist = false;

    for (const token of this.evmTokenState[data.type]) {
      if (token.smartContract === data.smartContract && token.type === data.type && token.chain === data.chain) {
        isExist = true;
        break;
      }
    }

    if (!isExist) {
      this.evmTokenState[data.type].push(data);
    } else {
      this.evmTokenState[data.type] = this.evmTokenState[data.type].map((token) => {
        if (token.smartContract === data.smartContract) {
          return data;
        }

        return token;
      });
    }

    if (data.type === 'erc20') {
      this.upsertChainRegistry(data);
    }

    this.evmTokenSubject.next(this.evmTokenState);
    this.customEvmTokenStore.set('EvmToken', this.evmTokenState);
    this.updateServiceInfo();
  }

  public deleteEvmTokens (targetTokens: DeleteEvmTokenParams[]) {
    const _evmTokenState: EvmTokenJson = this.evmTokenState;
    let needUpdateChainRegistry = false;

    for (const targetToken of targetTokens) {
      for (let index = 0; index < _evmTokenState.erc20.length; index++) {
        if (_evmTokenState.erc20[index].smartContract === targetToken.smartContract && _evmTokenState.erc20[index].chain === targetToken.chain && targetToken.type === 'erc20') {
          if (_evmTokenState.erc20[index].isCustom) {
            _evmTokenState.erc20.splice(index, 1);
          } else {
            _evmTokenState.erc20[index].isDeleted = true;
          }

          needUpdateChainRegistry = true;
        }
      }
    }

    if (needUpdateChainRegistry) {
      for (const targetToken of targetTokens) {
        const chainRegistry = this.chainRegistryMap[targetToken.chain];
        let deleteKey = '';

        for (const [key, token] of Object.entries(chainRegistry.tokenMap)) {
          if (token.erc20Address === targetToken.smartContract && targetToken.type === 'erc20') {
            deleteKey = key;
          }
        }

        delete chainRegistry.tokenMap[deleteKey];
        this.chainRegistryMap[targetToken.chain] = chainRegistry;
        cacheRegistryMap[targetToken.chain] = chainRegistry;
      }
    }

    for (const targetToken of targetTokens) {
      for (let index = 0; index < _evmTokenState.erc721.length; index++) {
        if (_evmTokenState.erc721[index].smartContract === targetToken.smartContract && _evmTokenState.erc721[index].chain === targetToken.chain && targetToken.type === 'erc721') {
          if (_evmTokenState.erc721[index].isCustom) {
            _evmTokenState.erc721.splice(index, 1);
          } else {
            _evmTokenState.erc721[index].isDeleted = true;
          }
        }
      }
    }

    this.evmTokenState = _evmTokenState;
    this.evmTokenSubject.next(this.evmTokenState);
    this.chainRegistrySubject.next(this.getChainRegistryMap());
    this.customEvmTokenStore.set('EvmToken', this.evmTokenState);
    this.updateServiceInfo();
  }

  public getNetworkMap () {
    return this.networkMap;
  }

  public getNetworkMapByKey (key: string) {
    return this.networkMap[key];
  }

  public getEthereumChains (): string[] {
    const result: string[] = [];

    Object.keys(this.networkMap).forEach((k) => {
      if (this.networkMap[k].isEthereum) {
        result.push(k);
      }
    });

    return result;
  }

  public subscribeNetworkMap () {
    return this.networkMapStore.getSubject();
  }

  public async upsertNetworkMap (data: NetworkJson): Promise<boolean> {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;

    if (data.key in this.networkMap) { // update provider for existed network
      if (data.customProviders) {
        this.networkMap[data.key].customProviders = data.customProviders;
      }

      if (data.currentProvider !== this.networkMap[data.key].currentProvider) {
        this.networkMap[data.key].currentProvider = data.currentProvider;
        this.networkMap[data.key].currentProviderMode = data.currentProvider.startsWith('ws') ? 'ws' : 'http';
      }

      this.networkMap[data.key].chain = data.chain;

      if (data.nativeToken) {
        this.networkMap[data.key].nativeToken = data.nativeToken;
      }

      if (data.decimals) {
        this.networkMap[data.key].decimals = data.decimals;
      }

      this.networkMap[data.key].crowdloanUrl = data.crowdloanUrl;

      this.networkMap[data.key].coinGeckoKey = data.coinGeckoKey;

      this.networkMap[data.key].paraId = data.paraId;

      this.networkMap[data.key].blockExplorer = data.blockExplorer;
    } else { // insert
      this.networkMap[data.key] = data;
      this.networkMap[data.key].getStakingOnChain = true; // try to fetch staking on chain for custom network by default
    }

    if (this.networkMap[data.key].active) { // update API map if network is active
      if (data.key in this.apiMap.dotSama) {
        await this.apiMap.dotSama[data.key].api.disconnect();
        delete this.apiMap.dotSama[data.key];
      }

      if (data.isEthereum && data.key in this.apiMap.web3) {
        delete this.apiMap.web3[data.key];
      }

      this.apiMap.dotSama[data.key] = initApi(data.key, getCurrentProvider(data), data.isEthereum);

      if (data.isEthereum && data.isEthereum) {
        this.apiMap.web3[data.key] = initWeb3Api(getCurrentProvider(data));
      }
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
    this.lockNetworkMap = false;

    return true;
  }

  public removeNetworkMap (networkKey: string): boolean {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    delete this.networkMap[networkKey];

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
    this.lockNetworkMap = false;

    return true;
  }

  public async disableNetworkMap (networkKey: string): Promise<boolean> {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    await this.apiMap.dotSama[networkKey].api.disconnect();
    delete this.apiMap.dotSama[networkKey];

    if (this.networkMap[networkKey].isEthereum && this.networkMap[networkKey].isEthereum) {
      delete this.apiMap.web3[networkKey];
    }

    this.networkMap[networkKey].active = false;
    this.networkMap[networkKey].apiStatus = NETWORK_STATUS.DISCONNECTED;
    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
    this.lockNetworkMap = false;

    return true;
  }

  public async disableAllNetworks (): Promise<boolean> {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    const targetNetworkKeys: string[] = [];

    for (const [key, network] of Object.entries(this.networkMap)) {
      if (network.active) {
        targetNetworkKeys.push(key);
        this.networkMap[key].active = false;
      }
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);

    for (const key of targetNetworkKeys) {
      await this.apiMap.dotSama[key].api.disconnect();
      delete this.apiMap.dotSama[key];

      if (this.networkMap[key].isEthereum && this.networkMap[key].isEthereum) {
        delete this.apiMap.web3[key];
      }

      this.networkMap[key].apiStatus = NETWORK_STATUS.DISCONNECTED;
    }

    this.updateServiceInfo();
    this.lockNetworkMap = false;

    return true;
  }

  public enableNetworkMap (networkKey: string) {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    this.apiMap.dotSama[networkKey] = initApi(networkKey, getCurrentProvider(this.networkMap[networkKey]), this.networkMap[networkKey].isEthereum);

    if (this.networkMap[networkKey].isEthereum && this.networkMap[networkKey].isEthereum) {
      this.apiMap.web3[networkKey] = initWeb3Api(getCurrentProvider(this.networkMap[networkKey]));
    }

    this.networkMap[networkKey].active = true;
    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
    this.updateServiceInfo();
    this.lockNetworkMap = false;

    return true;
  }

  public enableAllNetworks () {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    const targetNetworkKeys: string[] = [];

    for (const [key, network] of Object.entries(this.networkMap)) {
      if (!network.active) {
        targetNetworkKeys.push(key);
        this.networkMap[key].active = true;
      }
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);

    for (const key of targetNetworkKeys) {
      this.apiMap.dotSama[key] = initApi(key, getCurrentProvider(this.networkMap[key]), this.networkMap[key].isEthereum);

      if (this.networkMap[key].isEthereum && this.networkMap[key].isEthereum) {
        this.apiMap.web3[key] = initWeb3Api(getCurrentProvider(this.networkMap[key]));
      }
    }

    this.updateServiceInfo();
    this.lockNetworkMap = false;

    return true;
  }

  public async resetDefaultNetwork () {
    if (this.lockNetworkMap) {
      return false;
    }

    this.lockNetworkMap = true;
    const targetNetworkKeys: string[] = [];

    for (const [key, network] of Object.entries(this.networkMap)) {
      if (!network.active) {
        if (key === 'polkadot' || key === 'kusama') {
          this.apiMap.dotSama[key] = initApi(key, getCurrentProvider(this.networkMap[key]), this.networkMap[key].isEthereum);
          this.networkMap[key].active = true;
        }
      } else {
        if (key !== 'polkadot' && key !== 'kusama') {
          targetNetworkKeys.push(key);

          this.networkMap[key].active = false;
          this.networkMap[key].apiStatus = NETWORK_STATUS.DISCONNECTED;
        }
      }
    }

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);

    for (const key of targetNetworkKeys) {
      await this.apiMap.dotSama[key].api.disconnect();
      delete this.apiMap.dotSama[key];

      if (this.networkMap[key].isEthereum && this.networkMap[key].isEthereum) {
        delete this.apiMap.web3[key];
      }
    }

    this.updateServiceInfo();
    this.lockNetworkMap = false;

    return true;
  }

  public updateNetworkStatus (networkKey: string, status: NETWORK_STATUS) {
    this.networkMap[networkKey].apiStatus = status;

    this.networkMapSubject.next(this.networkMap);
    this.networkMapStore.set('NetworkMap', this.networkMap);
  }

  public getDotSamaApiMap () {
    return this.apiMap.dotSama;
  }

  public getDotSamaApi (networkKey: string) {
    return this.apiMap.dotSama[networkKey];
  }

  public getWeb3ApiMap (): Record<string, Web3> {
    return this.apiMap.web3;
  }

  public getApiMap () {
    return this.apiMap;
  }

  public refreshDotSamaApi (key: string) {
    const apiProps = this.apiMap.dotSama[key];

    if (key in this.apiMap.dotSama) {
      if (!apiProps.isApiConnected) {
        apiProps.recoverConnect && apiProps.recoverConnect();
      }
    }

    return true;
  }

  public refreshWeb3Api (key: string) {
    this.apiMap.web3[key] = initWeb3Api(getCurrentProvider(this.networkMap[key]));
  }

  public subscribeServiceInfo () {
    return this.serviceInfoSubject;
  }

  public updateServiceInfo () {
    console.log('<---Update serviceInfo--->');
    this.getCurrentAccount((value) => {
      this.serviceInfoSubject.next({
        networkMap: this.networkMap,
        apiMap: this.apiMap,
        currentAccountInfo: value,
        chainRegistry: this.chainRegistryMap,
        customErc721Registry: this.getActiveErc721Tokens()
      });
    });
  }

  findNetworkKeyByGenesisHash (genesisHash?: string | null): [string | undefined, NetworkJson | undefined] {
    if (!genesisHash) {
      return [undefined, undefined];
    }

    const rs = Object.entries(this.networkMap).find(([networkKey, value]) => (value.genesisHash === genesisHash));

    if (rs) {
      return rs;
    } else {
      return [undefined, undefined];
    }
  }

  findChainIdGenesisHash (genesisHash?: string | null): number | undefined {
    return this.findNetworkKeyByGenesisHash(genesisHash)[1]?.evmChainId;
  }

  findNetworkKeyByChainId (chainId?: number | null): [string | undefined, NetworkJson | undefined] {
    if (!chainId) {
      return [undefined, undefined];
    }

    const rs = Object.entries(this.networkMap).find(([networkKey, value]) => (value.evmChainId === chainId));

    if (rs) {
      return rs;
    } else {
      return [undefined, undefined];
    }
  }

  public accountExportPrivateKey ({ address, password }: RequestAccountExportPrivateKey): ResponseAccountExportPrivateKey {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const exportedJson = keyring.backupAccount(keyring.getPair(address), password);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const decoded = decodePair(password, base64Decode(exportedJson.encoded), exportedJson.encoding.type);

    return {
      privateKey: u8aToHex(decoded.secretKey)
    };
  }

  public getEthKeyring (address: string, password: string): Promise<SimpleKeyring> {
    return new Promise<SimpleKeyring>((resolve) => {
      const { privateKey } = this.accountExportPrivateKey({ address, password: password });
      const ethKeyring = new SimpleKeyring([privateKey]);

      resolve(ethKeyring);
    });
  }

  public async evmSign (id: string, url: string, method: string, params: any, allowedAccounts: string[]): Promise<string | undefined> {
    let address: string;
    let payload: any;

    // Detech params
    if (method === 'eth_sign') {
      [address, payload] = params as [string, string];
    } else if (['eth_signTypedData_v3', 'eth_signTypedData_v4'].indexOf(method) > -1) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [address, payload] = params as [string, any];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-assignment
      payload = JSON.parse(payload);
    } else if (['personal_sign', 'eth_signTypedData', 'eth_signTypedData'].indexOf(method) > -1) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [payload, address] = params as [any, string];
    } else {
      throw new EvmRpcError('INVALID_PARAMS', 'Not found sign method');
    }

    // Check sign abiblity
    if (!allowedAccounts.find((acc) => (acc.toLowerCase() === address.toLowerCase()))) {
      throw new EvmRpcError('INVALID_PARAMS', 'Account ' + address + ' not in allowed list');
    }

    const requiredPassword = true;
    let privateKey = '';

    const validateConfirmationResponsePayload = (result: ConfirmationDefinitions['evmSignatureRequest'][1]) => {
      if (result.isApproved) {
        if (requiredPassword && !result?.password) {
          return Error('Password is required');
        }

        privateKey = (result?.password && this.accountExportPrivateKey({ address: address, password: result.password }).privateKey) || '';

        if (privateKey === '') {
          return Error('Cannot export private key');
        }
      }

      return undefined;
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const signPayload = { address, type: method, payload };

    await this.addConfirmation(id, url, 'evmSignatureRequest', signPayload, true, validateConfirmationResponsePayload)
      .then(({ isApproved, password }) => {
        if (isApproved && password) {
          return password;
        }

        throw new EvmRpcError('USER_REJECTED_REQUEST');
      });

    if (privateKey === '') {
      throw Error('Cannot export private key');
    }

    const simpleKeyring = new SimpleKeyring([privateKey]);

    switch (method) {
      case 'eth_sign':
        return await simpleKeyring.signMessage(address, payload as string);
      case 'personal_sign':
        return await simpleKeyring.signPersonalMessage(address, payload as string);
      case 'eth_signTypedData':
        return await simpleKeyring.signTypedData(address, payload as any[]);
      case 'eth_signTypedData_v1':
        return await simpleKeyring.signTypedData_v1(address, payload as any[]);
      case 'eth_signTypedData_v3':
        return await simpleKeyring.signTypedData_v3(address, payload);
      case 'eth_signTypedData_v4':
        return await simpleKeyring.signTypedData_v4(address, payload);
      default:
        throw new Error('Not found sign method');
    }
  }

  public async evmSendTransaction (id: string, url: string, networkKey: string, transactionParams: EvmSendTransactionParams): Promise<string | undefined> {
    const web3 = this.getWeb3ApiMap()[networkKey];

    const autoFormatNumber = (val?: string | number) => {
      if (typeof val === 'string' && val.startsWith('0x')) {
        return new BN(val.replace('0x', ''), 16).toString();
      } else if (typeof val === 'number') {
        return val.toString();
      }

      return val;
    };

    const transaction: TransactionConfig = {
      from: transactionParams.from,
      to: transactionParams.to,
      value: autoFormatNumber(transactionParams.value),
      gasPrice: autoFormatNumber(transactionParams.gasPrice),
      maxPriorityFeePerGas: autoFormatNumber(transactionParams.maxPriorityFeePerGas),
      maxFeePerGas: autoFormatNumber(transactionParams.maxFeePerGas),
      data: transactionParams.data
    };

    transaction.gas = await web3.eth.estimateGas({ ...transaction });

    const fromAddress = transaction.from as string; // Address is validated in before step
    const requiredPassword = true; // password is always required for to export private, we have planning to save password 15 min like sign keypair.isLocked;

    let privateKey = '';

    const validateConfirmationResponsePayload = (result: ConfirmationDefinitions['evmSendTransactionRequest'][1]) => {
      if (result.isApproved) {
        if (requiredPassword && !result?.password) {
          return Error('Password is required');
        }

        privateKey = (result?.password && this.accountExportPrivateKey({ address: fromAddress, password: result.password }).privateKey) || '';

        if (privateKey === '') {
          return Error('Cannot export private key');
        }
      }

      return undefined;
    };

    return this.addConfirmation(id, url, 'evmSendTransactionRequest', transaction, true, validateConfirmationResponsePayload)
      .then(async ({ isApproved }) => {
        if (isApproved) {
          const signTransaction = await web3.eth.accounts.signTransaction(transaction, privateKey);

          return new Promise<string>((resolve, reject) => {
            signTransaction.rawTransaction && web3.eth.sendSignedTransaction(signTransaction.rawTransaction)
              .on('transactionHash', resolve)
              .on('error', reject);
          });
        } else {
          return Promise.resolve(undefined);
        }
      });
  }

  public getConfirmationsQueueSubject () {
    return this.confirmationsQueueSubject;
  }

  public addConfirmation<CT extends ConfirmationType> (id: string, url: string, type: CT, payload: ConfirmationDefinitions[CT][0]['payload'], requiredPassword = false, validator?: (input: ConfirmationDefinitions[CT][1]) => Error | undefined) {
    const confirmations = this.confirmationsQueueSubject.getValue();
    const confirmationType = confirmations[type] as Record<string, ConfirmationDefinitions[CT][0]>;

    confirmationType[id] = {
      id,
      url,
      requiredPassword,
      payload: payload
    } as ConfirmationDefinitions[CT][0];

    const promise = new Promise<ConfirmationDefinitions[CT][1]>((resolve, reject) => {
      this.confirmationsPromiseMap[id] = {
        validator: validator,
        resolver: {
          resolve: resolve,
          reject: reject
        }
      };
    });

    this.confirmationsQueueSubject.next(confirmations);

    this.popupOpen();

    return promise;
  }

  public completeConfirmation (request: RequestConfirmationComplete) {
    const confirmations = this.confirmationsQueueSubject.getValue();

    const _completeConfirmation = <T extends ConfirmationType> (type: T, result: ConfirmationDefinitions[T][1]) => {
      const { id } = result;
      const { resolver, validator } = this.confirmationsPromiseMap[id];

      if (!resolver || !(confirmations[type][id])) {
        throw new Error('Not found promise for confirmation');
      }

      // Validate response from confirmation popup some info like password, response format....
      const error = validator && validator(result);

      if (error) {
        resolver.reject(error);
      }

      // Delete confirmations from queue
      delete this.confirmationsPromiseMap[id];
      delete confirmations[type][id];
      this.confirmationsQueueSubject.next(confirmations);

      // Update icon, and close queue
      this.updateIconV2(true);
      resolver.resolve(result);
    };

    Object.entries(request).forEach(([type, result]) => {
      if (type === 'addNetworkRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['addNetworkRequest'][1]);
      } else if (type === 'switchNetworkRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['switchNetworkRequest'][1]);
      } else if (type === 'evmSignatureRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['evmSignatureRequest'][1]);
      } else if (type === 'evmSendTransactionRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['evmSendTransactionRequest'][1]);
      }
    });

    return true;
  }
}
