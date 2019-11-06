// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { act } from 'react-dom/test-utils';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount, ReactWrapper } from 'enzyme';
import { MemoryRouter, Route } from 'react-router';
import React from 'react';

import { Button, defaultTheme } from '../components';
import Export from './Export';
import { exportAccount } from '../messaging';
import { ThemeProvider } from 'styled-components';

configure({ adapter: new Adapter() });
jest.mock('../messaging');
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const flushAllPromises = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

describe('Export component', () => {
  let wrapper: ReactWrapper;
  const VALID_ADDRESS = 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5';

  const enterPassword = (password = 'any password'): void => {
    wrapper.find('[data-export-password] input').simulate('change', { target: { value: password } });
  };

  beforeEach(() => {
    (exportAccount as jest.Mock).mockResolvedValue({ exportedJson: '{ "meta": { "name": "account_name" } }' });

    wrapper = mount(<MemoryRouter
      initialEntries={ [`/account/export/${VALID_ADDRESS}`] }>
      <ThemeProvider theme={defaultTheme}>
        <Route path='/account/export/:address' component={ Export }/>
      </ThemeProvider>
    </MemoryRouter>);
  });

  it('creates export message on button press', async () => {
    enterPassword('passw0rd');
    wrapper.find('[data-export-button] button').simulate('click');
    await act(flushAllPromises);

    expect(exportAccount).toHaveBeenCalledWith(VALID_ADDRESS, 'passw0rd');
  });

  it('button is disabled before any password is typed', () => {
    expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
  });

  it('button is enabled after password is typed', async () => {
    enterPassword();
    await act(flushAllPromises);

    expect(wrapper.find(Button).prop('isDisabled')).toBe(false);
  });
});
