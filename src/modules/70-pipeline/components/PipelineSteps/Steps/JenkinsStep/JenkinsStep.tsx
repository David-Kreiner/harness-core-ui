/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, SelectOption, getMultiTypeFromValue, MultiTypeInputType, AllowedTypes } from '@wings-software/uicore'
import * as Yup from 'yup'
import { connect, FormikErrors, yupToFormErrors } from 'formik'
import { isArray, isEmpty } from 'lodash-es'
import type { StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import type {
  MultiTypeMapUIType,
  MultiTypeListUIType,
  MultiTypeConnectorRef
} from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { StringsMap } from 'stringTypes'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { JenkinsStepBaseWithRef } from './JenkinsStepBase'
import JenkinsStepInputSetBasic from './JenkinsStepInputSet'
import { JenkinsStepVariables, JenkinsStepVariablesProps } from './JenkinsStepVariables'
import type { JenkinsStepSpec, JenkinsStepData } from './types'
import { variableSchema } from './helper'

const JenkinsStepInputSet = connect(JenkinsStepInputSetBasic)
export interface JenkinsStepSpecUI
  extends Omit<JenkinsStepSpec, 'connectorRef' | 'tags' | 'labels' | 'buildArgs' | 'pull' | 'resources'> {
  connectorRef: MultiTypeConnectorRef
  tags: MultiTypeListUIType
  labels?: MultiTypeMapUIType
  buildArgs?: MultiTypeMapUIType
}

// Interface for the form
export interface JenkinsStepDataUI extends Omit<JenkinsStepData, 'spec'> {
  spec: JenkinsStepSpecUI
}

export interface JenkinsStepProps {
  initialValues: JenkinsStepData
  template?: JenkinsStepData
  path?: string
  readonly?: boolean
  isNewStep?: boolean
  stepViewType: StepViewType
  onUpdate?: (data: JenkinsStepData) => void
  onChange?: (data: JenkinsStepData) => void
  allowableTypes: AllowedTypes
  formik?: any
}

export class JenkinsStep extends PipelineStep<JenkinsStepData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this.invocationMap = new Map()
  }

  protected type = StepType.JenkinsBuild
  protected stepName = 'Jenkins'
  protected stepIcon: IconName = 'service-jenkins'
  // to be edited in strings.en.yaml file in future
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.Jenkins'
  protected stepPaletteVisible = false

  protected defaultValues: JenkinsStepData = {
    identifier: '',
    type: StepType.JenkinsBuild as string,
    spec: {
      connectorRef: '',
      jobName: '',
      jobParameter: [],
      delegateSelectors: [],
      unstableStatusAsSuccess: false,
      useConnectorUrlForJobExecution: false
    }
  }

  /* istanbul ignore next */
  processFormData(data: any): JenkinsStepData {
    return {
      ...data,
      spec: {
        ...data.spec,
        connectorRef:
          getMultiTypeFromValue(data.spec.connectorRef as SelectOption) === MultiTypeInputType.FIXED
            ? (data.spec.connectorRef as SelectOption)?.value?.toString()
            : data.spec.connectorRef,
        jobName:
          ((data.spec.jobName as unknown as SelectOption).label as string) || (data.spec.jobName as unknown as string)
      }
    }
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<JenkinsStepData>): FormikErrors<JenkinsStepData> {
    const errors: FormikErrors<JenkinsStepData> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
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

    if (
      typeof template?.spec?.connectorRef === 'string' &&
      getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.connectorRef)
    ) {
      errors.spec = {
        connectorRef: getString?.('common.validation.connectorRef')
      }
    }

    if (
      typeof template?.spec?.jobName === 'string' &&
      getMultiTypeFromValue(template?.spec?.jobName) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.jobName)
    ) {
      errors.spec = {
        jobName: getString?.('pipeline.jenkinsStep.validations.jobName')
      }
    }

    /* istanbul ignore else */
    if (isArray(template?.spec?.jobParameter) && getString) {
      try {
        const schema = Yup.object().shape({
          spec: Yup.object().shape({
            jobParameter: variableSchema(getString)
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

    return errors
  }

  renderStep(props: StepProps<JenkinsStepData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      onChange,
      allowableTypes
    } = props

    if (this.isTemplatizedView(stepViewType)) {
      return (
        <JenkinsStepInputSet
          initialValues={initialValues}
          template={inputSetData?.template}
          path={inputSetData?.path || ''}
          inputSetData={inputSetData}
          readonly={!!inputSetData?.readonly}
          stepViewType={stepViewType}
          onUpdate={(values: any) => onUpdate?.(this.processFormData(values))}
          onChange={(values: any) => onChange?.(this.processFormData(values))}
          ref={formikRef}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <JenkinsStepVariables
          {...(customStepProps as JenkinsStepVariablesProps)}
          initialValues={initialValues}
          onUpdate={(values: any) => onUpdate?.(this.processFormData(values))}
        />
      )
    }

    return (
      <JenkinsStepBaseWithRef
        initialValues={initialValues}
        allowableTypes={allowableTypes}
        onChange={(values: any) => onChange?.(this.processFormData(values))}
        stepViewType={stepViewType || StepViewType.Edit}
        onUpdate={(values: any) => onUpdate?.(this.processFormData(values))}
        ref={formikRef}
        isNewStep={isNewStep}
        readonly={readonly}
      />
    )
  }
}
