/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { AllowedTypes, Formik, FormInput, getMultiTypeFromValue, IconName, MultiTypeInputType } from '@harness/uicore'
import * as Yup from 'yup'
import cx from 'classnames'

import { isEmpty } from 'lodash-es'
import { FormikErrors, FormikProps, yupToFormErrors } from 'formik'
import { PipelineStep, StepProps } from '@pipeline/components/PipelineSteps/PipelineStep'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { useStrings } from 'framework/strings'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import {
  StepFormikFowardRef,
  setFormikRef,
  StepViewType,
  ValidateInputSetProps
} from '@pipeline/components/AbstractSteps/Step'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { ALLOWED_VALUES_TYPE, ConfigureOptions, VALIDATORS } from '@common/components/ConfigureOptions/ConfigureOptions'
import { IdentifierSchemaWithOutName } from '@common/utils/Validation'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import type { StringsMap } from 'stringTypes'
import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { TextFieldInputSetView } from '@pipeline/components/InputSetView/TextFieldInputSetView/TextFieldInputSetView'
import { TimeoutFieldInputSetView } from '@pipeline/components/InputSetView/TimeoutFieldInputSetView/TimeoutFieldInputSetView'
import { isExecutionTimeFieldDisabled } from '@pipeline/utils/runPipelineUtils'
import type { TFRollbackData } from '../Common/Terraform/TerraformInterfaces'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

interface TerraformRollbackProps {
  initialValues: TFRollbackData
  onUpdate?: (data: TFRollbackData) => void
  onChange?: (data: TFRollbackData) => void
  allowableTypes: AllowedTypes
  stepViewType?: StepViewType
  isNewStep?: boolean
  inputSetData?: {
    template?: TFRollbackData
    path?: string
  }
  readonly?: boolean
}

export interface TerraformRollbackVariableStepProps {
  initialValues: TFRollbackData
  stageIdentifier: string
  onUpdate?(data: TFRollbackData): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: TFRollbackData
}

const setInitialValues = (data: TFRollbackData): TFRollbackData => {
  return {
    ...data,
    spec: {
      ...data.spec,
      provisionerIdentifier: data?.spec?.provisionerIdentifier
    }
  }
}
function TerraformRollbackWidget(
  props: TerraformRollbackProps,
  formikRef: StepFormikFowardRef<TFRollbackData>
): React.ReactElement {
  const { initialValues, onUpdate, onChange, allowableTypes, stepViewType, isNewStep = true, readonly = false } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  return (
    <>
      <Formik<TFRollbackData>
        /* isanbul ignore next */
        onSubmit={(values: TFRollbackData) => {
          onUpdate?.(values)
        }}
        validate={(values: TFRollbackData) => {
          onChange?.(values)
        }}
        formName="terraformRollback"
        initialValues={setInitialValues(initialValues)}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, stepViewType),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(
            getString('validation.timeout10SecMinimum')
          ),

          spec: Yup.object().shape({
            provisionerIdentifier: Yup.lazy((value): Yup.Schema<unknown> => {
              if (getMultiTypeFromValue(value as any) === MultiTypeInputType.FIXED) {
                return IdentifierSchemaWithOutName(getString, {
                  requiredErrorMsg: getString('common.validation.provisionerIdentifierIsRequired'),
                  regexErrorMsg: getString('common.validation.provisionerIdentifierPatternIsNotValid')
                })
              }
              return Yup.string().required(getString('common.validation.provisionerIdentifierIsRequired'))
            })
          })
        })}
      >
        {(formik: FormikProps<TFRollbackData>) => {
          const { values, setFieldValue } = formik
          setFormikRef(formikRef, formik)

          return (
            <>
              {stepViewType !== StepViewType.Template && (
                <div className={cx(stepCss.formGroup, stepCss.lg)}>
                  <FormInput.InputWithIdentifier
                    inputLabel={getString('name')}
                    isIdentifierEditable={isNewStep}
                    inputGroupProps={{
                      placeholder: getString('pipeline.stepNamePlaceholder'),
                      disabled: readonly
                    }}
                  />
                </div>
              )}

              <div className={cx(stepCss.formGroup, stepCss.md)}>
                <FormMultiTypeDurationField
                  name="timeout"
                  label={getString('pipelineSteps.timeoutLabel')}
                  multiTypeDurationProps={{ enableConfigureOptions: false, expressions, allowableTypes }}
                  disabled={readonly}
                />
                {getMultiTypeFromValue(values.timeout) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    allowedValuesType={ALLOWED_VALUES_TYPE.TIME}
                    allowedValuesValidator={VALIDATORS[ALLOWED_VALUES_TYPE.TIME]({ minimum: '10s' })}
                    value={values.timeout as string}
                    type="String"
                    variableName="step.timeout"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      /* istanbul ignore next */
                      setFieldValue('timeout', value)
                    }}
                    isReadonly={readonly}
                  />
                )}
              </div>
              <div className={stepCss.divider} />
              <div className={cx(stepCss.formGroup, stepCss.md)}>
                <FormInput.MultiTextInput
                  name="spec.provisionerIdentifier"
                  placeholder={getString('pipeline.terraformStep.provisionerIdentifier')}
                  label={getString('pipelineSteps.provisionerIdentifier')}
                  multiTextInputProps={{ expressions, allowableTypes }}
                  disabled={readonly}
                />
                {getMultiTypeFromValue(values.spec.provisionerIdentifier) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    allowedValuesType={ALLOWED_VALUES_TYPE.TEXT}
                    value={values.spec.provisionerIdentifier}
                    type="String"
                    variableName="spec.provisionerIdentifier"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      /* istanbul ignore next */
                      setFieldValue('spec.provisionerIdentifier', value)
                    }}
                    isReadonly={readonly}
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

