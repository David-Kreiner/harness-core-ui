/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useState } from 'react'
import type { FormikProps } from 'formik'
import { shouldShowError, StepWizard, useToaster } from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { useParams } from 'react-router-dom'
import { Dialog, IDialogProps, Classes } from '@blueprintjs/core'
import type { IconProps } from '@harness/icons'
import { merge } from 'lodash-es'
import { PageConnectorResponse, ConnectorInfoDTO, PrimaryArtifact, useGetConnectorListV2 } from 'services/cd-ng'
import { CONNECTOR_CREDENTIALS_STEP_IDENTIFIER } from '@connectors/constants'
import type { GitQueryParams, PipelineType } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import ConnectorDetailsStep from '@connectors/components/CreateConnector/commonSteps/ConnectorDetailsStep'
import StepDockerAuthentication from '@connectors/components/CreateConnector/DockerConnector/StepAuth/StepDockerAuthentication'
import GcrAuthentication from '@connectors/components/CreateConnector/GcrConnector/StepAuth/GcrAuthentication'
import StepAWSAuthentication from '@connectors/components/CreateConnector/AWSConnector/StepAuth/StepAWSAuthentication'
import {
  buildArtifactoryPayload,
  buildAWSPayload,
  buildAzurePayload,
  buildDockerPayload,
  buildGcpPayload,
  buildNexusPayload
} from '@connectors/pages/connectors/utils/ConnectorUtils'
import DelegateSelectorStep from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelectorStep'
import { useQueryParams } from '@common/hooks'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { ArtifactActions } from '@common/constants/TrackingConstants'
import StepNexusAuthentication from '@connectors/components/CreateConnector/NexusConnector/StepAuth/StepNexusAuthentication'
import StepArtifactoryAuthentication from '@connectors/components/CreateConnector/ArtifactoryConnector/StepAuth/StepArtifactoryAuthentication'
import AzureAuthentication from '@connectors/components/CreateConnector/AzureConnector/StepAuth/AzureAuthentication'
import type { RBACError } from '@rbac/utils/useRBACError/useRBACError'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { getIdentifierFromValue } from '@common/components/EntityReference/EntityReference'
import {
  ArtifactIconByType,
  ArtifactTitleIdByType,
  ArtifactToConnectorMap,
  ENABLED_ARTIFACT_TYPES
} from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { getTriggerArtifactInitialSpec } from '@triggers/components/Triggers/ArtifactTrigger/TriggersWizardPageUtils'
import ConnectorTestConnection from '@connectors/common/ConnectorTestConnection/ConnectorTestConnection'
import GcpAuthentication from '@connectors/components/CreateConnector/GcpConnector/StepAuth/GcpAuthentication'
import type { ArtifactTriggerConfig, NGTriggerSourceV2 } from 'services/pipeline-ng'
import ArtifactWizard from './ArtifactWizard/ArtifactWizard'
import { GCRImagePath } from './ArtifactRepository/ArtifactLastSteps/GCRImagePath/GCRImagePath'
import { ECRArtifact } from './ArtifactRepository/ArtifactLastSteps/ECRArtifact/ECRArtifact'
import NexusArtifact from './ArtifactRepository/ArtifactLastSteps/NexusArtifact/NexusArtifact'
import Artifactory from './ArtifactRepository/ArtifactLastSteps/Artifactory/Artifactory'
import { AmazonS3 } from './ArtifactRepository/ArtifactLastSteps/AmazonS3Artifact/AmazonS3'
import { ACRArtifact } from './ArtifactRepository/ArtifactLastSteps/ACRArtifact/ACRArtifact'
import { DockerRegistryArtifact } from './ArtifactRepository/ArtifactLastSteps/DockerRegistryArtifact/DockerRegistryArtifact'
import ArtifactListView from './ArtifactListView/ArtifactListView'
import type {
  ArtifactTriggerSpec,
  ArtifactType,
  ConnectorRefLabelType,
  ImagePathProps,
  InitialArtifactDataType
} from './ArtifactInterface'
import css from '@pipeline/components/ArtifactsSelection/ArtifactsSelection.module.scss'

interface ArtifactsSelectionProps {
  formikProps: FormikProps<any>
}

