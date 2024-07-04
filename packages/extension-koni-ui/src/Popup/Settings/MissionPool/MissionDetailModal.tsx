// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DefaultLogosMap from '@subwallet/extension-koni-ui/assets/logo';
import { InfoItemBase, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { NetworkGroup } from '@subwallet/extension-koni-ui/components/MetaInfo/parts';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { missionCategoryMap, MissionCategoryType, tagMap } from '@subwallet/extension-koni-ui/Popup/Settings/MissionPool/predefined';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { MissionInfo, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { capitalize, customFormatDate, openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Button, ButtonProps, Icon, Image, ModalContext, SwModal, Tag } from '@subwallet/react-ui';
import { CaretLeft, GlobeHemisphereWest, PlusCircle } from 'phosphor-react';
import React, { Context, useCallback, useContext, useMemo } from 'react';
import Markdown from 'react-markdown';
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

    const start = data.start_time ? customFormatDate(new Date(data.start_time), '#DD# #MMM# #YYYY#') : t('TBD');
    const end = data.end_time ? customFormatDate(new Date(data.end_time), '#DD# #MMM# #YYYY#') : t('TBD');

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

  const modalCloseButton = <Icon
    customSize={'24px'}
    phosphorIcon={CaretLeft}
    type='phosphor'
    weight={'light'}
  />;

  const status = useMemo(() => {
    if (
      data?.status && missionCategoryMap[data?.status]
    ) {
      return t(missionCategoryMap[data?.status].name);
    }

    if (data?.status) {
      return t(capitalize(data?.status));
    }

    return '';
  }, [data?.status, t]);

  const valueColorSchema = useMemo<InfoItemBase['valueColorSchema']>(() => {
    const missionStatus = data?.status;

    if (missionStatus != null && tagMap[missionStatus]?.theme) {
      const statusColorSchema = tagMap[missionStatus]?.theme as InfoItemBase['valueColorSchema'];

      return statusColorSchema;
    } else {
      return 'default';
    }
  }, [data?.status]);

  return (
    <SwModal
      className={`${className}`}
      closeIcon={modalCloseButton}
      id={modalId}
      onCancel={onCancel}
      title={t(data?.name || 'Mission details')}
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
                shape={'squircle'}
                src={data.logo || logoMap.default as string}
                width={'100%'}
              />
            </div>

            <MetaInfo
              className={'__meta-block'}
              spaceSize={'ms'}
              valueColorScheme={'light'}
            >
              <MetaInfo.Default
                label={t('Name')}
              >
                {data.name}
              </MetaInfo.Default>

              {
                !!data.chains && data.chains.length > 1 && (
                  <MetaInfo.Default
                    label={t('Network')}
                  >
                    <NetworkGroup chains={data.chains} />
                  </MetaInfo.Default>
                )
              }

              {
                !!data.chains && data.chains.length === 1 && (
                  <MetaInfo.Chain
                    chain={data.chains[0]}
                    label={t('Network')}
                  />
                )
              }
              <MetaInfo.Default
                className={'__status-pool'}
                label={t('Status')}
                valueColorSchema={valueColorSchema}
              >
                {status}
              </MetaInfo.Default>
              {data?.categories && data.categories.length > 0 && (
                <MetaInfo.Default
                  className='__category-pool'
                  label={t('Categories')}
                >
                  {data.categories.map((category, index) => (
                    <Tag
                      className='__item-tag'
                      color={category.color}
                      key={index}
                    >
                      <Icon
                        className='__item-tag-icon'
                        customSize='12px'
                      />
                      {category.name}
                    </Tag>
                  ))}
                </MetaInfo.Default>
              )}

              <MetaInfo.Default
                className={'-vertical'}
                label={t('Description')}
                valueColorSchema={'gray'}
              >
                <Markdown>{data.description}</Markdown>
              </MetaInfo.Default>
              {!!data.total_supply && <MetaInfo.Default
                className={'__total-token-supply'}
                label={t('Total token supply')}
                valueColorSchema={'gray'}
              >
                {data.total_supply}
              </MetaInfo.Default>}
              <MetaInfo.Default
                label={t('Total rewards')}
                valueColorSchema={'gray'}
              >
                {data.reward}
              </MetaInfo.Default>
              <MetaInfo.Default
                label={t('Timeline')}
                valueColorSchema={'success'}
              >
                {timeline}
              </MetaInfo.Default>
              <MetaInfo.Default
                label={t('Total winners')}
                valueColorSchema={'gray'}
              >
                {data.total_winner}
              </MetaInfo.Default>
            </MetaInfo>

            <div className='__modal-footer'>
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
                    <Image
                      height={18}
                      shape='square'
                      src={DefaultLogosMap.xtwitter_transparent}
                      width={20}
                    />
                  )}
                  onClick={onClickTwitterIcon}
                  size={'xs'}
                  type='ghost'
                />
                <Button
                  className={'__modal-join-now-button'}
                  disabled={data.status === MissionCategoryType.ARCHIVED}
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
            </div>
          </>
        )
      }
    </SwModal>
  );
}

export const MissionDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-content': {
      paddingBottom: 0,
      maxHeight: 600,
      borderRadius: 0
    },
    '.__item-tag:last-child': {
      marginRight: 0
    },
    '.ant-sw-modal-header': {
      borderBottom: 0
    },
    '.__modal-icon-button .ant-image': {
      display: 'flex',
      alignItems: 'end'
    },
    '.__total-token-supply .__value': {
      fontWeight: token.fontWeightStrong
    },
    '.__status-pool .__value': {
      fontWeight: token.fontWeightStrong
    },
    '.__modal-background': {
      height: 65,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      filter: 'blur(7.5px)'
    },

    '.__modal-separator': {
      height: 2,
      marginBottom: token.marginLG,
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
    },

    '.__meta-block': {
      '.__row': {
        gap: token.size
      },

      '.__label-col': {
        maxWidth: 'fit-content',
        justifyContent: 'flex-start'
      },

      '.__value-col': {
        textAlign: 'right'
      },

      '.__row.-vertical': {
        flexDirection: 'column',
        gap: token.sizeXS,

        '.__value-col': {
          textAlign: 'left'
        }
      }
    },

    '.__modal-footer': {
      paddingBottom: token.paddingLG,
      paddingLeft: token.padding,
      paddingRight: token.padding,
      marginRight: -token.margin,
      marginLeft: -token.margin,
      marginBottom: -token.margin,
      backgroundColor: token.colorBgLayout,
      paddingTop: token.paddingMD,
      position: 'sticky',
      bottom: -17,
      zIndex: 10
    }
  });
});
