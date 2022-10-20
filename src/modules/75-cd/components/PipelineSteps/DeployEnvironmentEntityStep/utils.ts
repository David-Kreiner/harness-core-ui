/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { getMultiTypeFromValue, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { defaultTo, get, isEmpty, isEqual, isNil, set } from 'lodash-es'
import * as Yup from 'yup'
import type { UseStringsReturn } from 'framework/strings'
import type { EnvironmentYamlV2 } from 'services/cd-ng'
import { isValueRuntimeInput } from '@common/utils/utils'
import type {
  DeployEnvironmentEntityConfig,
  DeployEnvironmentEntityCustomStepProps,
  DeployEnvironmentEntityFormState
} from './types'

// TODO: Add type check to optionally extends keys
export type ChangeTypeOfKeys<T, N, K extends keyof T> = Pick<T, K> &
  {
    [key in keyof T]: T[key] | N
  }

export function processInitialValues(
  initialValues: DeployEnvironmentEntityConfig,
  customStepProps: DeployEnvironmentEntityCustomStepProps,
  onUpdate?: (data: DeployEnvironmentEntityConfig) => void
): DeployEnvironmentEntityFormState {
  const gitOpsEnabled = !!customStepProps.gitOpsEnabled

  // istanbul ignore else
  if (initialValues.environment && initialValues.environment.environmentRef) {
    // this is backwards compatibility for single env multiple clusters in the older redesign setup
    if (
      Array.isArray(initialValues.environment.gitOpsClusters) &&
      initialValues.environment.gitOpsClusters.length > 0
    ) {
      return processMultiEnvironmentInitialValues(
        {
          environments: {
            metadata: {
              parallel: false
            },
            values: [{ ...initialValues.environment }]
          }
        },
        gitOpsEnabled
      )
    }
    return processSingleEnvironmentInitialValues(initialValues.environment, gitOpsEnabled)
  } else if (initialValues.environments) {
    return processMultiEnvironmentInitialValues(initialValues, gitOpsEnabled)
  } else if (initialValues.environmentGroup) {
    // This handles the migration from runtime environment group of old pipeline to post multi infra handling
    if (
      isEqual(initialValues.environmentGroup, {
        envGroupRef: RUNTIME_INPUT_VALUE,
        deployToAll: true
      })
    ) {
      const updatedInitialValues = {
        environmentGroup: {
          envGroupRef: RUNTIME_INPUT_VALUE,
          deployToAll: RUNTIME_INPUT_VALUE as any,
          environments: RUNTIME_INPUT_VALUE as any
        }
      }

      onUpdate?.(updatedInitialValues)
      return processEnvironmentGroupInitialValues(updatedInitialValues, gitOpsEnabled)
    } else if (
      // This handles the migration from 'all' environments under environment group of old pipeline to post multi infra handling
      initialValues.environmentGroup.deployToAll === true &&
      !isValueRuntimeInput(initialValues.environmentGroup.envGroupRef) &&
      isNil(initialValues.environmentGroup.envGroupRef)
    ) {
      const updatedInitialValues = {
        environmentGroup: {
          envGroupRef: initialValues.environmentGroup.envGroupRef,
          deployToAll: true,
          environments: RUNTIME_INPUT_VALUE as any
        }
      }

      onUpdate?.(updatedInitialValues)
      return processEnvironmentGroupInitialValues(updatedInitialValues, gitOpsEnabled)
    }

    return processEnvironmentGroupInitialValues(initialValues, gitOpsEnabled)
  }

  return {
    category: 'single'
  }
}

export function processFormValues(
  data: DeployEnvironmentEntityFormState,
  customStepProps: DeployEnvironmentEntityCustomStepProps
): DeployEnvironmentEntityConfig {
  const gitOpsEnabled = !!customStepProps.gitOpsEnabled

  // istanbul ignore else
  if (data.category === 'single') {
    return processSingleEnvironmentFormValues(data, gitOpsEnabled)
  } else if (data.category === 'group') {
    return processEnvironmentGroupFormValues(data, gitOpsEnabled)
  } else if (data.category === 'multi') {
    return processMultiEnvironmentFormValues(data, gitOpsEnabled)
  }
  return {}
}

export function processSingleEnvironmentInitialValues(
  environment: DeployEnvironmentEntityConfig['environment'],
  gitOpsEnabled: boolean
): DeployEnvironmentEntityFormState {
  const formState: DeployEnvironmentEntityFormState = {}

  if (environment) {
    if (getMultiTypeFromValue(environment.environmentRef) === MultiTypeInputType.RUNTIME) {
      set(formState, 'environment', RUNTIME_INPUT_VALUE)
    } else {
      set(formState, 'environment', environment.environmentRef)
      // if environmentRef is a FIXED value and contains selected environment
      set(
        formState,
        'environmentInputs',
        getMultiTypeFromValue(environment.environmentRef) === MultiTypeInputType.FIXED
          ? { [environment.environmentRef]: environment?.environmentInputs }
          : {}
      )

      // This is clusters specific handling
      if (gitOpsEnabled) {
        const gitOpsClusters = environment.gitOpsClusters

        // infrastructure is 1st identifier if gitOpsClusters is an array
        const cluster = Array.isArray(gitOpsClusters) ? gitOpsClusters[0]?.identifier : gitOpsClusters

        set(formState, 'cluster', cluster)
      } else {
        const infrastructureDefinitions = environment.infrastructureDefinitions

        // infrastructure is 1st identifier if infrastructureDefinitions is an array
        const infrastructure = Array.isArray(infrastructureDefinitions)
          ? infrastructureDefinitions[0]?.identifier
          : infrastructureDefinitions

        set(formState, 'infrastructure', infrastructure)
        // if infrastructureDefinitions is an array and contains selected infrastructure
        set(
          formState,
          'infrastructureInputs',
          Array.isArray(infrastructureDefinitions) && infrastructure
            ? {
                [environment.environmentRef]: {
                  [infrastructure]: infrastructureDefinitions?.[0]?.inputs
                }
              }
            : {}
        )
      }
    }
  }

  formState.category = 'single'
  return formState
}

export function processSingleEnvironmentFormValues(
  data: DeployEnvironmentEntityFormState,
  gitOpsEnabled: boolean
): DeployEnvironmentEntityConfig {
  if (!isNil(data.environment)) {
    // ! Do not merge this with the other returns even if they look similar. It makes it confusing to read
    if (getMultiTypeFromValue(data.environment) === MultiTypeInputType.RUNTIME) {
      return {
        environment: {
          environmentRef: RUNTIME_INPUT_VALUE,
          deployToAll: false,
          environmentInputs: RUNTIME_INPUT_VALUE as any,
          ...(gitOpsEnabled
            ? { gitOpsClusters: RUNTIME_INPUT_VALUE as any }
            : { infrastructureDefinitions: RUNTIME_INPUT_VALUE as any })
        }
      }
    } else {
      return {
        environment: {
          environmentRef: data.environment,
          ...(!!data.environmentInputs?.[data.environment] && {
            environmentInputs: data.environmentInputs[data.environment]
          }),
          deployToAll: false,
          ...(data.environment &&
            !!data.infrastructure && {
              infrastructureDefinitions:
                getMultiTypeFromValue(data.infrastructure) === MultiTypeInputType.RUNTIME
                  ? (data.infrastructure as any)
                  : [
                      {
                        identifier: data.infrastructure,
                        inputs: get(data, `infrastructureInputs.${data.environment}.${data.infrastructure}`)
                      }
                    ]
            }),
          ...(data.environment &&
            !!data.cluster && {
              gitOpsClusters:
                getMultiTypeFromValue(data.cluster) === MultiTypeInputType.RUNTIME
                  ? (data.cluster as any)
                  : [
                      {
                        identifier: data.cluster
                      }
                    ]
            })
        }
      }
    }
  }

  return {}
}

export function getEnvironmentsFormStateFromInitialValues(
  environments?: EnvironmentYamlV2[],
  deployToAll?: boolean,
  gitOpsEnabled?: boolean
): DeployEnvironmentEntityFormState {
  const formState = {}

  if (getMultiTypeFromValue(environments as unknown as string) !== MultiTypeInputType.FIXED) {
    if (deployToAll !== true) {
      set(formState, 'environments', environments)
    }
    set(formState, 'environmentInputs', {})
    if (gitOpsEnabled) {
      set(formState, 'clusters', {})
    } else {
      set(formState, 'infrastructures', {})
      set(formState, 'infrastructureInputs', {})
    }
  } else {
    defaultTo(environments, []).map((environment: EnvironmentYamlV2, index: number) => {
      set(formState, `environments.${index}`, {
        label: environment.environmentRef,
        value: environment.environmentRef
      })

      set(formState, `environmentInputs.${environment.environmentRef}`, environment.environmentInputs)

      if (gitOpsEnabled) {
        if (Array.isArray(environment.gitOpsClusters)) {
          environment.gitOpsClusters.map((gitOpsCluster, clusterIndex) => {
            set(formState, `clusters.${environment.environmentRef}.${clusterIndex}`, {
              label: gitOpsCluster.identifier,
              value: gitOpsCluster.identifier
            })
          })
        } else {
          set(formState, `clusters.${environment.environmentRef}`, environment.gitOpsClusters)
        }
      } else {
        if (Array.isArray(environment.infrastructureDefinitions)) {
          environment.infrastructureDefinitions.map((infrastructure, infrastructureIndex) => {
            set(formState, `infrastructures.${environment.environmentRef}.${infrastructureIndex}`, {
              label: infrastructure.identifier,
              value: infrastructure.identifier
            })

            set(
              formState,
              `infrastructureInputs.${environment.environmentRef}.${infrastructure.identifier}`,
              infrastructure.inputs
            )
          })
        } else {
          set(formState, `infrastructures.${environment.environmentRef}`, environment.infrastructureDefinitions)
        }
      }
    })
  }

  return formState
}

export function processMultiEnvironmentInitialValues(
  initialValues: DeployEnvironmentEntityConfig,
  gitOpsEnabled: boolean
): DeployEnvironmentEntityFormState {
  return {
    parallel: defaultTo(initialValues.environments?.metadata?.parallel, true),
    category: 'multi',
    ...getEnvironmentsFormStateFromInitialValues(initialValues.environments?.values, false, gitOpsEnabled)
  }
}

export function getEnvironmentsFormValuesFromFormState(
  data: DeployEnvironmentEntityFormState,
  gitOpsEnabled: boolean
): EnvironmentYamlV2[] {
  return Array.isArray(data.environments)
    ? data.environments?.map(environment => {
        const environmentsFormState: EnvironmentYamlV2 = {
          environmentRef: environment.value as string
        }

        if (data.environmentInputs?.[environment.value as string]) {
          set(environmentsFormState, 'environmentInputs', data.environmentInputs[environment.value as string])
        }

        if (gitOpsEnabled) {
          const selectedClusters = data.clusters?.[environment.value as string]
          const isClusterRuntime = (selectedClusters as unknown as string) === RUNTIME_INPUT_VALUE

          set(environmentsFormState, 'deployToAll', isClusterRuntime ? (RUNTIME_INPUT_VALUE as any) : !selectedClusters)

          if (selectedClusters) {
            set(
              environmentsFormState,
              'gitOpsClusters',
              Array.isArray(selectedClusters)
                ? selectedClusters.map(cluster => ({
                    identifier: cluster.value as string
                  }))
                : selectedClusters
            )
          }
        } else {
          const selectedInfrastructures = data.infrastructures?.[environment.value as string]
          const isInfrastructureRuntime = (selectedInfrastructures as unknown as string) === RUNTIME_INPUT_VALUE

          set(
            environmentsFormState,
            'deployToAll',
            isInfrastructureRuntime ? (RUNTIME_INPUT_VALUE as any) : !selectedInfrastructures
          )

          if (selectedInfrastructures) {
            set(
              environmentsFormState,
              'infrastructureDefinitions',
              Array.isArray(selectedInfrastructures)
                ? selectedInfrastructures.map(infrastructure => ({
                    identifier: infrastructure.value as string,
                    inputs: data.infrastructureInputs?.[environment.value as string]?.[infrastructure.value as string]
                  }))
                : selectedInfrastructures
            )
          }
        }

        return environmentsFormState
      })
    : data.environments || []
}

export function processMultiEnvironmentFormValues(
  data: DeployEnvironmentEntityFormState,
  gitOpsEnabled: boolean
): DeployEnvironmentEntityConfig {
  if (!isNil(data.environments)) {
    return {
      environments: {
        metadata: {
          parallel: data.parallel
        },
        values: getEnvironmentsFormValuesFromFormState(data, gitOpsEnabled)
      }
    }
  }

  return {
    environments: {
      metadata: {
        parallel: data.parallel
      },
      values: []
    }
  }
}

export function processEnvironmentGroupInitialValues(
  initialValues: DeployEnvironmentEntityConfig,
  gitOpsEnabled: boolean
): DeployEnvironmentEntityFormState {
  let formState: DeployEnvironmentEntityFormState = {}

  if (initialValues.environmentGroup && initialValues.environmentGroup.envGroupRef) {
    set(formState, `environmentGroup`, initialValues.environmentGroup.envGroupRef)

    if (
      getMultiTypeFromValue(initialValues.environmentGroup?.envGroupRef as unknown as string) ===
      MultiTypeInputType.FIXED
    ) {
      formState = {
        ...formState,
        ...getEnvironmentsFormStateFromInitialValues(
          initialValues.environmentGroup.environments,
          initialValues.environmentGroup.deployToAll,
          gitOpsEnabled
        )
      }
    }
  }

  formState.category = 'group'
  return formState
}

export function processEnvironmentGroupFormValues(
  data: DeployEnvironmentEntityFormState,
  gitOpsEnabled: boolean
): DeployEnvironmentEntityConfig {
  if (!isNil(data.environmentGroup)) {
    if (getMultiTypeFromValue(data.environmentGroup) === MultiTypeInputType.RUNTIME) {
      return {
        environmentGroup: {
          envGroupRef: RUNTIME_INPUT_VALUE,
          deployToAll: RUNTIME_INPUT_VALUE as any,
          environments: RUNTIME_INPUT_VALUE as any
        }
      }
    }

    const deployToAll =
      getMultiTypeFromValue(data.environments) === MultiTypeInputType.RUNTIME
        ? (RUNTIME_INPUT_VALUE as any)
        : isEmpty(data.environments)

    return {
      environmentGroup: {
        envGroupRef: data.environmentGroup,
        deployToAll,
        // this an off condition that is used to handle deployToAll in environment groups
        ...(deployToAll === true && { environments: RUNTIME_INPUT_VALUE as any }),
        ...(!isEmpty(data.environments) && {
          environments: getEnvironmentsFormValuesFromFormState(data, gitOpsEnabled)
        })
      }
    }
  }

  return {
    environmentGroup: {
      envGroupRef: ''
    }
  }
}

export function getValidationSchema(getString: UseStringsReturn['getString'], gitOpsEnabled: boolean): Yup.MixedSchema {
  return Yup.mixed()
    .required()
    .test({
      test(valueObj: DeployEnvironmentEntityFormState): boolean | Yup.ValidationError {
        if (valueObj.category === 'single') {
          if (!valueObj.environment) {
            return this.createError({
              path: 'environment',
              message: getString('cd.pipelineSteps.environmentTab.environmentIsRequired')
            })
          }

          if (!gitOpsEnabled && !valueObj.infrastructure && !isValueRuntimeInput(valueObj.environment)) {
            return this.createError({
              path: 'infrastructure',
              message: getString('cd.pipelineSteps.environmentTab.infrastructureIsRequired')
            })
          }

          if (gitOpsEnabled && !valueObj.cluster && !isValueRuntimeInput(valueObj.environment)) {
            return this.createError({
              path: 'cluster',
              message: getString('cd.pipelineSteps.environmentTab.clusterIsRequired')
            })
          }
        } else if (valueObj.category === 'multi') {
          if (
            !(Array.isArray(valueObj.environments) && valueObj.environments.length) &&
            !isValueRuntimeInput(valueObj.environments as unknown as string)
          ) {
            return this.createError({
              path: 'environments',
              message: getString('cd.pipelineSteps.environmentTab.environmentsAreRequired')
            })
          }
        } else if (valueObj.category === 'group') {
          if (!valueObj.environmentGroup) {
            return this.createError({
              path: 'environmentGroup',
              message: getString('cd.pipelineSteps.environmentTab.environmentGroupIsRequired')
            })
          }
        }

        return true
      }
    })
}
