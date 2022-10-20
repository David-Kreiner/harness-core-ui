/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { connect, FormikErrors, yupToFormErrors } from 'formik'
import { getMultiTypeFromValue, IconName, MultiTypeInputType } from '@wings-software/uicore'
import { defaultTo, get, isEmpty } from 'lodash-es'
import * as Yup from 'yup'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { parse } from '@common/utils/YamlHelperMethods'
import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import type { StringsMap } from 'stringTypes'
import ServiceNowApprovalStepModeWithRef from '@pipeline/components/PipelineSteps/Steps/ServiceNowApproval/ServiceNowApprovalStepMode'
import {
  getDefaultCriterias,
  processInitialValues,
  processFormData
} from '@pipeline/components/PipelineSteps/Steps/ServiceNowApproval/helper'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { getConnectorListV2Promise, getServiceNowTicketTypesPromise } from 'services/cd-ng'
import { getConnectorName, getConnectorValue } from '@pipeline/components/PipelineSteps/Steps/StepsHelper'
import { getSanitizedflatObjectForVariablesView } from '../Common/ApprovalCommons'
import { PipelineStep } from '../../PipelineStep'
import { StepType } from '../../PipelineStepInterface'

import type { ServiceNowApprovalData, SnowApprovalVariableListModeProps } from './types'
import ServiceNowApprovalDeploymentMode from './ServiceNowApprovalDeploymentMode'
import pipelineVariablesCss from '../../../PipelineStudio/PipelineVariables/PipelineVariables.module.scss'
const logger = loggerFor(ModuleName.CD)

const ServiceNowConnectorRegex = /^.+spec\.connectorRef$/
const ServiceNowTicketTypeRegex = /^.+spec\.ticketType$/
const SnowApprovalDeploymentModeWithFormik = connect(ServiceNowApprovalDeploymentMode)
export class ServiceNowApproval extends PipelineStep<ServiceNowApprovalData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
    this.invocationMap.set(ServiceNowConnectorRegex, this.getConnectorsListForYaml.bind(this))
    this.invocationMap.set(ServiceNowTicketTypeRegex, this.getTicketTypeListForYaml.bind(this))
  }
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()
  protected isHarnessSpecific = false
  protected type = StepType.ServiceNowApproval
  protected stepName = 'ServiceNow Approval'
  protected stepIcon: IconName = 'servicenow-approve'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.ServiceNowApproval'
  protected referenceId = 'serviceNowApprovalStep'
  // initialValues on mount
  protected defaultValues: ServiceNowApprovalData = {
    identifier: '',
    timeout: '1d',
    name: '',
    type: StepType.ServiceNowApproval,
    spec: {
      connectorRef: '',
      ticketNumber: '',
      ticketType: '',
      approvalCriteria: getDefaultCriterias(),
      rejectionCriteria: getDefaultCriterias()
    }
  }

  protected getTicketTypeListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.ticketType', ''))
      if (obj?.type === 'ServiceNowApproval') {
        return getServiceNowTicketTypesPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: obj?.spec?.connectorRef
          }
        }).then(response => {
          return defaultTo(
            response?.data?.map(ticketType => ({
              label: ticketType.name,
              insertText: ticketType.key,
              kind: CompletionItemKind.Field
            })),
            []
          )
        })
      }
    }

    return Promise.resolve([])
  }

  protected getConnectorsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (obj?.type === 'ServiceNowApproval') {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: { types: ['ServiceNow'], filterType: 'Connector' }
        }).then(response => {
          return defaultTo(
            response?.data?.content?.map(connector => ({
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            })),
            []
          )
        })
      }
    }

    return Promise.resolve([])
  }

  processFormData(values: ServiceNowApprovalData): ServiceNowApprovalData {
    return processFormData(values)
  }

  validateInputSet({
    data,
    template,
    getString
  }: ValidateInputSetProps<ServiceNowApprovalData>): FormikErrors<ServiceNowApprovalData> {
    const errors: FormikErrors<ServiceNowApprovalData> = {}

    if (
      typeof template?.spec?.connectorRef === 'string' &&
      getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.connectorRef)
    ) {
      errors.spec = {
        connectorRef: getString?.('pipeline.serviceNowApprovalStep.validations.connectorRef')
      }
    }

    if (
      typeof template?.spec?.ticketNumber === 'string' &&
      getMultiTypeFromValue(template?.spec?.ticketNumber) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.ticketNumber?.trim())
    ) {
      errors.spec = {
        ...errors.spec,
        ticketNumber: getString?.('pipeline.serviceNowApprovalStep.validations.issueNumber')
      }
    }

    if (
      typeof template?.spec?.approvalCriteria?.spec?.expression === 'string' &&
      getMultiTypeFromValue(template?.spec?.approvalCriteria?.spec?.expression) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.approvalCriteria?.spec?.expression?.trim())
    ) {
      errors.spec = {
        ...errors.spec,
        approvalCriteria: {
          spec: { expression: getString?.('pipeline.approvalCriteria.validations.expression') }
        }
      }
    }

    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      const timeout = Yup.object().shape({
        timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString?.('validation.timeout10SecMinimum'))
      })

      try {
        timeout.validateSync(data)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)
          Object.assign(errors, err)
        }
      }
    }

    return errors
  }

  renderStep(this: ServiceNowApproval, props: StepProps<ServiceNowApprovalData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      allowableTypes,
      onChange
    } = props

    if (this.isTemplatizedView(stepViewType)) {
      return (
        <SnowApprovalDeploymentModeWithFormik
          formik={formikRef}
          stepViewType={stepViewType}
          initialValues={initialValues}
          allowableTypes={allowableTypes}
          onUpdate={(values: ServiceNowApprovalData) => onUpdate?.(values)}
          inputSetData={inputSetData}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      const customStepPropsTyped = customStepProps as SnowApprovalVariableListModeProps
      return (
        <VariablesListTable
          data={getSanitizedflatObjectForVariablesView(customStepPropsTyped.variablesData)}
          originalData={initialValues as Record<string, any>}
          metadataMap={customStepPropsTyped.metadataMap}
          className={pipelineVariablesCss.variablePaddingL3}
        />
      )
    }
    return (
      <ServiceNowApprovalStepModeWithRef
        ref={formikRef}
        stepViewType={stepViewType || StepViewType.Edit}
        initialValues={processInitialValues(initialValues)}
        onUpdate={(values: ServiceNowApprovalData) => {
          const forUpdate = this.processFormData(values)
          onUpdate?.(forUpdate)
        }}
        allowableTypes={allowableTypes}
        onChange={values => onChange?.(this.processFormData(values))}
        isNewStep={isNewStep}
        readonly={readonly}
      />
    )
  }
}
