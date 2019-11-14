// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import Adapter from 'enzyme-adapter-react-16';

import CreateAccount from '.';
import { configure, mount, ReactWrapper } from 'enzyme';
import { MemoryRouter } from 'react-router';
import * as messaging from '@polkadot/extension-ui/messaging';
import { act } from 'react-dom/test-utils';
import { flushAllPromises } from '@polkadot/extension-ui/testHelpers';
import {
  ActionContext,
  ActionText,
  Button,
  defaultTheme,
  Input,
  InputWithLabel
} from '@polkadot/extension-ui/components';
import CreationStep from '@polkadot/extension-ui/Popup/CreateAccount/CreationStep';
import { ThemeProvider } from 'styled-components';

configure({ adapter: new Adapter() });

describe('Create Account', () => {
  let wrapper: ReactWrapper;
  let onActionStub: jest.Mock;
  const exampleAccount = {
    seed: 'horse battery staple correct',
    address: 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5'
  };
  const mountComponent = (): ReactWrapper => mount(<MemoryRouter initialEntries={['/account/create']} initialIndex={0}>
    <ActionContext.Provider value={onActionStub}>
      <ThemeProvider theme={defaultTheme}>
        <CreateAccount/>
      </ThemeProvider>
    </ActionContext.Provider>
  </MemoryRouter>);

  const check = (input: ReactWrapper): unknown => input.simulate('change', { target: { checked: true } });

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
      expect(wrapper.find(CreationStep).find(ActionText).text()).toBe('Cancel');
    });

    it('clicking "Cancel" redirects to main screen', () => {
      wrapper.find(CreationStep).find(ActionText).simulate('click');
      expect(onActionStub).toBeCalledWith('/');
    });

    it('clicking on Next activates phase 2', () => {
      check(wrapper.find('input[type="checkbox"]'));
      wrapper.find('button').simulate('click');
      expect(wrapper.find(CreationStep).text()).toBe('Create an account:2/2Cancel');
    });
  });

  describe('Phase 2', () => {
    const type = (input: ReactWrapper, value: string): unknown => input.simulate('change', { target: { value } });

    beforeEach(() => {
      check(wrapper.find('input[type="checkbox"]'));
      wrapper.find('button').simulate('click');
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
      type(wrapper.find('input'), 'abc');
      expect(wrapper.find(Input).first().prop('withError')).toBe(false);
      expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input)).toHaveLength(1);
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find(Button)).toHaveLength(0);
    });

    it('password shorter than 6 characters should be not valid', () => {
      type(wrapper.find('input'), 'abc');
      type(wrapper.find('input[type="password"]'), 'abcde');
      expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input).prop('withError')).toBe(true);
      expect(wrapper.find(InputWithLabel).find('[data-input-password]').find(Input)).toHaveLength(1);
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]')).toHaveLength(0);
      expect(wrapper.find(Button)).toHaveLength(0);
    });

    it('submit button is not visible until both passwords are equal', () => {
      type(wrapper.find('input'), 'abc');
      type(wrapper.find('input[type="password"]').first(), 'abcdef');
      type(wrapper.find('input[type="password"]').last(), 'abcdeg');
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]').find(Input).prop('withError')).toBe(true);
      expect(wrapper.find(Button)).toHaveLength(0);
    });

    it('submit button is visible when both passwords are equal', () => {
      type(wrapper.find('input'), 'abc');
      type(wrapper.find('input[type="password"]').first(), 'abcdef');
      type(wrapper.find('input[type="password"]').last(), 'abcdef');
      expect(wrapper.find(InputWithLabel).find('[data-input-repeat-password]').find(Input).prop('withError')).toBe(false);
      expect(wrapper.find(Button)).toHaveLength(1);
    });

    it('saves account with provided name and password', async () => {
      type(wrapper.find('input'), 'abc');
      type(wrapper.find('input[type="password"]').first(), 'abcdef');
      type(wrapper.find('input[type="password"]').last(), 'abcdef');
      wrapper.find(Button).find('button').simulate('click');
      expect(messaging.createAccountSuri).toBeCalledWith('abc', 'abcdef', exampleAccount.seed);
      await flushAllPromises();
      expect(onActionStub).toBeCalledWith('/');
    });
  });
});
