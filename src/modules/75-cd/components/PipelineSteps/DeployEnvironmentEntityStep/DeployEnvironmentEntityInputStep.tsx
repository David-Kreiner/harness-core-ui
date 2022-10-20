/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useMemo, useState } from 'react'
import { defaultTo, get, isBoolean, isEmpty, isEqual, isNil, merge, set } from 'lodash-es'
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
import type { EnvironmentYamlV2 } from 'services/cd-ng'

import { useDeepCompareEffect } from '@common/hooks'
import { FormMultiTypeMultiSelectDropDown } from '@common/components/MultiTypeMultiSelectDropDown/MultiTypeMultiSelectDropDown'
import { isValueRuntimeInput } from '@common/utils/utils'

import { useStageFormContext } from '@pipeline/context/StageFormContext'
import { clearRuntimeInput } from '@pipeline/utils/runPipelineUtils'
import { TEMPLATE_INPUT_PATH } from '@pipeline/utils/templateUtils'

import type { DeployEnvironmentEntityConfig, DeployEnvironmentEntityCustomInputStepProps } from './types'
import ExperimentalInput from '../K8sServiceSpec/K8sServiceSpecForms/ExperimentalInput'
import { useGetEnvironmentsData } from './DeployEnvironment/useGetEnvironmentsData'

import css from './DeployEnvironmentEntityStep.module.scss'

export interface DeployEnvironmentEntityInputStepProps extends Required<DeployEnvironmentEntityCustomInputStepProps> {
  initialValues: DeployEnvironmentEntityConfig
  allowableTypes: AllowedTypes
  inputSetData?: {
    template?: DeployEnvironmentEntityConfig
    path?: string
    readonly?: boolean
  }
}

