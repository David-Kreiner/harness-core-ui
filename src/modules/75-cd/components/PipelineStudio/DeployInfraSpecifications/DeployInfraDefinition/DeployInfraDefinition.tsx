/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import YAML from 'yaml'
import {
  Accordion,
  AllowedTypes,
  Card,
  Container,
  HarnessDocTooltip,
  MultiTypeInputType,
  RUNTIME_INPUT_VALUE,
  Text
} from '@wings-software/uicore'
import { debounce, defaultTo, get, isEmpty, isNil, omit, set } from 'lodash-es'
import produce from 'immer'
import { useParams } from 'react-router-dom'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import {
  getProvisionerExecutionStrategyYamlPromise,
  Infrastructure,
  K8sAzureInfrastructure,
  AzureWebAppInfrastructure,
  K8SDirectInfrastructure,
  K8sGcpInfrastructure,
  PdcInfrastructure,
  PipelineInfrastructure,
  StageElementConfig,
  EcsInfrastructure,
  GetExecutionStrategyYamlQueryParams,
  SshWinRmAwsInfrastructure,
  CustomDeploymentInfrastructure
} from 'services/cd-ng'
import StringWithTooltip from '@common/components/StringWithTooltip/StringWithTooltip'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type {
  InfraProvisioningData,
  ProvisionersOptions
} from '@cd/components/PipelineSteps/InfraProvisioning/InfraProvisioning'
import type { GcpInfrastructureSpec } from '@cd/components/PipelineSteps/GcpInfrastructureSpec/GcpInfrastructureSpec'
import type { PDCInfrastructureSpec } from '@cd/components/PipelineSteps/PDCInfrastructureSpec/PDCInfrastructureSpec'
import type { SshWinRmAwsInfrastructureSpec } from '@cd/components/PipelineSteps/SshWinRmAwsInfrastructureSpec/SshWinRmAwsInfrastructureSpec'
import type { SshWinRmAzureInfrastructureSpec } from '@cd/components/PipelineSteps/SshWinRmAzureInfrastructureSpec/SshWinRmAzureInfrastructureSpec'
import { useStrings } from 'framework/strings'
import {
  PipelineContextType,
  usePipelineContext
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import { InfraDeploymentType } from '@cd/components/PipelineSteps/PipelineStepsUtil'
import type { DeploymentStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import SelectInfrastructureType from '@cd/components/PipelineStudio/DeployInfraSpecifications/SelectInfrastructureType/SelectInfrastructureType'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { AzureInfrastructureSpec } from '@cd/components/PipelineSteps/AzureInfrastructureStep/AzureInfrastructureStep'
import type { AzureWebAppInfrastructureSpec } from '@cd/components/PipelineSteps/AzureWebAppInfrastructureStep/AzureWebAppInfrastructureStep'
import {
  detailsHeaderName,
  getCustomStepProps,
  isServerlessDeploymentType,
  isAzureWebAppDeploymentType,
  ServerlessInfraTypes,
  StageType,
  getServiceDefinitionType
} from '@pipeline/utils/stageHelpers'
import type { ServerlessAwsLambdaSpec } from '@cd/components/PipelineSteps/ServerlessAWSLambda/ServerlessAwsLambdaSpec'
import type { ServerlessGCPSpec } from '@cd/components/PipelineSteps/ServerlessGCP/ServerlessGCPSpec'
import type { ServerlessAzureSpec } from '@cd/components/PipelineSteps/ServerlessAzure/ServerlessAzureSpec'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { isNewServiceEnvEntity } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import type { ECSInfraSpec } from '@cd/components/PipelineSteps/ECSInfraSpec/ECSInfraSpec'
import type { CustomDeploymentInfrastructureSpec } from '@cd/components/PipelineSteps/CustomDeploymentInfrastructureSpec/CustomDeploymentInfrastructureStep'
import {
  cleanUpEmptyProvisioner,
  getInfraDefinitionDetailsHeaderTooltipId,
  getInfraDefinitionMethodTooltipId,
  getInfraGroups,
  getInfrastructureDefaultValue,
  InfrastructureGroup,
  isAzureWebAppInfrastructureType,
  isCustomDeploymentInfrastructureType,
  isServerlessInfrastructureType
} from '../deployInfraHelper'
import stageCss from '../../DeployStageSetupShell/DeployStage.module.scss'

export const deploymentTypeInfraTypeMap: Record<string, InfraDeploymentType> = {
  Kubernetes: InfraDeploymentType.KubernetesDirect,
  NativeHelm: InfraDeploymentType.KubernetesDirect,
  amazonEcs: InfraDeploymentType.KubernetesDirect,
  amazonAmi: InfraDeploymentType.KubernetesDirect,
  awsCodeDeploy: InfraDeploymentType.KubernetesDirect,
  WinRm: InfraDeploymentType.KubernetesDirect,
  awsLambda: InfraDeploymentType.KubernetesDirect,
  pcf: InfraDeploymentType.KubernetesDirect,
  Ssh: InfraDeploymentType.KubernetesDirect,
  ServerlessAwsLambda: InfraDeploymentType.ServerlessAwsLambda,
  ServerlessAzureFunctions: InfraDeploymentType.ServerlessAzureFunctions,
  ServerlessGoogleFunctions: InfraDeploymentType.ServerlessGoogleFunctions,
  AmazonSAM: InfraDeploymentType.AmazonSAM,
  AzureFunctions: InfraDeploymentType.AzureFunctions,
  AzureWebApp: InfraDeploymentType.AzureWebApp,
  ECS: InfraDeploymentType.ECS,
  CustomDeployment: InfraDeploymentType.CustomDeployment
}

type InfraTypes =
  | K8SDirectInfrastructure
  | K8sGcpInfrastructure
  | ServerlessInfraTypes
  | K8sAzureInfrastructure
  | PdcInfrastructure
  | SshWinRmAwsInfrastructure
  | AzureWebAppInfrastructure
  | EcsInfrastructure
  | CustomDeploymentInfrastructure

export default function DeployInfraDefinition(props: React.PropsWithChildren<unknown>): JSX.Element {
  const [initialInfrastructureDefinitionValues, setInitialInfrastructureDefinitionValues] =
    React.useState<Infrastructure>({})

  const { getString } = useStrings()

  const {
    state: {
      originalPipeline,
      selectionState: { selectedStageId },
      templateServiceData
    },
    allowableTypes,
    isReadonly,
    scope,
    getStageFromPipeline,
    updateStage,
    contextType
  } = usePipelineContext()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceUpdateStage = React.useCallback(
    debounce(
      (changedStage?: StageElementConfig) =>
        changedStage ? updateStage(changedStage) : /* instanbul ignore next */ Promise.resolve(),
      300
    ),
    [updateStage]
  )

  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')

  const { accountId } = useParams<{
    accountId: string
  }>()

  const isSvcEnvEnabled = useFeatureFlag(FeatureFlag.NG_SVC_ENV_REDESIGN)

  const [selectedInfrastructureType, setSelectedInfrastructureType] = React.useState<string | undefined>()

  const [selectedDeploymentType, setSelectedDeploymentType] = React.useState<
    GetExecutionStrategyYamlQueryParams['serviceDefinitionType']
  >(getServiceDefinitionType(stage, getStageFromPipeline, isNewServiceEnvEntity, isSvcEnvEnabled, templateServiceData))

  const [infraGroups, setInfraGroups] = React.useState<InfrastructureGroup[]>(
    getInfraGroups(selectedDeploymentType, getString, isSvcEnvEnabled)
  )

  useEffect(() => {
    if (isEmpty(stage?.stage?.spec?.infrastructure) && stage?.stage?.type === StageType.DEPLOY) {
      const stageData = produce(stage, draft => {
        if (draft) {
          set(draft, 'stage.spec', {
            ...stage.stage?.spec,
            infrastructure: {
              environmentRef: scope === Scope.PROJECT ? '' : RUNTIME_INPUT_VALUE,
              infrastructureDefinition: {},
              allowSimultaneousDeployments: false
            }
          })
        }
      })
      debounceUpdateStage(stageData?.stage)
    } else if (
      scope !== Scope.PROJECT &&
      stage?.stage?.spec?.infrastructure &&
      isEmpty(stage?.stage?.spec?.infrastructure?.environmentRef)
    ) {
      const stageData = produce(stage, draft => {
        if (draft) {
          set(draft, 'stage.spec.infrastructure.environmentRef', RUNTIME_INPUT_VALUE)
        }
      })
      if (stageData?.stage) {
        debounceUpdateStage(stageData?.stage)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stageRef = React.useRef(stage)
  stageRef.current = stage

  const resetInfrastructureDefinition = (type?: string): void => {
    const stageData = produce(stage, draft => {
      const spec = get(draft, 'stage.spec', {})
      spec.infrastructure = {
        ...spec.infrastructure,
        infrastructureDefinition: {}
      }

      if (type) {
        spec.infrastructure.infrastructureDefinition.type = type
      }
    })

    const initialInfraDefValues = getInfrastructureDefaultValue(stageData, type)
    setInitialInfrastructureDefinitionValues(initialInfraDefValues)

    debounceUpdateStage(stageData?.stage)
    setProvisionerEnabled(false)
  }

  React.useEffect(() => {
    const newDeploymentType = getServiceDefinitionType(
      stage,
      getStageFromPipeline,
      isNewServiceEnvEntity,
      isSvcEnvEnabled,
      templateServiceData
    )

    // This is used to not consider the value on infradefinition.type when switching between deployment types
    let infraReset = false
    if (newDeploymentType !== selectedDeploymentType) {
      setSelectedDeploymentType(newDeploymentType)
      infraReset = true
    }

    const initialInfraGroups = getInfraGroups(newDeploymentType, getString, isSvcEnvEnabled)

    const filteredInfraGroups = initialInfraGroups.map(group => ({
      ...group,
      items: group.items.filter(item => !item.disabled)
    }))

    const infrastructureType =
      (!infraReset && stage?.stage?.spec?.infrastructure?.infrastructureDefinition?.type) ||
      (filteredInfraGroups.length > 1 || filteredInfraGroups[0].items.length > 1
        ? undefined
        : deploymentTypeInfraTypeMap[newDeploymentType])

    setSelectedInfrastructureType(infrastructureType)
    setInfraGroups(getInfraGroups(newDeploymentType, getString, isSvcEnvEnabled))

    const initialInfraDefValues = getInfrastructureDefaultValue(stage, infrastructureType)
    setInitialInfrastructureDefinitionValues(initialInfraDefValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  React.useEffect(() => {
    // explicitly setting infraDefinition.type as variables prepoluated from template
    if (selectedDeploymentType === InfraDeploymentType.CustomDeployment) {
      const stageData = produce(stage, draft => {
        !!draft && set(draft, 'stage.spec.infrastructure.infrastructureDefinition.type', selectedDeploymentType)
      })
      debounceUpdateStage(stageData?.stage)
      const initialInfraDefValues = getInfrastructureDefaultValue(stageData, selectedDeploymentType)
      setInitialInfrastructureDefinitionValues(initialInfraDefValues)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeploymentType])

  const onUpdateInfrastructureDefinition = (extendedSpec: InfraTypes, type: string): void => {
    if (get(stageRef.current, 'stage.spec.infrastructure', null)) {
      const stageData = produce(stageRef.current, draft => {
        const infrastructure = get(draft, 'stage.spec.infrastructure', null)
        infrastructure.infrastructureDefinition = {
          ...infrastructure.infrastructureDefinition,
          type,
          spec: omit(extendedSpec, 'allowSimultaneousDeployments')
        }
        infrastructure.allowSimultaneousDeployments = extendedSpec.allowSimultaneousDeployments ?? false
      })
      debounceUpdateStage(stageData?.stage)
    }
  }

  const [provisionerEnabled, setProvisionerEnabled] = useState<boolean>(false)
  const [provisionerSnippetLoading, setProvisionerSnippetLoading] = useState<boolean>(false)
  const [provisionerType, setProvisionerType] = useState<ProvisionersOptions>('TERRAFORM')

  const isProvisionerEmpty = (stageData: StageElementWrapper): boolean => {
    const provisionerData = get(stageData, 'stage.spec.infrastructure.infrastructureDefinition.provisioner')
    return isEmpty(provisionerData?.steps) && isEmpty(provisionerData?.rollbackSteps)
  }

  // load and apply provisioner snippet to the stage
  useEffect(() => {
    if (stage && isProvisionerEmpty(stage) && provisionerEnabled) {
      setProvisionerSnippetLoading(true)
      getProvisionerExecutionStrategyYamlPromise({
        // eslint-disable-next-line
        // @ts-ignore
        queryParams: { provisionerType: provisionerType, routingId: accountId }
      }).then(res => {
        const provisionerSnippet = YAML.parse(defaultTo(res?.data, ''))
        if (stage && isProvisionerEmpty(stage) && provisionerSnippet) {
          const stageData = produce(stage, draft => {
            set(draft, 'stage.spec.infrastructure.infrastructureDefinition.provisioner', provisionerSnippet.provisioner)
          })

          if (stageData.stage) {
            updateStage(stageData.stage).then(() => {
              setProvisionerSnippetLoading(false)
            })
          }
        }
      })
    }
  }, [provisionerEnabled])

  useEffect(() => {
    setProvisionerEnabled(!isProvisionerEmpty(defaultTo(stage, {} as StageElementWrapper)))

    return () => {
      let isChanged
      const stageData = produce(stage, draft => {
        isChanged = cleanUpEmptyProvisioner(draft)
      })

      if (stageData?.stage && isChanged) {
        updateStage(stageData?.stage)
      }
    }
  }, [])

  const getProvisionerData = (stageData: StageElementWrapper): InfraProvisioningData => {
    let provisioner = get(stageData, 'stage.spec.infrastructure.infrastructureDefinition.provisioner')
    let originalProvisioner: InfraProvisioningData['originalProvisioner'] = undefined
    if (selectedStageId) {
      const originalStage = getStageFromPipeline(selectedStageId, originalPipeline).stage
      originalProvisioner = get(originalStage, 'stage.spec.infrastructure.infrastructureDefinition.provisioner')
    }

    provisioner = isNil(provisioner) ? {} : { ...provisioner }

    if (isNil(provisioner.steps)) {
      provisioner.steps = []
    }
    if (isNil(provisioner.rollbackSteps)) {
      provisioner.rollbackSteps = []
    }

    return {
      provisioner: { ...provisioner },
      provisionerEnabled,
      provisionerSnippetLoading,
      originalProvisioner: { ...originalProvisioner }
    }
  }

  const getClusterConfigurationStep = (type: string): React.ReactElement => {
    if (!stage?.stage) {
      return <div>Undefined deployment type</div>
    }
    switch (type) {
      case InfraDeploymentType.KubernetesDirect: {
        return (
          <StepWidget<K8SDirectInfrastructure>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as K8SDirectInfrastructure}
            type={StepType.KubernetesDirect}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  namespace: value.namespace,
                  releaseName: value.releaseName,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.KubernetesDirect
              )
            }
          />
        )
      }
      case InfraDeploymentType.KubernetesGcp: {
        return (
          <StepWidget<GcpInfrastructureSpec>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as GcpInfrastructureSpec}
            type={StepType.KubernetesGcp}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  cluster: value.cluster,
                  namespace: value.namespace,
                  releaseName: value.releaseName,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.KubernetesGcp
              )
            }
          />
        )
      }
      case InfraDeploymentType.KubernetesAzure: {
        return (
          <StepWidget<AzureInfrastructureSpec>
            factory={factory}
            key={stage?.stage?.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as AzureInfrastructureSpec}
            type={StepType.KubernetesAzure}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  subscriptionId: value.subscriptionId,
                  resourceGroup: value.resourceGroup,
                  cluster: value.cluster,
                  namespace: value.namespace,
                  releaseName: value.releaseName,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.KubernetesAzure
              )
            }
          />
        )
      }
      case InfraDeploymentType.AzureWebApp: {
        return (
          <StepWidget<AzureWebAppInfrastructureSpec>
            factory={factory}
            key={stage?.stage?.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as AzureWebAppInfrastructureSpec}
            type={StepType.AzureWebApp}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  subscriptionId: value.subscriptionId,
                  resourceGroup: value.resourceGroup,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.AzureWebApp
              )
            }
          />
        )
      }
      case InfraDeploymentType.ServerlessAwsLambda: {
        return (
          <StepWidget<ServerlessAwsLambdaSpec>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as ServerlessAwsLambdaSpec}
            type={StepType.ServerlessAwsInfra}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  stage: value.stage,
                  region: value.region,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.ServerlessAwsLambda
              )
            }
            customStepProps={getCustomStepProps('ServerlessAwsLambda', getString)}
          />
        )
      }
      case InfraDeploymentType.ServerlessGoogleFunctions: {
        return (
          <StepWidget<ServerlessGCPSpec>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as ServerlessGCPSpec}
            type={StepType.ServerlessGCP}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  stage: value.stage,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.ServerlessGoogleFunctions
              )
            }
            customStepProps={getCustomStepProps('ServerlessGoogleFunctions', getString)}
          />
        )
      }
      case InfraDeploymentType.ServerlessAzureFunctions: {
        return (
          <StepWidget<ServerlessAzureSpec>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as ServerlessAzureSpec}
            type={StepType.ServerlessAzure}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  stage: value.stage,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.ServerlessAzureFunctions
              )
            }
            customStepProps={getCustomStepProps('ServerlessAzureFunctions', getString)}
          />
        )
      }
      case InfraDeploymentType.PDC: {
        return (
          <StepWidget<PDCInfrastructureSpec>
            factory={factory}
            key={stage?.stage?.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as PDCInfrastructureSpec}
            type={StepType.PDC}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value => {
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef?.connector?.identifier || value.connectorRef,
                  credentialsRef: value.credentialsRef,
                  hostFilter: value.hostFilter,
                  hosts: value.hosts,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments,
                  delegateSelectors: value.delegateSelectors
                },
                InfraDeploymentType.PDC
              )
            }}
          />
        )
      }
      case InfraDeploymentType.SshWinRmAws: {
        return (
          <StepWidget<SshWinRmAwsInfrastructureSpec>
            factory={factory}
            key={stage?.stage?.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as SshWinRmAwsInfrastructureSpec}
            type={StepType.SshWinRmAws}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value => {
              onUpdateInfrastructureDefinition(
                {
                  credentialsRef: value.credentialsRef,
                  connectorRef: value.connectorRef,
                  region: value.region,
                  awsInstanceFilter: value.awsInstanceFilter,
                  hostConnectionType: value.hostConnectionType
                },
                InfraDeploymentType.SshWinRmAws
              )
            }}
          />
        )
      }
      case InfraDeploymentType.SshWinRmAzure: {
        return (
          <StepWidget<SshWinRmAzureInfrastructureSpec>
            factory={factory}
            key={stage?.stage?.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as SshWinRmAzureInfrastructureSpec}
            type={StepType.SshWinRmAzure}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value => {
              onUpdateInfrastructureDefinition(
                {
                  credentialsRef: value.credentialsRef,
                  connectorRef: value.connectorRef,
                  subscriptionId: value.subscriptionId,
                  resourceGroup: value.resourceGroup,
                  tags: value.tags,
                  hostConnectionType: value.hostConnectionType,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.SshWinRmAzure
              )
            }}
          />
        )
      }
      case InfraDeploymentType.ECS: {
        return (
          <StepWidget<ECSInfraSpec>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as ECSInfraSpec}
            type={StepType.EcsInfra}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  region: value.region,
                  cluster: value.cluster,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.ECS
              )
            }
          />
        )
      }
      case InfraDeploymentType.CustomDeployment: {
        return (
          <StepWidget<CustomDeploymentInfrastructureSpec>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as CustomDeploymentInfrastructureSpec}
            type={StepType.CustomDeployment}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  customDeploymentRef: value.customDeploymentRef,
                  variables: value.variables,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.CustomDeployment
              )
            }
          />
        )
      }
      default: {
        return <div>{getString('cd.steps.common.undefinedType')}</div>
      }
    }
  }

  const updateEnvStep = React.useCallback(
    (value: PipelineInfrastructure) => {
      const stageData = produce(stage, draft => {
        const infraObj: PipelineInfrastructure = get(draft, 'stage.spec.infrastructure', {})
        if (value.environment?.identifier) {
          infraObj.environment = value.environment
          delete infraObj.environmentRef
        } else {
          infraObj.environmentRef = value.environmentRef
          delete infraObj.environment
        }
      })
      debounceUpdateStage(stageData?.stage)
    },
    [stage, debounceUpdateStage, stage?.stage?.spec?.infrastructure?.infrastructureDefinition]
  )

  return (
    <>
      {contextType !== PipelineContextType.Standalone && (
        <>
          <div className={stageCss.tabHeading} id="environment">
            {getString('environment')}
          </div>
          <Card className={stageCss.sectionCard}>
            <StepWidget
              type={StepType.DeployEnvironment}
              readonly={isReadonly}
              initialValues={{
                environment: get(stage, 'stage.spec.infrastructure.environment', {}),
                environmentRef:
                  scope === Scope.PROJECT
                    ? get(stage, 'stage.spec.infrastructure.environmentRef', '')
                    : get(stage, 'stage.spec.infrastructure.environmentRef', '') || RUNTIME_INPUT_VALUE
              }}
              allowableTypes={
                scope === Scope.PROJECT
                  ? allowableTypes
                  : ((allowableTypes as MultiTypeInputType[]).filter(
                      item => item !== MultiTypeInputType.FIXED
                    ) as AllowedTypes)
              }
              onUpdate={val => updateEnvStep(val)}
              factory={factory}
              stepViewType={StepViewType.Edit}
            />
          </Card>
          <div className={stageCss.tabHeading} id="infrastructureDefinition">
            <StringWithTooltip
              tooltipId="pipelineStep.infrastructureDefinition"
              stringId="pipelineSteps.deploy.infrastructure.infraDefinition"
            />
          </div>
        </>
      )}
      {!(
        isAzureWebAppDeploymentType(selectedDeploymentType) ||
        isAzureWebAppInfrastructureType(selectedInfrastructureType) ||
        isCustomDeploymentInfrastructureType(selectedInfrastructureType)
      ) && (
        <Card className={stageCss.sectionCard}>
          {!(
            isServerlessDeploymentType(selectedDeploymentType) ||
            isServerlessInfrastructureType(selectedInfrastructureType)
          ) && (
            <Text margin={{ bottom: 'medium' }} className={stageCss.info}>
              <StringWithTooltip
                tooltipId={getInfraDefinitionMethodTooltipId(selectedDeploymentType)}
                stringId="cd.pipelineSteps.environmentTab.selectInfrastructureType"
              />
            </Text>
          )}
          <SelectInfrastructureType
            infraGroups={infraGroups}
            isReadonly={isReadonly || (!selectedDeploymentType && selectedInfrastructureType)}
            selectedInfrastructureType={selectedInfrastructureType}
            onChange={deploymentType => {
              setSelectedInfrastructureType(deploymentType)
              resetInfrastructureDefinition(deploymentType)
            }}
          />
        </Card>
      )}
      {contextType !== PipelineContextType.Standalone && selectedInfrastructureType && (
        <Accordion className={stageCss.accordion} activeId="dynamicProvisioning">
          <Accordion.Panel
            id="dynamicProvisioning"
            addDomId={true}
            summary={<div className={stageCss.tabHeading}>{getString('cd.dynamicProvisioning')}</div>}
            details={
              <Card className={stageCss.sectionCard}>
                <StepWidget<InfraProvisioningData>
                  factory={factory}
                  allowableTypes={allowableTypes}
                  readonly={isReadonly}
                  key={stage?.stage?.identifier}
                  initialValues={getProvisionerData(defaultTo(stage, {} as StageElementWrapper))}
                  type={StepType.InfraProvisioning}
                  stepViewType={StepViewType.Edit}
                  onUpdate={(value: InfraProvisioningData) => {
                    if (stage) {
                      const stageData = produce(stage, draft => {
                        set(draft, 'stage.spec.infrastructure.infrastructureDefinition.provisioner', value.provisioner)
                        cleanUpEmptyProvisioner(draft)
                      })
                      if (stageData.stage) {
                        setProvisionerType(value.selectedProvisioner!)
                        updateStage(stageData.stage).then(() => {
                          setProvisionerEnabled(value.provisionerEnabled)
                        })
                      }
                    } else {
                      setProvisionerType(value.selectedProvisioner!)
                      setProvisionerEnabled(value.provisionerEnabled)
                    }
                  }}
                />
              </Card>
            }
          />
        </Accordion>
      )}
      {selectedInfrastructureType && (
        <>
          {(isAzureWebAppDeploymentType(selectedInfrastructureType) ||
            isCustomDeploymentInfrastructureType(selectedInfrastructureType)) &&
          isSvcEnvEnabled ? (
            <></>
          ) : (
            <div
              className={stageCss.tabHeading}
              id="clusterDetails"
              data-tooltip-id={getInfraDefinitionDetailsHeaderTooltipId(selectedInfrastructureType)}
            >
              {defaultTo(detailsHeaderName[selectedInfrastructureType], getString('cd.steps.common.clusterDetails'))}
              <HarnessDocTooltip
                tooltipId={getInfraDefinitionDetailsHeaderTooltipId(selectedInfrastructureType)}
                useStandAlone={true}
              />
            </div>
          )}
          <Card className={stageCss.sectionCard}>{getClusterConfigurationStep(selectedInfrastructureType)}</Card>
        </>
      )}
      <Container margin={{ top: 'xxlarge' }}>{props.children}</Container>
    </>
  )
}
