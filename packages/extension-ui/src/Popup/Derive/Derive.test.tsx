// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import { MemoryRouter, Route } from 'react-router';
import { configure, mount, ReactWrapper } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils';
import { ThemeProvider } from 'styled-components';
import * as messaging from '@polkadot/extension-ui/messaging';

import { AccountContext, ActionContext, themes } from '../../components';
import { flushAllPromises } from '../../testHelpers';
import { buildHierarchy } from '../../utils/buildHierarchy';
import Derive from '.';
import AddressDropdown from '@polkadot/extension-ui/Popup/Derive/AddressDropdown';

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

  const uncheck = (input: ReactWrapper): unknown => input.simulate('change', { target: { checked: false } });

  const type = async (input: ReactWrapper, value: string): Promise<void> => {
    input.simulate('change', { target: { value } });
    await act(flushAllPromises);
    input.update();
  };

  describe('Parent selection screen', () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    jest.spyOn(messaging, 'validateAccount').mockImplementation(async (_, pass: string) => pass === 'pass');

    it('"Nest Account under" checkbox is selected by default', async () => {
      const { wrapper } = await mountComponent();
      const checkbox = wrapper.find('input[type="checkbox"]');

      expect(checkbox.prop('checked')).toBe(true);
    });

    it('"Create new root" button becomes visible after checkbox is unchecked', async () => {
      const { wrapper } = await mountComponent();

      uncheck(wrapper.find('input[type="checkbox"]'));

      expect(wrapper.exists('[data-button-action="create root account"]')).toBe(true);
      expect(wrapper.exists('[data-button-action="create derived account"]')).toBe(false);
    });

    it('"Create new root" button redirects to /account/create', async () => {
      const { onActionStub, wrapper } = await mountComponent();

      uncheck(wrapper.find('input[type="checkbox"]'));
      wrapper.find('[data-button-action="create root account"] button').simulate('click');

      expect(onActionStub).toBeCalledWith('/account/create');
    });

    it('"Create derived account" is visible when checkbox is checked', async () => {
      const { wrapper } = await mountComponent();

      expect(wrapper.exists('[data-button-action="create derived account"]')).toBe(true);
      expect(wrapper.exists('[data-button-action="create root account"]')).toBe(false);
    });

    it('"Create derived account" is disabled when password is incorrect', async () => {
      const { wrapper } = await mountComponent();

      const button = wrapper.find('[data-button-action="create derived account"] button');

      expect(button.prop('disabled')).toBe(true);
    });

    it('"Create derived account" is enabled when password is correct', async () => {
      const { wrapper } = await mountComponent();

      await type(wrapper.find('input[type="password"]'), 'pass');

      const button = wrapper.find('[data-button-action="create derived account"] button');

      expect(button.prop('disabled')).toBe(false);
    });

    it('derivation path input is not present until password is correct', async () => {
      const { wrapper } = await mountComponent();

      expect(wrapper.exists('[data-input-suri]')).toBe(false);
      await type(wrapper.find('input[type="password"]'), 'pass');
      expect(wrapper.exists('[data-input-suri]')).toBe(true);
      await type(wrapper.find('input[type="password"]'), 'pass2');
      expect(wrapper.exists('[data-input-suri]')).toBe(false);
    });

    it('"Create derived account" is disabled when suri is incorrect', async () => {
      const { wrapper } = await mountComponent();

      await type(wrapper.find('input[type="password"]'), 'pass');
      await type(wrapper.find('[data-input-suri] input'), '//');

      const button = wrapper.find('[data-button-action="create derived account"] button');

      expect(button.prop('disabled')).toBe(false);
    });

    it('takes selected address from URL as parent account', async () => {
      const { wrapper } = await mountComponent();

      expect(wrapper.find('[data-field="name"]').first().text()).toBe('B');
    });

    it('selects internal root accounts as other options', async () => {
      const { wrapper } = await mountComponent();

      const options = wrapper.find('[data-parent-option] [data-field="name"] div').map((el) => el.text());

      expect(options).toEqual(['A', 'B', 'D']);
    });

    it('redirects to derive from next account when other option is selected', async () => {
      const { onActionStub, wrapper } = await mountComponent();

      wrapper.find('[data-parent-option]').first().simulate('click');

      expect(onActionStub).toBeCalledWith(`/account/derive/${accounts[0].address}`);
    });
  });

  describe('Locked parent selection', () => {
    it('checkbox does not exist', async () => {
      const { wrapper } = await mountComponent(true);

      expect(wrapper.exists('[type="checkbox"]')).toBe(false);
    });

    it('address dropdown does not exist', async () => {
      const { wrapper } = await mountComponent(true);

      expect(wrapper.exists(AddressDropdown)).toBe(false);
    });

    it('parent is taken from URL', async () => {
      const { wrapper } = await mountComponent(true);

      expect(wrapper.find('[data-field="name"]').first().text()).toBe('B');
    });
  });
});
