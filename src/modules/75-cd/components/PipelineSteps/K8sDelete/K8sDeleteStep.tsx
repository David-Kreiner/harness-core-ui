/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  ButtonVariation,
  Container,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  IconName,
  Layout,
  MultiTypeInputType,
  Text,
  Icon,
  AllowedTypes
} from '@wings-software/uicore'
import { Intent, FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { FieldArray, FormikErrors, FormikProps, yupToFormErrors } from 'formik'
import { v4 as uuid } from 'uuid'
import type { IOptionProps } from '@blueprintjs/core'
import * as Yup from 'yup'
import { defaultTo, isEmpty, unset } from 'lodash-es'
import {
  StepFormikFowardRef,
  setFormikRef,
  StepProps,
  StepViewType,
  ValidateInputSetProps
} from '@pipeline/components/AbstractSteps/Step'
import type { StepElementConfig } from 'services/cd-ng'

import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { FormMultiTypeCheckboxField } from '@common/components'
import { ALLOWED_VALUES_TYPE, ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useStrings } from 'framework/strings'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'

import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import List from '@common/components/List/List'
import type { StringsMap } from 'stringTypes'
import { isMultiTypeRuntime } from '@common/utils/utils'
import { TimeoutFieldInputSetView } from '@pipeline/components/InputSetView/TimeoutFieldInputSetView/TimeoutFieldInputSetView'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './K8sDelete.module.scss'
import pipelineVariablesCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

const DeleteSpecConstant = {
  ResourceName: 'ResourceName',
  ReleaseName: 'ReleaseName',
  ManifestPath: 'ManifestPath'
}

interface K8sDeleteFormSpec {
  resourceNames?: string[] | K8sDeleteConfigHeader[]
  deleteNamespace?: boolean
  manifestPaths?: string[] | K8sDeleteConfigHeader[]
  skipDryRun?: boolean
}
interface K8sDeleteSpec {
  resourceNames?: K8sDeleteConfigHeader[] | string
  deleteNamespace?: boolean
  manifestPaths?: K8sDeleteConfigHeader[] | string
  skipDryRun?: boolean
}

interface K8sDeleteConfigHeader {
  id: string
  value: string
}

export interface K8sDeleteData extends StepElementConfig {
  spec: {
    deleteResources: {
      type?: string
      spec: K8sDeleteSpec
    }
  }
}

export interface K8sDeleteFormData extends StepElementConfig {
  spec: {
    deleteResources: {
      type?: string
      spec: K8sDeleteFormSpec
    }
  }
}

export interface K8sDeleteVariableStepProps {
  initialValues: K8sDeleteData
  stageIdentifier: string
  onUpdate?: (data: K8sDeleteData) => void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: K8sDeleteData
}

interface K8sDeleteProps {
  initialValues: K8sDeleteData
  onUpdate?: (data: K8sDeleteData) => void
  onChange?: (data: K8sDeleteData) => void
  allowableTypes: AllowedTypes
  isDisabled?: boolean
  stepViewType?: StepViewType
  isNewStep?: boolean
  inputSetData?: {
    template?: K8sDeleteData
    path?: string
  }
  readonly?: boolean
}

function K8sDeleteDeployWidget(props: K8sDeleteProps, formikRef: StepFormikFowardRef): React.ReactElement {
  const {
    initialValues,
    onUpdate,
    isNewStep = true,
    isDisabled,
    allowableTypes,
    onChange: onFormChange,
    stepViewType
  } = props
  const { getString } = useStrings()

  const accessTypeOptions = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const options: IOptionProps[] = [
      {
        label: getString('auditTrail.resourceNameLabel'),
        value: getString('pipelineSteps.resourceNameValue')
      },
      {
        label: getString('pipelineSteps.manifestPathLabel'),
        value: getString('pipelineSteps.manifestPathValue')
      },
      {
        label: getString('pipelineSteps.releaseNameLabel'),
        value: getString('pipelineSteps.releaseNameValue')
      }
    ]
    return options
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChange = (values: K8sDeleteData, value: string): K8sDeleteData => {
    let obj = values
    if (value === getString('pipelineSteps.manifestPathValue')) {
      obj = {
        ...values,
        spec: {
          deleteResources: {
            type: value,
            spec: {
              manifestPaths: [{ value: '', id: uuid() }]
            }
          }
        }
      }
    } else if (value === getString('pipelineSteps.resourceNameValue')) {
      obj = {
        ...values,
        spec: {
          deleteResources: {
            type: value,
            spec: {
              resourceNames: [{ value: '', id: uuid() }]
            }
          }
        }
      }
    } else if (value === getString('pipelineSteps.releaseNameValue')) {
      obj = {
        ...values,
        spec: {
          deleteResources: {
            type: value,
            spec: {
              deleteNamespace: false
            }
          }
        }
      }
    }

    return obj
  }

  const { expressions } = useVariablesExpression()

  return (
    <>
      <Formik<K8sDeleteData>
        onSubmit={values => {
          onUpdate?.(values)
        }}
        validate={values => {
          onFormChange?.(values)
        }}
        formName="k8DeleteData"
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, stepViewType),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(
            getString('validation.timeout10SecMinimum')
          ),
          spec: Yup.object().shape({
            deleteResources: Yup.object().shape({
              spec: Yup.object()
                .when('type', {
                  is: DeleteSpecConstant.ResourceName,
                  then: Yup.object().shape({
                    resourceNames: Yup.lazy(value =>
                      getMultiTypeFromValue(value as boolean) === MultiTypeInputType.FIXED
                        ? Yup.array(
                            Yup.object().shape({
                              value: Yup.string().required(getString('cd.resourceCannotBeEmpty'))
                            })
                          ).required(getString('cd.resourceCannotBeEmpty'))
                        : Yup.string()
                    )
                  })
                })
                .when('type', {
                  is: DeleteSpecConstant.ManifestPath,
                  then: Yup.object().shape({
                    manifestPaths: Yup.lazy(value =>
                      getMultiTypeFromValue(value as boolean) === MultiTypeInputType.FIXED
                        ? Yup.array(
                            Yup.object().shape({
                              value: Yup.string().required(getString('cd.manifestPathsCannotBeEmpty'))
                            })
                          ).required(getString('cd.manifestPathsCannotBeEmpty'))
                        : Yup.string()
                    )
                  })
                })
            })
          })
        })}
      >
        {(formikProps: FormikProps<K8sDeleteData>) => {
          setFormikRef(formikRef, formikProps)
          const values = formikProps.values
          return (
            <>
              {stepViewType === StepViewType.Template ? null : (
                <div className={cx(stepCss.formGroup, stepCss.lg)}>
                  <FormInput.InputWithIdentifier
                    inputLabel={getString('name')}
                    isIdentifierEditable={isNewStep}
                    inputGroupProps={{
                      placeholder: getString('pipeline.stepNamePlaceholder'),
                      disabled: isDisabled
                    }}
                  />
                </div>
              )}
              <div className={cx(stepCss.formGroup, stepCss.sm)}>
                <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
                  <FormMultiTypeDurationField
                    name="timeout"
                    disabled={isDisabled}
                    label={getString('pipelineSteps.timeoutLabel')}
                    multiTypeDurationProps={{
                      enableConfigureOptions: false,
                      expressions,
                      disabled: isDisabled,
                      allowableTypes
                    }}
                  />
                  {getMultiTypeFromValue(formikProps.values.timeout) === MultiTypeInputType.RUNTIME && (
                    <ConfigureOptions
                      style={{ marginBottom: 4 }}
                      value={values.timeout as string}
                      type="String"
                      variableName="step.timeout"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => {
                        formikProps.setFieldValue('timeout', value)
                      }}
                      isReadonly={isDisabled}
                      allowedValuesType={ALLOWED_VALUES_TYPE.TIME}
                    />
                  )}
                </Layout.Horizontal>
              </div>
              <div className={stepCss.divider} />
              <div className={stepCss.formGroup}>
                <FormInput.RadioGroup
                  label={getString('pipelineSteps.deleteResourcesBy')}
                  name="spec.deleteResources.type"
                  items={accessTypeOptions}
                  disabled={isDisabled}
                  radioGroup={{ inline: true, disabled: isDisabled }}
                  onChange={e => {
                    const currentValue = e.currentTarget?.value

                    const valuesObj = onChange(values, currentValue)
                    formikProps?.setValues({ ...valuesObj })
                  }}
                />
              </div>

              {values?.spec?.deleteResources?.type === getString('pipelineSteps.resourceNameValue') && (
                <div className={stepCss.formGroup}>
                  <MultiTypeFieldSelector
                    defaultValueToReset={[{ value: '', id: uuid() }]}
                    name={'spec.deleteResources.spec.resourceNames'}
                    label={getString('auditTrail.resourceNameLabel')}
                    allowedTypes={allowableTypes}
                  >
                    <FieldArray
                      name="spec.deleteResources.spec.resourceNames"
                      render={arrayHelpers => (
                        <Layout.Vertical>
                          {(
                            (formikProps.values?.spec?.deleteResources?.spec?.resourceNames ||
                              []) as K8sDeleteConfigHeader[]
                          )?.map((_path: K8sDeleteConfigHeader, index: number) => (
                            <Layout.Horizontal key={_path.id}>
                              <FormInput.MultiTextInput
                                label=""
                                placeholder={getString('pipelineSteps.deleteResourcesPlaceHolder')}
                                name={`spec.deleteResources.spec.resourceNames[${index}].value`}
                                style={{ width: '430px' }}
                                disabled={isDisabled}
                                multiTextInputProps={{
                                  expressions,
                                  textProps: { disabled: isDisabled },
                                  allowableTypes: (allowableTypes as MultiTypeInputType[]).filter(
                                    item => !isMultiTypeRuntime(item)
                                  ) as AllowedTypes
                                }}
                              />
                              {/* istanbul ignore next */}
                              {formikProps.values?.spec?.deleteResources?.spec?.resourceNames && (
                                <Button
                                  variation={ButtonVariation.ICON}
                                  icon="main-trash"
                                  onClick={() => {
                                    /* istanbul ignore next */
                                    arrayHelpers.remove(index)
                                  }}
                                  disabled={isDisabled}
                                />
                              )}
                            </Layout.Horizontal>
                          ))}
                          <span>
                            <Button
                              variation={ButtonVariation.PRIMARY}
                              text={getString('plusAdd')}
                              className={css.addBtn}
                              onClick={() => {
                                /* istanbul ignore next */
                                arrayHelpers.push({ value: '', id: uuid() })
                              }}
                              disabled={isDisabled}
                            />
                          </span>
                        </Layout.Vertical>
                      )}
                    />
                  </MultiTypeFieldSelector>
                </div>
              )}

              {values?.spec?.deleteResources?.type === getString('pipelineSteps.releaseNameValue') && (
                <div className={cx(stepCss.formGroup, stepCss.md)}>
                  <FormMultiTypeCheckboxField
                    name="spec.deleteResources.spec.deleteNamespace"
                    label={getString('pipelineSteps.deleteNamespace')}
                    style={{ paddingLeft: 'var(--spacing-small)', fontSize: 'var(--font-size-small)' }}
                    multiTypeTextbox={{ expressions, disabled: isDisabled, allowableTypes }}
                    disabled={isDisabled}
                  />
                </div>
              )}

              {values?.spec?.deleteResources?.type === getString('pipelineSteps.manifestPathValue') && (
                <div className={stepCss.formGroup}>
                  <MultiTypeFieldSelector
                    defaultValueToReset={[{ value: '', id: uuid() }]}
                    name={'spec.deleteResources.spec.manifestPaths'}
                    label={getString('pipelineSteps.manifestPathLabel')}
                    allowedTypes={allowableTypes}
                  >
                    <FieldArray
                      name="spec.deleteResources.spec.manifestPaths"
                      render={arrayHelpers => (
                        <Layout.Vertical>
                          {/* istanbul ignore next */}
                          {(
                            (formikProps.values?.spec?.deleteResources?.spec?.manifestPaths ||
                              []) as K8sDeleteConfigHeader[]
                          )?.map((_path: K8sDeleteConfigHeader, index: number) => (
                            <Layout.Horizontal key={_path.id}>
                              <FormInput.MultiTextInput
                                label=""
                                placeholder={getString('pipelineSteps.manifestPathsPlaceHolder')}
                                name={`spec.deleteResources.spec.manifestPaths[${index}].value`}
                                style={{ width: '430px' }}
                                disabled={isDisabled}
                                multiTextInputProps={{
                                  expressions,
                                  allowableTypes: (allowableTypes as MultiTypeInputType[]).filter(
                                    item => !isMultiTypeRuntime(item)
                                  ) as AllowedTypes,
                                  disabled: isDisabled
                                }}
                              />

                              {/* istanbul ignore next */}
                              {formikProps.values?.spec?.deleteResources?.spec?.manifestPaths && (
                                <Button
                                  variation={ButtonVariation.ICON}
                                  icon="main-trash"
                                  onClick={() => arrayHelpers.remove(index)}
                                  disabled={isDisabled}
                                />
                              )}
                            </Layout.Horizontal>
                          ))}
                          <span>
                            <Button
                              variation={ButtonVariation.PRIMARY}
                              text={getString('addFileText')}
                              className={css.addBtn}
                              disabled={isDisabled}
                              onClick={() => arrayHelpers.push({ value: '', id: uuid() })}
                            />
                          </span>
                        </Layout.Vertical>
                      )}
                    />
                  </MultiTypeFieldSelector>
                </div>
              )}

              {formikProps?.values?.spec?.deleteResources?.type === DeleteSpecConstant.ReleaseName &&
                formikProps?.values?.spec?.deleteResources?.spec?.deleteNamespace && (
                  <Container
                    id="warning-deletenamespace"
                    intent="warning"
                    padding={{ left: 'small' }}
                    font={{
                      align: 'center'
                    }}
                    flex={{ justifyContent: 'flex-start' }}
                  >
                    <Icon name="warning-icon" intent={Intent.WARNING} margin={{ right: 'small' }} />
                    <Text font={{ variation: FontVariation.FORM_MESSAGE_WARNING }}>
                      {getString('pipelineSteps.deleteNamespaceWarning')}
                    </Text>
                  </Container>
                )}
            </>
          )
        }}
      </Formik>
    </>
  )
}

