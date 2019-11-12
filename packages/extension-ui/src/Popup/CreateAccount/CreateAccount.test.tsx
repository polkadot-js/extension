// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import Adapter from 'enzyme-adapter-react-16';

import { History } from 'history';
import CreateAccount from '.';
import { configure, mount, ReactWrapper } from 'enzyme';
import { MemoryRouter } from 'react-router';
import * as messaging from '@polkadot/extension-ui/messaging';
import { act } from 'react-dom/test-utils';
import { flushAllPromises } from '@polkadot/extension-ui/testHelpers';
import { ActionText, Button, defaultTheme } from '@polkadot/extension-ui/components';
import CreationStep from '@polkadot/extension-ui/Popup/CreateAccount/CreationStep';
import { ThemeProvider } from 'styled-components';

configure({ adapter: new Adapter() });

describe('Create Account', () => {
  let wrapper: ReactWrapper;
  let historyMock: History;
  const exampleAccount = {
    seed: 'horse battery staple correct',
    address: 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5'
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mountComponent = (): ReactWrapper => mount(<MemoryRouter initialEntries={['/account/create']} initialIndex={0}>
    <ThemeProvider theme={defaultTheme}>
      <CreateAccount history={historyMock}/>
    </ThemeProvider>
  </MemoryRouter>);

  beforeEach(async () => {
    historyMock = {
      push: jest.fn()
    } as unknown as History;
    jest.spyOn(messaging, 'createSeed').mockResolvedValue(exampleAccount);
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

    it('clicking on Next activates phase 2', () => {
      wrapper.find('input[type="checkbox"]').simulate('change', { target: { checked: true } });
      wrapper.find('button').simulate('click');
      expect(wrapper.find(CreationStep).text()).toBe('Create an account:2/2Cancel');
    });

    it('clicking cancel redirects to main screen', () => {
      wrapper.find(CreationStep).find(ActionText).simulate('click');
      const { push } = historyMock;
      expect(push).lastCalledWith('/');
    });
  });
});