const TerraformRollbackInputStep: React.FC<TerraformRollbackProps> = ({
  inputSetData,
  readonly,
  allowableTypes,
  stepViewType
}) => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <>
      {getMultiTypeFromValue(inputSetData?.template?.timeout) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <TimeoutFieldInputSetView
            template={inputSetData?.template}
            fieldPath={'timeout'}
            multiTypeDurationProps={{
              configureOptionsProps: {
                isExecutionTimeFieldDisabled: isExecutionTimeFieldDisabled(stepViewType)
              },
              allowableTypes,
              expressions,
              disabled: readonly
            }}
            label={getString('pipelineSteps.timeoutLabel')}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}timeout`}
            disabled={readonly}
          />
        </div>
      )}
      {getMultiTypeFromValue(inputSetData?.template?.spec?.provisionerIdentifier) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <TextFieldInputSetView
            template={inputSetData?.template}
            fieldPath={'spec.provisionerIdentifier'}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}spec.provisionerIdentifier`}
            placeholder={getString('pipeline.terraformStep.provisionerIdentifier')}
            label={getString('pipelineSteps.provisionerIdentifier')}
            disabled={readonly}
            multiTextInputProps={{
              expressions,
              disabled: readonly,
              allowableTypes
            }}
            configureOptionsProps={{
              isExecutionTimeFieldDisabled: isExecutionTimeFieldDisabled(stepViewType)
            }}
          />
        </div>
      )}
    </>
  )
}

const TerraformRollbackVariableStep: React.FC<TerraformRollbackVariableStepProps> = ({
  variablesData,
  metadataMap,
  initialValues
}) => {
  return (
    <VariablesListTable
      className={pipelineVariableCss.variablePaddingL3}
      data={variablesData.spec}
      originalData={initialValues.spec}
      metadataMap={metadataMap}
    />
  )
}

const TerraformRollbackWidgetWithRef = React.forwardRef(TerraformRollbackWidget)

export class TerraformRollback extends PipelineStep<TFRollbackData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  protected type = StepType.TerraformRollback
  protected defaultValues: TFRollbackData = {
    identifier: '',
    name: '',
    type: StepType.TerraformRollback,
    timeout: '10m',
    spec: {
      provisionerIdentifier: '',
      delegateSelectors: []
    }
  }
  protected stepIcon: IconName = 'terraform-rollback'
  protected stepName = 'Terraform Rollback'
  protected referenceId = 'terraformRollbackStep'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.TerraformRollback'

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<TFRollbackData>): FormikErrors<TFRollbackData> {
    const errors = {} as any
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
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }

    if (isEmpty(errors.spec)) {
      delete errors.spec
    }

    return errors
  }
  renderStep(props: StepProps<TFRollbackData, unknown>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      onChange,
      allowableTypes,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep
    } = props
    if (this.isTemplatizedView(stepViewType)) {
      return (
        <TerraformRollbackInputStep
          initialValues={initialValues}
          onUpdate={onUpdate}
          onChange={onChange}
          allowableTypes={allowableTypes}
          stepViewType={stepViewType}
          readonly={inputSetData?.readonly}
          inputSetData={inputSetData}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <TerraformRollbackVariableStep
          {...(customStepProps as TerraformRollbackVariableStepProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }
    return (
      <TerraformRollbackWidgetWithRef
        initialValues={initialValues}
        onUpdate={onUpdate}
        onChange={onChange}
        allowableTypes={allowableTypes}
        isNewStep={isNewStep}
        stepViewType={stepViewType}
        ref={formikRef}
        readonly={props.readonly}
      />
    )
  }
}
