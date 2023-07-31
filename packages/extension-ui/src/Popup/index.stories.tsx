import type { Meta, StoryObj } from '@storybook/react';

import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { PHISHING_PAGE_REDIRECT } from '@polkadot/extension-base/defaults';

import { View } from '../components';
import Popup from '.';

export default {
  component: Popup,
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta<typeof Popup>;

type Story = StoryObj<typeof Popup>;

export const Metadata: Story = {
  decorators: [
    (Story) => {
      window.chrome.storage.local.get = () => Promise.resolve({
        welcomeRead: 'ok',
        metadataRequests: [{
          id: 'Aleph Zero Signer',
          payload: {
            chain: 'Aleph Zero Testnet',
            chainType: 'substrate',
            color: '#00CCAB',
            genesisHash: '0x05d5279c52c484cc80396535a316add7d47b1c5b9e0398dd1f584149341460c5',
            icon: 'substrate',
            specVersion: 64,
            ss58Format: 42,
            tokenDecimals: 12,
            tokenSymbol: 'TZERO',
            metaCalls: '',
            types: {},
          },
          url: 'https://test.azero.dev/#/accounts'
        }]
    });

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

type PhishingDetectedStory = StoryObj<{ websiteUrl: string }>;

export const PhishingDetected: PhishingDetectedStory = {
  args: {
    websiteUrl: 'https://azero.dev/'
  },
  parameters: {
    viewport: {
      defaultViewport: 'fullscreen'
    },
    layout: 'centered'
  },
  decorators: [
    (Story, { args }) => {
      const initialUrl = `${PHISHING_PAGE_REDIRECT}/${encodeURIComponent(args.websiteUrl)}`;

      return (
        <View>
          <MemoryRouter
            initialEntries={[initialUrl]}
            key={initialUrl}
          >
            <Story />
          </MemoryRouter>
        </View>
      );
    }
  ]
};
