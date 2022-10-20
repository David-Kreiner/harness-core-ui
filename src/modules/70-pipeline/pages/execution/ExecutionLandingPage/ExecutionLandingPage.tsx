/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Dispatch, SetStateAction, useEffect } from 'react'
import { Intent } from '@blueprintjs/core'
import type { GetDataError } from 'restful-react'
import { useParams, useLocation, useHistory } from 'react-router-dom'
import { get, isEmpty, pickBy } from 'lodash-es'
import { Text, Icon, PageError, PageSpinner, Layout } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { DeprecatedImageInfo, useGetExecutionConfig } from 'services/ci'
import {
  Failure,
  GovernanceMetadata,
  ResponsePipelineExecutionDetail,
  useGetExecutionDetailV2
} from 'services/pipeline-ng'
import type { ExecutionNode } from 'services/pipeline-ng'
import { ExecutionStatus, isExecutionComplete } from '@pipeline/utils/statusHelpers'
import {
  getPipelineStagesMap,
  getActiveStageForPipeline,
  getActiveStep,
  isNodeTypeMatrixOrFor,
  processForCIData
} from '@pipeline/utils/executionUtils'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useQueryParams, useDeepCompareEffect } from '@common/hooks'
import { joinAsASentence } from '@common/utils/StringUtils'
import { String, useStrings } from 'framework/strings'
import type { ExecutionPageQueryParams } from '@pipeline/utils/types'
import type { ExecutionPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { PipelineExecutionWarning } from '@pipeline/components/PipelineExecutionWarning/PipelineExecutionWarning'
import { logsCache } from '@pipeline/components/LogsContent/LogsState/utils'
import { EvaluationModal } from '@governance/EvaluationModal'
import ExecutionContext, { GraphCanvasState } from '@pipeline/context/ExecutionContext'
import { ModuleName } from 'framework/types/ModuleName'
import { PreferenceScope, usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'
import { usePolling } from '@common/hooks/usePolling'
import { useReportSummary, useGetToken } from 'services/ti-service'
import { hasCIStage, hasOverviewDetail, hasServiceDetail } from '@pipeline/utils/stageHelpers'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import routes from '@common/RouteDefinitions'
import { ExecutionPipelineVariables } from './ExecutionPipelineVariables'
import ExecutionTabs from './ExecutionTabs/ExecutionTabs'
import ExecutionMetadata from './ExecutionMetadata/ExecutionMetadata'
import { ExecutionHeader } from './ExecutionHeader/ExecutionHeader'

import css from './ExecutionLandingPage.module.scss'

export const POLL_INTERVAL = 2 /* sec */ * 1000 /* ms */
const PageTabs = { PIPELINE: 'pipeline' }

const setStageIds = ({
  queryParams,
  setAutoSelectedStageId,
  setAutoSelectedStepId,
  setAutoStageNodeExecutionId,
  setSelectedStepId,
  setSelectedStageId,
  setSelectedStageExecutionId,
  data,
  error
}: {
  queryParams: ExecutionPageQueryParams
  setAutoSelectedStageId: Dispatch<SetStateAction<string>>
  setAutoSelectedStepId: Dispatch<SetStateAction<string>>
  setAutoStageNodeExecutionId: Dispatch<SetStateAction<string>>
  setSelectedStepId: Dispatch<SetStateAction<string>>
  setSelectedStageId: Dispatch<SetStateAction<string>>
  setSelectedStageExecutionId: Dispatch<SetStateAction<string>>
  data?: ResponsePipelineExecutionDetail | null
  error?: GetDataError<Failure | Error> | null
}): void => {
  if (error) {
    return
  }

  // if user has selected a stage/step do not auto-update
  if (queryParams.stage || queryParams.step) {
    setAutoSelectedStageId('')
    setAutoSelectedStepId('')
    return
  }

  // if no data is found, reset the stage and step
  if (!data || !data?.data) {
    setAutoSelectedStageId('')
    setAutoSelectedStepId('')
    return
  }

  const runningStage = getActiveStageForPipeline(
    data.data.pipelineExecutionSummary,
    data.data?.pipelineExecutionSummary?.status as ExecutionStatus
  )

  const runningStep = getActiveStep(data.data.executionGraph, data.data.pipelineExecutionSummary)

  if (runningStage) {
    if (isNodeTypeMatrixOrFor(data.data?.pipelineExecutionSummary?.layoutNodeMap?.[runningStage]?.nodeType)) {
      const nodeExecid = get(
        data,
        ['data', 'pipelineExecutionSummary', 'layoutNodeMap', runningStage, 'edgeLayoutList', 'currentNodeChildren', 0],
        runningStage
      ) as string // UNIQUE ID--> stageNodeExecutionID
      const nodeId = get(
        data,
        ['data', 'pipelineExecutionSummary', 'layoutNodeMap', nodeExecid, 'nodeUuid'],
        ''
      ) as string // COMMMON--> stageNodeID
      setAutoSelectedStageId(nodeId)
      setSelectedStageId(nodeId)
      setAutoStageNodeExecutionId(nodeExecid)
      setSelectedStageExecutionId(nodeExecid)
    } else {
      setAutoSelectedStageId(runningStage)
      setSelectedStageId(runningStage)
      setAutoStageNodeExecutionId('')
      setSelectedStageExecutionId('')
    }
  }

  if (runningStep) {
    setAutoSelectedStepId(runningStep.node)
    setSelectedStepId(runningStep.node)
  }
}

export default function ExecutionLandingPage(props: React.PropsWithChildren<unknown>): React.ReactElement {
  const { getString } = useStrings()
  const { orgIdentifier, projectIdentifier, executionIdentifier, accountId, module, pipelineIdentifier } =
    useParams<PipelineType<ExecutionPathProps>>()
  const [allNodeMap, setAllNodeMap] = React.useState<Record<string, ExecutionNode>>({})

  /* cache token required for retrieving logs */
  const [logsToken, setLogsToken] = React.useState('')
  const { getRBACErrorMessage } = useRBACError()

  /* These are used when auto updating selected stage/step when a pipeline is running */
  const [autoSelectedStageId, setAutoSelectedStageId] = React.useState<string>('')
  const [autoSelectedStepId, setAutoSelectedStepId] = React.useState<string>('')
  const [autoStageNodeExecutionId, setAutoStageNodeExecutionId] = React.useState<string>('')
  const [isPipelineInvalid, setIsPipelineInvalid] = React.useState(false)

  /* These are updated only when new data is fetched successfully */
  const [selectedStageId, setSelectedStageId] = React.useState<string>('')
  const [selectedStageExecutionId, setSelectedStageExecutionId] = React.useState<string>('')
  const [selectedStepId, setSelectedStepId] = React.useState<string>('')
  const { preference: savedExecutionView, setPreference: setSavedExecutionView } = usePreferenceStore<
    string | undefined
  >(PreferenceScope.USER, 'executionViewType')
  const queryParams = useQueryParams<ExecutionPageQueryParams>()
  const initialSelectedView = savedExecutionView || 'graph'
  const { view } = queryParams
  const isLogView = view === 'log' || (!view && initialSelectedView === 'log')
  const location = useLocation<{ shouldShowGovernanceEvaluations: boolean; governanceMetadata: GovernanceMetadata }>()
  const locationPathNameArr = location?.pathname?.split('/') || []
  const selectedPageTab = locationPathNameArr[locationPathNameArr.length - 1]
  const [stepsGraphCanvasState, setStepsGraphCanvasState] = React.useState<GraphCanvasState>({
    offsetX: 5,
    offsetY: 0,
    zoom: 100
  })

  const { data, refetch, loading, error } = useGetExecutionDetailV2({
    planExecutionId: executionIdentifier,
    queryParams: {
      orgIdentifier,
      projectIdentifier,
      accountIdentifier: accountId,
      stageNodeId: isEmpty(queryParams.stage || autoSelectedStageId)
        ? undefined
        : queryParams.stage || autoSelectedStageId,
      ...(selectedStageId !== selectedStageExecutionId &&
        !isEmpty(selectedStageExecutionId) && {
          stageNodeExecutionId: selectedStageExecutionId
        })
    },
    debounce: 500
  })

  const {
    data: executionConfig,
    refetch: fetchExecutionConfig,
    loading: isFetchingExecutionConfig,
    error: errorWhileFetchingExecutionConfig
  } = useGetExecutionConfig({
    queryParams: {
      accountIdentifier: accountId
    },
    lazy: true
  })

  const HAS_CI = hasCIStage(data?.data?.pipelineExecutionSummary)
  const IS_SERVICEDETAIL = hasServiceDetail(data?.data?.pipelineExecutionSummary)
  const IS_OVERVIEWPAGE = hasOverviewDetail(data?.data?.pipelineExecutionSummary)
  const history = useHistory()
  const CI_TESTTAB_NAVIGATION = useFeatureFlag(FeatureFlag.CI_TESTTAB_NAVIGATION)
  const source: ExecutionPathProps['source'] = pipelineIdentifier ? 'executions' : 'deployments'
  const { data: serviceToken } = useGetToken({
    queryParams: { accountId }
  })

  const { data: reportSummary, loading: reportSummaryLoading } = useReportSummary({
    queryParams: {
      accountId,
      orgId: orgIdentifier,
      projectId: projectIdentifier,
      pipelineId: pipelineIdentifier,
      buildId: data?.data?.pipelineExecutionSummary?.runSequence?.toString() || '',
      stageId: '',
      report: 'junit' as const
    },
    lazy: !HAS_CI,
    requestOptions: {
      headers: {
        'X-Harness-Token': serviceToken || ''
      }
    }
  })

  useEffect(() => {
    if (data?.data?.pipelineExecutionSummary?.modules?.includes(ModuleName.CI.toLowerCase())) {
      fetchExecutionConfig()
    }
  }, [data?.data?.pipelineExecutionSummary?.modules?.length])

  const deprecatedImages = React.useMemo(() => {
    if (!isFetchingExecutionConfig && !errorWhileFetchingExecutionConfig) {
      return executionConfig?.data as DeprecatedImageInfo[]
    }
  }, [executionConfig?.data])

  const getDeprecatedImageSummary = (images: DeprecatedImageInfo[]): string => {
    const tagWithVersions = images
      .filter((image: DeprecatedImageInfo) => !!image.tag && !!image.version)
      .map((image: DeprecatedImageInfo) => `${image.tag}(${image.version})`)
    return joinAsASentence(tagWithVersions)
  }

  const graphNodeMap = data?.data?.executionGraph?.nodeMap || {}
  const isDataLoadedForSelectedStage = Object.keys(graphNodeMap).some(
    key => graphNodeMap?.[key]?.setupId === selectedStageId
  )

  const pipelineStagesMap = React.useMemo(() => {
    return getPipelineStagesMap(
      data?.data?.pipelineExecutionSummary?.layoutNodeMap,
      data?.data?.pipelineExecutionSummary?.startingNodeId
    )
  }, [data?.data?.pipelineExecutionSummary?.layoutNodeMap, data?.data?.pipelineExecutionSummary?.startingNodeId])

  // combine steps and dependencies(ci stage)
  useDeepCompareEffect(() => {
    let nodeMap = { ...data?.data?.executionGraph?.nodeMap }

    nodeMap = processForCIData({ nodeMap, data })

    setAllNodeMap(oldNodeMap => {
      const interruptHistories = pickBy(oldNodeMap, val => get(val, '__isInterruptNode'))

      return { ...interruptHistories, ...nodeMap }
    })
  }, [data?.data?.executionGraph?.nodeMap, data?.data?.executionGraph?.nodeAdjacencyListMap])

  // Do polling after initial default loading and has some data, stop if execution is in complete status
  usePolling(refetch, {
    pollingInterval: POLL_INTERVAL,
    startPolling: !loading && !!data && !isExecutionComplete(data.data?.pipelineExecutionSummary?.status),
    pollOnInactiveTab: !isExecutionComplete(data?.data?.pipelineExecutionSummary?.status)
  })

  // show the current running stage and steps automatically
  React.useEffect(() => {
    setStageIds({
      queryParams,
      setAutoSelectedStageId,
      setAutoSelectedStepId,
      setAutoStageNodeExecutionId,
      setSelectedStepId,
      setSelectedStageId,
      setSelectedStageExecutionId,
      data,
      error
    })
  }, [queryParams, data, error])

  React.useEffect(() => {
    return () => {
      logsCache.clear()
    }
  }, [])

  // update stage/step selection
  React.useEffect(() => {
    if (loading) {
      setSelectedStageId((queryParams.stage as string) || autoSelectedStageId)
    }
    setSelectedStageExecutionId((queryParams?.stageExecId as string) || autoStageNodeExecutionId)
    setSelectedStepId((queryParams.step as string) || autoSelectedStepId)
    queryParams?.stage && !queryParams?.stageExecId && setAutoStageNodeExecutionId(queryParams?.stageExecId || '')
  }, [loading, queryParams, autoSelectedStageId, autoSelectedStepId, autoStageNodeExecutionId])

  useEffect(() => {
    if (HAS_CI && CI_TESTTAB_NAVIGATION && reportSummary?.failed_tests) {
      const route = routes.toExecutionTestsView({
        orgIdentifier,
        pipelineIdentifier: pipelineIdentifier,
        executionIdentifier: executionIdentifier,
        projectIdentifier,
        accountId,
        module,
        source
      })
      //opening in new tab is required for cards present in dashboards
      if (IS_SERVICEDETAIL || IS_OVERVIEWPAGE) {
        window.open(`#${route}`)
      } else {
        history.push(route)
      }
    }
  }, [reportSummary])

  return (
    <ExecutionContext.Provider
      value={{
        pipelineExecutionDetail: data?.data || null,
        allNodeMap,
        pipelineStagesMap,
        isPipelineInvalid,
        selectedStageId,
        selectedStepId,
        selectedStageExecutionId,
        loading,
        isDataLoadedForSelectedStage,
        queryParams,
        logsToken,
        setLogsToken,
        refetch,
        stepsGraphCanvasState,
        setStepsGraphCanvasState,
        setSelectedStageId,
        setSelectedStepId,
        setIsPipelineInvalid,
        setSelectedStageExecutionId,
        addNewNodeToMap(id, node) {
          setAllNodeMap(nodeMap => ({ ...nodeMap, [id]: node }))
        }
      }}
    >
      <ExecutionPipelineVariables
        shouldFetch={data?.data?.pipelineExecutionSummary?.executionInputConfigured}
        accountIdentifier={accountId}
        orgIdentifier={orgIdentifier}
        projectIdentifier={projectIdentifier}
        planExecutionId={executionIdentifier}
      >
        {(!data && loading) || reportSummaryLoading ? <PageSpinner /> : null}
        {error ? (
          <PageError message={getRBACErrorMessage(error) as string} />
        ) : (
          <main className={css.main}>
            <div className={css.lhs}>
              <header className={css.header}>
                <ExecutionHeader />
                <ExecutionMetadata />
              </header>
              <ExecutionTabs savedExecutionView={savedExecutionView} setSavedExecutionView={setSavedExecutionView} />
              {module === 'ci' && (
                <>
                  {deprecatedImages?.length ? (
                    <PipelineExecutionWarning
                      warning={
                        <>
                          <Layout.Horizontal spacing="small" flex={{ alignItems: 'center' }}>
                            <Icon name="warning-sign" intent={Intent.DANGER} />
                            <Text color={Color.ORANGE_900} font={{ variation: FontVariation.SMALL_BOLD }}>
                              {getString('pipeline.imageVersionDeprecated')}
                            </Text>
                          </Layout.Horizontal>
                          <Text font={{ weight: 'semi-bold', size: 'small' }} color={Color.PRIMARY_10} lineClamp={2}>
                            <String
                              stringID="pipeline.unsupportedImagesWarning"
                              vars={{
                                summary: `${getDeprecatedImageSummary(deprecatedImages)}.`
                              }}
                              useRichText
                            />
                          </Text>
                          {/* <Link to={'/'}>{getString('learnMore')}</Link> */}
                        </>
                      }
                    />
                  ) : null}
                </>
              )}
              <div
                className={css.childContainer}
                data-view={selectedPageTab === PageTabs.PIPELINE && isLogView ? 'log' : 'graph'}
                id="pipeline-execution-container"
              >
                {props.children}
              </div>
              {!!location?.state?.shouldShowGovernanceEvaluations && (
                <EvaluationModal accountId={accountId} metadata={location?.state?.governanceMetadata} />
              )}
            </div>
          </main>
        )}
      </ExecutionPipelineVariables>
    </ExecutionContext.Provider>
  )
}
