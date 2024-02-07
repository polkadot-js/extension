// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetaInfo } from '@subwallet/extension-web-ui/components/MetaInfo';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { FadersHorizontal } from 'phosphor-react';
import React from 'react';

export type Props = ThemeProps & {
  withController?: boolean,
  title?: string,
}

const mock = [
  {
    address: '1',
    name: 'string'
  },
  {
    address: '2',
    name: 'string'
  },
  {
    address: '3',
    name: 'string'
  },
  {
    address: '4',
    name: 'string'
  }
];

function Component ({ className, title = 'Portfolio', withController = true }: Props): React.ReactElement<Props> {
  return (
    <div className={CN(className)}>
      <div className='common-header'>
        <Typography.Title className='page-name'>{title}</Typography.Title>
        {withController && <div className='action-group'>
          <Button
            icon={<Icon
              phosphorIcon={FadersHorizontal}
              size={'sm'}
            />}
            size={'xs'}
            type={'ghost'}
          />
          <MetaInfo.AccountGroup
            accounts={mock}
            className='ava-group'
            content={`${mock.length} networks`}
          />
          <MetaInfo.AccountGroup
            accounts={mock}
            className='ava-group'
            content={`${mock.length} networks`}
          />
        </div>}
      </div>
    </div>
  );
}

export default Component;
