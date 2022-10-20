/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { getMultiTypeFromValue, IconName, MultiTypeInputType } from '@wings-software/uicore'
import type { FormikErrors } from 'formik'
import { get, isEmpty } from 'lodash-es'
import { parse } from 'yaml'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import {
  getAzureResourceGroupsBySubscriptionPromise,
  getAzureSubscriptionsPromise,
  getConnectorListV2Promise,
  getSubscriptionTagsPromise,
  SshWinRmAzureInfrastructure,
  ConnectorResponse,
  AzureResourceGroupDTO,
  AzureTagDTO
} from 'services/cd-ng'
import type { AzureSubscriptionDTO } from 'services/cd-ng'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { Connectors } from '@connectors/constants'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { getConnectorName, getConnectorValue } from '@pipeline/components/PipelineSteps/Steps/StepsHelper'
import {
  AzureInfrastructureSpecEditableProps,
  SshWinRmAzureInfrastructureTemplate,
  subscriptionLabel,
  resourceGroupLabel
} from './SshWinRmAzureInfrastructureInterface'
import { AzureInfrastructureSpecForm } from './SshWinRmAzureInfrastructureForm'
import { SshWinRmAzureInfrastructureSpecInputForm } from './SshWimRmAzureInfrastructureSpecInputForm'
import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

const logger = loggerFor(ModuleName.CD)

const yamlErrorMessage = 'cd.parsingYamlError'

const AzureInfrastructureSpecVariablesForm: React.FC<AzureInfrastructureSpecEditableProps> = ({
  metadataMap,
  variablesData,
  initialValues
}) => {
  const infraVariables = get(variablesData, 'infrastructureDefinition.spec', undefined)
  return /* istanbul ignore next */ infraVariables ? (
    <VariablesListTable
      data={infraVariables}
      originalData={initialValues?.infrastructureDefinition?.spec || initialValues}
      metadataMap={metadataMap}
      className={pipelineVariableCss.variablePaddingL1}
    />
  ) : null
}

interface AzureInfrastructureSpecStep extends SshWinRmAzureInfrastructure {
  name?: string
  identifier?: string
}

export const AzureConnectorRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.connectorRef$/
export const AzureSubscriptionRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.subscriptionId$/
export const AzureResourceGroupRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.resourceGroup$/
export const AzureTagsRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.tags$/
export const SshWinRmAzureType = StepType.SshWinRmAzure

export class SshWinRmAzureInfrastructureSpec extends PipelineStep<AzureInfrastructureSpecStep> {
  lastFetched: number
  protected type = StepType.SshWinRmAzure
  protected defaultValues: SshWinRmAzureInfrastructure = {
    credentialsRef: '',
    connectorRef: '',
    subscriptionId: '',
    resourceGroup: '',
    tags: {},
    allowSimultaneousDeployments: false,
    hostConnectionType: 'Hostname'
  }

  protected stepIcon: IconName = 'microsoft-azure'
  protected stepName = 'Specify your Azure Connector'
  protected stepPaletteVisible = false
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  constructor() {
    super()
    this.lastFetched = new Date().getTime()
    this.invocationMap.set(AzureConnectorRegex, this.getConnectorsListForYaml.bind(this))
    this.invocationMap.set(AzureSubscriptionRegex, this.getSubscriptionListForYaml.bind(this))
    this.invocationMap.set(AzureResourceGroupRegex, this.getResourceGroupListForYaml.bind(this))
    this.invocationMap.set(AzureTagsRegex, this.getTagsForYaml.bind(this))

    this._hasStepVariables = true
  }

