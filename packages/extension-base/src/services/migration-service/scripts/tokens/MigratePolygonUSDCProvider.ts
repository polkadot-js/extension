// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MigrateToken from './MigrateToken';

export default class MigratePolygonUSDCProvider extends MigrateToken {
  oldToken = 'polygon-ERC20-USDC-0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  newTokens: string[] = ['polygon-ERC20-USDC.e-0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 'polygon-ERC20-USDC-0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'];
}
