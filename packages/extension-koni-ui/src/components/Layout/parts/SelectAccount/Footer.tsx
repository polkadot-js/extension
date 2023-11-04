// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ATTACH_ACCOUNT_MODAL, CREATE_ACCOUNT_MODAL, DISCONNECT_EXTENSION_MODAL, IMPORT_ACCOUNT_MODAL, SELECT_ACCOUNT_MODAL, SELECT_EXTENSION_MODAL } from '@subwallet/extension-koni-ui/constants';
import { InjectContext } from '@subwallet/extension-koni-ui/contexts/InjectContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import { FileArrowDown, PlusCircle, PuzzlePiece, Swatches } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { enabled, injected, loadingInject } = useContext(InjectContext);
  const { isWebUI } = useContext(ScreenContext);

  const openModal = useCallback((id: string) => {
    inactiveModal(SELECT_ACCOUNT_MODAL);
    activeModal(id);
  }, [activeModal, inactiveModal]);

  const openCreateAccount = useCallback(() => {
    openModal(CREATE_ACCOUNT_MODAL);
  }, [openModal]);

  const openImportAccount = useCallback(() => {
    openModal(IMPORT_ACCOUNT_MODAL);
  }, [openModal]);

  const openAttachAccount = useCallback(() => {
    openModal(ATTACH_ACCOUNT_MODAL);
  }, [openModal]);

  const onClickExtension = useCallback(() => {
    if (enabled) {
      activeModal(DISCONNECT_EXTENSION_MODAL);
    } else {
      activeModal(SELECT_EXTENSION_MODAL);
    }
  }, [activeModal, enabled]);

  return (
    <div className={className}>
      <Button
        block={true}
        icon={(
          <Icon
            phosphorIcon={PlusCircle}
            weight={'fill'}
          />
        )}
        onClick={openCreateAccount}
        schema='secondary'
      >
        {t('Create new')}
      </Button>
      <Button
        className='btn-min-width'
        icon={(
          <Icon
            phosphorIcon={FileArrowDown}
            weight={'fill'}
          />
        )}
        onClick={openImportAccount}
        schema='secondary'
        tooltip={isWebUI ? t('Import account') : undefined}
      />
      <Button
        className='btn-min-width'
        icon={(
          <Icon
            phosphorIcon={Swatches}
            weight={'fill'}
          />
        )}
        onClick={openAttachAccount}
        schema='secondary'
        tooltip={isWebUI ? t('Attach account') : undefined}
      />
      <Button
        className='btn-min-width'
        icon={(
          <Icon
            phosphorIcon={PuzzlePiece}
            weight={'fill'}
          />
        )}
        loading={loadingInject}
        onClick={onClickExtension}
        schema={ (enabled && !loadingInject) ? 'danger' : 'secondary'}
        tooltip={isWebUI ? ((enabled && !loadingInject) ? t('Disconnect extension') : injected ? t('Connect extension') : t('Download extension')) : undefined}
      />
    </div>
  );
};

const SelectAccountFooter = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',

    '.btn-min-width': {
      minWidth: token.controlHeightLG + token.sizeSM
    }
  };
});

export default SelectAccountFooter;
