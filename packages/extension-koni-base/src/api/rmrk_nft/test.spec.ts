import {
  getBirdsKanariaByAccount,
  getItemsKanariaByAccount,
  getSingularByAccount
} from "@polkadot/extension-koni-base/api/rmrk_nft/index";

jest.setTimeout(50000)

describe('test getSingularByAccount api', () => {
  test('test getSingularByAccount from endpoints', async () => {
    return getSingularByAccount('DMkCuik9UA1nKDZzC683Hr6GMermD8Tcqq9HvyCtkfF5QRW').then(rs => {
      expect(rs.length).toEqual(71)
      expect(rs[0].block).toEqual(10719419)
      expect(rs[0].metadata.image).toEqual('https://kodadot.mypinata.cloud/ipfs/bafybeigdfb4tpldxbukdabdggpoh54wwb2tzrefok33pgojefoic7ssdiu')
    }).catch(err => {
      console.log(err)
    })
  })
})

describe('test getBirdsKanariaByAccount api', () => {
  test('test getBirdsKanariaByAccount from endpoints', async () => {
    return getBirdsKanariaByAccount('Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr').then(rs => {
      console.log(rs)
      expect(rs).not.toBeNaN()
    }).catch(err => {
      console.log(err)
    })
  })
})

describe('test getItemsKanariaByAccount api', () => {
  test('test getItemsKanariaByAccount from endpoints', async () => {
    return getItemsKanariaByAccount('Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr').then(rs => {
      console.log(rs)
      expect(rs).not.toBeNaN()
    }).catch(err => {
      console.log(err)
    })
  })
})