export default function DeployEnvironmentEntityInputStep({
  initialValues,
  inputSetData,
  allowableTypes,
  pathSuffix,
  envGroupIdentifier,
  isMultiEnvironment,
  deployToAllEnvironments,
  gitOpsEnabled
}: DeployEnvironmentEntityInputStepProps): React.ReactElement {
  const { getString } = useStrings()
  const { getStageFormTemplate, updateStageFormTemplate } = useStageFormContext()
  const formik = useFormikContext<DeployEnvironmentEntityConfig>()
  const uniquePath = React.useRef(`_pseudo_field_${uuid()}`)

  const pathPrefix = isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`
  const pathToEnvironments = pathPrefix + pathSuffix
  const pathForDeployToAll = `${pathPrefix}${pathSuffix.split('.')[0]}.deployToAll`
  const isStageTemplateInputSetForm = inputSetData?.path?.startsWith(TEMPLATE_INPUT_PATH)

  const environmentValue = get(initialValues, `environment.environmentRef`)
  const environmentValues: EnvironmentYamlV2[] = get(initialValues, pathSuffix)

  const getEnvironmentIdentifiers = useCallback(() => {
    if (environmentValue) {
      return [environmentValue]
    }

    if (Array.isArray(environmentValues)) {
      return environmentValues.map(envValue => envValue.environmentRef)
    }

    return []
  }, [environmentValue, environmentValues])

  const [environmentIdentifiers, setEnvironmentIdentifiers] = useState<string[]>(getEnvironmentIdentifiers())

  const {
    environmentsList,
    environmentsData,
    loadingEnvironmentsList,
    loadingEnvironmentsData,
    // This is required only when updating the entities list
    updatingEnvironmentsData
  } = useGetEnvironmentsData({ envIdentifiers: environmentIdentifiers, envGroupIdentifier })

  const selectOptions = useMemo(() => {
    /* istanbul ignore else */
    if (!isNil(environmentsList)) {
      return environmentsList.map(environmentInList => ({
        label: environmentInList.name,
        value: environmentInList.identifier
      }))
    }

    return []
  }, [environmentsList])

  const loading = loadingEnvironmentsList || loadingEnvironmentsData || updatingEnvironmentsData
  const disabled = inputSetData?.readonly || loading

  useDeepCompareEffect(() => {
    if (!environmentsList.length) {
      return
    }

    // if this is a multi environment template, then set up a dummy field,
    // so that environments can be updated in this dummy field
    if (isMultiEnvironment) {
      formik.setFieldValue(
        uniquePath.current,
        environmentIdentifiers.map(environmentId => ({
          label: defaultTo(
            environmentsList.find(environmentInList => environmentInList.identifier === environmentId)?.name,
            environmentId
          ),
          value: environmentId
        }))
      )
    }

    // update identifiers in state when deployToAll is true. This sets the environmentsData
    if (deployToAllEnvironments === true) {
      const newIdentifiers = environmentsList.map(environmentInList => environmentInList.identifier)
      if (!isEqual(newIdentifiers, environmentIdentifiers)) {
        setEnvironmentIdentifiers(newIdentifiers)
      }
    }
  }, [environmentsList])

  useDeepCompareEffect(() => {
    // On load of data
    // if no value is selected, clear the inputs and template
    if (environmentIdentifiers.length === 0 && !envGroupIdentifier) {
      if (isMultiEnvironment) {
        updateStageFormTemplate(RUNTIME_INPUT_VALUE, pathToEnvironments)
        formik.setFieldValue(pathToEnvironments, [])
      } else {
        const stageTemplate = getStageFormTemplate<DeployEnvironmentEntityConfig>(`${pathPrefix}environment`)

        set(stageTemplate, 'environmentInputs', RUNTIME_INPUT_VALUE)
        if (gitOpsEnabled) {
          set(stageTemplate, 'gitOpsClusters', RUNTIME_INPUT_VALUE)
        } else {
          set(stageTemplate, 'infrastructureDefinitions', RUNTIME_INPUT_VALUE)
        }

        updateStageFormTemplate(stageTemplate, `${pathPrefix}environment`)

        formik.setFieldValue(`${pathPrefix}environment`, {
          ...get(formik.values, `${pathPrefix}environment`),
          environmentInputs: {},
          ...(gitOpsEnabled ? { gitOpsClusters: [] } : { infrastructureDefinitions: [] })
        })
      }
      return
    }

    if (!environmentsData.length) {
      return
    }

    // updated template based on selected environments
    const newEnvironmentsTemplate: EnvironmentYamlV2[] = environmentIdentifiers.map(envId => {
      return {
        environmentRef: RUNTIME_INPUT_VALUE,
        environmentInputs: environmentsData.find(envTemplate => envTemplate.environment.identifier === envId)
          ?.environmentInputs,
        deployToAll: RUNTIME_INPUT_VALUE as any,
        ...(isMultiEnvironment
          ? gitOpsEnabled
            ? { gitOpsClusters: RUNTIME_INPUT_VALUE as any }
            : { infrastructureDefinitions: RUNTIME_INPUT_VALUE as any }
          : {})
      }
    })

    // updated values based on selected environments
    const newEnvironmentsValues: EnvironmentYamlV2[] = environmentIdentifiers.map(envId => {
      const envTemplateValue = environmentsData.find(
        envTemplate => envTemplate.environment.identifier === envId
      )?.environmentInputs

      // Start - Retain form values
      const environmentsFormValues = get(formik.values, pathToEnvironments)

      const environmentObject: EnvironmentYamlV2 = Array.isArray(environmentsFormValues)
        ? environmentsFormValues.find((env: EnvironmentYamlV2) => env.environmentRef === envId)
        : {
            ...(gitOpsEnabled ? { gitOpsClusters: [] } : { infrastructureDefinitions: [] })
          }

      let environmentInputs = isMultiEnvironment
        ? environmentObject?.environmentInputs
        : get(formik.values, `${pathToEnvironments}environmentInputs`)

      if (!environmentInputs || isValueRuntimeInput(environmentInputs)) {
        environmentInputs = envTemplateValue ? clearRuntimeInput(envTemplateValue) : undefined
      } else {
        environmentInputs = merge(envTemplateValue ? clearRuntimeInput(envTemplateValue) : undefined, environmentInputs)
      }

      const deployToAll = isMultiEnvironment
        ? environmentObject.deployToAll
        : get(formik.values, `${pathToEnvironments}.deployToAll`)

      const infrastructureDefinitions = isMultiEnvironment
        ? environmentObject.infrastructureDefinitions
        : get(formik.values, `${pathToEnvironments}.infrastructureDefinitions`)

      const gitOpsClusters = isMultiEnvironment
        ? environmentObject.gitOpsClusters
        : get(formik.values, `${pathToEnvironments}.gitOpsClusters`)

      // End - Retain form values

      return {
        environmentRef: envId,
        environmentInputs,
        deployToAll,
        ...(isMultiEnvironment ? (gitOpsEnabled ? { gitOpsClusters } : { infrastructureDefinitions }) : {})
      }
    })

    if (isMultiEnvironment) {
      updateStageFormTemplate(newEnvironmentsTemplate, pathToEnvironments)
      formik.setFieldValue(pathToEnvironments, newEnvironmentsValues)
    } else {
      const stageTemplate = getStageFormTemplate<DeployEnvironmentEntityConfig>(`${pathPrefix}environment`)

      set(
        stageTemplate,
        'environmentInputs',
        defaultTo(newEnvironmentsTemplate[0].environmentInputs, isStageTemplateInputSetForm ? RUNTIME_INPUT_VALUE : {})
      )

      set(
        stageTemplate,
        gitOpsEnabled ? 'gitOpsClusters' : 'infrastructureDefinitions',
        defaultTo(
          newEnvironmentsTemplate[0][gitOpsEnabled ? 'gitOpsClusters' : 'infrastructureDefinitions'],
          isStageTemplateInputSetForm ? RUNTIME_INPUT_VALUE : []
        )
      )

      updateStageFormTemplate(stageTemplate, `${pathPrefix}environment`)

      formik.setFieldValue(`${pathPrefix}environment`, {
        ...get(formik.values, `${pathPrefix}environment`),
        environmentInputs: defaultTo(
          newEnvironmentsValues[0].environmentInputs,
          isStageTemplateInputSetForm ? RUNTIME_INPUT_VALUE : {}
        ),
        ...(gitOpsEnabled
          ? {
              infrastructureDefinitions: defaultTo(
                newEnvironmentsValues[0].infrastructureDefinitions,
                isStageTemplateInputSetForm ? RUNTIME_INPUT_VALUE : []
              )
            }
          : {
              gitOpsClusters: defaultTo(
                newEnvironmentsValues[0].gitOpsClusters,
                isStageTemplateInputSetForm ? RUNTIME_INPUT_VALUE : []
              )
            })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environmentsData, environmentIdentifiers, envGroupIdentifier])

  const onEnvironmentRefChange = (value: SelectOption): void => {
    if (
      isStageTemplateInputSetForm &&
      getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME &&
      inputSetData?.path
    ) {
      formik.setFieldValue(`${pathPrefix}environment`, {
        environmentRef: RUNTIME_INPUT_VALUE,
        environmentInputs: RUNTIME_INPUT_VALUE,
        ...(gitOpsEnabled
          ? { gitOpsClusters: RUNTIME_INPUT_VALUE }
          : { infrastructureDefinitions: RUNTIME_INPUT_VALUE })
      })
    }
    setEnvironmentIdentifiers(getEnvironmentIdentifiers())
  }

  function handleEnvironmentsChange(values: SelectOption[]): void {
    if (values?.at(0)?.value === 'All') {
      const newIdentifiers = environmentsList.map(environmentInList => environmentInList.identifier)
      setEnvironmentIdentifiers(newIdentifiers)

      if (!isBoolean(deployToAllEnvironments) && envGroupIdentifier) {
        formik.setFieldValue(pathForDeployToAll, true)
      }
    } else {
      const newEnvironmentsValues = values.map(val => ({
        environmentRef: val.value as string,
        environmentInputs: RUNTIME_INPUT_VALUE,
        ...(gitOpsEnabled
          ? { gitOpsClusters: RUNTIME_INPUT_VALUE }
          : { infrastructureDefinitions: RUNTIME_INPUT_VALUE })
      }))

      const newFormikValues = { ...formik.values }

      set(newFormikValues, pathToEnvironments, newEnvironmentsValues)
      if (!isBoolean(deployToAllEnvironments) && envGroupIdentifier) {
        set(newFormikValues, pathForDeployToAll, false)
      }

      setEnvironmentIdentifiers(getEnvironmentIdentifiers())
      formik.setValues(newFormikValues)
    }
  }

  const placeHolderForEnvironment = loading
    ? getString('loading')
    : getString('cd.pipelineSteps.environmentTab.selectEnvironment')

  const placeHolderForEnvironments = loading
    ? getString('loading')
    : get(formik.values, pathForDeployToAll) === true
    ? getString('common.allEnvironments')
    : environmentIdentifiers.length
    ? getString('environments')
    : getString('cd.pipelineSteps.environmentTab.selectEnvironments')

  return (
    <>
      <Layout.Horizontal spacing="medium" style={{ alignItems: 'flex-end' }}>
        {getMultiTypeFromValue(inputSetData?.template?.environment?.environmentRef) === MultiTypeInputType.RUNTIME ? (
          <ExperimentalInput
            tooltipProps={{ dataTooltipId: 'specifyYourEnvironment' }}
            label={getString('cd.pipelineSteps.environmentTab.specifyYourEnvironment')}
            name={`${pathPrefix}environment.environmentRef`}
            placeholder={placeHolderForEnvironment}
            selectItems={selectOptions}
            useValue
            multiTypeInputProps={{
              allowableTypes: allowableTypes,
              selectProps: {
                addClearBtn: !disabled,
                items: selectOptions
              },
              onChange: onEnvironmentRefChange
            }}
            disabled={disabled}
            className={css.inputWidth}
            formik={formik}
          />
        ) : null}

        {/* If we have multiple environments to select individually or under env group, 
          and we are deploying to all environments from pipeline studio.
          Then we should hide this field and just update the formik values */}
        {isMultiEnvironment && deployToAllEnvironments !== true ? (
          <FormMultiTypeMultiSelectDropDown
            tooltipProps={{ dataTooltipId: 'specifyYourEnvironments' }}
            label={getString('cd.pipelineSteps.environmentTab.specifyYourEnvironments')}
            name={uniquePath.current}
            disabled={disabled}
            dropdownProps={{
              items: selectOptions,
              placeholder: placeHolderForEnvironments,
              disabled,
              // checking for a non-boolean value as it is undefined in case of multi environments
              isAllSelectionSupported: !!envGroupIdentifier,
              selectAllOptionIfAllItemsAreSelected: !!envGroupIdentifier
            }}
            onChange={handleEnvironmentsChange}
            multiTypeProps={{
              width: 300,
              allowableTypes
            }}
          />
        ) : null}

        {loading ? <Spinner className={css.inputSetSpinner} size={16} /> : null}
      </Layout.Horizontal>
    </>
  )
}
