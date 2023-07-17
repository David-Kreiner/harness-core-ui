/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactTimeago from 'react-timeago'
import type { Column } from 'react-table'
import { Text, Layout, TableV2 } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { defaultTo, get } from 'lodash-es'
import { useDefaultPaginationProps } from '@common/hooks/useDefaultPaginationProps'
import { COMMON_DEFAULT_PAGE_SIZE } from '@common/constants/Pagination'
import type { NGTriggerEventHistoryResponse, PageNGTriggerEventHistoryResponse } from 'services/pipeline-ng'
import routes from '@common/RouteDefinitions'
import type { PipelinePathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import {
  CellType,
  PayloadDrawer,
  RenderColumnEventId,
  RenderColumnPayload,
  RenderColumnStatus
} from '../../utils/TriggerActivityUtils'
import css from './TriggerActivityHistoryPage.module.scss'

interface TriggerActivityListProps {
  triggersListResponse?: PageNGTriggerEventHistoryResponse
}

const RenderColumnTime: CellType = ({ row }) => {
  const data = get(row.original, 'targetExecutionSummary')

  return (
    <Layout.Vertical>
      <Layout.Horizontal spacing="small" width={230}>
        <Text color={Color.BLACK} lineClamp={1} font={{ variation: FontVariation.BODY2 }}>
          <ReactTimeago date={get(data, 'startTs') as number} />
        </Text>
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

const RenderColumnExecutionId: CellType = ({ row }) => {
  const { orgIdentifier, projectIdentifier, pipelineIdentifier, accountId, module } =
    useParams<PipelineType<PipelinePathProps>>()
  const { getString } = useStrings()
  const data = get(row.original, 'targetExecutionSummary')
  if (!get(data, 'planExecutionId')) {
    return null
  }
  return (
    <Layout.Vertical>
      <Layout.Horizontal flex={{ align: 'center-center' }} style={{ justifyContent: 'flex-start' }} spacing="xsmall">
        <Link
          to={routes.toExecutionPipelineView({
            accountId,
            orgIdentifier,
            projectIdentifier,
            pipelineIdentifier: defaultTo(pipelineIdentifier, '-1'),
            executionIdentifier: defaultTo(get(data, 'planExecutionId'), '-1'),
            module,
            source: 'executions'
          })}
        >
          <Text
            font={{ variation: FontVariation.LEAD }}
            color={Color.PRIMARY_7}
            tooltipProps={{ isDark: true }}
            lineClamp={1}
          >
            {get(data, 'targetId')}
          </Text>
        </Link>
      </Layout.Horizontal>
      <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_500} lineClamp={1}>
        {`${getString('pipeline.executionId')}: ${get(data, 'runSequence')}`}
      </Text>
    </Layout.Vertical>
  )
}

const TriggerActivityList: React.FC<TriggerActivityListProps> = ({ triggersListResponse }) => {
  const { getString } = useStrings()
  const [showPayload, setShowPayload] = React.useState<boolean>(true)
  const [selectedPayloadRow, setSelectedPayloadRow] = React.useState<string | undefined>()
  const { content, totalElements, size, totalPages, pageable } = defaultTo(triggersListResponse, {})
  const data: NGTriggerEventHistoryResponse[] = useMemo(() => defaultTo(content, []), [content])

  const columns: Column<NGTriggerEventHistoryResponse>[] = useMemo(
    () => [
      {
        Header: getString('timeLabel'),
        id: 'time',
        width: '15%',
        Cell: RenderColumnTime
      },
      {
        Header: getString('triggers.activityHistory.eventCorrelationId'),
        accessor: 'eventCorrelationId',
        width: '25%',
        Cell: RenderColumnEventId
      },
      {
        Header: getString('triggers.activityHistory.triggerStatus'),
        accessor: 'triggerEventStatus',
        width: '25%',
        Cell: RenderColumnStatus
      },
      {
        Header: getString('triggers.activityHistory.executionDetails'),
        accessor: row => row?.targetExecutionSummary?.planExecutionId,
        width: '25%',
        Cell: RenderColumnExecutionId
      },
      {
        Header: getString('common.payload'),
        width: '10%',
        Cell: RenderColumnPayload,
        setShowPayload,
        setSelectedPayloadRow
      }
    ],
    []
  )

  const paginationProps = useDefaultPaginationProps({
    itemCount: defaultTo(totalElements, 0),
    pageSize: defaultTo(size, COMMON_DEFAULT_PAGE_SIZE),
    pageCount: defaultTo(totalPages, -1),
    pageIndex: get(pageable, 'pageNumber', 0)
  })

  return (
    <>
      <TableV2<NGTriggerEventHistoryResponse>
        className={css.table}
        columns={columns}
        data={data}
        name="TriggerListView"
        pagination={paginationProps}
      />
      {showPayload && selectedPayloadRow && (
        <PayloadDrawer onClose={() => setShowPayload(false)} selectedPayloadRow={selectedPayloadRow} />
      )}
    </>
  )
}

export default TriggerActivityList
