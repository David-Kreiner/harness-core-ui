/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { defaultTo, isEmpty } from 'lodash-es'
import { Collapse } from '@blueprintjs/core'
import { useFormikContext } from 'formik'

import {
  ButtonVariation,
  Card,
  Text,
  Color,
  AllowedTypes,
  Container,
  Layout,
  TagsPopover,
  Button,
  ButtonSize
} from '@harness/uicore'

import { useStrings } from 'framework/strings'
import type { Infrastructure } from 'services/cd-ng'

import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import RbacButton from '@rbac/components/Button/Button'

import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import type { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { infraDefinitionTypeMapping } from '@pipeline/utils/stageHelpers'

import type { DeployEnvironmentEntityFormState, InfrastructureData } from '../types'

import css from './InfrastructureEntitiesList.module.scss'

export interface InfrastructureEntityCardProps extends InfrastructureData {
  readonly: boolean
  allowableTypes: AllowedTypes
  onEditClick: (infrastructure: InfrastructureData) => void
  onDeleteClick: (infrastructure: InfrastructureData) => void
  environmentIdentifier: string
}

export function InfrastructureEntityCard({
  infrastructureDefinition,
  infrastructureInputs,
  readonly,
  allowableTypes,
  onEditClick,
  onDeleteClick,
  environmentIdentifier
}: InfrastructureEntityCardProps): React.ReactElement {
  const { getString } = useStrings()
  const { values } = useFormikContext<DeployEnvironmentEntityFormState>()
  const { name, identifier, tags } = infrastructureDefinition

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
            data-testid={`edit-infrastructure-${identifier}`}
            disabled={readonly}
            onClick={() => onEditClick({ infrastructureDefinition, infrastructureInputs })}
            permission={{
              resource: {
                resourceType: ResourceType.ENVIRONMENT,
                resourceIdentifier: identifier
              },
              permission: PermissionIdentifier.EDIT_ENVIRONMENT
            }}
          />
          <Button
            variation={ButtonVariation.ICON}
            icon="remove-minus"
            data-testid={`delete-infrastructure-${identifier}`}
            disabled={readonly}
            onClick={() => onDeleteClick({ infrastructureDefinition, infrastructureInputs })}
          />
        </Container>
      </Layout.Horizontal>
      {infrastructureInputs && values.infrastructureInputs?.[environmentIdentifier]?.[identifier] ? (
        <>
          <Container flex={{ justifyContent: 'center' }}>
            <Button
              icon={showInputs ? 'chevron-up' : 'chevron-down'}
              data-testid="toggle-infrastructure-inputs"
              text={getString(
                showInputs
                  ? 'cd.pipelineSteps.environmentTab.hideInfrastructureInputs'
                  : 'cd.pipelineSteps.environmentTab.viewInfrastructureInputs'
              )}
              variation={ButtonVariation.LINK}
              size={ButtonSize.SMALL}
              onClick={toggle}
            />
          </Container>
          <Collapse keepChildrenMounted={false} isOpen={showInputs}>
            <Container border={{ top: true }} margin={{ top: 'medium' }} padding={{ top: 'large' }}>
              <Text color={Color.GREY_800} font={{ size: 'normal', weight: 'bold' }} margin={{ bottom: 'medium' }}>
                {getString('common.infrastructureInputs')}
              </Text>
              <StepWidget<Infrastructure>
                key={`${environmentIdentifier}_${identifier}`}
                factory={factory}
                template={infrastructureInputs.spec}
                initialValues={{
                  ...(values.infrastructureInputs?.[environmentIdentifier]?.[identifier]?.spec || {}),
                  environmentRef: environmentIdentifier,
                  infrastructureRef: identifier
                }}
                allowableTypes={allowableTypes}
                allValues={{
                  environmentRef: environmentIdentifier,
                  infrastructureRef: identifier
                }}
                type={
                  (infraDefinitionTypeMapping[infrastructureInputs.type as StepType] ||
                    infrastructureInputs?.type) as StepType
                }
                path={`infrastructureInputs.${environmentIdentifier}.${identifier}.spec`}
                readonly={readonly}
                stepViewType={StepViewType.TemplateUsage}
                customStepProps={{
                  // serviceRef: deploymentStage?.service?.serviceRef,
                  environmentRef: environmentIdentifier,
                  infrastructureRef: identifier
                }}
              />
            </Container>
          </Collapse>
        </>
      ) : null}
    </Card>
  )
}
