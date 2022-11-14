/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'

import { Container, PageSpinner, Text } from '@harness/uicore'

import { Color } from '@harness/design-system'

import { matchPath, useLocation, useParams } from 'react-router-dom'
import { Page } from '@common/exports'
import { useMutateAsGet, useQueryParams, useUpdateQueryParams } from '@common/hooks'
import { useModuleInfo } from '@common/hooks/useModuleInfo'
import type { PipelineType, PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import { useGetCommunity } from '@common/utils/utils'
import PipelineBuildExecutionsChart from '@pipeline/components/Dashboards/BuildExecutionsChart/PipelineBuildExecutionsChart'
import PipelineSummaryCards from '@pipeline/components/Dashboards/PipelineSummaryCards/PipelineSummaryCards'
import { ExecutionCompareProvider } from '@pipeline/components/ExecutionCompareYaml/ExecutionCompareContext'
import { ExecutionCompiledYaml } from '@pipeline/components/ExecutionCompiledYaml/ExecutionCompiledYaml'
import { usePolling } from '@common/hooks/usePolling'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { PipelineExecutionSummary, useGetListOfExecutions } from 'services/pipeline-ng'
import routes from '@common/RouteDefinitions'
import { DEFAULT_PAGE_INDEX } from '@pipeline/utils/constants'
import { queryParamDecodeAll } from '@common/hooks/useQueryParams'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { GlobalFreezeBanner } from '@common/components/GlobalFreezeBanner/GlobalFreezeBanner'
import { useStrings } from 'framework/strings'
import { useGlobalFreezeBanner } from '@common/components/GlobalFreezeBanner/useGlobalFreezeBanner'
import { ExecutionListEmpty } from './ExecutionListEmpty/ExecutionListEmpty'
import {
  ExecutionListFilterContextProvider,
  useExecutionListFilterContext
} from './ExecutionListFilterContext/ExecutionListFilterContext'
import { ExecutionListSubHeader } from './ExecutionListSubHeader/ExecutionListSubHeader'
import { MemoisedExecutionListTable } from './ExecutionListTable/ExecutionListTable'
import { ExecutionListCards } from './ExecutionListCards/ExecutionListCards'
import css from './ExecutionList.module.scss'
export interface ExecutionListProps {
  onRunPipeline(): void
  repoName?: string
  showHealthAndExecution?: boolean
  isPipelineInvalid?: boolean
  showBranchFilter?: boolean
}

function ExecutionListInternal(props: ExecutionListProps): React.ReactElement {
  const params = useParams<PipelinePathProps>()
  const { showHealthAndExecution, ...rest } = props
  const { getString } = useStrings()
  const defaultBranchSelect: string = getString('common.gitSync.selectBranch')
  const { repoName } = useQueryParams<{ repoName?: string }>()
  const { updateQueryParams } = useUpdateQueryParams<{ repoName?: string }>()

  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(defaultBranchSelect)
  const { orgIdentifier, projectIdentifier, pipelineIdentifier, accountId } =
    useParams<PipelineType<PipelinePathProps>>()
  const { isSavedFilterApplied, queryParams, isAnyFilterApplied } = useExecutionListFilterContext()

  const {
    page,
    size,
    sort,
    filterIdentifier,
    myDeployments,
    status,
    repoIdentifier,
    branch,
    searchTerm,
    pipelineIdentifier: pipelineIdentifierFromQueryParam
  } = queryParams

  const NEW_EXECUTION_LIST_VIEW = useFeatureFlag(FeatureFlag.NEW_EXECUTION_LIST_VIEW)

  const { module } = useModuleInfo()
  const [viewCompiledYaml, setViewCompiledYaml] = React.useState<PipelineExecutionSummary | undefined>(undefined)
  const location = useLocation()
  // TODO: Temporary, remove once released
  const { listview } = useQueryParams<{ listview?: boolean }>({ decoder: queryParamDecodeAll() })
  const Executions = listview === true || NEW_EXECUTION_LIST_VIEW ? MemoisedExecutionListTable : ExecutionListCards

  const isExecutionHistoryView = !!matchPath(location.pathname, {
    path: routes.toPipelineDeploymentList({
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier,
      accountId,
      module,
      repoIdentifier,
      branch
    })
  })

  const isDeploymentsPage = !!matchPath(location.pathname, {
    path: routes.toDeployments({ ...params, module })
  })
  const {
    data,
    loading,
    initLoading,
    refetch: fetchExecutions,
    error
  } = useMutateAsGet(useGetListOfExecutions, {
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      pipelineIdentifier: pipelineIdentifier || pipelineIdentifierFromQueryParam,
      filterIdentifier: isSavedFilterApplied ? filterIdentifier : undefined,
      page,
      size,
      sort: sort.join(','), // TODO: this is temporary until BE supports common format for all. Currently BE supports status in  arrayFormat: 'repeat' and sort in  arrayFormat: 'comma'
      myDeployments,
      status,
      repoName,
      ...(selectedBranch !== defaultBranchSelect ? { branch: selectedBranch } : {}),
      repoIdentifier,
      searchTerm,
      ...(!isExecutionHistoryView && module ? { module } : {})
    },
    queryParamStringifyOptions: {
      arrayFormat: 'repeat'
    },
    body: isSavedFilterApplied
      ? null
      : {
          ...queryParams.filters,
          filterType: 'PipelineExecution'
        }
  })

  // Only do polling on first page and not initial default loading
  const isPolling = usePolling(fetchExecutions, {
    startPolling: page === DEFAULT_PAGE_INDEX && !loading,
    pollingInterval: 20_000
  })

  const isCommunity = useGetCommunity()
  const isCommunityAndCDModule = module === 'cd' && isCommunity
  const executionList = data?.data
  const hasExecutions = executionList?.totalElements && executionList?.totalElements > 0
  const showSubHeader = hasExecutions || isAnyFilterApplied || selectedBranch !== defaultBranchSelect

  const showSpinner = initLoading || (loading && !isPolling)

  const onChangeRepo = (_repoName: string): void => {
    updateQueryParams({ repoName: (_repoName || []) as string })
  }
  useEffect(() => {
    if (!repoName) setSelectedBranch(undefined)
  }, [repoName])

  const { globalFreezes } = useGlobalFreezeBanner()
  return (
    <>
      <Page.Body error={(error?.data as Error)?.message || error?.message} retryOnError={fetchExecutions}>
        {showHealthAndExecution && !isCommunityAndCDModule && (
          <Container className={css.healthAndExecutions} data-testid="health-and-executions">
            <PipelineSummaryCards />
            <PipelineBuildExecutionsChart />
          </Container>
        )}

        {showSubHeader && (
          <ExecutionListSubHeader
            onBranchChange={(value: string) => {
              setSelectedBranch(value)
            }}
            selectedBranch={selectedBranch}
            showRepoBranchFilter={isDeploymentsPage}
            onChangeRepo={onChangeRepo}
            repoName={repoName}
            borderless
            {...rest}
          />
        )}
        <GlobalFreezeBanner globalFreezes={globalFreezes} />

        <ExecutionCompiledYaml onClose={() => setViewCompiledYaml(undefined)} executionSummary={viewCompiledYaml} />
        {showSpinner ? (
          <PageSpinner />
        ) : executionList && hasExecutions ? (
          <>
            <div className={css.tableTitle}>
              <Text color={Color.GREY_800} font={{ weight: 'bold' }}>
                {`${getString('total')}: ${data?.data?.totalElements}`}
              </Text>
            </div>
            <Executions executionList={executionList} onViewCompiledYaml={setViewCompiledYaml} {...rest} />
          </>
        ) : (
          <ExecutionListEmpty {...rest} />
        )}
      </Page.Body>
    </>
  )
}

export function ExecutionList(props: ExecutionListProps): React.ReactElement {
  return (
    <GitSyncStoreProvider>
      <ExecutionListFilterContextProvider>
        <ExecutionCompareProvider>
          <ExecutionListInternal {...props} />
        </ExecutionCompareProvider>
      </ExecutionListFilterContextProvider>
    </GitSyncStoreProvider>
  )
}
