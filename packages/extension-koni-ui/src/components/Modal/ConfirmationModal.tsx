// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseModal } from '@subwallet/extension-koni-ui/components/Modal/BaseModal';
import { CONFIRMATION_MODAL_INDEX } from '@subwallet/extension-koni-ui/constants';
import Confirmations from '@subwallet/extension-koni-ui/Popup/Confirmations';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps & {
  id: string;
  onCancel: () => void;
}

function Component ({ className = '', id, onCancel }: Props): React.ReactElement<Props> {
  const { hasConfirmations } = useSelector((state: RootState) => state.requestState);

  return (
    <BaseModal
      className={CN('confirmation-modal', className)}
      closable={false}
      id={id}
      onCancel={onCancel}
      transitionName={'fade'}
      wrapClassName={CN({ hidden: !hasConfirmations })}
      zIndex={CONFIRMATION_MODAL_INDEX}
    >
      <Confirmations className={'confirmation-content-wrapper'} />
    </BaseModal>
  );
}

export const ConfirmationModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-content.ant-sw-modal-content': {
      paddingTop: 0
    },

    '.ant-sw-modal-body.ant-sw-modal-body': {
      padding: 0
    },

    '.confirmation-content-wrapper': {
      '.confirmation-header': {
        paddingTop: token.size,
        paddingBottom: token.size,
        borderBottom: '2px solid',
        borderBottomColor: token.colorBgSecondary
      },

      '.confirmation-footer': {
        marginBottom: 0
      }
    }
  });
});
