/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, ButtonVariation, Container, Layout, Popover } from '@harness/uicore'
import { chunk } from 'lodash-es'
import { useHistory, useParams } from 'react-router-dom'
import cx from 'classnames'
import { useToaster } from '@wings-software/uicore'
import { IconName, Menu, Position } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import {
  useHandleManualInterventionInterrupt,
  ExecutionNode,
  HandleManualInterventionInterruptQueryParams
} from 'services/pipeline-ng'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { Strategy, strategyIconMap, stringsMap } from '@pipeline/utils/FailureStrategyUtils'
import type { ExecutionPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'

import type { StepDetailProps } from '@pipeline/factories/ExecutionFactory/types'
import { StageType } from '@pipeline/utils/stageHelpers'
import { allowedStrategiesAsPerStep } from '@pipeline/components/PipelineSteps/AdvancedSteps/FailureStrategyPanel/StrategySelection/StrategyConfig'
import { StepMode } from '@pipeline/utils/stepUtils'
import { isExecutionWaitingForIntervention } from '@pipeline/utils/statusHelpers'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import routes from '@common/RouteDefinitions'
import type { ChaosStepExecutionProps } from '@chaos/interfaces/Chaos.types'

import css from './ChaosExperimentExecView.module.scss'

// eslint-disable-next-line import/no-unresolved
const ChaosStepExecution = React.lazy(() => import('chaos/ChaosStepExecution'))

export interface ActionButtonProps {
  step: ExecutionNode
  allowedStrategies: Strategy[]
  isManualInterruption: boolean
  expIdentifier: string
  expRunIdentifier: string
}

export function ActionButtons(props: ActionButtonProps): React.ReactElement {
  const { allowedStrategies, step, isManualInterruption } = props
  const { orgIdentifier, projectIdentifier, executionIdentifier, accountId } =
    useParams<PipelineType<ExecutionPathProps>>()
  const {
    mutate: handleInterrupt,
    loading,
    error
  } = useHandleManualInterventionInterrupt({
    planExecutionId: executionIdentifier,
    nodeExecutionId: step.uuid || /* istanbul ignore next */ ''
  })
  const { showError } = useToaster()
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const history = useHistory()

  function handleChange(strategy: Strategy): void {
    const interruptType = strategy as HandleManualInterventionInterruptQueryParams['interruptType']
    handleInterrupt(undefined, {
      queryParams: {
        interruptType,
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      },
      headers: { 'content-type': 'application/json' }
    })
  }

  const STRATEGIES: Strategy[][] = React.useMemo(() => chunk(allowedStrategies, 5), [allowedStrategies])

  React.useEffect(() => {
    if (error) {
      showError(getRBACErrorMessage(error), undefined, 'pipeline.error.intervention')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  return (
    <Layout.Horizontal spacing={'small'} className={cx({ [css.loading]: loading })}>
      {isManualInterruption ? (
        <Popover
          minimal={true}
          position={Position.BOTTOM_RIGHT}
          content={
            <Menu>
              {STRATEGIES.map((layer, i) => {
                return (
                  <div key={i} className={css.listStyle}>
                    {layer.map((strategy, j) => (
                      <Menu.Item
                        key={j}
                        icon={strategyIconMap[strategy] as IconName}
                        text={getString(stringsMap[strategy])}
                        textClassName={css.performActionStyle}
                        onClick={() => handleChange(strategy)}
                        className={css.menuItemStyle}
                      />
                    ))}
                  </div>
                )
              })}
            </Menu>
          }
        >
          <div>
            <Button
              text={getString('common.performAction')}
              variation={ButtonVariation.PRIMARY}
              rightIcon="chevron-down"
            />
          </div>
        </Popover>
      ) : null}

      {props.expRunIdentifier && (
        <Button
          text={getString('chaos.viewDetailedExecution')}
          variation={ButtonVariation.SECONDARY}
          onClick={() =>
            history.push(
              routes.toChaosExperimentRun({
                accountId: accountId,
                orgIdentifier: orgIdentifier,
                projectIdentifier: projectIdentifier,
                expIdentifier: props.expIdentifier,
                expRunIdentifier: props.expRunIdentifier
              })
            )
          }
        />
      )}
    </Layout.Horizontal>
  )
}

export function ChaosExperimentExecView(props: StepDetailProps): React.ReactElement {
  const { step, stageType = StageType.DEPLOY } = props
  const isManualInterruption = isExecutionWaitingForIntervention(step.status)
  const failureStrategies = allowedStrategiesAsPerStep(stageType)[StepMode.STEP].filter(
    st => st !== Strategy.ManualIntervention
  )

  return (
    <div>
      <Container padding="medium">
        {
          <ChildAppMounter<ChaosStepExecutionProps>
            ChildApp={ChaosStepExecution}
            experimentID={(step.stepParameters?.spec.experimentRef as string) ?? ''}
            experimentRunID={step.outcomes?.output?.experimentRunId as unknown as string}
            expectedResilienceScore={step.stepParameters?.spec?.expectedResilienceScore ?? 50}
            actionButtons={
              <ActionButtons
                step={step}
                allowedStrategies={failureStrategies}
                isManualInterruption={isManualInterruption}
                expIdentifier={step.stepParameters?.spec.experimentRef}
                expRunIdentifier={(step.outcomes?.output?.experimentRunId as unknown as string) ?? ''}
              />
            }
            status={step.status as string}
            isManualInterruption={isManualInterruption}
          />
        }
      </Container>
    </div>
  )
}
