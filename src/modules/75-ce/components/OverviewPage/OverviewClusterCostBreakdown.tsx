/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Container, Text, Layout } from '@wings-software/uicore'
import { Link, useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import routes from '@common/RouteDefinitions'
import {
  Maybe,
  PerspectiveTrendStats,
  QlceViewAggregateOperation,
  StatsInfo,
  useFetchPerspectiveDetailsSummaryQuery
} from 'services/ce/services'
import { useStrings } from 'framework/strings'
import { getGMTEndDateTime, getGMTStartDateTime } from '@ce/utils/momentUtils'
import { getTimeFilters } from '@ce/utils/perspectiveUtils'
import type { TimeRange } from '@ce/pages/overview/OverviewPage'
import { getEmissionsValue } from '@ce/utils/formatResourceValue'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { CE_COLOR_CONST } from '../CEChart/CEChartOptions'
import { EfficiencyScore, LEGEND_LIMIT, ListType, Loader, Stats, TableList, VerticalLayout } from './OverviewPageLayout'
import SustainabilityCard from './SustainabilityCard'
import css from './OverviewPage.module.scss'

interface ClusterCostBreakdownProps {
  timeRange: TimeRange
  defaultClusterPerspectiveId: string | null
}

const transformClusterCost = (data: Maybe<StatsInfo>[] = []): Stats[] => {
  return data
    .filter(d => d != null)
    .map((d, idx) => {
      return {
        label: d?.statsLabel as string,
        value: d?.value,
        trend: d?.statsTrend,
        legendColor: CE_COLOR_CONST[idx % CE_COLOR_CONST.length]
      }
    })
}

const useClusterCostBreakdown = (timeRange: TimeRange) => {
  const [summaryResult] = useFetchPerspectiveDetailsSummaryQuery({
    variables: {
      isClusterQuery: true,
      aggregateFunction: [
        { operationType: QlceViewAggregateOperation.Sum, columnName: 'billingamount' },
        { operationType: QlceViewAggregateOperation.Sum, columnName: 'actualidlecost' },
        { operationType: QlceViewAggregateOperation.Sum, columnName: 'unallocatedcost' },
        { operationType: QlceViewAggregateOperation.Max, columnName: 'startTime' },
        { operationType: QlceViewAggregateOperation.Min, columnName: 'startTime' }
      ],
      filters: [...getTimeFilters(getGMTStartDateTime(timeRange.from), getGMTEndDateTime(timeRange.to))]
    }
  })

  const { data: summaryData, fetching: summaryFetching } = summaryResult
  const cloudCost = useMemo(() => (summaryData?.perspectiveTrendStats || {}) as PerspectiveTrendStats, [summaryData])
  const totalCost = useMemo(() => transformClusterCost([cloudCost.cost]), [cloudCost])
  const chartData = useMemo(
    () => transformClusterCost([cloudCost.idleCost, cloudCost.utilizedCost, cloudCost.unallocatedCost]),
    [cloudCost]
  )

  const { statsValue = 0, statsTrend = 0 } = cloudCost.efficiencyScoreStats || {}
  return {
    fetching: summaryFetching,
    chartData,
    totalCost: totalCost[0],
    effciency: { statsValue, statsTrend }
  }
}

const OverviewClusterCostBreakdown = (props: ClusterCostBreakdownProps) => {
  const { getString } = useStrings()
  const { accountId } = useParams<{ accountId: string }>()
  const sustainabilityEnabled = useFeatureFlag(FeatureFlag.CCM_SUSTAINABILITY)
  const { timeRange, defaultClusterPerspectiveId } = props
  const {
    fetching,
    chartData,
    totalCost,
    effciency: { statsValue, statsTrend }
  } = useClusterCostBreakdown(timeRange)

  if (fetching) {
    return <Loader />
  }

  return (
    <Layout.Vertical spacing="small" className={css.clusterCost}>
      <VerticalLayout
        title={getString('ce.overview.cardtitles.clusterBreakdown')}
        chartData={chartData}
        totalCost={totalCost}
        seeAll={
          defaultClusterPerspectiveId && (
            <Link
              to={routes.toPerspectiveDetails({
                accountId: accountId,
                perspectiveId: defaultClusterPerspectiveId,
                perspectiveName: defaultClusterPerspectiveId
              })}
            >
              <Text inline color="primary7">
                {getString('ce.overview.seeAll')}
              </Text>
            </Link>
          )
        }
        footer={
          <div>
            <Text tooltipProps={{ dataTooltipId: 'overviewCostBreakdown' }}>Cost breakdown</Text>
            <div className={css.breakdown}>
              <Container padding={{ top: 'medium' }}>
                <TableList data={chartData.slice(0, LEGEND_LIMIT)} type={ListType.KEY_VALUE} classNames={css.rowGap8} />
              </Container>
              <EfficiencyScore
                score={!isNaN(statsValue as number) && totalCost?.value > 0 ? Number(statsValue) : 0}
                trend={totalCost?.value > 0 ? statsTrend : 0}
              />
            </div>
          </div>
        }
      />
      {sustainabilityEnabled && (
        <SustainabilityCard
          title={getString('ce.overview.sustainability.fromClusterTitle')}
          firstColValue={getEmissionsValue(totalCost.value || 0)}
          firstColText={getString('common.allClusters')}
          secondColValue={getEmissionsValue(defaultTo(chartData[0]?.value, 0) + defaultTo(chartData[2]?.value, 0))}
          secondColText={getString('ce.overview.sustainability.idleAndUnallocatedClusters')}
        />
      )}
    </Layout.Vertical>
  )
}

export default OverviewClusterCostBreakdown
