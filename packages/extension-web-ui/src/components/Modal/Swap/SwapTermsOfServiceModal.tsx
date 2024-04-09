// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { BaseModal } from '@subwallet/extension-web-ui/components';
import { SWAP_TERMS_OF_SERVICE_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Checkbox, Icon, ModalContext } from '@subwallet/react-ui';
import { CheckboxChangeEvent } from '@subwallet/react-ui/es/checkbox';
import CN from 'classnames';
import { CaretDown, CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  onOk: () => void
}

const modalId = SWAP_TERMS_OF_SERVICE_MODAL;

const Component = ({ className, onOk }: Props) => {
  const { inactiveModal } = useContext(ModalContext);
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);
  const [isChecked, setIsChecked] = useState(false);
  const [isScrollEnd, setIsScrollEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onCheckedInput = useCallback((e: CheckboxChangeEvent) => {
    setIsChecked(e.target.checked);
  }, []);

  const onConfirm = useCallback(() => {
    inactiveModal(modalId);
    onOk();
  }, [inactiveModal, onOk]);

  const isContentShort = scrollRef.current && scrollRef.current.scrollHeight <= 232;

  useEffect(() => {
    if (scrollRef.current && isContentShort) {
      setIsScrollEnd(true);
    }
  }, [isContentShort, isScrollEnd]);

  const onScrollContent = useCallback(() => {
    if (scrollRef && scrollRef?.current && scrollRef?.current?.scrollHeight <= 232) {
      setIsScrollEnd(true);
    }

    scrollRef?.current?.scroll({ top: scrollRef?.current?.scrollHeight, left: 0 });
  }, [scrollRef]);

  const onScrollToAcceptButton = useCallback(() => {
    if (!scrollRef?.current) {
      return;
    }

    setIsScrollEnd(scrollRef.current.scrollTop >= scrollRef.current.scrollHeight - 232);
  }, []);

  return (
    <BaseModal
      center={true}
      className={CN(className)}
      closable={false}
      id={modalId}
      title={t('Terms of service')}
      width={ isWebUI ? 736 : undefined }
    >
      <div className={'__content-title'}>You’re using third-party swap providers, which may contain inherent risks. Please read the following carefully</div>
      <div className={'__content-wrapper'}>
        <div
          className={'__content-body'}
          onScroll={onScrollToAcceptButton}
          ref={scrollRef}
        >
          <div className={'__term-item'}>
            The SubWallet Interface provides a web or mobile-based means of access to decentralized protocols
              on various public blockchains. The SubWallet Interface is distinct from the protocols and is one,
              but not the exclusive, means of accessing the protocols.
          </div>
          <div className={'__term-item'}>
            SubWallet does not control or operate any protocols on any blockchain network. By using the
              SubWallet Interface, you understand that you are not buying or selling digital assets from us and
              that we do not operate any liquidity pools on the protocols or control trade execution on the protocols.
          </div>
          <div className={'__term-item'}>
            Blockchain transactions require the payment of transaction fees to the appropriate network called
              gas fees. Except as otherwise expressly set forth in the terms of another offer by SubWallet,
              you will be solely responsible for paying the gas fees for any transaction that you initiate.
              Double-check the gas fees before making any transaction as gas fees can fluctuate.
          </div>
        </div>
        {(!isScrollEnd || !scrollRef?.current) && <Button
          className={'__caret-button'}
          icon={<Icon phosphorIcon={CaretDown} />}
          onClick={onScrollContent}
          schema={'secondary'}
          shape={'circle'}
          size={'xs'}
        />}
      </div>
      <div className={'__content-footer'}>
        <Checkbox
          checked={isChecked}
          className={'__content-footer-checkbox'}
          onChange={onCheckedInput}
        >
          {t('I understand the associated risk and will act under caution')}
        </Checkbox>
        <div className={'__content-footer-button-group'}>
          <Button
            block={true}
            className={'__content-footer-button'}
            disabled={!isChecked || !isScrollEnd}
            icon={ (
              <Icon
                phosphorIcon={CheckCircle}
                weight='fill'
              />
            )}
            onClick={onConfirm}
          >
            {t('Confirm and continue swapping')}
          </Button>
          <div className={'__content-footer-label'}>Scroll to read all sections</div>
        </div>

      </div>
    </BaseModal>
  );
};

export const SwapTermsOfServiceModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    color: token.colorTextDescription,
    '.ant-sw-modal-header': {
      paddingBottom: 24
    },
    '.ant-sw-modal-body': {
      paddingTop: 24,
      paddingLeft: 24,
      paddingRight: 24
    },
    '.ant-sw-modal-content': {
      maxHeight: 'none'
    },
    '.__term-item': {
      fontSize: token.fontSizeSM,
      fontWeight: token.bodyFontWeight,
      lineHeight: token.lineHeightSM,
      color: token.colorTextTertiary
    },
    '.ant-sw-sub-header-title-content': {
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3
    },
    '.__content-body': {
      maxHeight: 232,
      display: 'block',
      overflowY: 'scroll',
      scrollBehavior: 'smooth',
      backgroundColor: token.colorBgSecondary,
      paddingLeft: 16,
      paddingRight: 16
    },
    '.__content-wrapper': {
      position: 'relative',
      backgroundColor: token.colorBgSecondary,
      paddingBottom: 32,
      paddingTop: 16,
      borderRadius: 8,
      marginBottom: 20
    },
    '.__term-item + .__term-item': {
      marginTop: 16
    },
    '.__caret-button': {
      position: 'absolute',
      right: 16,
      bottom: -20,
      backgroundColor: token.geekblue
    },
    '.__content-footer-checkbox': {
      alignItems: 'center',
      marginTop: token.marginXS
    },
    '.__content-title': {
      color: token.colorTextLight2,
      marginBottom: token.marginXS,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      fontWeight: token.fontWeightStrong
    },
    '.__content-footer-button-group': {
      marginTop: 24,
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
      display: 'flex',
      flexDirection: 'column'
    },
    '.__content-footer-button': {
      maxWidth: 358
    },
    '.__content-footer-label': {
      fontSize: token.fontSizeSM,
      fontWeight: token.bodyFontWeight,
      lineHeight: token.lineHeightSM,
      marginTop: token.marginXS
    }
  };
});

export default SwapTermsOfServiceModal;
