/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useFormikContext } from 'formik'
import { get, isEmpty, isNil, pick, set, unset } from 'lodash-es'
import cx from 'classnames'

import { Color, Container, RUNTIME_INPUT_VALUE, Text } from '@harness/uicore'

import { useStrings } from 'framework/strings'
import type { DeploymentStageConfig, EnvironmentYamlV2, Infrastructure, ServiceSpec } from 'services/cd-ng'

import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { isValueRuntimeInput } from '@common/utils/utils'

import type { DeployStageConfig } from '@pipeline/utils/DeployStageInterface'
import {
  getCustomStepProps,
  getStepTypeByDeploymentType,
  infraDefinitionTypeMapping
} from '@pipeline/utils/stageHelpers'

import { StepWidget } from '../AbstractSteps/StepWidget'
import factory from '../PipelineSteps/PipelineStepFactory'
import { StepType } from '../PipelineSteps/PipelineStepInterface'
import type { StageInputSetFormProps } from './StageInputSetForm'

import css from './PipelineInputSetForm.module.scss'

export default function EnvironmentsInputSetForm({
  // This is the resolved pipeline yaml
  deploymentStage,
  // This is the resolved/updated template yaml
  deploymentStageTemplate,
  path,
  readonly,
  viewType,
  stageIdentifier,
  allowableTypes
}: Omit<StageInputSetFormProps, 'formik' | 'executionIdentifier'>): React.ReactElement {
  const { getString } = useStrings()
  const { NG_SVC_ENV_REDESIGN: isSvcEnvEntityEnabled, MULTI_SERVICE_INFRA: isMultiSvcInfraEnabled } = useFeatureFlags()
  const formik = useFormikContext<DeploymentStageConfig>()
  // This is the value of allValues
  const deploymentStageInputSet = get(formik?.values, path, {})

  return (
    <>
      {isSvcEnvEntityEnabled && deploymentStageTemplate?.environment && deploymentStage?.environment && (
        <div id={`Stage.${stageIdentifier}.Environment`} className={cx(css.accordionSummary)}>
          <StepWidget
            factory={factory}
            initialValues={deploymentStageInputSet}
            allowableTypes={allowableTypes}
            allValues={deploymentStage}
            template={deploymentStageTemplate}
            type={StepType.DeployInfrastructure}
            stepViewType={viewType}
            path={`${path}.environment`}
            readonly={readonly}
            customStepProps={{
              getString,
              // Show clusters instead of infra on env selection
              gitOpsEnabled: deploymentStage.gitOpsEnabled,
              // load service overrides for environment
              serviceRef: deploymentStage.service?.serviceRef,
              // load infrastructures/clusters in environment
              environmentRef: deploymentStage.environment?.environmentRef,
              // load infrastructure runtime inputs
              infrastructureRef: deploymentStage.environment?.infrastructureDefinitions?.[0].identifier,
              // load cluster runtime inputs
              clusterRef: deploymentStage.environment?.gitOpsClusters?.[0].identifier,
              // required for artifact manifest inputs
              stageIdentifier,
              // required for filtering infrastructures
              deploymentType: deploymentStage?.deploymentType,
              customDeploymentData: deploymentStage?.customDeploymentRef
            }}
            onUpdate={values => {
              if (deploymentStageInputSet?.environment) {
                formik?.setValues(set(formik?.values, `${path}.environment`, values.environment))
              }
            }}
          />
          {(deploymentStageTemplate as DeployStageConfig).environment?.infrastructureDefinitions &&
            ((deploymentStageTemplate as DeployStageConfig).environment
              ?.infrastructureDefinitions as unknown as string) !== RUNTIME_INPUT_VALUE && (
              <>
                {deploymentStage.environment?.environmentRef &&
                  ((deploymentStage as DeployStageConfig)?.environment
                    ?.infrastructureDefinitions as unknown as string) !== RUNTIME_INPUT_VALUE && (
                    <div className={css.inputheader}>{getString('infrastructureText')}</div>
                  )}
                {deploymentStageTemplate.environment?.infrastructureDefinitions
                  ?.map((infrastructureDefinition, index) => {
                    return (
                      <>
                        <StepWidget<Infrastructure>
                          key={infrastructureDefinition.identifier}
                          factory={factory}
                          template={infrastructureDefinition.inputs?.spec}
                          initialValues={{
                            ...deploymentStageInputSet?.environment?.infrastructureDefinitions?.[index]?.inputs?.spec,
                            environmentRef: deploymentStage?.environment?.environmentRef,
                            infrastructureRef: infrastructureDefinition.identifier,
                            deploymentType: deploymentStage?.deploymentType
                          }}
                          allowableTypes={allowableTypes}
                          allValues={{
                            ...deploymentStage?.environment?.infrastructureDefinitions?.[index]?.inputs?.spec,
                            environmentRef: deploymentStage?.environment?.environmentRef,
                            infrastructureRef: infrastructureDefinition.identifier
                          }}
                          type={
                            (infraDefinitionTypeMapping[infrastructureDefinition?.inputs?.type as StepType] ||
                              infrastructureDefinition?.inputs?.type) as StepType
                          }
                          path={`${path}.environment.infrastructureDefinitions.${index}.inputs.spec`}
                          readonly={readonly}
                          stepViewType={viewType}
                          customStepProps={{
                            ...getCustomStepProps((deploymentStage?.deploymentType as StepType) || '', getString),
                            serviceRef: deploymentStage?.service?.serviceRef,
                            environmentRef: deploymentStage?.environment?.environmentRef,
                            infrastructureRef: deploymentStage?.environment?.infrastructureDefinitions?.[0].identifier
                          }}
                          onUpdate={data => {
                            /* istanbul ignore next */
                            if (
                              deploymentStageInputSet?.environment?.infrastructureDefinitions?.[index]?.inputs?.spec
                            ) {
                              unset(data, 'environmentRef')
                              unset(data, 'infrastructureRef')
                              deploymentStageInputSet.environment.infrastructureDefinitions[index].inputs.spec = data
                              formik?.setValues(set(formik?.values, path, deploymentStageInputSet))
                            }
                          }}
                        />
                      </>
                    )
                  })
                  .filter(data => data)}
              </>
            )}
        </div>
      )}

      {isSvcEnvEntityEnabled && isMultiSvcInfraEnabled && deploymentStageTemplate.environments && (
        <div id={`Stage.${stageIdentifier}.Environments`} className={cx(css.accordionSummary)}>
          <div className={css.inputheader}>{getString('environments')}</div>
          <div className={css.nestedAccordions}>
            <MultiEnvironmentsInputSetForm
              deploymentStage={deploymentStage}
              deploymentStageTemplate={deploymentStageTemplate}
              allowableTypes={allowableTypes}
              path={path}
              viewType={viewType}
              readonly={readonly}
              stageIdentifier={stageIdentifier}
              pathToEnvironments={'environments.values'}
              entityType={'environments'}
            />
          </div>
        </div>
      )}

      <EnvironmentGroupInputSetForm
        deploymentStage={deploymentStage}
        deploymentStageTemplate={deploymentStageTemplate}
        allowableTypes={allowableTypes}
        path={path}
        viewType={viewType}
        readonly={readonly}
        stageIdentifier={stageIdentifier}
      />
    </>
  )
}

