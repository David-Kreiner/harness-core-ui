/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import { FormikForm } from '@harness/uicore'
import { Formik } from 'formik'
import userEvent from '@testing-library/user-event'
import * as cvServices from 'services/cv'
import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import { TestWrapper } from '@common/utils/testUtils'
import type { CustomMetricFormContainerProps } from '../CustomMetricForm.types'
import CustomMetricFormContainer from '../CustomMetricFormContainer'
import {
  logsTablePayloadMock,
  mockedCustomMetricFormContainerData,
  mockedCustomMetricsFormForLogsTable,
  mockedCustomMetricsFormForLogsTable2,
  sampleDataResponse,
  sampleRawRecordsMock
} from './CustomMetricFormContainer.mock'
import { validateAddMetricForm } from '../CustomMetricFormContainer.utils'

function WrapperComponent(props: CustomMetricFormContainerProps): JSX.Element {
  return (
    <Formik initialValues={props} onSubmit={jest.fn()}>
      <FormikForm>
        <TestWrapper
          path="/account/:accountId/cv/orgs/:orgIdentifier/projects/:projectIdentifier"
          pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
        >
          <CustomMetricFormContainer {...props} />
        </TestWrapper>
      </FormikForm>
    </Formik>
  )
}

const getString = (key: any): any => {
  return key
}

