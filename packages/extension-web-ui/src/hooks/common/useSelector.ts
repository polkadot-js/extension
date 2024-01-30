// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-web-ui/stores';
import { TypedUseSelectorHook, useSelector as useReduxSelector } from 'react-redux';

export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;
