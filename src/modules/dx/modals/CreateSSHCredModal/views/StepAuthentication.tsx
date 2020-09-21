import React, { useState } from 'react'
import {
  StepProps,
  Container,
  Formik,
  FormikForm,
  Button,
  Text,
  Color,
  ModalErrorHandler,
  ModalErrorHandlerBinding
} from '@wings-software/uikit'
import { useParams } from 'react-router-dom'
import * as Yup from 'yup'

import { usePostSecret } from 'services/cd-ng'
import type { SecretDTOV2, KerberosConfigDTO, SSHConfigDTO, SSHKeySpecDTO } from 'services/cd-ng'
import type { SecretInfo } from 'modules/dx/components/SecretInput/SecretTextInput'
import CreateSecretOverlay from 'modules/dx/common/CreateSecretOverlay/CreateSecretOverlay'
import type { InlineSecret } from 'modules/common/components/CreateInlineSecret/CreateInlineSecret'
import type { SecretRef } from 'modules/dx/components/SecretReference/SecretReference'
import SSHAuthFormFields from 'modules/dx/components/secrets/SSHAuthFormFields/SSHAuthFormFields'
import { buildAuthConfig } from 'modules/dx/components/secrets/SSHAuthUtils'
import type { SSHCredSharedObj } from '../useCreateSSHCredModal'

import i18n from '../CreateSSHCredModal.i18n'

export interface SSHConfigFormData {
  authScheme: SSHKeySpecDTO['authScheme']
  credentialType: SSHConfigDTO['credentialType']
  tgtGenerationMethod: KerberosConfigDTO['tgtGenerationMethod']
  userName: string
  port: number
  key?: SecretRef
  principal: string
  realm: string
  keyPath: string
  encryptedPassphraseText?: SecretInfo
  encryptedPassphraseSecret?: InlineSecret
  passwordText?: SecretInfo
  passwordSecret?: InlineSecret
}

interface StepAuthenticationProps {
  onSuccess?: () => void
}

const validationSchema = Yup.object().shape({
  port: Yup.number().required(i18n.validatePort),
  userName: Yup.string().when('authScheme', {
    is: 'SSH',
    then: Yup.string().trim().required(i18n.validateUsername)
  }),
  keyPath: Yup.string().when(['authScheme', 'credentialType', 'tgtGenerationMethod'], {
    is: (authScheme, credentialType, tgtGenerationMethod) =>
      (authScheme === 'SSH' && credentialType == 'KeyPath') ||
      (authScheme === 'Kerberos' && tgtGenerationMethod == 'KeyTabFilePath'),
    then: Yup.string().trim().required(i18n.validateKeypath)
  }),
  key: Yup.object().when(['authScheme', 'credentialType'], {
    is: (authScheme, credentialType) => authScheme === 'SSH' && credentialType == 'KeyReference',
    then: Yup.object().required(i18n.validateSshKey)
  }),
  principal: Yup.string().when('authScheme', {
    is: 'Kerberos',
    then: Yup.string().trim().required(i18n.validatePrincipal)
  }),
  realm: Yup.string().when('authScheme', {
    is: 'Kerberos',
    then: Yup.string().trim().required(i18n.validateRealm)
  })
})

const StepAuthentication: React.FC<StepProps<SSHCredSharedObj> & StepAuthenticationProps> = ({
  prevStepData,
  nextStep,
  onSuccess
}) => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams()
  const [showCreateSecretTextModal, setShowCreateSecretTextModal] = useState(false)
  const [showCreateSecretFileModal, setShowCreateSecretFileModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const { mutate: createSecret } = usePostSecret({ queryParams: { accountIdentifier: accountId } })
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()

  const handleSubmit = async (formData: SSHConfigFormData): Promise<void> => {
    setSaving(true)
    try {
      // this will create secrets if needed
      const authConfig = await buildAuthConfig(formData, { accountId, orgIdentifier, projectIdentifier })

      // build final data to submit
      const dataToSubmit: SecretDTOV2 = {
        type: 'SSHKey',
        name: prevStepData?.detailsData?.name as string,
        identifier: prevStepData?.detailsData?.identifier as string,
        description: prevStepData?.detailsData?.description,
        tags: {},
        projectIdentifier,
        orgIdentifier,
        spec: {
          authScheme: formData.authScheme,
          port: formData.port,
          spec: authConfig
        } as SSHKeySpecDTO
      }

      // finally create the connector
      await createSecret(dataToSubmit)
      setSaving(false)
      onSuccess?.()
      nextStep?.({ ...prevStepData, authData: formData })
    } catch (err) {
      setSaving(false)
      modalErrorHandler?.show(err.data)
    }
  }

  return (
    <>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <Container padding="small" width={350} style={{ minHeight: '500px' }}>
        <Text margin={{ bottom: 'xlarge' }} font={{ size: 'medium' }} color={Color.BLACK}>
          {i18n.titleAuth}
        </Text>
        <Formik<SSHConfigFormData>
          onSubmit={formData => {
            modalErrorHandler?.hide()
            handleSubmit(formData)
          }}
          validationSchema={validationSchema}
          initialValues={{
            authScheme: 'SSH',
            credentialType: 'KeyReference',
            tgtGenerationMethod: 'None',
            userName: '',
            principal: '',
            realm: '',
            keyPath: '',
            port: 22,
            ...prevStepData?.authData
          }}
        >
          {formik => {
            return (
              <FormikForm>
                <SSHAuthFormFields formik={formik} secretName={prevStepData?.detailsData?.name} />
                <Button type="submit" text={saving ? i18n.btnSaving : i18n.btnSave} disabled={saving} />
              </FormikForm>
            )
          }}
        </Formik>
        {showCreateSecretTextModal ? (
          <CreateSecretOverlay setShowCreateSecretModal={setShowCreateSecretTextModal} type="SecretText" />
        ) : null}
        {showCreateSecretFileModal ? (
          <CreateSecretOverlay setShowCreateSecretModal={setShowCreateSecretFileModal} type="SecretFile" />
        ) : null}
      </Container>
    </>
  )
}

export default StepAuthentication
