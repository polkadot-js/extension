// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertBox, Layout, PageWrapper } from "@subwallet-webapp/components"
import InfoIcon from "@subwallet-webapp/components/Icon/InfoIcon"

import {
  Button,
  Form,
  Icon,
  Input,
  PageIcon,
  SwModal,
} from "@subwallet/react-ui"
import CN from "classnames"
import { CaretLeft, ShieldPlus, CheckCircle } from "phosphor-react"
import React, { useContext, useMemo } from "react"
import useCreatePassword, {
  PropsType,
  FormFieldName,
  formName,
  passwordRules,
  confirmPasswordRules,
  modalId,
} from "./hook"
import {
  ScreenContext,
  Screens,
} from "@subwallet-webapp/contexts/ScreenContext"
import InstructionContainer from "./InstructionContainer"

const FooterIcon = <Icon phosphorIcon={CheckCircle} weight="fill" />

const ComponentLayout: React.FC<PropsType> = (props) => {
  const {
    t,
    isDisabled,
    submitError,
    loading,
    onSubmit,
    onUpdate,
    onChangePassword,
    openModal,
    closeModal,
    form,
    className,
  } = props

  const { screenType } = useContext(ScreenContext)

  const isDesktop = useMemo(() => screenType === Screens.DESKTOP, [screenType])

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        {...(!isDesktop && {
          rightFooterButton: {
            children: t("Continue"),
            onClick: form.submit,
            loading: loading,
            disabled: isDisabled,
            icon: FooterIcon,
          },
        })}
        subHeaderIcons={[
          {
            icon: <InfoIcon />,
            onClick: openModal,
          },
        ]}
        title={t("Create a password")}
      >
        <div
          className={CN("body-container", {
            "desktop-container": isDesktop,
          })}
        >
          {!isDesktop && (
            <>
              <div className="page-icon">
                <PageIcon
                  color="var(--page-icon-color)"
                  iconProps={{
                    weight: "fill",
                    phosphorIcon: ShieldPlus,
                  }}
                />
              </div>
              <div className="title">{t("Create a password")}</div>
            </>
          )}

          <div className="form-container">
            <Form
              form={form}
              initialValues={{
                [FormFieldName.PASSWORD]: "",
                [FormFieldName.CONFIRM_PASSWORD]: "",
              }}
              name={formName}
              onFieldsChange={onUpdate}
              onFinish={onSubmit}
            >
              <Form.Item
                name={FormFieldName.PASSWORD}
                rules={passwordRules}
                statusHelpAsTooltip={true}
              >
                <Input
                  onChange={onChangePassword}
                  placeholder={t("Enter password")}
                  type="password"
                />
              </Form.Item>
              <Form.Item
                name={FormFieldName.CONFIRM_PASSWORD}
                rules={confirmPasswordRules}
                statusHelpAsTooltip={true}
              >
                <Input placeholder={t("Confirm password")} type="password" />
              </Form.Item>
              <Form.Item>
                <AlertBox
                  description={t("Recommended security practice")}
                  title={t("Always choose a strong password!")}
                  type="warning"
                />
              </Form.Item>
              {submitError && (
                <Form.Item help={submitError} validateStatus="error" />
              )}
              {isDesktop && (
                <Button
                  onClick={form.submit}
                  loading={loading}
                  disabled={isDisabled}
                  icon={FooterIcon}
                >
                  {t("Import Account")}
                </Button>
              )}
            </Form>
          </div>

          <div className="instruction-container">
            {isDesktop ? (
              <InstructionContainer type="warning" />
            ) : (
              <SwModal
                closeIcon={<Icon phosphorIcon={CaretLeft} size="sm" />}
                id={modalId}
                onCancel={closeModal}
                rightIconProps={{
                  icon: <InfoIcon />,
                }}
                title={t("Instructions")}
                wrapClassName={className}
              >
                <InstructionContainer />
              </SwModal>
            )}
          </div>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  )
}

const Component: React.FC<PropsType> = (props) => (
  <ComponentLayout {...useCreatePassword()} {...props} />
)

export default Component
