// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { RegistrarIndex } from '@polkadot/types/interfaces/identity/types';

import { DisplayedJudgement } from '../types';

export interface DropdownOption {
  className?: string;
  key?: string;
  text: React.ReactNode;
  value: string;
}

export type DropdownOptions = DropdownOption[];
export type SortedJudgements = ({ judgementName: DisplayedJudgement, registrarsIndexes: RegistrarIndex[] })[];
