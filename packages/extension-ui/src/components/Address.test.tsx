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

import allChains from '@polkadot/extension-chains/chains';
import { Chain } from '@polkadot/extension-chains/types';
import { IconTheme } from '@polkadot/react-identicon/types';
import defaultSettings from '@polkadot/ui-settings';
import { KeypairType } from '@polkadot/util-crypto/types';

import * as useMetadata from '../hooks/useMetadata';
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

interface AccountTestGenesisJson extends AccountTestJson {
  expectedEncodedAddress: string;
  expectedNetworkLabel: string;
  genesisHash: string;
}

const accounts = [
  { address: '5HSDXAC3qEMkSzZK377sTD1zJhjaPiX5tNWppHx2RQMYkjaJ', expectedIconTheme: 'polkadot', name: 'ECDSA Account', type: 'ecdsa' },
  { address: '5FjgD3Ns2UpnHJPVeRViMhCttuemaRXEqaD8V5z4vxcsUByA', expectedIconTheme: 'polkadot', name: 'Ed Account', type: 'ed25519' },
  { address: '5Ggap6soAPaP5UeNaiJsgqQwdVhhNnm6ez7Ba1w9jJ62LM2Q', expectedIconTheme: 'polkadot', name: 'Parent Sr Account', type: 'sr25519' },
  { address: '0xd5D81CD4236a43F48A983fc5B895975c511f634D', expectedIconTheme: 'ethereum', name: 'Ethereum', type: 'ethereum' },
  { address: '5D2TPhGEy2FhznvzaNYW9AkuMBbg3cyRemnPsBvBY4ZhkZXA', expectedIconTheme: 'polkadot', name: 'Child Account', parentAddress: '5Ggap6soAPaP5UeNaiJsgqQwdVhhNnm6ez7Ba1w9jJ62LM2Q', type: 'sr25519' },
  { address: '5EeaoDj4VDk8V6yQngKBaCD5MpJUCHrhYjVhBjgMHXoYon1s', expectedIconTheme: 'polkadot', isExternal: true, name: 'External Account', type: 'sr25519' }
] as AccountTestJson[];

const mountComponent = async (addressComponentProps: Props, contextAccounts: AccountJson[], settings: Partial<SettingsStruct> = {}): Promise<{
  wrapper: ReactWrapper;
}> => {
  const actionStub = jest.fn();
  const { actions = actionStub } = addressComponentProps;
  const newSettings = { ...defaultSettings.get(), ...settings };

  const wrapper = mount(
    // <SettingsContext.Provider value={newSettings}>
    <AccountContext.Provider value={{
      accounts: contextAccounts,
      hierarchy: buildHierarchy(contextAccounts)
    }}>
      <ThemeProvider theme={themes.dark}>
        <Address
          actions={actions}
          {...addressComponentProps}
        />
      </ThemeProvider>
    </AccountContext.Provider>
    // </ SettingsContext.Provider>
  );

  await act(flushAllPromises);
  wrapper.update();

  return { wrapper };
};

