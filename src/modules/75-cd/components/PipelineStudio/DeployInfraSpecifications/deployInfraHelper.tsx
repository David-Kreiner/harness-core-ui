/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { defaultTo, get, isNil, pick } from 'lodash-es'
import type { IconName } from '@harness/uicore'

import type { StringsMap } from 'stringTypes'
import type { UseStringsReturn } from 'framework/strings'
import type { Infrastructure, ServiceDefinition } from 'services/cd-ng'

import { InfraDeploymentType } from '@cd/components/PipelineSteps/PipelineStepsUtil'
import type { DeploymentStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import {
  isAzureWebAppDeploymentType,
  isCustomDeploymentType,
  isServerlessDeploymentType,
  isSSHWinRMDeploymentType,
  ServiceDeploymentType
} from '@pipeline/utils/stageHelpers'

const DEFAULT_RELEASE_NAME = 'release-<+INFRA_KEY>'

export const cleanUpEmptyProvisioner = (
  stageData: StageElementWrapper<DeploymentStageElementConfig> | undefined
): boolean => {
  const provisioner = stageData?.stage?.spec?.infrastructure?.infrastructureDefinition?.provisioner
  let isChanged = false

  if (!isNil(provisioner?.steps) && provisioner?.steps.length === 0) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete provisioner.steps
    isChanged = true
  }
  if (!isNil(provisioner?.rollbackSteps) && provisioner?.rollbackSteps.length === 0) {
    delete provisioner.rollbackSteps
    isChanged = true
  }

  if (
    !provisioner?.steps &&
    !provisioner?.rollbackSteps &&
    stageData?.stage?.spec?.infrastructure?.infrastructureDefinition?.provisioner
  ) {
    delete stageData.stage.spec.infrastructure.infrastructureDefinition.provisioner
    isChanged = true
  }

  return isChanged
}

