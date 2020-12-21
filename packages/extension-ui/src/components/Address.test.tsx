// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '../../../../__mocks__/chrome';

import type { AccountJson } from '@polkadot/extension-base/background/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { Props } from './Address';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { ThemeProvider } from 'styled-components';

import { IconTheme } from '@polkadot/react-identicon/types';
import defaultSettings from '@polkadot/ui-settings';

import * as messaging from '../messaging';
import { flushAllPromises } from '../testHelpers';
import { buildHierarchy } from '../util/buildHierarchy';
import { Address, SettingsContext } from '.';
import { AccountContext, themes } from './';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

interface AccountTestJson extends AccountJson {
  expectedIconTheme: IconTheme
}
const accounts = [
  { address: '5HSDXAC3qEMkSzZK377sTD1zJhjaPiX5tNWppHx2RQMYkjaJ', expectedIconTheme: 'polkadot', name: 'ECDSA Account', type: 'ecdsa' },
  { address: '5FjgD3Ns2UpnHJPVeRViMhCttuemaRXEqaD8V5z4vxcsUByA', expectedIconTheme: 'polkadot', name: 'Ed Account', type: 'ed25519' },
  { address: '5GYmFzQCuC5u3tQNiMZNbFGakrz3Jq31NmMg4D2QAkSoQ2g5', expectedIconTheme: 'polkadot', name: 'Parent Sr Account', type: 'sr25519' },
  { address: '0xd5D81CD4236a43F48A983fc5B895975c511f634D', expectedIconTheme: 'ethereum', name: 'Ethereum', type: 'ethereum' },
  { address: '5D2TPhGEy2FhznvzaNYW9AkuMBbg3cyRemnPsBvBY4ZhkZXA', expectedIconTheme: 'polkadot', name: 'Child Account', parentAddress: '5GYmFzQCuC5u3tQNiMZNbFGakrz3Jq31NmMg4D2QAkSoQ2g5', type: 'sr25519' },
  { address: '5EeaoDj4VDk8V6yQngKBaCD5MpJUCHrhYjVhBjgMHXoYon1s', expectedIconTheme: 'polkadot', isExternal: true, name: 'External Account', type: 'sr25519' }
] as AccountTestJson[];

const mountComponent = async (props: Props, settings: Partial<SettingsStruct> = {}): Promise<{
  wrapper: ReactWrapper;
}> => {
  const actionStub = jest.fn();
  const { actions = actionStub } = props;
  const newSettings = { ...defaultSettings.get(), ...settings };

  const wrapper = mount(
    <SettingsContext.Provider value={newSettings}>
      <AccountContext.Provider value={{
        accounts: accounts,
        hierarchy: buildHierarchy(accounts)
      }}>
        <ThemeProvider theme={themes.dark}>
          <Address
            actions={actions}
            {...props}
          />
        </ThemeProvider>
      </AccountContext.Provider>
    </ SettingsContext.Provider>
  );

  await act(flushAllPromises);

  return { wrapper };
};

