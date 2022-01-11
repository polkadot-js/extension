// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { ReactWrapper } from 'enzyme';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { flushAllPromises } from '../testHelpers';
import BackButton from './BackButton';
import { AccountNamePasswordCreation, Input, InputWithLabel, NextStepButton } from '.';

// For this file, there are a lot of them
/* eslint-disable @typescript-eslint/no-unsafe-argument */

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

const account = {
  name: 'My Polkadot Account',
  password: 'somepassword'
};

const buttonLabel = 'create account';

let wrapper: ReactWrapper;
const onBackClick = jest.fn();
const onCreate = jest.fn();
const onNameChange = jest.fn();

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

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
const mountComponent = (isBusy = false): ReactWrapper => mount(
  <AccountNamePasswordCreation
    buttonLabel={buttonLabel}
    isBusy={isBusy}
    onBackClick={onBackClick}
    onCreate={onCreate}
    onNameChange={onNameChange}
  />
);

describe('AccountNamePasswordCreation', () => {
  beforeEach(async () => {
    wrapper = mountComponent();
    await act(flushAllPromises);
    wrapper.update();
  });

  it('only account name input is visible at first', () => {
    expect(wrapper.find(InputWithLabel).find('[data-input-name]').find(Input)).toHaveLength(1);
    expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input)).toHaveLength(1);
    expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
    expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(true);
  });

  it('next step button has the correct label', () => {
    expect(wrapper.find(NextStepButton).text()).toBe(buttonLabel);
  });

  it('back button calls onBackClick', () => {
    wrapper.find(BackButton).simulate('click');
    expect(onBackClick).toHaveBeenCalledTimes(1);
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
    await enterName(account.name);
    await enterName('');
    expect(wrapper.find(InputWithLabel).find('[data-input-name]').find(Input).prop('withError')).toBe(true);
  });

  it('after typing 3 characters into name input, onNameChange is called', async () => {
    await enterName(account.name);
    expect(onNameChange).toHaveBeenLastCalledWith(account.name);
  });

  it('after typing 3 characters into name input, first password input is visible', async () => {
    await enterName(account.name);
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

  it('calls onCreate with provided name and password', async () => {
    await enterName(account.name).then(password(account.password)).then(repeat(account.password));
    wrapper.find('[data-button-action="add new root"] button').simulate('click');
    await act(flushAllPromises);

    expect(onCreate).toBeCalledWith(account.name, account.password);
  });

  describe('All fields are filled correctly, but then', () => {
    beforeEach(async () => {
      await enterName(account.name).then(password(account.password)).then(repeat(account.password));
    });

    it('first password input is cleared - second one disappears and button get disabled', async () => {
      await type(wrapper.find('input[type="password"]').first(), '');
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(true);
    });

    it('first password changes - button is disabled', async () => {
      await type(wrapper.find('input[type="password"]').first(), 'abcdef');
      expect(wrapper.find('.warning-message').text()).toBe('Passwords do not match');
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(true);
    });

    it('first password changes, then second changes too - button is enabled', async () => {
      await type(wrapper.find('input[type="password"]').first(), 'abcdef');
      await type(wrapper.find('input[type="password"]').last(), 'abcdef');
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(false);
    });

    it('second password changes, then first changes too - button is enabled', async () => {
      await type(wrapper.find('input[type="password"]').last(), 'abcdef');
      await type(wrapper.find('input[type="password"]').first(), 'abcdef');
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(false);
    });

    it('name is removed - button is disabled', async () => {
      await enterName('');
      expect(wrapper.find('[data-button-action="add new root"] button').prop('disabled')).toBe(true);
    });
  });
});

describe('AccountNamePasswordCreation busy button', () => {
  beforeAll(async () => {
    wrapper = mountComponent(true);
    await act(flushAllPromises);
    wrapper.update();
  });

  it('button is busy', () => {
    expect(wrapper.find(NextStepButton).prop('isBusy')).toBe(true);
  });
});
