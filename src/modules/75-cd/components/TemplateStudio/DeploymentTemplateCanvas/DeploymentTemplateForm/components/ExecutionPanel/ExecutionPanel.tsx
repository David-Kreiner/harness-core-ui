/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Position } from '@blueprintjs/core'
import { get, map, noop } from 'lodash-es'
import { Button, Container, IconName, Layout, Text } from '@wings-software/uicore'
import { Color } from '@wings-software/design-system'
import { useStrings } from 'framework/strings'
import { useDeploymentContext } from '@cd/context/DeploymentContext/DeploymentContextProvider'
import { DrawerTypes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { TemplateUsage } from '@templates-library/utils/templatesUtils'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import CardWithOuterTitle from '@common/components/CardWithOuterTitle/CardWithOuterTitle'
import {
  getUpdatedDeploymentConfig,
  getUpdatedTemplateDetailsByRef
} from '@cd/components/TemplateStudio/DeploymentTemplateCanvas/DeploymentTemplateForm/components/ExecutionPanel/ExecutionPanelUtils'
import { StepTemplateCard } from '@cd/components/TemplateStudio/DeploymentTemplateCanvas/DeploymentTemplateForm/components/StepTemplateCard/StepTemplateCard'
import { getScopeBasedTemplateRef } from '@pipeline/utils/templateUtils'
import { useTemplateSelector } from 'framework/Templates/TemplateSelectorContext/useTemplateSelector'
import { TemplatesActionPopover } from '@templates-library/components/TemplatesActionPopover/TemplatesActionPopover'
import css from './ExecutionPanel.module.scss'
export interface StepAdditionMenuItem {
  icon: IconName
  label: string
  onClick: () => void
}

const ALLOWED_STEP_TEMPLATE_TYPES = [StepType.SHELLSCRIPT, StepType.HTTP]

export function ExecutionPanel({ children }: React.PropsWithChildren<unknown>): JSX.Element {
  const {
    deploymentConfig,
    updateDeploymentConfig,
    setDrawerData,
    isReadOnly,
    templateDetailsByRef,
    setTemplateDetailsByRef
  } = useDeploymentContext()
  const stepTemplateRefs = get(deploymentConfig, 'execution.stepTemplateRefs', []) as string[]

  const { getTemplate } = useTemplateSelector()

  const [menuOpen, setMenuOpen] = React.useState(false)

  const { getString } = useStrings()

  const onUseTemplate = async (): Promise<void> => {
    try {
      const { template } = await getTemplate({
        templateType: 'Step',
        filterProperties: {
          childTypes: ALLOWED_STEP_TEMPLATE_TYPES
        },
        disableVersionChange: true,
        allowedUsages: [TemplateUsage.USE]
      })
      const templateRef = getScopeBasedTemplateRef(template)

      const updatedDeploymentConfig = getUpdatedDeploymentConfig({ templateRef, deploymentConfig })
      const updatedTemplateDetailsByRef = getUpdatedTemplateDetailsByRef({
        templateDetailsObj: template,
        templateRef,
        templateDetailsByRef
      })

      setTemplateDetailsByRef(updatedTemplateDetailsByRef)
      updateDeploymentConfig(updatedDeploymentConfig)
      setDrawerData({
        type: DrawerTypes.AddStep
      })
    } catch (_) {
      // Do nothing.. user cancelled template selection
    }
  }

  const renderLinkedStepTemplates = (): (JSX.Element | null)[] =>
    map(stepTemplateRefs, (stepTemplateRef: string, stepTemplateIndex: number) => {
      return stepTemplateRef ? (
        <StepTemplateCard templateRef={stepTemplateRef} stepTemplateIndex={stepTemplateIndex} />
      ) : null
    })

  const handleAddStepClick = React.useCallback(() => {
    setDrawerData({ type: DrawerTypes.AddStep, data: { isDrawerOpen: true } })
  }, [setDrawerData])

  const handleUseTemplateClick = (): void => {
    onUseTemplate()
  }

  const stepAdditionOptions: StepAdditionMenuItem[] = [
    {
      label: getString('cd.createAndUseTemplate'),
      icon: 'plus',
      onClick: handleAddStepClick
    },
    {
      label: getString('templatesLibrary.useTemplateLabel'),
      icon: 'template-library',
      onClick: handleUseTemplateClick
    }
  ]

  return (
    <Container className={css.executionWidgetWrapper}>
      <Layout.Horizontal margin={{ top: 'xlarge', bottom: 'xlarge', left: 'medium', right: 'medium' }}>
        <Text color={Color.BLACK} className={css.headerText} tooltipProps={{ dataTooltipId: 'deploymentStepsDT' }}>
          {getString('cd.deploymentSteps')}
        </Text>
        <TemplatesActionPopover
          open={menuOpen}
          minimal={true}
          items={stepAdditionOptions}
          position={Position.BOTTOM}
          disabled={isReadOnly}
          setMenuOpen={setMenuOpen}
          usePortal
          className={css.marginLeft}
        >
          <Button
            icon="plus"
            rightIcon="chevron-down"
            text={getString('addStep')}
            onClick={noop}
            disabled={isReadOnly}
            className={css.addButton}
          />
        </TemplatesActionPopover>
      </Layout.Horizontal>

      <CardWithOuterTitle className={css.deploymentStepsCard}>
        <Layout.Vertical spacing="medium" width={'100%'}>
          <Text color={Color.GREY_500} font={{ size: 'small', weight: 'semi-bold' }}>
            {getString('cd.useStepTemplatesForYourDeploymentType')}
          </Text>
          <Container className={css.stepsContainer}>{renderLinkedStepTemplates()}</Container>
        </Layout.Vertical>
      </CardWithOuterTitle>
      {children}
    </Container>
  )
}
