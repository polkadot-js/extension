// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

function detectMv3 () {
  try {
    return chrome?.runtime?.getManifest()?.manifest_version === 3;
  } catch (error) {
    return false;
  }
}

export const isManifestV3 = detectMv3();
export const isSupportWindow = typeof window !== 'undefined';
