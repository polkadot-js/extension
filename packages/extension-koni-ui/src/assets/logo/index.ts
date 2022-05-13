// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

const LogosMap: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  acala: require('./acala.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  acala_testnet: require('./acala.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ausd: require('./ausd.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  dot: require('./dot.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ldot: require('./ldot.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  lcdot: require('./lcdot.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  altair: require('./altair.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  air: require('./altair.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  astar: require('./astar.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  astarEvm: require('./astar.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  basilisk: require('./basilisk.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bifrost: require('./bifrost.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bifrost_testnet: require('./bifrost.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  calamari: require('./calamari.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  centrifuge: require('./centrifuge.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  clover: require('./clover.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  coinversation: require('./coinversation.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  composableFinance: require('./composableFinance.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  crab: require('./crab.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  crust: require('./crust.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  darwinia: require('./darwinia.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  edgeware: require('./edgeware.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  efinity: require('./efinity.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  equilibrium: require('./equilibrium.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  genshiro: require('./genshiro.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  heiko: require('./heiko.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  hydradx: require('./hydradx.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  integritee: require('./integritee.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  interlay: require('./interlay.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  karura: require('./karura.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  khala: require('./khala.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kilt: require('./kilt.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kintsugi: require('./kintsugi.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kintsugi_test: require('./kintsugi.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kusama: require('./kusama.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  litentry: require('./litentry.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  manta: require('./manta.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  dolphin: require('./dolphin.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  moonbeam: require('./moonbeam.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  moonriver: require('./moonriver.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  nodle: require('./nodle.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  parallel: require('./parallel.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  phala: require('./phala.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pha: require('./phala.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  picasso: require('./picasso.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pichiu: require('./pichiu.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pioneer: require('./pioneer.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  polkadot: require('./polkadot.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  quartz: require('./quartz.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  rmrk: require('./rmrk.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  sakura: require('./sakura.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  shadow: require('./shadow.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  shiden: require('./shiden.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  shidenEvm: require('./shiden.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  sora: require('./sora-substrate.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  statemine: require('./statemine.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subgame: require('./subgame.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  statemint: require('./statemine.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subsocial_x: require('./subsocial.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subsocial: require('./subsocial.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  zeitgeist: require('./zeitgeist.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  koni: require('./koni.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  westend: require('./westend.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  rococo: require('./rococo.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  robonomics: require('./robonomics.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  odyssey: require('./odyssey.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  polkadex: require('./polkadex.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  aleph: require('./aleph.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  alephTest: require('./aleph.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  opal: require('./opal.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  moonbase: require('./moonbase.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ukraine: require('./ukraine.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bitcountry: require('./bitcountry.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  unique_network: require('./unique.network.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pha: require('./phala.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bnc: require('./bnc.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kbtc: require('./kbtc.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kint: require('./kint.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kusd: require('./kusd.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  lksm: require('./lksm.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  tai: require('./tai.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  vsksm: require('./vsksm.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ksm: require('./kusama.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kar: require('./karura.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  zlk: require('./zenlink.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  neumann: require('./oak_network.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  turing: require('./turing.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  mangatax: require('./mangatax.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  mangatax_para: require('./mangatax.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  chainx: require('./chainx.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  litmus: require('./litmus.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  encointer: require('./encointer.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  btc: require('./btc.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  eth: require('./eth.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bnb: require('./bnb.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  usdt: require('./usdt.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  usdc: require('./usdc.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  busd: require('./busd.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pkex: require('./pkex.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  shib: require('./shib.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  dai: require('./dai.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  sdn: require('./shiden.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  wbtc: require('./wbtc.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  weth: require('./eth.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  jpyc: require('./jpyc.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  glint: require('./glint.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  share: require('./glint.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  beans: require('./beans.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  stella: require('./stella.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xstella: require('./xstella.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  vesolar: require('./flare.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  flare: require('./flare.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  mfam: require('./mfam.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  solar: require('./solar.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  frax: require('./frax.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  fxs: require('./frax.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  cws: require('./cws.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  rib: require('./rib.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  csg: require('./csg.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  movr: require('./moonriver.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  qtz: require('./quartz.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  csm: require('./csm.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  aris: require('./aris.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kico: require('./kico.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  hko: require('./hko.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bill: require('./bill.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  chaos: require('./chaosdao.jpeg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  chrwna: require('./chrwna.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcrmrk: require('./rmrk.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xckint: require('./kintsugi.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcksm: require('./kusama.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xckar: require('./karura.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcbnc: require('./bifrost.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcausd: require('./ausd.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kma: require('./kma.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  taiKSM: require('./taiKSM.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bsx: require('./bsx.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  default: require('./default.svg')
};

export default LogosMap;
