// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// import type { IconName } from '@fortawesome/fontawesome-svg-core';
// import type { WithTranslation } from 'react-i18next';
// import type { SubmittableExtrinsic } from '@polkadot/api/types';
// import type { Abi } from '@polkadot/api-contract';
// import type { ActionStatus } from '../react-components/Status/types';
import type { AccountId } from '@polkadot/types/interfaces';

// import type { TxCallback, TxFailedCallback } from './Status/types';
//
import { AccountIndex, Address } from '@polkadot/types/interfaces';

// export interface BareProps {
//   children?: React.ReactNode;
//   className?: string;
//   style?: React.CSSProperties;
// }
//
// export interface AppProps {
//   basePath: string;
//   className?: string;
//   onStatusChange: (status: ActionStatus) => void;
// }
//
// export type I18nProps = BareProps & WithTranslation;
//

//
export type BitLength = 8 | 16 | 32 | 64 | 128 | 256;
//
// interface ContractBase {
//   abi: Abi;
// }
//
// export interface Contract extends ContractBase {
//   address: null;
// }
//
// export interface ContractDeployed extends ContractBase {
//   address: string;
// }
//
// export type CallContract = ContractDeployed;
//
// export interface NullContract {
//   abi: null;
//   address: null;
// }

export interface ThemeDef {
  theme: 'dark' | 'light';
}

export interface ThemeProps {
  theme: ThemeDef;
}
//
// export type FlagColor = 'blue' | 'green' | 'grey' | 'orange' | 'pink' | 'red' | 'yellow' | 'theme';
//
export type AccountIdIsh = AccountId | AccountIndex | Address | string | Uint8Array | null;
//
export type DisplayedJudgement = 'Erroneous' | 'Low quality' | 'Known good' | 'Reasonable';
