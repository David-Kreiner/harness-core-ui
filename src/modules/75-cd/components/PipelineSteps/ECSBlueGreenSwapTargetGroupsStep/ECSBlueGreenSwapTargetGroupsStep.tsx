/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { FormikErrors } from 'formik'
import { isEmpty } from 'lodash-es'
import type { AllowedTypes, IconName } from '@wings-software/uicore'

import type { StepElementConfig } from 'services/cd-ng'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import type { StringsMap } from 'framework/strings/StringsContext'
import { StepViewType, StepProps, ValidateInputSetProps, InputSetData } from '@pipeline/components/AbstractSteps/Step'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { validateGenericFields } from '../Common/GenericExecutionStep/utils'
import { ECSBlueGreenSwapTargetGroupsStepEditRef } from './ECSBlueGreenSwapTargetGroupsStepEdit'
import { GenericExecutionStepInputSet } from '../Common/GenericExecutionStep/GenericExecutionStepInputSet'
import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

export interface ECSBlueGreenSwapTargetGroupsStepValues extends StepElementConfig {
  spec: {
    doNotDownsizeOldService?: boolean | string
  }
}

export interface ECSBlueGreenSwapTargetGroupsStepProps {
  initialValues: ECSBlueGreenSwapTargetGroupsStepValues
  onUpdate?: (data: ECSBlueGreenSwapTargetGroupsStepValues) => void
  stepViewType?: StepViewType
  onChange?: (data: ECSBlueGreenSwapTargetGroupsStepValues) => void
  allowableTypes: AllowedTypes
  readonly?: boolean
  isNewStep?: boolean
}

interface ECSBlueGreenCreateServiceVariableStepProps {
  initialValues: StepElementConfig
  stageIdentifier: string
  onUpdate?(data: StepElementConfig): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: StepElementConfig
}

export class ECSBlueGreenSwapTargetGroupsStep extends PipelineStep<ECSBlueGreenSwapTargetGroupsStepValues> {
  protected type = StepType.EcsBlueGreenSwapTargetGroups
  protected stepName = 'Configure Swap Target Groups'
  protected stepIcon: IconName = 'bluegreen'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.ECSBlueGreenSwapTargetGroups'
  protected isHarnessSpecific = false
  protected defaultValues: ECSBlueGreenSwapTargetGroupsStepValues = {
    identifier: '',
    name: '',
    type: StepType.EcsBlueGreenSwapTargetGroups,
    timeout: '10m',
    spec: {
      doNotDownsizeOldService: false
    }
  }

  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  renderStep(props: StepProps<ECSBlueGreenSwapTargetGroupsStepValues>): JSX.Element {
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
        <GenericExecutionStepInputSet
          allowableTypes={allowableTypes}
          inputSetData={inputSetData as InputSetData<ECSBlueGreenSwapTargetGroupsStepValues>}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      const { variablesData, metadataMap } = customStepProps as ECSBlueGreenCreateServiceVariableStepProps
      return (
        <VariablesListTable
          className={pipelineVariableCss.variablePaddingL3}
          data={variablesData}
          originalData={initialValues}
          metadataMap={metadataMap}
        />
      )
    }

    return (
      <ECSBlueGreenSwapTargetGroupsStepEditRef
        initialValues={initialValues}
        onUpdate={onUpdate}
        isNewStep={isNewStep}
        allowableTypes={allowableTypes}
        onChange={onChange}
        stepViewType={stepViewType}
        ref={formikRef}
        readonly={readonly}
      />
    )
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<ECSBlueGreenSwapTargetGroupsStepValues>): FormikErrors<ECSBlueGreenSwapTargetGroupsStepValues> {
    const errors = validateGenericFields({
      data,
      template,
      getString,
      viewType
    })

    if (isEmpty(errors.spec)) {
      delete errors.spec
    }

    return errors as FormikErrors<ECSBlueGreenSwapTargetGroupsStepValues>
  }
}
