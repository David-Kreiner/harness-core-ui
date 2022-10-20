/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { isUndefined } from 'lodash-es'
import { Container, Text } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useFetchPipelineHealth } from 'services/pipeline-ng'
import type { PipelineType, ExecutionPathProps } from '@common/interfaces/RouteInterfaces'
import { SummaryCard } from '../CIDashboardSummaryCards/CIDashboardSummaryCards'
import { RangeSelectorWithTitle } from '../RangeSelector'
import { roundNumber, formatDuration, useErrorHandler } from '../shared'
import styles from './PipelineSummaryCards.module.scss'

export default function PipelineSummaryCards() {
  const { getString } = useStrings()
  const { projectIdentifier, orgIdentifier, accountId, pipelineIdentifier, module } =
    useParams<PipelineType<ExecutionPathProps>>()
  const [range, setRange] = useState([Date.now() - 30 * 24 * 60 * 60000, Date.now()])
  const { data, loading, error } = useFetchPipelineHealth({
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

  const successRate = roundNumber(data?.data?.executions?.success?.percent)
  return (
    <Container>
      <RangeSelectorWithTitle title={getString('pipeline.dashboards.pipelineHealth')} onRangeSelected={setRange} />
      <Container className={styles.summaryCards}>
        <SummaryCard
          title={
            <Text font={{ weight: 'bold' }} color={Color.GREY_600}>
              {getString('pipeline.dashboards.totalExecutions')}
            </Text>
          }
          text={data?.data?.executions?.total?.count}
          rate={data?.data?.executions?.total?.rate}
          isLoading={loading}
          invertColor={true}
        />
        <SummaryCard
          title={
            <Text font={{ weight: 'bold' }} color={Color.GREY_600}>
              {getString('pipeline.dashboards.successRate')}
            </Text>
          }
          text={isUndefined(successRate) ? undefined : successRate + '%'}
          rate={data?.data?.executions?.success?.rate}
          isLoading={loading}
          invertColor={true}
        />
        <SummaryCard
          title={
            <Text font={{ weight: 'bold' }} color={Color.GREY_600}>
              {getString('pipeline.dashboards.meanDuration')}
            </Text>
          }
          text={formatDuration(data?.data?.executions?.meanInfo?.duration)}
          rateDuration={data?.data?.executions?.meanInfo?.rate}
          isLoading={loading}
        />
        <SummaryCard
          title={
            <Text font={{ weight: 'bold' }} color={Color.GREY_600}>
              {getString('pipeline.dashboards.medianDuration')}
            </Text>
          }
          text={formatDuration(data?.data?.executions?.medianInfo?.duration)}
          rateDuration={data?.data?.executions?.medianInfo?.rate}
          isLoading={loading}
        />
      </Container>
    </Container>
  )
}
