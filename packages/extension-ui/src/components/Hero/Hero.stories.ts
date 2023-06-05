// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Meta, StoryObj } from '@storybook/react';

import Hero from './Hero';

const meta = {
  component: Hero,
  argTypes: {
    className: {
      table: {
        disable: true
      }
    }
  },
  args: {
    iconType: 'aleph',
    headerText: 'Add your title here',
    children: 'Optional description here. I can be much longer than title'
  }
} satisfies Meta<typeof Hero>;

export default meta;

export const Story: StoryObj<typeof Hero> = {
  args: {}
};
