// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Meta, StoryObj } from '@storybook/react';

import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { View } from '../components';
import { subscribeMetadataRequests } from '../messaging';
import Popup from '.';

export default {
  component: Popup,
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta<typeof Popup>;

type Story = StoryObj<typeof Popup>;

type Mock = {
  (...args: unknown[]): unknown;
  // eslint-disable-next-line @typescript-eslint/ban-types
  setMockImpl(nextMockImpl: Function): void;
};

export const Metadata: Story = {
  decorators: [
    (Story) => {
      (subscribeMetadataRequests as Mock).setMockImpl((sub: (tab: unknown[]) => void) =>
        sub([
          {
            id: 'Aleph Zero Signer',
            request: {
              chain: 'Aleph Zero Testnet',
              chainType: 'substrate',
              color: '#00CCAB',
              genesisHash: '0x05d5279c52c484cc80396535a316add7d47b1c5b9e0398dd1f584149341460c5',
              icon: 'substrate',
              specVersion: 64,
              ss58Format: 42,
              tokenDecimals: 12,
              tokenSymbol: 'TZERO',
              metaCalls: ''
            },
            url: 'https://test.azero.dev/#/accounts'
          }
        ])
      );

      return (
        <View>
          <MemoryRouter initialEntries={['/']}>
            <Story />
          </MemoryRouter>
        </View>
      );
    }
  ]
};

export const CreateAccount: Story = {
  decorators: [
    (Story) => (
      <View>
        <MemoryRouter initialEntries={['/account/create']}>
          <Story />
        </MemoryRouter>
      </View>
    )
  ]
};
