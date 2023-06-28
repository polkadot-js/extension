// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Image, Web3Block } from '@subwallet/react-ui';
import { SessionTypes } from '@walletconnect/types';
import CN from 'classnames';
import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  session: SessionTypes.Struct;
  onClick: (topic: string) => void;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, onClick, session } = props;

  const dAppInfo = session.peer.metadata;

  const _onClick = useCallback(() => {
    onClick(session.topic);
  }, [onClick, session.topic]);

  return (
    <Web3Block
      className={CN(className, 'connection-item')}
      leftItem={
        <Image
          height={40}
          src={dAppInfo.icons[0]}
          width={40}
        />
      }
      middleItem={(
        <div>{dAppInfo.url}</div>
      )}
      onClick={_onClick}
    />
  );
};

const ConnectionItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    padding: 0,
    paddingLeft: token.sizeSM,
    paddingRight: token.sizeXXS,
    minHeight: 48,
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,

    '&.ant-web3-block.connection-item': {
      display: 'flex'
    }
  };
});

export default ConnectionItem;
