/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, get, isNil, set } from 'lodash-es'
import produce from 'immer'
import { Button, ButtonVariation, Card, Icon, Layout, Text, useConfirmationDialog } from '@wings-software/uicore'
import { Color } from '@wings-software/design-system'
import cx from 'classnames'
import { Intent } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { useToaster } from '@common/exports'
import { DrawerTypes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { useDeploymentContext } from '@cd/context/DeploymentContext/DeploymentContextProvider'
import css from './StepTemplateCard.module.scss'

interface StepTemplateCardProps {
  templateRef: string
  className?: string
  stepTemplateIndex: number
}

export function StepTemplateCard(props: StepTemplateCardProps): React.ReactElement | null {
  const { templateDetailsByRef, stepsFactory, isReadOnly, deploymentConfig, updateDeploymentConfig, setDrawerData } =
    useDeploymentContext()
  const { templateRef, className, stepTemplateIndex } = props
  const templateDetails = get(templateDetailsByRef, templateRef) as TemplateSummaryResponse
  const { childType: templateType } = templateDetails || {}
  const step = stepsFactory.getStep(templateType)
  const { getString } = useStrings()
  const { showSuccess } = useToaster()

  const handleCardClick = React.useCallback(() => {
    setDrawerData({
      type: DrawerTypes.ViewTemplateDetails,
      data: {
        isDrawerOpen: true,
        templateDetails
      }
    })
  }, [templateDetails])

  const handleCardRemove = () => {
    const updatedDeploymentConfig = produce(deploymentConfig, draft => {
      const stepTemplateRefs = deploymentConfig?.execution?.stepTemplateRefs || []
      const updatedStepTemplateRefs = stepTemplateRefs.filter((_, index: number) => index !== stepTemplateIndex)

      set(draft, 'execution.stepTemplateRefs', updatedStepTemplateRefs)
    })

    updateDeploymentConfig(updatedDeploymentConfig)
  }

  const { openDialog: openRemoveStepTemplateDialog } = useConfirmationDialog({
    intent: Intent.DANGER,
    cancelButtonText: getString('no'),
    contentText: getString('cd.removeStepTemplateConfirmationLabel'),
    titleText: getString('cd.removeStepTemplate'),
    confirmButtonText: getString('yes'),
    buttonIntent: Intent.DANGER,
    onCloseDialog: isConfirmed => {
      if (isConfirmed) {
        handleCardRemove()
        showSuccess(getString('cd.removeStepTemplateSuccess'))
      }
    }
  })

  const handleRemoveTemplateClick = React.useCallback(
    (e: React.MouseEvent<Element, MouseEvent>) => {
      e.stopPropagation()
      openRemoveStepTemplateDialog()
    },
    [openRemoveStepTemplateDialog]
  )

  return (
    <Layout.Vertical spacing="small" flex={{ alignItems: 'center' }}>
      <Card
        interactive={!isNil(step)}
        selected={false}
        className={cx(css.paletteCard, className)}
        data-testid={`step-card-${templateRef}-${stepTemplateIndex}`}
        onClick={handleCardClick}
      >
        <Icon size={10} name="template-library" className={css.templateLibraryIcon} />
        {!isReadOnly && (
          <Button
            className={css.closeNode}
            minimal
            icon="cross"
            variation={ButtonVariation.PRIMARY}
            iconProps={{ size: 10 }}
            onClick={handleRemoveTemplateClick}
            withoutCurrentColor={true}
          />
        )}
        {!isNil(step) ? (
          <Icon name={step.getIconName?.()} size={defaultTo(step.getIconSize?.(), 25)} color={step.getIconColor?.()} />
        ) : null}
      </Card>
      <div className={css.stepTemplateCardText}>
        <Text width={100} font={{ size: 'small', align: 'center' }} lineClamp={3} color={Color.GREY_600}>
          {templateDetails?.name || templateRef}
        </Text>
      </div>
    </Layout.Vertical>
  )
}
