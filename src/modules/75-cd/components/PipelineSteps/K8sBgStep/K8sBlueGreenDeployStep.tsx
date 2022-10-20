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
import { defaultTo, isEmpty } from 'lodash-es'
import { Accordion } from '@harness/uicore'
import { StepViewType, StepProps, ValidateInputSetProps, setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import type { StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import { useStrings } from 'framework/strings'
import type { K8sRollingStepInfo, StepElementConfig } from 'services/cd-ng'
import { FormMultiTypeCheckboxField } from '@common/components'
import { ALLOWED_VALUES_TYPE, ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import type { StringsMap } from 'stringTypes'
import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { TimeoutFieldInputSetView } from '@pipeline/components/InputSetView/TimeoutFieldInputSetView/TimeoutFieldInputSetView'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import pipelineVariablesCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

export interface K8sBGDeployData extends StepElementConfig {
  spec: Omit<K8sRollingStepInfo, 'skipDryRun'> & {
    skipDryRun?: boolean
  }
}

interface K8BGDeployProps {
  initialValues: K8sBGDeployData
  onUpdate?: (data: K8sBGDeployData) => void
  stepViewType?: StepViewType
  readonly?: boolean
  isNewStep?: boolean
  onChange?: (data: K8sBGDeployData) => void
  allowableTypes: AllowedTypes
  inputSetData?: {
    template?: K8sBGDeployData
    path?: string
    readonly?: boolean
  }
}

function K8BGDeployWidget(props: K8BGDeployProps, formikRef: StepFormikFowardRef<K8sBGDeployData>): React.ReactElement {
  const { initialValues, onUpdate, isNewStep = true, readonly, onChange, stepViewType, allowableTypes } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <>
      <Formik<K8sBGDeployData>
        onSubmit={(values: K8sBGDeployData) => {
          onUpdate?.(values)
        }}
        validate={(values: K8sBGDeployData) => {
          onChange?.(values)
        }}
        formName="k8BG"
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, stepViewType),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum'))
        })}
      >
        {(formik: FormikProps<K8sBGDeployData>) => {
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
                  multiTypeDurationProps={{
                    enableConfigureOptions: false,
                    expressions,
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
                    allowedValuesType={ALLOWED_VALUES_TYPE.TIME}
                  />
                )}
              </div>
              <Accordion className={stepCss.accordion}>
                <Accordion.Panel
                  id="optional-config"
                  summary={getString('common.optionalConfig')}
                  details={
                    <>
                      <div className={cx(stepCss.formGroup, stepCss.sm)}>
                        <FormMultiTypeCheckboxField
                          name="spec.skipDryRun"
                          label={getString('pipelineSteps.skipDryRun')}
                          disabled={readonly}
                          multiTypeTextbox={{
                            expressions,
                            disabled: readonly,
                            allowableTypes
                          }}
                        />
                      </div>
                      <div className={cx(stepCss.formGroup, stepCss.md)}>
                        <FormMultiTypeCheckboxField
                          multiTypeTextbox={{ expressions, allowableTypes }}
                          name="spec.pruningEnabled"
                          label={getString('cd.steps.common.enableKubernetesPruning')}
                          disabled={readonly}
                        />
                      </div>
                    </>
                  }
                />
              </Accordion>
            </>
          )
        }}
      </Formik>
    </>
  )
}

const K8BGDeployInputStep: React.FC<K8BGDeployProps> = ({ inputSetData, allowableTypes }) => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <>
      {getMultiTypeFromValue(inputSetData?.template?.timeout) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <TimeoutFieldInputSetView
            label={getString('pipelineSteps.timeoutLabel')}
            multiTypeDurationProps={{
              enableConfigureOptions: false,
              allowableTypes,
              expressions,
              disabled: inputSetData?.readonly
            }}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}timeout`}
            disabled={inputSetData?.readonly}
            fieldPath={'timeout'}
            template={inputSetData?.template}
          />
        </div>
      )}
      {getMultiTypeFromValue(inputSetData?.template?.spec?.skipDryRun) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormMultiTypeCheckboxField
            multiTypeTextbox={{
              expressions,
              allowableTypes
            }}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}spec.skipDryRun`}
            label={getString('pipelineSteps.skipDryRun')}
            disabled={inputSetData?.readonly}
            setToFalseWhenEmpty={true}
          />
        </div>
      )}
      {getMultiTypeFromValue(inputSetData?.template?.spec?.pruningEnabled) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormMultiTypeCheckboxField
            multiTypeTextbox={{
              expressions,
              allowableTypes
            }}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}spec.pruningEnabled`}
            label={getString('cd.steps.common.enableKubernetesPruning')}
            disabled={inputSetData?.readonly}
            setToFalseWhenEmpty={true}
          />
        </div>
      )}
    </>
  )
}

export interface K8BGVariableStepProps {
  initialValues: K8sBGDeployData
  stageIdentifier: string
  onUpdate?(data: K8sBGDeployData): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: K8sBGDeployData
}

const K8BGVariableStep: React.FC<K8BGVariableStepProps> = ({ variablesData, metadataMap, initialValues }) => {
  return (
    <VariablesListTable
      data={variablesData.spec}
      originalData={initialValues.spec}
      metadataMap={metadataMap}
      className={pipelineVariablesCss.variablePaddingL3}
    />
  )
}

const K8BGDeployWidgetWidgetWithRef = React.forwardRef(K8BGDeployWidget)
export class K8sBlueGreenDeployStep extends PipelineStep<K8sBGDeployData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  renderStep(props: StepProps<K8sBGDeployData>): JSX.Element {
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
        <K8BGDeployInputStep
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          inputSetData={inputSetData}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <K8BGVariableStep
          {...(customStepProps as K8BGVariableStepProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }
    return (
      <K8BGDeployWidgetWidgetWithRef
        initialValues={initialValues}
        onUpdate={onUpdate}
        isNewStep={isNewStep}
        stepViewType={defaultTo(stepViewType, StepViewType.Edit)}
        allowableTypes={allowableTypes}
        onChange={onChange}
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
  }: ValidateInputSetProps<K8sBGDeployData>): FormikErrors<K8sBGDeployData> {
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
    /* istanbul ignore else */
    if (isEmpty(errors.spec)) {
      delete errors.spec
    }

    return errors
  }
  protected type = StepType.K8sBlueGreenDeploy
  protected stepName = 'K8s Blue Green Deploy'
  protected stepIcon: IconName = 'bluegreen'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.K8sBlueGreenDeploy'
  protected isHarnessSpecific = false
  protected referenceId = 'stageDeploymentStep'

  protected defaultValues: K8sBGDeployData = {
    identifier: '',
    timeout: '10m',
    name: '',
    type: StepType.K8sBlueGreenDeploy,
    spec: {
      skipDryRun: false,
      pruningEnabled: false
    }
  }
}
