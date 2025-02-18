/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { defaultTo, get, isEmpty } from 'lodash-es'
import { Collapse, Divider } from '@blueprintjs/core'
import { useFormikContext } from 'formik'
import { Color } from '@harness/design-system'
import {
  ButtonVariation,
  Card,
  Text,
  AllowedTypes,
  Container,
  Layout,
  TagsPopover,
  Button,
  ButtonSize,
  SelectOption
} from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { NGEnvironmentInfoConfig, ServiceSpec } from 'services/cd-ng'

import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import RbacButton from '@rbac/components/Button/Button'

import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import { getStepTypeByDeploymentType } from '@pipeline/utils/stageHelpers'

import { getIdentifierFromName } from '@common/utils/StringUtils'
import type {
  DeployEnvironmentEntityCustomStepProps,
  DeployEnvironmentEntityFormState,
  EnvironmentData
} from '../types'
import DeployInfrastructure from '../DeployInfrastructure/DeployInfrastructure'
import DeployCluster from '../DeployCluster/DeployCluster'
import InlineEntityFilters from '../components/InlineEntityFilters/InlineEntityFilters'
import {
  EntityFilterType,
  EntityType,
  InlineEntityFiltersRadioType
} from '../components/InlineEntityFilters/InlineEntityFiltersUtils'

import css from './EnvironmentEntitiesList.module.scss'

export interface EnvironmentEntityCardProps extends EnvironmentData, Required<DeployEnvironmentEntityCustomStepProps> {
  readonly: boolean
  allowableTypes: AllowedTypes
  onEditClick: (environment: EnvironmentData) => void
  onDeleteClick: (environment: EnvironmentData) => void
  initialValues: DeployEnvironmentEntityFormState
}

const getScopedRefUsingIdentifier = (
  values: any,
  environment: NGEnvironmentInfoConfig & {
    yaml: string
  }
): string => {
  const envRef = get(values, 'environment')
  if (envRef) {
    return envRef
  }
  return get(values, 'environments', []).find(
    (env: SelectOption) => getIdentifierFromName(env.label) === environment?.identifier
  )?.value
}

