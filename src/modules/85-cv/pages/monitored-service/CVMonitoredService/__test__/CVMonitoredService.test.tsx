/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import routes from '@common/RouteDefinitions'
import { TestWrapper, TestWrapperProps } from '@common/utils/testUtils'
import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import * as cvServices from 'services/cv'
import { RiskValues, getRiskLabelStringId, getCVMonitoringServicesSearchParam } from '@cv/utils/CommonUtils'
import { MonitoredServiceEnum } from '@cv/pages/monitored-service/MonitoredServicePage.constants'
import CVMonitoredService from '../CVMonitoredService'
import {
  serviceCountData,
  MSListData,
  updatedServiceCountData,
  updatedMSListData,
  riskMSListData,
  graphData
} from './CVMonitoredService.mock'

export const testWrapperProps: TestWrapperProps = {
  path: routes.toCVMonitoringServices({ ...accountPathProps, ...projectPathProps }),
  pathParams: {
    accountId: '1234_accountId',
    projectIdentifier: '1234_project',
    orgIdentifier: '1234_org'
  }
}

const refetchServiceCountData = jest.fn()

jest.mock('@cv/components/ContextMenuActions/ContextMenuActions', () => (props: any) => {
  return (
    <>
      <div className="context-menu-mock-edit" onClick={props.onEdit} />
      <div className="context-menu-mock-delete" onClick={props.onDelete} />
    </>
  )
})

beforeEach(() => jest.clearAllMocks())

jest.spyOn(cvServices, 'useDeleteMonitoredService').mockImplementation(() => ({ mutate: jest.fn() } as any))
jest
  .spyOn(cvServices, 'useGetMonitoredServiceListEnvironments')
  .mockImplementation(() => ({ data: ['new_env_test', 'AppDTestEnv1', 'AppDTestEnv2'] } as any))
jest.spyOn(cvServices, 'useListMonitoredService').mockImplementation(() => ({ data: MSListData } as any))
jest.spyOn(cvServices, 'useGetServiceDependencyGraph').mockImplementation(() => ({ data: graphData } as any))
jest
  .spyOn(cvServices, 'useGetCountOfServices')
  .mockImplementation(() => ({ data: serviceCountData, refetch: refetchServiceCountData } as any))

