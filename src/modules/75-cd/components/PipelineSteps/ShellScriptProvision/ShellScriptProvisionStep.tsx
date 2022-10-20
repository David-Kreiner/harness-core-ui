/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import { isEmpty, set, isArray, defaultTo } from 'lodash-es'
import * as Yup from 'yup'
import { FormikErrors, yupToFormErrors } from 'formik'
import { v4 as uuid } from 'uuid'
import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'

import type { StringsMap } from 'stringTypes'
import {
  ShellScriptProvisionData,
  ShellScriptProvisionFileStore,
  ShellScriptProvisionFormData,
  ShellScriptProvisionInline,
  variableSchema
} from './types'
import { ShellScriptProvisionWidgetWithRef } from './ShellScriptProvisionWidget'
import ShellScriptProvisionInputSetStep from './ShellScriptProvisionInputSet'
import {
  ShellScriptProvisionVariablesView,
  ShellScriptProvisionVariablesViewProps
} from './ShellScriptProvisionVariableView'

export class ShellScriptProvisionStep extends PipelineStep<ShellScriptProvisionData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  renderStep(props: StepProps<ShellScriptProvisionData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      onChange,
      allowableTypes,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly
    } = props

    if (this.isTemplatizedView(stepViewType)) {
      return (
        <ShellScriptProvisionInputSetStep
          initialValues={this.getInitialValues(initialValues)}
          onUpdate={/* istanbul ignore next */ data => onUpdate?.(this.processFormData(data))}
          stepViewType={stepViewType}
          readonly={!!inputSetData?.readonly}
          template={inputSetData?.template}
          path={inputSetData?.path || ''}
          allowableTypes={allowableTypes}
          formikRef={formikRef}
        />
      )
    }

    if (stepViewType === StepViewType.InputVariable) {
      return (
        <ShellScriptProvisionVariablesView
          {...(customStepProps as ShellScriptProvisionVariablesViewProps)}
          originalData={initialValues}
        />
      )
    }

    return (
      <ShellScriptProvisionWidgetWithRef
        initialValues={this.getInitialValues(initialValues)}
        onUpdate={data => onUpdate?.(this.processFormData(data))}
        onChange={data => onChange?.(this.processFormData(data))}
        allowableTypes={allowableTypes}
        stepViewType={stepViewType}
        isNewStep={defaultTo(isNewStep, true)}
        readonly={readonly}
        ref={formikRef}
      />
    )
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<ShellScriptProvisionData>): FormikErrors<ShellScriptProvisionData> {
    const errors: FormikErrors<ShellScriptProvisionData> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
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

    /* istanbul ignore else */
    if (isArray(template?.spec?.environmentVariables) && isRequired && getString) {
      try {
        const schema = Yup.object().shape({
          spec: Yup.object().shape({
            environmentVariables: variableSchema(getString)
          })
        })
        schema.validateSync(data)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }

    /* istanbul ignore else */
    if (
      getMultiTypeFromValue((template?.spec?.source?.spec as ShellScriptProvisionInline)?.script) ===
        MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty((data?.spec?.source?.spec as ShellScriptProvisionInline)?.script)
    ) {
      set(errors, 'spec.source.spec.script', getString?.('fieldRequired', { field: 'Script' }))
    }

    /* istanbul ignore else */
    if (
      getMultiTypeFromValue((template?.spec?.source?.spec as ShellScriptProvisionFileStore)?.file) ===
        MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty((data?.spec?.source?.spec as ShellScriptProvisionFileStore)?.file)
    ) {
      set(errors, 'spec.source.spec.file', getString?.('fieldRequired', { field: 'File path' }))
    }
    return errors
  }

  protected type = StepType.ShellScriptProvision
  protected stepName = 'Shell Script Provision'
  protected stepIcon: IconName = 'script'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.ShellScriptProvision'
  protected referenceId = 'shellScriptProvisionHelpPanel' //todossp
  protected isHarnessSpecific = false
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  protected defaultValues: ShellScriptProvisionData = {
    identifier: '',
    timeout: '10m',
    name: '',
    type: StepType.ShellScriptProvision,
    spec: {
      source: {
        type: 'Inline',
        spec: {
          script: ''
        }
      }
    }
  }

  private getInitialValues(initialValues: ShellScriptProvisionData): ShellScriptProvisionFormData {
    return {
      ...initialValues,
      spec: {
        ...initialValues.spec,
        environmentVariables: Array.isArray(initialValues.spec?.environmentVariables)
          ? initialValues.spec?.environmentVariables.map(variable => ({
              ...variable,
              id: uuid()
            }))
          : []
      }
    }
  }

  processFormData(data: ShellScriptProvisionFormData): ShellScriptProvisionData {
    const modifiedData = {
      ...data,
      spec: {
        ...data.spec,
        source: {
          type: data.spec.source?.type,
          spec:
            data.spec.source?.type === 'Inline'
              ? {
                  script: (data.spec.source.spec as ShellScriptProvisionInline)?.script
                }
              : {
                  file: (data.spec.source?.spec as ShellScriptProvisionFileStore)?.file
                }
        },
        environmentVariables: Array.isArray(data.spec?.environmentVariables)
          ? data.spec?.environmentVariables.filter(variable => variable.value).map(({ id, ...variable }) => variable)
          : undefined
      }
    }
    return modifiedData
  }
}
