// Copyright 2019-2023 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const hasMetamask = window.ethereum.isMetaMask;

export async function getLatestPackageVersion(packageName: string): Promise<string> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch package information. Status: ${response.status}`);
    }

    const responseData = await response.json();
    const latestVersion = responseData['dist-tags'].latest;
    return latestVersion;
  } catch (error:any) {
    console.error('Error fetching package information:', error.message);
    throw error;
  }
}
