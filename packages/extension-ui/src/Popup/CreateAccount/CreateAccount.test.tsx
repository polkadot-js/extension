// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '../../../../../__mocks__/chrome';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { ThemeProvider } from 'styled-components';

import { ActionContext, ActionText, Button, Input, InputWithLabel, themes } from '../../components';
import * as messaging from '../../messaging';
import { Header } from '../../partials';
import { flushAllPromises } from '../../testHelpers';
import CreateAccount from '.';

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

  const capsLockOn = async (input: ReactWrapper): Promise<void> => {
    input.simulate('keyPress', { getModifierState: () => true });
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
    beforeEach(async () => {
      check(wrapper.find('input[type="checkbox"]'));
      wrapper.find('button').simulate('click');
      await act(flushAllPromises);
      wrapper.update();
    });

    it('only account name input is visible at first', () => {
      expect(wrapper.find(InputWithLabel).find('[data-input-name]').find(Input)).toHaveLength(1);
      expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input)).toHaveLength(1);
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(true);
    });

    it('input should not be highlighted as error until first interaction', () => {
      expect(wrapper.find(InputWithLabel).find('[data-input-name]').find(Input).prop('withError')).toBe(false);
    });

    it('after typing less than 3 characters into name input, password input is not visible', async () => {
      await enterName('ab');
      expect(wrapper.find(InputWithLabel).find('[data-input-name]').find(Input).prop('withError')).toBe(true);
      expect(wrapper.find('.warning-message').first().text()).toBe('Account name is too short');
      expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input)).toHaveLength(1);
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(true);
    });

    it('input should keep showing error when something has been typed but then erased', async () => {
      await enterName('ab');
      await enterName('');
      expect(wrapper.find(InputWithLabel).find('[data-input-name]').find(Input).prop('withError')).toBe(true);
    });

    it('after typing 3 characters into name input, the name is reflected in the account card', async () => {
      const NAME = 'abc';

      await enterName(NAME);
      expect(wrapper.find('[data-field="name"]').first().text()).toBe(NAME);
    });

    it('after typing 3 characters into name input, first password input is visible', async () => {
      await enterName('abc');
      expect(wrapper.find(InputWithLabel).find('[data-input-name]').find(Input).first().prop('withError')).toBe(false);
      expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input)).toHaveLength(1);
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(true);
    });

    it('password with caps lock should show a warning', async () => {
      await enterName('abc').then(password('abcde'));
      await capsLockOn(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input));

      expect(wrapper.find('.warning-message').first().text()).toBe('Warning: Caps lock is on');
    });

    it('password shorter than 6 characters should be not valid', async () => {
      await enterName('abc').then(password('abcde'));
      expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input).prop('withError')).toBe(true);
      expect(wrapper.find('.warning-message').text()).toBe('Password is too short');
      expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input)).toHaveLength(1);
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(true);
    });

    it('submit button is not enabled until both passwords are equal', async () => {
      await enterName('abc').then(password('abcdef')).then(repeat('abcdeg'));
      expect(wrapper.find('.warning-message').text()).toBe('Passwords do not match');
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]').find(Input).prop('withError')).toBe(true);
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(true);
    });

    it('submit button is enabled when both passwords are equal', async () => {
      await enterName('abc').then(password('abcdef')).then(repeat('abcdef'));
      expect(wrapper.find('.warning-message')).toHaveLength(0);
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]').find(Input).prop('withError')).toBe(false);
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(false);
    });

    it('saves account with provided name and password', async () => {
      await enterName('abc').then(password('abcdef')).then(repeat('abcdef'));
      wrapper.find('[data-button-action="add new root"] button').simulate('click');
      await act(flushAllPromises);

      expect(messaging.createAccountSuri).toBeCalledWith('abc', 'abcdef', exampleAccount.seed);
      expect(onActionStub).toBeCalledWith('/');
    });
  });

  describe('Both passwords are equal, but then', () => {
    beforeEach(async () => {
      check(wrapper.find('input[type="checkbox"]'));
      wrapper.find('button').simulate('click');
      await act(flushAllPromises);
      await enterName('abc').then(password('abcdef')).then(repeat('abcdef'));
    });

    it('first password input is cleared - second one disappears and button get disabled', async () => {
      await type(wrapper.find('input[type="password"]').first(), '');
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(true);
    });

    it('first password changes - button is disabled', async () => {
      await type(wrapper.find('input[type="password"]').first(), 'aaaaaa');
      expect(wrapper.find('.warning-message').text()).toBe('Passwords do not match');
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(true);
    });

    it('first password changes, then second changes too - button is enabled', async () => {
      await type(wrapper.find('input[type="password"]').first(), 'aaaaaa');
      await type(wrapper.find('input[type="password"]').last(), 'aaaaaa');
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(false);
    });

    it('second password changes, then first changes too - button is enabled', async () => {
      await type(wrapper.find('input[type="password"]').last(), 'aaaaaa');
      await type(wrapper.find('input[type="password"]').first(), 'aaaaaa');
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(false);
    });
  });
});
