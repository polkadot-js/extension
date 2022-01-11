// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { ThemeProvider } from 'styled-components';

import { Registry } from '@polkadot/types/types';

import { ActionContext, ActionText, Button, themes } from '../../components';
import * as messaging from '../../messaging';
import { Header } from '../../partials';
import { flushAllPromises } from '../../testHelpers';
import CreateAccount from '.';

// For this file, there are a lot of them
/* eslint-disable @typescript-eslint/no-unsafe-argument */

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

describe('Create Account', () => {
  let wrapper: ReactWrapper;
  let onActionStub: jest.Mock;
  const exampleAccount = {
    address: 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5',
    seed: 'horse battery staple correct'
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const mountComponent = (): ReactWrapper => mount(
    <ActionContext.Provider value={onActionStub}>
      <ThemeProvider theme={themes.dark}>
        <CreateAccount />
      </ThemeProvider>
    </ActionContext.Provider>
  );

  const check = (input: ReactWrapper): unknown => input.simulate('change', { target: { checked: true } });

  const type = async (input: ReactWrapper, value: string): Promise<void> => {
    input.simulate('change', { target: { value } });
    await act(flushAllPromises);
    wrapper.update();
  };

  const enterName = (name: string): Promise<void> => type(wrapper.find('input').first(), name);
  const password = (password: string) => (): Promise<void> => type(wrapper.find('input[type="password"]').first(), password);
  const repeat = (password: string) => (): Promise<void> => type(wrapper.find('input[type="password"]').last(), password);

  beforeEach(async () => {
    onActionStub = jest.fn();
    jest.spyOn(messaging, 'createSeed').mockResolvedValue(exampleAccount);
    jest.spyOn(messaging, 'createAccountSuri').mockResolvedValue(true);
    wrapper = mountComponent();
    await act(flushAllPromises);
    wrapper.update();
  });

  describe('Phase 1', () => {
    it('shows seed phrase in textarea', () => {
      expect(wrapper.find('textarea').text()).toBe(exampleAccount.seed);
    });

    it('next step button is disabled when checkbox is not checked', () => {
      expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
    });

    it('action text is "Cancel"', () => {
      expect(wrapper.find(Header).find(ActionText).text()).toBe('Cancel');
    });

    it('clicking "Cancel" redirects to main screen', () => {
      wrapper.find(Header).find(ActionText).simulate('click');
      expect(onActionStub).toBeCalledWith('/');
    });

    it('checking the checkbox enables the Next button', () => {
      check(wrapper.find('input[type="checkbox"]'));

      expect(wrapper.find(Button).prop('isDisabled')).toBe(false);
    });

    it('clicking on Next activates phase 2', () => {
      check(wrapper.find('input[type="checkbox"]'));
      wrapper.find('button').simulate('click');
      expect(wrapper.find(Header).text()).toBe('Create an account2/2Cancel');
    });
  });

  describe('Phase 2', () => {
    const kusamaGenesis = '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe';

    beforeEach(async () => {
      // the network dropdown is in the first screen
      wrapper.find('select').simulate('change', { target: { value: kusamaGenesis } });
      await act(flushAllPromises);
      wrapper.update();

      check(wrapper.find('input[type="checkbox"]'));
      wrapper.find('button').simulate('click');
      await act(flushAllPromises);
      wrapper.update();
    });

    it('saves account with provided network, name and password', async () => {
      await enterName('abc').then(password('abcdef')).then(repeat('abcdef'));
      wrapper.find('[data-button-action="add new root"] button').simulate('click');
      await act(flushAllPromises);

      expect(messaging.createAccountSuri).toBeCalledWith('abc', 'abcdef', exampleAccount.seed, 'sr25519', kusamaGenesis);
      expect(onActionStub).toBeCalledWith('/');
    });
  });
});

describe('Create Account - Ethereum', () => {
  let wrapper: ReactWrapper;
  let onActionStub: jest.Mock;
  const exampleAccountSubstrate = {
    address: 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5',
    seed: 'horse battery staple correct'
  };
  const exampleAccountEth = {
    address: '0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac', // Alith
    seed: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
  };
  const moonriverGenesis = '0x401a1f9dca3da46f5c4091016c8a2f26dcea05865116b286f60f668207d1474b';
  const moonriverChain = {
    definition: {
      chain: 'Moonriver',
      chainType: 'ethereum' as const,
      color: '#0E132E',
      genesisHash: '0x401a1f9dca3da46f5c4091016c8a2f26dcea05865116b286f60f668207d1474b',
      icon: 'substrate',
      specVersion: 0,
      ss58Format: 1285,
      tokenDecimals: 18,
      tokenSymbol: 'Unit',
      types: {}
    },
    genesisHash: '0x401a1f9dca3da46f5c4091016c8a2f26dcea05865116b286f60f668207d1474b',
    hasMetadata: false,
    icon: 'substrate',
    isUnknown: false,
    name: 'Moonriver',
    registry: {} as Registry,
    specVersion: 1285,
    ss58Format: 2,
    tokenDecimals: 18,
    tokenSymbol: 'Unit'
  };
  const kusamaChain = {
    definition: {
      chain: 'Kusama Relay Chain',
      genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
      icon: 'polkadot',
      specVersion: 0,
      ss58Format: 2,
      tokenDecimals: 15,
      tokenSymbol: 'Unit',
      types: {}
    },
    genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
    hasMetadata: false,
    icon: 'polkadot',
    isUnknown: false,
    name: 'Kusama Relay Chain',
    registry: {} as Registry,
    specVersion: 0,
    ss58Format: 2,
    tokenDecimals: 15,
    tokenSymbol: 'Unit'
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const mountComponent = (): ReactWrapper => mount(
    <ActionContext.Provider value={onActionStub}>
      <ThemeProvider theme={themes.dark}>
        <CreateAccount />
      </ThemeProvider>
    </ActionContext.Provider>
  );

  const check = (input: ReactWrapper): unknown => {
    console.log('INPUT', input);

    return input.simulate('change', { target: { checked: true } });
  };

  const type = async (input: ReactWrapper, value: string): Promise<void> => {
    input.simulate('change', { target: { value } });
    await act(flushAllPromises);
    wrapper.update();
  };

  const enterName = (name: string): Promise<void> => type(wrapper.find('input').first(), name);
  const password = (password: string) => (): Promise<void> => type(wrapper.find('input[type="password"]').first(), password);
  const repeat = (password: string) => (): Promise<void> => type(wrapper.find('input[type="password"]').last(), password);

  beforeEach(async () => {
    onActionStub = jest.fn();
    jest.spyOn(messaging, 'createSeed').mockImplementation((length, type, _) => {
      return new Promise((resolve) => {
        if (type === 'ethereum') {
          resolve(exampleAccountEth);
        } else {
          resolve(exampleAccountSubstrate);
        }
      });
    });
    jest.spyOn(messaging, 'getMetadata').mockImplementation((genesisHash) => {
      return new Promise((resolve) => {
        if (genesisHash === '0x401a1f9dca3da46f5c4091016c8a2f26dcea05865116b286f60f668207d1474b') {
          resolve(moonriverChain);
        } else {
          resolve(kusamaChain);
        }
      });
    });
    jest.spyOn(messaging, 'createAccountSuri').mockResolvedValue(true);
    wrapper = mountComponent();
    await act(flushAllPromises);
    wrapper.update();
    wrapper.find('select').simulate('change', { target: { value: moonriverGenesis } });
    await act(flushAllPromises);
    wrapper.update();
  });

  describe('Phase 1', () => {
    it('shows seed phrase in textarea', () => {
      expect(wrapper.find('textarea').text()).toBe(exampleAccountEth.seed);
    });

    it('next step button is disabled when checkbox is not checked', () => {
      expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
    });

    it('action text is "Cancel"', () => {
      expect(wrapper.find(Header).find(ActionText).text()).toBe('Cancel');
    });

    it('clicking "Cancel" redirects to main screen', () => {
      wrapper.find(Header).find(ActionText).simulate('click');
      expect(onActionStub).toBeCalledWith('/');
    });

    it('checking the checkbox enables the Next button', () => {
      check(wrapper.find('input[type="checkbox"]').last());

      expect(wrapper.find(Button).prop('isDisabled')).toBe(false);
    });

    it('clicking on Next activates phase 2', () => {
      check(wrapper.find('input[type="checkbox"]').last());
      wrapper.find('button').simulate('click');
      expect(wrapper.find(Header).text()).toBe('Create an account2/2Cancel');
    });
  });

  describe('Phase 2', () => {
    beforeEach(async () => {
      check(wrapper.find('input[type="checkbox"]').last());
      wrapper.find('button').simulate('click');
      await act(flushAllPromises);
      wrapper.update();
    });

    it('saves account with provided network, name and password', async () => {
      await enterName('abc').then(password('abcdef')).then(repeat('abcdef'));
      wrapper.find('[data-button-action="add new root"] button').simulate('click');
      await act(flushAllPromises);

      expect(messaging.createAccountSuri).toBeCalledWith('abc', 'abcdef', exampleAccountEth.seed, 'ethereum', moonriverGenesis);
      expect(onActionStub).toBeCalledWith('/');
    });
  });
});
