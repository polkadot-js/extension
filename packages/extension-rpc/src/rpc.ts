// Copyright 2019-2024 @polkadot/extension-rpc authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* global chrome */
/* eslint-disable no-redeclare */

import type { MessageTypes, MessageTypesWithNoSubscriptions, MessageTypesWithNullRequest, MessageTypesWithSubscriptions, RequestTypes, ResponseTypes, SubscriptionMessageTypes } from '@polkadot/extension-base/background/types';
import type { Message } from '@polkadot/extension-base/types';
import type { MakeOptions, RPC } from './types.js';

import { getId } from '@polkadot/extension-base/utils/getId';
import { metadataExpand } from '@polkadot/extension-chains';

type Handler = Readonly<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscriber?: (data: any) => void;
}>

type Handlers = Record<string, Handler>

export function make({ metadataCache, allChains, port }: MakeOptions): RPC {
  const handlers: Handlers = {};

  port.onMessage.addListener((data: Message['data']): void => {
    const handler = handlers[data.id];

    if (!handler) {
      console.error(`Unknown response: ${JSON.stringify(data)}`);

      return;
    }

    if (!handler.subscriber) {
      delete handlers[data.id];
    }

    if (data.subscription) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      (handler.subscriber as Function)(data.subscription);
    } else if (data.error) {
      handler.reject(new Error(data.error));
    } else {
      handler.resolve(data.response);
    }
  });

  function sendMessage<TMessageType extends MessageTypesWithNullRequest>(message: TMessageType): Promise<ResponseTypes[TMessageType]>;
  function sendMessage<TMessageType extends MessageTypesWithNoSubscriptions>(message: TMessageType, request: RequestTypes[TMessageType]): Promise<ResponseTypes[TMessageType]>;
  function sendMessage<TMessageType extends MessageTypesWithSubscriptions>(message: TMessageType, request: RequestTypes[TMessageType], subscriber: (data: SubscriptionMessageTypes[TMessageType]) => void): Promise<ResponseTypes[TMessageType]>;
  function sendMessage<TMessageType extends MessageTypes> (message: TMessageType, request?: RequestTypes[TMessageType], subscriber?: (data: unknown) => void): Promise<ResponseTypes[TMessageType]> {
    return new Promise((resolve, reject): void => {
      const id = getId();

      handlers[id] = { reject, resolve, subscriber };

      port.postMessage({ id, message, request: request || {} });
    });
  }


  const editAccount: RPC['editAccount'] = async (address, name) => {
    return sendMessage('pri(accounts.edit)', { address, name });
  };

  const showAccount: RPC['showAccount'] = async (address, isShowing) => {
    return sendMessage('pri(accounts.show)', { address, isShowing });
  };

  const tieAccount: RPC['tieAccount'] = async (address, genesisHash) => {
    return sendMessage('pri(accounts.tie)', { address, genesisHash });
  };

  const exportAccount: RPC['exportAccount'] = async (address, password) => {
    return sendMessage('pri(accounts.export)', { address, password });
  };

  const exportAccounts: RPC['exportAccounts'] = async (addresses, password) => {
    return sendMessage('pri(accounts.batchExport)', { addresses, password });
  };

  const validateAccount: RPC['validateAccount'] = async (address, password) => {
    return sendMessage('pri(accounts.validate)', { address, password });
  };

  const forgetAccount: RPC['forgetAccount'] = async (address) => {
    return sendMessage('pri(accounts.forget)', { address });
  };

  const approveAuthRequest: RPC['approveAuthRequest'] = async (id, authorizedAccounts) => {
    return sendMessage('pri(authorize.approve)', { authorizedAccounts, id });
  };

  const approveMetaRequest: RPC['approveMetaRequest'] = async (id) => {
    return sendMessage('pri(metadata.approve)', { id });
  };

  const cancelSignRequest: RPC['cancelSignRequest'] = async (id) => {
    return sendMessage('pri(signing.cancel)', { id });
  };

  const isSignLocked: RPC['isSignLocked'] = async (id) => {
    return sendMessage('pri(signing.isLocked)', { id });
  };

  const approveSignPassword: RPC['approveSignPassword'] = async (id, savePass, password) => {
    return sendMessage('pri(signing.approve.password)', { id, password, savePass });
  };

  const approveSignSignature: RPC['approveSignSignature'] = async (id, signature) => {
    return sendMessage('pri(signing.approve.signature)', { id, signature });
  };

  const createAccountExternal: RPC['createAccountExternal'] = async (name, address, genesisHash) => {
    return sendMessage('pri(accounts.create.external)', { address, genesisHash, name });
  };

  const createAccountHardware: RPC['createAccountHardware'] = async (address, hardwareType, accountIndex, addressOffset, name, genesisHash) => {
    return sendMessage('pri(accounts.create.hardware)', { accountIndex, address, addressOffset, genesisHash, hardwareType, name });
  };

  const createAccountSuri: RPC['createAccountSuri'] = async (name, password, suri, type, genesisHash) => {
    return sendMessage('pri(accounts.create.suri)', { genesisHash, name, password, suri, type });
  };

  const createSeed: RPC['createSeed'] = async (length, seed, type) => {
    return sendMessage('pri(seed.create)', { length, seed, type });
  };

  const getAllMetadata: RPC['getAllMetadata'] = async () => {
    return sendMessage('pri(metadata.list)');
  };

  const getMetadata: RPC['getMetadata'] = async (genesisHash, isPartial = false) => {
    if (!genesisHash) {
      return null;
    }

    let request = metadataCache.getSavedMeta(genesisHash);

    if (!request) {
      request = sendMessage('pri(metadata.get)', genesisHash || null);
      metadataCache.setSavedMeta(genesisHash, request);
    }

    const def = await request;

    if (def) {
      return metadataExpand(def, isPartial);
    } else if (isPartial) {
      const chain = allChains.find((chain) => chain.genesisHash === genesisHash);

      if (chain) {
        return metadataExpand({
          ...chain,
          specVersion: 0,
          tokenDecimals: 15,
          tokenSymbol: 'Unit',
          types: {}
        }, isPartial);
      }
    }

    return null;
  };

  const getConnectedTabsUrl: RPC['getConnectedTabsUrl'] = async () => {
    return sendMessage('pri(connectedTabsUrl.get)', null);
  };

  const rejectMetaRequest: RPC['rejectMetaRequest'] = async (id) => {
    return sendMessage('pri(metadata.reject)', { id });
  };

  const subscribeAccounts: RPC['subscribeAccounts'] = async (cb) => {
    return sendMessage('pri(accounts.subscribe)', null, cb);
  };

  const subscribeAuthorizeRequests: RPC['subscribeAuthorizeRequests'] = async (cb) => {
    return sendMessage('pri(authorize.requests)', null, cb);
  };

  const getAuthList: RPC['getAuthList'] = async () => {
    return sendMessage('pri(authorize.list)');
  };

  const removeAuthorization: RPC['removeAuthorization'] = async (url) => {
    return sendMessage('pri(authorize.remove)', url);
  };

  const updateAuthorization: RPC['updateAuthorization'] = async (authorizedAccounts, url) => {
    return sendMessage('pri(authorize.update)', { authorizedAccounts, url });
  };

  const deleteAuthRequest: RPC['deleteAuthRequest'] = async (requestId) => {
    return sendMessage('pri(authorize.delete.request)', requestId);
  };

  const subscribeMetadataRequests: RPC['subscribeMetadataRequests'] = async (cb) => {
    return sendMessage('pri(metadata.requests)', null, cb);
  };

  const subscribeSigningRequests: RPC['subscribeSigningRequests'] = async (cb) => {
    return sendMessage('pri(signing.requests)', null, cb);
  };

  const validateSeed: RPC['validateSeed'] = async (suri, type) => {
    return sendMessage('pri(seed.validate)', { suri, type });
  };

  const validateDerivationPath: RPC['validateDerivationPath'] = async (parentAddress, suri, parentPassword) => {
    return sendMessage('pri(derivation.validate)', { parentAddress, parentPassword, suri });
  };

  const deriveAccount: RPC['deriveAccount'] = async (parentAddress, suri, parentPassword, name, password, genesisHash) => {
    return sendMessage('pri(derivation.create)', { genesisHash, name, parentAddress, parentPassword, password, suri });
  };

  const windowOpen: RPC['windowOpen'] = async (path) => {
    return sendMessage('pri(window.open)', path);
  };

  const jsonGetAccountInfo: RPC['jsonGetAccountInfo'] = async (json) => {
    return sendMessage('pri(json.account.info)', json);
  };

  const jsonRestore: RPC['jsonRestore'] = async (file, password) => {
    return sendMessage('pri(json.restore)', { file, password });
  };

  const batchRestore: RPC['batchRestore'] = async (file, password) => {
    return sendMessage('pri(json.batchRestore)', { file, password });
  };

  const setNotification: RPC['setNotification'] = async (notification) => {
    return sendMessage('pri(settings.notification)', notification);
  };

  const ping: RPC['ping'] = async () => {
    return sendMessage('pri(ping)', null);
  };

  return {
    editAccount,
    showAccount,
    tieAccount,
    exportAccount,
    exportAccounts,
    validateAccount,
    forgetAccount,
    approveAuthRequest,
    approveMetaRequest,
    cancelSignRequest,
    isSignLocked,
    approveSignPassword,
    approveSignSignature,
    createAccountExternal,
    createAccountHardware,
    createAccountSuri,
    createSeed,
    getAllMetadata,
    getMetadata,
    getConnectedTabsUrl,
    rejectMetaRequest,
    subscribeAccounts,
    subscribeAuthorizeRequests,
    getAuthList,
    removeAuthorization,
    updateAuthorization,
    deleteAuthRequest,
    subscribeMetadataRequests,
    subscribeSigningRequests,
    validateSeed,
    validateDerivationPath,
    deriveAccount,
    windowOpen,
    jsonGetAccountInfo,
    jsonRestore,
    batchRestore,
    setNotification,
    ping
  };
}