  protected getConnectorsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (get(obj, 'type', '') === SshWinRmAzureType) {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: { types: [Connectors.AZURE], filterType: 'Connector' }
        }).then(
          response =>
            get(response, 'data.content', []).map((connector: ConnectorResponse) => ({
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            })) || /* istanbul ignore next */ []
        )
      }
    }

    return Promise.resolve([])
  }

  protected getSubscriptionListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.subscriptionId', ''))
      if (get(obj, 'type', '') === SshWinRmAzureType && get(obj, 'spec.connectorRef', '')) {
        return getAzureSubscriptionsPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: get(obj, 'spec.connectorRef', '')
          }
        }).then(response => {
          const values: CompletionItemInterface[] = []
          get(response, 'data.subscriptions', []).map((sub: AzureSubscriptionDTO) =>
            values.push({ label: sub.subscriptionId, insertText: sub.subscriptionId, kind: CompletionItemKind.Field })
          )
          return values
        })
      }
    }

    return Promise.resolve([])
  }

  protected getResourceGroupListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    /* istanbul ignore else */ if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.resourceGroup', ''))
      if (
        get(obj, 'type', '') === SshWinRmAzureType &&
        get(obj, 'spec.connectorRef', '') &&
        get(obj, 'spec.subscriptionId', '')
      ) {
        return getAzureResourceGroupsBySubscriptionPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: get(obj, 'spec.connectorRef', '')
          },
          subscriptionId: get(obj, 'spec.subscriptionId', '')
        }).then(
          response =>
            get(response, 'data.resourceGroups', []).map((rg: AzureResourceGroupDTO) => ({
              label: rg.resourceGroup,
              insertText: rg.resourceGroup,
              kind: CompletionItemKind.Field
            })) || /* istanbul ignore next */ []
        )
      }
    }

    return Promise.resolve([])
  }
  protected getTagsForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    /* istanbul ignore else */ if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.tags', ''))
      if (
        get(obj, 'type', '') === SshWinRmAzureType &&
        get(obj, 'spec.connectorRef', '') &&
        get(obj, 'spec.subscriptionId', '')
      ) {
        return getSubscriptionTagsPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: get(obj, 'spec.connectorRef', '')
          },
          subscriptionId: get(obj, 'spec.subscriptionId', '')
        }).then(
          response =>
            get(response, 'data.tags', []).map((azureTag: AzureTagDTO) => ({
              label: azureTag.tag,
              insertText: azureTag.tag,
              kind: CompletionItemKind.Field
            })) || /* istanbul ignore next */ []
        )
      }
    }

    return Promise.resolve([])
  }

  validateInputSet({
    data,
    getString,
    viewType,
    template
  }: ValidateInputSetProps<SshWinRmAzureInfrastructure>): FormikErrors<SshWinRmAzureInfrastructure> {
    const errors: Partial<SshWinRmAzureInfrastructureTemplate> = {}
    /* istanbul ignore else */ const isRequired =
      viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    /* istanbul ignore next */ if (
      isEmpty(data.credentialsRef) &&
      isRequired &&
      getString &&
      getMultiTypeFromValue(get(template, 'credentialsRef', undefined)) === MultiTypeInputType.RUNTIME
    ) {
      errors.credentialsRef = getString('common.validation.fieldIsRequired', {
        name: getString('credentials')
      })
    }
    /* istanbul ignore next */ if (
      isEmpty(data.connectorRef) &&
      isRequired &&
      getString &&
      getMultiTypeFromValue(get(template, 'connectorRef', undefined)) === MultiTypeInputType.RUNTIME
    ) {
      errors.connectorRef = getString('common.validation.fieldIsRequired', {
        name: getString('connector')
      })
    }
    /* istanbul ignore next */ if (
      isEmpty(data.subscriptionId) &&
      isRequired &&
      getString &&
      getMultiTypeFromValue(get(template, 'subscriptionId', undefined)) === MultiTypeInputType.RUNTIME
    ) {
      errors.subscriptionId = getString('common.validation.fieldIsRequired', {
        name: getString(subscriptionLabel)
      })
    }
    /* istanbul ignore next */ if (
      isEmpty(data.resourceGroup) &&
      isRequired &&
      getString &&
      getMultiTypeFromValue(get(template, 'resourceGroup', undefined)) === MultiTypeInputType.RUNTIME
    ) {
      errors.resourceGroup = getString('common.validation.fieldIsRequired', {
        name: getString(resourceGroupLabel)
      })
    }
    return errors
  }

  renderStep(props: StepProps<SshWinRmAzureInfrastructure>): JSX.Element {
    const { initialValues, onUpdate, stepViewType, customStepProps, readonly, allowableTypes, inputSetData, path } =
      props

    if (this.isTemplatizedView(stepViewType)) {
      return (
        <SshWinRmAzureInfrastructureSpecInputForm
          {...(customStepProps as AzureInfrastructureSpecEditableProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          readonly={get(inputSetData, 'readonly', undefined)}
          template={get(inputSetData, 'template', undefined) as SshWinRmAzureInfrastructureTemplate}
          allValues={get(inputSetData, 'allValues', undefined)}
          path={get(inputSetData, 'path', '')}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <AzureInfrastructureSpecVariablesForm
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          template={get(inputSetData, 'template', undefined) as SshWinRmAzureInfrastructureTemplate}
          {...(customStepProps as AzureInfrastructureSpecEditableProps)}
          initialValues={initialValues}
        />
      )
    }

    return (
      <AzureInfrastructureSpecForm
        onUpdate={onUpdate}
        readonly={readonly}
        stepViewType={stepViewType}
        {...(customStepProps as AzureInfrastructureSpecEditableProps)}
        initialValues={initialValues}
        allowableTypes={allowableTypes}
        path={path}
      />
    )
  }
}
