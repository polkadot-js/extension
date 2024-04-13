// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { NotificationType } from '@subwallet/extension-base/background/KoniTypes';
import { calculateReward } from '@subwallet/extension-base/services/earning-service/utils';
import { NominationPoolInfo, ValidatorInfo, YieldPoolInfo, YieldPoolTarget, YieldPoolType } from '@subwallet/extension-base/types';
import { balanceFormatter, formatNumber } from '@subwallet/extension-base/utils';
import { Avatar, BaseModal, MetaInfo } from '@subwallet/extension-web-ui/components';
import { VALIDATOR_DETAIL_RW_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { earlyValidateJoin } from '@subwallet/extension-web-ui/messaging';
import { AlertDialogProps, ThemeProps } from '@subwallet/extension-web-ui/types';
import { toShort } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, ModalContext, Number as NumberComponent } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel?: VoidFunction;
  onStakeMore?: (slug: string, chain: string) => void;
  validatorItem: YieldPoolTarget;
  openAlert: (alertProps: AlertDialogProps) => void;
  closeAlert: VoidFunction;
  poolInfo: YieldPoolInfo | undefined;
  assetRegistry: Record<string, _ChainAsset>;
  bypassEarlyValidate?: boolean;
};

const modalId = VALIDATOR_DETAIL_RW_MODAL;

