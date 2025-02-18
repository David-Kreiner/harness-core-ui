/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import type { OptionsStackingValue } from 'highcharts'
import moment from 'moment'
import { Icon, Layout, Text } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { useHistory, useParams } from 'react-router-dom'
import qs from 'qs'
import { CE_DATE_FORMAT_INTERNAL } from '@common/utils/momentUtils'
import { QlceViewFieldInputInput, QlceViewTimeGroupType } from 'services/ce/services'
import type { PerspectiveAnomalyData } from 'services/ce'
import formatCost from '@ce/utils/formatCost'
import routes from '@common/RouteDefinitions'
import { useStrings } from 'framework/strings'
import { generateGroupBy, getCloudProviderFromFields, getFiltersFromEnityMap } from '@ce/utils/anomaliesUtils'
import { useUpdateQueryParams } from '@common/hooks'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import type { ChartConfigType } from './chartUtils'
import { CE_COLOR_CONST } from '../CEChart/CEChartOptions'
import CEChart from '../CEChart/CEChart'
import ChartLegend from './ChartLegend'
import css from './Chart.module.scss'

export const DAYS_FOR_TICK_INTERVAL = 10
export const ONE_MONTH = 24 * 3600 * 1000 * 30

/* istanbul ignore next */
function getxAxisFormat(aggregation: QlceViewTimeGroupType, value: number): string {
  switch (aggregation) {
    case QlceViewTimeGroupType.Month:
      return moment(value).utc().format('MMM')

    case QlceViewTimeGroupType.Hour:
      return moment(value).utc().format('MMM DD HH:00')

    default:
      return moment(value).utc().format('MMM DD')
  }
}

interface GetChartProps {
  chart: ChartConfigType[]
  idx: number
  onLoad: (chart: Highcharts.Chart) => void
  chartType: string
  aggregation: QlceViewTimeGroupType
  xAxisPointCount: number
  setFilterUsingChartClick?: (value: string) => void
  showLegends: boolean
  anomaliesCountData?: PerspectiveAnomalyData[]
  groupBy: QlceViewFieldInputInput
}

