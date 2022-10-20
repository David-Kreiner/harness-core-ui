/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory } from 'react-router-dom'
import { Popover, IPopoverProps } from '@blueprintjs/core'
import cx from 'classnames'
import { Icon } from '@wings-software/uicore'
import { ExecutionStatusIconMap as IconMap, getStageType } from '@pipeline/utils/executionUtils'
import { ExecutionStatus, isExecutionNotStarted } from '@pipeline/utils/statusHelpers'
import routes from '@common/RouteDefinitions'
import type { ExecutionPathProps, ModulePathParams, PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import type { GraphLayoutNode } from 'services/pipeline-ng'
import CDInfo from '@pipeline/pages/execution/ExecutionPipelineView/ExecutionGraphView/ExecutionGraph/components/CD/CDInfo/CDInfo'
import StageHeader from '@pipeline/pages/execution/ExecutionPipelineView/ExecutionGraphView/ExecutionGraph/components/StageHeader'
import css from './MiniExecutionGraph.module.scss'

export function RunningIcon(): React.ReactElement {
  return (
    <div className={css.runningAnimation}>
      <div />
      <div />
      <div />
    </div>
  )
}

export interface StageNodeProps extends Omit<IPopoverProps, 'content'>, PipelinePathProps, Partial<ModulePathParams> {
  stage: GraphLayoutNode
  planExecutionId: string
  source: ExecutionPathProps['source']
}

export function StageNode(props: StageNodeProps): React.ReactElement {
  const {
    accountId,
    orgIdentifier,
    projectIdentifier,
    pipelineIdentifier,
    module,
    stage,
    planExecutionId,
    source,
    ...rest
  } = props
  const { status } = stage || {}
  const statusLower = status?.toLowerCase() || ''
  const history = useHistory()

  const stageType = getStageType(stage)

  function getOnStageClick(stageId: string) {
    return (e: React.MouseEvent<HTMLDivElement>): void => {
      e.stopPropagation()
      e.preventDefault()
      const path = routes.toExecutionPipelineView({
        accountId,
        module,
        orgIdentifier,
        pipelineIdentifier,
        projectIdentifier,
        executionIdentifier: planExecutionId,
        source
      })

      if (!isExecutionNotStarted(status)) {
        history.push(`${path}?stage=${stageId}`)
      }
    }
  }

  return (
    <Popover
      position="top"
      {...rest}
      className={cx(css.stageWrapper, css[statusLower as keyof typeof css])}
      targetClassName={css.stage}
      targetTagName="div"
      wrapperTagName="div"
      targetProps={{ onClick: getOnStageClick(stage.nodeUuid || '') }}
      interactionKind="hover"
      hoverOpenDelay={1000}
    >
      {stage.status === 'Running' ? (
        <RunningIcon />
      ) : (
        <Icon name={IconMap[stage.status as ExecutionStatus] || IconMap.NotStarted} size={13} className={css.icon} />
      )}
      <div className={css.infoPopover}>
        <StageHeader
          data={{
            name: stage.name,
            status: stage.status,
            data: stage
          }}
        />
        {stageType === 'cd' && <CDInfo data={{ data: stage }} />}
      </div>
    </Popover>
  )
}
