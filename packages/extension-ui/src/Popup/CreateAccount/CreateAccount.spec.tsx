// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { ReactWrapper } from 'enzyme';
import type * as _ from '@polkadot/dev-test/globals.d.ts';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import enzyme from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { ActionContext, ActionText, Button } from '../../components/index.js';
import * as messaging from '../../messaging.js';
import { Header } from '../../partials/index.js';
import { flushAllPromises } from '../../testHelpers.js';
import CreateAccount from './index.js';

const { configure, mount } = enzyme;

// // NOTE Required for spyOn when using @swc/jest
// // https://github.com/swc-project/swc/issues/3843
// jest.mock('../../messaging', (): Record<string, unknown> => ({
//   __esModule: true,
//   ...jest.requireActual('../../messaging')
// }));

// For this file, there are a lot of them
/* eslint-disable @typescript-eslint/no-unsafe-argument */

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

describe('Create Account', () => {
  let wrapper: ReactWrapper;
  let onActionStub: ReturnType<typeof jest.fn>;
  const exampleAccount = {
    address: 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5',
    seed: 'horse battery staple correct'
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const mountComponent = (): ReactWrapper => mount(
    <ActionContext.Provider value={onActionStub}>
      <CreateAccount />
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
    jest.spyOn(messaging, 'createSeed').mockImplementation(() => Promise.resolve(exampleAccount));
    jest.spyOn(messaging, 'createAccountSuri').mockImplementation(() => Promise.resolve(true));
    wrapper = mountComponent();
    await act(flushAllPromises);
    wrapper.update();
  });

  describe('Phase 1', () => {
    it('shows seed phrase in a span inside a div', () => {
      expect(wrapper.find('.seedBox span').text()).toBe(exampleAccount.seed);
    });

    it('next step button is disabled when checkbox is not checked', () => {
      expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
    });

    it('action text is "Cancel"', () => {
      expect(wrapper.find(Header).find(ActionText).text()).toBe('Cancel');
    });

    it('clicking "Cancel" redirects to main screen', () => {
      wrapper.find(Header).find(ActionText).simulate('click');
      expect(onActionStub).toHaveBeenCalledWith('/');
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

    it('saves account with provided network, name and password', async () => {
      const kusamaGenesis = '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe';

      wrapper.find('select').simulate('change', { target: { value: kusamaGenesis } });
      await act(flushAllPromises);
      wrapper.update();

      await enterName('abc').then(password('abcdef')).then(repeat('abcdef'));
      wrapper.find('[data-button-action="add new root"] button').simulate('click');
      await act(flushAllPromises);

      expect(messaging.createAccountSuri).toHaveBeenCalledWith('abc', 'abcdef', exampleAccount.seed, 'sr25519', kusamaGenesis);
      expect(onActionStub).toHaveBeenCalledWith('/');
    });
  });
});
