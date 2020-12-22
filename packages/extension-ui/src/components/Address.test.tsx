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
import { KeypairType } from '@polkadot/util-crypto/types';

import * as messaging from '../messaging';
import { flushAllPromises } from '../testHelpers';
import { buildHierarchy } from '../util/buildHierarchy';
import { DEFAULT_TYPE } from '../util/defaultType';
import { Address, SettingsContext } from '.';
import { AccountContext, themes } from './';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

interface AccountTestJson extends AccountJson {
  expectedIconTheme: IconTheme
}

interface TestAccountidentifier {
  name: string;
  type: KeypairType;
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
    // <SettingsContext.Provider value={newSettings}>
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
    // </ SettingsContext.Provider>
  );

  await act(flushAllPromises);

  return { wrapper };
};

const genericTestSuite = (account: AccountTestJson) => {
  let wrapper: ReactWrapper;
  const { address, expectedIconTheme } = account;
  const contextAccount = accounts.find((account) => account.address === address);

  // if the account is in the context the expected attributes are retrieved from there.
  // the Address component will only get to know about the address
  // otherwise the account props will show more.
  const expectedAttributes = {
    name: contextAccount?.name || account.name || '<unknown>',
    type: contextAccount?.type || account.type || DEFAULT_TYPE
  };

  describe(`Displays an account from its address (${expectedAttributes.name}) - ${expectedAttributes.type}`, () => {
    beforeEach(async () => {
      const mountedComponent = contextAccount
        ? await mountComponent({ address })
        : await mountComponent(account);

      wrapper = mountedComponent.wrapper;
    });

    it('shows the account address and name', () => {
      expect(wrapper.find('[data-field="address"]').text()).toEqual(address);
      expect(wrapper.find('Name span').text()).toEqual(expectedAttributes.name);
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
      const additionalProps = { isHidden: true };

      const mountedHiddenComponent = contextAccount
        ? await mountComponent({ address, ...additionalProps })
        : await mountComponent({ ...account, ...additionalProps });

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
      const additionalProps = { actions: null };

      const mountedComponentWithoutAction = contextAccount
        ? await mountComponent({ address, ...additionalProps })
        : await mountComponent({ ...account, ...additionalProps });

      wrapper = mountedComponentWithoutAction.wrapper;

      expect(wrapper.find('.settings')).toHaveLength(0);
    });
  });
};
// };

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

  const accountNotInContext = {
    address: '5GYQRJj3NUznYDzCduENRcocMsyxmb6tjb5xW87ZMErBe9R7',
    expectedIconTheme: 'polkadot',
    name: 'Not in context',
    type: 'sr25519'
  } as AccountTestJson;

  genericTestSuite(accountNotInContext);

  const EthereumAccountNotInContext = {
    address: '0x4F4e24A11185565D483Ea1CFac1d3B96Fb7df684',
    expectedIconTheme: 'ethereum',
    name: 'Ethereum not in context',
    type: 'ethereum'
  } as AccountTestJson;

  genericTestSuite(EthereumAccountNotInContext);
});
