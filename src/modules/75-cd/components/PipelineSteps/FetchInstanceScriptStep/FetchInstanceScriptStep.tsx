/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'

import {
  AllowedTypes,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  IconName,
  MultiTypeInputType
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { Color } from '@harness/design-system'

import { defaultTo, get } from 'lodash-es'
import type { FormikErrors, FormikProps } from 'formik'

import { StepViewType, StepProps, ValidateInputSetProps, setFormikRef } from '@pipeline/components/AbstractSteps/Step'

import type { StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import type { StepElementConfig } from 'services/cd-ng'

import { useStrings } from 'framework/strings'

import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'

import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import type { StringsMap } from 'stringTypes'

import { ALLOWED_VALUES_TYPE, ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import {
  FetchInstanceScriptVariableView,
  FetchInstanceScriptVariableViewProps
} from './FetchInstanceScriptVariableView'
import { FetchInstanceScriptInputStep } from './FetchInstanceScriptInputStep'
import { validateStepForm } from '../DeployInfrastructureStep/utils'

import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface FetchInstanceScriptWidgetProps {
  initialValues: StepElementConfig
  onUpdate?: (data: StepElementConfig) => void
  onChange?: (data: StepElementConfig) => void
  allowableTypes: AllowedTypes
  stepViewType?: StepViewType
  isNewStep?: boolean
  readonly?: boolean
  inputSetData?: {
    template?: StepElementConfig
    path?: string
    readonly?: boolean
  }
}

function FetchInstanceScriptWidget(
  props: FetchInstanceScriptWidgetProps,
  formikRef: StepFormikFowardRef<StepElementConfig>
): React.ReactElement {
  const { initialValues, onUpdate, isNewStep, readonly, allowableTypes, onChange, stepViewType } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  return (
    <>
      <Formik<StepElementConfig>
        onSubmit={
          /* istanbul ignore next */
          (values: StepElementConfig) => {
            /* istanbul ignore next */
            onUpdate?.(values)
          }
        }
        validate={
          /* istanbul ignore next */
          (values: StepElementConfig) => {
            /* istanbul ignore next */
            onChange?.(values)
          }
        }
        formName="fetchInstanceScriptForm"
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, stepViewType),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum'))
        })}
      >
        {(formik: FormikProps<StepElementConfig>) => {
          // this is required
          setFormikRef(formikRef, formik)

          return (
            <>
              {stepViewType !== StepViewType.Template && (
                <div className={cx(stepCss.formGroup, stepCss.lg)}>
                  <FormInput.InputWithIdentifier
                    inputLabel={getString('pipelineSteps.stepNameLabel')}
                    isIdentifierEditable={isNewStep && !readonly}
                    inputGroupProps={{
                      placeholder: getString('pipeline.stepNamePlaceholder'),
                      disabled: readonly
                    }}
                  />
                </div>
              )}
              <div className={cx(stepCss.formGroup, stepCss.sm)}>
                <FormMultiTypeDurationField
                  name="timeout"
                  label={getString('pipelineSteps.timeoutLabel')}
                  multiTypeDurationProps={{
                    enableConfigureOptions: false,
                    expressions,
                    disabled: readonly,
                    allowableTypes
                  }}
                  className={stepCss.duration}
                  disabled={readonly}
                />
                {getMultiTypeFromValue(formik.values.timeout) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    value={formik.values.timeout as string}
                    type="String"
                    variableName="step.timeout"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    // istanbul ignore next
                    onChange={
                      // istanbul ignore next
                      value => {
                        // istanbul ignore next
                        formik.setFieldValue('timeout', value)
                      }
                    }
                    isReadonly={readonly}
                    allowedValuesType={ALLOWED_VALUES_TYPE.TIME}
                  />
                )}
              </div>
            </>
          )
        }}
      </Formik>
    </>
  )
}

const FetchInstanceScriptWidgetWithRef = React.forwardRef(FetchInstanceScriptWidget)
export class FetchInstanceScript extends PipelineStep<StepElementConfig> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  renderStep(props: StepProps<StepElementConfig>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      allowableTypes,
      inputSetData,
      onChange
    } = props

    if (this.isTemplatizedView(stepViewType)) {
      return (
        <FetchInstanceScriptInputStep
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          allowableTypes={allowableTypes}
          readonly={!!get(inputSetData, 'readonly', false)}
          template={get(inputSetData, 'template', undefined)}
          path={get(inputSetData, 'path', '')}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <FetchInstanceScriptVariableView
          {...(customStepProps as FetchInstanceScriptVariableViewProps)}
          originalData={initialValues}
        />
      )
    }
    return (
      <FetchInstanceScriptWidgetWithRef
        initialValues={initialValues}
        onUpdate={onUpdate}
        isNewStep={defaultTo(isNewStep, true)}
        stepViewType={defaultTo(stepViewType, StepViewType.Edit)}
        ref={formikRef}
        readonly={readonly}
        allowableTypes={allowableTypes}
        onChange={onChange}
      />
    )
  }

  protected type = StepType.FetchInstanceScript
  protected stepName = 'Fetch Instances'
  protected stepIconColor = Color.GREY_700
  protected stepIcon: IconName = 'rolling'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.fetchInstanceScript'
  protected stepPaletteVisible = false
  protected isHarnessSpecific = false
  protected isStepNonDeletable = true

  // istanbul ignore next
  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<StepElementConfig>): FormikErrors<StepElementConfig> {
    return validateStepForm({ data, template, getString, viewType })
  }

  protected defaultValues: StepElementConfig = {
    name: '',
    identifier: '',
    type: StepType.FetchInstanceScript,
    timeout: '10m'
  }
}
