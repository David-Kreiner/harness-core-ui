/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { AllowedTypes, IconName } from '@wings-software/uicore'
import type { FormikErrors } from 'formik'
import type { StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { validateInputSet } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { getFormValuesInCorrectFormat } from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import type { MultiTypeMapUIType } from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { StringsMap } from 'stringTypes'
import { ChaosExperimentStepBaseWithRef } from './ChaosExperimentStepBase'
import { getInputSetViewValidateFieldsConfig, transformValuesFieldsConfig } from './ChaosExperimentStepFunctionConfigs'

export interface ChaosExperimentStepSpec {
  experimentRef: string
  expectedResilienceScore: number
}

export interface ChaosExperimentStepData {
  identifier: string
  name?: string
  description?: string
  type: string
  timeout?: string
  spec: ChaosExperimentStepSpec
}

export interface ChaosExperimentStepSpecUI extends ChaosExperimentStepSpec {
  settings?: MultiTypeMapUIType
}

// Interface for the form
export interface ChaosExperimentStepDataUI extends Omit<ChaosExperimentStepData, 'spec'> {
  spec: ChaosExperimentStepSpecUI
}

export interface ChaosExperimentStepProps {
  initialValues: ChaosExperimentStepData
  template?: ChaosExperimentStepData
  path?: string
  isNewStep?: boolean
  readonly?: boolean
  stepViewType: StepViewType
  onUpdate?: (data: ChaosExperimentStepData) => void
  onChange?: (data: ChaosExperimentStepData) => void
  allowableTypes: AllowedTypes
  formik?: any
}

export class ChaosExperimentStep extends PipelineStep<ChaosExperimentStepData> {
  constructor() {
    super()
    this._hasStepVariables = true
  }

  protected type = StepType.ChaosExperiment
  protected stepName = 'Configure Chaos Experiment'
  protected stepIcon: IconName = 'chaos-main'
  protected stepDescription: keyof StringsMap = 'chaos.pipelineStep.description'

  protected defaultValues: ChaosExperimentStepData = {
    identifier: '',
    type: StepType.ChaosExperiment as string,
    spec: {
      experimentRef: '',
      expectedResilienceScore: 50
    }
  }

  /* istanbul ignore next */
  processFormData<T>(data: T): ChaosExperimentStepData {
    return getFormValuesInCorrectFormat<T, ChaosExperimentStepData>(data, transformValuesFieldsConfig)
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<ChaosExperimentStepData>): FormikErrors<ChaosExperimentStepData> {
    if (getString) {
      return validateInputSet(data, template, getInputSetViewValidateFieldsConfig(), { getString }, viewType)
    }

    return {}
  }

  renderStep(props: StepProps<ChaosExperimentStepData>): JSX.Element {
    const { initialValues, onUpdate, stepViewType, formikRef, isNewStep, readonly, onChange, allowableTypes } = props

    if (this.isTemplatizedView(stepViewType)) {
      return <div>input set stuff</div>
    } else if (stepViewType === StepViewType.InputVariable) {
      return <div>variables stuff</div>
    }

    return (
      <ChaosExperimentStepBaseWithRef
        initialValues={initialValues}
        allowableTypes={allowableTypes}
        onChange={onChange}
        stepViewType={stepViewType || StepViewType.Edit}
        onUpdate={onUpdate}
        readonly={readonly}
        isNewStep={isNewStep}
        ref={formikRef}
      />
    )
  }
}
