// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import Adapter from 'enzyme-adapter-react-16';
import { configure } from 'enzyme';

import { exportAccount } from './messaging';

configure({ adapter: new Adapter() });

describe('messaging sends message to background via extension port for', () => {
  test('exportAccount', () => {
    const callback = jest.fn();

    (chrome || browser).runtime.connect().onMessage.addListener(callback);
    exportAccount('HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5', 'passw0rd');

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'pri(accounts.export)',
        request: { address: 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5', password: 'passw0rd' }
      })
    );
  });
});
