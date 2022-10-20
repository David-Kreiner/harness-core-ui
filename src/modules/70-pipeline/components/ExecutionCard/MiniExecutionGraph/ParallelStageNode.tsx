/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { sortBy } from 'lodash-es'
import { Popover } from '@blueprintjs/core'

import type { ExecutionPathProps, ModulePathParams, PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import type { GraphLayoutNode } from 'services/pipeline-ng'
import type { ExecutionStatus } from '@pipeline/utils/statusHelpers'

import { StageNode } from './StageNode'
import css from './MiniExecutionGraph.module.scss'

// Higher the number, Higher the Priority, Max 100.
const StagePriority: Record<ExecutionStatus, number> = {
  Success: 1,
  Running: 2,
  AsyncWaiting: 2,
  TaskWaiting: 2,
  TimedWaiting: 2,
  Failed: 20,
  Errored: 20,
  IgnoreFailed: 20,
  Expired: 18,
  Aborted: 19,
  Discontinuing: 19,
  Suspended: 17,
  Queued: 0,
  NotStarted: 0,
  Paused: 24,
  ResourceWaiting: 25,
  Skipped: 15,
  ApprovalRejected: 22,
  ApprovalWaiting: 26,
  InterventionWaiting: 27,
  Pausing: 23,
  InputWaiting: 0,
  WaitStepRunning: 2
}
const STEP_DETAILS_LIMIT = 4

export interface ParallelNodeProps extends PipelinePathProps, Partial<ModulePathParams> {
  stages: GraphLayoutNode[]
  planExecutionId: string
  source: ExecutionPathProps['source']
}

export function ParallelStageNode(props: ParallelNodeProps): React.ReactElement {
  const { stages, accountId, orgIdentifier, projectIdentifier, pipelineIdentifier, planExecutionId, module, source } =
    props
  const sortedStages = sortBy(stages, stage => 100 - StagePriority[stage.status as ExecutionStatus])

  return (
    <Popover
      interactionKind="hover"
      minimal
      position="bottom"
      lazy
      autoFocus={false}
      enforceFocus={false}
      className={css.parallelNodes}
      wrapperTagName="div"
      targetTagName="div"
      targetClassName={css.ghostNodes}
      popoverClassName={css.moreStages}
      targetProps={{ 'data-stages': sortedStages.length } as any}
      modifiers={{ offset: { offset: '0,8px' } }}
    >
      <StageNode
        stage={sortedStages[0]}
        source={source}
        {...{ accountId, orgIdentifier, projectIdentifier, module, pipelineIdentifier, planExecutionId }}
      />
      <React.Fragment>
        {sortedStages.slice(1, STEP_DETAILS_LIMIT).map((stage: GraphLayoutNode, i) => (
          <StageNode
            key={i}
            stage={stage}
            source={source}
            {...{ accountId, orgIdentifier, projectIdentifier, module, pipelineIdentifier, planExecutionId }}
          />
        ))}
        {sortedStages.length > STEP_DETAILS_LIMIT ? (
          <div className={css.extraCount}>+ {stages.length - STEP_DETAILS_LIMIT}</div>
        ) : null}
      </React.Fragment>
    </Popover>
  )
}