/* istanbul ignore next */
const K8sDeleteInputStep: React.FC<K8sDeleteProps> = ({ inputSetData, readonly, allowableTypes }) => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <>
      {getMultiTypeFromValue(inputSetData?.template?.timeout) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <TimeoutFieldInputSetView
            multiTypeDurationProps={{
              enableConfigureOptions: false,
              allowableTypes,
              expressions,
              disabled: readonly
            }}
            fieldPath={'timeout'}
            template={inputSetData?.template}
            label={getString('pipelineSteps.timeoutLabel')}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}timeout`}
            disabled={readonly}
          />
        </div>
      )}
      {getMultiTypeFromValue(inputSetData?.template?.spec?.deleteResources?.spec?.manifestPaths as string) ===
        MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <List
            label={getString('filePaths')}
            name={`${
              isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`
            }spec.deleteResources.spec.manifestPaths`}
            disabled={readonly}
            expressions={expressions}
            style={{ marginBottom: 'var(--spacing-small)' }}
            isNameOfArrayType
          />
        </div>
      )}
      {getMultiTypeFromValue(inputSetData?.template?.spec?.deleteResources?.spec?.resourceNames as string) ===
        MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <List
            label={getString('filePaths')}
            name={`${
              isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`
            }spec.deleteResources.spec.resourceNames`}
            disabled={readonly}
            expressions={expressions}
            style={{ marginBottom: 'var(--spacing-small)' }}
            isNameOfArrayType
          />
        </div>
      )}
    </>
  )
}

const K8sDeleteVariableStep: React.FC<K8sDeleteVariableStepProps> = ({ variablesData, metadataMap, initialValues }) => {
  return (
    <VariablesListTable
      data={variablesData.spec}
      originalData={initialValues.spec}
      metadataMap={metadataMap}
      className={pipelineVariablesCss.variablePaddingL3}
    />
  )
}

const K8sDeleteDeployWidgetWithRef = React.forwardRef(K8sDeleteDeployWidget)

export class K8sDeleteStep extends PipelineStep<K8sDeleteFormData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  renderStep(props: StepProps<any>): JSX.Element {
    /* istanbul ignore next */

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
      /* istanbul ignore next */
      return (
        <K8sDeleteInputStep
          initialValues={initialValues}
          stepViewType={stepViewType}
          inputSetData={inputSetData}
          readonly={!!inputSetData?.readonly}
          onUpdate={onUpdate}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <K8sDeleteVariableStep
          {...(customStepProps as K8sDeleteVariableStepProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }
    /* istanbul ignore next */

    return (
      <K8sDeleteDeployWidgetWithRef
        initialValues={this.getInitialValues(initialValues)}
        stepViewType={defaultTo(stepViewType, StepViewType.Edit)}
        isNewStep={isNewStep}
        readonly={!!inputSetData?.readonly}
        ref={formikRef}
        isDisabled={readonly}
        allowableTypes={allowableTypes}
        onChange={data => onChange?.(this.processFormData(data))}
        onUpdate={data => onUpdate?.(this.processFormData(data))}
      />
    )
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<K8sDeleteFormData>): FormikErrors<K8sDeleteFormData> {
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors: FormikErrors<K8sDeleteFormData> = {}
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
      getMultiTypeFromValue(template?.spec?.deleteResources?.spec?.manifestPaths as unknown as string) ===
      MultiTypeInputType.RUNTIME
    ) {
      let manifestPathsSchema = Yup.object().shape({
        spec: Yup.object().shape({
          deleteResources: Yup.object().shape({
            spec: Yup.object().shape({
              manifestPaths: Yup.array(Yup.string().trim()).ensure().nullable()
            })
          })
        })
      })
      if (isRequired) {
        manifestPathsSchema = Yup.object().shape({
          spec: Yup.object().shape({
            deleteResources: Yup.object().shape({
              spec: Yup.object().shape({
                manifestPaths: Yup.array(Yup.string().trim().required(getString?.('cd.manifestPathsCannotBeEmpty')))
                  .required(getString?.('cd.manifestPathsCannotBeEmpty'))
                  .min(1, getString?.('cd.manifestPathsCannotBeEmpty'))
                  .ensure()
              })
            })
          })
        })
      }
      try {
        manifestPathsSchema.validateSync(data)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }
    if (
      getMultiTypeFromValue(template?.spec?.deleteResources?.spec?.resourceNames as unknown as string) ===
      MultiTypeInputType.RUNTIME
    ) {
      let resourceNamesSchema = Yup.object().shape({
        spec: Yup.object().shape({
          deleteResources: Yup.object().shape({
            spec: Yup.object().shape({
              resourceNames: Yup.array(Yup.string().trim()).ensure().nullable()
            })
          })
        })
      })
      if (isRequired) {
        resourceNamesSchema = Yup.object().shape({
          spec: Yup.object().shape({
            deleteResources: Yup.object().shape({
              spec: Yup.object().shape({
                resourceNames: Yup.array(Yup.string().trim().required(getString?.('cd.resourceCannotBeEmpty')))
                  .required(getString?.('cd.resourceCannotBeEmpty'))
                  .min(1, getString?.('cd.resourceCannotBeEmpty'))
                  .ensure()
              })
            })
          })
        })
      }
      try {
        resourceNamesSchema.validateSync(data)
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
  //TODO : to remove any
  private getInitialValues(initialValues: any): K8sDeleteData {
    if (initialValues.spec?.deleteResources?.type === DeleteSpecConstant.ResourceName) {
      return {
        ...initialValues,
        spec: {
          ...initialValues.spec,
          deleteResources: {
            type: DeleteSpecConstant.ResourceName,
            spec: {
              resourceNames:
                getMultiTypeFromValue(initialValues.spec?.deleteResources?.spec?.resourceNames) ===
                MultiTypeInputType.RUNTIME
                  ? initialValues.spec?.deleteResources?.spec?.resourceNames
                  : initialValues.spec?.deleteResources?.spec?.resourceNames?.length
                  ? defaultTo(initialValues.spec?.deleteResources?.spec?.resourceNames, []).map((item: string) => ({
                      value: item,
                      id: uuid()
                    }))
                  : [{ value: '', id: uuid() }]
            }
          }
        }
      }
    } else if (initialValues.spec?.deleteResources?.type === DeleteSpecConstant.ManifestPath) {
      return {
        ...initialValues,
        spec: {
          ...initialValues.spec,
          deleteResources: {
            type: DeleteSpecConstant.ManifestPath,
            spec: {
              manifestPaths:
                getMultiTypeFromValue(initialValues.spec?.deleteResources?.spec?.manifestPaths) ===
                MultiTypeInputType.RUNTIME
                  ? initialValues.spec?.deleteResources?.spec?.manifestPaths
                  : initialValues.spec?.deleteResources?.spec?.manifestPaths?.length
                  ? defaultTo(initialValues.spec?.deleteResources?.spec?.manifestPaths, []).map((item: string) => ({
                      value: item,
                      id: uuid()
                    }))
                  : [{ value: '', id: uuid() }]
            }
          }
        }
      }
    } else if (initialValues.spec?.deleteResources?.type === DeleteSpecConstant.ReleaseName) {
      return {
        ...initialValues,
        spec: {
          ...initialValues.spec,
          deleteResources: {
            type: DeleteSpecConstant.ReleaseName,
            spec: {
              deleteNamespace: initialValues.spec?.deleteResources?.spec?.deleteNamespace || false
            }
          }
        }
      }
    }

    return {
      ...initialValues,
      spec: {
        ...initialValues.spec,
        deleteResources: {
          type: DeleteSpecConstant.ResourceName,
          spec: {
            resourceNames:
              getMultiTypeFromValue(initialValues.spec?.deleteResources?.spec?.resourceNames) ===
              MultiTypeInputType.RUNTIME
                ? initialValues.spec?.deleteResources?.spec?.resourceNames
                : initialValues.spec?.deleteResources?.spec?.resourceNames?.length
                ? (initialValues.spec?.deleteResources?.spec?.resourceNames || []).map((item: string) => ({
                    value: item,
                    id: uuid()
                  }))
                : [{ value: '', id: uuid() }]
          }
        }
      }
    }
  }
  // TODO: remove any
  processFormData(data: any): K8sDeleteFormData {
    /* making sure to remove other entities */
    if (data.spec?.deleteResources?.type === DeleteSpecConstant.ResourceName) {
      /* istanbul ignore next */
      unset(data.spec?.deleteResources?.spec, 'deleteNamespace')
      unset(data.spec?.deleteResources?.spec, 'manifestPaths')
      return {
        ...data,
        spec: {
          ...data.spec,
          deleteResources: {
            type: DeleteSpecConstant.ResourceName,
            spec: {
              resourceNames:
                getMultiTypeFromValue(data.spec?.deleteResources?.spec?.resourceNames) === MultiTypeInputType.RUNTIME
                  ? data.spec?.deleteResources?.spec?.resourceNames
                  : defaultTo(data.spec?.deleteResources?.spec?.resourceNames, []).map((item: any) => item.value)
            }
          }
        }
      }
    } else if (data.spec?.deleteResources?.type === DeleteSpecConstant.ManifestPath) {
      /* istanbul ignore next */
      unset(data.spec?.deleteResources?.spec, 'deleteNamespace')
      unset(data.spec?.deleteResources?.spec, 'resourceNames')
      return {
        ...data,
        spec: {
          ...data.spec,
          deleteResources: {
            type: DeleteSpecConstant.ManifestPath,
            spec: {
              manifestPaths:
                getMultiTypeFromValue(data.spec?.deleteResources?.spec?.manifestPaths) === MultiTypeInputType.RUNTIME
                  ? data.spec?.deleteResources?.spec?.manifestPaths
                  : defaultTo(data.spec?.deleteResources?.spec?.manifestPaths, []).map((item: any) => item.value)
            }
          }
        }
      }
    }

    /* istanbul ignore next */
    unset(data.spec?.deleteResources?.spec, 'resourceNames')
    unset(data.spec?.deleteResources?.spec, 'manifestPaths')
    return {
      ...data,
      spec: {
        ...data.spec,
        deleteResources: {
          type: DeleteSpecConstant.ReleaseName,
          spec: {
            deleteNamespace: data.spec?.deleteResources?.spec?.deleteNamespace as boolean
          }
        }
      }
    }
  }

  protected type = StepType.K8sDelete
  protected stepName = 'K8s Delete'
  protected stepIcon: IconName = 'delete'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.K8sDelete'
  protected isHarnessSpecific = false
  protected referenceId = 'k8sDeleteStep'

  protected defaultValues: K8sDeleteFormData = {
    identifier: '',
    timeout: '10m',
    name: '',
    type: StepType.K8sDelete,
    spec: {
      deleteResources: {
        type: '',
        spec: {}
      }
    }
  }
}