export default function ArtifactsSelection({ formikProps }: ArtifactsSelectionProps): React.ReactElement | null {
  const { spec: triggerSpec } = (formikProps.values?.source ?? {}) as Omit<Required<NGTriggerSourceV2>, 'pollInterval'>
  const { type: artifactType, spec } = triggerSpec
  const artifactSpec = spec as ArtifactTriggerSpec
  const selectedArtifactType = artifactType as ArtifactTriggerConfig['type']
  const [isEditMode, setIsEditMode] = useState(false)
  const [connectorView, setConnectorView] = useState(false)
  const [fetchedConnectorResponse, setFetchedConnectorResponse] = useState<PageConnectorResponse | undefined>()
  const [primaryArtifact, setPrimaryArtifact] = useState<PrimaryArtifact>(triggerSpec as PrimaryArtifact)

  const { getString } = useStrings()
  const { trackEvent } = useTelemetry()
  const { expressions } = useVariablesExpression()

  const stepWizardTitle = getString('connectors.createNewConnector')

  const { accountId, orgIdentifier, projectIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      accountId: string
    }>
  >()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  const DIALOG_PROPS: IDialogProps = {
    isOpen: true,
    usePortal: true,
    autoFocus: true,
    canEscapeKeyClose: false,
    canOutsideClickClose: false,
    enforceFocus: false,
    title: '',
    style: { width: 1100, height: 550, borderLeft: 'none', paddingBottom: 0, position: 'relative' }
  }

  const defaultQueryParams = {
    pageIndex: 0,
    pageSize: 10,
    searchTerm: '',
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    includeAllConnectorsAvailableAtScope: true
  }
  const { mutate: fetchConnectors } = useGetConnectorListV2({
    queryParams: defaultQueryParams
  })

  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  const refetchConnectorList = async (): Promise<void> => {
    try {
      const response = await fetchConnectors({
        filterType: 'Connector',
        connectorIdentifiers: [getIdentifierFromValue(artifactSpec.connectorRef as string)]
      })
      /* istanbul ignore else */
      if (response.data) {
        const { data: connectorResponse } = response
        setFetchedConnectorResponse(connectorResponse)
      }
    } catch (e) {
      /* istanbul ignore else */
      if (shouldShowError(e)) {
        showError(getRBACErrorMessage(e as RBACError))
      }
    }
  }

  useEffect(() => {
    refetchConnectorList()
  }, [artifactSpec.connectorRef])

  const [showConnectorModal, hideConnectorModal] = useModalHook(
    () => (
      <Dialog
        onClose={() => {
          hideConnectorModal()
          setConnectorView(false)
          setIsEditMode(false)
        }}
        {...DIALOG_PROPS}
        className={cx(css.modal, Classes.DIALOG)}
      >
        <ArtifactWizard
          artifactInitialValue={getArtifactInitialValues()}
          iconsProps={getIconProps()}
          lastSteps={getLastSteps()}
          labels={getLabels()}
          selectedArtifact={selectedArtifactType}
          newConnectorView={connectorView}
          newConnectorSteps={getNewConnectorSteps()}
          handleViewChange={handleConnectorViewChange}
        />
      </Dialog>
    ),
    [selectedArtifactType, connectorView, formikProps]
  )

  const setTelemetryEvent = useCallback((): void => {
    trackEvent(ArtifactActions.SavePrimaryArtifactOnPipelinePage, {})
  }, [trackEvent])

  const addArtifact = useCallback(
    async (artifactObj: ArtifactTriggerSpec): Promise<void> => {
      const { type, spec: _triggerSpec } = formikProps.values.source ?? {}
      const { type: _artifactType } = _triggerSpec ?? {}

      await formikProps.setValues(
        merge(formikProps.values, {
          source: {
            type,
            spec: {
              type: _artifactType,
              spec: artifactObj
            }
          }
        })
      )

      setPrimaryArtifact(formikProps.values?.source?.spec)

      setTelemetryEvent()
      hideConnectorModal()
    },
    [hideConnectorModal, selectedArtifactType, setTelemetryEvent]
  )

  const getArtifactInitialValues = useCallback((): InitialArtifactDataType => {
    return {
      submittedArtifact: selectedArtifactType,
      connectorId: artifactSpec?.connectorRef
    }
  }, [selectedArtifactType, artifactSpec])

  const addNewArtifact = (): void => {
    setConnectorView(false)
    showConnectorModal()
  }

  const editArtifact = (): void => {
    setConnectorView(false)
    showConnectorModal()
  }

  const deleteArtifact = async (): Promise<void> => {
    const initialSpec = getTriggerArtifactInitialSpec(selectedArtifactType)
    const { source: artifactSource } = formikProps.values
    const { spec: _artifactSpec } = artifactSource ?? {}

    merge(_artifactSpec?.spec, initialSpec)

    await formikProps.setValues(merge(formikProps.values, artifactSource))
    setPrimaryArtifact({} as PrimaryArtifact)
  }

  const getIconProps = useCallback((): IconProps => {
    const _artifactType = selectedArtifactType as ArtifactType
    const iconProps: IconProps = {
      name: ArtifactIconByType[_artifactType]
    }
    if (
      selectedArtifactType === ENABLED_ARTIFACT_TYPES.DockerRegistry ||
      selectedArtifactType === ENABLED_ARTIFACT_TYPES.Acr
    ) {
      iconProps.color = Color.WHITE
    }
    return iconProps
  }, [selectedArtifactType])

  const getLastStepName = (): { key: string; name: string } => {
    return {
      key: getString('connectors.stepFourName'),
      name: getString('connectors.stepFourName')
    }
  }

  const artifactLastStepProps = useCallback((): ImagePathProps<ArtifactTriggerSpec> => {
    return {
      ...getLastStepName(),
      initialValues: artifactSpec,
      handleSubmit: (data: ArtifactTriggerSpec) => {
        addArtifact(data)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addArtifact, expressions, selectedArtifactType, getString])

  const getLabels = useCallback((): ConnectorRefLabelType => {
    return {
      firstStepName: getString('connectors.specifyArtifactRepoType'),
      secondStepName: `${selectedArtifactType && getString(ArtifactTitleIdByType[selectedArtifactType])} ${getString(
        'repository'
      )}`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArtifactType])

  const connectorDetailStepProps = {
    name: getString('overview'),
    isEditMode,
    gitDetails: { repoIdentifier, branch, getDefaultFromOtherRepo: true }
  }
  const authenticationStepProps = {
    identifier: CONNECTOR_CREDENTIALS_STEP_IDENTIFIER,
    isEditMode,
    setIsEditMode,
    accountId,
    orgIdentifier,
    projectIdentifier,
    connectorInfo: undefined
  }
  const delegateStepProps = {
    name: getString('delegate.DelegateselectionLabel'),
    isEditMode,
    setIsEditMode,
    connectorInfo: undefined
  }
  const ConnectorTestConnectionProps = {
    name: getString('connectors.stepThreeName'),
    connectorInfo: undefined,
    isStep: true,
    isLastStep: false
  }

  const getNewConnectorSteps = useCallback((): JSX.Element => {
    switch (selectedArtifactType) {
      case ENABLED_ARTIFACT_TYPES.DockerRegistry:
        return (
          <StepWizard title={stepWizardTitle}>
            <ConnectorDetailsStep type={ArtifactToConnectorMap[selectedArtifactType]} {...connectorDetailStepProps} />
            <StepDockerAuthentication name={getString('details')} {...authenticationStepProps} />
            <DelegateSelectorStep buildPayload={buildDockerPayload} {...delegateStepProps} />
            <ConnectorTestConnection
              type={ArtifactToConnectorMap[selectedArtifactType]}
              {...ConnectorTestConnectionProps}
            />
          </StepWizard>
        )
      case ENABLED_ARTIFACT_TYPES.Gcr:
        return (
          <StepWizard title={stepWizardTitle}>
            <ConnectorDetailsStep type={'Gcr' as unknown as ConnectorInfoDTO['type']} {...connectorDetailStepProps} />
            <GcrAuthentication name={getString('details')} {...authenticationStepProps} />
            <DelegateSelectorStep {...delegateStepProps} buildPayload={buildGcpPayload} />
            <ConnectorTestConnection {...ConnectorTestConnectionProps} type={'Gcr'} />
          </StepWizard>
        )
      case ENABLED_ARTIFACT_TYPES.Ecr:
      case ENABLED_ARTIFACT_TYPES.AmazonS3:
        return (
          <StepWizard iconProps={{ size: 37 }} title={stepWizardTitle}>
            <ConnectorDetailsStep type={ArtifactToConnectorMap[selectedArtifactType]} {...connectorDetailStepProps} />
            <StepAWSAuthentication name={getString('credentials')} {...authenticationStepProps} />
            <DelegateSelectorStep {...delegateStepProps} buildPayload={buildAWSPayload} />
            <ConnectorTestConnection
              {...ConnectorTestConnectionProps}
              type={ArtifactToConnectorMap[selectedArtifactType]}
            />
          </StepWizard>
        )
      case ENABLED_ARTIFACT_TYPES.Nexus3Registry:
        return (
          <StepWizard title={stepWizardTitle}>
            <ConnectorDetailsStep type={ArtifactToConnectorMap[selectedArtifactType]} {...connectorDetailStepProps} />
            <StepNexusAuthentication name={getString('details')} {...authenticationStepProps} />
            <DelegateSelectorStep {...delegateStepProps} buildPayload={buildNexusPayload} />
            <ConnectorTestConnection
              {...ConnectorTestConnectionProps}
              type={ArtifactToConnectorMap[selectedArtifactType]}
            />
          </StepWizard>
        )
      case ENABLED_ARTIFACT_TYPES.ArtifactoryRegistry:
        return (
          <StepWizard title={stepWizardTitle}>
            <ConnectorDetailsStep type={ArtifactToConnectorMap[selectedArtifactType]} {...connectorDetailStepProps} />
            <StepArtifactoryAuthentication name={getString('details')} {...authenticationStepProps} />
            <DelegateSelectorStep {...delegateStepProps} buildPayload={buildArtifactoryPayload} />
            <ConnectorTestConnection
              {...ConnectorTestConnectionProps}
              type={ArtifactToConnectorMap[selectedArtifactType]}
            />
          </StepWizard>
        )
      case ENABLED_ARTIFACT_TYPES.Acr:
        return (
          <StepWizard title={stepWizardTitle}>
            <ConnectorDetailsStep type={ArtifactToConnectorMap[selectedArtifactType]} {...connectorDetailStepProps} />
            <AzureAuthentication name={getString('details')} {...authenticationStepProps} />
            <DelegateSelectorStep buildPayload={buildAzurePayload} {...delegateStepProps} />
            <ConnectorTestConnection
              type={ArtifactToConnectorMap[selectedArtifactType]}
              {...ConnectorTestConnectionProps}
            />
          </StepWizard>
        )
      case ENABLED_ARTIFACT_TYPES.GoogleArtifactRegistry:
        return (
          <StepWizard title={stepWizardTitle}>
            <ConnectorDetailsStep type={ArtifactToConnectorMap[selectedArtifactType]} {...connectorDetailStepProps} />
            <GcpAuthentication name={getString('details')} {...authenticationStepProps} />
            <DelegateSelectorStep buildPayload={buildGcpPayload} {...delegateStepProps} />
            <ConnectorTestConnection
              type={ArtifactToConnectorMap[selectedArtifactType]}
              {...ConnectorTestConnectionProps}
            />
          </StepWizard>
        )

      default:
        return <></>
    }
  }, [
    connectorView,
    selectedArtifactType,
    isEditMode,
    ConnectorTestConnectionProps,
    authenticationStepProps,
    connectorDetailStepProps,
    delegateStepProps
  ])

  const getLastSteps = useCallback((): JSX.Element | undefined => {
    switch (selectedArtifactType) {
      case 'Gcr':
        return <GCRImagePath {...artifactLastStepProps()} />
      case 'Ecr':
        return <ECRArtifact {...artifactLastStepProps()} />
      case 'Nexus3Registry':
        return <NexusArtifact {...artifactLastStepProps()} />
      case 'ArtifactoryRegistry':
        return <Artifactory {...artifactLastStepProps()} />
      case 'AmazonS3':
        return <AmazonS3 {...artifactLastStepProps()} />
      case 'Acr':
        return <ACRArtifact {...artifactLastStepProps()} />
      case 'Jenkins':
        return <div>Not Supported Yet!</div>
      case 'DockerRegistry':
        return <DockerRegistryArtifact {...artifactLastStepProps()} />
    }
  }, [artifactLastStepProps, selectedArtifactType])

  const handleConnectorViewChange = useCallback((isConnectorView: boolean): void => {
    setConnectorView(isConnectorView)
    setIsEditMode(false)
  }, [])

  return (
    <ArtifactListView
      primaryArtifact={primaryArtifact}
      addNewArtifact={addNewArtifact}
      editArtifact={editArtifact}
      deleteArtifact={deleteArtifact}
      fetchedConnectorResponse={fetchedConnectorResponse}
      accountId={accountId}
    />
  )
}
