// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseModal, MetaInfo } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { missionCategoryMap } from '@subwallet/extension-koni-ui/Popup/MissionPool/predefined';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { MissionInfo } from '@subwallet/extension-koni-ui/types/missionPool';
import { customFormatDate, openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Button, ButtonProps, Icon, Image, ModalContext } from '@subwallet/react-ui';
import { GlobeHemisphereWest, PlusCircle, TwitterLogo } from 'phosphor-react';
import React, { Context, useCallback, useContext, useMemo } from 'react';
import styled, { ThemeContext } from 'styled-components';

type Props = ThemeProps & {
  data: MissionInfo | null,
};

export const PoolDetailModalId = 'PoolDetailModalId';

const modalId = PoolDetailModalId;

function Component ({ className = '', data }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const logoMap = useContext<Theme>(ThemeContext as Context<Theme>).logoMap;

  const timeline = useMemo<string>(() => {
    if (!data?.start_time && !data?.end_time) {
      return t('TBD');
    }

    const start = data.start_time ? customFormatDate(new Date(data.start_time), '#DD# #DDD# #YYYY#') : t('TBD');
    const end = data.end_time ? customFormatDate(new Date(data.end_time), '#DD# #DDD# #YYYY#') : t('TBD');

    return `${start} - ${end}`;
  }, [data?.end_time, data?.start_time, t]);

  const onClickGlobalIcon: ButtonProps['onClick'] = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data?.campaign_url && openInNewTab(data.campaign_url)();
  }, [data?.campaign_url]);

  const onClickTwitterIcon: ButtonProps['onClick'] = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data?.twitter_url && openInNewTab(data.twitter_url)();
  }, [data?.twitter_url]);

  const onClickJoinNow: ButtonProps['onClick'] = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data?.url && openInNewTab(data.url)();
  }, [data?.url]);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const status = useMemo(() => {
    if (
      data?.status && missionCategoryMap[data?.status]
    ) {
      return t(missionCategoryMap[data?.status].name);
    }

    if (data?.status) {
      return t('');
    }

    return '';
  }, [data?.status, t]);

  return (
    <BaseModal
      className={`${className}`}
      id={modalId}
      onCancel={onCancel}
      title={t('Mission Details')}
    >
      {
        data && (
          <>
            <div
              className='__modal-background'
              style={{ backgroundImage: data.backdrop_image ? `url("${data.backdrop_image}")` : undefined }}
            ></div>

            <div
              className='__modal-logo'
            >
              <Image
                height={'100%'}
                src={data.logo || logoMap.default as string}
                width={'100%'}
              />
            </div>

            <MetaInfo
              spaceSize={'ms'}
              valueColorScheme={'light'}
            >
              <MetaInfo.Default
                label={t('Status')}
                valueColorSchema={'success'}
              >
                {status}
              </MetaInfo.Default>
              <MetaInfo.Number
                label={t('Total Supply')}
                prefix={'$'}
                value={'1000000'}
                valueColorSchema={'gray'}
              />
              <MetaInfo.Number
                label={t('Total rewards')}
                value={'1000'}
                valueColorSchema={'gray'}
              />
              <MetaInfo.Default
                label={t('Timeline')}
                valueColorSchema={'success'}
              >
                {timeline}
              </MetaInfo.Default>
              <MetaInfo.Number
                label={t('Total winners')}
                value={'50'}
                valueColorSchema={'gray'}
              />
            </MetaInfo>

            <div className={'__modal-separator'}></div>

            <div className={'__modal-buttons'}>
              <Button
                className={'__modal-icon-button'}
                icon={(
                  <Icon
                    phosphorIcon={GlobeHemisphereWest}
                    size={'sm'}
                    weight={'fill'}
                  />
                )}
                onClick={onClickGlobalIcon}
                size={'xs'}
                type='ghost'
              />
              <Button
                className={'__modal-icon-button'}
                icon={(
                  <Icon
                    phosphorIcon={TwitterLogo}
                    size={'sm'}
                    weight={'fill'}
                  />
                )}
                onClick={onClickTwitterIcon}
                size={'xs'}
                type='ghost'
              />
              <Button
                className={'__modal-join-now-button'}
                icon={(
                  <Icon
                    phosphorIcon={PlusCircle}
                    size={'sm'}
                    weight={'fill'}
                  />
                )}
                onClick={onClickJoinNow}
                shape={'circle'}
                size={'xs'}
              >
                {t('Join now')}
              </Button>
            </div>
          </>
        )
      }
    </BaseModal>
  );
}

export const MissionDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.__modal-background': {
      height: 70,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      filter: 'blur(7.5px)'
    },

    '.__modal-separator': {
      marginTop: token.paddingLG,
      marginBottom: token.paddingLG,
      height: 2,
      marginLeft: -token.margin,
      marginRight: -token.margin,
      backgroundColor: 'rgba(33, 33, 33, 0.80)'
    },

    '.__modal-logo': {
      width: 64,
      height: 64,
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: -35,
      marginBottom: token.sizeXL
    },

    '.__modal-buttons': {
      gap: token.size,

      display: 'flex'
    },

    '.__modal-icon-button': {
      borderRadius: '100%',
      border: '2px solid',
      borderColor: token.colorBgBorder
    },

    '.__modal-join-now-button': {
      '.anticon': {
        height: 20,
        width: 20
      }
    }
  });
});
