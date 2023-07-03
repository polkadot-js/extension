const createMock = (initialMockImpl: Function) => {
  let mockImpl = initialMockImpl;

  const mock = (...args: unknown[]) => mockImpl(...args);

  mock.setMockImpl = (nextMockImpl: Function) => {
    mockImpl = nextMockImpl
  };

  return mock;
}

export const subscribeAccounts = createMock((cb: Function) => cb([]));
export const subscribeAuthorizeRequests = createMock((cb: Function) => cb([]));
export const subscribeMetadataRequests = createMock((cb: Function) => cb([]));
export const subscribeSigningRequests = createMock((cb: Function) => cb([]));
export const getMetadata = createMock((cb: Function) => cb([]));
export const createSeed = () => Promise.resolve({
  address: '5FyJZtpz7W1ugKXsrQxYGfawYymCL3VhprqgrNxqEVwSRYR1', seed: 'loud clog similar hungry damage light together wealth area master potato fire'
});
export const validateSeed = () => Promise.resolve({address: '5FyJZtpz7W1ugKXsrQxYGfawYymCL3VhprqgrNxqEVwSRYR1' })
export const getAllMetadata = () => Promise.resolve([]);
export const createAccountSuri = () => Promise.resolve();
