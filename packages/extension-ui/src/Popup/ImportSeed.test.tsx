// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '../../../../__mocks__/chrome';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router';

import { Button, Warning } from '../components';
import * as messaging from '../messaging';
import { flushAllPromises } from '../testHelpers';
import ImportSeed from './ImportSeed';

const account = {
  derivation: '/1',
  expectedAddress: '5GNg7RWeAAJuya4wTxb8aZf19bCWJroKuJNrhk4N3iYHNqTm',
  expectedAddressWithDerivation: '5DV3x9zgaXREUMTX7GgkP3ETeW4DQAznWTxg4kx2WivGuQLQ',
  name: 'My Polkadot Account',
  seed: 'upgrade multiply predict hip multiply march leg devote social outer oppose debris'
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

const typeSeed = async (wrapper: ReactWrapper, value: string) => {
  wrapper.find('textarea').first().simulate('change', { target: { value } });
  await act(flushAllPromises);
  wrapper.update();
};

const typeDerivationPath = async (wrapper: ReactWrapper, value: string) => {
  wrapper.find('input').first().simulate('change', { target: { value } });
  await act(flushAllPromises);
  wrapper.update();
};

describe('Import from seed', () => {
  let wrapper: ReactWrapper;

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    wrapper = mount(
      <MemoryRouter>
        <ImportSeed />
      </MemoryRouter>
    );

    await act(flushAllPromises);
    wrapper.update();
  });

  describe('Step 1', () => {
    it('first shows no error, no account, and next step button is disabled', () => {
      expect(wrapper.find('Name span').text()).toEqual('<unknown>');
      expect(wrapper.find('[data-field="address"]').text()).toEqual('<unknown>');
      expect(wrapper.find('.derivationPath').exists()).toBe(false);
      expect(wrapper.find(Warning).exists()).toBe(false);
      expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
    });

    it('shows the expected account when correct seed is typed and next step button is enabled', async () => {
      jest.spyOn(messaging, 'validateSeed').mockResolvedValue({ address: account.expectedAddress, suri: account.seed });
      await typeSeed(wrapper, account.seed);

      expect(wrapper.find(Warning).exists()).toBe(false);
      expect(wrapper.find(Button).prop('isDisabled')).toBe(false);
      expect(wrapper.find('Name span').text()).toEqual('<unknown>');
      expect(wrapper.find('[data-field="address"]').text()).toEqual(account.expectedAddress);
    });

    it('shows an error when incorrect seed is typed and next step button is enabled', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
      jest.spyOn(messaging, 'validateSeed').mockImplementation(async () => {
        throw new Error('Some test error message');
      });
      await typeSeed(wrapper, 'this is an invalid mnemonic seed');

      expect(wrapper.find(Warning).find('.warning-message').text()).toEqual('Invalid mnemonic seed');
      expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
      expect(wrapper.find('Name span').text()).toEqual('<unknown>');
      expect(wrapper.find('[data-field="address"]').text()).toEqual('<unknown>');
    });

    it('shows an error when the seed is removed', async () => {
      await typeSeed(wrapper, 'asdf');
      await typeSeed(wrapper, '');

      expect(wrapper.find(Warning).find('.warning-message').text()).toEqual('Mnemonic needs to contain 12, 15, 18, 21, 24 words');
      expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
    });

    it('shows the expected account with derivation when correct seed is typed and next step button is enabled', async () => {
      const suri = `${account.seed}${account.derivation}`;
      const validateCall = jest.spyOn(messaging, 'validateSeed').mockResolvedValue({ address: account.expectedAddressWithDerivation, suri });

      await typeSeed(wrapper, account.seed);
      wrapper.find('.advancedToggle').simulate('click');
      await typeDerivationPath(wrapper, account.derivation);

      expect(validateCall).toHaveBeenLastCalledWith(suri);
      expect(wrapper.find(Warning).exists()).toBe(false);
      expect(wrapper.find(Button).prop('isDisabled')).toBe(false);
      expect(wrapper.find('Name span').text()).toEqual('<unknown>');
      expect(wrapper.find('[data-field="address"]').text()).toEqual(account.expectedAddressWithDerivation);
    });

    it('shows an error when derivation path is incorrect and next step button is disabled', async () => {
      const wrongPath = 'wrong';
      const suri = `${account.seed}${wrongPath}`;
      // eslint-disable-next-line @typescript-eslint/require-await
      const validateCall = jest.spyOn(messaging, 'validateSeed').mockImplementation(async () => {
        throw new Error('Some test error message');
      });

      await typeSeed(wrapper, account.seed);
      wrapper.find('.advancedToggle').simulate('click');
      await typeDerivationPath(wrapper, wrongPath);

      expect(validateCall).toHaveBeenLastCalledWith(suri);
      expect(wrapper.find(Warning).find('.warning-message').text()).toEqual('Invalid mnemonic seed or derivation path');
      expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
      expect(wrapper.find('Name span').text()).toEqual('<unknown>');
      expect(wrapper.find('[data-field="address"]').text()).toEqual('<unknown>');
    });

    it('moves to the second step', async () => {
      jest.spyOn(messaging, 'validateSeed').mockResolvedValue({ address: account.expectedAddress, suri: account.seed });
      await typeSeed(wrapper, account.seed);
      wrapper.find(Button).simulate('click');

      expect(wrapper.find(Button)).toHaveLength(2);
      expect(wrapper.find('Name span').text()).toEqual('<unknown>');
      expect(wrapper.find('[data-field="address"]').text()).toEqual(account.expectedAddress);
    });
  });
});
