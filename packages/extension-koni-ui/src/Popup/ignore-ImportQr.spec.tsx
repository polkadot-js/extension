// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@subwallet/extension-mocks/chrome';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router';

import { Button } from '../components';
import * as messaging from '../messaging';
import { flushAllPromises } from '../testHelpers';
import ImportQr from './ImportQr';

const mockedAccount = {
  content: '12bxf6QJS5hMJgwbJMDjFot1sq93EvgQwyuPWENr9SzJfxtN',
  expectedBannerChain: 'Polkadot',
  genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
  isAddress: true,
  name: 'My Polkadot Account'
};

interface ScanType {
  isAddress: boolean;
  content: string;
  genesisHash: string;
  name?: string;
}

interface QrScanAddressProps {
  className?: string;
  onError?: (error: Error) => void;
  onScan: (scanned: ScanType) => void;
  size?: string | number;
  style?: React.CSSProperties;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
configure({ adapter: new Adapter() });

const typeName = async (wrapper: ReactWrapper, value: string) => {
  wrapper.find('input').first().simulate('change', { target: { value } });
  await act(flushAllPromises);
  wrapper.update();
};

jest.mock('@polkadot/react-qr', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    QrScanAddress: ({ onScan }: QrScanAddressProps): null => {
      return null;
    }
  };
});

describe('ImportQr component', () => {
  let wrapper: ReactWrapper;

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    wrapper = mount(
      <MemoryRouter>
        <ImportQr />
      </MemoryRouter>
    );

    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      (wrapper.find('QrScanAddress').first().prop('onScan') as unknown as QrScanAddressProps['onScan'])(mockedAccount);
    });
    await act(flushAllPromises);
    wrapper.update();
  });

  describe('Address component', () => {
    it('shows account as external', () => {
      expect(wrapper.find('Name').find('FontAwesomeIcon [data-icon="qrcode"]').exists()).toBe(true);
    });

    it('shows the correct name', () => {
      expect(wrapper.find('Name span').text()).toEqual(mockedAccount.name);
    });

    it('shows the correct address', () => {
      expect(wrapper.find('[data-field="address"]').text()).toEqual(mockedAccount.content);
    });

    it('shows the correct banner', () => {
      expect(wrapper.find('[data-field="chain"]').text()).toEqual(mockedAccount.expectedBannerChain);
    });
  });

  it('has the button enabled', () => {
    expect(wrapper.find(Button).prop('isDisabled')).toBe(false);
  });

  it('displays and error and the button is disabled with a short name', async () => {
    await typeName(wrapper, 'a');

    expect(wrapper.find('.warning-message').first().text()).toBe('Account name is too short');
    expect(wrapper.find(Button).prop('isDisabled')).toBe(true);
  });

  it('has no error message and button enabled with a long name', async () => {
    const longName = 'aaa';

    await typeName(wrapper, 'a');
    await typeName(wrapper, longName);

    expect(wrapper.find('.warning-message')).toHaveLength(0);
    expect(wrapper.find(Button).prop('isDisabled')).toBe(false);
    expect(wrapper.find('Name span').text()).toEqual(longName);
  });

  it('shows the external name in the input field', () => {
    expect(wrapper.find('input').prop('value')).toBe(mockedAccount.name);
  });

  it('creates the external account', async () => {
    jest.spyOn(messaging, 'createAccountExternal').mockResolvedValue(false);
    wrapper.find(Button).simulate('click');
    await act(flushAllPromises);

    expect(messaging.createAccountExternal).toHaveBeenCalledWith(mockedAccount.name, mockedAccount.content, mockedAccount.genesisHash);
  });
});
