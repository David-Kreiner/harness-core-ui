/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { BaseSyntheticEvent, useEffect, useRef, useState } from 'react'
import { isEmpty, noop, set } from 'lodash-es'
import type { FormikProps } from 'formik'
import produce from 'immer'
import { RadioGroup } from '@blueprintjs/core'

import {
  AllowedTypes,
  ConfirmationDialog,
  Formik,
  FormikForm,
  getMultiTypeFromValue,
  Intent,
  Layout,
  MultiTypeInputType,
  RUNTIME_INPUT_VALUE,
  Toggle,
  useToggleOpen
} from '@harness/uicore'

import { StringKeys, useStrings } from 'framework/strings'

import { useStageErrorContext } from '@pipeline/context/StageErrorContext'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'

import type { DeployEnvironmentEntityCustomStepProps, DeployEnvironmentEntityFormState } from './types'
import DeployEnvironment from './DeployEnvironment/DeployEnvironment'
import DeployEnvironmentGroup from './DeployEnvironmentGroup/DeployEnvironmentGroup'
import { getValidationSchema } from './utils'

import css from './DeployEnvironmentEntityStep.module.scss'

export interface DeployEnvironmentEntityWidgetProps extends Required<DeployEnvironmentEntityCustomStepProps> {
  initialValues: DeployEnvironmentEntityFormState
  readonly: boolean
  allowableTypes: AllowedTypes
  onUpdate?: (data: DeployEnvironmentEntityFormState) => void
}

function getRadioValueFromInitialValues(initialValues: DeployEnvironmentEntityFormState): StringKeys {
  if (initialValues.environmentGroup) {
    return 'common.environmentGroup.label'
  } else {
    return 'environments'
  }
}