describe('Unit tests for CustomMetricFormContainer', () => {
  const props = {
    ...mockedCustomMetricFormContainerData,
    setMappedMetrics: jest.fn(),
    setCreatedMetrics: jest.fn(),
    setGroupedCreatedMetrics: jest.fn(),
    setNonCustomFeilds: jest.fn()
  } as any

  test('Ensure CustomMetricFormContainer component loads with the button to add metric', async () => {
    const { getByText } = render(<WrapperComponent {...props} />)
    await waitFor(() => expect(getByText('common.addName')).toBeInTheDocument())
  })

  test('should be able to click on the add Metric button to open the Add Metric modal', async () => {
    const { getByText, getAllByText } = render(<WrapperComponent {...props} />)
    const addMetricButton = getByText('common.addName')
    await waitFor(() => expect(addMetricButton).toBeInTheDocument())
    userEvent.click(addMetricButton)
    await waitFor(() => expect(getAllByText('common.addName')).toHaveLength(2))
  })

  test('should give proper error message when metric name is not passed', async () => {
    const formData = {
      metricName: '',
      identifier: 'identifier',
      groupName: 'group-1'
    }
    const createdMetrics: string[] = []
    const actualErrors = validateAddMetricForm(formData, getString, createdMetrics)
    expect(actualErrors).toEqual({ metricName: 'fieldRequired' })
  })

  test('should give proper error message when groupName is not passed', async () => {
    const formData = {
      metricName: 'metric1',
      identifier: 'identifier',
      groupName: ''
    }
    const createdMetrics: string[] = []
    const actualErrors = validateAddMetricForm(formData, getString, createdMetrics)
    expect(actualErrors).toEqual({ groupName: 'fieldRequired' })
  })

  test('should give proper error message when identifier is not passed', async () => {
    const formData = {
      metricName: 'metric1',
      identifier: '',
      groupName: 'group-1'
    }
    const createdMetrics: string[] = []
    const actualErrors = validateAddMetricForm(formData, getString, createdMetrics)
    expect(actualErrors).toEqual({ identifier: 'fieldRequired' })
  })

  test('should give proper error message when duplicate metric name is passed', async () => {
    const formData = {
      metricName: 'metric1',
      identifier: 'metric1',
      groupName: 'group-1'
    }
    const createdMetrics: string[] = ['metric1']
    const actualErrors = validateAddMetricForm(formData, getString, createdMetrics)
    expect(actualErrors).toEqual({
      metricName: 'cv.monitoringSources.prometheus.validation.uniqueName'
    })
  })

  describe('Custom metric logs table', () => {
    const mockProps = {
      ...mockedCustomMetricsFormForLogsTable,
      setMappedMetrics: jest.fn(),
      setCreatedMetrics: jest.fn(),
      setGroupedCreatedMetrics: jest.fn(),
      setNonCustomFeilds: jest.fn()
    } as any
    test('should test whether the inputs are disabled if the query is not entered and should take correct default value', async () => {
      const { container } = render(<WrapperComponent {...mockProps} />)
      expect(container.querySelector('.jsonSelectorButton')).toBeDisabled()
      expect(container.querySelector('.jsonSelectorButton')).toHaveTextContent('_sourcehost')
    })

    test('should test whether the inputs are enabled if the query present', async () => {
      jest.spyOn(cvServices, 'useGetSampleRawRecord').mockReturnValue({
        mutate: jest.fn().mockImplementation(() => {
          return {
            status: 'SUCCESS',
            resource: {
              rawRecords: sampleRawRecordsMock
            }
          }
        }),
        loading: false,
        error: null,
        cancel: () => null
      })
      const mockProps2 = {
        ...mockedCustomMetricsFormForLogsTable2,
        setMappedMetrics: jest.fn(),
        setCreatedMetrics: jest.fn(),
        setGroupedCreatedMetrics: jest.fn(),
        setNonCustomFeilds: jest.fn()
      } as any
      const { container } = render(<WrapperComponent {...mockProps2} query="select *" />)

      await act(async () => {
        userEvent.click(screen.getByText('cv.monitoringSources.commonHealthSource.runQuery'))
      })

      await waitFor(() => expect(screen.getAllByText('cv.monitoringSources.gcoLogs.records')).not.toBeNull())

      expect(container.querySelector('.jsonSelectorButton')).not.toBeDisabled()

      act(() => {
        userEvent.click(container.querySelector('.jsonSelectorButton')!)
      })

      expect(document.body.querySelector('.bp3-drawer-header')?.textContent).toBe(
        'cv.monitoringSources.commonHealthSource.logsTable.jsonSelectorDrawerTitlePrefix Identifier service path'
      )
    })
    test('should test whether the API is passed with correct payload', async () => {
      jest.spyOn(cvServices, 'useGetSampleRawRecord').mockReturnValue({
        mutate: jest.fn().mockImplementation(() => {
          return {
            status: 'SUCCESS',
            resource: {
              rawRecords: sampleRawRecordsMock
            }
          }
        }),
        loading: false,
        error: null,
        cancel: () => null
      })
      const mutateFn = jest.fn()
      jest
        .spyOn(cvServices, 'useGetSampleLogData')
        .mockReturnValue({ mutate: mutateFn, loading: false, error: null } as any)

      const mockProps2 = {
        ...mockedCustomMetricsFormForLogsTable2,
        setMappedMetrics: jest.fn(),
        setCreatedMetrics: jest.fn(),
        setGroupedCreatedMetrics: jest.fn(),
        setNonCustomFeilds: jest.fn()
      } as any

      render(
        <SetupSourceTabsContext.Provider
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          value={{ sourceData: { sourceType: 'SumoLogic', product: { value: 'LOGS' } } }}
        >
          <WrapperComponent {...mockProps2} query="select *" />
        </SetupSourceTabsContext.Provider>
      )

      await act(async () => {
        userEvent.click(screen.getByText('cv.monitoringSources.commonHealthSource.runQuery'))
      })

      await waitFor(() => expect(screen.getAllByText('cv.monitoringSources.gcoLogs.records')).not.toBeNull())

      const fetchSampleDataButton = screen.getByText(
        /cv.monitoringSources.commonHealthSource.logsTable.sampleLogButtonText/
      )

      act(() => {
        userEvent.click(fetchSampleDataButton)
      })

      expect(mutateFn).toHaveBeenCalledWith(logsTablePayloadMock)
    })

    test('should test whether the loading UI is shown when the call is in progress', async () => {
      const mutateFn = jest.fn()
      jest
        .spyOn(cvServices, 'useGetSampleLogData')
        .mockReturnValue({ mutate: mutateFn, loading: true, error: null } as any)

      const mockProps2 = {
        ...mockedCustomMetricsFormForLogsTable2,
        setMappedMetrics: jest.fn(),
        setCreatedMetrics: jest.fn(),
        setGroupedCreatedMetrics: jest.fn(),
        setNonCustomFeilds: jest.fn()
      } as any

      render(
        <SetupSourceTabsContext.Provider
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          value={{ sourceData: { sourceType: 'SumoLogic', product: { value: 'LOGS' } } }}
        >
          <WrapperComponent {...mockProps2} query="select *" />
        </SetupSourceTabsContext.Provider>
      )

      const processingUI = screen.getByText(/cv.processing/)

      expect(processingUI).toBeInTheDocument()
    })

    test('should test whether error UI is shown if the sample data call fails', async () => {
      const mutateFn = jest.fn()
      jest
        .spyOn(cvServices, 'useGetSampleLogData')
        .mockReturnValue({ mutate: mutateFn, loading: false, error: { message: 'Error in sample data call' } } as any)

      const mockProps2 = {
        ...mockedCustomMetricsFormForLogsTable2,
        setMappedMetrics: jest.fn(),
        setCreatedMetrics: jest.fn(),
        setGroupedCreatedMetrics: jest.fn(),
        setNonCustomFeilds: jest.fn()
      } as any

      render(
        <SetupSourceTabsContext.Provider
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          value={{ sourceData: { sourceType: 'SumoLogic', product: { value: 'LOGS' } } }}
        >
          <WrapperComponent {...mockProps2} query="select *" />
        </SetupSourceTabsContext.Provider>
      )

      const errorUI = screen.getByText(/Error in sample data call/)

      expect(errorUI).toBeInTheDocument()
    })

    test('should test whether logs table is shown if the sample data responds with correct data', async () => {
      jest.spyOn(cvServices, 'useGetSampleRawRecord').mockReturnValue({
        mutate: jest.fn().mockImplementation(() => {
          return {
            status: 'SUCCESS',
            resource: {
              rawRecords: sampleRawRecordsMock
            }
          }
        }),
        loading: false,
        error: null,
        cancel: () => null
      })
      const mutateFn = jest.fn().mockResolvedValue({ resource: { logRecords: sampleDataResponse } })

      jest
        .spyOn(cvServices, 'useGetSampleLogData')
        .mockReturnValue({ mutate: mutateFn, loading: false, error: null } as any)

      const mockProps2 = {
        ...mockedCustomMetricsFormForLogsTable2,
        setMappedMetrics: jest.fn(),
        setCreatedMetrics: jest.fn(),
        setGroupedCreatedMetrics: jest.fn(),
        setNonCustomFeilds: jest.fn()
      } as any

      const { container } = render(
        <SetupSourceTabsContext.Provider
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          value={{ sourceData: { sourceType: 'SumoLogic', product: { value: 'LOGS' } } }}
        >
          <WrapperComponent {...mockProps2} query="select *" />
        </SetupSourceTabsContext.Provider>
      )

      await act(async () => {
        userEvent.click(screen.getByText('cv.monitoringSources.commonHealthSource.runQuery'))
      })

      await waitFor(() => expect(screen.getAllByText('cv.monitoringSources.gcoLogs.records')).not.toBeNull())

      const fetchSampleDataButton = screen.getByText(
        /cv.monitoringSources.commonHealthSource.logsTable.sampleLogButtonText/
      )

      act(() => {
        userEvent.click(fetchSampleDataButton)
      })

      await waitFor(() => expect(container.querySelector('.TableV2--table')).toBeInTheDocument())

      expect(container.querySelectorAll('.TableV2--row')).toHaveLength(4)
    })

    test('should test whether empty state UI is shown is sample data API responds with empty array', async () => {
      jest.spyOn(cvServices, 'useGetSampleRawRecord').mockReturnValue({
        mutate: jest.fn().mockImplementation(() => {
          return {
            status: 'SUCCESS',
            resource: {
              rawRecords: sampleRawRecordsMock
            }
          }
        }),
        loading: false,
        error: null,
        cancel: () => null
      })
      const mutateFn = jest.fn().mockResolvedValue({ resource: { logRecords: [] } })

      jest
        .spyOn(cvServices, 'useGetSampleLogData')
        .mockReturnValue({ mutate: mutateFn, loading: false, error: null } as any)

      const mockProps2 = {
        ...mockedCustomMetricsFormForLogsTable2,
        setMappedMetrics: jest.fn(),
        setCreatedMetrics: jest.fn(),
        setGroupedCreatedMetrics: jest.fn(),
        setNonCustomFeilds: jest.fn()
      } as any

      render(
        <SetupSourceTabsContext.Provider
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          value={{ sourceData: { sourceType: 'SumoLogic', product: { value: 'LOGS' } } }}
        >
          <WrapperComponent {...mockProps2} query="select *" />
        </SetupSourceTabsContext.Provider>
      )

      await act(async () => {
        userEvent.click(screen.getByText('cv.monitoringSources.commonHealthSource.runQuery'))
      })

      await waitFor(() => expect(screen.getAllByText('cv.monitoringSources.gcoLogs.records')).not.toBeNull())

      const fetchSampleDataButton = screen.getByText(
        /cv.monitoringSources.commonHealthSource.logsTable.sampleLogButtonText/
      )

      act(() => {
        userEvent.click(fetchSampleDataButton)
      })

      await waitFor(() =>
        expect(
          screen.getByText(/cv.monitoringSources.commonHealthSource.logsTable.noSampleAvailable/)
        ).toBeInTheDocument()
      )

      const retryButton = screen.getByText(/retry/)

      act(() => {
        userEvent.click(retryButton)
      })

      expect(mutateFn).toHaveBeenCalledTimes(2)
    })
  })
})
