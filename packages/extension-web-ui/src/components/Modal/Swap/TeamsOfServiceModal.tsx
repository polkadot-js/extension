// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { BaseModal } from '@subwallet/extension-web-ui/components';
import { SWAP_TERM_AND_SERVICE_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  onOk: () => void
}

const modalId = SWAP_TERM_AND_SERVICE_MODAL;

const Component = ({ className, onOk }: Props) => {
  const { inactiveModal } = useContext(ModalContext);
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);

  const onConfirm = useCallback(() => {
    inactiveModal(modalId);
    onOk();
  }, [inactiveModal, onOk]);

  return (
    <BaseModal
      center={true}
      className={CN(className, {
        '-desktop-term': isWebUI
      })}
      closable={false}
      id={modalId}
      title={t('Terms of service')}
      width={ isWebUI ? 784 : undefined }
    >
      <div
        className={'term-body'}
      >
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean bibendum tempor orci.
          In feugiat gravida sodales. Suspendisse quis turpis facilisis, pellentesque enim sit amet, sollicitudin dui.
          Vestibulum condimentum lectus eget dolor euismod venenatis. Mauris facilisis tincidunt quam ac hendrerit.
          Praesent in lorem arcu. Donec egestas tempus felis eget ullamcorper. Read more</p>
      </div>
      <div className={'term-footer'}>
        <div className={'term-footer-button-group'}>
          <Button
            block={true}
            className={'term-footer-button'}
            disabled={false}
            icon={ (
              <Icon
                phosphorIcon={CheckCircle}
                weight='fill'
              />
            )}
            onClick={onConfirm}
          >
            {t('I understand')}
          </Button>
        </div>

      </div>
    </BaseModal>
  );
};

export const TeamsOfServiceModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});
