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
import type { JiraApprovalData, JiraApprovalVariableListModeProps } from './types'
import { getDefaultCriterias, processFormData, processInitialValues } from './helper'
import JiraApprovalDeploymentMode from './JiraApprovalDeploymentMode'
import JiraApprovalStepModeWithRef from './JiraApprovalStepMode'
import pipelineVariablesCss from '../../../PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

const JiraApprovalDeploymentModeWithFormik = connect(JiraApprovalDeploymentMode)
export class JiraApproval extends PipelineStep<JiraApprovalData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  protected referenceId = 'jiraApprovalStep'
  protected isHarnessSpecific = false
  protected type = StepType.JiraApproval
  protected stepName = 'Jira Approval'
  protected stepIcon: IconName = 'jira-approve'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.JiraApproval'
  // initialValues on mount
  protected defaultValues: JiraApprovalData = {
    identifier: '',
    timeout: '1d',
    name: '',
    type: StepType.JiraApproval,
    spec: {
      connectorRef: '',
      projectKey: '',
      issueType: '',
      issueKey: '',
      approvalCriteria: getDefaultCriterias(),
      rejectionCriteria: getDefaultCriterias()
    }
  }

  validateInputSet({
    data,
    template,
    getString
  }: ValidateInputSetProps<JiraApprovalData>): FormikErrors<JiraApprovalData> {
    const errors: FormikErrors<JiraApprovalData> = {}

    if (
      typeof template?.spec?.connectorRef === 'string' &&
      getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.connectorRef)
    ) {
      errors.spec = {
        connectorRef: getString?.('pipeline.jiraApprovalStep.validations.connectorRef')
      }
    }

    if (
      typeof template?.spec?.issueKey === 'string' &&
      getMultiTypeFromValue(template?.spec?.issueKey) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.issueKey?.trim())
    ) {
      errors.spec = {
        ...errors.spec,
        issueKey: getString?.('pipeline.jiraApprovalStep.validations.issueKey')
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

  processFormData(values: JiraApprovalData): JiraApprovalData {
    return processFormData(values)
  }

  renderStep(this: JiraApproval, props: StepProps<JiraApprovalData>): JSX.Element {
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
        <JiraApprovalDeploymentModeWithFormik
          stepViewType={stepViewType}
          initialValues={initialValues}
          allowableTypes={allowableTypes}
          onUpdate={(values: JiraApprovalData) => onUpdate?.(values)}
          inputSetData={inputSetData}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      const customStepPropsTyped = customStepProps as JiraApprovalVariableListModeProps
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
      <JiraApprovalStepModeWithRef
        ref={formikRef}
        stepViewType={stepViewType || StepViewType.Edit}
        initialValues={processInitialValues(initialValues)}
        onUpdate={(values: JiraApprovalData) => {
          const forUpdate = this.processFormData(values)
          onUpdate?.(forUpdate)
        }}
        allowableTypes={allowableTypes}
        onChange={values => onChange?.(values)}
        isNewStep={isNewStep}
        readonly={readonly}
      />
    )
  }
}
