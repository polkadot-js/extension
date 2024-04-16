// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, ModalContext, SwModal } from '@subwallet/react-ui';
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
      <SwModal
        className={CN(className, 'add-more-balance-container')}
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
        <div>content...</div>
      </SwModal>
    </>
  );
};

const AddMoreBalanceModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.add-more-balance-container .ant-sw-modal-footer': {
      display: 'flex'
    }

  };
});

export default AddMoreBalanceModal;
