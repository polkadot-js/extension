// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '../../../../__mocks__/chrome';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router';

import { Button } from '../components';
import * as messaging from '../messaging';
import { flushAllPromises } from '../testHelpers';
import { mockedAccount } from './__mocks__/@polkadot/react-qr';
import ImportQr from './ImportQr';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

describe('ImportQr component', () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    jest.mock('@polkadot/react-qr');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    wrapper = mount(
      <MemoryRouter>
        <ImportQr />
      </MemoryRouter>
    );
  });

  it('shows the correct address component with name address and external', () => {
    expect(wrapper.find('Name span').text()).toEqual(mockedAccount.name);
    expect(wrapper.find('[data-field="address"]').text()).toEqual(mockedAccount.content);
    expect(wrapper.find('Name').find('FontAwesomeIcon [data-icon="external-link-square-alt"]').exists()).toBe(true);
  });

  it('button is enabled', () => {
    expect(wrapper.find(Button).prop('isDisabled')).toBe(false);
  });

  it('button is disabled if wrong name', async () => {
    wrapper.find('input').first().simulate('change', { target: { value: 'a' } });
    await act(flushAllPromises);
    wrapper.update();

    expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
  });

  it('shows the external name in the input field', () => {
    expect(wrapper.find('input').prop('value')).toBe(mockedAccount.name);
  });

  it('creates the external account', async () => {
    jest.spyOn(messaging, 'createAccountExternal').mockResolvedValue(false);
    wrapper.find(Button).simulate('click');
    await act(flushAllPromises);

    expect(messaging.createAccountExternal).toHaveBeenCalledWith(mockedAccount.name, mockedAccount.content, mockedAccount.genesisHash);
  });
});
