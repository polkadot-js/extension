// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const isManifestV3 = typeof chrome !== 'undefined' && chrome?.runtime?.getManifest()?.manifest_version === 3;
export const isSupportWindow = typeof window !== 'undefined';