const genericTestSuite = (account: AccountTestJson, withAccountInContext = true) => {
  let wrapper: ReactWrapper;
  const { address, expectedIconTheme, name = '', type = DEFAULT_TYPE } = account;

  describe(`Account ${withAccountInContext ? 'in context from address' : 'from props'} (${name}) - ${type}`, () => {
    beforeEach(async () => {
      // the address component can query info about the account from the account context
      // in this case, the account's address (any encoding) should suffice
      // In case the account is not in the context, then more info are needed as props
      // to display accurately
      const mountedComponent = withAccountInContext
        // only the address is passed as props, the full acount info are loaded in the context
        ? await mountComponent({ address }, [{ ...account }])
        // the context is empty, all account's info are passed as props to the Address component
        : await mountComponent(account, []);

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

    it('has the account visiblity icon', () => {
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

      const mountedHiddenComponent = withAccountInContext
        ? await mountComponent({ address, ...additionalProps }, accounts)
        : await mountComponent({ ...account, ...additionalProps }, []);

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

      const mountedComponentWithoutAction = withAccountInContext
        ? await mountComponent({ address, ...additionalProps }, accounts)
        : await mountComponent({ ...account, ...additionalProps }, []);

      wrapper = mountedComponentWithoutAction.wrapper;

      expect(wrapper.find('.settings')).toHaveLength(0);
    });
  });
};

const genesisHashTestSuite = (account: AccountTestGenesisJson, withAccountInContext = true) => {
  const { address, expectedEncodedAddress, expectedIconTheme, expectedNetworkLabel } = account;

  describe(`Account ${withAccountInContext ? 'in context from address' : 'from props'} with ${expectedNetworkLabel} genesiHash`, () => {
    let wrapper: ReactWrapper;

    beforeEach(async () => {
      // the address component can query info about the account from the account context
      // in this case, the account's address (any encoding) should suffice
      // In case the account is not in the context, then more info are needed as props
      // to display accurately
      const mountedComponent = withAccountInContext
        // only the address is passed as props, the full acount info are loaded in the context
        ? await mountComponent({ address }, [{ ...account }])
        // the context is empty, all account's info are passed as props to the Address component
        : await mountComponent(account, []);

      wrapper = mountedComponent.wrapper;
    });

    it('shows the account address correctly encoded', () => {
      expect(wrapper.find('[data-field="address"]').text()).toEqual(expectedEncodedAddress);
    });

    it(`shows a ${expectedIconTheme} identicon`, () => {
      expect(wrapper.find('Identicon').first().prop('iconTheme')).toEqual(expectedIconTheme);
    });

    it('Copy buttons contain the encoded address', () => {
      // the first CopyToClipboard is from the identicon, the second from the copy button
      expect(wrapper.find('CopyToClipboard').at(0).prop('text')).toEqual(expectedEncodedAddress);
      expect(wrapper.find('CopyToClipboard').at(1).prop('text')).toEqual(expectedEncodedAddress);
    });

    it('Network label shows the correct network', () => {
      expect(wrapper.find('[data-field="chain"]').text()).toEqual(expectedNetworkLabel);
    });
  });
};

describe('Address', () => {
  accounts.forEach((account) => {
    genericTestSuite(account);
    genericTestSuite(account, false);
  });

  // account with Polkadot genesis Hash
  const polkadotGenesisHashAccount: AccountTestGenesisJson = {
    ...accounts[2],
    expectedEncodedAddress: '15csxS8s2AqrX1etYMMspzF6V7hM56KEjUqfjJvWHP7YWkoF',
    expectedIconTheme: 'polkadot',
    expectedNetworkLabel: 'Polkadot',
    genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3'
  };

  genesisHashTestSuite(polkadotGenesisHashAccount);
  genesisHashTestSuite(polkadotGenesisHashAccount, false);

  // account with Kusama genesis Hash
  const kusamaGenesisHashAccount: AccountTestGenesisJson = {
    ...accounts[2],
    expectedEncodedAddress: 'HCCURDfnkbJq8TpMR7vanmwn5ywBTaH7MwvxgD7D6JX5QhT',
    expectedIconTheme: 'polkadot',
    expectedNetworkLabel: 'Kusama',
    genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'
  };

  genesisHashTestSuite(kusamaGenesisHashAccount);
  genesisHashTestSuite(kusamaGenesisHashAccount, false);

  // account with Edgeware genesis Hash
  const edgwareGenesisHashAccount: AccountTestGenesisJson = {
    ...accounts[2],
    expectedEncodedAddress: 'n8VmNvgiCxwcRV8t5X3UJ751WhQTNit44ib36RcXNGxUv9u',
    expectedIconTheme: 'substrate',
    expectedNetworkLabel: 'Edgeware',
    genesisHash: '0x742a2ca70c2fda6cee4f8df98d64c4c670a052d9568058982dad9d5a7a135c5b'
  };

  genesisHashTestSuite(edgwareGenesisHashAccount);
  genesisHashTestSuite(edgwareGenesisHashAccount, false);
});
