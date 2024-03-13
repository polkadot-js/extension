// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { BaseModal } from '@subwallet/extension-web-ui/components';
import { SWAP_TERM_OF_SERVICE_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Checkbox, Icon, ModalContext } from '@subwallet/react-ui';
import { CheckboxChangeEvent } from '@subwallet/react-ui/es/checkbox';
import CN from 'classnames';
import { CaretDown, CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  onOk: () => void
}

const modalId = SWAP_TERM_OF_SERVICE_MODAL;

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

  const onScrollContent = useCallback(() => {
    if (scrollRef && scrollRef?.current && scrollRef?.current?.scrollHeight < 294) {
      setIsScrollEnd(true);
    }

    scrollRef?.current?.scroll({ top: scrollRef?.current?.scrollHeight, left: 0 });
  }, [scrollRef]);

  const onScrollToAcceptButton = useCallback(() => {
    if (!scrollRef?.current) {
      return;
    }

    setIsScrollEnd(scrollRef.current.scrollTop >= scrollRef.current.scrollHeight - 300);
  }, []);

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
        className={'__content-container'}
        onScroll={onScrollToAcceptButton}
        ref={scrollRef}
      >
        <div className={'__content-title'}>You’re using the Chainflip swap provider, which is still in a pre-release version. Please read the following carefully:</div>
        <div className={'__term-item'}>
          <div className={'__term-item-label'}>Pre-release Version</div>
          <div>This is brand new protocol and despite our
            extensive preparations, there may be issues, and you may lose money.
            Features and swap sizes are limited for that reason.</div>
        </div>
        <div className={'__term-item'}>
          <div className={'__term-item-label'}>Testing Phase</div>
          <div>This is the real-world testing phase that provides a safer
          environment for liquidity providers and users. Your participation will help
            us improve, but please know that you do so at your own risk.</div>
        </div>
        <div className={'__term-item'}>
          <div className={'__term-item-label'}>Swap Limits</div>
          <div>Swaps are capped at about $50,000 per deposit. Any
          amount exceeding these limits will be absorbed by the protocol and
            can not be refunded.</div>
        </div>

        {(!isScrollEnd || !scrollRef?.current) && <Button
          className={'__term-body-caret-button'}
          icon={<Icon phosphorIcon={CaretDown} />}
          onClick={onScrollContent}
          schema={'secondary'}
          shape={'circle'}
          size={'xs'}
        />}
      </div>
      <div className={'__term-footer'}>
        <Checkbox
          checked={isChecked}
          className={'__term-footer-checkbox'}
          onChange={onCheckedInput}
        >
          {t('I understand and agree to the Terms of Use, which apply to my use of SubWallet and all of its feature')}
        </Checkbox>
        <div className={'__term-footer-button-group'}>
          <Button
            block={true}
            className={'__term-footer-button'}
            disabled={!isChecked || !isScrollEnd}
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
    color: token.colorTextDescription,
    '.__term-item': {
      fontSize: token.fontSizeSM,
      fontWeight: token.bodyFontWeight,
      lineHeight: token.lineHeightSM,
      marginBottom: token.marginSM
    },
    '.__term-item-label': {
      fontSize: token.fontSize,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeight,
      color: token.colorWhite
    },
    '.__content-container': {
      maxHeight: 294,
      display: 'block',
      overflowY: 'scroll',
      scrollBehavior: 'smooth'
    },
    '.__term-body-caret-button': {
      position: 'absolute',
      top: '70%',
      right: '3%'
    },
    '.__term-footer-checkbox': {
      alignItems: 'center',
      marginTop: token.marginSM,
      marginBottom: token.margin
    },
    '.__content-title': {
      color: token.colorWhite,
      marginBottom: token.margin
    }
  };
});
