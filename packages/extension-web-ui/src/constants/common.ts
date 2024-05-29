// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// export const EXTENSION_VERSION = chrome.runtime.getManifest().version;
import * as process from 'process';

export const EXTENSION_VERSION = process.env.PKG_VERSION || '0.0.0';
export const WEB_BUILD_NUMBER = process.env.PKG_BUILD_NUMBER || '000001';
export const WIKI_URL = 'https://docs.subwallet.app/';
export const PRIVACY_AND_POLICY_URL = 'https://docs.subwallet.app/privacy-and-security/privacy-policy';
export const TERMS_OF_SERVICE_URL = 'https://docs.subwallet.app/privacy-and-security/terms-of-service';
export const FAQS_URL = 'https://docs.subwallet.app/main/extension-user-guide/faqs';
export const WEBSITE_URL = 'https://subwallet.app/';
export const TELEGRAM_URL = 'https://t.me/subwallet';
export const TWITTER_URL = 'https://twitter.com/subwalletapp';
export const DISCORD_URL = 'https://discord.com/invite/vPCN4vdB8v';
export const SUPPORT_MAIL = 'mailto:support@subwallet.app';
export const EXTENSION_URL = 'https://subwallet.app/download.html';
export const CONTACT_US = 'https://t.me/subwallet';
export const ALL_KEY = 'all';
export const ASTAR_PORTAL_URL = 'https://portal.astar.network/astar/dapp-staking/discover';
export const HELP_URL = 'https://docs.subwallet.app/main/';
