/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useMemo, useState } from 'react'
import { defaultTo, get, isBoolean, isEmpty, isEqual, isNil, merge, set, unset } from 'lodash-es'
import { useFormikContext } from 'formik'
import { Spinner } from '@blueprintjs/core'
import { v4 as uuid } from 'uuid'

import {
  AllowedTypes,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  RUNTIME_INPUT_VALUE,
  SelectOption
} from '@harness/uicore'

import { useStrings } from 'framework/strings'

import { useDeepCompareEffect } from '@common/hooks'
import { FormMultiTypeMultiSelectDropDown } from '@common/components/MultiTypeMultiSelectDropDown/MultiTypeMultiSelectDropDown'
import { isValueRuntimeInput } from '@common/utils/utils'

import { useStageFormContext } from '@pipeline/context/StageFormContext'
import { clearRuntimeInput } from '@pipeline/utils/runPipelineUtils'
import { TEMPLATE_INPUT_PATH } from '@pipeline/utils/templateUtils'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'

import ExperimentalInput from '../K8sServiceSpec/K8sServiceSpecForms/ExperimentalInput'
import { useGetInfrastructuresData } from '../DeployEnvironmentEntityStep/DeployInfrastructure/useGetInfrastructuresData'
import type { DeployEnvironmentEntityConfig, InfrastructureYaml } from '../DeployEnvironmentEntityStep/types'
import type { DeployInfrastructureEntityCustomInputStepProps } from './types'

import css from './DeployInfrastructureEntityStep.module.scss'

export interface DeployInfrastructureEntityInputStepProps
  extends Required<DeployInfrastructureEntityCustomInputStepProps> {
  initialValues: DeployEnvironmentEntityConfig['environment']
  readonly: boolean
  allowableTypes: AllowedTypes
  stepViewType: StepViewType
  inputSetData?: {
    template?: DeployEnvironmentEntityConfig['environment']
    path?: string
    readonly?: boolean
  }
}

