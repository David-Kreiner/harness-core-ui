/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { SyntheticEvent } from 'react'
import { Button, Container } from '@wings-software/uicore'
import { isEmpty, merge, defaultTo } from 'lodash-es'
import { Drawer, Position } from '@blueprintjs/core'
import type { StepElementConfig } from 'services/cd-ng'
import type { StepData } from 'services/pipeline-ng'
import { StepPalette } from '@pipeline/components/PipelineStudio/StepPalette/StepPalette'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { useStrings } from 'framework/strings'
import { TemplateDetails } from '@templates-library/components/TemplateDetails/TemplateDetails'
import { StageType } from '@pipeline/utils/stageHelpers'
import { useDeploymentContext } from '@cd/context/DeploymentContext/DeploymentContextProvider'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { DrawerSizes, DrawerTypes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import {
  StepCommandsWithRef as StepCommands,
  StepFormikRef
} from '@pipeline/components/PipelineStudio/StepCommands/StepCommands'
import type { TemplateSummaryResponse } from 'services/template-ng'
import type { StepOrStepGroupOrTemplateStepData } from '@pipeline/components/PipelineStudio/StepCommands/StepCommandTypes'
import { StepCommandsViews, Values } from '@pipeline/components/PipelineStudio/StepCommands/StepCommandTypes'
import { getStepDataFromValues } from '@pipeline/utils/stepUtils'
import { generateRandomString } from '@pipeline/components/PipelineStudio/ExecutionGraph/ExecutionGraphUtil'
import { DeploymentConfigStepDrawerTitle } from './DeploymentConfigStepDrawerTitle'
import css from './DeploymentConfigStepDrawer.module.scss'

const DEFAULT_STEP_PALETTE_MODULE_INFO = [
  { module: 'cd', category: 'Utilities', shouldShowCommonSteps: true, commonStepCategory: 'Utilities' }
]

function TemplateDetailsWrapper() {
  const { drawerData } = useDeploymentContext()
  const { isGitSyncEnabled: isGitSyncEnabledForProject, gitSyncEnabledOnlyForFF } = useAppStore()
  const isGitSyncEnabled = isGitSyncEnabledForProject && /* istanbul ignore next */ !gitSyncEnabledOnlyForFF
  const templateDetailsToView = drawerData.data?.templateDetails
  const { getString } = useStrings()

  const templateDetailsComponent = (
    <TemplateDetails disableVersionChange={true} template={templateDetailsToView as TemplateSummaryResponse} />
  )

  if (isEmpty(templateDetailsToView)) {
    return <NoResultsView minimal text={getString('templatesLibrary.templateDoesNotExist')} />
  }

  return isGitSyncEnabled ? (
    /* istanbul ignore next */ <GitSyncStoreProvider>{templateDetailsComponent}</GitSyncStoreProvider>
  ) : (
    templateDetailsComponent
  )
}

export function DeploymentConfigStepDrawer() {
  const formikRef = React.useRef<StepFormikRef | null>(null)
  const { drawerData, setDrawerData, stepsFactory, allowableTypes, isReadOnly } = useDeploymentContext()

  const getStepDataForTemplate = async (): Promise<StepElementConfig> => {
    const stepData = drawerData?.data?.stepConfig?.node as StepOrStepGroupOrTemplateStepData

    await formikRef?.current?.submitForm()

    const errors = formikRef.current?.getErrors()

    if (isEmpty(errors)) {
      return getStepDataFromValues(formikRef.current?.getValues() as Values, stepData)
    } else {
      throw errors
    }
  }

  const drawerTitle = React.useMemo(() => {
    if (drawerData.type === DrawerTypes.StepConfig) {
      return (
        <DeploymentConfigStepDrawerTitle
          discardChanges={() => {
            setDrawerData({
              type: DrawerTypes.AddStep
            })
          }}
          getStepDataForTemplate={getStepDataForTemplate}
        />
      )
    }
  }, [drawerData])

  const onSelection = React.useCallback(
    async (data: StepData) => {
      const processNode: StepElementConfig = {
        name: '',
        identifier: generateRandomString(''),
        type: data.type as string
      }
      setDrawerData({
        type: DrawerTypes.StepConfig,
        data: {
          stepConfig: {
            node: processNode
          },
          isDrawerOpen: true
        }
      })
    },
    [setDrawerData]
  )

  const handleStepDataUpdate = React.useCallback(
    async (stepFormData: Partial<Values>) => {
      const stepConfigNode = defaultTo(drawerData?.data?.stepConfig?.node, {})
      const updatedStepConfigNode = merge({}, stepConfigNode, stepFormData) as StepElementConfig

      setDrawerData({
        type: DrawerTypes.StepConfig,
        data: {
          stepConfig: {
            node: updatedStepConfigNode
          },
          isDrawerOpen: true
        }
      })
    },
    [setDrawerData, drawerData?.data?.stepConfig?.node]
  )

  const closeDrawer = React.useCallback(
    (e?: SyntheticEvent<HTMLElement, Event> | undefined): void => {
      e?.persist()
      setDrawerData({ type: DrawerTypes.AddStep, data: { isDrawerOpen: false } })
    },
    [setDrawerData]
  )

  const onCloseDrawer = React.useCallback((): void => {
    closeDrawer()
  }, [closeDrawer])

  return (
    <Container>
      <Drawer
        onClose={closeDrawer}
        usePortal={true}
        autoFocus={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        enforceFocus={false}
        hasBackdrop={true}
        size={DrawerSizes[drawerData.type]}
        isOpen={drawerData?.data?.isDrawerOpen}
        position={Position.RIGHT}
        data-type={drawerData.type}
        className={css.stepDrawer}
        title={drawerTitle}
        isCloseButtonShown={false}
        portalClassName={'pipeline-studio-right-drawer'}
      >
        <Button minimal className={css.closeButton} icon="cross" withoutBoxShadow onClick={onCloseDrawer} />
        {drawerData.type === DrawerTypes.StepConfig && (
          <StepCommands
            step={drawerData?.data?.stepConfig?.node as StepOrStepGroupOrTemplateStepData}
            ref={formikRef}
            stepsFactory={stepsFactory}
            onUpdate={handleStepDataUpdate}
            viewType={StepCommandsViews.Pipeline}
            isStepGroup={false}
            isReadonly={isReadOnly}
            allowableTypes={allowableTypes}
            isSaveAsTemplateEnabled={false}
          />
        )}
        {drawerData.type === DrawerTypes.AddStep && (
          <StepPalette
            stepsFactory={stepsFactory}
            stepPaletteModuleInfos={DEFAULT_STEP_PALETTE_MODULE_INFO}
            stageType={StageType.DEPLOY}
            onSelect={onSelection}
          />
        )}
        {drawerData.type === DrawerTypes.ViewTemplateDetails && <TemplateDetailsWrapper />}
      </Drawer>
    </Container>
  )
}
