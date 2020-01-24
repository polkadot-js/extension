// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import Adapter from 'enzyme-adapter-react-16';

import CreateAccount from '.';
import { configure, mount, ReactWrapper } from 'enzyme';
import * as messaging from '@polkadot/extension-ui/messaging';
import { act } from 'react-dom/test-utils';
import { flushAllPromises } from '@polkadot/extension-ui/testHelpers';
import {
  ActionContext,
  ActionText,
  Button,
  themes,
  Input,
  InputWithLabel,
  Header
} from '@polkadot/extension-ui/components';
import { ThemeProvider } from 'styled-components';
import DerivationPath, { OptionsLabel } from '@polkadot/extension-ui/Popup/CreateAccount/DerivationPath';

configure({ adapter: new Adapter() });

describe('Create Account', () => {
  let wrapper: ReactWrapper;
  let onActionStub: jest.Mock;
  const exampleAccount = {
    seed: 'horse battery staple correct',
    address: 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5'
  };
  const mountComponent = (): ReactWrapper => mount(
    <ActionContext.Provider value={onActionStub}>
      <ThemeProvider theme={themes.dark}>
        <CreateAccount />
      </ThemeProvider>
    </ActionContext.Provider>
  );

  const check = (input: ReactWrapper): unknown => input.simulate('change', { target: { checked: true } });

  beforeEach(async () => {
    onActionStub = jest.fn();
    jest.spyOn(messaging, 'createSeed').mockResolvedValue(exampleAccount);
    jest.spyOn(messaging, 'createAccountSuri').mockResolvedValue(true);
    jest.spyOn(messaging, 'validateSeed').mockResolvedValue({ address: exampleAccount.address, suri: '' });
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

    it('clicking on Next activates phase 2', async () => {
      check(wrapper.find('input[type="checkbox"]'));
      wrapper.find('button').simulate('click');
      await act(flushAllPromises);

      expect(wrapper.find(Header).text()).toBe('Create an account 2/2Back');
    });
  });

  describe('Phase 2', () => {
    const type = (input: ReactWrapper, value: string): unknown => input.simulate('change', { target: { value } });

    type AndPassword = {
      andPassword: (password: string) => AndRepeatedPassword;
    };

    type AndRepeatedPassword = {
      andRepeatedPassword: (repeatedPassword: string) => void;
    };

    const enterName = (name: string): AndPassword => {
      type(wrapper.find('input'), name);
      return {
        andPassword: (password: string): AndRepeatedPassword => {
          type(wrapper.find('input[type="password"]').first(), password);
          return {
            andRepeatedPassword: (repeatedPassword: string): void => {
              type(wrapper.find('input[type="password"]').last(), repeatedPassword);
            }
          };
        }
      };
    };

    beforeEach(async () => {
      check(wrapper.find('input[type="checkbox"]'));
      wrapper.find('button').simulate('click');
      await act(flushAllPromises);
    });

    it('only account name input is visible at first', () => {
      expect(wrapper.find(InputWithLabel).find('[data-input-name]').find(Input)).toHaveLength(1);
      expect(wrapper.find(InputWithLabel).find('[data-input-password]')).toHaveLength(0);
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find(Button)).toHaveLength(0);
    });

    it('after typing less than 3 characters into name input, password input is not visible', () => {
      type(wrapper.find('input'), 'ab');
      expect(wrapper.find(Input).prop('withError')).toBe(true);
      expect(wrapper.find(InputWithLabel).find('[data-input-password]')).toHaveLength(0);
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find(Button)).toHaveLength(0);
    });

    it('after typing 3 characters into name input, first password input is visible', () => {
      enterName('abc');
      expect(wrapper.find(Input).first().prop('withError')).toBe(false);
      expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input)).toHaveLength(1);
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find(Button)).toHaveLength(0);
    });

    it('password shorter than 6 characters should be not valid', () => {
      enterName('abc').andPassword('abcde');
      expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input).prop('withError')).toBe(true);
      expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input)).toHaveLength(1);
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find(Button)).toHaveLength(0);
    });

    it('submit button is not visible until both passwords are equal', () => {
      enterName('abc').andPassword('abcdef').andRepeatedPassword('abcdeg');
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]').find(Input).prop('withError')).toBe(true);
      expect(wrapper.find(Button)).toHaveLength(0);
    });

    it('submit button is visible when both passwords are equal', async () => {
      enterName('abc').andPassword('abcdef').andRepeatedPassword('abcdef');
      await act(flushAllPromises);

      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]').find(Input).prop('withError')).toBe(false);
      expect(wrapper.find(Button)).toHaveLength(1);
    });

    it('saves account with provided name and password', async () => {
      enterName('abc').andPassword('abcdef').andRepeatedPassword('abcdef');
      await act(flushAllPromises);
      wrapper.find(Button).find('button').simulate('click');
      await act(flushAllPromises);

      expect(messaging.createAccountSuri).toBeCalledWith('abc', 'abcdef', exampleAccount.seed, 'ed25519');
      expect(onActionStub).toBeCalledWith('/');
    });

    it('does not show advanced options at first', async () => {
      enterName('abc').andPassword('abcdef').andRepeatedPassword('abcdef');
      await act(flushAllPromises);

      expect(wrapper.find(DerivationPath).find('input')).toHaveLength(0);
    });

    it('concatenates seed with correct derivation path', async () => {
      enterName('abc').andPassword('abcdef').andRepeatedPassword('abcdef');
      wrapper.find(DerivationPath).find(OptionsLabel).simulate('click');
      type(wrapper.find(DerivationPath).find('input'), '//hard///password');
      await act(flushAllPromises);
      wrapper.find(Button).find('button').simulate('click');
      await act(flushAllPromises);

      expect(messaging.createAccountSuri).toBeCalledWith('abc', 'abcdef', `${exampleAccount.seed}//hard///password`, 'ed25519');
    });

    it('provided derivation path is invalid submit button is disabled and input field shows error ', async () => {
      jest.spyOn(messaging, 'validateSeed').mockRejectedValue('');
      enterName('abc').andPassword('abcdef').andRepeatedPassword('abcdef');
      wrapper.find(DerivationPath).find(OptionsLabel).simulate('click');
      type(wrapper.find(DerivationPath).find('input'), 'invalid-path');
      await act(flushAllPromises);
      wrapper.update();

      expect(wrapper.find(DerivationPath).find(InputWithLabel).prop('isError')).toBe(true);
      expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
    });
  });
});