const genericTestSuite = (account: AccountTestJson) => {
  let wrapper: ReactWrapper;
  const { address, expectedIconTheme, name, type } = account;

  name && type && describe(`Displays an account from its address (${name}) - ${type}`, () => {
    beforeEach(async () => {
      const mountedComponent = await mountComponent(account);

      wrapper = mountedComponent.wrapper;
    });

    it('shows the account address and name', () => {
      expect(wrapper.find('[data-field="address"]').text()).toEqual(address);
      expect(wrapper.find('Name span').text()).toEqual(name);
    });

    it(`shows a ${expectedIconTheme} identicon`, () => {
      expect(wrapper.find('Identicon').first().prop('iconTheme')).toEqual(expectedIconTheme);
    });

    it('can copy its address', () => {
      // the first CopyToClipboard is from the identicon, the second from the copy button
      expect(wrapper.find('CopyToClipboard').at(0).prop('text')).toEqual(address);
      expect(wrapper.find('CopyToClipboard').at(1).prop('text')).toEqual(address);
    });

    it('can hide the account', () => {
      expect(wrapper.find('FontAwesomeIcon.visibleIcon')).toHaveLength(1);
    });

    it('can hide the account', () => {
      jest.spyOn(messaging, 'showAccount').mockResolvedValue(false);

      const visibleIcon = wrapper.find('FontAwesomeIcon.visibleIcon');
      const hiddenIcon = wrapper.find('FontAwesomeIcon.hiddenIcon');

      expect(visibleIcon.exists()).toBe(true);
      expect(hiddenIcon.exists()).toBe(false);

      visibleIcon.simulate('click');
      expect(messaging.showAccount).toBeCalledWith(address, false);
    });

    it('can show the account if hidden', async () => {
      const mountedHiddenComponent = await mountComponent({ ...account, isHidden: true });
      const wrapperHidden = mountedHiddenComponent.wrapper;

      jest.spyOn(messaging, 'showAccount').mockResolvedValue(true);

      const visibleIcon = wrapperHidden.find('FontAwesomeIcon.visibleIcon');
      const hiddenIcon = wrapperHidden.find('FontAwesomeIcon.hiddenIcon');

      expect(visibleIcon.exists()).toBe(false);
      expect(hiddenIcon.exists()).toBe(true);

      hiddenIcon.simulate('click');
      expect(messaging.showAccount).toBeCalledWith(address, true);
    });

    it('has settings button', () => {
      expect(wrapper.find('.settings')).toHaveLength(1);
    });

    it('has no account hidding and settings button if no action is provided', async () => {
      const mountedComponentWithoutAction = await mountComponent({ ...account, actions: null });

      wrapper = mountedComponentWithoutAction.wrapper;

      expect(wrapper.find('.settings')).toHaveLength(0);
    });
  });
};

