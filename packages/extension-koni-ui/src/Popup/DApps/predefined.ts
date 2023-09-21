// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TagProps } from '@subwallet/react-ui';

export enum DAppCategoryType {
  ALL='all',
  DEFI='defi',
  NFT='nft',
  EVM='evm',
  COMMUNITY='community',
  UTILITIES='utilities',
  CROWDLOANS='crowdloans',
  STAKING='staking',
  TEST='test',
  DATA='data',
}

export type DAppCategory = {
  name: string;
  id: DAppCategoryType;
  theme?: TagProps['color'];
};

export type DAppInfo = {
  name: string;
  id: string;
  subTitle: string;
  description: string;
  url: string;
  icon: string;
  categories: string[];
  isSupportSubstrateAccount?: boolean;
  isSupportEthereumAccount?: boolean;
  chains?: string[];
  previewImage?: string;
};

export type PredefinedDApps = {
  categories: DAppCategory[];
  featureDApps: DAppInfo[];
  dApps: DAppInfo[];
};

export const dAppCategoryMap: Record<string, DAppCategory> = {
  [DAppCategoryType.DEFI]: {
    name: 'Defi',
    id: DAppCategoryType.DEFI,
    theme: 'cyan'
  },
  [DAppCategoryType.NFT]: {
    name: 'Nft',
    id: DAppCategoryType.NFT,
    theme: 'primary'
  },
  [DAppCategoryType.EVM]: {
    name: 'EVM',
    id: DAppCategoryType.EVM,
    theme: 'magenta'
  },
  [DAppCategoryType.COMMUNITY]: {
    name: 'Community',
    id: DAppCategoryType.COMMUNITY,
    theme: 'volcano'
  },
  [DAppCategoryType.UTILITIES]: {
    name: 'Utilities',
    id: DAppCategoryType.UTILITIES,
    theme: 'orange'
  },
  [DAppCategoryType.CROWDLOANS]: {
    name: 'Crowdloans',
    id: DAppCategoryType.CROWDLOANS,
    theme: 'blue'
  },
  [DAppCategoryType.STAKING]: {
    name: 'Staking',
    id: DAppCategoryType.STAKING,
    theme: 'geekblue'
  },
  [DAppCategoryType.TEST]: {
    name: 'Test',
    id: DAppCategoryType.TEST,
    theme: 'red'
  },
  [DAppCategoryType.DATA]: {
    name: 'Data',
    id: DAppCategoryType.DATA,
    theme: 'green'
  }
};

