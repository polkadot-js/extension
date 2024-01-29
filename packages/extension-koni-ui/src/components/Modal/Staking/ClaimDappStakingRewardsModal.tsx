// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import {Button, Icon, PageIcon, SwModal} from '@subwallet/react-ui';
import React from 'react';
import styled from 'styled-components';
import CN from 'classnames';
import {CheckCircle, Warning, XCircle} from "phosphor-react";

type Props = ThemeProps & {
  modalId: string,
  title: string,
  content: React.ReactNode
  onCancel?: () => void;
  onOk?: () => void;
}

const Component: React.FC<Props> = (props: Props) => {
  const { modalId, content, title, className, onCancel, onOk} = props;

  return (
    <>
      <SwModal
        className={CN(className)}
        id={modalId}
        title={title}
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

                onClick={onCancel}>
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
              onClick={onOk}>
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
          {content}
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
    }
  };
});

export default ClaimDappStakingRewardsModal;
