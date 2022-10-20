/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Icon, Button, Text } from '@wings-software/uicore'
import { ResizeSensor } from '@blueprintjs/core'
import cx from 'classnames'
import { throttle } from 'lodash-es'
import type { PipelineExecutionSummary } from 'services/pipeline-ng'
import { isExecutionRunning, isExecutionCompletedWithBadState } from '@pipeline/utils/statusHelpers'
import { processLayoutNodeMap, ExecutionStatusIconMap as IconMap } from '@pipeline/utils/executionUtils'
import type { ProjectPathProps, ModulePathParams, ExecutionPathProps } from '@common/interfaces/RouteInterfaces'
import { StageNode, RunningIcon } from './StageNode'
import { ParallelStageNode } from './ParallelStageNode'
import css from './MiniExecutionGraph.module.scss'

const SCROLL_DELTA = 60
const THROTTLE_TIME = 300

export interface MiniExecutionGraphProps extends ProjectPathProps, Partial<ModulePathParams> {
  pipelineExecution: PipelineExecutionSummary
  source: ExecutionPathProps['source']
}

export default function MiniExecutionGraph(props: MiniExecutionGraphProps): React.ReactElement {
  const { pipelineExecution, accountId, orgIdentifier, projectIdentifier, module, source } = props
  const {
    successfulStagesCount,
    runningStagesCount,
    failedStagesCount = 0,
    status,
    totalStagesCount,
    executionErrorInfo,
    pipelineIdentifier = '',
    planExecutionId = ''
  } = pipelineExecution
  const [showButtons, setShowButtons] = React.useState(false)
  const elements = React.useMemo(() => processLayoutNodeMap(pipelineExecution), [pipelineExecution])
  const graphRef = React.useRef<HTMLDivElement | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)

  React.useLayoutEffect(() => {
    hideShowButtons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hideShowButtons = React.useCallback(
    throttle(() => {
      window.requestAnimationFrame(() => {
        if (graphRef.current && wrapperRef.current) {
          const graph = graphRef.current.getBoundingClientRect()
          const wrapper = wrapperRef.current.getBoundingClientRect()

          if (graph.width > wrapper.width) {
            // show buttons
            setShowButtons(true)
          } else {
            // hide buttons
            setShowButtons(false)
          }
        }
      })
    }, THROTTLE_TIME),
    []
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleRightArrowClick = React.useCallback(
    throttle(
      (e: React.SyntheticEvent<Element>): void => {
        e.preventDefault()
        e.stopPropagation()
        window.requestAnimationFrame(() => {
          if (graphRef.current && wrapperRef.current) {
            const graph = graphRef.current.getBoundingClientRect()
            const wrapper = wrapperRef.current.getBoundingClientRect()

            if (graph.right > wrapper.right) {
              graphRef.current.style.transform = `translateX(${Math.max(
                graph.left - wrapper.left - SCROLL_DELTA,
                wrapper.width - graph.width
              )}px)`
            }
          }
        })
      },
      THROTTLE_TIME,
      { leading: true }
    ),
    []
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleLeftArrowClick = React.useCallback(
    throttle(
      (e: React.SyntheticEvent<Element>): void => {
        e.preventDefault()
        e.stopPropagation()
        window.requestAnimationFrame(() => {
          if (graphRef.current && wrapperRef.current) {
            const graph = graphRef.current.getBoundingClientRect()
            const wrapper = wrapperRef.current.getBoundingClientRect()

            if (graph.left < wrapper.left) {
              graphRef.current.style.transform = `translateX(${Math.min(
                graph.left - wrapper.left + SCROLL_DELTA,
                0
              )}px)`
            }
          }
        })
      },
      THROTTLE_TIME,
      { leading: true }
    ),
    []
  )

  function killEvent(e: React.SyntheticEvent): void {
    e.stopPropagation()
  }

  return (
    <ResizeSensor onResize={hideShowButtons}>
      <div className={css.main}>
        <div className={css.graphAligner} onClick={killEvent}>
          <div ref={wrapperRef} className={cx(css.graphWrapper, { [css.hasButtons]: showButtons })}>
            <div ref={graphRef} className={css.graph}>
              {(elements || []).map(({ stage, parallel }, i) => {
                if (parallel && Array.isArray(parallel)) {
                  return (
                    <ParallelStageNode
                      key={i}
                      stages={parallel}
                      source={source}
                      {...{ accountId, orgIdentifier, projectIdentifier, module, pipelineIdentifier, planExecutionId }}
                    />
                  )
                }

                if (stage) {
                  return (
                    <StageNode
                      key={stage.nodeUuid}
                      stage={stage}
                      source={source}
                      {...{ accountId, orgIdentifier, projectIdentifier, module, pipelineIdentifier, planExecutionId }}
                    />
                  )
                }

                return null
              })}
            </div>
          </div>
          {showButtons ? (
            <React.Fragment>
              <Button
                minimal
                icon="arrow-left"
                className={css.scrollLeft}
                iconProps={{ size: 10 }}
                onClick={handleLeftArrowClick}
              />
              <Button
                minimal
                icon="arrow-right"
                className={css.scrollRight}
                iconProps={{ size: 10 }}
                onClick={handleRightArrowClick}
              />
            </React.Fragment>
          ) : null}
        </div>
        <div className={css.stepCounts}>
          <div className={css.stepCount} data-status="success">
            <Icon name={IconMap.Success} size={14} />
            {successfulStagesCount} / {totalStagesCount}
          </div>
          {isExecutionRunning(status) ? (
            <div className={css.stepCount} data-status="running">
              <RunningIcon />
              {runningStagesCount}
            </div>
          ) : isExecutionCompletedWithBadState(status) && failedStagesCount > 0 ? (
            <div className={css.stepCount} data-status="failed">
              <Icon name={IconMap.Failed} size={14} /> {failedStagesCount}
            </div>
          ) : null}
          {isExecutionCompletedWithBadState(status) && executionErrorInfo?.message ? (
            <Text lineClamp={1} className={cx(css.stepCount, css.errorMsg)}>
              {executionErrorInfo.message}
            </Text>
          ) : null}
        </div>
      </div>
    </ResizeSensor>
  )
}