// This form is used for loading multi environments under environmentGroup.environments or environments.values
function MultiEnvironmentsInputSetForm({
  // This is the resolved pipeline yaml
  deploymentStage,
  // This is the resolved/updated template yaml
  deploymentStageTemplate,
  path,
  readonly,
  viewType,
  stageIdentifier,
  allowableTypes,
  entityType,
  pathToEnvironments
}: Omit<StageInputSetFormProps, 'formik' | 'executionIdentifier'> & {
  entityType: 'environments' | 'environmentGroup'
  pathToEnvironments: 'environments.values' | 'environmentGroup.environments'
}): React.ReactElement {
  const { getString } = useStrings()
  const formik = useFormikContext<DeploymentStageConfig>()
  // This is the value of AllValues
  const deploymentStageInputSet = get(formik?.values, path, {})

  const areEnvironmentsPreSelectedInStudio = Array.isArray(get(deploymentStage, pathToEnvironments))
    ? get(deploymentStage, pathToEnvironments).some(
        (environment: EnvironmentYamlV2) => !isValueRuntimeInput(environment.environmentRef)
      )
    : false

  /** If environments are pre selected in studio, then hide the input field. Else, show the environments selection field in the following scenarios
   * 1. pathToEnvironments is a runtime value - condition 1
   * 2. When 1 is true and the user selects the environments, we need to still continue to show it - condition 2
   *    a. The check for deployToAll of false in 'deploymentStage' is required to show the field in case of 1 and 2,
   *      as then the values of deployToAll in the above scenarios is either <input> or true, and not false */
  const showEnvironmentsSelectionInputField =
    !areEnvironmentsPreSelectedInStudio &&
    (isValueRuntimeInput(get(deploymentStageTemplate, pathToEnvironments) as unknown as string) ||
      (Array.isArray(get(deploymentStageTemplate, pathToEnvironments)) &&
        deploymentStage?.environmentGroup?.deployToAll !== false))

  return (
    <>
      {showEnvironmentsSelectionInputField && (
        <StepWidget
          factory={factory}
          initialValues={pick(deploymentStageInputSet, entityType)}
          template={pick(deploymentStageTemplate, entityType)}
          type={StepType.DeployEnvironmentEntity}
          stepViewType={viewType}
          path={path}
          allowableTypes={allowableTypes}
          readonly={readonly}
          customStepProps={{
            gitOpsEnabled: deploymentStage?.gitOpsEnabled,
            pathSuffix: pathToEnvironments,
            // If this is passed, the environments list is fetched based on this query param
            envGroupIdentifier: isValueRuntimeInput(deploymentStageTemplate.environmentGroup?.envGroupRef as string)
              ? deploymentStageInputSet.environmentGroup.envGroupRef
              : deploymentStage?.environmentGroup?.envGroupRef,
            isMultiEnvironment: true,
            /** This takes care of hiding the field in case deployToAll is true
             * If the question arises why another condition for this scenario?
             * Because we need to repeat the same selection steps without the field*/
            deployToAllEnvironments: deploymentStage?.environmentGroup?.deployToAll
          }}
        />
      )}

      {/** If environments are selected in the pipeline or in the input view, list the inputs under them
       * This can be environment Inputs, service override inputs, infrastructureDefinitions */}
      {Array.isArray(get(deploymentStageTemplate, pathToEnvironments)) ? (
        <>
          {(get(deploymentStageTemplate, pathToEnvironments) as EnvironmentYamlV2[]).map(
            (environmentTemplate, index) => {
              const deploymentType = deploymentStage?.deploymentType
              // ! This is an environment object. Not to be confused with any path prop
              const environment: EnvironmentYamlV2 = get(deploymentStageInputSet, `${pathToEnvironments}[${index}]`, {})

              // The deploymentStageTemplate does not always contain all the stages, but deploymentStage does.
              // Hence, we need to get the right environment info while using deploymentStage. Index matching does not work
              const environmentInDeploymentStage: EnvironmentYamlV2 = Array.isArray(
                get(deploymentStage, `${pathToEnvironments}`)
              )
                ? get(deploymentStage, `${pathToEnvironments}`)?.find(
                    (env: EnvironmentYamlV2) => env.environmentRef === environmentTemplate.environmentRef
                  )
                : {}

              const showEnvironmentVariables = Array.isArray(environmentTemplate?.environmentInputs?.variables)
              const showEnvironmentOverrides = !isEmpty(environmentTemplate?.environmentInputs?.overrides)
              /** Show the infrastructures selection field in the following scenarios
               * 1. environmentTemplate.infrastructureDefinitions is a runtime value - condition 1
               * 2. When 1 is true and the user selects the environments, we need to still continue to show it - condition 2
               *    a. The check for deployToAll of false in 'deploymentStage' is required to show the field in case of 1 and 2,
               *      as then the values of deployToAll in the above scenarios is either <input> or true, and not false */
              const showInfrastructuresSelectionInputField =
                isValueRuntimeInput(environmentTemplate.infrastructureDefinitions as unknown as string) ||
                (Array.isArray(environmentTemplate.infrastructureDefinitions) &&
                  environmentInDeploymentStage?.deployToAll !== false)

              /** Show the clusters selection field in the following scenarios
               * 1. pathToEnvironments is a runtime value - condition 1
               * 2. When 1 is true and the user selects the environments, we need to still continue to show it - condition 2
               *    a. The check for deployToAll of false in 'deploymentStage' is required to show the field in case of 1 and 2,
               *      as then the values of deployToAll in the above scenarios is either <input> or true, and not false */
              const showClustersSelectionInputField =
                isValueRuntimeInput(environmentTemplate.gitOpsClusters as unknown as string) ||
                (Array.isArray(environmentTemplate.gitOpsClusters) &&
                  environmentInDeploymentStage?.deployToAll !== false)

              /* If infrastructureDefinitions are selected in the pipeline or in the input view, list the inputs under them */
              const showInfrastructuresInputSetForm =
                Array.isArray(environmentTemplate.infrastructureDefinitions) &&
                environmentTemplate?.infrastructureDefinitions?.some(infraTemplate => !isNil(infraTemplate.inputs))

              const showEnvironmentPrefix =
                showEnvironmentVariables ||
                showEnvironmentOverrides ||
                showClustersSelectionInputField ||
                showInfrastructuresSelectionInputField ||
                showInfrastructuresInputSetForm

              return (
                deploymentType &&
                environment.environmentRef &&
                stageIdentifier && (
                  <React.Fragment key={`${environment.environmentRef}_${index}`}>
                    {showEnvironmentPrefix && (
                      <Text
                        font={{ size: 'normal', weight: 'bold' }}
                        padding={{ bottom: 'medium' }}
                        color={Color.GREY_700}
                      >
                        {getString('common.environmentPrefix', { name: environment.environmentRef })}
                      </Text>
                    )}
                    <Container padding={{ left: 'medium' }}>
                      {/* If there are runtime environment inputs */}
                      {showEnvironmentVariables && (
                        <>
                          <Text
                            font={{ size: 'normal', weight: 'bold' }}
                            padding={{ bottom: 'medium' }}
                            color={Color.GREY_600}
                          >
                            {getString('environmentVariables')}
                          </Text>
                          <Container padding={{ left: 'medium' }}>
                            <StepWidget<ServiceSpec>
                              factory={factory}
                              initialValues={get(
                                deploymentStageInputSet,
                                `${pathToEnvironments}[${index}].environmentInputs`,
                                {
                                  variables: []
                                }
                              )}
                              allowableTypes={allowableTypes}
                              template={get(
                                deploymentStageTemplate,
                                `${pathToEnvironments}[${index}].environmentInputs`,
                                {}
                              )}
                              type={getStepTypeByDeploymentType(deploymentType)}
                              stepViewType={viewType}
                              path={`${path}.${pathToEnvironments}[${index}].environmentInputs`}
                              readonly={readonly}
                              customStepProps={{
                                stageIdentifier,
                                allValues: get(environmentInDeploymentStage, `environmentInputs`, {
                                  variables: []
                                })
                              }}
                            />
                          </Container>
                        </>
                      )}

                      {showEnvironmentOverrides && (
                        <>
                          <Text
                            font={{ size: 'normal', weight: 'bold' }}
                            padding={{ bottom: 'medium' }}
                            color={Color.GREY_600}
                          >
                            {getString('common.environmentOverrides')}
                          </Text>
                          <Container padding={{ left: 'medium' }}>
                            <StepWidget<ServiceSpec>
                              factory={factory}
                              initialValues={get(
                                deploymentStageInputSet,
                                `${pathToEnvironments}[${index}].environmentInputs.overrides`,
                                {
                                  variables: []
                                }
                              )}
                              allowableTypes={allowableTypes}
                              template={get(
                                deploymentStageTemplate,
                                `${pathToEnvironments}[${index}].environmentInputs.overrides`,
                                {}
                              )}
                              type={getStepTypeByDeploymentType(deploymentType)}
                              stepViewType={viewType}
                              path={`${path}.${pathToEnvironments}[${index}].environmentInputs.overrides`}
                              readonly={readonly}
                              customStepProps={{
                                stageIdentifier
                              }}
                            />
                          </Container>
                        </>
                      )}

                      {showClustersSelectionInputField && (
                        <StepWidget
                          factory={factory}
                          initialValues={environment}
                          template={environmentTemplate}
                          type={StepType.DeployClusterEntity}
                          stepViewType={viewType}
                          path={`${path}.${pathToEnvironments}[${index}]`}
                          allowableTypes={allowableTypes}
                          readonly={readonly}
                          customStepProps={{
                            environmentIdentifier: environment.environmentRef,
                            isMultipleCluster: true,
                            deployToAllClusters: environmentInDeploymentStage?.deployToAll
                          }}
                        />
                      )}

                      {showInfrastructuresSelectionInputField && (
                        <StepWidget
                          factory={factory}
                          initialValues={environment}
                          template={environmentTemplate}
                          type={StepType.DeployInfrastructureEntity}
                          stepViewType={viewType}
                          path={`${path}.${pathToEnvironments}[${index}]`}
                          allowableTypes={allowableTypes}
                          readonly={readonly}
                          customStepProps={{
                            deploymentType,
                            environmentIdentifier: environment.environmentRef,
                            isMultipleInfrastructure: true,
                            customDeploymentRef: deploymentStage?.customDeploymentRef,
                            deployToAllInfrastructures: environmentInDeploymentStage?.deployToAll
                          }}
                        />
                      )}

                      {showInfrastructuresInputSetForm
                        ? environmentTemplate?.infrastructureDefinitions?.map(
                            (infrastructureDefinitionTemplate, infraIndex) => {
                              const infraInputs = infrastructureDefinitionTemplate.inputs

                              return infraInputs?.identifier ? (
                                <>
                                  <Text font={{ size: 'normal', weight: 'bold' }} color={Color.GREY_700}>
                                    {getString('common.infrastructurePrefix', {
                                      name: infraInputs.identifier
                                    })}
                                  </Text>
                                  <Container padding={{ left: 'medium' }}>
                                    <StepWidget<Infrastructure>
                                      key={infraInputs.identifier}
                                      factory={factory}
                                      template={infraInputs?.spec}
                                      initialValues={{
                                        ...deploymentStageInputSet?.infrastructureDefinitions?.[infraIndex]?.inputs
                                          ?.spec,
                                        environmentRef: environment.environmentRef,
                                        infrastructureRef: infraInputs.identifier
                                      }}
                                      allowableTypes={allowableTypes}
                                      allValues={{
                                        environmentRef: environment.environmentRef,
                                        infrastructureRef: infraInputs.identifier
                                      }}
                                      type={
                                        (infraDefinitionTypeMapping[infraInputs.type as StepType] ||
                                          infraInputs?.type) as StepType
                                      }
                                      path={`${path}.${pathToEnvironments}[${index}].infrastructureDefinitions.${infraIndex}.inputs.spec`}
                                      readonly={readonly}
                                      stepViewType={viewType}
                                      customStepProps={{
                                        ...getCustomStepProps(
                                          (deploymentStage?.deploymentType as StepType) || '',
                                          getString
                                        ),
                                        environmentRef: environment.environmentRef,
                                        infrastructureRef: infraInputs.identifier
                                      }}
                                      onUpdate={data => {
                                        /* istanbul ignore next */
                                        if (
                                          get(
                                            deploymentStageInputSet,
                                            `${path}.${pathToEnvironments}[${index}].infrastructureDefinitions.[${infraIndex}].inputs.spec`
                                          )
                                        ) {
                                          set(
                                            deploymentStageInputSet,
                                            `${path}.${pathToEnvironments}[${index}].infrastructureDefinitions.[${infraIndex}].inputs.spec`,
                                            data
                                          )
                                          formik?.setValues(
                                            set(
                                              formik?.values,
                                              `${path}.${pathToEnvironments}[${infraIndex}]`,
                                              deploymentStageInputSet
                                            )
                                          )
                                        }
                                      }}
                                    />
                                  </Container>
                                </>
                              ) : null
                            }
                          )
                        : null}
                    </Container>
                  </React.Fragment>
                )
              )
            }
          )}
        </>
      ) : null}
    </>
  )
}

