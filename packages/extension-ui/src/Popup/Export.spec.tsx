// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { KeyringPair$Json } from '@polkadot/keyring/types';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route } from 'react-router';
import { ThemeProvider } from 'styled-components';

import { Button, themes, WarningBox } from '../components';
import * as messaging from '../messaging';
import { flushAllPromises } from '../testHelpers';
import Export from './Export';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

describe('Export component', () => {
  let wrapper: ReactWrapper;
  const VALID_ADDRESS = 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5';

  const enterPassword = (password = 'any password'): void => {
    wrapper.find('[data-export-password] input').simulate('change', { target: { value: password } });
  };

  beforeEach(() => {
    jest
      .spyOn(messaging, 'exportAccount')
      .mockResolvedValue({ exportedJson: { meta: { name: 'account_name' } } as unknown as KeyringPair$Json });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    wrapper = mount(
      <MemoryRouter initialEntries={[`/account/export/${VALID_ADDRESS}`]}>
        <ThemeProvider theme={themes.dark}>
          <Route path='/account/export/:address'>
            <Export />
          </Route>
        </ThemeProvider>
      </MemoryRouter>
    );
  });

  it('has form with submit button', () => {
    const submitButton = wrapper.find('button[type="submit"]');
    const form = wrapper.find('form');

    expect(form.props().id).toBeTruthy();
    expect(submitButton.props().form).toBe(form.props().id);
  });

  it('creates export message on button press', async () => {
    enterPassword('passw0rd');

    wrapper.find('form').simulate('submit');
    await act(flushAllPromises);

    expect(messaging.exportAccount).toHaveBeenCalledWith(VALID_ADDRESS, 'passw0rd');
  });

  it('button is disabled before any password is typed', () => {
    expect(wrapper.find(Button).last().prop('isDisabled')).toBe(true);
  });

  it('shows an error if the password is wrong', async () => {
    // silencing the following expected console.error
    console.error = jest.fn();
    // eslint-disable-next-line @typescript-eslint/require-await
    jest.spyOn(messaging, 'exportAccount').mockImplementation(async () => {
      throw new Error('Error');
    });
    enterPassword();
    wrapper.find('form').simulate('submit');
    await act(flushAllPromises);
    wrapper.update();

    expect(wrapper.find({ children: 'Unable to decode using the supplied passphrase.' }).length).toBeGreaterThan(0);
    expect(wrapper.find(Button).last().prop('isDisabled')).toBe(true);
    expect(wrapper.find('InputWithLabel').first().prop('isError')).toBe(true);
  });

  it('shows no error when typing again after a wrong password', async () => {
    // silencing the following expected console.error
    console.error = jest.fn();
    // eslint-disable-next-line @typescript-eslint/require-await
    jest.spyOn(messaging, 'exportAccount').mockImplementation(async () => {
      throw new Error('Unable to decode using the supplied passphrase');
    });
    enterPassword();
    wrapper.find('form').simulate('submit');
    await act(flushAllPromises);
    wrapper.update();

    expect(wrapper.find({ children: 'Unable to decode using the supplied passphrase.' }).length).toBeGreaterThan(0);

    enterPassword();

    expect(wrapper.find(WarningBox)).toHaveLength(1);
    expect(wrapper.find(Button).last().prop('isDisabled')).toBe(false);
    expect(wrapper.find('InputWithLabel').first().prop('isError')).toBe(false);
  });

  it('button is enabled after password is typed', async () => {
    enterPassword();
    await act(flushAllPromises);

    expect(wrapper.find(Button).last().prop('isDisabled')).toBe(false);
  });
});
