// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper } from "@subwallet-webapp/components";
import SelectAccountType from "@subwallet-webapp/components/Account/SelectAccountType";
import CloseIcon from "@subwallet-webapp/components/Icon/CloseIcon";
import {
  EVM_ACCOUNT_TYPE,
  SUBSTRATE_ACCOUNT_TYPE,
} from "@subwallet-webapp/constants/account";
import { IMPORT_ACCOUNT_MODAL } from "@subwallet-webapp/constants/modal";
import useCompleteCreateAccount from "@subwallet-webapp/hooks/account/useCompleteCreateAccount";
import useGetDefaultAccountName from "@subwallet-webapp/hooks/account/useGetDefaultAccountName";
import useGoBackFromCreateAccount from "@subwallet-webapp/hooks/account/useGoBackFromCreateAccount";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useFocusFormItem from "@subwallet-webapp/hooks/form/useFocusFormItem";
import useAutoNavigateToCreatePassword from "@subwallet-webapp/hooks/router/useAutoNavigateToCreatePassword";
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate";
import {
  createAccountSuriV2,
  validateSeedV2,
} from "@subwallet-webapp/messaging";
import { ThemeProps } from "@subwallet-webapp/types";
import { ValidateState } from "@subwallet-webapp/types/validator";
import { Form, Icon, Input } from "@subwallet/react-ui";
import CN from "classnames";
import { FileArrowDown } from "phosphor-react";
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styled from "styled-components";

import { KeypairType } from "@polkadot/util-crypto/types";

type Props = ThemeProps;

const FooterIcon = <Icon phosphorIcon={FileArrowDown} weight="fill" />;

const formName = "import-seed-phrase-form";
const fieldName = "seed-phrase";

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  const onComplete = useCompleteCreateAccount();
  const onBack = useGoBackFromCreateAccount(IMPORT_ACCOUNT_MODAL);

  const accountName = useGetDefaultAccountName();

  const timeOutRef = useRef<NodeJS.Timer>();

  const [form] = Form.useForm();

  const [keyTypes, setKeyTypes] = useState<KeypairType[]>([
    SUBSTRATE_ACCOUNT_TYPE,
    EVM_ACCOUNT_TYPE,
  ]);
  const [validateState, setValidateState] = useState<ValidateState>({});
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changed, setChanged] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");

  const onChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      setChanged(true);
      const val = event.target.value;

      setSeedPhrase(val);
    },
    []
  );

  const onSubmit = useCallback(() => {
    if (seedPhrase) {
      setSubmitting(true);
      setTimeout(() => {
        createAccountSuriV2({
          name: accountName,
          suri: seedPhrase,
          isAllowed: true,
          types: keyTypes,
        })
          .then(() => {
            onComplete();
          })
          .catch((error: Error): void => {
            setValidateState({
              status: "error",
              message: error.message,
            });
          })
          .finally(() => {
            setSubmitting(false);
          });
      }, 300);
    }
  }, [seedPhrase, accountName, keyTypes, onComplete]);

  useEffect(() => {
    let amount = true;

    if (timeOutRef.current) {
      clearTimeout(timeOutRef.current);
    }

    if (amount) {
      if (seedPhrase) {
        setValidating(true);
        setValidateState({
          status: "validating",
          message: "",
        });

        timeOutRef.current = setTimeout(() => {
          validateSeedV2(seedPhrase, [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE])
            .then((res) => {
              if (amount) {
                setValidateState({});
              }
            })
            .catch((e: Error) => {
              if (amount) {
                setValidateState({
                  status: "error",
                  message: e.message,
                });
              }
            })
            .finally(() => {
              if (amount) {
                setValidating(false);
              }
            });
        }, 300);
      } else {
        if (changed) {
          setValidateState({
            status: "error",
            message: "Seed phrase is required",
          });
        }
      }
    }

    return () => {
      amount = false;
    };
  }, [seedPhrase, changed]);

  useFocusFormItem(form, fieldName);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={{
          children: validating ? t("Validating") : t("Import account"),
          icon: FooterIcon,
          onClick: onSubmit,
          disabled: !seedPhrase || !!validateState.status || !keyTypes.length,
          loading: validating || submitting,
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome,
          },
        ]}
        title={t<string>("Import from seed phrase")}
      >
        <div className="container">
          <div className="description">
            {t(
              "To import an existing Polkdot wallet, please enter the recovery seed phrase here:"
            )}
          </div>
          <Form className="form-container" form={form} name={formName}>
            <Form.Item
              help={validateState.message}
              name={fieldName}
              validateStatus={validateState.status}
            >
              <Input.TextArea
                className="seed-phrase-input"
                onChange={onChange}
                placeholder={t("Secret phrase")}
              />
            </Form.Item>
            <Form.Item>
              <SelectAccountType
                selectedItems={keyTypes}
                setSelectedItems={setKeyTypes}
                withLabel={true}
              />
            </Form.Item>
          </Form>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ImportSeedPhrase = styled(Component)<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".container": {
        padding: token.padding,
      },

      ".ant-form-item:last-child": {
        marginBottom: 0,
      },

      ".description": {
        padding: `0 ${token.padding}px`,
        fontSize: token.fontSizeHeading6,
        lineHeight: token.lineHeightHeading6,
        color: token.colorTextDescription,
        textAlign: "center",
      },

      ".form-container": {
        marginTop: token.margin,
      },

      ".seed-phrase-input": {
        textarea: {
          resize: "none",
          height: `${token.sizeLG * 6}px !important`,
        },
      },
    };
  }
);

export default ImportSeedPhrase;
