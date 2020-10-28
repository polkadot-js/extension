// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '../../../../../__mocks__/chrome';

import React from 'react';
import { MemoryRouter, Route } from 'react-router';
import { configure, mount, ReactWrapper } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { act } from 'react-dom/test-utils';
import { ThemeProvider } from 'styled-components';

import { AccountContext, ActionContext, themes } from '../../components';
import * as messaging from '../../messaging';
import { buildHierarchy } from '../../util/buildHierarchy';
import { flushAllPromises } from '../../testHelpers';
import AddressDropdown from './AddressDropdown';
import Derive from '.';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

const accounts = [
  { address: '5FjgD3Ns2UpnHJPVeRViMhCttuemaRXEqaD8V5z4vxcsUByA', name: 'A' },
  { address: '5GYmFzQCuC5u3tQNiMZNbFGakrz3Jq31NmMg4D2QAkSoQ2g5', name: 'B' },
  { address: '5D2TPhGEy2FhznvzaNYW9AkuMBbg3cyRemnPsBvBY4ZhkZXA', name: 'BB', parentAddress: '5GYmFzQCuC5u3tQNiMZNbFGakrz3Jq31NmMg4D2QAkSoQ2g5' },
  { address: '5GhGENSJBWQZ8d8mARKgqEkiAxiW3hHeznQDW2iG4XzNieb6', isExternal: true, name: 'C' },
  { address: '5EeaoDj4VDk8V6yQngKBaCD5MpJUCHrhYjVhBjgMHXoYon1s', isExternal: false, name: 'D' },
  { address: '5HRKYp5anSNGtqC7cq9ftiaq4y8Mk7uHk7keaXUrQwZqDWLJ', name: 'DD', parentAddress: '5EeaoDj4VDk8V6yQngKBaCD5MpJUCHrhYjVhBjgMHXoYon1s' }
];

describe('Derive', () => {
  const mountComponent = async (locked = false): Promise<{
    wrapper: ReactWrapper;
    onActionStub: jest.Mock;
  }> => {
    const onActionStub = jest.fn();

    const wrapper = mount(
      <MemoryRouter initialEntries={ [`/account/derive/${accounts[1].address}`] }>
        <ActionContext.Provider value={onActionStub}>
          <AccountContext.Provider value={{
            accounts: accounts,
            hierarchy: buildHierarchy(accounts)
          }}>
            <ThemeProvider theme={themes.dark}>
              <Route path='/account/derive/:address'>
                <Derive isLocked={locked}/>
              </Route>
            </ThemeProvider>
          </AccountContext.Provider>
        </ActionContext.Provider>
      </MemoryRouter>
    );

    await act(flushAllPromises);

    return { onActionStub, wrapper };
  };

  let wrapper: ReactWrapper;
  let onActionStub: jest.Mock;

  const uncheck = (input: ReactWrapper): unknown => input.simulate('change', { target: { checked: false } });

  const type = async (input: ReactWrapper, value: string): Promise<void> => {
    input.simulate('change', { target: { value } });
    await act(flushAllPromises);
    input.update();
  };

  describe('Parent selection screen', () => {
    beforeEach(async () => {
      const mountedComponent = await mountComponent();

      wrapper = mountedComponent.wrapper;
      onActionStub = mountedComponent.onActionStub;
    });

    // eslint-disable-next-line @typescript-eslint/require-await
    jest.spyOn(messaging, 'validateAccount').mockImplementation(async (_, pass: string) => pass === 'pass');

    it('"Derive" checkbox is selected by default', () => {
      const checkbox = wrapper.find('input[type="checkbox"]');

      expect(checkbox.prop('checked')).toBe(true);
    });

    it('"Create new root" button becomes visible after checkbox is unchecked', () => {
      uncheck(wrapper.find('input[type="checkbox"]'));

      expect(wrapper.exists('[data-button-action="create root account"]')).toBe(true);
      expect(wrapper.exists('[data-button-action="create derived account"]')).toBe(false);
    });

    it('"Create new root" button redirects to /account/create', () => {
      uncheck(wrapper.find('input[type="checkbox"]'));
      wrapper.find('[data-button-action="create root account"] button').simulate('click');

      expect(onActionStub).toBeCalledWith('/account/create');
    });

    it('"Create derived account" is visible when checkbox is checked', () => {
      expect(wrapper.exists('[data-button-action="create derived account"]')).toBe(true);
      expect(wrapper.exists('[data-button-action="create root account"]')).toBe(false);
    });

    it('No error is visible when first loading the page', () => {
      expect(wrapper.find('.error')).toHaveLength(0);
    });

    it('"Create derived account" is disabled when password is not set', () => {
      const button = wrapper.find('[data-button-action="create derived account"] button');

      expect(button.prop('disabled')).toBe(true);
    });

    it('"Create derived account" is disabled when password is incorrect', async () => {
      await type(wrapper.find('input[type="password"]'), 'wrong_pass');

      const button = wrapper.find('[data-button-action="create derived account"] button');

      expect(button.prop('disabled')).not.toBe(true);
    });

    it('An error is visible when password is incorrect', async () => {
      await type(wrapper.find('input[type="password"]'), 'wrong_pass');
      wrapper.find('[data-button-action="create derived account"] button').simulate('click');
      await act(flushAllPromises);
      wrapper.update();

      expect(wrapper.find('.error')).toHaveLength(1);
    });

    it('The error disappears when typing a new password', async () => {
      await type(wrapper.find('input[type="password"]'), 'wrong_pass');
      wrapper.find('[data-button-action="create derived account"] button').simulate('click');
      await act(flushAllPromises);
      wrapper.update();

      await type(wrapper.find('input[type="password"]'), 'new_attempt');

      expect(wrapper.find('.error')).toHaveLength(0);
    });

    it('"Create derived account" is enabled when password is set', async () => {
      await type(wrapper.find('input[type="password"]'), 'pass');

      const button = wrapper.find('[data-button-action="create derived account"] button');

      expect(button.prop('disabled')).toBe(false);
      expect(wrapper.find('.error')).toHaveLength(0);
    });

    it('"Create derived account" is disabled when suri is incorrect', async () => {
      await type(wrapper.find('input[type="password"]'), 'pass');
      await type(wrapper.find('[data-input-suri] input'), '//');

      const button = wrapper.find('[data-button-action="create derived account"] button');

      expect(button.prop('disabled')).not.toBe(true);
    });

    it('takes selected address from URL as parent account', () => {
      expect(wrapper.find('[data-field="name"]').first().text()).toBe('B');
    });

    it('selects internal root accounts as other options', () => {
      const options = wrapper.find('[data-parent-option] [data-field="name"]').map((el) => el.text());

      expect(options).toEqual(['A', 'B', 'D']);
    });

    it('redirects to derive from next account when other option is selected', () => {
      wrapper.find('[data-parent-option]').first().simulate('click');

      expect(onActionStub).toBeCalledWith(`/account/derive/${accounts[0].address}`);
    });
  });

  describe('Locked parent selection', () => {
    beforeAll(async () => {
      wrapper = (await mountComponent(true)).wrapper;
    });

    it('checkbox does not exist', () => {
      expect(wrapper.exists('[type="checkbox"]')).toBe(false);
    });

    it('address dropdown does not exist', () => {
      expect(wrapper.exists(AddressDropdown)).toBe(false);
    });

    it('parent is taken from URL', () => {
      expect(wrapper.find('[data-field="name"]').first().text()).toBe('B');
    });
  });
});
