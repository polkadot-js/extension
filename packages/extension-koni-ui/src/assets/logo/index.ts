// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

const LoadLogosMap: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '01.chaosdao.png': require('./01.chaosdao.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '02.RMRK.png': require('./02.RMRK.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '03.Ukraine.png': require('./03.Ukraine.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '04.Aris.png': require('./04.Aris.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '05.ArthSwap.svg': require('./05.ArthSwap.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '06.Astar.png': require('./06.Astar.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '07.Basilisk.png': require('./07.Basilisk.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '08.Beans.png': require('./08.Beans.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '09.Calamari.png': require('./09.Calamari.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '10.Centrifuge.png': require('./10.Centrifuge.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '11.Chrwna.png': require('./11.Chrwna.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '12.Coinversation.png': require('./12.Coinversation.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '13.Composable.png': require('./13.Composable.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '14.csg.png': require('./14.csg.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '15.CSM.png': require('./15.CSM.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '16.Darwinia.png': require('./16.Darwinia.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '16.Kilt.png': require('./16.Kilt.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '17.Edgeware.png': require('./17.Edgeware.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '17.Solarbeam.png': require('./17.Solarbeam.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '18.KMA.png': require('./18.KMA.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '19.Frax.png': require('./19.Frax.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '19.Litentry.png': require('./19.Litentry.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '20.Heiko.png': require('./20.Heiko.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '20.Litmus.png': require('./20.Litmus.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '21.HKO.png': require('./21.HKO.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '22.Imbue.png': require('./22.Imbue.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '22.JPYD.png': require('./22.JPYD.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '23.kbtc.png': require('./23.kbtc.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '25.Kico.png': require('./25.Kico.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '27.Kintsugi.png': require('./27.Kintsugi.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '31.Manta.png': require('./31.Manta.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '32.Moonwell.png': require('./32.Moonwell.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '33.Moonbase.png': require('./33.Moonbase.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '34.Moonbeam.png': require('./34.Moonbeam.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '35.OAK_Network.png': require('./35.OAK_Network.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '36.Opal.png': require('./36.Opal.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '37.Oru.png': require('./37.Oru.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '38.Pichiu.png': require('./38.Pichiu.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '39.Pioneer.png': require('./39.Pioneer.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '40.Pkex.png': require('./40.Pkex.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '40.PolarisDAO.png': require('./40.PolarisDAO.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '41.Quartz.png': require('./41.Quartz.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '42.Shiden.png': require('./42.Shiden.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '44.SiriusFinance.png': require('./44.SiriusFinance.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '45.Starlay.png': require('./45.Starlay.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '46.Subspace.png': require('./46.Subspace.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '47.TaiKSM.png': require('./47.TaiKSM.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '48.Tinker.png': require('./48.Tinker.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '49.Turing.png': require('./49.Turing.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '50.StellaSwap.png': require('./50.StellaSwap.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '51.Zeitgeist.png': require('./51.Zeitgeist.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '52.Zenlink.png': require('./52.Zenlink.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '53.3USD.png': require('./53.3USD.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '54.Acala.png': require('./54.Acala.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '55.Aleph.png': require('./55.Aleph.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '56.Altair.png': require('./56.Altair.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '57.AdtrisDAO.png': require('./57.AdtrisDAO.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '58.aUSD.png': require('./58.aUSD.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '59.Bifrost.png': require('./59.Bifrost.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '60.Bill.png': require('./60.Bill.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '61.Bit.Country.jpg': require('./61.Bit.Country.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '62.BNB.png': require('./62.BNB.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '63.BNC.png': require('./63.BNC.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '64.BTC.png': require('./64.BTC.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '65.BUSD.png': require('./65.BUSD.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '66.ChainX.png': require('./66.ChainX.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '67.Clover.png': require('./67.Clover.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '68.Crab.png': require('./68.Crab.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '69.Crust.png': require('./69.Crust.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '70.DAI.png': require('./70.DAI.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '71.Polkadot.png': require('./71.Polkadot.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '72.Kusama.png': require('./72.Kusama.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '73.Default.png': require('./73.Default.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '74.Dolphin.png': require('./74.Dolphin.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '75.Efinity.png': require('./75.Efinity.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '76.Encointer.png': require('./76.Encointer.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '77.Ethereum.png': require('./77.Ethereum.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '78.Genshiro.png': require('./78.Genshiro.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '79.Glint.png': require('./79.Glint.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '80.HydraDX.png': require('./80.HydraDX.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '81.Integritee.png': require('./81.Integritee.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '82.Interlay.png': require('./82.Interlay.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '83.Karura.png': require('./83.Karura.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '84.Khala.png': require('./84.Khala.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '85.MangataX.png': require('./85.MangataX.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '86.Moonriver.png': require('./86.Moonriver.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '87.Nodle.png': require('./87.Nodle.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '88.Odyssey.png': require('./88.Odyssey.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '89.Pangolin.png': require('./89.Pangolin.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '90.Parallel.png': require('./90.Parallel.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '91.Phala.png': require('./91.Phala.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '92.Picasso.png': require('./92.Picasso.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '93.Polkadex.png': require('./93.Polkadex.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '94.Robonomics.png': require('./94.Robonomics.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '95.Rococo.png': require('./95.Rococo.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '96.Sakura.png': require('./96.Sakura.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '97.Shadow.png': require('./97.Shadow.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '98.Shiba.png': require('./98.Shiba.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '99.Sora.png': require('./99.Sora.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '100.Statemine.png': require('./100.Statemine.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '101.Subgame.png': require('./101.Subgame.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '102.Subsocial.png': require('./102.Subsocial.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '103.tDOT.png': require('./103.tDOT.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '104.UniqueNetwork.png': require('./104.UniqueNetwork.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '105.USDC.png': require('./105.USDC.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '106.USDT.png': require('./106.USDT.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '107.Westend.png': require('./107.Westend.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '108.Equilibrium.png': require('./108.Equilibrium.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '109.cws.png': require('./109.cws.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '110.solarflare.png': require('./110.solarflare.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '111.rib.png': require('./111.rib.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '112.moonwell-artemis.png': require('./112.moonwell-artemis.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '113.origintrail.png': require('./113.origintrail.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '114.kapex.png': require('./114.kapex.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '115.dorafactory.png': require('./115.dorafactory.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '116.bajun.png': require('./116.bajun.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '117.listen.png': require('./117.listen.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '118.kabocha.png': require('./118.kabocha.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '119.gmDie.png': require('./119.gmDie.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '120.amplitude.jpg': require('./120.amplitude.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '121.ternoa.svg': require('./121.ternoa.svg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '122.dataHighway.png': require('./122.dataHighway.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '123.iBTC.jpg': require('./123.iBTC.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '123.Transak.png': require('./123.Transak.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '125.Moonpay.png': require('./125.Moonpay.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '126.OnRamper.png': require('./126.OnRamper.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '127.Gear.png': require('./127.Gear.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '127.MoonpayDark.png': require('./127.MoonpayDark.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '128.BIT.png': require('./128.BIT.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '128.OnRamperDark.png': require('./128.OnRamperDark.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '129.snow.png': require('./129.snow.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '130.PANX.jpg': require('./130.PANX.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '131.Arctic.png': require('./131.Arctic.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '132.LDO.png': require('./132.LDO.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '133.1inch.jpg': require('./133.1inch.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '134.apecoin.jpg': require('./134.apecoin.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '135.bat.jpg': require('./135.bat.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '139.link.jpg': require('./139.link.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '140.chiliz.jpg': require('./140.chiliz.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '141.comp.jpg': require('./141.comp.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '142.cro.jpg': require('./142.cro.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '143.enjin.jpg': require('./143.enjin.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '144.ens.jpg': require('./144.ens.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '145.FTM.jpg': require('./145.FTM.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '146.gala.jpg': require('./146.gala.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '147.kyber.jpg': require('./147.kyber.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '148.MKR.jpg': require('./148.MKR.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '149.MATIC.jpg': require('./149.MATIC.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '150.SAND.jpg': require('./150.SAND.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '151.NEAR.jpg': require('./151.NEAR.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '153.THETA.jpg': require('./153.THETA.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '154.Uniswap.jpg': require('./154.Uniswap.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '156.wsteth.jpg': require('./156.wsteth.jpg'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '157.BNB.png': require('./157.BNB.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '157.busdt.png': require('./157.busdt.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '158.cardano.png': require('./158.cardano.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '159.pancake.png': require('./159.pancake.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '160.vbusd.png': require('./160.vbusd.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '161.vusdt.png': require('./161.vusdt.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '162.xrp.png': require('./162.xrp.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '163.boba.png': require('./163.boba.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '164.xxnetwork.png': require('./164.xxnetwork.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '165.watr.png': require('./165.watr.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '166.fusotao.png': require('./166.fusotao.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '167.discovol.png': require('./167.discovol.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '168.atocha.png': require('./168.atocha.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '169.myriad.png': require('./169.myriad.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '170.dbio.png': require('./170.dbio.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '171.barnacle.png': require('./171.barnacle.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '172.collectives.png': require('./172.collectives.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '172.Pendulum.png': require('./172.Pendulum.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '173.ajuna.png': require('./173.ajuna.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '174.bitgreen.png': require('./174.bitgreen.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '175.frequency.png': require('./175.frequency.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '176.hashed.png': require('./176.hashed.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '177.kylin.png': require('./177.kylin.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '178.ipci.png': require('./178.ipci.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '179.kico.png': require('./179.kico.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '180.luhn.png': require('./180.luhn.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '181.riodefi.png': require('./181.riodefi.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '182.automata.png': require('./182.automata.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '183.creditcoin.png': require('./183.creditcoin.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '184.crownSterling.png': require('./184.crownSterling.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '185.dockMainnet.png': require('./185.dockMainnet.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '186.kusari.png': require('./186.kusari.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '187.logion.png': require('./187.logion.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '188.nftmart.png': require('./188.nftmart.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '189.polymesh.png': require('./189.polymesh.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '190.riochain.png': require('./190.riochain.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '191.sherpax.png': require('./191.sherpax.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '192.swapdex.png': require('./192.swapdex.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '193.3dpass.png': require('./193.3dpass.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '194.kulupu.png': require('./194.kulupu.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '195.joystream.png': require('./195.joystream.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '196.tfa.png': require('./196.tfa.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '197.SubWallet.png': require('./197.SubWallet.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '198.Parity.png': require('./198.Parity.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '199.Keystone.png': require('./199.Keystone.png'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  '200.Ledger.png': require('./200.Ledger.png')
};

export const ChainLogoMap: Record<string, string> = {
  polkadot: LoadLogosMap['71.Polkadot.png'],
  kusama: LoadLogosMap['72.Kusama.png'],
  westend: LoadLogosMap['107.Westend.png'],
  rococo: LoadLogosMap['95.Rococo.png'],
  statemint: LoadLogosMap['100.Statemine.png'],
  pioneer: LoadLogosMap['39.Pioneer.png'],
  ethereum: LoadLogosMap['77.Ethereum.png'],
  ethereum_goerli: LoadLogosMap['77.Ethereum.png'],
  binance: LoadLogosMap['62.BNB.png'],
  binance_test: LoadLogosMap['62.BNB.png'],
  moonbeam: LoadLogosMap['34.Moonbeam.png'],
  astar: LoadLogosMap['06.Astar.png'],
  astarEvm: LoadLogosMap['06.Astar.png'],
  acala: LoadLogosMap['54.Acala.png'],
  parallel: LoadLogosMap['90.Parallel.png'],
  clover: LoadLogosMap['67.Clover.png'],
  cloverEvm: LoadLogosMap['67.Clover.png'],
  hydradx_main: LoadLogosMap['80.HydraDX.png'],
  edgeware: LoadLogosMap['17.Edgeware.png'],
  centrifuge: LoadLogosMap['10.Centrifuge.png'],
  interlay: LoadLogosMap['82.Interlay.png'],
  equilibrium_parachain: LoadLogosMap['108.Equilibrium.png'],
  nodle: LoadLogosMap['87.Nodle.png'],
  darwinia: LoadLogosMap['16.Darwinia.png'],
  sora_ksm: LoadLogosMap['99.Sora.png'],
  odyssey: LoadLogosMap['88.Odyssey.png'],
  polkadex: LoadLogosMap['93.Polkadex.png'],
  aleph: LoadLogosMap['55.Aleph.png'],
  rmrk: LoadLogosMap['02.RMRK.png'],
  dolphin: LoadLogosMap['74.Dolphin.png'],
  alephTest: LoadLogosMap['55.Aleph.png'],
  opal: LoadLogosMap['36.Opal.png'],
  moonbase: LoadLogosMap['33.Moonbase.png'],
  efinity: LoadLogosMap['75.Efinity.png'],
  composableFinance: LoadLogosMap['13.Composable.png'],
  phala: LoadLogosMap['91.Phala.png'],
  crust: LoadLogosMap['69.Crust.png'],
  statemine: LoadLogosMap['100.Statemine.png'],
  karura: LoadLogosMap['83.Karura.png'],
  moonriver: LoadLogosMap['86.Moonriver.png'],
  shiden: LoadLogosMap['42.Shiden.png'],
  shidenEvm: LoadLogosMap['42.Shiden.png'],
  shibuya: LoadLogosMap['06.Astar.png'],
  shibuyaEvm: LoadLogosMap['06.Astar.png'],
  khala: LoadLogosMap['84.Khala.png'],
  bifrost: LoadLogosMap['59.Bifrost.png'],
  bifrost_dot: LoadLogosMap['59.Bifrost.png'],
  bifrost_testnet: LoadLogosMap['59.Bifrost.png'],
  kilt: LoadLogosMap['16.Kilt.png'],
  calamari: LoadLogosMap['09.Calamari.png'],
  basilisk: LoadLogosMap['07.Basilisk.png'],
  altair: LoadLogosMap['56.Altair.png'],
  heiko: LoadLogosMap['20.Heiko.png'],
  kintsugi: LoadLogosMap['27.Kintsugi.png'],
  kintsugi_test: LoadLogosMap['27.Kintsugi.png'],
  picasso: LoadLogosMap['92.Picasso.png'],
  quartz: LoadLogosMap['41.Quartz.png'],
  unique_network: LoadLogosMap['104.UniqueNetwork.png'],
  genshiro: LoadLogosMap['78.Genshiro.png'],
  genshiro_testnet: LoadLogosMap['78.Genshiro.png'],
  subsocial_x: LoadLogosMap['102.Subsocial.png'],
  zeitgeist: LoadLogosMap['51.Zeitgeist.png'],
  sakura: LoadLogosMap['96.Sakura.png'],
  shadow: LoadLogosMap['97.Shadow.png'],
  robonomics: LoadLogosMap['94.Robonomics.png'],
  integritee: LoadLogosMap['81.Integritee.png'],
  integriteePolkadot: LoadLogosMap['81.Integritee.png'],
  crab: LoadLogosMap['68.Crab.png'],
  crabParachain: LoadLogosMap['68.Crab.png'],
  crabEvm: LoadLogosMap['68.Crab.png'],
  pangolin: LoadLogosMap['89.Pangolin.png'],
  pangolinEvm: LoadLogosMap['89.Pangolin.png'],
  bitcountry: LoadLogosMap['61.Bit.Country.jpg'],
  chainx: LoadLogosMap['66.ChainX.png'],
  acala_testnet: LoadLogosMap['54.Acala.png'],
  turing: LoadLogosMap['49.Turing.png'],
  mangatax: LoadLogosMap['85.MangataX.png'],
  mangatax_para: LoadLogosMap['85.MangataX.png'],
  encointer: LoadLogosMap['76.Encointer.png'],
  litmus: LoadLogosMap['20.Litmus.png'],
  litentry: LoadLogosMap['19.Litentry.png'],
  tinkernet: LoadLogosMap['48.Tinker.png'],
  imbue_network: LoadLogosMap['22.Imbue.png'],
  subspace_test: LoadLogosMap['46.Subspace.png'],
  subspace_gemini_2a: LoadLogosMap['46.Subspace.png'],
  origintrail: LoadLogosMap['113.origintrail.png'],
  dorafactory: LoadLogosMap['115.dorafactory.png'],
  bajun: LoadLogosMap['116.bajun.png'],
  listen: LoadLogosMap['117.listen.png'],
  kabocha: LoadLogosMap['118.kabocha.png'],
  gmdie: LoadLogosMap['119.gmDie.png'],
  ternoa: LoadLogosMap['121.ternoa.svg'],
  tanganika: LoadLogosMap['122.dataHighway.png'],
  amplitude: LoadLogosMap['120.amplitude.jpg'],
  pendulum: LoadLogosMap['172.Pendulum.png'],
  gear_testnet: LoadLogosMap['127.Gear.png'],
  snow: LoadLogosMap['129.snow.png'],
  arctic_testnet: LoadLogosMap['131.Arctic.png'],
  ternoa_alphanet: LoadLogosMap['121.ternoa.svg'],
  boba: LoadLogosMap['163.boba.png'],
  boba_rinkeby: LoadLogosMap['163.boba.png'],
  bobabeam: LoadLogosMap['163.boba.png'],
  bobabase: LoadLogosMap['163.boba.png'],
  xx_network: LoadLogosMap['164.xxnetwork.png'],
  watr_network: LoadLogosMap['165.watr.png'],
  watr_network_evm: LoadLogosMap['165.watr.png'],
  subspace_gemini_3a: LoadLogosMap['46.Subspace.png'],
  fusotao: LoadLogosMap['166.fusotao.png'],
  discovol: LoadLogosMap['167.discovol.png'],
  discovol_testnet: LoadLogosMap['167.discovol.png'],
  atocha: LoadLogosMap['168.atocha.png'],
  myriad: LoadLogosMap['169.myriad.png'],
  deBio: LoadLogosMap['170.dbio.png'],
  barnacle: LoadLogosMap['171.barnacle.png'],
  barnacle_evm: LoadLogosMap['171.barnacle.png'],
  collectives: LoadLogosMap['172.collectives.png'],
  ajunaPolkadot: LoadLogosMap['173.ajuna.png'],
  bitgreen: LoadLogosMap['174.bitgreen.png'],
  frequency: LoadLogosMap['175.frequency.png'],
  hashedNetwork: LoadLogosMap['176.hashed.png'],
  kapex: LoadLogosMap['114.kapex.png'],
  kylinNetwork: LoadLogosMap['177.kylin.png'],
  ipci: LoadLogosMap['178.ipci.png'],
  kico: LoadLogosMap['179.kico.png'],
  luhnNetwork: LoadLogosMap['180.luhn.png'],
  pichiu: LoadLogosMap['38.Pichiu.png'],
  riodefi: LoadLogosMap['181.riodefi.png'],
  automata: LoadLogosMap['182.automata.png'],
  creditcoin: LoadLogosMap['183.creditcoin.png'],
  crownSterling: LoadLogosMap['184.crownSterling.png'],
  dockPosMainnet: LoadLogosMap['185.dockMainnet.png'],
  kusari: LoadLogosMap['186.kusari.png'],
  logion: LoadLogosMap['187.logion.png'],
  nftmart: LoadLogosMap['188.nftmart.png'],
  polymesh: LoadLogosMap['189.polymesh.png'],
  riochain: LoadLogosMap['190.riochain.png'],
  sherpax: LoadLogosMap['191.sherpax.png'],
  'sora-substrate': LoadLogosMap['99.Sora.png'],
  swapdex: LoadLogosMap['192.swapdex.png'],
  '3dpass': LoadLogosMap['193.3dpass.png'],
  alephSmartNet: LoadLogosMap['55.Aleph.png'],
  kulupu: LoadLogosMap['194.kulupu.png'],
  joystream: LoadLogosMap['195.joystream.png']
};

export const TokenLogoMap: Record<string, string> = {
  ausd: LoadLogosMap['58.aUSD.png'],
  dot: LoadLogosMap['71.Polkadot.png'],
  ldot: LoadLogosMap['71.Polkadot.png'],
  lcdot: LoadLogosMap['71.Polkadot.png'],
  air: LoadLogosMap['56.Altair.png'],
  coinversation: LoadLogosMap['12.Coinversation.png'],
  equilibrium: LoadLogosMap['108.Equilibrium.png'],
  hydradx: LoadLogosMap['80.HydraDX.png'],
  manta: LoadLogosMap['31.Manta.png'],
  pha: LoadLogosMap['84.Khala.png'],
  neer: LoadLogosMap['39.Pioneer.png'],
  sora: LoadLogosMap['99.Sora.png'],
  subgame: LoadLogosMap['101.Subgame.png'],
  subsocial: LoadLogosMap['102.Subsocial.png'],
  koni: LoadLogosMap['73.Default.png'],
  ukraine: LoadLogosMap['03.Ukraine.png'],
  bnc: LoadLogosMap['59.Bifrost.png'],
  kbtc: LoadLogosMap['23.kbtc.png'],
  kint: LoadLogosMap['27.Kintsugi.png'],
  kusd: LoadLogosMap['58.aUSD.png'],
  lksm: LoadLogosMap['72.Kusama.png'],
  tai: LoadLogosMap['47.TaiKSM.png'],
  vsksm: LoadLogosMap['72.Kusama.png'],
  ksm: LoadLogosMap['72.Kusama.png'],
  kar: LoadLogosMap['83.Karura.png'],
  zlk: LoadLogosMap['52.Zenlink.png'],
  neumann: LoadLogosMap['35.OAK_Network.png'],
  btc: LoadLogosMap['64.BTC.png'],
  eth: LoadLogosMap['77.Ethereum.png'],
  bnb: LoadLogosMap['62.BNB.png'],
  usdt: LoadLogosMap['106.USDT.png'],
  usdc: LoadLogosMap['105.USDC.png'],
  busd: LoadLogosMap['65.BUSD.png'],
  pkex: LoadLogosMap['40.Pkex.png'],
  shib: LoadLogosMap['98.Shiba.png'],
  dai: LoadLogosMap['70.DAI.png'],
  sdn: LoadLogosMap['42.Shiden.png'],
  wbtc: LoadLogosMap['64.BTC.png'],
  weth: LoadLogosMap['77.Ethereum.png'],
  jpyc: LoadLogosMap['22.JPYD.png'],
  glint: LoadLogosMap['79.Glint.png'],
  share: LoadLogosMap['79.Glint.png'],
  beans: LoadLogosMap['08.Beans.png'],
  stella: LoadLogosMap['50.StellaSwap.png'],
  xstella: LoadLogosMap['50.StellaSwap.png'],
  vesolar: LoadLogosMap['110.solarflare.png'],
  flare: LoadLogosMap['110.solarflare.png'],
  mfam: LoadLogosMap['32.Moonwell.png'],
  solar: LoadLogosMap['17.Solarbeam.png'],
  frax: LoadLogosMap['19.Frax.png'],
  fxs: LoadLogosMap['19.Frax.png'],
  cws: LoadLogosMap['109.cws.png'],
  rib: LoadLogosMap['111.rib.png'],
  csg: LoadLogosMap['14.csg.png'],
  movr: LoadLogosMap['86.Moonriver.png'],
  qtz: LoadLogosMap['41.Quartz.png'],
  csm: LoadLogosMap['97.Shadow.png'],
  aris: LoadLogosMap['04.Aris.png'],
  hko: LoadLogosMap['20.Heiko.png'],
  bill: LoadLogosMap['60.Bill.png'],
  chaos: LoadLogosMap['01.chaosdao.png'],
  chrwna: LoadLogosMap['11.Chrwna.png'],
  xcrmrk: LoadLogosMap['02.RMRK.png'],
  xckint: LoadLogosMap['27.Kintsugi.png'],
  xcksm: LoadLogosMap['72.Kusama.png'],
  xckar: LoadLogosMap['83.Karura.png'],
  xcbnc: LoadLogosMap['59.Bifrost.png'],
  xcausd: LoadLogosMap['58.aUSD.png'],
  kma: LoadLogosMap['09.Calamari.png'],
  taiKSM: LoadLogosMap['47.TaiKSM.png'],
  bsx: LoadLogosMap['07.Basilisk.png'],
  polarisdao: LoadLogosMap['40.PolarisDAO.png'],
  arsw: LoadLogosMap['05.ArthSwap.svg'],
  oru: LoadLogosMap['37.Oru.png'],
  srs: LoadLogosMap['44.SiriusFinance.png'],
  atid: LoadLogosMap['57.AdtrisDAO.png'],
  lay: LoadLogosMap['45.Starlay.png'],
  subspace: LoadLogosMap['46.Subspace.png'],
  subspace_gemini: LoadLogosMap['46.Subspace.png'],
  xcpara: LoadLogosMap['90.Parallel.png'],
  xcdot: LoadLogosMap['71.Polkadot.png'],
  xcaca: LoadLogosMap['54.Acala.png'],
  xchko: LoadLogosMap['20.Heiko.png'],
  xcpha: LoadLogosMap['91.Phala.png'],
  xcusdt: LoadLogosMap['106.USDT.png'],
  xcintr: LoadLogosMap['82.Interlay.png'],
  xcibtc: LoadLogosMap['123.iBTC.jpg'],
  ibtc: LoadLogosMap['123.iBTC.jpg'],
  xckbtc: LoadLogosMap['23.kbtc.png'],
  xccsm: LoadLogosMap['15.CSM.png'],
  xcsdn: LoadLogosMap['42.Shiden.png'],
  xckma: LoadLogosMap['18.KMA.png'],
  xclit: LoadLogosMap['19.Litentry.png'],
  xccrab: LoadLogosMap['68.Crab.png'],
  xcteer: LoadLogosMap['81.Integritee.png'],
  tdot: LoadLogosMap['103.tDOT.png'],
  taiksm: LoadLogosMap['47.TaiKSM.png'],
  '3usd': LoadLogosMap['53.3USD.png'],
  well: LoadLogosMap['112.moonwell-artemis.png'],
  bit: LoadLogosMap['128.BIT.png'],
  panx: LoadLogosMap['130.PANX.jpg'],
  ldo: LoadLogosMap['132.LDO.png'],
  '1inch': LoadLogosMap['133.1inch.jpg'],
  ape: LoadLogosMap['134.apecoin.jpg'],
  bat: LoadLogosMap['135.bat.jpg'],
  link: LoadLogosMap['139.link.jpg'],
  chz: LoadLogosMap['140.chiliz.jpg'],
  comp: LoadLogosMap['141.comp.jpg'],
  cro: LoadLogosMap['142.cro.jpg'],
  enj: LoadLogosMap['143.enjin.jpg'],
  ens: LoadLogosMap['144.ens.jpg'],
  ftm: LoadLogosMap['145.FTM.jpg'],
  gala: LoadLogosMap['146.gala.jpg'],
  knc: LoadLogosMap['147.kyber.jpg'],
  mkr: LoadLogosMap['148.MKR.jpg'],
  matic: LoadLogosMap['149.MATIC.jpg'],
  sand: LoadLogosMap['150.SAND.jpg'],
  near: LoadLogosMap['151.NEAR.jpg'],
  theta: LoadLogosMap['153.THETA.jpg'],
  uni: LoadLogosMap['154.Uniswap.jpg'],
  wsteth: LoadLogosMap['156.wsteth.jpg'],
  xrp: LoadLogosMap['162.xrp.png'],
  vusdt: LoadLogosMap['161.vusdt.png'],
  vbusd: LoadLogosMap['160.vbusd.png'],
  cake: LoadLogosMap['159.pancake.png'],
  wbnb: LoadLogosMap['157.BNB.png'],
  btcb: LoadLogosMap['64.BTC.png'],
  'bsc-usd': LoadLogosMap['157.busdt.png'],
  ada: LoadLogosMap['158.cardano.png'],
  tfa: LoadLogosMap['196.tfa.png'],
  subwallet: LoadLogosMap['197.SubWallet.png'],
  parity: LoadLogosMap['198.Parity.png'],
  keystone: LoadLogosMap['199.Keystone.png'],
  ledger: LoadLogosMap['200.Ledger.png'],
  default: LoadLogosMap['73.Default.png'],
  wnd: LoadLogosMap['107.Westend.png'],
  roc: LoadLogosMap['95.Rococo.png'],
  goerlieth: LoadLogosMap['77.Ethereum.png'],
  glmr: LoadLogosMap['34.Moonbeam.png'],
  astr: LoadLogosMap['06.Astar.png'],
  aca: LoadLogosMap['54.Acala.png'],
  para: LoadLogosMap['90.Parallel.png'],
  clv: LoadLogosMap['67.Clover.png'],
  hdx: LoadLogosMap['80.HydraDX.png'],
  edg: LoadLogosMap['17.Edgeware.png'],
  cfg: LoadLogosMap['10.Centrifuge.png'],
  intr: LoadLogosMap['82.Interlay.png'],
  eq: LoadLogosMap['108.Equilibrium.png'],
  nodl: LoadLogosMap['87.Nodle.png'],
  ring: LoadLogosMap['16.Darwinia.png'],
  unit: LoadLogosMap['181.riodefi.png'],
  ares: LoadLogosMap['88.Odyssey.png'],
  pdex: LoadLogosMap['93.Polkadex.png'],
  azero: LoadLogosMap['55.Aleph.png'],
  dol: LoadLogosMap['74.Dolphin.png'],
  tzero: LoadLogosMap['55.Aleph.png'],
  opl: LoadLogosMap['36.Opal.png'],
  dev: LoadLogosMap['33.Moonbase.png'],
  efi: LoadLogosMap['75.Efinity.png'],
  layr: LoadLogosMap['13.Composable.png'],
  cru: LoadLogosMap['69.Crust.png'],
  sby: LoadLogosMap['06.Astar.png'],
  kilt: LoadLogosMap['16.Kilt.png'],
  pica: LoadLogosMap['92.Picasso.png'],
  unq: LoadLogosMap['104.UniqueNetwork.png'],
  gens: LoadLogosMap['78.Genshiro.png'],
  token: LoadLogosMap['78.Genshiro.png'],
  sub: LoadLogosMap['102.Subsocial.png'],
  ztg: LoadLogosMap['51.Zeitgeist.png'],
  sku: LoadLogosMap['96.Sakura.png'],
  xrt: LoadLogosMap['94.Robonomics.png'],
  teer: LoadLogosMap['81.Integritee.png'],
  crab: LoadLogosMap['68.Crab.png'],
  pring: LoadLogosMap['89.Pangolin.png'],
  nuum: LoadLogosMap['61.Bit.Country.jpg'],
  pcx: LoadLogosMap['66.ChainX.png'],
  tur: LoadLogosMap['49.Turing.png'],
  mgat: LoadLogosMap['85.MangataX.png'],
  mgx: LoadLogosMap['85.MangataX.png'],
  lit: LoadLogosMap['19.Litentry.png'],
  tnkr: LoadLogosMap['48.Tinker.png'],
  imbu: LoadLogosMap['22.Imbue.png'],
  tssc: LoadLogosMap['46.Subspace.png'],
  otp: LoadLogosMap['113.origintrail.png'],
  dora: LoadLogosMap['115.dorafactory.png'],
  baju: LoadLogosMap['116.bajun.png'],
  lt: LoadLogosMap['117.listen.png'],
  kab: LoadLogosMap['118.kabocha.png'],
  fren: LoadLogosMap['119.gmDie.png'],
  caps: LoadLogosMap['121.ternoa.svg'],
  dhx: LoadLogosMap['122.dataHighway.png'],
  ampe: LoadLogosMap['120.amplitude.jpg'],
  pen: LoadLogosMap['172.Pendulum.png'],
  icz: LoadLogosMap['129.snow.png'],
  icy: LoadLogosMap['131.Arctic.png'],
  boba: LoadLogosMap['163.boba.png'],
  xx: LoadLogosMap['164.xxnetwork.png'],
  watrd: LoadLogosMap['165.watr.png'],
  tao: LoadLogosMap['166.fusotao.png'],
  disc: LoadLogosMap['167.discovol.png'],
  ato: LoadLogosMap['168.atocha.png'],
  myria: LoadLogosMap['169.myriad.png'],
  dbio: LoadLogosMap['170.dbio.png'],
  bar: LoadLogosMap['171.barnacle.png'],
  ebar: LoadLogosMap['171.barnacle.png'],
  ajun: LoadLogosMap['173.ajuna.png'],
  bbb: LoadLogosMap['174.bitgreen.png'],
  frqcy: LoadLogosMap['175.frequency.png'],
  hash: LoadLogosMap['176.hashed.png'],
  kpx: LoadLogosMap['114.kapex.png'],
  kyl: LoadLogosMap['177.kylin.png'],
  mito: LoadLogosMap['178.ipci.png'],
  kico: LoadLogosMap['179.kico.png'],
  luhn: LoadLogosMap['180.luhn.png'],
  pchu: LoadLogosMap['38.Pichiu.png'],
  ata: LoadLogosMap['182.automata.png'],
  ctc: LoadLogosMap['183.creditcoin.png'],
  csov: LoadLogosMap['184.crownSterling.png'],
  dock: LoadLogosMap['185.dockMainnet.png'],
  ksi: LoadLogosMap['186.kusari.png'],
  lgnt: LoadLogosMap['187.logion.png'],
  nmt: LoadLogosMap['188.nftmart.png'],
  polyx: LoadLogosMap['189.polymesh.png'],
  rfuel: LoadLogosMap['190.riochain.png'],
  ksx: LoadLogosMap['191.sherpax.png'],
  xor: LoadLogosMap['99.Sora.png'],
  sdx: LoadLogosMap['192.swapdex.png'],
  p3d: LoadLogosMap['193.3dpass.png'],
  szero: LoadLogosMap['55.Aleph.png'],
  klp: LoadLogosMap['194.kulupu.png'],
  joy: LoadLogosMap['195.joystream.png']
};

export default ChainLogoMap;
