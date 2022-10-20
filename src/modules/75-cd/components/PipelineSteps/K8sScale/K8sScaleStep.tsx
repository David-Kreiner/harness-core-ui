/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  IconName,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  MultiTypeInputType,
  SelectOption,
  MultiSelectOption,
  AllowedTypes
} from '@wings-software/uicore'
import cx from 'classnames'
import * as Yup from 'yup'
import { FormikErrors, FormikProps, yupToFormErrors } from 'formik'
import { defaultTo, get, has, isEmpty } from 'lodash-es'
import { StepViewType, StepProps, ValidateInputSetProps, setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import type { StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'

import type { CountInstanceSelection, K8sScaleStepInfo, StepElementConfig } from 'services/cd-ng'

import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { FormInstanceDropdown, FormMultiTypeCheckboxField } from '@common/components'
import { InstanceTypes } from '@common/constants/InstanceTypes'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { ALLOWED_VALUES_TYPE, ConfigureOptions, VALIDATORS } from '@common/components/ConfigureOptions/ConfigureOptions'

import { useStrings } from 'framework/strings'
import { getInstanceDropdownSchema } from '@common/components/InstanceDropdownField/InstanceDropdownField'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'

import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { StringsMap } from 'stringTypes'
import { TextFieldInputSetView } from '@pipeline/components/InputSetView/TextFieldInputSetView/TextFieldInputSetView'
import { TimeoutFieldInputSetView } from '@pipeline/components/InputSetView/TimeoutFieldInputSetView/TimeoutFieldInputSetView'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import pipelineVariablesCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

export interface K8sScaleData extends StepElementConfig {
  spec: Omit<K8sScaleStepInfo, 'skipSteadyStateCheck'> & { skipSteadyStateCheck: boolean }
  identifier: string
}
export interface PercentageInstanceSelectionK8 {
  percentage: string | boolean | SelectOption | MultiSelectOption[] | undefined
}

export interface K8sScaleVariableStepProps {
  initialValues: K8sScaleData
  stageIdentifier: string
  onUpdate?(data: K8sScaleData): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: K8sScaleData
}

interface K8sScaleProps {
  initialValues: K8sScaleData
  onUpdate?: (data: K8sScaleData) => void
  onChange?: (data: K8sScaleData) => void
  allowableTypes: AllowedTypes
  stepViewType?: StepViewType
  isNewStep?: boolean
  template?: K8sScaleData
  readonly?: boolean
  path?: string
}

function K8ScaleDeployWidget(props: K8sScaleProps, formikRef: StepFormikFowardRef<K8sScaleData>): React.ReactElement {
  const { initialValues, onUpdate, isNewStep = true, readonly, allowableTypes, stepViewType, onChange } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <>
      <Formik<K8sScaleData>
        onSubmit={(values: K8sScaleData) => {
          onUpdate?.(values)
        }}
        validate={(values: K8sScaleData) => {
          onChange?.(values)
        }}
        formName="k8Scale"
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, stepViewType),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(
            getString('validation.timeout10SecMinimum')
          ),
          spec: Yup.object().shape({
            instanceSelection: getInstanceDropdownSchema({ required: true }, getString),
            workload: Yup.string().required(getString('cd.workloadRequired'))
          })
        })}
      >
        {(formik: FormikProps<K8sScaleData>) => {
          const { values, setFieldValue } = formik
          setFormikRef(formikRef, formik)
          return (
            <>
              <>
                {stepViewType === StepViewType.Template ? null : (
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
                <div className={cx(stepCss.formGroup, stepCss.sm)}>
                  <FormMultiTypeDurationField
                    name="timeout"
                    label={getString('pipelineSteps.timeoutLabel')}
                    className={stepCss.duration}
                    disabled={readonly}
                    multiTypeDurationProps={{
                      expressions,
                      enableConfigureOptions: false,
                      disabled: readonly,
                      allowableTypes
                    }}
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
                        setFieldValue('timeout', value)
                      }}
                      isReadonly={readonly}
                    />
                  )}
                </div>

                <div className={stepCss.divider} />
                <div className={cx(stepCss.formGroup, stepCss.md)}>
                  <FormInstanceDropdown
                    name={'spec.instanceSelection'}
                    label={getString('common.instanceLabel')}
                    readonly={readonly}
                    expressions={expressions}
                    allowableTypes={allowableTypes}
                  />
                  {(getMultiTypeFromValue(
                    (values?.spec?.instanceSelection?.spec as CountInstanceSelection | undefined)?.count as any
                  ) === MultiTypeInputType.RUNTIME ||
                    getMultiTypeFromValue(
                      (values?.spec?.instanceSelection?.spec as PercentageInstanceSelectionK8 | undefined)?.percentage
                    ) === MultiTypeInputType.RUNTIME) && (
                    <ConfigureOptions
                      value={
                        ((values?.spec?.instanceSelection?.spec as CountInstanceSelection | undefined)
                          ?.count as string) ||
                        ((values?.spec?.instanceSelection?.spec as PercentageInstanceSelectionK8 | undefined)
                          ?.percentage as string)
                      }
                      type="String"
                      variableName={getString('instanceFieldOptions.instances')}
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => {
                        setFieldValue('instances', value)
                      }}
                      isReadonly={readonly}
                    />
                  )}
                </div>

                <div className={cx(stepCss.formGroup, stepCss.md)}>
                  <FormInput.MultiTextInput
                    label={getString('pipelineSteps.workload')}
                    placeholder={getString('pipeline.kubernetesStep.workload')}
                    name={'spec.workload'}
                    disabled={readonly}
                    multiTextInputProps={{ expressions, disabled: readonly, allowableTypes }}
                  />
                  {getMultiTypeFromValue(values.spec.workload) === MultiTypeInputType.RUNTIME && (
                    <ConfigureOptions
                      allowedValuesType={ALLOWED_VALUES_TYPE.TEXT}
                      value={values.spec.workload as string}
                      type="String"
                      variableName={getString('pipelineSteps.workload').toLowerCase()}
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => {
                        setFieldValue('spec.workload', value)
                      }}
                      isReadonly={readonly}
                    />
                  )}
                </div>

                <div className={cx(stepCss.formGroup, stepCss.md)}>
                  <FormMultiTypeCheckboxField
                    name="spec.skipSteadyStateCheck"
                    label={getString('pipelineSteps.skipSteadyStateCheck')}
                    multiTypeTextbox={{ expressions, disabled: readonly, allowableTypes }}
                    disabled={readonly}
                  />
                </div>
              </>
            </>
          )
        }}
      </Formik>
    </>
  )
}

