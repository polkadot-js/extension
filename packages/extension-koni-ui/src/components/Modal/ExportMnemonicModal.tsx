// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Modal } from '@subwallet/extension-koni-ui/components';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  closeModal: () => void;
}

const ExportMnemonicModal = ({ className, closeModal }: Props) => {
  return (
    <Modal
      className={CN(className)}
      maskClosable={true}
      onClose={closeModal}
      wrapperClassName={'export-mnemonic-modal'}
    >

    </Modal>
  );
};

export default React.memo(styled(ExportMnemonicModal)(({ theme }: Props) => `
  .export-mnemonic-modal.subwallet-modal {
    max-width: 390px;
  }
`));