export default function DeployInfrastructureEntityInputStep({
  initialValues,
  allowableTypes,
  inputSetData,
  deploymentType,
  customDeploymentRef,
  environmentIdentifier,
  isMultipleInfrastructure,
  deployToAllInfrastructures
}: DeployInfrastructureEntityInputStepProps): React.ReactElement {
  const { getString } = useStrings()
  const formik = useFormikContext<DeployEnvironmentEntityConfig>()
  const { updateStageFormTemplate } = useStageFormContext()
  const uniquePath = React.useRef(`_pseudo_field_${uuid()}`)

  const pathPrefix = isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`
  const pathForDeployToAll = `${pathPrefix}deployToAll`
  const isStageTemplateInputSetForm = inputSetData?.path?.startsWith(TEMPLATE_INPUT_PATH)

  const { templateRef: deploymentTemplateIdentifier, versionLabel } = customDeploymentRef || {}

  const shouldAddCustomDeploymentData =
    deploymentType === ServiceDeploymentType.CustomDeployment && deploymentTemplateIdentifier

  const infrastructureValue = get(initialValues, `infrastructureDefinitions.[0].identifier`)
  const infrastructureValues = get(initialValues, 'infrastructureDefinitions')

  const getInfrastructureIdentifiers = useCallback(() => {
    if (!isMultipleInfrastructure && infrastructureValue) {
      return [infrastructureValue]
    }

    if (isMultipleInfrastructure && Array.isArray(infrastructureValues)) {
      return infrastructureValues.map(infraValue => infraValue.identifier)
    }

    return []
  }, [isMultipleInfrastructure, infrastructureValue, infrastructureValues])

  const [infrastructureIdentifiers, setInfrastructureIdentifiers] = useState<string[]>(getInfrastructureIdentifiers())

  const {
    infrastructuresList,
    infrastructuresData,
    loadingInfrastructuresList,
    loadingInfrastructuresData,
    // This is required only when updating the entities list
    updatingInfrastructuresData
  } = useGetInfrastructuresData({
    infrastructureIdentifiers,
    environmentIdentifier,
    deploymentType,
    ...(shouldAddCustomDeploymentData && {
      deploymentTemplateIdentifier,
      versionLabel
    })
  })

  const selectOptions = useMemo(() => {
    /* istanbul ignore else */
    if (!isNil(infrastructuresList)) {
      return infrastructuresList.map(infrastructureInList => ({
        label: infrastructureInList.name,
        value: infrastructureInList.identifier
      }))
    }

    return []
  }, [infrastructuresList])

  const loading = loadingInfrastructuresList || loadingInfrastructuresData || updatingInfrastructuresData

  useDeepCompareEffect(() => {
    if (!infrastructuresList.length) {
      return
    }

    // if this is a multi infrastructures, then set up a dummy field,
    // so that infrastructures can be updated in this dummy field
    if (isMultipleInfrastructure) {
      const isDeployToAll = get(formik.values, pathForDeployToAll)

      formik.setFieldValue(
        uniquePath.current,
        isDeployToAll
          ? [
              {
                label: 'All',
                value: 'All'
              }
            ]
          : infrastructureIdentifiers.map(infrastructureId => ({
              label: defaultTo(
                infrastructuresList.find(infrastructureInList => infrastructureInList.identifier === infrastructureId)
                  ?.name,
                infrastructureId
              ),
              value: infrastructureId
            }))
      )
    }

    // update identifiers in state when deployToAll is true. This sets the infrastructuresData
    if (deployToAllInfrastructures === true) {
      const newIdentifiers = infrastructuresList.map(infrastructureInList => infrastructureInList.identifier)
      if (!isEqual(newIdentifiers, infrastructureIdentifiers)) {
        setInfrastructureIdentifiers(newIdentifiers)
      }
    }
  }, [infrastructuresList])

  useDeepCompareEffect(() => {
    // On load of data
    // if no value is selected, clear the inputs and template
    if (infrastructureIdentifiers.length === 0) {
      if (isMultipleInfrastructure) {
        updateStageFormTemplate(RUNTIME_INPUT_VALUE, `${pathPrefix}infrastructureDefinitions`)
        formik.setFieldValue(`${pathPrefix}infrastructureDefinitions`, [])
      } else {
        updateStageFormTemplate(
          [
            {
              identifier: '',
              inputs: RUNTIME_INPUT_VALUE
            }
          ],
          `${pathPrefix}infrastructureDefinitions`
        )

        formik.setFieldValue(`${pathPrefix}infrastructureDefinitions`, [])
      }
      return
    }

    if (!infrastructuresData.length) {
      return
    }

    // updated template based on selected infrastructures
    const newInfrastructuresTemplate = infrastructureIdentifiers.map(infraId => {
      return {
        identifier: infraId,
        inputs: infrastructuresData.find(infraTemplate => infraTemplate.infrastructureDefinition.identifier === infraId)
          ?.infrastructureInputs
      }
    })

    // updated values based on selected infrastructures
    const newInfrastructuresValues = infrastructureIdentifiers.map(infraId => {
      const infraTemplateValue = infrastructuresData.find(
        infraTemplate => infraTemplate.infrastructureDefinition.identifier === infraId
      )?.infrastructureInputs

      // Start - Retain form values

      let infrastructureInputs = isMultipleInfrastructure
        ? Array.isArray(get(formik.values, `${pathPrefix}infrastructureDefinitions`))
          ? get(formik.values, `${pathPrefix}infrastructureDefinitions`).find(
              (infra: InfrastructureYaml) => infra.identifier === infraId
            )?.inputs
          : undefined
        : get(formik.values, `${pathPrefix}infrastructureDefinitions`)

      if (!infrastructureInputs || isValueRuntimeInput(infrastructureInputs)) {
        infrastructureInputs = infraTemplateValue ? clearRuntimeInput(infraTemplateValue) : undefined
      } else {
        infrastructureInputs = merge(
          infraTemplateValue ? clearRuntimeInput(infraTemplateValue) : undefined,
          infrastructureInputs
        )
      }

      // End - Retain form values

      return {
        identifier: infraId,
        inputs: infrastructureInputs
      }
    })

    if (isMultipleInfrastructure) {
      updateStageFormTemplate(newInfrastructuresTemplate, `${pathPrefix}infrastructureDefinitions`)
      formik.setFieldValue(`${pathPrefix}infrastructureDefinitions`, newInfrastructuresValues)
    } else {
      updateStageFormTemplate(newInfrastructuresTemplate[0], `${pathPrefix}infrastructureDefinitions[0]`)

      formik.setFieldValue(
        `${pathPrefix}infrastructureDefinitions[0]`,
        defaultTo(newInfrastructuresValues[0], isStageTemplateInputSetForm ? RUNTIME_INPUT_VALUE : [])
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infrastructuresData, infrastructureIdentifiers])

  const onInfrastructureRefChange = (value: SelectOption): void => {
    if (
      isStageTemplateInputSetForm &&
      getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME &&
      inputSetData?.path
    ) {
      return
    }
    setInfrastructureIdentifiers(getInfrastructureIdentifiers())
  }

  function handleInfrastructuresChange(values: SelectOption[]): void {
    if (values?.at(0)?.value === 'All') {
      const newIdentifiers = infrastructuresList.map(infrastructureInList => infrastructureInList.identifier)
      setInfrastructureIdentifiers(newIdentifiers)

      const newFormikValues = { ...formik.values }
      set(newFormikValues, pathForDeployToAll, true)
      unset(newFormikValues, `${pathPrefix}infrastructureDefinitions`)
      formik.setValues(newFormikValues)
    } else {
      const newValues = values.map(val => ({
        identifier: val.value as string,
        infrastructureInputs: RUNTIME_INPUT_VALUE
      }))

      const newFormikValues = { ...formik.values }

      set(newFormikValues, `${pathPrefix}infrastructureDefinitions`, newValues)
      if (!isBoolean(deployToAllInfrastructures)) {
        set(newFormikValues, `${pathPrefix}deployToAll`, false)
      }

      setInfrastructureIdentifiers(getInfrastructureIdentifiers())
      formik.setValues(newFormikValues)
    }
  }

  const placeHolderForInfrastructures = loading
    ? getString('loading')
    : get(formik.values, pathForDeployToAll) === true
    ? getString('cd.pipelineSteps.environmentTab.allInfrastructures')
    : infrastructureIdentifiers.length
    ? getString('common.infrastructures')
    : getString('cd.pipelineSteps.environmentTab.selectInfrastructures')

  return (
    <>
      <Layout.Horizontal spacing="medium" style={{ alignItems: 'flex-end' }}>
        {!isMultipleInfrastructure && (
          <ExperimentalInput
            tooltipProps={{ dataTooltipId: 'specifyYourInfrastructure' }}
            label={getString('cd.pipelineSteps.environmentTab.specifyYourInfrastructure')}
            name={`${pathPrefix}infrastructureDefinitions[0].identifier`}
            placeholder={getString('cd.pipelineSteps.environmentTab.selectInfrastructure')}
            selectItems={selectOptions}
            useValue
            multiTypeInputProps={{
              allowableTypes: allowableTypes,
              selectProps: {
                addClearBtn: !inputSetData?.readonly,
                items: selectOptions
              },
              onChange: onInfrastructureRefChange
            }}
            disabled={inputSetData?.readonly}
            className={css.inputWidth}
            formik={formik}
          />
        )}
        {/**
         * Hide if:
         * 1. if deploy to all environments is true, either by default or after selection from input field
         * 2. if deploy to all infrastructures is true
         */}
        {isMultipleInfrastructure && deployToAllInfrastructures !== true && (
          <FormMultiTypeMultiSelectDropDown
            tooltipProps={{ dataTooltipId: 'specifyYourInfrastructures' }}
            label={getString('cd.pipelineSteps.environmentTab.specifyYourInfrastructures')}
            name={uniquePath.current}
            disabled={inputSetData?.readonly || loading}
            dropdownProps={{
              items: selectOptions,
              placeholder: placeHolderForInfrastructures,
              disabled: loading || inputSetData?.readonly,
              isAllSelectionSupported: !!environmentIdentifier,
              selectAllOptionIfAllItemsAreSelected: !!environmentIdentifier
            }}
            onChange={handleInfrastructuresChange}
            multiTypeProps={{
              width: 300,
              allowableTypes
            }}
          />
        )}
        {loading ? <Spinner className={css.inputSetSpinner} size={16} /> : null}
      </Layout.Horizontal>
    </>
  )
}
