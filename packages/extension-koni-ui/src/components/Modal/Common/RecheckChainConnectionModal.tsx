// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  modalId: string
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, modalId } = props;

  return (
    <>
      <SwModal
        className={CN(className)}
        id={modalId}
      >

      </SwModal>
    </>
  );
};

const RecheckChainConnectionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default RecheckChainConnectionModal;