const K8ScaleInputStep: React.FC<K8sScaleProps> = ({ template, readonly, path, allowableTypes }) => {
  const { getString } = useStrings()
  const prefix = isEmpty(path) ? '' : `${path}.`
  const { expressions } = useVariablesExpression()
  return (
    <>
      {getMultiTypeFromValue(template?.spec?.workload) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <TextFieldInputSetView
            template={template}
            fieldPath={'spec.workload'}
            name={`${prefix}spec.workload`}
            placeholder={getString('pipeline.kubernetesStep.workload')}
            label={getString('pipelineSteps.workload')}
            disabled={readonly}
            multiTextInputProps={{
              expressions,
              disabled: readonly,
              allowableTypes
            }}
          />
        </div>
      )}
      {getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME ? (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <TimeoutFieldInputSetView
            template={template}
            fieldPath={'timeout'}
            multiTypeDurationProps={{
              enableConfigureOptions: false,
              allowableTypes,
              expressions,
              disabled: readonly
            }}
            label={getString('pipelineSteps.timeoutLabel')}
            name={`${prefix}timeout`}
            disabled={readonly}
          />
        </div>
      ) : null}
      {(getMultiTypeFromValue(
        (template?.spec?.instanceSelection?.spec as CountInstanceSelection | undefined)?.count as any
      ) === MultiTypeInputType.RUNTIME ||
        getMultiTypeFromValue(
          (template?.spec?.instanceSelection?.spec as PercentageInstanceSelectionK8 | undefined)?.percentage
        ) === MultiTypeInputType.RUNTIME) && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInstanceDropdown
            label={getString('common.instanceLabel')}
            name={`${prefix}spec.instanceSelection`}
            expressions={expressions}
            allowableTypes={allowableTypes}
            disabledType
            readonly={readonly}
          />
        </div>
      )}
      {getMultiTypeFromValue(template?.spec?.skipSteadyStateCheck) === MultiTypeInputType.RUNTIME && (
        <FormInput.CheckBox
          name={`${prefix}spec.skipSteadyStateCheck`}
          className={stepCss.checkbox}
          label={getString('pipelineSteps.skipSteadyStateCheck')}
          disabled={readonly}
        />
      )}
    </>
  )
}

