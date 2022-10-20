/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Container,
  Button,
  Layout,
  ButtonVariation,
  PageHeader,
  useConfirmationDialog,
  useToaster
} from '@wings-software/uicore'
import { parse } from 'yaml'
import { useHistory, useParams } from 'react-router-dom'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { useStrings } from 'framework/strings'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import { usePostSecretViaYaml, useGetYamlSchema, ResponseJsonNode } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import type { UseGetMockData } from '@common/utils/testUtils'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useGovernanceMetaDataModal } from '@governance/hooks/useGovernanceMetaDataModal'

export const AUTHORIZATION_ERROR_CODE = 403

const CreateSecretFromYamlPage: React.FC<{ mockSchemaData?: UseGetMockData<ResponseJsonNode> }> = props => {
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()
  const { getRBACErrorMessage } = useRBACError()
  const { getString } = useStrings()
  useDocumentTitle(getString('createSecretYAML.createSecret'))
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const history = useHistory()
  const { showSuccess, showError } = useToaster()
  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal({
    considerWarningAsError: false,
    errorHeaderMsg: 'secrets.policyEvaluations.failedToSave',
    warningHeaderMsg: 'secrets.policyEvaluations.warning'
  })
  const { mutate: createSecret } = usePostSecretViaYaml({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier },
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })
  const redirectToSecretsPage = (): void => {
    history.push(routes.toSecrets({ accountId, projectIdentifier, orgIdentifier, module }))
  }
  const { openDialog: openConfirmationDialog } = useConfirmationDialog({
    cancelButtonText: getString('cancel'),
    contentText: getString('continueWithoutSavingText'),
    titleText: getString('continueWithoutSavingTitle'),
    confirmButtonText: getString('confirm'),
    onCloseDialog: isConfirmed => {
      if (isConfirmed) {
        redirectToSecretsPage()
      }
    }
  })

  const handleCancel = (): void => {
    if (yamlHandler?.getLatestYaml()) {
      openConfirmationDialog()
    } else {
      redirectToSecretsPage()
    }
  }
  const handleCreate = async (): Promise<void> => {
    const yamlData = yamlHandler?.getLatestYaml()
    let jsonData: any
    try {
      jsonData = parse(yamlData || '')?.secret
    } catch (err) {
      showError(err.message)
    }

    if (yamlData && jsonData) {
      try {
        const response = await createSecret(yamlData as any)
        conditionallyOpenGovernanceErrorModal(response.data?.governanceMetadata, () => {
          showSuccess(getString('createSecretYAML.secretCreated'))
          history.push(
            routes.toSecretDetails({
              secretId: jsonData['identifier'],
              accountId,
              orgIdentifier,
              projectIdentifier,
              module
            })
          )
        })
      } catch (err) {
        if (err.status === AUTHORIZATION_ERROR_CODE) {
          showError(getRBACErrorMessage(err))
        } else {
          showError(err.data.details)
        }
      }
    } else {
      showError(getString('createSecretYAML.invalidSecret'))
    }
  }

  const { data: secretSchema } = useGetYamlSchema({
    queryParams: {
      entityType: 'Secrets',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId
    },
    mock: props.mockSchemaData
  })

  return (
    <Container>
      <PageHeader breadcrumbs={<NGBreadcrumbs />} title={getString('createSecretYAML.newSecret')} />
      <Container padding="xlarge">
        <YAMLBuilder
          fileName={getString('createSecretYAML.newSecret')}
          entityType={'Secrets'}
          bind={setYamlHandler}
          height="calc(100vh - 250px)"
          schema={secretSchema?.data}
          showSnippetSection={false}
        />
        <Layout.Horizontal spacing="large">
          <Button
            text={getString('createSecretYAML.create')}
            intent="primary"
            margin={{ top: 'xlarge' }}
            onClick={handleCreate}
            variation={ButtonVariation.PRIMARY}
          />
          <Button
            text={getString('cancel')}
            intent="none"
            margin={{ top: 'xlarge' }}
            onClick={handleCancel}
            variation={ButtonVariation.TERTIARY}
          />
        </Layout.Horizontal>
      </Container>
    </Container>
  )
}

export default CreateSecretFromYamlPage
