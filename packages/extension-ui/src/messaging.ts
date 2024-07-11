// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* global chrome */
/* eslint-disable no-redeclare */


import { PORT_EXTENSION } from '@polkadot/extension-base/defaults';
import { make as makeExtensionRPC } from '@polkadot/extension-rpc';

import allChains from './util/chains.js';
import * as metadataCache from './MetadataCache.js';

const port = chrome.runtime.connect({ name: PORT_EXTENSION });
const rpc = makeExtensionRPC({
  port,
  allChains,
  metadataCache
})

export const editAccount = rpc.editAccount
export const showAccount = rpc.showAccount
export const tieAccount = rpc.tieAccount
export const exportAccount = rpc.exportAccount
export const exportAccounts = rpc.exportAccounts
export const validateAccount = rpc.validateAccount
export const forgetAccount = rpc.forgetAccount
export const approveAuthRequest = rpc.approveAuthRequest
export const approveMetaRequest = rpc.approveMetaRequest
export const cancelSignRequest = rpc.cancelSignRequest
export const isSignLocked = rpc.isSignLocked
export const approveSignPassword = rpc.approveSignPassword
export const approveSignSignature = rpc.approveSignSignature
export const createAccountExternal = rpc.createAccountExternal
export const createAccountHardware = rpc.createAccountHardware
export const createAccountSuri = rpc.createAccountSuri
export const createSeed = rpc.createSeed
export const getAllMetadata = rpc.getAllMetadata
export const getMetadata = rpc.getMetadata
export const getConnectedTabsUrl = rpc.getConnectedTabsUrl
export const rejectMetaRequest = rpc.rejectMetaRequest
export const subscribeAccounts = rpc.subscribeAccounts
export const subscribeAuthorizeRequests = rpc.subscribeAuthorizeRequests
export const getAuthList = rpc.getAuthList
export const removeAuthorization = rpc.removeAuthorization
export const updateAuthorization = rpc.updateAuthorization
export const deleteAuthRequest = rpc.deleteAuthRequest
export const subscribeMetadataRequests = rpc.subscribeMetadataRequests
export const subscribeSigningRequests = rpc.subscribeSigningRequests
export const validateSeed = rpc.validateSeed
export const validateDerivationPath = rpc.validateDerivationPath
export const deriveAccount = rpc.deriveAccount
export const windowOpen = rpc.windowOpen
export const jsonGetAccountInfo = rpc.jsonGetAccountInfo
export const jsonRestore = rpc.jsonRestore
export const batchRestore = rpc.batchRestore
export const setNotification = rpc.setNotification
export const ping = rpc.ping
