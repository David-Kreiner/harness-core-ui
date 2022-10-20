/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FormInput, Layout, Text } from '@wings-software/uicore'
import type { IOptionProps } from '@blueprintjs/core'
import type { FormikProps } from 'formik'
import { useStrings } from 'framework/strings'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import type { WinRmConfigFormData } from '@secrets/modals/CreateWinRmCredModal/views/StepAuthentication'

interface WinRmAuthFormFieldsProps {
  formik: FormikProps<WinRmConfigFormData>
  secretName?: string
  editing?: boolean
}

const WinRmAuthFormFields: React.FC<WinRmAuthFormFieldsProps> = props => {
  const { getString } = useStrings()
  const { formik } = props

  const authSchemeOptions: IOptionProps[] = [
    {
      label: getString('secrets.winRmAuthFormFields.ntlm'),
      value: 'NTLM'
    },
    {
      label: getString('kerberos'),
      value: 'Kerberos'
    }
  ]

  const tgtGenerationMethodOptions: IOptionProps[] = [
    {
      label: getString('secrets.sshAuthFormFields.labelKeyTab'),
      value: 'KeyTabFilePath'
    },
    {
      label: getString('password'),
      value: 'Password'
    },
    {
      label: getString('secrets.sshAuthFormFields.optionKerbNone'),
      value: 'None'
    }
  ]

  return (
    <>
      <FormInput.RadioGroup
        name="authScheme"
        label={getString('secrets.sshAuthFormFields.labelType')}
        items={authSchemeOptions}
        radioGroup={{ inline: true }}
      />
      {formik.values.authScheme === 'NTLM' ? (
        <>
          <Layout.Horizontal margin={{ bottom: 'medium' }} flex>
            <Text icon="lock" style={{ flex: 1 }}>
              {getString('authentication')}
            </Text>
          </Layout.Horizontal>
          <FormInput.Text name="domain" label={getString('secrets.winRmAuthFormFields.domain')} />
          <FormInput.Text name="username" label={getString('username')} />
          <SecretInput name={'password'} label={getString('password')} />
          <Layout.Horizontal margin={{ bottom: 'medium' }} flex>
            <FormInput.CheckBox
              name="useSSL"
              label={getString('common.useSSL')}
              onChange={event => {
                event.currentTarget.checked ? formik.setFieldValue('port', 5986) : formik.setFieldValue('port', 5985)
              }}
            />
            <FormInput.CheckBox name="skipCertChecks" label={getString('secrets.winRmAuthFormFields.skipCertCheck')} />
            <FormInput.CheckBox name="useNoProfile" label={getString('secrets.winRmAuthFormFields.useNoProfile')} />
          </Layout.Horizontal>
          <FormInput.Text name="port" label={getString('secrets.winRmAuthFormFields.labelWinRmPort')} />
        </>
      ) : null}
      {formik.values.authScheme === 'Kerberos' ? (
        <>
          <FormInput.Text name="principal" label={getString('secrets.sshAuthFormFields.labelPrincipal')} />
          <FormInput.Text name="realm" label={getString('secrets.sshAuthFormFields.labelRealm')} />
          <Layout.Horizontal margin={{ bottom: 'medium' }} flex>
            <FormInput.CheckBox
              name="useSSL"
              label={getString('common.useSSL')}
              onChange={event => {
                event.currentTarget.checked ? formik.setFieldValue('port', 5986) : formik.setFieldValue('port', 5985)
              }}
            />
            <FormInput.CheckBox name="skipCertChecks" label={getString('secrets.winRmAuthFormFields.skipCertCheck')} />
            <FormInput.CheckBox name="useNoProfile" label={getString('secrets.winRmAuthFormFields.useNoProfile')} />
          </Layout.Horizontal>
          <FormInput.Text name="port" label={getString('secrets.winRmAuthFormFields.labelWinRmPort')} />
          <FormInput.RadioGroup
            name="tgtGenerationMethod"
            label={getString('secrets.sshAuthFormFields.labelTGT')}
            items={tgtGenerationMethodOptions}
            radioGroup={{ inline: true }}
          />
          {formik.values.tgtGenerationMethod === 'KeyTabFilePath' ? (
            <FormInput.Text name="keyPath" label={getString('secrets.sshAuthFormFields.labelKeyTab')} />
          ) : null}
          {formik.values.tgtGenerationMethod === 'Password' ? (
            <SecretInput name={'password'} label={getString('password')} />
          ) : null}
        </>
      ) : null}
    </>
  )
}

export default WinRmAuthFormFields
