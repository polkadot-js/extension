// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CampaignBanner, CampaignButton } from '@subwallet/extension-base/background/KoniTypes';
import { BaseModal } from '@subwallet/extension-koni-ui/components';
import { HOME_CAMPAIGN_BANNER_MODAL } from '@subwallet/extension-koni-ui/constants';
import { completeBannerCampaign } from '@subwallet/extension-koni-ui/messaging/campaigns';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getBannerButtonIcon, openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, Image, ModalContext } from '@subwallet/react-ui';
import { ButtonSchema } from '@subwallet/react-ui/lib/button/button';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  banner: CampaignBanner;
}

const modalId = HOME_CAMPAIGN_BANNER_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { banner, className } = props;

  const { inactiveModal } = useContext(ModalContext);

  const onCloseBanner = useCallback(() => {
    inactiveModal(modalId);

    completeBannerCampaign({
      slug: banner.slug
    })
      .catch((console.error));
  }, [banner.slug, inactiveModal]);

  const onClickButton = useCallback((item: CampaignButton) => {
    return () => {
      if (item.type === 'open_url') {
        const url = item.metadata?.url as string | undefined;

        if (url) {
          openInNewTab(url)();
        }
      }

      if (item.metadata?.doneOnClick) {
        onCloseBanner();
      }
    };
  }, [onCloseBanner]);

  return (
    <BaseModal
      center={true}
      className={CN(className)}
      closable={false}
      id={modalId}
      maskClosable={false}
    >
      <Image
        alt={banner.data.alt}
        src={banner.data.media}
        width='100%'
      />
      <div className='button-container'>
        {banner.buttons.map((item, index) => {
          const icon = getBannerButtonIcon(item.icon);

          return (
            <Button
              block={true}
              icon={icon && (
                <Icon
                  phosphorIcon={icon}
                  weight='fill'
                />
              )}
              key={index}
              onClick={onClickButton(item)}
              schema={item.color as ButtonSchema}
            >
              {item.name}
            </Button>
          );
        })}
      </div>
    </BaseModal>
  );
};

const CampaignBannerModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.button-container': {
      display: 'flex',
      flexDirection: 'row',
      gap: token.size,
      paddingTop: token.padding
    },

    '.ant-sw-modal-content': {
      paddingTop: token.paddingXXS,
      borderRadius: `${token.borderRadiusXL}px ${token.borderRadiusXL}px 0 0`
    }
  };
});

export default CampaignBannerModal;