const K8sScaleVariableStep: React.FC<K8sScaleVariableStepProps> = ({ variablesData, metadataMap, initialValues }) => {
  return (
    <VariablesListTable
      data={variablesData.spec}
      originalData={initialValues.spec}
      metadataMap={metadataMap}
      className={pipelineVariablesCss.variablePaddingL3}
    />
  )
}

const K8ScaleDeployWidgetWithRef = React.forwardRef(K8ScaleDeployWidget)
export class K8sScaleStep extends PipelineStep<K8sScaleData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  renderStep(props: StepProps<K8sScaleData>): JSX.Element {
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
        <K8ScaleInputStep
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          template={inputSetData?.template}
          readonly={inputSetData?.readonly}
          path={inputSetData?.path}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <K8sScaleVariableStep
          {...(customStepProps as K8sScaleVariableStepProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }
    return (
      <K8ScaleDeployWidgetWithRef
        initialValues={initialValues}
        isNewStep={isNewStep}
        onUpdate={values => onUpdate?.(this.processFormData(values))}
        stepViewType={defaultTo(stepViewType, StepViewType.Edit)}
        ref={formikRef}
        readonly={readonly}
        allowableTypes={allowableTypes}
        onChange={values => onChange?.(this.processFormData(values))}
      />
    )
  }

  protected type = StepType.K8sScale
  protected stepName = 'K8s Scale'
  protected referenceId = 'K8sScaleStep'
  protected stepIcon: IconName = 'swap-vertical'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.K8sScale'
  protected isHarnessSpecific = false

  processFormData(values: K8sScaleData): K8sScaleData {
    if (
      get(values, 'spec.instanceSelection.type') === InstanceTypes.Instances &&
      has(values, 'spec.instanceSelection.spec.percentage')
    ) {
      delete values.spec.instanceSelection.spec.percentage
    }
    if (
      get(values, 'spec.instanceSelection.type') === InstanceTypes.Percentage &&
      has(values, 'spec.instanceSelection.spec.count')
    ) {
      delete values.spec.instanceSelection.spec.count
    }

    return values
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<K8sScaleData>): FormikErrors<K8sScaleData> {
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = { spec: {} } as any
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
    if (
      getMultiTypeFromValue(
        (template?.spec?.instanceSelection?.spec as CountInstanceSelection | undefined)?.count as any
      ) === MultiTypeInputType.RUNTIME ||
      getMultiTypeFromValue(
        (template?.spec?.instanceSelection?.spec as PercentageInstanceSelectionK8 | undefined)?.percentage
      ) === MultiTypeInputType.RUNTIME
    ) {
      const instanceSelection = Yup.object().shape({
        instanceSelection: getInstanceDropdownSchema(
          {
            required: isRequired,
            requiredErrorMessage: getString?.('fieldRequired', { field: 'Instance' })
          },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          getString!
        )
      })

      try {
        instanceSelection.validateSync(data.spec)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors.spec, err)
        }
      }
    }
    /* istanbul ignore else */
    if (isEmpty(errors.spec)) {
      delete errors.spec
    }
    return errors
  }
  protected defaultValues: K8sScaleData = {
    identifier: '',
    timeout: '10m',
    name: '',
    type: StepType.K8sScale,
    spec: {
      workload: '',
      skipSteadyStateCheck: false,
      instanceSelection: { type: InstanceTypes.Instances, spec: { count: 1 } as any }
    }
  }
}
