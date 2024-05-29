// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { ButtonSchema } from '@subwallet/react-ui/es/button/button';
import { Icon as _PhosphorIcon, IconProps } from 'phosphor-react';
import React from 'react';

import { Theme as _Theme } from '../themes';

export type Theme = _Theme;
export type PhosphorIcon = _PhosphorIcon;

export type VoidFunction = () => void;
export type AlertDialogButtonProps = {
  text: string,
  onClick: VoidFunction,
  schema?: ButtonSchema,
  icon?: PhosphorIcon,
  iconWeight?: IconProps['weight']
}

export type AlertDialogProps = {
  title: string,
  type?: NotificationType,
  closable?: boolean,
  content: React.ReactNode,
  cancelButton?: AlertDialogButtonProps,
  okButton: AlertDialogButtonProps,
};

export type AccountType = 'ALL' | 'ETHEREUM' | 'SUBSTRATE';

export interface ThemeProps {
  theme: _Theme;
  className?: string;
}

export interface Recoded {
  account: AccountJson | null;
  formatted: string | null;
  genesisHash?: string | null;
  originGenesisHash?: string | null;
  prefix?: number;
  isEthereum: boolean;
}

export interface AddressFlags {
  accountOffset: number;
  addressOffset: number;
  hardwareType?: string;
  isHardware: boolean;
  isMultisig: boolean;
  isProxied: boolean;
  isQr: boolean;
  isUnlockable: boolean;
  threshold: number;
  who: string[];
}

export interface AddressProxy {
  isUnlockCached: boolean;
  signAddress: string | null;
  signPassword: string;
}

export interface TxHandler {
  onTxStart?: () => void;
  onTxUpdate?: (result: any) => void; // TODO: change any type when add logic
  onTxSuccess?: (result: any, extrinsicHash?: string) => void; // TODO: change any type when add logic
  onTxFail?: (result: any | null, error: Error | null, extrinsicHash?: string) => void; // TODO: change any type when add logic
}

export interface TxResult {
  isShowTxResult: boolean;
  isTxSuccess: boolean;
  txError?: Error | null;
  extrinsicHash?: string;
}

export interface TransferResultType {
  isShowTxResult: boolean;
  isTxSuccess: boolean;
  txError?: string[];
  extrinsicHash?: string;
}

export interface QrState {
  isQrHashed: boolean;
  qrAddress: string;
  qrPayload: Uint8Array;
  qrResolve?: (result: any) => void; // TODO: change any type when add logic
  qrReject?: (error: Error) => void;
}

export interface Signed {
  data: Uint8Array;
  message: Uint8Array;
  signature: Uint8Array;
}

export interface ModalQrProps {
  network: {
    networkKey: string;
  };
  account: {
    address: string;
  };
  showExportButton: boolean;
}

export interface SigData {
  signature: `0x${string}`;
}

export * from './account';
export * from './balance';
export * from './buy';
export * from './chain';
export * from './confirmation';
export * from './crowdloan';
export * from './earning';
export * from './form';
export * from './history';
export * from './hook';
export * from './ledger';
export * from './missionPool';
export * from './navigation';
export * from './scanner';
export * from './staking';
export * from './transaction';
export * from './walletConnect';
export * from './earning';
export * from './missionPool';
export * from './localStorage';
