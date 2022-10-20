/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { getMultiTypeFromValue, IconName, MultiTypeInputType, SelectOption } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import * as Yup from 'yup'
import { FormikErrors, yupToFormErrors } from 'formik'
import { v4 as uuid } from 'uuid'
import { isArray, isEmpty, set } from 'lodash-es'

import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import type { HttpHeaderConfig, StringNGVariable } from 'services/pipeline-ng'

import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import type { StringsMap } from 'stringTypes'
import { isMultiTypeRuntime } from '@common/utils/utils'
import { httpStepType } from './HttpStepBase'
import HttpInputSetStep from './HttpInputSetStep'
import { HttpStepWidgetWithRef } from './HttpStepWidget'
import { HttpStepVariablesView, HttpStepVariablesViewProps } from './HttpStepVariablesView'
import type { HttpStepData, HttpStepFormData, HttpStepHeaderConfig, HttpStepOutputVariable } from './types'

export class HttpStep extends PipelineStep<HttpStepData> {
  constructor() {
    super()
    this._hasDelegateSelectionVisible = true
    this._hasStepVariables = true
  }

  renderStep(this: HttpStep, props: StepProps<HttpStepData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      onChange,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      allowableTypes
    } = props

    if (this.isTemplatizedView(stepViewType)) {
      return (
        <HttpInputSetStep
          initialValues={this.processInitialValues(initialValues, true)}
          onUpdate={data => onUpdate?.(this.processFormData(data))}
          stepViewType={stepViewType}
          readonly={!!inputSetData?.readonly}
          template={inputSetData?.template}
          path={inputSetData?.path || ''}
          allowableTypes={allowableTypes}
        />
      )
    }

    if (stepViewType === StepViewType.InputVariable) {
      return <HttpStepVariablesView {...(customStepProps as HttpStepVariablesViewProps)} originalData={initialValues} />
    }

    return (
      <HttpStepWidgetWithRef
        initialValues={this.processInitialValues(initialValues)}
        onUpdate={data => onUpdate?.(this.processFormData(data))}
        onChange={data => onChange?.(this.processFormData(data))}
        stepViewType={stepViewType}
        isNewStep={isNewStep}
        readonly={!!inputSetData?.readonly}
        allowableTypes={allowableTypes}
        isDisabled={readonly}
        ref={formikRef}
      />
    )
  }

  protected type = StepType.HTTP
  protected stepName = 'HTTP Step'
  protected stepIcon: IconName = 'http-step'
  protected referenceId = 'httpStep'
  protected stepIconColor = Color.GREY_700
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.HTTP'

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<HttpStepData>): FormikErrors<HttpStepData> {
    const errors: FormikErrors<HttpStepData> = { spec: {} }
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    /* istanbul ignore else */
    if (
      getMultiTypeFromValue(template?.spec?.url) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.url)
    ) {
      set(errors, 'spec.url', getString?.('fieldRequired', { field: 'URL' }))
    }

    /* istanbul ignore else */
    if (
      getMultiTypeFromValue(template?.spec?.method) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.method)
    ) {
      set(errors, 'spec.method', getString?.('fieldRequired', { field: 'Method' }))
    }

    /* istanbul ignore else */
    if (
      getMultiTypeFromValue(template?.spec?.requestBody) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.requestBody)
    ) {
      set(errors, 'spec.requestBody', getString?.('fieldRequired', { field: 'Request Body' }))
    }

    /* istanbul ignore else */
    if ((isArray(template?.spec?.headers) || isArray(template?.spec?.outputVariables)) && getString) {
      const schema = Yup.object().shape({
        spec: Yup.object().shape({
          headers: Yup.array().of(
            Yup.object().shape({
              value: Yup.string().required(getString('common.validation.valueIsRequired'))
            })
          ),
          outputVariables: Yup.array().of(
            Yup.object().shape({
              value: Yup.string().required(getString('common.validation.valueIsRequired'))
            })
          )
        })
      })
      try {
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
    if (isEmpty(errors.spec)) {
      delete errors.spec
    }

    return errors
  }

  protected defaultValues: HttpStepData = {
    identifier: '',
    name: '',
    type: StepType.HTTP,
    timeout: '10s',
    spec: {
      url: '',
      method: httpStepType[0].value as string
    }
  }

  protected isHarnessSpecific = false

  private processInitialValues(initialValues: HttpStepData, forInpuSet?: boolean): HttpStepFormData {
    const type = getMultiTypeFromValue(initialValues.spec?.method as string)
    const methodValue = initialValues.spec?.method
    return {
      ...initialValues,
      spec: {
        ...(initialValues.spec as HttpStepFormData),
        method: isMultiTypeRuntime(type)
          ? (methodValue as string)
          : type === MultiTypeInputType.EXPRESSION
          ? methodValue
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            httpStepType.find(step => step.value === (methodValue || 'GET'))!,
        headers:
          getMultiTypeFromValue(initialValues.spec?.headers as string) === MultiTypeInputType.RUNTIME
            ? (initialValues.spec?.headers as string)
            : Array.isArray(initialValues.spec?.headers)
            ? initialValues.spec.headers.map(
                (header: HttpHeaderConfig): HttpStepHeaderConfig => ({
                  ...header,
                  id: uuid()
                })
              )
            : forInpuSet
            ? undefined
            : [],
        outputVariables:
          getMultiTypeFromValue(initialValues.spec?.outputVariables as string) === MultiTypeInputType.RUNTIME
            ? (initialValues.spec?.outputVariables as string)
            : Array.isArray(initialValues.spec?.outputVariables)
            ? initialValues.spec.outputVariables.map((variable: StringNGVariable) => ({
                ...variable,
                id: uuid()
              }))
            : forInpuSet
            ? undefined
            : []
      }
    }
  }

  processFormData(data: HttpStepFormData): HttpStepData {
    return {
      ...data,
      spec: {
        ...data.spec,
        method: ((data.spec.method as SelectOption)?.value as string) || data.spec.method?.toString(),
        headers:
          getMultiTypeFromValue(data.spec.headers as string) === MultiTypeInputType.RUNTIME
            ? (data.spec.headers as string)
            : Array.isArray(data.spec.headers)
            ? data.spec.headers
                .filter((variable: HttpStepHeaderConfig) => variable.value)
                .map(({ id, ...header }: HttpStepHeaderConfig) => header)
            : undefined,
        outputVariables:
          getMultiTypeFromValue(data.spec.outputVariables as string) === MultiTypeInputType.RUNTIME
            ? (data.spec.outputVariables as string)
            : Array.isArray(data.spec.outputVariables)
            ? data.spec.outputVariables
                .filter((variable: HttpStepOutputVariable) => variable.value)
                .map(({ id, ...variable }: HttpStepOutputVariable) => variable)
            : undefined
      }
    }
  }
}
