/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { FormikErrors } from 'formik'
import { isEmpty } from 'lodash-es'
import type { IconName } from '@wings-software/uicore'

import type { StoreConfigWrapper, StepElementConfig } from 'services/cd-ng'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import type { StringsMap } from 'framework/strings/StringsContext'
import { StepViewType, StepProps, ValidateInputSetProps, InputSetData } from '@pipeline/components/AbstractSteps/Step'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { validateGenericFields } from '../Common/GenericExecutionStep/utils'
import { ECSRunTaskStepEditRef } from './ECSRunTaskStepEdit'
import { ECSRunTaskStepInputSetMode } from './ECSRunTaskStepInputSet'
import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

export interface ECSRunTaskStepInitialValues extends StepElementConfig {
  spec: {
    taskDefinition?: StoreConfigWrapper
    runTaskRequestDefinition?: StoreConfigWrapper
    skipSteadyStateCheck?: boolean
  }
}

interface ECSRunTaskVariableStepProps {
  initialValues: ECSRunTaskStepInitialValues
  stageIdentifier: string
  onUpdate?(data: ECSRunTaskStepInitialValues): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: ECSRunTaskStepInitialValues
}

export class ECSRunTaskStep extends PipelineStep<ECSRunTaskStepInitialValues> {
  protected type = StepType.EcsRunTask
  protected stepName = 'Configure ECS Run Task'
  protected stepIcon: IconName = 'command-shell-script'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.ECSRunTask'
  protected isHarnessSpecific = false
  protected defaultValues: ECSRunTaskStepInitialValues = {
    identifier: '',
    name: '',
    type: StepType.EcsRunTask,
    timeout: '10m',
    spec: {
      skipSteadyStateCheck: false
    }
  }

  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  renderStep(props: StepProps<ECSRunTaskStepInitialValues>): JSX.Element {
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
        <ECSRunTaskStepInputSetMode
          initialValues={initialValues}
          allowableTypes={allowableTypes}
          inputSetData={inputSetData as InputSetData<ECSRunTaskStepInitialValues>}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      const { variablesData, metadataMap } = customStepProps as ECSRunTaskVariableStepProps
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
      <ECSRunTaskStepEditRef
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
  }: ValidateInputSetProps<ECSRunTaskStepInitialValues>): FormikErrors<ECSRunTaskStepInitialValues> {
    const errors = validateGenericFields({
      data,
      template,
      getString,
      viewType
    }) as FormikErrors<ECSRunTaskStepInitialValues>

    if (isEmpty(errors.spec)) {
      delete errors.spec
    }

    return errors
  }
}