export const predefinedDApps: PredefinedDApps = {
  categories: [
    dAppCategoryMap[DAppCategoryType.DEFI],
    dAppCategoryMap[DAppCategoryType.NFT],
    dAppCategoryMap[DAppCategoryType.EVM],
    dAppCategoryMap[DAppCategoryType.COMMUNITY],
    dAppCategoryMap[DAppCategoryType.UTILITIES],
    dAppCategoryMap[DAppCategoryType.CROWDLOANS],
    dAppCategoryMap[DAppCategoryType.STAKING],
    dAppCategoryMap[DAppCategoryType.TEST],
    dAppCategoryMap[DAppCategoryType.DATA]
  ],
  featureDApps: [
    {
      name: 'dotinsights',
      subTitle: 'Polkadot & Kusama Ecosystem Map',
      description: 'A trusted research hub and data platform of Polkadot & Kusama Ecosystem made by SubWallet',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/dotinsights.png',
      id: 'dotinsights.subwallet.app',
      url: 'https://dotinsights.subwallet.app/',
      categories: ['data', 'utilities'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false,
      previewImage: 'https://www.w3schools.com/html/img_girl.jpg'
    },
    {
      name: 'dotinsights',
      subTitle: 'Polkadot & Kusama Ecosystem Map',
      description: 'A trusted research hub and data platform of Polkadot & Kusama Ecosystem made by SubWallet',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/dotinsights.png',
      id: 'dotinsights.subwallet.app',
      url: 'https://dotinsights.subwallet.app/',
      categories: ['data', 'utilities'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false,
      previewImage: 'https://www.w3schools.com/html/img_girl.jpg'
    },
    {
      name: 'dotinsights',
      subTitle: 'Polkadot & Kusama Ecosystem Map',
      description: 'A trusted research hub and data platform of Polkadot & Kusama Ecosystem made by SubWallet',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/dotinsights.png',
      id: 'dotinsights.subwallet.app',
      url: 'https://dotinsights.subwallet.app/',
      categories: ['data', 'utilities'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false,
      previewImage: 'https://www.w3schools.com/html/img_girl.jpg'
    }
  ],
  dApps: [
    {
      name: 'ACE',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/ace.png',
      id: 'ace.web3go.xyz',
      url: 'https://ace.web3go.xyz/#/',
      categories: ['utilities'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false,
      chains: ['polkadot']
    },
    {
      name: 'ArtZero.io - NFT Marketplace for Aleph Zero Blockchain',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/artzero.png',
      id: 'https://a0.artzero.io',
      url: 'https://a0.artzero.io',
      categories: ['defi'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false,
      chains: ['polkadot', 'kusama', 'acala', 'astar']
    },
    {
      name: '1inch - DeFi / DEX aggregator on Ethereum, Binance Smart Chain, Optimism, Polygon, Arbitrum',
      icon: 'https://app.1inch.io/assets/favicon/apple-touch-icon.png',
      id: 'app.1inch.io',
      url: 'https://app.1inch.io/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false,
      chains: []
    },
    {
      name: 'Aave - Open Source Liquidity Protocol',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/aave.png',
      id: 'app.aave.com',
      url: 'https://app.aave.com/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'ArthSwap',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/arthswap.png',
      id: 'app.arthswap.org',
      url: 'https://app.arthswap.org/#/swap',
      categories: ['defi', 'staking', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Basilisk Snek Swap',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/basilisk.png',
      id: 'app.basilisk.cloud',
      url: 'https://app.basilisk.cloud/#/trade',
      categories: ['defi'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Beamswap',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/beamswap.png',
      id: 'app.beamswap.io/exchange/swap',
      url: 'https://app.beamswap.io/exchange/swap',
      categories: ['defi', 'staking', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Bounce',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/bounce-finance.png',
      id: 'app.bounce.finance/market',
      url: 'https://app.bounce.finance/market',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Cask',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/cask-protocol.png',
      id: 'app.cask.fi',
      url: 'https://app.cask.fi',
      categories: ['evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Cosmize Experience',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/cosmize.png',
      id: 'app.cosmize.io',
      url: 'https://app.cosmize.io',
      categories: ['defi'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'DAM',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/dam-finance.png',
      id: 'app.dam.finance',
      url: 'https://app.dam.finance/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Equilibrium',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/equilibrium.png',
      id: 'app.equilibrium.io',
      url: 'https://app.equilibrium.io/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'FiDi',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/fidi.png',
      id: 'app.fidi.tech',
      url: 'https://app.fidi.tech/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'GM! Say it back',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/gm-parachain.png',
      id: 'app.gmordie.com',
      url: 'https://app.gmordie.com/',
      categories: ['community'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Impossible Finance',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/impossible-finance.png',
      id: 'app.impossible.finance',
      url: 'https://app.impossible.finance/explore',
      categories: ['defi', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'MoonFit - Web3 & NFT Lifestyle App',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/moonfit.png',
      id: 'app.moonfit.xyz',
      url: 'https://app.moonfit.xyz/nft-sale',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Multichain',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/multichain.png',
      id: 'app.multichain.org',
      url: 'https://app.multichain.org/#/router',
      categories: ['defi'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Parallel Finance App',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/parallel.png',
      id: 'app.parallel.fi',
      url: 'https://app.parallel.fi/',
      categories: ['defi'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Phala App',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/phala-network.png',
      id: 'app.phala.network',
      url: 'https://app.phala.network/',
      categories: ['defi', 'staking'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Polkasafe',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/polkasafe.png',
      id: 'app.polkasafe.xyz',
      url: 'https://app.polkasafe.xyz/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'PrivaDEX',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/privadex.png',
      id: 'app.privadex.xyz',
      url: 'https://app.privadex.xyz/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Sirius Finance',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/sirius-finance.png',
      id: 'app.sirius.finance',
      url: 'https://app.sirius.finance/#/swap',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Solarbeam',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/solarbeam.png',
      id: 'app.solarbeam.io',
      url: 'https://app.solarbeam.io/exchange/swap',
      categories: ['defi', 'staking', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Solarflare',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/solarflare.png',
      id: 'app.solarflare.io',
      url: 'https://app.solarflare.io/exchange/swap',
      categories: ['defi', 'staking', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Stellaswap',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/stellaswap.png',
      id: 'app.stellaswap.com',
      url: 'https://app.stellaswap.com/exchange/swap',
      categories: ['defi', 'staking', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Subsocial App',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/subsocial.png',
      id: 'app.subsocial.network',
      url: 'https://app.subsocial.network/',
      categories: ['community'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'TAIGA',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/taiga.png',
      id: 'app.taigaprotocol.io',
      url: 'https://app.taigaprotocol.io/assets',
      categories: ['defi'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Uniswap Interface',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/uniswap.png',
      id: 'app.uniswap.org',
      url: 'https://app.uniswap.org/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Zeitgeist',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/zeitgeist.png',
      id: 'app.zeitgeist.pm',
      url: 'https://app.zeitgeist.pm/',
      categories: ['nft', 'utilities'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Acala Platform',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/acala.png',
      id: 'apps.acala.network',
      url: 'https://apps.acala.network/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Darwinia App',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/darwinia.png',
      id: 'apps.darwinia.network',
      url: 'https://apps.darwinia.network/',
      categories: ['staking'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Karura Platform',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/karura.png',
      id: 'apps.karura.network',
      url: 'https://apps.karura.network/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Litmus App',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/litmus.png',
      id: 'apps.litentry.com',
      url: 'https://apps.litentry.com/',
      categories: ['crowdloans'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Moonbeam',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/moonbeam-network.png',
      id: 'apps.moonbeam.network/moonbeam',
      url: 'https://apps.moonbeam.network/moonbeam',
      categories: ['staking', 'crowdloans', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Moonriver',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/moonriver.png',
      id: 'apps.moonbeam.network/moonriver',
      url: 'https://apps.moonbeam.network/moonriver',
      categories: ['staking', 'crowdloans', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'ArtZero.io - NFT Marketplace for Astar Network Blockchain',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/artzero.png',
      id: 'astar.artzero.io',
      url: 'https://astar.artzero.io/',
      categories: ['nft'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Astar Web3 Domains',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/astar-web3-domains.png',
      id: 'astr.domains/buy',
      url: 'https://astr.domains/buy',
      categories: ['community'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Bifrost App',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/bifrost-polkadot.png',
      id: 'bifrost.app',
      url: 'https://bifrost.app/',
      categories: ['defi', 'crowdloans'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Bluez',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/bluez.png',
      id: 'bluez.app',
      url: 'https://bluez.app/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Blur: NFT Marketplace for Pro Traders',
      icon: 'https://blur.io/favicons/180.png',
      id: 'blur.io',
      url: 'https://blur.io/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'The Best Crypto & Binance Bridge | cBridge',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/celer-cbridge.png',
      id: 'cbridge.celer.network',
      url: 'https://cbridge.celer.network/#/transfer',
      categories: ['defi', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Centrifuge Rewards Claim',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/centrifuge.png',
      id: 'centrifuge.io',
      url: 'https://centrifuge.io/parachain/crowdloan/',
      categories: ['crowdloans'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Chainlist',
      icon: 'https://chainlist.org/favicon.ico',
      id: 'chainlist.org',
      url: 'https://chainlist.org/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Huckleberry Finance',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/huckleberry.png',
      id: 'clover.huckleberry.finance',
      url: 'https://clover.huckleberry.finance/#/swap',
      categories: ['defi', 'staking', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Subwallet connect',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/subwallet.png',
      id: 'connect.subwallet.app',
      url: 'https://connect.subwallet.app/#/',
      categories: ['test'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: true
    },
    {
      name: 'Interlay Rewards Claim',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/interlay.png',
      id: 'crowdloan.interlay.io',
      url: 'https://crowdloan.interlay.io/',
      categories: ['crowdloans'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Parallel Rewards Claim',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/parallel.png',
      id: 'crowdloan.parallel.fi',
      url: 'https://crowdloan.parallel.fi/',
      categories: ['crowdloans'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Swap - Curve',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/curve.png',
      id: 'curve.fi',
      url: 'https://curve.fi/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Damned Pirates Society',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/the-damned-pirates-society.png',
      id: 'damnedpiratessociety.io',
      url: 'https://damnedpiratessociety.io/',
      categories: ['nft', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Robonomics',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/robonomics.png',
      id: 'dapp.robonomics.network',
      url: 'https://dapp.robonomics.network/#/staking/',
      categories: ['staking'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'DappRadar',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/dappradar.png',
      id: 'dappradar.com',
      url: 'https://dappradar.com/',
      categories: ['utilities'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Moonfit - Raffle game',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/moonfit.png',
      id: 'dev-event.moonfit.xyz',
      url: 'https://dev-event.moonfit.xyz',
      categories: ['test', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Zenlink',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/zenlink.png',
      id: 'dex.zenlink.pro',
      url: 'https://dex.zenlink.pro/#/swap',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Acala Rewards Claim',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/acala.png',
      id: 'distribution.acala.network',
      url: 'https://distribution.acala.network/claim/acala',
      categories: ['crowdloans'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'dotinsights | Polkadot & Kusama Ecosystem Map',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/dotinsights.png',
      id: 'dotinsights.subwallet.app',
      url: 'https://dotinsights.subwallet.app/',
      categories: ['data', 'utilities'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Dotmarketcap',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/dotmarketcap.png',
      id: 'dotmarketcap.com',
      url: 'https://dotmarketcap.com/',
      categories: ['utilities'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Mandala',
      icon: 'https://enterthemandala.app/SriChakraRainbow.png',
      id: 'enterthemandala.app',
      url: 'https://enterthemandala.app/HomePage',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Raffle & Claim Rewards',
      icon: 'https://event.tfalpha.xyz/logo-32x32.ico',
      id: 'event.tfalpha.xyz',
      url: 'https://event.tfalpha.xyz/',
      categories: ['community'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'EVRLOOT',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/evrloot.png',
      id: 'game.evrloot.com',
      url: 'https://game.evrloot.com/game',
      categories: ['nft'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: "HydraDX - Polkadot's Multi-Headed Liquidity Monster",
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/hydradx.png',
      id: 'hydradx.io',
      url: 'https://hydradx.io',
      categories: ['defi'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'InkWhale.net - Staking and Yield Farming Platform on Aleph Zero',
      icon: 'https://www.inkwhale.net/apple-touch-icon.png',
      id: 'inkwhale.net',
      url: 'https://inkwhale.net',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'a0.inkwhale.net - Staking and Yield Farming Platform on Aleph Zero',
      icon: 'https://www.inkwhale.net/apple-touch-icon.png',
      id: 'a0.inkwhale.net',
      url: 'https://a0.inkwhale.net',
      categories: ['defi'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Kanaria',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/kanaria.png',
      id: 'kanaria.rmrk.app',
      url: 'https://kanaria.rmrk.app/',
      categories: ['nft'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Kintsugi Hub',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/kintsugi.png',
      id: 'kintsugi.interlay.io',
      url: 'https://kintsugi.interlay.io/',
      categories: ['staking', 'defi', 'crowdloans'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'KodaDot',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/kodadot.png',
      id: 'kodadot.xyz',
      url: 'https://kodadot.xyz/',
      categories: ['nft'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Bit.Country Pioneer Rewards Claim',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/bit.country-continuum.png',
      id: 'ksmcrowdloan.bit.country',
      url: 'https://ksmcrowdloan.bit.country/reward',
      categories: ['crowdloans'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Kusama Lido',
      icon: 'https://raw.githubusercontent.com/nova-wallet/nova-utils/master/icons/dapps/color/LIDO_KSM.svg',
      id: 'kusama.lido.fi',
      url: 'https://kusama.lido.fi/',
      categories: ['staking', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Liquid Staking for Digital Tokens',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/lido.png',
      id: 'lido.fi/#networks',
      url: 'https://lido.fi/#networks',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'YieldBay',
      icon: 'https://list.yieldbay.io/favicon/favicon.ico',
      id: 'list.yieldbay.io',
      url: 'https://list.yieldbay.io/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Moonsama',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/moonsama.png',
      id: 'marketplace.moonsama.com',
      url: 'https://marketplace.moonsama.com/',
      categories: ['nft', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Moonfit - Raffle game',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/moonfit.png',
      id: 'mf-raffle-game.web.app',
      url: 'https://mf-raffle-game.web.app',
      categories: ['evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'AzeroPunks',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/azeropunks.png',
      id: 'mint.azeropunks.com',
      url: 'https://mint.azeropunks.com/#/welcome',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Moonbeam Curve',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/curve.png',
      id: 'moonbeam.curve.fi',
      url: 'https://moonbeam.curve.fi/',
      categories: ['defi', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Huckleberry Finance',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/huckleberry.png',
      id: 'moonriver.huckleberry.finance',
      url: 'https://moonriver.huckleberry.finance/#/swap',
      categories: ['defi', 'staking', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Moon Web3 identity',
      icon: 'https://moons.money/logo/logo.png?=2',
      id: 'moons.money',
      url: 'https://moons.money/app',
      categories: ['evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Moonwell',
      icon: 'https://raw.githubusercontent.com/nova-wallet/nova-utils/master/icons/dapps/color/Moonwell.svg',
      id: 'https://moonwell.fi/discover',
      url: 'https://moonwell.fi/discover',
      categories: ['defi', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Notifi',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/notifi-network.png',
      id: 'notifi.network',
      url: 'https://notifi.network/dashboard',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Panorama Swap',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/panorama-swap.png',
      id: 'panoramaswap.app',
      url: 'https://panoramaswap.app/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Bit.Country Pioneer Metaverse',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/bit.country-pioneer.png',
      id: 'pioneer.bit.country',
      url: 'https://pioneer.bit.country/',
      categories: ['nft', 'staking'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Spacers NFT Pods Sale',
      icon: 'https://pods.spacers.app/favicon.png',
      id: 'pods.spacers.app',
      url: 'https://pods.spacers.app/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Polkadot.js',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/polkadot-%7B.js%7D.png',
      id: 'polkadot.js.org',
      url: 'https://polkadot.js.org/apps/#',
      categories: ['utilities'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Polkadot Lido',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/lido.png',
      id: 'polkadot.lido.fi',
      url: 'https://polkadot.lido.fi/',
      categories: ['staking', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Polkassembly',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/polkassembly.png',
      id: 'polkadot.polkassembly.io',
      url: 'https://polkadot.polkassembly.io/',
      categories: ['community'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Swap - Polkaswap',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/polkaswap.png',
      id: 'polkaswap.io',
      url: 'https://polkaswap.io/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: "PolkaVerse u2013 Polkadot's Premier Social Network",
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/polkaverse.png',
      id: 'polkaverse.com',
      url: 'https://polkaverse.com/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Polkawatch',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/polkawatch.png',
      id: 'polkawatch.app',
      url: 'https://polkawatch.app/',
      categories: ['staking'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Astar DApp Hub',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/astar-network.png',
      id: 'portal.astar.network',
      url: 'https://portal.astar.network/',
      categories: ['defi', 'staking', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Evolution Land. Columbus',
      icon: 'https://raw.githubusercontent.com/nova-wallet/nova-utils/master/icons/dapps/color/Evolutionland.png',
      id: 'portal.evolution.land',
      url: 'https://portal.evolution.land/land/3/market/land',
      categories: ['nft', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Secret Stash - Ternoa Marketplace',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/secret-stash.png',
      id: 'secret-stash.io',
      url: 'https://secret-stash.io',
      categories: ['defi'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Singular',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/singular.png',
      id: 'singular-rmrk2-dev.vercel.app',
      url: 'https://singular-rmrk2-dev.vercel.app/',
      categories: ['test'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Singular 2.0',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/singular.png',
      id: 'singular.app',
      url: 'https://singular.app/',
      categories: ['nft'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Singular',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/singular.png',
      id: 'singular.rmrk.app',
      url: 'https://singular.rmrk.app/',
      categories: ['nft'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Kanaria Skybreach',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/skybreach.png',
      id: 'skybreach.app',
      url: 'https://skybreach.app/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Polkadot Staking Dashboard',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/polkadot.png',
      id: 'staking.polkadot.network',
      url: 'https://staking.polkadot.network/dashboard#/overview',
      categories: ['staking'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Sub ID: Substrate Addresses, Balances, Crowdloans and NFTs',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/sub-id.png',
      id: 'sub.id',
      url: 'https://sub.id/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Utopia & TF Alpha',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/utopia-_-tf-alpha.png',
      id: 'tfalpha.xyz',
      url: 'https://tfalpha.xyz/',
      categories: ['community'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'TofuNFT',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/tofunft.png',
      id: 'tofunft.com',
      url: 'https://tofunft.com/',
      categories: ['nft', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Verse DEX | Bitcoin.comu00e2u20acu2122s official decentralized exchange',
      icon: 'https://verse.bitcoin.com/images/favicon.png',
      id: 'verse.bitcoin.com',
      url: 'https://verse.bitcoin.com/#/',
      categories: ['defi'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Avault',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/avault.png',
      id: 'www.avault.network',
      url: 'https://www.avault.network/vault',
      categories: ['evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Bananaswap',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/bananaswap.png',
      id: 'www.bananaswap.app',
      url: 'https://www.bananaswap.app/#/swap',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Braindex | Smart Dex Aggregator',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/braindex.png',
      id: 'www.braindex.io',
      url: 'https://www.braindex.io/swap',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Gear Technologies | Crypto. Smarter.',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/gear.png',
      id: 'www.gear-tech.io',
      url: 'https://www.gear-tech.io/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'HashKey DID',
      icon: 'https://www.hashkey.id/favicon.ico',
      id: 'www.hashkey.id',
      url: 'https://www.hashkey.id/home',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Mangata - The DEX of the future',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/mangata.png',
      id: 'www.mangata.finance',
      url: 'https://www.mangata.finance/',
      categories: ['defi'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'Portal Token Bridge',
      icon: 'https://www.portalbridge.com/favicon.ico',
      id: 'www.portalbridge.com',
      url: 'https://www.portalbridge.com/',
      categories: ['defi'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    },
    {
      name: 'Subsquare',
      icon: 'https://raw.githubusercontent.com/nova-wallet/nova-utils/master/icons/chains/color/SubSquare.svg',
      id: 'www.subsquare.io',
      url: 'https://www.subsquare.io/',
      categories: ['community'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: false
    },
    {
      name: 'XDAO',
      icon: 'https://dotinsights.subwallet.app/assets/images/projects/xdao.png',
      id: 'www.xdao.app',
      url: 'https://www.xdao.app/137',
      categories: ['defi', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'HEAL-Ⅲ | Health to Earn',
      icon: 'https://heal3.com/favicon.svg',
      id: 'www.heal3.com',
      url: 'https://heal3.com',
      categories: ['defi', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Oxalus - NFT Social Commerce Platform',
      icon: 'https://oxalus.io/favicon.ico',
      id: 'www.oxalus.io',
      url: 'https://oxalus.io',
      categories: ['defi', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'Birdeye',
      icon: 'https://birdeye.so/logo.png',
      id: 'www.birdeye.so',
      url: 'https://birdeye.so',
      categories: ['defi', 'evm'],
      isSupportSubstrateAccount: false,
      isSupportEthereumAccount: true
    },
    {
      name: 'AZERO.ID – Domain Service on Aleph Zero',
      icon: 'https://azero.id/favicon.ico',
      id: 'www.azero.id',
      url: 'https://azero.id',
      categories: ['utilities'],
      isSupportSubstrateAccount: true,
      isSupportEthereumAccount: false
    }
  ].map((i) => ({
    ...i,
    subTitle: 'The DeFi Hub of Polkadot',
    description: 'Acala Network is a decentralized stablecoin and liquid staking platform powering cross-blockchain open finance applications',
    chains: i.chains ? i.chains : ['polkadot', 'kusama']
  }))
};
