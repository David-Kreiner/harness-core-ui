/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import { Accordion, Layout, Utils, useToaster } from '@wings-software/uicore'
import React, { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapElkToServiceFieldNames } from '@cv/pages/health-source/connectors/ElkHealthSource/components/MapQueriesToHarnessService/constants'
import { useGetELKLogSampleData } from 'services/cv'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { QueryViewer } from '@cv/components/QueryViewer/QueryViewer'
import Card from '@cv/components/Card/Card'

import { ElkMetricNameAndHostIdentifier } from '../../ElkMetricNameAndHostIdentifier'
import type { MapQueriesToHarnessServiceLayoutProps } from './MapQueriesToHarnessServiceLayout.types'
import css from './MapQueriesToHarnessServiceLayout.module.scss'

export default function MapQueriesToHarnessServiceLayout(props: MapQueriesToHarnessServiceLayoutProps): JSX.Element {
  const { formikProps, connectorIdentifier, onChange, isConnectorRuntimeOrExpression, isTemplate, expressions } = props
  const [isQueryExecuted, setIsQueryExecuted] = useState(false)
  const [elkSampleData, setElkSampleData] = useState<any>()
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const values = formikProps?.values
  const { serviceInstance, identifyTimestamp, messageIdentifier, logIndexes } = values || {}
  const query = useMemo(() => (values?.query?.length ? values.query : ''), [values])
  const queryParams = useMemo(
    () => ({
      accountId,
      projectIdentifier,
      orgIdentifier,
      tracingId: Utils.randomId(),
      connectorIdentifier: connectorIdentifier as string
    }),
    [accountId, projectIdentifier, orgIdentifier, connectorIdentifier]
  )

  const { mutate: getSampleData, loading, error } = useGetELKLogSampleData({})

  const staleRecordsWarningMessage = useMemo(
    () => (values?.isStaleRecord ? getString('cv.monitoringSources.splunk.staleRecordsWarning') : ''),
    [values?.isStaleRecord]
  )

  const fetchElkRecords = useCallback(async () => {
    await getSampleData(
      {
        query
      },
      {
        queryParams: {
          accountId,
          orgIdentifier,
          projectIdentifier,
          connectorIdentifier,
          tracingId: queryParams?.tracingId,
          index: formikProps?.values?.logIndexes
        }
      }
    )
      .then(response => {
        setElkSampleData(response.data ?? [])
      })
      .catch(err => {
        showError(err)
        setElkSampleData([])
      })
    setIsQueryExecuted(true)
  }, [
    formikProps?.values?.logIndexes,
    getSampleData,
    query,
    accountId,
    orgIdentifier,
    projectIdentifier,
    connectorIdentifier,
    queryParams?.tracingId,
    showError
  ])

  const postFetchingRecords = useCallback(() => {
    // resetting values of service once fetch records button is clicked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    onChange(MapElkToServiceFieldNames.IS_STALE_RECORD, false)
  }, [onChange])

  return (
    <Card>
      <>
        <Layout.Horizontal>
          <Accordion activeId="metricToService" className={css.accordian}>
            <Accordion.Panel
              id="metricToService"
              summary={getString('cv.monitoringSources.mapQueriesToServices')}
              details={
                <ElkMetricNameAndHostIdentifier
                  serviceInstance={serviceInstance}
                  logIndexes={logIndexes}
                  identifyTimestamp={identifyTimestamp}
                  messageIdentifier={messageIdentifier}
                  sampleRecord={elkSampleData?.[0] || null}
                  isQueryExecuted={isQueryExecuted}
                  onChange={onChange}
                  loading={false}
                  isTemplate={isTemplate}
                  expressions={expressions}
                  isConnectorRuntimeOrExpression={isConnectorRuntimeOrExpression}
                  connectorIdentifier={connectorIdentifier}
                  formikProps={formikProps}
                />
              }
            />
          </Accordion>
          <div className={css.queryViewContainer}>
            <QueryViewer
              isQueryExecuted={isQueryExecuted}
              className={css.validationContainer}
              records={elkSampleData}
              fetchRecords={fetchElkRecords}
              queryInputs={formikProps.values}
              postFetchingRecords={postFetchingRecords}
              loading={loading}
              error={error}
              query={formikProps?.values?.logIndexes ? query : ''}
              queryTextAreaProps={{
                onChangeCapture: () => {
                  onChange(MapElkToServiceFieldNames.IS_STALE_RECORD, true)
                }
              }}
              staleRecordsWarning={staleRecordsWarningMessage}
              queryNotExecutedMessage={getString('cv.monitoringSources.elk.submitElkQuery')}
              dataTooltipId={'elkQuery'}
              isTemplate={isTemplate}
              expressions={expressions}
              isConnectorRuntimeOrExpression={isConnectorRuntimeOrExpression}
            />
          </div>
        </Layout.Horizontal>
      </>
    </Card>
  )
}
