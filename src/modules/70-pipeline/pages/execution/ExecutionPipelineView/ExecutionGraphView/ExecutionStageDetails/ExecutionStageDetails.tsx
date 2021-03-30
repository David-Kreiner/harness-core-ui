import React from 'react'
import { isEmpty, debounce } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { ExecutionNode, useGetBarrierInfo } from 'services/pipeline-ng'
import { ExecutionPathParams, getIconFromStageModule, processExecutionData } from '@pipeline/utils/executionUtils'
import { useExecutionContext } from '@pipeline/pages/execution/ExecutionContext/ExecutionContext'
import { useExecutionLayoutContext } from '@pipeline/components/ExecutionLayout/ExecutionLayoutContext'
import ExecutionStageDiagram from '@pipeline/components/ExecutionStageDiagram/ExecutionStageDiagram'
import type { StageOptions, ExecutionPipeline } from '@pipeline/components/ExecutionStageDiagram/ExecutionPipelineModel'
import type { DynamicPopoverHandlerBinding } from '@common/components/DynamicPopover/DynamicPopover'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { isExecutionPaused, isExecutionRunning } from '@pipeline/utils/statusHelpers'
import { DynamicPopover } from '@common/exports'
import BarrierStepTooltip from './components/BarrierStepTooltip'
import css from './ExecutionStageDetails.module.scss'
export interface ExecutionStageDetailsProps {
  onStepSelect(step?: string): void
  onStageSelect(step: string): void
  selectedStep: string
  selectedStage: string
}

export default function ExecutionStageDetails(props: ExecutionStageDetailsProps): React.ReactElement {
  const { pipelineExecutionDetail, pipelineStagesMap, loading } = useExecutionContext()
  const { setStepDetailsVisibility } = useExecutionLayoutContext()
  const [barrierSetupId, setBarrierSetupId] = React.useState<string | null>(null)
  const [dynamicPopoverHandler, setDynamicPopoverHandler] = React.useState<
    DynamicPopoverHandlerBinding<{}> | undefined
  >()

  const stagesOptions: StageOptions[] = [...pipelineStagesMap].map(item => ({
    label: item[1].nodeIdentifier || /* istanbul ignore next */ '',
    value: item[1].nodeUuid || /* istanbul ignore next */ '',
    icon: { name: getIconFromStageModule(item[1].module) },
    disabled: item[1].status === 'NotStarted'
  }))
  const { executionIdentifier } = useParams<ExecutionPathParams>()
  const stage = pipelineStagesMap.get(props.selectedStage)
  const { data: barrierInfo, loading: barrierInfoLoading, refetch } = useGetBarrierInfo({
    queryParams: {
      barrierSetupId: barrierSetupId || '',
      planExecutionId: executionIdentifier
    },
    lazy: true
  })

  const data: ExecutionPipeline<ExecutionNode> = {
    items: processExecutionData(pipelineExecutionDetail?.executionGraph),
    identifier: `${executionIdentifier}-${props.selectedStage}`,
    status: stage?.status as any
  }
  const fetchData = debounce(refetch, 1000)
  // open details view when a step is selected
  React.useEffect(() => {
    if (barrierSetupId) {
      fetchData()
    }
  }, [barrierSetupId])
  // open details view when a step is selected
  React.useEffect(() => {
    setStepDetailsVisibility(!!props.selectedStep)
  }, [props.selectedStep, setStepDetailsVisibility])
  const onMouseEnter = (event: any) => {
    const currentStage = event.stage
    const isFinished = currentStage?.data?.endTs
    const hasStarted = currentStage?.data?.startTs
    if (!isFinished && hasStarted) {
      if (currentStage?.data?.stepType === StepType.Barrier) {
        setBarrierSetupId(currentStage?.data?.setupId)

        dynamicPopoverHandler?.show(
          event.stageTarget,
          {
            event,
            data: currentStage
          },
          { useArrows: true }
        )
      }
    }
  }

  const renderPopover = ({
    data: stageInfo
  }: {
    data: { data: { stepType: string; startTs: number } }
  }): JSX.Element => {
    switch (stageInfo?.data?.stepType) {
      case StepType.Barrier:
        return (
          <BarrierStepTooltip
            loading={barrierInfoLoading}
            data={barrierInfo?.data}
            startTs={stageInfo?.data?.startTs}
          />
        )
      default:
        return <div />
    }
  }

  return (
    <div className={css.main}>
      {!isEmpty(props.selectedStage) && data.items?.length > 0 && (
        <ExecutionStageDiagram
          selectedIdentifier={props.selectedStep}
          itemClickHandler={e => props.onStepSelect(e.stage.identifier)}
          data={data}
          showEndNode={!(isExecutionRunning(stage?.status) || isExecutionPaused(stage?.status))}
          isWhiteBackground
          nodeStyle={{
            width: 64,
            height: 64
          }}
          loading={loading}
          gridStyle={{
            startX: 50,
            startY: 150
          }}
          showStageSelection={true}
          selectedStage={{
            label: stage?.nodeIdentifier || /* istanbul ignore next */ '',
            value: stage?.nodeUuid || /* istanbul ignore next */ '',
            icon: { name: getIconFromStageModule(stage?.module) }
          }}
          itemMouseEnter={onMouseEnter}
          itemMouseLeave={() => {
            dynamicPopoverHandler?.hide()
            setBarrierSetupId(null)
          }}
          stageSelectionOptions={stagesOptions}
          onChangeStageSelection={(item: StageOptions) => {
            props.onStageSelect(item.value as string)
          }}
          canvasBtnsClass={css.canvasBtns}
        />
      )}
      <DynamicPopover darkMode={true} render={renderPopover} bind={setDynamicPopoverHandler as any} />
    </div>
  )
}
