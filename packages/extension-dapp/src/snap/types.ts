// Copyright 2019-2024 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Json, JsonRpcError, Opaque, SemVerVersion } from '@metamask/utils';

export type SnapId = Opaque<string, typeof snapIdSymbol>;
declare const snapIdSymbol: unique symbol;

/**
 * The result returned by the `wallet_requestSnaps` method.
 *
 * It consists of a map of Snap IDs to either the Snap object or an error.
 */
export type RequestSnapsResult = Record<string, Snap | { error: JsonRpcError }>;

export interface Snap {
  id: SnapId;
  initialPermissions: Record<string, unknown>;
  version: SemVerVersion;
  enabled: boolean;
  blocked: boolean;
}

interface EthereumProvider {
  isMetaMask: boolean;
  request(args: { method: string; params?: unknown }): Promise<unknown>;
  // Add more methods and properties as needed
}

declare global {
  interface Window {
    ethereum: EthereumProvider;
  }
}

export interface SnapRpcRequestParams {
  snapId?: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface SupportedSnap {
  version: string;
  name: string;
}

export type SupportedSnaps = Record<string, SupportedSnap>;

/**
 * The result returned by the `wallet_invokeSnap` method, which is the result
 * returned by the Snap.
 */
export type InvokeSnapResult = Json;
