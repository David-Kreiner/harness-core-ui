/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { ExpandingSearchInput, Layout, Text, Button, ButtonVariation, TableV2, Page } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { defaultTo, get, isEmpty } from 'lodash-es'
import { Column } from 'react-table'
import { Divider } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import { NGTriggerEventHistoryResponse, useTriggerHistoryEventCorrelation } from 'services/pipeline-ng'
import { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useDefaultPaginationProps } from '@common/hooks/useDefaultPaginationProps'
import { COMMON_PAGE_SIZE_OPTIONS } from '@common/constants/Pagination'
import { usePrevious } from '@common/hooks/usePrevious'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import {
  PayloadDrawer,
  RenderColumnEventId,
  RenderColumnPayload,
  RenderColumnStatus
} from '../utils/TriggerActivityUtils'
import TriggerExplorerEmptyState from '../TriggerLandingPage/images/trigger_explorer_empty_state.svg'
import css from './TriggerExplorer.module.scss'

const RenderColumn: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <Text color={Color.BLACK} lineClamp={1} width="90%">
      {text}
    </Text>
  )
}

const RegisteredTriggers: React.FC = (): React.ReactElement => {
  const [searchId, setSearchId] = React.useState('')
  const { getRBACErrorMessage } = useRBACError()
  const previousSearchId = usePrevious(searchId)
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const {
    data: triggerData,
    loading,
    refetch,
    error
  } = useTriggerHistoryEventCorrelation({
    eventCorrelationId: searchId,
    queryParams: {
      accountIdentifier: accountId
    },
    lazy: true
  })
  const { content, totalElements, totalPages, pageable } = defaultTo(triggerData?.data, {})

  const paginationProps = useDefaultPaginationProps({
    itemCount: defaultTo(totalElements, 0),
    pageSize: COMMON_PAGE_SIZE_OPTIONS[0],
    pageCount: defaultTo(totalPages, -1),
    pageIndex: get(pageable, 'pageNumber', 0)
  })

  const [showPayload, setShowPayload] = React.useState<boolean>(true)
  const [selectedPayloadRow, setSelectedPayloadRow] = React.useState<string | undefined>()

  const columns: Column<NGTriggerEventHistoryResponse>[] = useMemo(
    () => [
      {
        Header: getString('triggers.activityHistory.eventCorrelationId'),
        id: 'eventCorrelationId',
        width: '25%',
        Cell: RenderColumnEventId
      },
      {
        Header: getString('common.triggerName'),
        id: 'name',
        width: '15%',
        Cell: ({ row }) => <RenderColumn text={row.original.triggerIdentifier} />
      },
      {
        Header: getString('triggers.activityHistory.triggerStatus'),
        id: 'status',
        width: '20%',
        Cell: RenderColumnStatus
      },
      {
        Header: getString('message'),
        id: 'message',
        width: '35%',
        Cell: ({ row }) => <RenderColumn text={row.original.message} />
      },
      {
        Header: getString('common.payload'),
        width: '5%',
        id: 'payload',
        Cell: RenderColumnPayload,
        setShowPayload,
        setSelectedPayloadRow
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <Layout.Vertical padding={'xlarge'}>
      <Text font={{ weight: 'bold', variation: FontVariation.H4 }}>
        {getString('triggers.triggerExplorer.pageHeading')}
      </Text>
      <Text font={{ weight: 'light', variation: FontVariation.BODY }} padding={{ top: 'medium' }}>
        {getString('triggers.triggerExplorer.pageSubHeading')}
      </Text>
      <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'flex-start' }} spacing={'medium'}>
        <Text font={{ weight: 'semi-bold', variation: FontVariation.H6 }}>
          {getString('triggers.triggerExplorer.enterEventCorrelationId')}
        </Text>
        <ExpandingSearchInput
          alwaysExpanded
          width={300}
          name="eventCorrelationIdSearch"
          placeholder={getString('triggers.triggerExplorer.searchPlaceholder')}
          onChange={text => {
            setSearchId(text.trim())
          }}
          throttle={200}
        />
        <Button
          small
          variation={ButtonVariation.PRIMARY}
          data-testid="searchBasedOnEventCorrelationId"
          text={getString('search')}
          onClick={() => {
            if (previousSearchId !== searchId) {
              refetch()
            }
          }}
          disabled={isEmpty(searchId)}
        />
      </Layout.Horizontal>
      <div className={css.divider}>
        <Divider />
      </div>
      <Page.Body
        loading={loading}
        error={error ? getRBACErrorMessage(error) : ''}
        retryOnError={() => refetch()}
        noData={{
          when: () => Array.isArray(content) && isEmpty(content),
          image: TriggerExplorerEmptyState,
          messageTitle: getString('triggers.triggerExplorer.emptyStateMessage')
        }}
      >
        {!isEmpty(content) && searchId && (
          <TableV2<NGTriggerEventHistoryResponse>
            className={css.table}
            columns={columns}
            data={content as NGTriggerEventHistoryResponse[]}
            name="TriggerExplorerView"
            pagination={paginationProps}
          />
        )}
      </Page.Body>

      {showPayload && selectedPayloadRow && (
        <PayloadDrawer onClose={() => setShowPayload(false)} selectedPayloadRow={selectedPayloadRow} />
      )}
    </Layout.Vertical>
  )
}

export default RegisteredTriggers
