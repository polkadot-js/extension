// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps, WalletConnectChainInfo } from '@subwallet/extension-web-ui/types';
import { Icon, Web3Block } from '@subwallet/react-ui';
import CN from 'classnames';
import { DotsThree } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

import WCNetworkAvatarGroup from './WCNetworkAvatarGroup';

interface Props extends ThemeProps {
  networks: WalletConnectChainInfo[];
  content: string;
  onClick: () => void;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, content, networks, onClick } = props;

  return (
    <div className={CN(className)}>
      <Web3Block
        className='wc-network-input'
        leftItem={<WCNetworkAvatarGroup networks={networks} />}
        middleItem={(
          <div className='wc-network-modal-content'>
            {content}
          </div>
        )}
        onClick={onClick}
        rightItem={(
          <div className={'more-icon'}>
            <Icon
              iconColor='var(--icon-color)'
              phosphorIcon={DotsThree}
              size='md'
              type='phosphor'
              weight='fill'
            />
          </div>
        )}
      />
    </div>
  );
};

const WCNetworkInput = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--icon-color': token['gray-5'],

    '.wc-network-input': {
      backgroundColor: token.colorBgSecondary,
      borderRadius: token.borderRadiusLG,

      '&:hover': {
        backgroundColor: token.colorBgInput
      }
    },

    '.wc-network-modal-content': {
      textAlign: 'left'
    },

    '.more-icon': {
      display: 'flex',
      width: 40,
      justifyContent: 'center'
    }
  };
});

export default WCNetworkInput;
