// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon, Image, Web3Block } from '@subwallet/react-ui';
import { CaretRight } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  siteName: string,
  domain: string,
  accountCount: number,
  onClick?: () => void,
}

function Component (props: Props): React.ReactElement<Props> {
  const { accountCount, className, domain, onClick, siteName } = props;

  // todo: handle unknown logo
  const leftLogoUrl = `https://icons.duckduckgo.com/ip2/${domain}.ico`;

  return (
    <Web3Block
      className={className}
      leftItem={(
        <Image
          height={28}
          shape='circle'
          src={leftLogoUrl}
          width={28}
        />
      )}
      middleItem={(
        <>
          <div className={'__website-name h5-text'}>{siteName}</div>
          <div className={'__website-domain common-text'}>{domain}</div>
          <div className={'__account-count h5-text'}>{accountCount}</div>
        </>
      )}
      onClick={onClick}
      rightItem={(
        <div className={'__arrow-icon'}>
          <Icon
            phosphorIcon={CaretRight}
            size='sm'
          />
        </div>
      )}
    />
  );
}

export const WebsiteAccessItem = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => {
  return ({
    padding: 0,
    paddingLeft: token.sizeSM,
    paddingRight: token.sizeXXS,
    minHeight: 48,
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,

    '.ant-web3-block-middle-item': {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      overflow: 'hidden'
    },

    '.__website-name, .__account-count': {
      color: token.colorTextLight1
    },

    '.__website-name, .__website-domain': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },

    '.__website-name': {
      flex: 96 / 266
    },

    '.__website-domain': {
      flex: 140 / 266,
      paddingLeft: token.sizeXS,
      color: token.colorTextLight4
    },

    '.__account-count': {
      flex: 30 / 266,
      paddingLeft: token.sizeXXS,
      textAlign: 'right'
    },

    '.ant-web3-block-right-item': {
      margin: 0
    },

    '.__arrow-icon': {
      width: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  });
});