const GetChart: React.FC<GetChartProps> = ({
  chart,
  idx,
  onLoad,
  chartType,
  aggregation,
  xAxisPointCount,
  setFilterUsingChartClick,
  showLegends,
  anomaliesCountData,
  groupBy
}) => {
  const [chartObj, setChartObj] = useState<Highcharts.Chart | null>(null)

  const [forceCounter, setForceCounter] = useState(0)
  const history = useHistory()
  const { accountId } = useParams<{
    accountId: string
  }>()
  const { getString } = useStrings()
  const { updateQueryParams } = useUpdateQueryParams()
  const { trackEvent } = useTelemetry()

  useEffect(() => {
    // When the chart data changes the legend component is not getting updated due to no deps on data
    // This setForceCounter ensures that it is taken care of when chart data is changing.
    // This fixes the use case of sorting chart based column sequence of the grid.
    setForceCounter(forceCounter + 1)
  }, [chart])

  const xAxisOptions: Highcharts.XAxisOptions = {
    type: 'datetime',
    ordinal: true,
    min: null,
    tickInterval:
      aggregation === QlceViewTimeGroupType.Day && xAxisPointCount < DAYS_FOR_TICK_INTERVAL
        ? 24 * 3600 * 1000
        : undefined,
    // Add Tick Interval,
    labels: {
      formatter: function () {
        return getxAxisFormat(aggregation, Number(this.value))
      }
    },
    minPadding: 0.05,
    maxPadding: 0.05
  }

  const stacking: OptionsStackingValue = 'normal'

  const plotOptions = {
    series: {
      connectNulls: true,
      animation: {
        duration: 500
      },
      events: {
        click: function (event: any) {
          const name = event.point.series.userOptions.name as string
          if (chart.length > 1 && setFilterUsingChartClick) {
            setFilterUsingChartClick(name)
          }
        }
      },
      stacking
    },
    area: {
      lineWidth: 1,
      marker: {
        enabled: false
      }
    },
    column: {
      borderColor: undefined
    },
    legend: {
      enabled: true,
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical'
    }
  }

  if (aggregation === QlceViewTimeGroupType.Month) {
    xAxisOptions.tickInterval = ONE_MONTH
  }

  /* istanbul ignore next */
  const redirection = (event: any) => {
    if (event.target.id.includes('navAnomalies')) {
      const anchorElm = event.target.id
      const elmId = anchorElm.split('_')
      const time = moment(Number(elmId[1])).utc().format(CE_DATE_FORMAT_INTERNAL)
      trackEvent(USER_JOURNEY_EVENTS.VIEW_ANOMALIES_CLICK, {})
      history.push({
        pathname: routes.toCEAnomalyDetection({
          accountId: accountId
        }),
        search: `?${qs.stringify({
          timeRange: JSON.stringify({
            to: time,
            from: time
          })
        })}`
      })
    }

    if (event.target.id.includes('applyFilters')) {
      const anchorElm = event.target.id
      const elmId = anchorElm.split('_')

      const time = Number(elmId[1])
      const anomalyData = anomaliesCountData?.find(el => el.timestamp === time)
      const resourceData = anomalyData?.associatedResources as unknown as Array<Record<string, string>>
      if (resourceData?.length && resourceData[0]) {
        trackEvent(USER_JOURNEY_EVENTS.APPLY_ANOMALY_FILTERS, {})
        const cloudProvider = getCloudProviderFromFields(resourceData[0])
        updateQueryParams({
          groupBy: JSON.stringify(generateGroupBy(resourceData[0].field, cloudProvider)),
          filters: JSON.stringify(getFiltersFromEnityMap(resourceData, cloudProvider))
        })
      }
    }
  }

  /* istanbul ignore next */
  const labelsText = (item: Record<string, any>) => {
    return `
      <div class=${css.anomaliesWrapper}>
      <div class=${css.anomaliesWrapperTriangle}></div>
        <span class=${css.anomaliesText}>${item.anomalyCount}</span>
        <span class=${css.anomaliesTooltip}>
          <p class=${css.anomaliesCount}>${getString('ce.anomalyDetection.tooltip.countText', {
      count: item.anomalyCount
    })}
          </p>
          <div class=${css.costWrapper}>
            <span class=${css.anomaliesCost}>${item.actualCost && formatCost(item.actualCost)}</span>
            <span class=${item.differenceFromExpectedCost < 0 ? css.differenceCostNeg : css.differenceCostPos}>
              ${item.differenceFromExpectedCost < 0 ? '-' : '+'}
              ${item.differenceFromExpectedCost ? formatCost(item.differenceFromExpectedCost) : 0}
            </span>
          </div>
          <a id="navAnomalies_${item.timestamp}" class=${css.anomaliesNav}>${getString(
      'ce.anomalyDetection.tooltip.anomaliesRedirectionText'
    )}</a>
          <span class=${item.anomalyCount > 1 ? css.isDisabled : ''}><a id="applyFilters_${item.timestamp}" class=${
      css.anomaliesNav
    }>${getString('ce.anomalyDetection.tooltip.filterText')}</a></span>
        </span>
      <div>
    `
  }

  const anomaliesLabels = () => {
    const anomaliesPointMap = anomaliesCounts
    const labels = anomaliesCountData?.map(item => {
      const yCoord = anomaliesPointMap[item.timestamp || 0]
      return {
        point: { x: item.timestamp || 0, y: yCoord, xAxis: 0, yAxis: 0 },
        useHTML: true,
        text: labelsText(item),
        y: -20
      }
    })

    return labels || []
  }

  const chartData = useMemo(() => {
    let index = 0
    const data: ChartConfigType[] = []

    chart.forEach(chartItem => {
      switch (chartItem.name) {
        case 'Others':
          data.push({ ...chartItem, color: 'var(--blue-100)' })
          break
        case 'Unallocated':
          data.push({ ...chartItem, color: 'var(--primary-2)' })
          break
        default: {
          data.push({ ...chartItem, color: CE_COLOR_CONST[index % CE_COLOR_CONST.length] })
          index++
        }
      }
    })

    return data
  }, [chart])

  const anomaliesCounts = useMemo(() => {
    const anomaliesPointMap: Record<number, number> = {}
    chartData.map(chartItem => {
      chartItem.data.map(dataItem => {
        const xCoord = dataItem[0]
        const yCoord = dataItem[1]
        const item = anomaliesCountData?.filter(anomaliesPoint => anomaliesPoint.timestamp === xCoord) || []
        if (item?.length > 0) {
          if (xCoord in anomaliesPointMap) {
            anomaliesPointMap[xCoord] = anomaliesPointMap[xCoord] + Number(yCoord)
          } else {
            anomaliesPointMap[xCoord] = Number(yCoord)
          }
        }
      })
    })
    return anomaliesPointMap
  }, [anomaliesCountData])

  return (
    <article key={idx} onClick={redirection}>
      <CEChart
        options={{
          series: chartData as any,
          chart: {
            zoomType: 'x',
            height: 300,
            type: chartType,
            spacingTop: 40,
            events: {
              load() {
                setChartObj(this)
                onLoad(this)
              }
            }
          },
          plotOptions,
          yAxis: {
            endOnTick: true,
            min: 0,
            max: null,
            tickAmount: 3,
            title: {
              text: ''
            },
            labels: {
              formatter: function () {
                return `$${this.value}`
              }
            }
          },
          xAxis: xAxisOptions,
          annotations: [
            {
              labels: anomaliesLabels(),
              draggable: '',
              visible: true,
              labelOptions: {
                crop: false,
                useHTML: true,
                backgroundColor: 'transparent',
                borderWidth: 0
              }
            }
          ]
        }}
      />
      {chartObj && showLegends ? (
        <Layout.Horizontal style={{ alignItems: 'center' }}>
          <Text padding={{ left: 'large' }} font={{ variation: FontVariation.SMALL_BOLD }} color={Color.GREY_400}>
            {getString('ce.perspectives.top12GroupBy', { groupBy: groupBy.fieldName })}
          </Text>
          <ChartLegend chartRefObj={chartObj as unknown as Highcharts.Chart} />
        </Layout.Horizontal>
      ) : showLegends ? (
        <Icon name="spinner" />
      ) : null}
    </article>
  )
}

interface CCMChartProps {
  data: ChartConfigType[][]
  onLoad: (chart: Highcharts.Chart) => void
  chartType: string
  aggregation: QlceViewTimeGroupType
  xAxisPointCount: number
  setFilterUsingChartClick?: (value: string) => void
  showLegends: boolean
  anomaliesCountData?: PerspectiveAnomalyData[]
  groupBy: QlceViewFieldInputInput
}

const Chart: React.FC<CCMChartProps> = ({
  data,
  onLoad,
  chartType,
  aggregation,
  xAxisPointCount,
  setFilterUsingChartClick,
  showLegends,
  anomaliesCountData,
  groupBy
}) => {
  return (
    <>
      {data.map((chart, idx: number) => {
        return chart ? (
          <GetChart
            key={idx}
            chartType={chartType}
            aggregation={aggregation}
            xAxisPointCount={xAxisPointCount}
            chart={chart}
            idx={idx}
            setFilterUsingChartClick={setFilterUsingChartClick}
            onLoad={onLoad}
            showLegends={showLegends}
            anomaliesCountData={anomaliesCountData}
            groupBy={groupBy}
          />
        ) : /* istanbul ignore next */ null
      })}
    </>
  )
}

export default Chart
