// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

const LogosMap: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  acala: require('./54.Acala.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  acala_testnet: require('./54.Acala.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ausd: require('./58.aUSD.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  dot: require('./71.Polkadot.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ldot: require('./71.Polkadot.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  lcdot: require('./71.Polkadot.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  altair: require('./56.Altair.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  air: require('./56.Altair.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  astar: require('./06.Astar.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  astarEvm: require('./06.Astar.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  shibuya: require('./06.Astar.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  shibuyaEvm: require('./06.Astar.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  basilisk: require('./07.Basilisk.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bifrost: require('./59.Bifrost.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bifrost_dot: require('./59.Bifrost.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bifrost_testnet: require('./59.Bifrost.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  calamari: require('./09.Calamari.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  centrifuge: require('./10.Centrifuge.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  clover: require('./67.Clover.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  cloverEvm: require('./67.Clover.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  coinversation: require('./12.Coinversation.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  composableFinance: require('./13.Composable.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  crab: require('./68.Crab.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  crabParachain: require('./68.Crab.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  crabEvm: require('./68.Crab.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  crust: require('./69.Crust.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  darwinia: require('./16.Darwinia.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  edgeware: require('./17.Edgeware.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  efinity: require('./75.Efinity.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  equilibrium: require('./108.Equilibrium.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  equilibrium_parachain: require('./108.Equilibrium.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  genshiro_testnet: require('./78.Genshiro.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  genshiro: require('./78.Genshiro.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  heiko: require('./20.Heiko.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  hydradx: require('./80.HydraDX.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  integritee: require('./81.Integritee.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  interlay: require('./82.Interlay.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  karura: require('./83.Karura.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  khala: require('./84.Khala.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kilt: require('./16.Kilt.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kintsugi: require('./27.Kintsugi.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kintsugi_test: require('./27.Kintsugi.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kusama: require('./72.Kusama.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  litentry: require('./19.Litentry.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  manta: require('./31.Manta.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  dolphin: require('./74.Dolphin.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  moonbeam: require('./34.Moonbeam.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  moonriver: require('./86.Moonriver.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  nodle: require('./87.Nodle.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  parallel: require('./90.Parallel.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pangolin: require('./89.Pangolin.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pangolinEvm: require('./89.Pangolin.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  phala: require('./91.Phala.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pha: require('./91.Phala.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  picasso: require('./92.Picasso.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pichiu: require('./38.Pichiu.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pioneer: require('./39.Pioneer.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  neer: require('./39.Pioneer.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  polkadot: require('./71.Polkadot.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  quartz: require('./41.Quartz.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  rmrk: require('./02.RMRK.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  sakura: require('./96.Sakura.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  shadow: require('./97.Shadow.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  shiden: require('./42.Shiden.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  shidenEvm: require('./42.Shiden.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  sora: require('./99.Sora.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  statemine: require('./100.Statemine.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subgame: require('./101.Subgame.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  statemint: require('./100.Statemine.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subsocial_x: require('./102.Subsocial.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subsocial: require('./102.Subsocial.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  zeitgeist: require('./51.Zeitgeist.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  koni: require('./73.Default.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  westend: require('./107.Westend.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  rococo: require('./95.Rococo.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  robonomics: require('./94.Robonomics.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  odyssey: require('./88.Odyssey.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  polkadex: require('./93.Polkadex.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  aleph: require('./55.Aleph.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  alephTest: require('./55.Aleph.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  alephSmartNet: require('./55.Aleph.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  opal: require('./36.Opal.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  moonbase: require('./33.Moonbase.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ukraine: require('./03.Ukraine.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bitcountry: require('./61.Bit.Country.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  unique_network: require('./104.UniqueNetwork.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bnc: require('./63.BNC.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kbtc: require('./23.kbtc.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kint: require('./27.Kintsugi.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kusd: require('./58.aUSD.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  lksm: require('./72.Kusama.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  tai: require('./47.TaiKSM.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  vsksm: require('./72.Kusama.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ksm: require('./72.Kusama.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kar: require('./83.Karura.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  zlk: require('./52.Zenlink.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  neumann: require('./35.OAK_Network.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  turing: require('./49.Turing.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  mangatax: require('./85.MangataX.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  mangatax_para: require('./85.MangataX.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  chainx: require('./66.ChainX.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  litmus: require('./20.Litmus.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  encointer: require('./76.Encointer.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  btc: require('./64.BTC.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  eth: require('./77.Ethereum.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ethereum: require('./77.Ethereum.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ethereum_goerli: require('./77.Ethereum.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bnb: require('./62.BNB.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  binance: require('./62.BNB.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  binance_test: require('./62.BNB.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  usdt: require('./106.USDT.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  usdc: require('./105.USDC.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  busd: require('./65.BUSD.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pkex: require('./40.Pkex.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  shib: require('./98.Shiba.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  dai: require('./70.DAI.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  sdn: require('./42.Shiden.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  wbtc: require('./64.BTC.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  weth: require('./77.Ethereum.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  jpyc: require('./22.JPYD.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  glint: require('./79.Glint.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  share: require('./79.Glint.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  beans: require('./08.Beans.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  stella: require('./50.StellaSwap.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xstella: require('./50.StellaSwap.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  vesolar: require('./110.solarflare.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  flare: require('./110.solarflare.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  mfam: require('./32.Moonwell.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  solar: require('./17.Solarbeam.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  frax: require('./19.Frax.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  fxs: require('./19.Frax.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  cws: require('./109.cws.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  rib: require('./111.rib.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  csg: require('./14.csg.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  movr: require('./86.Moonriver.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  qtz: require('./41.Quartz.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  csm: require('./15.CSM.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  aris: require('./04.Aris.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  // kico: require('./25.Kico.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  hko: require('./21.HKO.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bill: require('./60.Bill.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  chaos: require('./01.chaosdao.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  chrwna: require('./11.Chrwna.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcrmrk: require('./02.RMRK.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xckint: require('./27.Kintsugi.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcksm: require('./72.Kusama.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xckar: require('./83.Karura.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcbnc: require('./59.Bifrost.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcausd: require('./58.aUSD.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kma: require('./18.KMA.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  taiKSM: require('./47.TaiKSM.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bsx: require('./07.Basilisk.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  polarisdao: require('./40.PolarisDAO.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  arsw: require('./05.ArthSwap.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  oru: require('./37.Oru.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  srs: require('./44.SiriusFinance.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  atid: require('./57.AdtrisDAO.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  lay: require('./45.Starlay.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subspace: require('./46.Subspace.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subspace_gemini: require('./46.Subspace.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subspace_gemini_2a: require('./46.Subspace.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subspace_gemini_3a: require('./46.Subspace.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subspace_test: require('./46.Subspace.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcpara: require('./90.Parallel.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcdot: require('./71.Polkadot.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcaca: require('./54.Acala.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xchko: require('./20.Heiko.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcpha: require('./91.Phala.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcusdt: require('./106.USDT.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcintr: require('./82.Interlay.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcibtc: require('./123.iBTC.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ibtc: require('./123.iBTC.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xckbtc: require('./23.kbtc.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xccsm: require('./15.CSM.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcsdn: require('./42.Shiden.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xckma: require('./18.KMA.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xclit: require('./19.Litentry.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xccrab: require('./68.Crab.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xcteer: require('./81.Integritee.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  imbue_network: require('./22.Imbue.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  tinkernet: require('./48.Tinker.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  hydradx_main: require('./80.HydraDX.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  origintrail: require('./113.origintrail.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kapex: require('./114.kapex.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  dorafactory: require('./115.dorafactory.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bajun: require('./116.bajun.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  listen: require('./117.listen.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kabocha: require('./118.kabocha.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  tdot: require('./103.tDOT.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  taiksm: require('./47.TaiKSM.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '3usd': require('./53.3USD.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  well: require('./112.moonwell-artemis.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  gmdie: require('./119.gmDie.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  amplitude: require('./120.amplitude.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ternoa: require('./121.ternoa.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ternoa_alphanet: require('./121.ternoa.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  integriteePolkadot: require('./81.Integritee.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  tanganika: require('./122.dataHighway.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  gear_testnet: require('./127.Gear.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bit: require('./128.BIT.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  arctic_testnet: require('./131.Arctic.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  snow: require('./129.snow.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  panx: require('./130.PANX.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ldo: require('./132.LDO.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '1inch': require('./133.1inch.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ape: require('./134.apecoin.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bat: require('./135.bat.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  link: require('./139.link.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  chz: require('./140.chiliz.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  comp: require('./141.comp.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  cro: require('./142.cro.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  enj: require('./143.enjin.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ens: require('./144.ens.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ftm: require('./145.FTM.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  gala: require('./146.gala.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  knc: require('./147.kyber.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  mkr: require('./148.MKR.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  matic: require('./149.MATIC.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  sand: require('./150.SAND.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  near: require('./151.NEAR.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  theta: require('./153.THETA.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  uni: require('./154.Uniswap.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  wsteth: require('./156.wsteth.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xrp: require('./162.xrp.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  vusdt: require('./161.vusdt.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  vbusd: require('./160.vbusd.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  cake: require('./159.pancake.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  wbnb: require('./157.BNB.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  btcb: require('./64.BTC.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  'bsc-usd': require('./157.busdt.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ada: require('./158.cardano.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  boba_rinkeby: require('./163.boba.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  boba: require('./163.boba.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bobabase: require('./163.boba.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bobabeam: require('./163.boba.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  // zstake: require('./164.zstake.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  xx_network: require('./164.xxnetwork.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  watr_network: require('./165.watr.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  watr_network_evm: require('./165.watr.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  fusotao: require('./166.fusotao.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  discovol: require('./167.discovol.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  discovol_testnet: require('./167.discovol.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  atocha: require('./168.atocha.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  myriad: require('./169.myriad.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  deBio: require('./170.dbio.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  barnacle: require('./171.barnacle.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  barnacle_evm: require('./171.barnacle.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  collectives: require('./172.collectives.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ajunaPolkadot: require('./173.ajuna.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  bitgreen: require('./174.bitgreen.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  frequency: require('./175.frequency.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  hashedNetwork: require('./176.hashed.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kylinNetwork: require('./177.kylin.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ipci: require('./178.ipci.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kico: require('./179.kico.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  luhnNetwork: require('./180.luhn.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  riodefi: require('./181.riodefi.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  automata: require('./182.automata.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  creditcoin: require('./183.creditcoin.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  crownSterling: require('./184.crownSterling.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  dockPosMainnet: require('./185.dockMainnet.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kusari: require('./186.kusari.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  logion: require('./187.logion.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  nftmart: require('./188.nftmart.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  riochain: require('./190.riochain.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  sherpax: require('./191.sherpax.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  sora_ksm: require('./99.Sora.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  'sora-substrate': require('./99.Sora.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  polymesh: require('./189.polymesh.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  swapdex: require('./192.swapdex.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '3dpass': require('./193.3dpass.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  kulupu: require('./194.kulupu.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  joystream: require('./195.joystream.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  pendulum: require('./172.Pendulum.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  tfa: require('./196.tfa.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  default: require('./73.Default.png')
};

export default LogosMap;
