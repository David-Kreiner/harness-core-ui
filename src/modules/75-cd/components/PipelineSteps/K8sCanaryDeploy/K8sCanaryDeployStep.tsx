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
  AllowedTypes
} from '@wings-software/uicore'
import * as Yup from 'yup'
import cx from 'classnames'
import { FormikErrors, FormikProps, yupToFormErrors } from 'formik'
import { defaultTo, get, has, isEmpty } from 'lodash-es'
import { StepViewType, StepProps, ValidateInputSetProps, setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import type { StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import type { K8sRollingStepInfo, StepElementConfig } from 'services/cd-ng'

import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { FormMultiTypeCheckboxField, FormInstanceDropdown } from '@common/components'
import { InstanceTypes } from '@common/constants/InstanceTypes'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'

import { useStrings } from 'framework/strings'
import { getInstanceDropdownSchema } from '@common/components/InstanceDropdownField/InstanceDropdownField'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { StringsMap } from 'stringTypes'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import pipelineVariablesCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

export interface K8sCanaryDeployData extends StepElementConfig {
  spec: Omit<K8sRollingStepInfo, 'skipDryRun'> & {
    skipDryRun?: boolean
  }
  identifier: string
}

export interface K8sCanaryDeployVariableStepProps {
  initialValues: K8sCanaryDeployData
  stageIdentifier: string
  onUpdate?(data: K8sCanaryDeployData): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: K8sCanaryDeployData
}

interface K8sCanaryDeployProps {
  initialValues: K8sCanaryDeployData
  onUpdate?: (data: K8sCanaryDeployData) => void
  onChange?: (data: K8sCanaryDeployData) => void
  allowableTypes: AllowedTypes
  stepViewType?: StepViewType
  isNewStep?: boolean
  template?: K8sCanaryDeployData
  readonly?: boolean
  path?: string
}

function K8CanaryDeployWidget(
  props: K8sCanaryDeployProps,
  formikRef: StepFormikFowardRef<K8sCanaryDeployData>
): React.ReactElement {
  const { initialValues, onUpdate, isNewStep = true, readonly, allowableTypes, stepViewType, onChange } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <>
      <Formik<K8sCanaryDeployData>
        onSubmit={(values: K8sCanaryDeployData) => {
          onUpdate?.(values)
        }}
        validate={(values: K8sCanaryDeployData) => {
          onChange?.(values)
        }}
        formName="k8CanaryDeploy"
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, stepViewType),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(
            getString('validation.timeout10SecMinimum')
          ),
          spec: Yup.object().shape({
            instanceSelection: getInstanceDropdownSchema({ required: true }, getString)
          })
        })}
      >
        {(formik: FormikProps<K8sCanaryDeployData>) => {
          const { values, setFieldValue } = formik
          setFormikRef(formikRef, formik)
          return (
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
                  disabled={readonly}
                  label={getString('pipelineSteps.timeoutLabel')}
                  className={stepCss.duration}
                  multiTypeDurationProps={{
                    expressions,
                    enableConfigureOptions: false,
                    disabled: readonly,
                    allowableTypes
                  }}
                />
                {getMultiTypeFromValue(values.timeout) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
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
                {(getMultiTypeFromValue(values?.spec?.instanceSelection?.spec?.count) === MultiTypeInputType.RUNTIME ||
                  getMultiTypeFromValue(values?.spec?.instanceSelection?.spec?.percentage) ===
                    MultiTypeInputType.RUNTIME) && (
                  <ConfigureOptions
                    value={
                      (values?.spec?.instanceSelection?.spec?.count as string) ||
                      (values?.spec?.instanceSelection?.spec?.percentage as string)
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
                <FormMultiTypeCheckboxField
                  name="spec.skipDryRun"
                  label={getString('pipelineSteps.skipDryRun')}
                  multiTypeTextbox={{ expressions, disabled: readonly, allowableTypes }}
                  disabled={readonly}
                />
              </div>
            </>
          )
        }}
      </Formik>
    </>
  )
}

const K8CanaryDeployInputStep: React.FC<K8sCanaryDeployProps> = ({ template, readonly, path, allowableTypes }) => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const prefix = isEmpty(path) ? '' : `${path}.`
  return (
    <>
      {getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME ? (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormMultiTypeDurationField
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
      {getMultiTypeFromValue(template?.spec?.skipDryRun) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormMultiTypeCheckboxField
            multiTypeTextbox={{
              expressions,
              allowableTypes
            }}
            name={`${prefix}spec.skipDryRun`}
            label={getString('pipelineSteps.skipDryRun')}
            disabled={readonly}
            setToFalseWhenEmpty={true}
          />
        </div>
      )}
      {(getMultiTypeFromValue(template?.spec?.instanceSelection?.spec?.count) === MultiTypeInputType.RUNTIME ||
        getMultiTypeFromValue(template?.spec?.instanceSelection?.spec?.percentage) === MultiTypeInputType.RUNTIME) && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInstanceDropdown
            expressions={expressions}
            label={getString('common.instanceLabel')}
            name={`${prefix}spec.instanceSelection`}
            allowableTypes={allowableTypes}
            disabledType
            readonly={readonly}
          />
        </div>
      )}
    </>
  )
}

const K8sCanaryDeployVariableStep: React.FC<K8sCanaryDeployVariableStepProps> = ({
  variablesData,
  metadataMap,
  initialValues
}) => {
  return (
    <VariablesListTable
      data={variablesData.spec}
      originalData={initialValues.spec}
      metadataMap={metadataMap}
      className={pipelineVariablesCss.variablePaddingL3}
    />
  )
}

const K8CanaryDeployWidgetWithRef = React.forwardRef(K8CanaryDeployWidget)
export class K8sCanaryDeployStep extends PipelineStep<K8sCanaryDeployData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  renderStep(props: StepProps<K8sCanaryDeployData>): JSX.Element {
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
        <K8CanaryDeployInputStep
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
        <K8sCanaryDeployVariableStep
          {...(customStepProps as K8sCanaryDeployVariableStepProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }
    return (
      <K8CanaryDeployWidgetWithRef
        initialValues={initialValues}
        onUpdate={values => onUpdate?.(this.processFormData(values))}
        isNewStep={isNewStep}
        stepViewType={defaultTo(stepViewType, StepViewType.Edit)}
        allowableTypes={allowableTypes}
        onChange={values => onChange?.(this.processFormData(values))}
        ref={formikRef}
        readonly={readonly}
      />
    )
  }

  protected type = StepType.K8sCanaryDeploy
  protected stepName = 'K8s Canary Deploy'
  protected referenceId = 'canaryDeploymentStep'
  protected stepIcon: IconName = 'canary'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.K8sCanaryDeploy'
  protected isHarnessSpecific = false

  processFormData(values: K8sCanaryDeployData): K8sCanaryDeployData {
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
  }: ValidateInputSetProps<K8sCanaryDeployData>): FormikErrors<K8sCanaryDeployData> {
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
        timeout.validateSync(data.spec)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    } else if (
      getMultiTypeFromValue(template?.spec?.instanceSelection?.spec?.count) === MultiTypeInputType.RUNTIME ||
      getMultiTypeFromValue(template?.spec?.instanceSelection?.spec?.percentage) === MultiTypeInputType.RUNTIME
    ) {
      const instanceSelection = Yup.object().shape({
        instanceSelection: getInstanceDropdownSchema(
          {
            required: true,
            requiredErrorMessage: getString?.('fieldRequired', { field: 'Instance' })
          },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          getString!
        )
      })

      try {
        instanceSelection.validateSync(data)
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
  protected defaultValues: K8sCanaryDeployData = {
    identifier: '',
    timeout: '10m',
    name: '',
    type: StepType.K8sCanaryDeploy,
    spec: {
      skipDryRun: false,
      instanceSelection: {
        type: InstanceTypes.Instances,
        spec: { count: 1 }
      }
    }
  }
}
