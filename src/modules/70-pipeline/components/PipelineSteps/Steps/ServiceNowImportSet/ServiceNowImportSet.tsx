/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { connect, FormikErrors, yupToFormErrors } from 'formik'
import { getMultiTypeFromValue, IconName, MultiTypeInputType } from '@wings-software/uicore'
import { isEmpty, set } from 'lodash-es'
import * as Yup from 'yup'
import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import type { StringsMap } from 'stringTypes'
import { getSanitizedflatObjectForVariablesView } from '../Common/ApprovalCommons'
import { PipelineStep } from '../../PipelineStep'
import { StepType } from '../../PipelineStepInterface'

import type { ServiceNowImportSetData, ServiceNowImportSetVariableListModeProps } from './types'
import ServiceNowImportSetStepModeWithRef from './ServiceNowImportSetStepMode'
import ServiceNowImportSetDeploymentMode from './ServiceNowImportSetDeploymentMode'
import pipelineVariablesCss from '../../../PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

const ServiceNowImportSetDeploymentModeWithFormik = connect(ServiceNowImportSetDeploymentMode)

export class ServiceNowImportSet extends PipelineStep<ServiceNowImportSetData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()
  protected isHarnessSpecific = false
  protected type = StepType.ServiceNowImportSet
  protected referenceId = 'serviceNowImportSetStep'
  protected stepName = 'ServiceNow Import Set'
  protected stepIcon: IconName = 'servicenow-update'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.ServiceNowApproval'
  protected defaultValues: ServiceNowImportSetData = {
    identifier: '',
    timeout: '1d',
    name: '',
    type: StepType.ServiceNowImportSet,
    spec: {
      connectorRef: '',
      stagingTableName: '',
      importData: {
        type: 'Json',
        spec: {}
      }
    }
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<ServiceNowImportSetData>): FormikErrors<ServiceNowImportSetData> {
    const errors: FormikErrors<ServiceNowImportSetData> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm

    /* istanbul ignore else */
    if (
      typeof template?.spec?.connectorRef === 'string' &&
      getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.connectorRef)
    ) {
      errors.spec = {
        connectorRef: getString?.('pipeline.serviceNowApprovalStep.validations.connectorRef')
      }
    }

    /* istanbul ignore else */
    if (
      typeof template?.spec?.stagingTableName === 'string' &&
      getMultiTypeFromValue(template?.spec?.stagingTableName) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.stagingTableName)
    ) {
      errors.spec = {
        ...errors.spec,
        stagingTableName: getString?.('pipeline.serviceNowApprovalStep.validations.issueNumber')
      }
    }

    /* istanbul ignore else */
    if (
      getMultiTypeFromValue(template?.spec?.importData?.spec?.jsonBody) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.importData?.spec?.jsonBody)
    ) {
      set(errors, 'spec.importData.spec.jsonBody', getString?.('fieldRequired', { field: 'JSON' }))
    }

    /* istanbul ignore else */
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

  renderStep(this: ServiceNowImportSet, props: StepProps<ServiceNowImportSetData>): JSX.Element {
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
        <ServiceNowImportSetDeploymentModeWithFormik
          stepViewType={stepViewType}
          initialValues={initialValues}
          allowableTypes={allowableTypes}
          inputSetData={inputSetData}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      const customStepPropsTyped = customStepProps as ServiceNowImportSetVariableListModeProps
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
      <ServiceNowImportSetStepModeWithRef
        ref={formikRef}
        stepViewType={stepViewType || StepViewType.Edit}
        initialValues={initialValues}
        onUpdate={/* istanbul ignore next */ (values: ServiceNowImportSetData) => onUpdate?.(values)}
        allowableTypes={allowableTypes}
        onChange={(values: ServiceNowImportSetData) => onChange?.(values)}
        isNewStep={isNewStep}
        readonly={readonly}
      />
    )
  }
}