function Component (props: Props): React.ReactElement<Props> {
  const { assetRegistry,
    bypassEarlyValidate,
    className,
    closeAlert,
    onCancel,
    onStakeMore,
    openAlert,
    poolInfo,
    validatorItem } = props;
  const { address: validatorAddress,
    commission,
    identity,
    minBond: minStake,
    name,
    nominatorCount,
    totalStake } = validatorItem as ValidatorInfo & NominationPoolInfo;
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);
  const checkRef = useRef<number>(Date.now());
  const [loading, setLoading] = useState(false);
  const [apy, setApy] = useState<string>();

  const asset = useMemo(() => {
    if (!poolInfo) {
      return;
    }

    const { metadata: { inputAsset } } = poolInfo;

    return assetRegistry[inputAsset];
  }, [assetRegistry, poolInfo]);

  const getApy = useCallback((totalApy?: number, totalApr?: number) => {
    if (!(poolInfo && poolInfo.statistic)) {
      return undefined;
    }

    if (totalApy) {
      return totalApy;
    }

    if (totalApr) {
      const rs = calculateReward(totalApr);

      return rs.apy;
    }

    return undefined;
  }, [poolInfo]);

  useEffect(() => {
    if (!(poolInfo && poolInfo.statistic && asset)) {
      return;
    }

    const { totalApr, totalApy } = poolInfo.statistic;
    const apyRaw = getApy(totalApy, totalApr);

    apyRaw !== undefined && setApy(formatNumber(apyRaw, 0, balanceFormatter));
  }, [asset, getApy, poolInfo]);

  const title = useMemo(() => {
    if (!poolInfo || !asset) {
      return '';
    }

    const { type } = poolInfo;
    const minJoinPool = poolInfo.statistic?.earningThreshold.join || '0';

    const getOrigin = () => {
      switch (type) {
        case YieldPoolType.NOMINATION_POOL:
        case YieldPoolType.NATIVE_STAKING:
        case YieldPoolType.LIQUID_STAKING:
          return 'Earn up to {{apy}} yearly from {{minActiveStake}} with {{shortName}}';
        case YieldPoolType.LENDING:
          return 'Earn up to {{apy}} yearly from {{minActiveStake}} with {{shortName}}';
      }
    };

    let result = getOrigin();
    const shortName = poolInfo.metadata.shortName;

    if (asset) {
      if (Number(minJoinPool) === 0 && !apy) {
        result = 'Earn {{token}} with {{network}}';
        result = result.replace('{{token}}', asset.symbol);
        result = result.replace('{{network}}', shortName);
      }

      if (Number(minJoinPool) === 0) {
        result = result.replace(' from {{minActiveStake}}', '');
      } else {
        const string = formatNumber(minJoinPool, asset.decimals || 0, balanceFormatter);

        result = result.replace('{{minActiveStake}}', `${string} ${asset.symbol}`);
      }
    } else {
      result = result.replace('from ', '');
    }

    if (apy) {
      result = result.replace('{{apy}}', `${apy}%`);
    } else {
      result = result.replace('up to {{apy}} ', '');
    }

    if (shortName) {
      result = result.replace('{{shortName}}', shortName);
    }

    return result;
  }, [apy, asset, poolInfo]);

  const { activeModal, inactiveModal } = useContext(ModalContext);
  const setVisible = useCallback(
    (show: boolean) => {
      checkRef.current = Date.now();

      if (show) {
        activeModal(modalId);
      } else {
        inactiveModal(modalId);
      }
    },
    [activeModal, inactiveModal]
  );

  const onClickButton = useCallback(() => {
    if (!poolInfo) {
      return;
    }

    if (bypassEarlyValidate) {
      onStakeMore?.(poolInfo.slug, poolInfo.chain);

      return;
    }

    const time = Date.now();

    checkRef.current = time;
    setLoading(true);

    const isValid = () => {
      return time === checkRef.current;
    };

    const onError = (message: string) => {
      openAlert({
        title: t('Pay attention!'),
        type: NotificationType.ERROR,
        content: message,
        okButton: {
          text: t('I understand'),
          onClick: closeAlert,
          icon: CheckCircle
        }
      });
    };

    earlyValidateJoin({
      slug: poolInfo.slug,
      address: validatorAddress || ''
    })
      .then((rs) => {
        if (isValid()) {
          if (rs.passed) {
            setVisible(false);
            setTimeout(() => {
              onStakeMore?.(poolInfo.slug, poolInfo.chain);
            }, 300);
          } else {
            const message = rs.errorMessage || '';

            onError(message);
          }
        }
      })
      .catch((e) => {
        if (isValid()) {
          const message = (e as Error).message || '';

          onError(message);
        }
      })
      .finally(() => {
        if (isValid()) {
          setLoading(false);
        }
      });
  }, [poolInfo, bypassEarlyValidate, validatorAddress, onStakeMore, openAlert, t, closeAlert, setVisible]);

  const _onCancel = useCallback(() => {
    inactiveModal(modalId);

    onCancel && onCancel();
  }, [inactiveModal, onCancel]);

  const footerNode = (
    <Button
      block={true}
      className={'__stake-more-button'}
      icon={
        <Icon
          phosphorIcon={PlusCircle}
          weight='fill'
        />
      }
      loading={loading}
      onClick={onClickButton}
    >
      {t('Stake to earn')}
    </Button>
  );

  return (
    <BaseModal
      center={true}
      className={CN(className, {
        '-isMobile': !isWebUI
      })}
      footer={footerNode}
      id={modalId}
      onCancel={_onCancel}
      title={title}
      width={isWebUI ? 540 : undefined}
    >
      <MetaInfo
        hasBackgroundWrapper
        spaceSize={'xs'}
        valueColorScheme={'light'}
      >
        <Avatar
          className={'__validator-avatar'}
          size={64}
          value={validatorAddress}
        />
        <div className={'__meta-info-group-item'}>
          <div className={'__validator-label'}>
            {t('Validator')}
          </div>
          <div className={'__validator-name'}>
            {name || identity || toShort(validatorAddress)}
          </div>
          {
            !!apy &&
              <div className={'__meta-info-item -apy-item'}>
                <div className={'__meta-info-label'}>
                  {t('APY:')}
                </div>
                <NumberComponent
                  className={'__apy-value'}
                  decimal={0}
                  suffix={'%'}
                  value={apy}
                />
              </div>
          }
        </div>

        <div className={'__meta-info-group-item'}>

          {!!commission && <div className={'__meta-info-item'}>
            <div className={'__meta-info-label'}>
              {t('Commission:')}
            </div>
            <NumberComponent
              decimal={0}
              size={16}
              suffix={'%'}
              value={commission}
            />
          </div>}

          {totalStake && <div className={'__meta-info-item'}>
            <div className={'__meta-info-label'}>
              {t('Total stake:')}
            </div>
            <NumberComponent
              decimal={asset?.decimals || 0}
              size={16}
              suffix={asset?.symbol}
              value={totalStake}
            />
          </div>}

          {!!nominatorCount && <div className={'__meta-info-item'}>
            <div className={'__meta-info-label'}>
              {t('Nominator count:')}
            </div>
            <NumberComponent
              decimal={0}
              size={16}
              value={nominatorCount}
            />
          </div>}

          {!!minStake && <div className={'__meta-info-item'}>
            <div className={'__meta-info-label'}>
              {t('Minimum active stake:')}
            </div>
            <NumberComponent
              decimal={asset?.decimals || 0}
              size={16}
              suffix={asset?.symbol}
              value={minStake}
            />
          </div>}
        </div>
      </MetaInfo>
    </BaseModal>
  );
}

const EarningValidatorDetailRWModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-content': {
      padding: token.paddingLG,
      maxHeight: 'fit-content'
    },

    '.ant-sw-modal-header': {
      borderBottomColor: 'transparent !important',
      paddingBottom: token.paddingLG
    },

    '.ant-sw-header-container': {
      height: 64,
      alignItems: 'flex-start'
    },

    '.ant-sw-header-center-part .ant-sw-sub-header-title': {
      '.ant-typography ': {
        whiteSpace: 'normal',
        lineHeight: token.lineHeightHeading3,
        fontSize: token.fontSizeHeading3
      }
    },
    '.ant-sw-modal-body': {
      padding: `0 ${token.padding}px`,

      '.-has-background-wrapper': {
        padding: `${token.paddingXL}px 0`,
        display: 'flex',
        flexDirection: 'column',
        gap: token.paddingXS,
        alignItems: 'center'
      }
    },

    '.__meta-info-group-item': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXXS
    },

    '.__meta-info-item': {
      display: 'flex',
      justifyContent: 'center',
      gap: token.sizeXXS,
      alignItems: 'center'
    },

    '.__meta-info-label': {
      color: token.colorTextLight2,
      fontSize: token.fontSizeHeading5,
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: token.lineHeightHeading5
    },

    '.__meta-info-item.-apy-item': {
      '.__meta-info-label, .__apy-value': {
        color: token.colorSuccess,
        fontSize: token.fontSizeHeading3,
        fontWeight: 600,
        lineHeight: token.lineHeightHeading3,

        '.ant-typography': {
          fontWeight: '600 !important',
          lineHeight: token.lineHeightHeading3
        }
      }
    },

    '.ant-sw-modal-footer': {
      borderTop: '2px solid transparent',
      padding: `${token.paddingLG}px ${token.paddingXL}px ${token.paddingLG}px ${token.paddingXL}px`
    },

    '.__validator-name': {
      color: token.colorTextLight1,
      fontSize: token.fontSizeHeading3,
      fontStyle: 'normal',
      textAlign: 'center',
      fontWeight: 600,
      lineHeight: token.lineHeightHeading3
    },

    '.__validator-label': {
      color: token.colorTextLight4,
      fontSize: token.fontSizeHeading6,
      fontStyle: 'normal',
      fontWeight: 500,
      textAlign: 'center',
      lineHeight: token.lineHeightHeading6
    },

    '.ant-number': {
      fontSize: token.fontSizeLG
    },

    '&.-isMobile': {
      '.ant-sw-header-container': {
        height: 100
      },

      '.ant-sw-modal-footer': {
        paddingBottom: token.paddingXXL + token.paddingSM
      }
    }
  });
});

export default EarningValidatorDetailRWModal;
