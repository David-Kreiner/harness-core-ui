/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { defaultTo, isEmpty } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { Text, Card, TableV2, Container, Icon, PageError, NoDataCard } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useGetSloConsumptionBreakdownView } from 'services/cv'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getDate, getConsumptionTableColums } from './CompositeSLOConsumption.utils'
import css from '../../DetailsPanel.module.scss'

interface CompositeSLOConsumptionProps {
  startTime: number
  endTime: number
}

const CompositeSLOConsumption = ({ startTime, endTime }: CompositeSLOConsumptionProps): JSX.Element => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier, identifier } = useParams<
    ProjectPathProps & { identifier: string }
  >()
  const isAccountLevel = !orgIdentifier && !projectIdentifier && !!accountId
  const { error, loading, data, refetch } = useGetSloConsumptionBreakdownView({ identifier, lazy: true })

  useEffect(() => {
    if (startTime && endTime) {
      refetch({
        queryParams: {
          accountId,
          orgIdentifier,
          projectIdentifier,
          startTime,
          endTime
        }
      })
    }
  }, [startTime, endTime])

  let content = <></>
  const tabelData = defaultTo(data?.data?.content, [])
  if (loading) {
    content = (
      <Container height={200} flex={{ justifyContent: 'center' }} style={{ overflow: 'auto' }}>
        <Icon name="steps-spinner" color={Color.GREY_400} size={30} />
      </Container>
    )
  } else if (error) {
    content = (
      <Container height={200} style={{ overflow: 'auto' }}>
        <PageError width={400} message={getErrorMessage(error)} onClick={() => refetch()} />
      </Container>
    )
  } else if (isEmpty(tabelData)) {
    content = (
      <Container height={200} style={{ overflow: 'auto' }}>
        <NoDataCard icon={'join-table'} message={getString('cv.slos.noData')} />
      </Container>
    )
  } else {
    content = (
      <TableV2 sortable={true} data={tabelData} columns={getConsumptionTableColums({ getString, isAccountLevel })} />
    )
  }

  return (
    <Card className={css.serviceDetailsCard}>
      <Text font={{ variation: FontVariation.CARD_TITLE }} color={Color.GREY_800} padding={{ bottom: 'medium' }}>
        {getString('cv.CompositeSLO.Consumption.title')} ({getDate(startTime)} - {getDate(endTime)})
      </Text>
      {content}
    </Card>
  )
}
export default CompositeSLOConsumption
