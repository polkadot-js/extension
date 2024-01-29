// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import {Button, Icon, ModalContext, PageIcon, SwModal} from '@subwallet/react-ui';
import React, {useCallback, useContext} from 'react';
import styled from 'styled-components';
import CN from 'classnames';
import {CheckCircle, Warning, XCircle} from "phosphor-react";
import {Trans} from "react-i18next";
import {detectTranslate} from "@subwallet/extension-base/utils";
import {CLAIM_DAPP_STAKING_REWARDS_MODAL} from "@subwallet/extension-koni-ui/constants";

type Props = ThemeProps & {
}
const modalId = CLAIM_DAPP_STAKING_REWARDS_MODAL;
const Component: React.FC<Props> = (props: Props) => {
  const {className} = props;
    const { activeModal, inactiveModal } = useContext(ModalContext);

    const onOpenModal = useCallback(() => {
        activeModal(modalId);
    }, [activeModal, modalId]);

    const onCloseModal = useCallback(() => {
        inactiveModal(modalId);
    }, [inactiveModal, modalId]);

    const onOpenPortal = useCallback(() => {
        open('https://portal.astar.network/')
    }, [])

  return (
    <>
      <SwModal
        className={CN(className)}
        id={modalId}
        title={'Claim ASTR staking rewards'}
        onOk={onOpenModal}
        closable={false}
        footer={
          <div className={'modal_btn'}>
              <Button
                schema={'secondary'}
                className={'__left-btn'}
                block={true}
                icon={
                  <Icon
                    customSize='28px'
                    phosphorIcon={XCircle}
                    weight={"fill"}
                  />
                }

                onClick={onCloseModal}>
                Dismiss
              </Button>
            <Button
              block={true}
              icon={
                <Icon
                  customSize='28px'
                  phosphorIcon={CheckCircle}
                  weight={"fill"}
                />
              }
              className={'__right-btn'}
              onClick={onOpenPortal}>
              Claim now
            </Button>
          </div>
        }
      >
        <div className={'page-icon-astar-modal'}>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{
              weight: 'fill',
              phosphorIcon: Warning
            }}
          />
        </div>
        <div className='modal_content'>
            <Trans
                components={{
                    highlight: (
                        <a
                            className='link'
                            href='https://docs.astar.network/docs/learn/dapp-staking/dapp-staking-faq/#q-what-about-unclaimed-rewards'
                            rel='noopener noreferrer'
                            target='_blank'
                        />
                    )
                }}
                i18nKey={detectTranslate('<highlight>Astar dApp staking V3</highlight> is launching in early February. Make sure to claim any ASTR rewards before the launch or they will be lost.')}
            />
        </div>
      </SwModal>
    </>
  );
};

const ClaimDappStakingRewardsModal = styled(Component)<Props>(({ theme: {token}}: Props) => {
  return {
    '.modal_content': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeightHeading6,
      textAlign: 'center',
      color: token.colorTextDescription,
      paddingLeft: token.padding,
      paddingRight: token.padding
    },
    '.modal_btn': {
      display: 'flex',
      justifyContent: 'row',
      gap: token.sizeSM
    },
    '.page-icon-astar-modal': {
      display: 'flex',
      justifyContent: 'center',
      marginTop: token.margin,
      marginBottom: token.marginMD,
      '--page-icon-color': token.colorWarning
    },
    '.ant-sw-header-center-part': {
      width: 'auto'
<<<<<<< HEAD
    }
=======
    },
      '.link': {
          color: token.colorLink,
          textDecoration: 'underline !important',
          backgroundColor: 'red'
      },
>>>>>>> origin/koni/dev/issue-2545
  };
});

export default ClaimDappStakingRewardsModal;