export function EnvironmentEntityCard({
  environment,
  environmentInputs,
  readonly,
  allowableTypes,
  onEditClick,
  onDeleteClick,
  initialValues,
  stageIdentifier,
  deploymentType,
  customDeploymentRef,
  gitOpsEnabled
}: EnvironmentEntityCardProps): React.ReactElement {
  const { getString } = useStrings()
  const { values, setFieldValue } = useFormikContext<DeployEnvironmentEntityFormState>()
  const { name, identifier, tags } = environment
  const scopedEnvRef = getScopedRefUsingIdentifier(values, environment)
  const filterPrefix = useMemo(() => `environmentFilters.${identifier}`, [identifier])

  const handleFilterRadio = (selectedRadioValue: InlineEntityFiltersRadioType): void => {
    if (selectedRadioValue === InlineEntityFiltersRadioType.MANUAL) {
      setFieldValue(filterPrefix, undefined)
    }
  }

  const [showInputs, setShowInputs] = useState(false)

  function toggle(): void {
    setShowInputs(show => !show)
  }

  return (
    <Card className={css.card}>
      <Layout.Horizontal flex={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Layout.Vertical>
          <Layout.Horizontal
            flex={{ justifyContent: 'flex-start', alignItems: 'flex-end' }}
            spacing="small"
            margin={{ bottom: 'xsmall' }}
          >
            <Text color={Color.PRIMARY_7}>{name}</Text>
            {!isEmpty(tags) && (
              <TagsPopover iconProps={{ size: 14, color: Color.GREY_600 }} tags={defaultTo(tags, {})} />
            )}
          </Layout.Horizontal>

          <Text color={Color.GREY_500} font={{ size: 'small' }} lineClamp={1}>
            {getString('common.ID')}: {identifier}
          </Text>
        </Layout.Vertical>

        <Container>
          <RbacButton
            variation={ButtonVariation.ICON}
            icon="edit"
            data-testid={`edit-environment-${identifier}`}
            disabled={readonly}
            onClick={() => onEditClick({ environment, environmentInputs })}
            permission={{
              resource: {
                resourceType: ResourceType.ENVIRONMENT,
                resourceIdentifier: identifier
              },
              permission: PermissionIdentifier.EDIT_ENVIRONMENT
            }}
          />
          <RbacButton
            variation={ButtonVariation.ICON}
            icon="remove-minus"
            data-testid={`delete-environment-${identifier}`}
            disabled={readonly}
            onClick={() => onDeleteClick({ environment, environmentInputs })}
            permission={{
              resource: {
                resourceType: ResourceType.ENVIRONMENT,
                resourceIdentifier: identifier
              },
              permission: PermissionIdentifier.DELETE_ENVIRONMENT
            }}
          />
        </Container>
      </Layout.Horizontal>

      {environmentInputs ? (
        <>
          <Container flex={{ justifyContent: 'center' }}>
            <Button
              icon={showInputs ? 'chevron-up' : 'chevron-down'}
              data-testid="toggle-environment-inputs"
              text={getString(
                showInputs
                  ? 'cd.pipelineSteps.environmentTab.hideEnvironmentInputs'
                  : 'cd.pipelineSteps.environmentTab.viewEnvironmentInputs'
              )}
              variation={ButtonVariation.LINK}
              size={ButtonSize.SMALL}
              onClick={toggle}
            />
          </Container>
          <Collapse keepChildrenMounted={false} isOpen={showInputs}>
            {!isEmpty(environmentInputs.variables) && (
              <Container border={{ top: true }} margin={{ top: 'medium' }} padding={{ top: 'large' }}>
                <Text color={Color.GREY_800} font={{ size: 'normal', weight: 'bold' }} margin={{ bottom: 'medium' }}>
                  {getString('common.environmentInputs')}
                </Text>
                <StepWidget<ServiceSpec>
                  factory={factory}
                  initialValues={values.environmentInputs?.[scopedEnvRef] || {}}
                  allowableTypes={allowableTypes}
                  template={environmentInputs}
                  type={getStepTypeByDeploymentType(deploymentType)}
                  stepViewType={StepViewType.TemplateUsage}
                  path={`environmentInputs.['${scopedEnvRef}']`}
                  readonly={readonly}
                  customStepProps={{
                    stageIdentifier
                  }}
                />
              </Container>
            )}

            {!isEmpty(environmentInputs.overrides) && (
              <Container border={{ top: true }} margin={{ top: 'medium' }} padding={{ top: 'large' }}>
                <Text color={Color.GREY_800} font={{ size: 'normal', weight: 'bold' }} margin={{ bottom: 'medium' }}>
                  {getString('common.environmentOverrides')}
                </Text>
                <StepWidget<ServiceSpec>
                  factory={factory}
                  initialValues={values.environmentInputs?.[scopedEnvRef]?.overrides || {}}
                  allowableTypes={allowableTypes}
                  template={environmentInputs.overrides}
                  type={getStepTypeByDeploymentType(deploymentType)}
                  stepViewType={StepViewType.TemplateUsage}
                  path={`environmentInputs.['${scopedEnvRef}'].overrides`}
                  readonly={readonly}
                  customStepProps={{
                    stageIdentifier
                  }}
                />
              </Container>
            )}
          </Collapse>
        </>
      ) : null}

      {!values.environment && Array.isArray(values.environments) && (
        <>
          <Container margin={{ top: 'medium', bottom: 'medium' }}>
            <Divider />
          </Container>
          <InlineEntityFilters
            filterPrefix={filterPrefix}
            entityStringKey={gitOpsEnabled ? 'common.clusters' : 'common.infrastructures'}
            onRadioValueChange={handleFilterRadio}
            readonly={readonly}
            baseComponent={
              <>
                {gitOpsEnabled ? (
                  <DeployCluster
                    initialValues={initialValues}
                    readonly={readonly}
                    allowableTypes={allowableTypes}
                    environmentIdentifier={scopedEnvRef}
                    isMultiCluster
                  />
                ) : (
                  <DeployInfrastructure
                    initialValues={initialValues}
                    readonly={readonly}
                    allowableTypes={allowableTypes}
                    environmentIdentifier={scopedEnvRef}
                    isMultiInfrastructure
                    deploymentType={deploymentType}
                    customDeploymentRef={customDeploymentRef}
                  />
                )}
              </>
            }
            entityFilterListProps={{
              entities: [gitOpsEnabled ? EntityType.CLUSTERS : EntityType.INFRASTRUCTURES],
              filters: [EntityFilterType.ALL, EntityFilterType.TAGS],
              placeholderProps: {
                entity: getString('common.filterOnName', {
                  name: getString(gitOpsEnabled ? 'common.clusters' : 'common.infrastructures')
                }),
                tags: getString('common.filterOnName', { name: getString('typeLabel') })
              },
              allowableTypes
            }}
          />
        </>
      )}
    </Card>
  )
}