export const getInfrastructureDefaultValue = (
  stageData: StageElementWrapper | undefined,
  infrastructureType: string | undefined
): Infrastructure => {
  const infrastructure = get(stageData, 'stage.spec.infrastructure.infrastructureDefinition', null)
  const type = defaultTo(infrastructure?.type, infrastructureType)
  const serviceType = get(stageData, 'stage.spec.serviceConfig.serviceDefinition.type', null)
  const allowSimultaneousDeployments = get(stageData, 'stage.spec.infrastructure.allowSimultaneousDeployments', false)
  switch (type) {
    case InfraDeploymentType.KubernetesDirect: {
      const connectorRef = infrastructure?.spec?.connectorRef
      const namespace = infrastructure?.spec?.namespace
      const releaseName = infrastructure?.spec?.releaseName ?? DEFAULT_RELEASE_NAME
      return {
        connectorRef,
        namespace,
        releaseName,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.KubernetesGcp: {
      const connectorRef = infrastructure?.spec?.connectorRef
      const namespace = infrastructure?.spec?.namespace
      const releaseName = infrastructure?.spec?.releaseName ?? DEFAULT_RELEASE_NAME
      const cluster = infrastructure?.spec?.cluster

      return {
        connectorRef,
        namespace,
        releaseName,
        cluster,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.ServerlessAwsLambda: {
      const connectorRef = infrastructure?.spec?.connectorRef
      const region = infrastructure?.spec?.region
      const infraStage = infrastructure?.spec?.stage

      return {
        connectorRef,
        region,
        stage: infraStage,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.ServerlessAzureFunctions:
    case InfraDeploymentType.ServerlessGoogleFunctions: {
      const connectorRef = infrastructure?.spec?.connectorRef
      const infraStage = infrastructure?.spec?.stage

      return {
        connectorRef,
        stage: infraStage,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.KubernetesAzure: {
      const connectorRef = infrastructure?.spec?.connectorRef
      const subscriptionId = infrastructure?.spec?.subscriptionId
      const resourceGroup = infrastructure?.spec?.resourceGroup
      const cluster = infrastructure?.spec?.cluster
      const namespace = infrastructure?.spec?.namespace
      const releaseName = infrastructure?.spec?.releaseName ?? DEFAULT_RELEASE_NAME

      return {
        connectorRef,
        namespace,
        subscriptionId,
        resourceGroup,
        cluster,
        releaseName,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.AzureWebApp: {
      const connectorRef = infrastructure?.spec?.connectorRef
      const subscriptionId = infrastructure?.spec?.subscriptionId
      const resourceGroup = infrastructure?.spec?.resourceGroup

      return {
        connectorRef,
        subscriptionId,
        resourceGroup,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.CustomDeployment: {
      const variables = infrastructure?.spec?.variables
      const customDeploymentRef = infrastructure?.spec?.customDeploymentRef

      return {
        customDeploymentRef,
        variables,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.PDC: {
      const { connectorRef, credentialsRef, delegateSelectors, hostFilter, hosts } = infrastructure?.spec || {}

      return {
        connectorRef,
        credentialsRef,
        allowSimultaneousDeployments,
        hosts,
        delegateSelectors,
        hostFilter,
        serviceType
      }
    }
    case InfraDeploymentType.SshWinRmAzure: {
      const { credentialsRef, connectorRef, resourceGroup, tags, hostConnectionType, subscriptionId } =
        infrastructure?.spec || {}
      return {
        credentialsRef,
        connectorRef,
        resourceGroup,
        subscriptionId,
        tags,
        hostConnectionType,
        allowSimultaneousDeployments,
        serviceType
      }
    }
    case InfraDeploymentType.SshWinRmAws: {
      const { credentialsRef, connectorRef, region, awsInstanceFilter, hostConnectionType } = infrastructure?.spec || {}
      return {
        credentialsRef,
        connectorRef,
        region,
        awsInstanceFilter,
        serviceType,
        hostConnectionType
      }
    }
    case InfraDeploymentType.ECS: {
      const { connectorRef, region, cluster } = infrastructure?.spec || {}
      return {
        connectorRef,
        region,
        cluster,
        allowSimultaneousDeployments
      }
    }
    default: {
      return {}
    }
  }
}
interface InfrastructureItem {
  label: string
  icon: IconName
  value: string
  disabled?: boolean
}
export interface InfrastructureGroup {
  groupLabel: string
  items: InfrastructureItem[]
  disabled?: boolean
}

export const getInfraGroups = (
  deploymentType: ServiceDefinition['type'],
  getString: UseStringsReturn['getString'],
  isSvcEnvEntityEnabled: boolean
): InfrastructureGroup[] => {
  const serverlessInfraGroups: InfrastructureGroup[] = [
    {
      groupLabel: '',
      items: getInfraGroupItems(
        [
          InfraDeploymentType.ServerlessAwsLambda,
          InfraDeploymentType.ServerlessGoogleFunctions,
          InfraDeploymentType.ServerlessAzureFunctions
        ],
        getString
      )
    }
  ]

  const azureWebAppInfraGroups: InfrastructureGroup[] = [
    {
      groupLabel: '',
      items: []
    }
  ]

  const customDeploymentInfraGroups: InfrastructureGroup[] = [
    {
      groupLabel: '',
      items: isSvcEnvEntityEnabled ? getInfraGroupItems([InfraDeploymentType.CustomDeployment], getString) : []
    }
  ]

  const sshWinRMInfraGroups: InfrastructureGroup[] = [
    {
      groupLabel: '',
      items: getInfraGroupItems(
        [InfraDeploymentType.PDC, InfraDeploymentType.SshWinRmAzure, InfraDeploymentType.SshWinRmAws],
        getString
      )
    }
  ]

  const ecsInfraGroups: InfrastructureGroup[] = [
    {
      groupLabel: getString('pipelineSteps.deploy.infrastructure.directConnection'),
      items: [
        {
          label: getString('common.aws'),
          icon: 'service-aws',
          value: InfraDeploymentType.ECS
        }
      ]
    }
  ]

  const kuberntesInfraGroups: InfrastructureGroup[] = [
    {
      groupLabel: getString('pipelineSteps.deploy.infrastructure.directConnection'),
      items: getInfraGroupItems([InfraDeploymentType.KubernetesDirect], getString)
    },
    {
      groupLabel: getString('pipelineSteps.deploy.infrastructure.viaCloudProvider'),
      items: getInfraGroupItems([InfraDeploymentType.KubernetesGcp, InfraDeploymentType.KubernetesAzure], getString)
    }
  ]

  switch (true) {
    case isServerlessDeploymentType(deploymentType):
      return serverlessInfraGroups
    case isAzureWebAppDeploymentType(deploymentType):
      return azureWebAppInfraGroups
    case isSSHWinRMDeploymentType(deploymentType):
      return sshWinRMInfraGroups
    case deploymentType === ServiceDeploymentType.ECS:
      return ecsInfraGroups
    case isCustomDeploymentType(deploymentType):
      return customDeploymentInfraGroups
    default:
      return kuberntesInfraGroups
  }
}

const infraGroupItems: {
  [key in InfraDeploymentType]?: {
    label: keyof StringsMap
    icon: IconName
    value: InfraDeploymentType
    disabled?: boolean
  }
} = {
  [InfraDeploymentType.ServerlessAwsLambda]: {
    label: 'common.aws',
    icon: 'service-aws',
    value: InfraDeploymentType.ServerlessAwsLambda
  },
  [InfraDeploymentType.ServerlessGoogleFunctions]: {
    label: 'common.gcp',
    icon: 'gcp',
    value: InfraDeploymentType.ServerlessGoogleFunctions,
    disabled: true
  },
  [InfraDeploymentType.ServerlessAzureFunctions]: {
    label: 'common.azure',
    icon: 'service-azure',
    value: InfraDeploymentType.ServerlessAzureFunctions,
    disabled: true
  },
  [InfraDeploymentType.AzureWebApp]: {
    label: 'cd.steps.azureWebAppInfra.azureWebApp',
    icon: 'azurewebapp',
    value: InfraDeploymentType.AzureWebApp
  },
  [InfraDeploymentType.PDC]: {
    label: 'connectors.title.pdcConnector',
    icon: 'pdc',
    value: InfraDeploymentType.PDC
  },
  [InfraDeploymentType.SshWinRmAzure]: {
    label: 'common.azure',
    icon: 'service-azure',
    value: InfraDeploymentType.SshWinRmAzure
  },
  [InfraDeploymentType.SshWinRmAws]: {
    label: 'common.aws',
    icon: 'service-aws',
    value: InfraDeploymentType.SshWinRmAws
  },
  [InfraDeploymentType.KubernetesDirect]: {
    label: 'pipelineSteps.deploymentTypes.kubernetes',
    icon: 'service-kubernetes',
    value: InfraDeploymentType.KubernetesDirect
  },
  [InfraDeploymentType.KubernetesGcp]: {
    label: 'pipelineSteps.deploymentTypes.gk8engine',
    icon: 'google-kubernetes-engine',
    value: InfraDeploymentType.KubernetesGcp
  },
  [InfraDeploymentType.KubernetesAzure]: {
    label: 'cd.steps.azureInfraStep.azure',
    icon: 'microsoft-azure',
    value: InfraDeploymentType.KubernetesAzure
  }
}

const getInfraGroupItems = (
  infraItems: InfraDeploymentType[],
  getString: UseStringsReturn['getString']
): InfrastructureItem[] => {
  const selectedInfraGroupItems = pick(infraGroupItems, infraItems)

  const finalArray = []
  for (const key in selectedInfraGroupItems) {
    const item = infraGroupItems[key as InfraDeploymentType]
    if (item) {
      finalArray.push({ ...item, label: getString(item.label) })
    }
  }
  return finalArray
}

export const isServerlessInfrastructureType = (infrastructureType?: string): boolean => {
  return infrastructureType === InfraDeploymentType.ServerlessAwsLambda
}

export const isAzureWebAppInfrastructureType = (infrastructureType?: string): boolean => {
  return infrastructureType === InfraDeploymentType.AzureWebApp
}
export const isCustomDeploymentInfrastructureType = (infrastructureType?: string): boolean => {
  return infrastructureType === InfraDeploymentType.CustomDeployment
}

export const getInfraDefinitionDetailsHeaderTooltipId = (selectedInfrastructureType: string): string => {
  return `${selectedInfrastructureType}InfraDefinitionDetails`
}

export const getInfraDefinitionMethodTooltipId = (selectedDeploymentType: string): string => {
  return `${selectedDeploymentType}InfrastructureDefinitionMethod`
}
