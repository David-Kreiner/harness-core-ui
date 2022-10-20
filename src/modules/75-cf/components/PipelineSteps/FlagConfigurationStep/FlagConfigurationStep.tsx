/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement } from 'react'
import { IconName, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'

import type { FormikErrors } from 'formik'
import { isEmpty, set } from 'lodash-es'
import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'

import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import type { StepElementConfig } from 'services/cd-ng'
import type { StringsMap } from 'stringTypes'
import FlagConfigurationInputSetStep from './FlagConfigurationInputSetStep'
import {
  FlagConfigurationStepVariablesView,
  FlagConfigurationStepVariablesViewProps
} from './FlagConfigurationStepVariablesView'
import type { FlagConfigurationStepData } from './types'
import FlagConfigurationStepWidget, { FlagConfigurationStepWidgetProps } from './FlagConfigurationStepWidget'

export class FlagConfigurationStep extends PipelineStep<FlagConfigurationStepData> {
  protected type = StepType.FlagConfiguration
  protected stepName = 'Flag Configuration'
  protected stepIcon: IconName = 'flag'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.FlagConfiguration'
  protected isHarnessSpecific = false

  renderStep(props: StepProps<FlagConfigurationStepData>): ReactElement {
    switch (props.stepViewType) {
      case StepViewType.DeploymentForm:
      case StepViewType.InputSet:
        return FlagConfigurationStep.renderInputSetView(props)

      case StepViewType.InputVariable:
        return FlagConfigurationStep.renderVariablesView(props)

      default:
        return FlagConfigurationStep.renderWidgetView(props)
    }
  }

  private static renderInputSetView({
    inputSetData,
    stepViewType,
    readonly
  }: StepProps<FlagConfigurationStepData>): ReactElement {
    return (
      <FlagConfigurationInputSetStep
        existingValues={inputSetData?.allValues}
        stepViewType={stepViewType}
        readonly={readonly}
        template={inputSetData?.template}
        pathPrefix={inputSetData?.path || ''}
      />
    )
  }

  private static renderVariablesView({
    customStepProps,
    initialValues
  }: StepProps<FlagConfigurationStepData>): ReactElement {
    return (
      <FlagConfigurationStepVariablesView
        {...(customStepProps as FlagConfigurationStepVariablesViewProps)}
        originalData={initialValues}
      />
    )
  }

  private static renderWidgetView({
    initialValues,
    onUpdate,
    stepViewType,
    isNewStep,
    readonly,
    formikRef
  }: StepProps<FlagConfigurationStepData>): ReactElement {
    return (
      <FlagConfigurationStepWidget
        initialValues={initialValues}
        onUpdate={onUpdate as FlagConfigurationStepWidgetProps['onUpdate']}
        stepViewType={stepViewType}
        isNewStep={isNewStep}
        readonly={readonly}
        ref={formikRef}
      />
    )
  }

  validateInputSet({
    data,
    template,
    getString
  }: ValidateInputSetProps<FlagConfigurationStepData>): FormikErrors<FlagConfigurationStepData> {
    const errors: FormikErrors<FlagConfigurationStepData> = {}

    if (template?.spec?.feature === RUNTIME_INPUT_VALUE && isEmpty(data?.spec?.feature)) {
      set(errors, 'spec.feature', getString?.('fieldRequired', { field: 'feature' }))
    }

    if (template?.spec?.instructions === RUNTIME_INPUT_VALUE && isEmpty(data?.spec?.instructions)) {
      set(errors, 'spec.instructions', getString?.('fieldRequired', { field: 'instructions' }))
    }

    return errors
  }

  protected defaultValues: FlagConfigurationStepData = {
    identifier: '',
    name: '',
    type: '',
    timeout: '10m',
    spec: {
      feature: '',
      environment: ''
    }
  }

  processFormData(data: StepElementConfig): FlagConfigurationStepData {
    return data as FlagConfigurationStepData
  }
}