describe('Address', () => {
  // const uncheck = (input: ReactWrapper): unknown => input.simulate('change', { target: { checked: false } });

  // const type = async (input: ReactWrapper, value: string): Promise<void> => {
  //   input.simulate('change', { target: { value } });
  //   await act(flushAllPromises);
  //   input.update();
  // };

  // genericTestSuite(accounts[4]);

  accounts.forEach((account) => {
    genericTestSuite(account);
  });

  //   it('"Create new root" button becomes visible after checkbox is unchecked', () => {
  //     uncheck(wrapper.find('input[type="checkbox"]'));

  //     expect(wrapper.exists('[data-button-action="create root account"]')).toBe(true);
  //     expect(wrapper.exists('[data-button-action="create derived account"]')).toBe(false);
  //   });

  //   it('Password entry is hidden after checkbox is unchecked', () => {
  //     uncheck(wrapper.find('input[type="checkbox"]'));

  //     expect(wrapper.exists('input[type="password"]')).toBe(false);
  //   });

  //   it('"Create new root" button redirects to /account/create', () => {
  //     uncheck(wrapper.find('input[type="checkbox"]'));
  //     wrapper.find('[data-button-action="create root account"] button').simulate('click');

  //     expect(onActionStub).toBeCalledWith('/account/create');
  //   });

  //   it('"Create derived account" is visible when checkbox is checked', () => {
  //     expect(wrapper.exists('[data-button-action="create derived account"]')).toBe(true);
  //     expect(wrapper.exists('[data-button-action="create root account"]')).toBe(false);
  //   });

  //   it('No error is visible when first loading the page', () => {
  //     expect(wrapper.find('Warning')).toHaveLength(0);
  //   });

  //   it('"Create derived account" is disabled when password is not set', () => {
  //     const button = wrapper.find('[data-button-action="create derived account"] button');

  //     expect(button.prop('disabled')).toBe(true);
  //   });

  //   it('An error is visible and "Create derived account" is disabled when password is incorrect', async () => {
  //     await type(wrapper.find('input[type="password"]'), 'wrong_pass');
  //     wrapper.find('[data-button-action="create derived account"] button').simulate('click');
  //     await act(flushAllPromises);
  //     wrapper.update();

  //     const button = wrapper.find('[data-button-action="create derived account"] button');

  //     expect(button.prop('disabled')).toBe(true);
  //     expect(wrapper.find('.warning-message')).toHaveLength(1);
  //     expect(wrapper.find('.warning-message').first().text()).toEqual('Wrong password');
  //   });

  //   it('The error disappears when typing a new password and "Create derived account" is enabled', async () => {
  //     await type(wrapper.find('input[type="password"]'), 'wrong_pass');
  //     wrapper.find('[data-button-action="create derived account"] button').simulate('click');
  //     await act(flushAllPromises);
  //     wrapper.update();

  //     await type(wrapper.find('input[type="password"]'), 'new_attempt');

  //     const button = wrapper.find('[data-button-action="create derived account"] button');

  //     expect(button.prop('disabled')).toBe(false);
  //     expect(wrapper.find('.warning-message')).toHaveLength(0);
  //   });

  //   it('"Create derived account" is enabled when password is set', async () => {
  //     await type(wrapper.find('input[type="password"]'), 'pass');

  //     const button = wrapper.find('[data-button-action="create derived account"] button');

  //     expect(button.prop('disabled')).toBe(false);
  //     expect(wrapper.find('.warning-message')).toHaveLength(0);
  //   });

  //   it('An error is visible and "Create derived account" is disabled when suri is incorrect', async () => {
  //     await type(wrapper.find('input[type="password"]'), 'pass');
  //     await type(wrapper.find('[data-input-suri] input'), '//');
  //     wrapper.find('[data-button-action="create derived account"] button').simulate('click');
  //     await act(flushAllPromises);
  //     wrapper.update();

  //     const button = wrapper.find('[data-button-action="create derived account"] button');

  //     expect(button.prop('disabled')).toBe(true);
  //     expect(wrapper.find('.warning-message')).toHaveLength(1);
  //     expect(wrapper.find('.warning-message').first().text()).toEqual('Incorrect derivation path');
  //   });

  //   it('The error disappears and "Create derived account" is enabled when typing a new suri', async () => {
  //     await type(wrapper.find('input[type="password"]'), 'pass');
  //     await type(wrapper.find('[data-input-suri] input'), '//');
  //     wrapper.find('[data-button-action="create derived account"] button').simulate('click');
  //     await act(flushAllPromises);
  //     wrapper.update();
  //     await type(wrapper.find('[data-input-suri] input'), 'new');

  //     const button = wrapper.find('[data-button-action="create derived account"] button');

  //     expect(button.prop('disabled')).toBe(false);
  //     expect(wrapper.find('Warning')).toHaveLength(0);
  //   });

  //   it('takes selected address from URL as parent account', () => {
  //     expect(wrapper.find('[data-field="name"]').first().text()).toBe('B');
  //   });

  //   it('selects internal root accounts as other options', () => {
  //     const options = wrapper.find('[data-parent-option] [data-field="name"]').map((el) => el.text());

  //     expect(options).toEqual(['A', 'B', 'D']);
  //   });

  //   it('redirects to derive from next account when other option is selected', () => {
  //     wrapper.find('[data-parent-option]').first().simulate('click');

  //     expect(onActionStub).toBeCalledWith(`/account/derive/${accounts[0].address}`);
  //   });
});

// describe('Locked parent selection', () => {
//   beforeAll(async () => {
//     wrapper = (await mountComponent(true)).wrapper;
//   });

//   it('checkbox does not exist', () => {
//     expect(wrapper.exists('[type="checkbox"]')).toBe(false);
//   });

//   it('address dropdown does not exist', () => {
//     expect(wrapper.exists(AddressDropdown)).toBe(false);
//   });

//   it('parent is taken from URL', () => {
//     expect(wrapper.find('[data-field="name"]').first().text()).toBe('B');
//   });
// });
// });
