// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import clone from '@subwallet/extension-koni-ui/assets/clone.svg';
import download from '@subwallet/extension-koni-ui/assets/icon/download.svg';
import icon from '@subwallet/extension-koni-ui/assets/Illustration.png';
import bg from '@subwallet/extension-koni-ui/assets/MasterPassword_bg.png';
import { Button, InputWithLabel, Modal, ValidatedInput, Warning } from '@subwallet/extension-koni-ui/components';
import ActionText from '@subwallet/extension-koni-ui/components/ActionText';
import TextAreaWithLabel from '@subwallet/extension-koni-ui/components/TextAreaWithLabel';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringExportMnemonic } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isNotShorterThan } from '@subwallet/extension-koni-ui/util/validators';
import CN from 'classnames';
import { saveAs } from 'file-saver';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  closeModal: () => void;
  address: string;
}

const MIN_LENGTH = 6;

const onCopy = (): void => {
  const mnemonicSeedTextElement = document.querySelector('textarea');

  if (!mnemonicSeedTextElement) {
    return;
  }

  mnemonicSeedTextElement.select();
  document.execCommand('copy');
};

const ExportMnemonicModal = ({ address, className, closeModal }: Props) => {
  const { t } = useTranslation();
  const { show } = useToast();

  const [loading, setLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string | null>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [seed, setSeed] = useState<string>('');

  const isFirstPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')), [t]);

  const handleOnSubmit = useCallback((password: string | null) => {
    if (password) {
      setLoading(true);

      keyringExportMnemonic({
        address: address,
        password: password
      }).then((res) => {
        if (res.result) {
          setSeed(res.result);
        }
      }).catch((e) => {
        setErrors([(e as Error).message]);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [address]);

  const onChangePassword = useCallback((value: string | null) => {
    setPassword(value);
    setErrors([]);
  }, []);

  const onPress = useCallback(() => {
    handleOnSubmit(password);
  }, [password, handleOnSubmit]);

  const _onCopy = useCallback((): void => {
    onCopy();
    show(t('Copied'));
  }, [show, t]);

  const backupMnemonicSeed = useCallback(() => {
    const blob = new Blob([JSON.stringify(seed)], { type: 'application/json; charset=utf-8' });

    saveAs(blob, 'mnemonic-seed.json');
  }, [seed]);

  return (
    <Modal
      className={CN(className)}
      maskClosable={true}
      onClose={closeModal}
      wrapperClassName={'export-mnemonic-modal'}
    >
      <div className={'modal-header'}>
        <div className='modal-title'>
          {t('Export seed phrase')}
        </div>
        <img
          alt='shield'
          className='modal-icon'
          src={icon}
        />
      </div>
      <div className={'modal-body'}>
        <ValidatedInput
          className={className}
          component={InputWithLabel}
          data-input-password
          isFocused={true}
          label={t('Password')}
          onEnter={handleOnSubmit}
          onValidatedChange={onChangePassword}
          type='password'
          validator={isFirstPasswordValid}
        />
        {
          seed && (
            <div className={CN('mnemonic-container')}>
              <TextAreaWithLabel
                className={'mnemonic-seed__display mnemonic-display-download-btn'}
                isReadOnly
                label={t<string>('Generated 12-word mnemonic seed:')}
                showWarningIcon={true}
                tooltipContent={t<string>('Please write down your wallet\'s mnemonic seed and keep it in a safe place. The mnemonic can be used to restore your wallet. Keep it carefully to not lose your assets.')}
                value={seed}
              />
              <div
                className='download-button'
                onClick={backupMnemonicSeed}
              >
                <img
                  alt='download'
                  src={download}
                />
              </div>
              <div className='mnemonic-seed__buttons-row'>
                <ActionText
                  className='mnemonic-seed__copy-btn'
                  data-seed-action='copy'
                  img={clone}
                  onClick={_onCopy}
                  text={t<string>('Copy to clipboard')}
                />
              </div>
            </div>
          )}
        {
          errors.map((err, index) =>
            (
              <Warning
                className='item-error'
                isDanger
                key={index}
              >
                {t(err)}
              </Warning>
            )
          )
        }
        <div className='separator' />
      </div>
      <div className='modal-footer'>
        <Button
          className='cancel-button'
          isDisabled={loading}
          onClick={closeModal}
        >
          {t('Cancel')}
        </Button>
        <Button
          className='save-button'
          isBusy={loading}
          isDisabled={!password || !!seed}
          onClick={onPress}
        >
          {t('Export')}
        </Button>
      </div>
    </Modal>
  );
};

export default React.memo(styled(ExportMnemonicModal)(({ theme }: Props) => `
  .export-mnemonic-modal.subwallet-modal {
    width: 390px;
    max-width: 390px;
    background-color: ${theme.popupBackground};
    border-radius: 15px;
    top: 10%;
    z-index: 1050;
    position: fixed;
    left: 0px;
    right: 0px;
    margin: 0px auto;
    padding: 15px;
    bottom: unset;

    .modal-header {
      height: 100px;
      margin: -15px -15px 0;
      padding: 12px;
      background-image: url(${bg});
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      border-radius: 8px 8px 0 0;
      background-color: ${theme.background};


      .modal-title {
        font-style: normal;
        font-weight: 500;
        font-size: 20px;
        line-height: 32px;
        color: ${theme.textColor};
        margin-left: 4px;
      }

      .modal-icon {
        height: 79px;
        width: 96px;
      }
    }

    .modal-body {
      .sub-title {
        font-weight: 500;
        font-size: 15px;
        line-height: 26px;
        color: ${theme.textColor2};
        margin-bottom: 4px;
        margin-top: 20px;
      }

      .separator {
        margin-top: 24px;
        margin-bottom: 16px;
      }

      .separator:before {
        content: "";
        height: 1px;
        display: block;
        background: ${theme.boxBorderColor};
      }

      .item-error {
        margin: 10px 0;
      }

      .mnemonic-container {
        position: relative;
        margin-top: 7px;
        margin-bottom: 12px;

        .mnemonic-seed__buttons-row {
          display: flex;
          flex-direction: row;
          margin-top: 15px;

          .mnemonic-seed__copy-btn {
            margin-right: 32px;
            display: flex;
            align-items: center;
            > span {
              font-size: 14px;
              line-height: 24px;
              color: ${theme.textColor};
              padding-left: 10px;
            }
          }
        }

        .download-button {
          display: flex;
          position: absolute;
          top: 55px;
          right: 15px;
          cursor: pointer;
        }

        .mnemonic-seed__display {
          textarea {
            color: ${theme.textColor3};
            font-size: 14px;
            height: unset;
            line-height: 24px;
            margin-bottom: 10px;
            padding: 9px 16px;
            background-color: ${theme.backgroundAccountAddress}
          }
        }

        .mnemonic-display-download-btn textarea {
          padding-right: 50px;
        }
      }
    }

    .modal-footer {
      padding-bottom: 5px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      flex: 1;
      margin: 0 -8px;

      .save-button {
        flex: 1;
        margin: 0 8px;
      }

      .button__disabled-overlay {
        background: ${theme.popupBackground};
      }

      .cancel-button {
        flex: 1;
        margin: 0 8px;
        background-color: ${theme.toggleInactiveBgc};

        .children {
          color: ${theme.buttonTextColor2};
        }
      }
    }
  }

  .validated-input__warning, .item-error {
    background: transparent;
    margin-top: 8px;
    padding: 0;

    .warning-image {
      width: 20px;
      margin-right: 8px;
      transform: translateY(2px);
    }

    .warning-message {
      color: ${theme.crowdloanFailStatus};
    }
  }

  &.ui--Tooltip {
    max-width: 330px;
    text-align: left;
    font-style: normal;
    font-weight: 400;
    font-size: 13px;
    line-height: 24px;
  }
`));
