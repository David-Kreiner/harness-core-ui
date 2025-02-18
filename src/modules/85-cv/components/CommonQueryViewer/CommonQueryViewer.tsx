/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useContext } from 'react'
import cx from 'classnames'
import { Container, MultiTypeInputType, Text } from '@harness/uicore'
import { FontVariation } from '@harness/design-system'
import { defaultTo, isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { CommonHealthSourceFieldNames } from '@cv/pages/health-source/connectors/CommonHealthSource/CommonHealthSource.constants'
import CustomMetricsSectionHeader from '@cv/pages/health-source/connectors/CommonHealthSource/components/CustomMetricForm/components/CustomMetricsSectionHeader'
import CVMultiTypeQuery from '../CVMultiTypeQuery/CVMultiTypeQuery'
import { CommonQueryViewDialog } from './components/CommonQueryViewerDialog/CommonQueryViewDialog'
import { CommonQueryContent } from './components/CommonQueryContent/CommonQueryContent'
import { CommonRecords } from '../CommonRecords/CommonRecords'
import { SetupSourceTabsContext } from '../CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import type { CommonQueryViewerProps } from './types'

export function CommonQueryViewer(props: CommonQueryViewerProps): JSX.Element {
  const {
    className,
    records,
    fetchRecords,
    loading,
    error,
    query,
    isQueryExecuted,
    postFetchingRecords,
    isConnectorRuntimeOrExpression,
    dataTooltipId
  } = props

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { getString } = useStrings()

  const { isTemplate, expressions } = useContext(SetupSourceTabsContext)

  const handleFetchRecords = (): void => {
    fetchRecords()
    if (postFetchingRecords) {
      postFetchingRecords()
    }
  }

  return (
    <Container className={cx(className)}>
      <CustomMetricsSectionHeader
        sectionTitle={getString('cv.monitoringSources.commonHealthSource.defineQuery')}
        sectionSubTitle={`
        ${getString('cv.monitoringSources.commonHealthSource.defineQueryDescription')} \n
        ${getString('cv.monitoringSources.commonHealthSource.defineQuerySubDescription')}
        `}
      />

      {!isTemplate && (
        <Text font={{ variation: FontVariation.H6 }} margin={{ bottom: 'small' }} tooltipProps={{ dataTooltipId }}>
          {getString('cv.query')}
        </Text>
      )}
      {isTemplate ? (
        <CVMultiTypeQuery
          name={CommonHealthSourceFieldNames.QUERY}
          expressions={defaultTo(expressions, [])}
          fetchRecords={handleFetchRecords}
          disableFetchButton={isEmpty(query) || isConnectorRuntimeOrExpression || loading}
          allowedTypes={
            isConnectorRuntimeOrExpression
              ? [MultiTypeInputType.EXPRESSION, MultiTypeInputType.RUNTIME]
              : [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
          }
        />
      ) : (
        <CommonQueryContent
          onClickExpand={setIsDialogOpen}
          query={query}
          isDialogOpen={isDialogOpen}
          loading={loading}
          handleFetchRecords={handleFetchRecords}
        />
      )}
      {isQueryExecuted ? (
        <CommonRecords fetchRecords={handleFetchRecords} loading={loading} data={records} error={error} query={query} />
      ) : null}
      <CommonQueryViewDialog
        isOpen={isDialogOpen}
        onHide={() => setIsDialogOpen(false)}
        query={query}
        fetchRecords={handleFetchRecords}
        loading={loading}
        data={records}
        error={error}
        isQueryExecuted={isQueryExecuted}
      />
    </Container>
  )
}
