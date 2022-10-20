/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import { isEmpty, get, compact } from 'lodash-es'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { connect, FormikErrors, yupToFormErrors } from 'formik'
import { getMultiTypeFromValue, IconName, MultiTypeInputType } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { parse } from '@common/utils/YamlHelperMethods'
import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { getUserGroupListPromise } from 'services/cd-ng'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import type { StringsMap } from 'stringTypes'
import { PipelineStep } from '../../PipelineStep'
import { StepType } from '../../PipelineStepInterface'
import { getSanitizedflatObjectForVariablesView } from '../Common/ApprovalCommons'
import { processFormData, processForInitialValues } from './helper'
import HarnessApprovalDeploymentMode from './HarnessApprovalDeploymentMode'
import HarnessApprovalStepModeWithRef from './HarnessApprovalStepMode'
import type { HarnessApprovalData, HarnessApprovalVariableListModeProps } from './types'
import pipelineVariablesCss from '../../../PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

const UserGroupRegex = /^.+step\.spec\.approvers\.userGroups$/
const logger = loggerFor(ModuleName.CD)

const HarnessApprovalDeploymentModeWithFormik = connect(HarnessApprovalDeploymentMode)
export class HarnessApproval extends PipelineStep<HarnessApprovalData> {
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()
  constructor() {
    super()
    this._hasStepVariables = true
    this.invocationMap.set(UserGroupRegex, this.getUgListForYaml.bind(this))
  }

  protected referenceId = 'harnessApprovalStep'
  protected isHarnessSpecific = false
  protected type = StepType.HarnessApproval
  protected stepName = 'Manual Approval'
  protected stepIcon: IconName = 'harness-with-color'
  protected stepIconColor: string = Color.PRIMARY_4
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.HarnessApproval'
  // initialValues on mount
  protected defaultValues: HarnessApprovalData = {
    identifier: '',
    name: '',
    type: StepType.HarnessApproval,
    timeout: '1d',
    spec: {
      approvalMessage: 'Please review the following information and approve the pipeline progression',
      includePipelineExecutionHistory: true,
      approvers: {
        userGroups: [],
        minimumCount: 1,
        disallowPipelineExecutor: false
      },
      approverInputs: [
        {
          name: '',
          defaultValue: ''
        }
      ]
    }
  }

  protected getUgListForYaml(
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
      const obj = get(pipelineObj, path.replace('.spec.approvers.userGroups', ''))
      if (obj?.type === StepType.HarnessApproval) {
        return getUserGroupListPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier
          }
        }).then(response => {
          const data =
            response?.data?.content?.map(service => ({
              label: service.name || '',
              insertText: service.identifier || '',
              kind: CompletionItemKind.Field
            })) || []
          return data
        })
      }
    }

    return new Promise(resolve => {
      resolve([])
    })
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<HarnessApprovalData>): FormikErrors<HarnessApprovalData> {
    const errors: FormikErrors<HarnessApprovalData> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (
      typeof template?.spec?.approvalMessage === 'string' &&
      isRequired &&
      getMultiTypeFromValue(template?.spec?.approvalMessage) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.approvalMessage?.trim())
    ) {
      errors.spec = {
        ...errors.spec,
        approvalMessage: getString?.('pipeline.approvalStep.validation.approvalMessage')
      }
    }

    if (
      typeof template?.spec?.approvers?.userGroups === 'string' &&
      isRequired &&
      getMultiTypeFromValue(template?.spec?.approvers.userGroups) === MultiTypeInputType.RUNTIME &&
      isEmpty(compact(data?.spec?.approvers.userGroups as string[]))
    ) {
      errors.spec = {
        ...errors.spec,
        approvers: {
          ...errors.spec?.approvers,
          userGroups: getString?.('pipeline.approvalStep.validation.userGroups')
        }
      }
    }

    if (
      typeof template?.spec?.approvers?.minimumCount === 'string' &&
      isRequired &&
      getMultiTypeFromValue(template?.spec?.approvers.minimumCount) === MultiTypeInputType.RUNTIME
    ) {
      if (!data?.spec?.approvers.minimumCount) {
        errors.spec = {
          ...errors.spec,
          approvers: {
            ...errors.spec?.approvers,
            minimumCount: getString?.('pipeline.approvalStep.validation.minimumCountRequired')
          }
        }
      } else if (data?.spec?.approvers.minimumCount < 1) {
        errors.spec = {
          ...errors.spec,
          approvers: {
            ...errors.spec?.approvers,
            minimumCount: getString?.('pipeline.approvalStep.validation.minimumCountOne')
          }
        }
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

  processFormData(values: HarnessApprovalData): HarnessApprovalData {
    return processFormData(values)
  }

  renderStep(this: HarnessApproval, props: StepProps<HarnessApprovalData>): JSX.Element {
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
        <HarnessApprovalDeploymentModeWithFormik
          stepViewType={stepViewType}
          initialValues={processForInitialValues(initialValues)}
          onUpdate={values => onUpdate?.(processFormData(values))}
          allowableTypes={allowableTypes}
          inputSetData={inputSetData}
          readonly={readonly}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      const customStepPropsTyped = customStepProps as HarnessApprovalVariableListModeProps
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
      <HarnessApprovalStepModeWithRef
        ref={formikRef}
        isNewStep={isNewStep}
        stepViewType={stepViewType || StepViewType.Edit}
        allowableTypes={allowableTypes}
        onChange={values => onChange?.(this.processFormData(values))}
        initialValues={processForInitialValues(initialValues)}
        onUpdate={values => onUpdate?.(this.processFormData(values))}
        readonly={readonly}
      />
    )
  }
}
