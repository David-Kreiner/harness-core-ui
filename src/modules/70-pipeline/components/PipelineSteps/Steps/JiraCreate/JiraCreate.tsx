/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import { isEmpty } from 'lodash-es'
import { connect, FormikErrors, yupToFormErrors } from 'formik'
import { getMultiTypeFromValue, IconName, MultiTypeInputType } from '@wings-software/uicore'
import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import type { StringsMap } from 'stringTypes'
import { PipelineStep } from '../../PipelineStep'
import { StepType } from '../../PipelineStepInterface'
import { getSanitizedflatObjectForVariablesView } from '../Common/ApprovalCommons'
import type { JiraCreateVariableListModeProps, JiraCreateData } from './types'
import { processFormData, processInitialValues } from './helper'
import JiraCreateStepModeWithRef from './JiraCreateStepMode'
import JiraCreateDeploymentMode from './JiraCreateDeploymentMode'
import pipelineVariablesCss from '../../../PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

const JiraCreateDeploymentModeWithFormik = connect(JiraCreateDeploymentMode)
export class JiraCreate extends PipelineStep<JiraCreateData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  protected referenceId = 'jiraCreateStep'
  protected isHarnessSpecific = false
  protected type = StepType.JiraCreate
  protected stepName = 'Jira Create'
  protected stepIcon: IconName = 'jira-create'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.JiraCreate'
  // initialValues on mount
  protected defaultValues: JiraCreateData = {
    identifier: '',
    timeout: '1d',
    name: '',
    type: StepType.JiraCreate,
    spec: {
      connectorRef: '',
      projectKey: '',
      issueType: '',
      fields: []
    }
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<JiraCreateData>): FormikErrors<JiraCreateData> {
    const errors: FormikErrors<JiraCreateData> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm

    if (
      typeof template?.spec?.connectorRef === 'string' &&
      isRequired &&
      getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.connectorRef)
    ) {
      errors.spec = {
        connectorRef: getString?.('pipeline.jiraApprovalStep.validations.connectorRef')
      }
    }

    if (
      typeof template?.spec?.projectKey === 'string' &&
      isRequired &&
      getMultiTypeFromValue(template?.spec?.projectKey) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.projectKey)
    ) {
      errors.spec = {
        ...errors.spec,
        projectKey: getString?.('pipeline.jiraApprovalStep.validations.project')
      }
    }

    if (
      typeof template?.spec?.issueType === 'string' &&
      isRequired &&
      getMultiTypeFromValue(template?.spec?.issueType) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.issueType)
    ) {
      errors.spec = {
        ...errors.spec,
        issueType: getString?.('pipeline.jiraApprovalStep.validations.issueType')
      }
    }

    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      let timeoutSchema = getDurationValidationSchema({ minimum: '10s' })
      if (isRequired) {
        timeoutSchema = timeoutSchema.required(getString?.('validation.timeout10SecMinimum'))
      }
      const timeout = Yup.object().shape({
        timeout: timeoutSchema
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

  processFormData(values: JiraCreateData): JiraCreateData {
    return processFormData(values)
  }

  renderStep(this: JiraCreate, props: StepProps<JiraCreateData>): JSX.Element {
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
        <JiraCreateDeploymentModeWithFormik
          stepViewType={stepViewType}
          initialValues={initialValues}
          allowableTypes={allowableTypes}
          onUpdate={(values: JiraCreateData) => onUpdate?.(values)}
          inputSetData={inputSetData}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      const customStepPropsTyped = customStepProps as JiraCreateVariableListModeProps
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
      <JiraCreateStepModeWithRef
        ref={formikRef}
        stepViewType={stepViewType || StepViewType.Edit}
        allowableTypes={allowableTypes}
        onChange={(values: JiraCreateData) => onChange?.(values)}
        initialValues={processInitialValues(initialValues)}
        unprocessedInitialValues={initialValues}
        onUpdate={(values: JiraCreateData) => onUpdate?.(values)}
        isNewStep={isNewStep}
        readonly={readonly}
      />
    )
  }
}
