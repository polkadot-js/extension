// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

const LogosMap: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  acala: require('./acala.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  altair: require('./altair.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  astar: require('./astar.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  basilisk: require('./basilisk.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bifrost: require('./bifrost.svg'),
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
  kusama: require('./kusama.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  litentry: require('./litentry.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  manta: require('./manta.png'),
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  'sora-substrate': require('./sora-substrate.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  statemine: require('./statemine.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subgame: require('./subgame.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  statemint: require('./statemine.svg'),
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
  moonbaseAlpha: require('./moonbaseAlpha.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ukraine: require('./ukraine.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  default: require('./default.svg')
};

export default LogosMap;
