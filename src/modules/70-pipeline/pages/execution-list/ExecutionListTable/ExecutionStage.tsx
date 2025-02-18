/* eslint-disable react/function-component-definition */
/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color, FontVariation } from '@harness/design-system'
import { Icon, IconName, Layout, Popover, Text } from '@harness/uicore'
import React, { FC } from 'react'
import type { CellProps } from 'react-table'
import cx from 'classnames'
import { Classes, Divider, PopoverInteractionKind } from '@blueprintjs/core'
import { defaultTo, isEmpty } from 'lodash-es'
import { Duration } from '@common/components'
import { ExecutionStatusIcon } from '@pipeline/components/ExecutionStatusIcon/ExecutionStatusIcon'
import type { PipelineGraphState } from '@pipeline/components/PipelineDiagram/types'
import { StageType } from '@pipeline/utils/stageHelpers'
import type { ExecutionStatus } from '@pipeline/utils/statusHelpers'
import { useStrings } from 'framework/strings'
import type { PipelineExecutionSummary } from 'services/pipeline-ng'
import type { GitOpsExecutionSummary } from 'services/cd-ng'
import { LabeValue } from '@pipeline/pages/pipeline-list/PipelineListTable/PipelineListCells'
import executionFactory from '@pipeline/factories/ExecutionFactory'
import type { ExecutionCardInfoProps } from '@pipeline/factories/ExecutionFactory/types'
import { CardVariant } from '@pipeline/utils/constants'
import GitOpsExecutionSummaryInfo from './GitOpsExecutionSummary'
import css from './ExecutionListTable.module.scss'

export interface ExecutionStageProps {
  row?: CellProps<PipelineExecutionSummary>['row']
  stage: PipelineGraphState
  isSelectiveStage: boolean
  isMatrixStage?: boolean
}

const stageIconMap: Partial<Record<StageType, { name: IconName; color?: string }>> = {
  [StageType.BUILD]: { name: 'ci-solid' },
  [StageType.DEPLOY]: { name: 'cd-solid' },
  [StageType.SECURITY]: { name: 'sto-color-filled' },
  [StageType.FEATURE]: { name: 'ff-solid' },
  [StageType.APPROVAL]: { name: 'approval-stage-icon' },
  [StageType.CUSTOM]: { name: 'pipeline-custom' },
  [StageType.MATRIX]: { name: 'looping', color: Color.GREY_900 }
}

export const ExecutionStage: FC<ExecutionStageProps> = ({ stage, isSelectiveStage, isMatrixStage, row }) => {
  const pipelineExecution = row?.original
  const { getString } = useStrings()
  const stageIconProps = stageIconMap[stage.type as StageType]
  const data: PipelineExecutionSummary = stage.data || {}
  const stageFailureMessage = data?.failureInfo?.message
  // TODO: others stages UX not available yet
  const cdStageInfo = (stage.data as PipelineExecutionSummary)?.moduleInfo?.cd || {}
  const stoStageInfo = (stage.data as PipelineExecutionSummary)?.moduleInfo?.sto || {}
  const stoInfo = executionFactory.getCardInfo(StageType.SECURITY)
  return (
    <div className={cx(css.stage, isMatrixStage && css.matrixStage)}>
      <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
        {stageIconProps && <Icon size={16} {...stageIconProps} />}
        <Text font={{ size: 'small' }} color={Color.GREY_900} lineClamp={1}>
          {stage.name}
        </Text>
      </Layout.Horizontal>

      <ExecutionStatusIcon status={data?.status as ExecutionStatus} />

      <div className={css.stageInfo}>
        <CDExecutionStageSummary stageInfo={cdStageInfo} />
        <GitOpsExecutionSummaryInfo stageInfo={cdStageInfo} limit={1} />

        {stage.type === StageType.SECURITY &&
          !isEmpty(stoStageInfo) &&
          stoInfo &&
          React.createElement<ExecutionCardInfoProps<PipelineExecutionSummary>>(stoInfo.component, {
            data: defaultTo(pipelineExecution, {}),
            nodeMap: defaultTo(pipelineExecution?.layoutNodeMap, {}),
            startingNodeId: defaultTo(pipelineExecution?.startingNodeId, ''),
            variant: CardVariant.Default
          })}

        {isSelectiveStage && (
          <div className={css.selectiveStageExecution}>
            <Icon name="info" size={10} color={Color.GREY_600} />
            <Text margin={{ left: 'xsmall' }} font={{ variation: FontVariation.TINY_SEMI }} color={Color.GREY_600}>
              {getString('pipeline.selectiveStageExecution')}
            </Text>
          </div>
        )}

        {stageFailureMessage && (
          <Text font={{ size: 'small' }} color={Color.RED_800} lineClamp={1}>
            {stageFailureMessage}
          </Text>
        )}
      </div>

      <Duration
        startTime={data?.startTs}
        endTime={data?.endTs}
        font={{ variation: FontVariation.TINY }}
        color={Color.GREY_600}
        durationText=""
      />
    </div>
  )
}

export const CDExecutionStageSummary: FC<{ stageInfo: Record<string, any> }> = ({ stageInfo }) => {
  const { getString } = useStrings()
  const serviceDisplayName = stageInfo.serviceInfo?.displayName

  // This will removed with the multi service env list view effort
  const gitOpsEnvironments = Array.isArray(stageInfo.gitopsExecutionSummary?.environments)
    ? (stageInfo.gitopsExecutionSummary as Required<GitOpsExecutionSummary>).environments.map(envForGitOps =>
        defaultTo(envForGitOps.name, '')
      )
    : []

  const environment = gitOpsEnvironments.length
    ? gitOpsEnvironments.join(', ')
    : stageInfo.infraExecutionSummary?.name || stageInfo.infraExecutionSummary?.identifier
  const { imagePath, tag, version, jobName, build } = stageInfo.serviceInfo?.artifacts?.primary || {}

  return serviceDisplayName && environment ? (
    <Layout.Horizontal>
      <Popover
        interactionKind={PopoverInteractionKind.HOVER}
        className={Classes.DARK}
        content={
          <Layout.Vertical spacing="small" padding="medium" style={{ maxWidth: 500 }}>
            <div>
              <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.WHITE}>
                {serviceDisplayName}
              </Text>
              <Divider className={css.divider} />
            </div>
            {imagePath && <LabeValue label={getString('image')} value={imagePath} />}
            {version && <LabeValue label={getString('version')} value={version} />}
            {jobName && <LabeValue label={getString('connectors.jenkins.jobNameLabel')} value={jobName} />}
            {build && <LabeValue label={getString('buildText')} value={build} />}
            {tag && <LabeValue label={getString('common.artifactTag')} value={tag} />}
          </Layout.Vertical>
        }
      >
        <Layout.Horizontal spacing="xsmall" className={css.service} style={{ alignItems: 'center' }}>
          <Icon name="services" size={14} />
          <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_600}>
            {getString('service')}:
          </Text>
          <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_800}>
            {serviceDisplayName}
          </Text>
        </Layout.Horizontal>
      </Popover>

      <Layout.Horizontal spacing="xsmall" style={{ alignItems: 'center' }}>
        <Icon name="environments" size={12} />
        <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_600}>
          {getString('environment')}:
        </Text>
        <Text
          font={{ variation: FontVariation.SMALL_SEMI }}
          color={Color.GREY_800}
          lineClamp={1}
          style={{ maxWidth: '200px' }}
        >
          {environment}
        </Text>
      </Layout.Horizontal>
    </Layout.Horizontal>
  ) : null
}
