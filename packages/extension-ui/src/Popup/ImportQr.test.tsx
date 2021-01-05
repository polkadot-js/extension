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

const typeName = async (wrapper: ReactWrapper, value:string) => {
  wrapper.find('input').first().simulate('change', { target: { value } });
  await act(flushAllPromises);
  wrapper.update();
};

describe('ImportQr component', () => {
  let wrapper: ReactWrapper;

  beforeEach(async () => {
    jest.mock('@polkadot/react-qr');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    wrapper = mount(
      <MemoryRouter>
        <ImportQr />
      </MemoryRouter>
    );

    await act(flushAllPromises);
    wrapper.update();
  });

  it('shows the address component as external with correct name and address', () => {
    expect(wrapper.find('Name span').text()).toEqual(mockedAccount.name);
    expect(wrapper.find('[data-field="address"]').text()).toEqual(mockedAccount.content);
    expect(wrapper.find('Name').find('FontAwesomeIcon [data-icon="external-link-square-alt"]').exists()).toBe(true);
  });

  it('button is enabled', () => {
    expect(wrapper.find(Button).prop('isDisabled')).toBe(false);
  });

  it('Error is displayed and button is disabled with a short name', async () => {
    await typeName(wrapper, 'a');

    expect(wrapper.find('.warning-message').first().text()).toBe('Account name is too short');
    expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
  });

  it('has no error message and button enabled with a long name', async () => {
    const longName = 'aaa';

    await typeName(wrapper, 'a');
    await typeName(wrapper, longName);

    expect(wrapper.find('.warning-message')).toHaveLength(0);
    expect(wrapper.find(Button).prop('isDisabled')).toBe(false);
    expect(wrapper.find('Name span').text()).toEqual(longName);
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