export default function DeployEnvironmentEntityWidget({
  initialValues,
  readonly,
  allowableTypes,
  onUpdate,
  stageIdentifier,
  deploymentType,
  customDeploymentRef,
  gitOpsEnabled
}: DeployEnvironmentEntityWidgetProps): JSX.Element {
  const { getString } = useStrings()
  const [radioValue, setRadioValue] = useState<string>(getString(getRadioValueFromInitialValues(initialValues)))

  const formikRef = useRef<FormikProps<DeployEnvironmentEntityFormState> | null>(null)

  const {
    isOpen: isSwitchToMultiEnvironmentDialogOpen,
    open: openSwitchToMultiEnvironmentDialog,
    close: closeSwitchToMultiEnvironmentDialog
  } = useToggleOpen()

  const {
    isOpen: isSwitchToSingleEnvironmentDialogOpen,
    open: openSwitchToSingleEnvironmentDialog,
    close: closeSwitchToSingleEnvironmentDialog
  } = useToggleOpen()

  const {
    isOpen: isSwitchToEnvironmentGroupDialogOpen,
    open: openSwitchToEnvironmentGroupDialog,
    close: closeSwitchToEnvironmentGroupDialog
  } = useToggleOpen()

  const { subscribeForm, unSubscribeForm } = useStageErrorContext<DeployEnvironmentEntityFormState>()
  useEffect(() => {
    subscribeForm({ tab: DeployTabs.ENVIRONMENT, form: formikRef })
    return () => unSubscribeForm({ tab: DeployTabs.ENVIRONMENT, form: formikRef })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateValuesInFormikAndPropogate(values: DeployEnvironmentEntityFormState): void {
    /* istanbul ignore else */
    if (formikRef.current) {
      formikRef.current.setTouched({ environment: true, environments: true, environmentGroup: true })
      formikRef.current.setValues(values)
    }
  }

  function handleSwitchToMultiEnvironmentConfirmation(confirmed: boolean): void {
    /* istanbul ignore else */
    if (formikRef.current && confirmed) {
      const environment = formikRef.current.values.environment
      const environmentGroup = formikRef.current.values.environmentGroup
      const infrastructure = formikRef.current.values.infrastructure
      const cluster = formikRef.current.values.cluster

      const newValues = produce(formikRef.current.values, draft => {
        draft.category = 'multi'
        draft.parallel = true

        draft.environments =
          environment && !environmentGroup
            ? getMultiTypeFromValue(environment) === MultiTypeInputType.RUNTIME
              ? (RUNTIME_INPUT_VALUE as any)
              : [{ label: environment, value: environment }]
            : []

        delete draft.environment
        delete draft.environmentGroup

        delete draft.infrastructure
        delete draft.infrastructures

        delete draft.cluster
        delete draft.clusters

        if (environment) {
          if (gitOpsEnabled) {
            set(
              draft,
              `clusters.${environment}`,
              cluster
                ? getMultiTypeFromValue(cluster) === MultiTypeInputType.RUNTIME
                  ? RUNTIME_INPUT_VALUE
                  : [{ label: cluster, value: cluster }]
                : []
            )
          } else {
            set(
              draft,
              `infrastructures.${environment}`,
              infrastructure
                ? getMultiTypeFromValue(infrastructure) === MultiTypeInputType.RUNTIME
                  ? RUNTIME_INPUT_VALUE
                  : [{ label: infrastructure, value: infrastructure }]
                : []
            )
          }
        }
      })
      updateValuesInFormikAndPropogate(newValues)
      setRadioValue(getString('environments'))
    }

    closeSwitchToMultiEnvironmentDialog()
  }

  function handleSwitchToSingleEnvironmentConfirmation(confirmed: boolean): void {
    /* istanbul ignore else */
    if (formikRef.current && confirmed) {
      const newValues = produce(formikRef.current.values, draft => {
        draft.category = 'single'
        draft.environment = ''
        delete draft.environments
        delete draft.infrastructures
        delete draft.clusters
        delete draft.environmentGroup
      })
      updateValuesInFormikAndPropogate(newValues)
      setRadioValue(getString('environments'))
    }

    closeSwitchToSingleEnvironmentDialog()
  }

  function handleSwitchToEnvironmentGroupConfirmation(confirmed: boolean): void {
    /* istanbul ignore else */
    if (formikRef.current && confirmed) {
      const newValues = produce(formikRef.current.values, draft => {
        draft.category = 'group'
        draft.environmentGroup = ''
        delete draft.environment
        delete draft.environments
      })
      updateValuesInFormikAndPropogate(newValues)
      setRadioValue(getString('common.environmentGroup.label'))
    }

    closeSwitchToEnvironmentGroupDialog()
  }

  function handleMultiEnvironmentToggle(checked: boolean): void {
    // istanbul ignore else
    if (formikRef.current) {
      const formValues = formikRef.current.values
      if (checked) {
        if (formValues.environment) {
          openSwitchToMultiEnvironmentDialog()
        } else {
          handleSwitchToMultiEnvironmentConfirmation(true)
        }
      } else {
        if (!isEmpty(formValues.environments) || !isEmpty(formValues.environmentGroup)) {
          openSwitchToSingleEnvironmentDialog()
        } else {
          handleSwitchToSingleEnvironmentConfirmation(true)
        }
      }
    }
  }

  function handleEnvironmentGroupToggle(event: BaseSyntheticEvent): void {
    if (event.target.value === getString('environments')) {
      if (formikRef.current?.values.environmentGroup) {
        openSwitchToMultiEnvironmentDialog()
      } else {
        handleSwitchToMultiEnvironmentConfirmation(true)
        setRadioValue(event?.target.value)
      }
    } else {
      if (formikRef.current?.values.environments) {
        openSwitchToEnvironmentGroupDialog()
      } else {
        handleSwitchToEnvironmentGroupConfirmation(true)
        setRadioValue(event?.target.value)
      }
    }
  }

  return (
    <>
      <Formik<DeployEnvironmentEntityFormState>
        formName="deployEnvironmentEntityWidgetForm"
        onSubmit={noop}
        validate={(values: DeployEnvironmentEntityFormState) => {
          onUpdate?.({ ...values })
        }}
        initialValues={initialValues}
        validationSchema={getValidationSchema(getString, gitOpsEnabled)}
      >
        {formik => {
          window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.ENVIRONMENT }))
          formikRef.current = formik
          const { values } = formik

          const isMultiEnvironment = values.category === 'multi'
          const isEnvironmentGroup = values.category === 'group'

          return (
            <FormikForm>
              <div className={css.environmentEntityWidget}>
                <Layout.Vertical className={css.toggle} flex={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Layout.Vertical flex={{ alignItems: 'center' }}>
                    <Toggle
                      checked={isMultiEnvironment || isEnvironmentGroup}
                      onToggle={handleMultiEnvironmentToggle}
                      label={getString('cd.pipelineSteps.environmentTab.multiEnvToggleText', {
                        name: gitOpsEnabled ? getString('common.clusters') : getString('common.infrastructures')
                      })}
                    />
                    {(isMultiEnvironment || isEnvironmentGroup) && (
                      <RadioGroup
                        onChange={handleEnvironmentGroupToggle}
                        options={[
                          {
                            label: getString('environments'),
                            value: getString('environments')
                          },
                          {
                            label: getString('common.environmentGroup.label'),
                            value: getString('common.environmentGroup.label')
                          }
                        ]}
                        selectedValue={radioValue}
                        disabled={readonly}
                        className={css.radioGroup}
                        inline
                      />
                    )}
                  </Layout.Vertical>
                </Layout.Vertical>
                {isEnvironmentGroup ? (
                  <DeployEnvironmentGroup
                    initialValues={initialValues}
                    readonly={readonly}
                    allowableTypes={allowableTypes}
                    stageIdentifier={stageIdentifier}
                    deploymentType={deploymentType}
                    customDeploymentRef={customDeploymentRef}
                    gitOpsEnabled={gitOpsEnabled}
                  />
                ) : (
                  <DeployEnvironment
                    initialValues={initialValues}
                    readonly={readonly}
                    allowableTypes={allowableTypes}
                    isMultiEnvironment={isMultiEnvironment}
                    stageIdentifier={stageIdentifier}
                    deploymentType={deploymentType}
                    customDeploymentRef={customDeploymentRef}
                    gitOpsEnabled={gitOpsEnabled}
                  />
                )}
              </div>
            </FormikForm>
          )
        }}
      </Formik>

      <ConfirmationDialog
        isOpen={isSwitchToMultiEnvironmentDialogOpen}
        titleText={getString('cd.pipelineSteps.environmentTab.multiEnvironmentsDialogTitleText')}
        contentText={getString('cd.pipelineSteps.environmentTab.multiEnvironmentsConfirmationText')}
        confirmButtonText={getString('applyChanges')}
        cancelButtonText={getString('cancel')}
        onClose={handleSwitchToMultiEnvironmentConfirmation}
        intent={Intent.WARNING}
      />

      <ConfirmationDialog
        isOpen={isSwitchToSingleEnvironmentDialogOpen}
        titleText={getString('cd.pipelineSteps.environmentTab.singleEnvironmentDialogTitleText')}
        contentText={getString('cd.pipelineSteps.environmentTab.singleEnvironmentConfirmationText')}
        confirmButtonText={getString('applyChanges')}
        cancelButtonText={getString('cancel')}
        onClose={handleSwitchToSingleEnvironmentConfirmation}
        intent={Intent.WARNING}
      />

      <ConfirmationDialog
        isOpen={isSwitchToEnvironmentGroupDialogOpen}
        titleText={getString('cd.pipelineSteps.environmentTab.environmentGroupDialogTitleText')}
        contentText={getString('cd.pipelineSteps.environmentTab.environmentGroupConfirmationText')}
        confirmButtonText={getString('applyChanges')}
        cancelButtonText={getString('cancel')}
        onClose={handleSwitchToEnvironmentGroupConfirmation}
        intent={Intent.WARNING}
      />
    </>
  )
}
