import { isJsonAuthentic, signJson } from './accountJsonIntegrity';

const TEST_ACCOUNT_JSON = {
  address: '5GYX9yKU6pi1dsg6SZTT2ZKQu9h9wLFfvJxdLdFQYCbkNuRf',
  encoded: 'Tk54tKdhy5347wXHf44Xw0erKIUOoPwgai46wiCNjCEAgAAAAQAAAAgAAAAiJN6qocjAJYmxUFE4TB70DE+0YJip/vsRjxpsDaYD0P1WR6TZYZLTI0MNvOPJXeIDBJEBIDeRRxnHDUINRIW821yIDw4lVRpUPVI7/DzPkwTjaNptLXZqRtGvd1XPTjqqZzRqKYBu/nFWJp3f4uPrxrlExSCVyfTKn15GLAQ8zM8Tf7HplvHSuqzukm6Vo+9enZ3X2TPdBLl/P5hr',
  encoding: {
    content: [
      'pkcs8',
      'sr25519'
    ],
    type: [
      'scrypt',
      'xsalsa20-poly1305'
    ],
    version: '3'
  },
  meta: {
    genesisHash: '0x70255b4d28de0fc4e1a193d7e175ad1ccef431598211c55538f1018651a0344e',
    name: 'test 10',
    whenCreated: 1683202623704
  }
};
const password = 'password';

test('appends a signature', async () => {
  const signedAccountJson = await signJson(TEST_ACCOUNT_JSON, password);

  expect(signedAccountJson).toHaveProperty(
    'signatureMaterial',
    {
      signature: expect.any(String),
      salt: expect.any(String)
    }
  );
});

test('signature is verifiable', async () => {
  const signedAccountJson = await signJson(TEST_ACCOUNT_JSON, password);

  expect(await isJsonAuthentic(signedAccountJson, password)).toBeTruthy();
});

test('verification fails if the json is tampered with', async () => {
  const signedAccountJson = await signJson(TEST_ACCOUNT_JSON, password);

  const tamperedAccountJson = {
    ...signedAccountJson,
    meta: {
      // @ts-ignore
      ...signedAccountJson.meta,
      genesisHash: 'fake-genesis-hash'
    }
  };

  expect(await isJsonAuthentic(tamperedAccountJson, password)).toBeFalsy();
});

test('verification fails if wrong password is used', async () => {
  const signedAccountJson = await signJson(TEST_ACCOUNT_JSON, password);

  expect(await isJsonAuthentic(signedAccountJson, 'wrong-password')).toBeFalsy();
});

test('verification fails if the signature is forged', async () => {
  const realSignedAccountJson = await signJson(TEST_ACCOUNT_JSON, password);

  const forgedSignedAccountJson = await signJson(TEST_ACCOUNT_JSON, 'attacker-password');

  const forgedAccountJson = {
    ...realSignedAccountJson,
    signatureMaterial: forgedSignedAccountJson.signatureMaterial
  };

  expect(await isJsonAuthentic(forgedAccountJson, password)).toBeFalsy();
});
