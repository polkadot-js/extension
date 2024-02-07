// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps, VoidFunction } from '@subwallet/extension-koni-ui/types';
import { Button, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  modalId: string,
  onCancel: VoidFunction,
  onClickConfirm: VoidFunction;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, modalId, onCancel, onClickConfirm } = props;
  const { t } = useTranslation();

  return (
    <>
      <SwModal
        className={CN(className)}
        footer={(
          <Button
            block={true}
            onClick={onClickConfirm}
          >
            {t('Update')}
          </Button>
        )}
        id={modalId}
        onCancel={onCancel}
        title={t('Update network')}
      >
        <div className={'__message'}>
          {t('Your selected network has lost connection. Update it by re-enabling it or changing network provider.')}
        </div>
      </SwModal>
    </>
  );
};

const RecheckChainConnectionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__message': {
      color: token.colorTextLight4,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      textAlign: 'center'
    }
  };
});

export default RecheckChainConnectionModal;
