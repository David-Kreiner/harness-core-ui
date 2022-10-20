/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { pick } from 'lodash-es'
import { useParams } from 'react-router-dom'
import {
  Button,
  Layout,
  Text,
  StepProps,
  Container,
  ModalErrorHandler,
  ModalErrorHandlerBinding
} from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useCreateConnector, useUpdateConnector, Failure } from 'services/cd-ng'
import { useAzureappclientid } from 'services/ce/index'
import CopyToClipboard from '@common/components/CopyToClipBoard/CopyToClipBoard'
import { CE_AZURE_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useGovernanceMetaDataModal } from '@governance/hooks/useGovernanceMetaDataModal'
import { connectorGovernanceModalProps } from '@connectors/utils/utils'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import type { CEAzureDTO } from '../Overview/AzureConnectorOverview'
import css from '../../CreateCeAzureConnector_new.module.scss'

type ConnectorPayload = Omit<CEAzureDTO, 'existingBillingExports' | 'hasBilling' | 'isEditMode'>
interface CommandsProps {
  command: string
  comment: string
}

const CreateServicePrincipal: React.FC<StepProps<CEAzureDTO>> = (props): JSX.Element => {
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const [appId, setAppId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  const { prevStepData, previousStep, nextStep } = props
  const { accountId } = useParams<{ accountId: string }>()

  const { mutate: createConnector } = useCreateConnector({ queryParams: { accountIdentifier: accountId } })
  const { mutate: updateConnector } = useUpdateConnector({ queryParams: { accountIdentifier: accountId } })

  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal(connectorGovernanceModalProps())
  useStepLoadTelemetry(CE_AZURE_CONNECTOR_CREATION_EVENTS.LOAD_SERVICE_PRINCIPAL)

  const saveAndContinue = async () => {
    trackEvent(ConnectorActions.CreateServicePrincipalSubmit, {
      category: Category.CONNECTOR
    })
    setIsSaving(true)
    try {
      if (prevStepData) {
        const payload: ConnectorPayload = {
          ...pick(prevStepData, [
            'name',
            'description',
            'identifier',
            'orgIdentifier',
            'projectIdentifier',
            'tags',
            'type',
            'spec'
          ])
        }

        const response = await (prevStepData.isEditMode
          ? updateConnector({ connector: payload })
          : createConnector({ connector: payload }))
        if ('SUCCESS' !== response.status) {
          throw response as Failure
        }
        if (response.data?.governanceMetadata) {
          conditionallyOpenGovernanceErrorModal(response.data?.governanceMetadata, () => {
            nextStep?.(prevStepData)
          })
        } else {
          nextStep?.(prevStepData)
        }
      }
    } catch (e) {
      modalErrorHandler?.showDanger(getRBACErrorMessage(e))
      setIsSaving(false)
    }
  }

  const { data, loading } = useAzureappclientid({})
  useEffect(() => {
    'SUCCESS' === data?.status && setAppId(data?.data || '')
  }, [loading])

  const commands = []
  const featuresEnabled = prevStepData?.spec?.featuresEnabled || []
  const subscriptionId = prevStepData?.spec?.subscriptionId || '<insert_subscriptionId>'
  const storageAccountName =
    prevStepData?.spec?.billingExportSpec?.storageAccountName || '<insert_storage_account_name>'
  const ENABLED = {
    BILLING: featuresEnabled.includes('BILLING'),
    VISIBILITY: featuresEnabled.includes('VISIBILITY'),
    OPTIMIZATION: featuresEnabled.includes('OPTIMIZATION')
  }

  const { trackEvent } = useTelemetry()
  useTrackEvent(ConnectorActions.CreateServicePrincipalLoad, {
    category: Category.CONNECTOR
  })

  // Keeping these commands as comment for reference purpose
  //
  // # 1. Register the Harness app
  // az ad sp create --id <id_of_the_service_principal_from_BE_api>
  //
  // # 2. Role assignment for enabling CCM Billing + Visibility
  // SCOPE=`az storage account show --name <storage account name from previous screen> --query "id" | xargs`
  // az role assignment create --assignee <id_of_the_service_principal_from_api> --role 'Storage Blob Data Reader' --scope $SCOPE
  //
  // # 3. Role assignment for enabling CCM Optimisation
  // az role assignment create --assignee <id_of_the_service_principal_from_api> --role 'Contributor' --scope /subscriptions/<subscription id from screen 1>

  // If only BILLING is selected, we need to show 1 and 2.
  if (ENABLED.BILLING) {
    commands.push(
      <Commands
        comment={getString('connectors.ceAzure.servicePrincipal.registerCommand')}
        command={`az ad sp create --id ${appId}`}
      />,
      <Commands
        comment={getString('connectors.ceAzure.servicePrincipal.costVisibilityCmd')}
        command={`SCOPE=\`az storage account show --name ${storageAccountName} --query "id" | xargs\``}
      />,
      <Commands
        comment={getString('connectors.ceAzure.servicePrincipal.assignRoleCmd')}
        command={`az role assignment create --assignee ${appId}  --role 'Storage Blob Data Reader' --scope $SCOPE`}
      />
    )
  } else {
    commands.push(
      <Commands
        comment={getString('connectors.ceAzure.servicePrincipal.registerCommand')}
        command={`az ad sp create --id ${appId}`}
      />
    )
  }

  if (ENABLED.VISIBILITY) {
    commands.push(
      <Commands
        comment={getString('connectors.ceAzure.servicePrincipal.inventoryMgtCmd')}
        command={`az role assignment create --assignee ${appId} --role 'Reader' --scope /subscriptions/${subscriptionId}`}
      />
    )
  }

  // If BILLING and OPTIMIZATION are selected, we need to show 1, 2, and 3.
  // 1 & 2 are added from above
  if (ENABLED.OPTIMIZATION) {
    commands.push(
      <Commands
        comment={getString('connectors.ceAzure.servicePrincipal.optimisationCmd')}
        command={`az role assignment create --assignee ${appId} --role 'Contributor' --scope /subscriptions/${subscriptionId}`}
      />
    )
  }

  // If only OPTIMIZATION is selected (BILLING was pre existing),
  // we need to show only this command, which is number 3. (As our app is already registered)
  // It doesn't matter if the VISIBILITY is also selected with OPTIMIZATION

  return (
    <Layout.Vertical spacing="large" className={css.stepContainer}>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <Text font={{ variation: FontVariation.H3 }} tooltipProps={{ dataTooltipId: 'servicePrincipal' }}>
        {getString('connectors.ceAzure.servicePrincipal.heading')}
      </Text>
      <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_800}>
        {getString('connectors.ceAzure.servicePrincipal.subHeading1')}
      </Text>
      <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_800}>
        {getString('connectors.ceAzure.servicePrincipal.subHeading2')}
      </Text>
      <Container className={css.commandsContainer}>{commands}</Container>
      <Layout.Horizontal spacing="medium" className={css.continueAndPreviousBtns}>
        <Button text="Previous" icon="chevron-left" onClick={() => previousStep?.(prevStepData)} />
        <Button
          type="submit"
          intent="primary"
          rightIcon="chevron-right"
          loading={isSaving}
          disabled={isSaving}
          onClick={() => saveAndContinue()}
        >
          {getString('continue')}
        </Button>
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

const Commands = ({ command, comment }: CommandsProps) => {
  return (
    <Container style={{ marginBottom: 20 }}>
      <Text>{comment}</Text>
      <Container className={css.command}>
        <pre>{command}</pre>
        <CopyToClipboard showFeedback content={command} iconSize={16} />
      </Container>
    </Container>
  )
}

export default CreateServicePrincipal