describe('Monitored Service list', () => {
  test('Service listing component renders', async () => {
    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    expect(screen.queryByText('cv.monitoredServices.showingAllServices')).toBeInTheDocument()
    expect(container.querySelectorAll('.TableV2--body [role="row"]')).toHaveLength(serviceCountData.allServicesCount!)
  })

  test('edit flow works correctly', async () => {
    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    userEvent.click(container.querySelector('.context-menu-mock-edit')!)

    const path = screen.getByTestId('location')

    expect(path).toMatchInlineSnapshot(`
      <div
        data-testid="location"
      >
        /account/1234_accountId/cv/orgs/1234_org/projects/1234_project/monitoringservices/edit/delete_me_test${getCVMonitoringServicesSearchParam(
          { tab: MonitoredServiceEnum.Configurations }
        )}
      </div>
    `)
  })

  // TestCase for Checking Title + Chart + HealthScore + Tags render
  test('Test HealthSourceCard values, document title and tags for MS', async () => {
    const { getByText, container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    expect(getByText(getRiskLabelStringId(RiskValues.UNHEALTHY))).toBeDefined()
    expect(getByText(getRiskLabelStringId(RiskValues.NEED_ATTENTION))).toBeDefined()
    expect(getByText(getRiskLabelStringId(RiskValues.HEALTHY))).toBeDefined()
    expect(document.title).toBe('cv.srmTitle | cv.monitoredServices.title | harness')

    expect(container.querySelector('.tags')).toBeInTheDocument()
    expect(container.querySelector('.tags p')?.textContent).toBe('6')
  })

  test('Test Service and Environment names renders', async () => {
    const { getByText } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    expect(getByText('ServiceName 1')).toBeDefined()
    expect(getByText('new_env_test')).toBeDefined()
    expect(getByText('ServiceName 2')).toBeDefined()
    expect(getByText('AppDTestEnv1')).toBeDefined()
    expect(getByText('ServiceName 3')).toBeDefined()
    expect(getByText('AppDTestEnv2')).toBeDefined()
  })

  test('delete flow works correctly', async () => {
    jest
      .spyOn(cvServices, 'useListMonitoredService')
      .mockImplementation(() => ({ data: updatedMSListData, refetch: jest.fn() } as any))

    jest
      .spyOn(cvServices, 'useGetCountOfServices')
      .mockImplementation(() => ({ data: updatedServiceCountData, refetch: refetchServiceCountData } as any))

    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    userEvent.click(container.querySelector('.context-menu-mock-delete')!)

    expect(container.querySelectorAll('.TableV2--body [role="row"]')).toHaveLength(2)
    await waitFor(() => expect(refetchServiceCountData).toBeCalledTimes(2))
  })

  test('Test Dependency Graph renders', async () => {
    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    userEvent.click(container.querySelector('[data-icon="graph"]')!)

    expect(container.querySelector('.DependencyGraph')).toBeInTheDocument()
  })

  test('Test Dependency Graph loading state renders', async () => {
    jest.spyOn(cvServices, 'useGetServiceDependencyGraph').mockImplementation(() => ({ loading: true } as any))

    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    expect(container.querySelector('[class*="spinner"]')).not.toBeInTheDocument()
  })

  test('Enable service', async () => {
    const mutate = jest.fn()

    jest.spyOn(cvServices, 'useSetHealthMonitoringFlag').mockImplementation(() => ({ mutate } as any))

    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    userEvent.click(container.querySelector('[data-name="on-btn"]')!)

    expect(mutate).toHaveBeenCalledWith(undefined, {
      pathParams: {
        identifier: 'Monitoring_service_101'
      },
      queryParams: {
        enable: true,
        accountId: '1234_accountId',
        orgIdentifier: '1234_org',
        projectIdentifier: '1234_project'
      }
    })
    await waitFor(() => expect(refetchServiceCountData).toBeCalledTimes(2))
  })

  test('Loading state', async () => {
    const mutate = jest.fn()

    jest.spyOn(cvServices, 'useSetHealthMonitoringFlag').mockImplementation(() => ({ loading: true } as any))

    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    userEvent.click(container.querySelectorAll('[data-name="on-btn"]')[0])

    expect(mutate).not.toHaveBeenCalled()
  })

  test('Error state', async () => {
    const mutate = jest.fn().mockRejectedValue({ data: { message: 'Something went wrong' } })

    jest.spyOn(cvServices, 'useSetHealthMonitoringFlag').mockImplementation(() => ({ mutate } as any))

    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    userEvent.click(container.querySelectorAll('[data-name="on-btn"]')[0])

    expect(mutate).toHaveBeenCalled()
    expect(refetchServiceCountData).toBeCalledTimes(1)
    await waitFor(() => expect(screen.queryByText('Something went wrong')).toBeInTheDocument())
  })

  test('Risk filter with data', async () => {
    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    expect(container.querySelectorAll('.TableV2--body [role="row"]')).toHaveLength(
      updatedServiceCountData.allServicesCount!
    )

    jest.spyOn(cvServices, 'useListMonitoredService').mockImplementation(() => ({ data: riskMSListData } as any))

    userEvent.click(container.querySelector('[data-icon="offline-outline"]')!)

    expect(refetchServiceCountData).toBeCalledTimes(2)
    expect(screen.queryByText(`cv.monitoredServices.showingServiceAtRisk`)).toBeInTheDocument()
    expect(container.querySelectorAll('.TableV2--body [role="row"]')).toHaveLength(
      updatedServiceCountData.servicesAtRiskCount!
    )
  })

  test('Risk filter with no data', async () => {
    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    jest.spyOn(cvServices, 'useListMonitoredService').mockImplementation(() => ({} as any))
    userEvent.click(container.querySelector('[data-icon="offline-outline"]')!)

    expect(refetchServiceCountData).toBeCalledTimes(2)
    expect(screen.queryByText(`cv.monitoredServices.showingServiceAtRisk`)).not.toBeInTheDocument()
    expect(screen.queryByText('cv.monitoredServices.youHaveNoMonitoredServices')).not.toBeInTheDocument()
  })

  test('should confirm that searching the expandable search input calls the api', async () => {
    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    await waitFor(() => container.querySelector('[data-name="monitoredServiceSeachContainer"]'))
    const query = 'abcd'
    const searchContainer = container.querySelector('[data-name="monitoredServiceSeachContainer"]')
    const searchIcon = searchContainer?.querySelector('span[data-icon="thinner-search"]')
    const searchInput = searchContainer?.querySelector(
      'input[placeholder="cv.monitoredServices.searchMonitoredServices"]'
    ) as HTMLInputElement

    expect(searchIcon).toBeTruthy()
    expect(searchInput).toBeTruthy()
    expect(searchInput?.value).toBe('')
    const expectedResponse = {
      queryParams: {
        accountId: '1234_accountId',

        projectIdentifier: '1234_project',
        orgIdentifier: '1234_org',
        filter: '',
        offset: 0,
        pageSize: 10,
        servicesAtRiskFilter: false
      }
    }
    expect(cvServices.useListMonitoredService).toBeCalledWith({ queryParams: expectedResponse.queryParams })
    await act(async () => {
      fireEvent.click(searchIcon!)
    })
    await act(async () => {
      fireEvent.change(searchInput!, { target: { value: query } })
    })
    await waitFor(() => expect(searchInput?.value).toBe(query))
    await waitFor(() => expect(cvServices.useListMonitoredService).toBeCalledTimes(2))
  })
})