function EnvironmentGroupInputSetForm({
  // This is the resolved pipeline yaml
  deploymentStage,
  // This is the resolved/updated template yaml
  deploymentStageTemplate,
  path,
  readonly,
  viewType,
  stageIdentifier,
  allowableTypes
}: Omit<StageInputSetFormProps, 'formik' | 'executionIdentifier'>): React.ReactElement | null {
  const { getString } = useStrings()
  const { NG_SVC_ENV_REDESIGN: isSvcEnvEntityEnabled, MULTI_SERVICE_INFRA: isMultiSvcInfraEnabled } = useFeatureFlags()
  const formik = useFormikContext<DeploymentStageConfig>()
  // This is the value of allValues
  const deploymentStageInputSet = get(formik?.values, path, {})

  if (!(isSvcEnvEntityEnabled && deploymentStageTemplate?.environmentGroup && deploymentStage?.environmentGroup)) {
    return null
  }

  /** This shows the env group identifier when env group is fixed in the pipeline studio */
  const environmentGroupLabel = !isValueRuntimeInput(deploymentStageTemplate.environmentGroup.envGroupRef as string)
    ? `: ${deploymentStage.environmentGroup.envGroupRef}`
    : ''

  /** If the template has envGroupRef marked as runtime, then we need to give user the option to select environment group at runtime.
   * The below StepWidget handles fetching the env groups, and then rendering the input field for the same. */
  const showEnvironmentGroupSelectionInputField = isValueRuntimeInput(
    deploymentStageTemplate.environmentGroup.envGroupRef
  )

  /** Show the environments input form if
   * 1. Env group is fixed in the pipeline studio (deploymentStage), or
   * 2. Env group is runtime in pipeline studio and the value is then selected in the input form (deploymentStageInputSet)
   */
  const showEnvironmentsInputSetForm = isValueRuntimeInput(deploymentStageTemplate.environmentGroup.envGroupRef)
    ? deploymentStageInputSet?.environmentGroup?.envGroupRef
    : deploymentStage?.environmentGroup?.envGroupRef

  return (
    <>
      {/* This will be removed once environment group as runtime is accepted or multi infra changes go through */}
      {!isMultiSvcInfraEnabled && (
        <div id={`Stage.${stageIdentifier}.EnvironmentGroup`} className={cx(css.accordionSummary)}>
          <StepWidget
            factory={factory}
            initialValues={deploymentStage}
            allowableTypes={allowableTypes}
            template={deploymentStageTemplate}
            type={StepType.DeployInfrastructure}
            stepViewType={viewType}
            path={path}
            readonly={readonly}
            customStepProps={{
              stageIdentifier
            }}
          />
        </div>
      )}

      {isMultiSvcInfraEnabled && (
        <div id={`Stage.${stageIdentifier}.EnvironmentGroup`} className={cx(css.accordionSummary)}>
          <div className={css.inputheader}>
            {getString('common.environmentGroup.label')}
            {environmentGroupLabel}
          </div>
          <div className={css.nestedAccordions}>
            {showEnvironmentGroupSelectionInputField && (
              <StepWidget
                factory={factory}
                initialValues={pick(deploymentStage, ['environmentGroup'])}
                allowableTypes={allowableTypes}
                template={pick(deploymentStageTemplate, 'environmentGroup')}
                type={StepType.DeployEnvironmentGroup}
                allValues={pick(deploymentStageInputSet, 'environmentGroup')}
                stepViewType={viewType}
                path={path}
                readonly={readonly}
              />
            )}
            <Container padding={{ left: 'medium' }}>
              {showEnvironmentsInputSetForm && (
                <MultiEnvironmentsInputSetForm
                  deploymentStage={deploymentStage}
                  deploymentStageTemplate={deploymentStageTemplate}
                  allowableTypes={allowableTypes}
                  path={path}
                  viewType={viewType}
                  readonly={readonly}
                  stageIdentifier={stageIdentifier}
                  pathToEnvironments="environmentGroup.environments"
                  entityType="environmentGroup"
                />
              )}
            </Container>
          </div>
        </div>
      )}
    </>
  )
}
