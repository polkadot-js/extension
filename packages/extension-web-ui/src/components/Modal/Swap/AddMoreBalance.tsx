// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseModal } from '@subwallet/extension-web-ui/components';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  modalId: string
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, modalId } = props;

  const { inactiveModal } = useContext(ModalContext);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal, modalId]);

  return (
    <>
      <BaseModal
        className={CN(className)}
        closable={true}
        destroyOnClose={true}
        footer={
          <>
            {(
              <Button
                block={true}
                className={'__left-button'}
                icon={(
                  <Icon
                    phosphorIcon={XCircle}
                    weight={'fill'}
                  />
                )}
                onClick={onCancel}
                schema={'secondary'}
              >
                {'Cancel'}
              </Button>
            )}
            <Button
              block={true}
              className={'__right-button'}
              icon={(
                <Icon
                  phosphorIcon={CheckCircle}
                  weight={'fill'}
                />
              )}
              onClick={onCancel}
            >
              {'approve'}
            </Button>
          </>
        }
        id={modalId}
        onCancel={onCancel}
        title={'Add More Balance'}
      >
        <div>Slippage setting modal</div>
      </BaseModal>
    </>
  );
};

const AddMoreBalance = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default AddMoreBalance;
