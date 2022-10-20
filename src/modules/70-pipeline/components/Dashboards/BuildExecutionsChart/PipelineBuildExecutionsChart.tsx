/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import type { PipelineType, ExecutionPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { ExecutionsChart } from '@pipeline/components/Dashboards/BuildExecutionsChart/BuildExecutionsChart'
import { useGetPipelineDashboardExecution } from 'services/pipeline-ng'
import { useErrorHandler } from '@pipeline/components/Dashboards/shared'

export default function PipelineBuildExecutionsChart() {
  const { getString } = useStrings()
  const { projectIdentifier, orgIdentifier, accountId, pipelineIdentifier, module } =
    useParams<PipelineType<ExecutionPathProps>>()
  const [range, setRange] = useState([Date.now() - 30 * 24 * 60 * 60000, Date.now()])

  const { data, loading, error } = useGetPipelineDashboardExecution({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      startTime: range[0],
      endTime: range[1],
      pipelineIdentifier,
      moduleInfo: module || ''
    }
  })

  useErrorHandler(error)

  const chartData = useMemo(() => {
    if (data?.data?.pipelineExecutionInfoList?.length) {
      return data.data.pipelineExecutionInfoList.map(val => ({
        time: val.date,
        success: val.count?.success,
        failed: val.count?.failure,
        aborted: val.count?.aborted,
        expired: val.count?.expired
      }))
    }
  }, [data])

  return (
    <ExecutionsChart
      titleText={getString('executionsText')}
      data={chartData}
      loading={loading}
      range={range}
      onRangeChange={setRange}
      yAxisTitle="# of executions"
    />
  )
}
