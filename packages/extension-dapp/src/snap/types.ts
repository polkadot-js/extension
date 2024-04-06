// Copyright 2019-2024 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type GetSnapsResponse = Record<string, Snap>;

export interface Snap {
  permissionName: string;
  id: string;
  version: string;
  initialPermissions: Record<string, unknown>;
}

declare global {
  interface Window {
    ethereum: any; // or a more specific type
  }
}

export interface SnapRpcRequestParams {
  snapId?: string;
  method: string;
  params?: Record<string, any>;
}

export interface SnapInfo {
  id: string;
  name: string;
  initialPermissions: string[];
  iconUrl: string;
  version?: string;
  enabled: boolean;
  blocked: boolean;
}

export type SnapObject = Record<string, SnapInfo>;
