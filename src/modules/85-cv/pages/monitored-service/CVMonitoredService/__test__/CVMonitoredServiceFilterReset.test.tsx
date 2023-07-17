/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { render, waitFor, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import routes from '@common/RouteDefinitions'
import { TestWrapper, TestWrapperProps } from '@common/utils/testUtils'
import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import * as useLicenseStore from 'framework/LicenseStore/LicenseStoreContext'
import * as cvServices from 'services/cv'
import { useGetMonitoredServicesLiveProcessCount } from 'services/cet/cetComponents'
import CVMonitoredService from '../CVMonitoredService'

import {
  serviceCountData,
  MSListData,
  riskMSListData,
  graphData,
  licenseWithSRMActive
} from './CVMonitoredService.mock'

export const testWrapperProps: TestWrapperProps = {
  path: routes.toCVMonitoringServices({ ...accountPathProps, ...projectPathProps }),
  pathParams: {
    accountId: '1234_accountId',
    projectIdentifier: '1234_project',
    orgIdentifier: '1234_org'
  }
}

jest.useFakeTimers({ advanceTimers: true })

const mockHistoryPush = jest.fn()
// eslint-disable-next-line jest-no-mock
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => {
    const [projectIdentifier, setProjectIdentifier] = useState<string>('project1')

    useEffect(() => {
      setTimeout(() => {
        setProjectIdentifier('project2')
      }, 2000)
    }, [])

    return {
      orgIdentifier: 'orgIdentifier',
      projectIdentifier,
      accountId: 'accountId',
      identifier: 'identifier',
      module: 'cv'
    }
  },
  useHistory: jest.fn(() => ({
    push: mockHistoryPush
  }))
}))

jest.mock('services/cet/cetComponents')
const useGetMonitoredServicesLiveProcessCountMock = useGetMonitoredServicesLiveProcessCount as jest.MockedFunction<any>
useGetMonitoredServicesLiveProcessCountMock.mockImplementation(() => {
  return {
    data: {
      data: [],
      status: 'SUCCESS'
    }
  }
})

const refetchServiceCountData = jest.fn()
const refetchListMonitoredService = jest.fn()

beforeEach(() => jest.clearAllMocks())

jest.spyOn(cvServices, 'useDeleteMonitoredService').mockImplementation(() => ({ mutate: jest.fn() } as any))
jest.spyOn(cvServices, 'useGetMonitoredServiceListEnvironments').mockImplementation(
  () =>
    ({
      data: {
        data: [
          { environment: { accountId: 'kmpySmUISimoRrJL6NL73w', name: 'new_env_test', identifier: 'new_env_test' } }
        ]
      }
    } as any)
)
jest
  .spyOn(cvServices, 'useListMonitoredService')
  .mockImplementation(() => ({ data: MSListData, refetch: refetchListMonitoredService } as any))
jest.spyOn(cvServices, 'useGetServiceDependencyGraph').mockImplementation(() => ({ data: graphData } as any))
jest
  .spyOn(cvServices, 'useGetCountOfServices')
  .mockImplementation(() => ({ data: serviceCountData, refetch: refetchServiceCountData } as any))

describe('Monitored Service list', () => {
  const useLicenseStoreMock = jest.spyOn(useLicenseStore, 'useLicenseStore')

  beforeAll(() => {
    jest.runAllTimers()
    useLicenseStoreMock.mockReturnValue(licenseWithSRMActive as unknown as useLicenseStore.LicenseStoreContextProps)
  })

  test('Reset filters when user changes the project', async () => {
    const refetchListMonitoredService2 = jest.fn()
    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    jest
      .spyOn(cvServices, 'useListMonitoredService')
      .mockImplementation(() => ({ data: riskMSListData, refetch: refetchListMonitoredService2 } as any))

    await userEvent.click(container.querySelector('[data-icon="offline-outline"]')!)

    const searchContainer = container.querySelector('[data-name="monitoredServiceSeachContainer"]')
    const searchIcon = searchContainer?.querySelector('span[data-icon="thinner-search"]')
    const searchInput = searchContainer?.querySelector(
      'input[placeholder="cv.monitoredServices.searchMonitoredServices"]'
    ) as HTMLInputElement

    await act(async () => {
      await userEvent.click(searchIcon!)
    })

    refetchListMonitoredService2.mockClear()

    await act(async () => {
      await userEvent.type(searchInput!, 'demo')
    })

    const environmentFilter = container.querySelector('[data-icon="chevron-down"]')

    await act(async () => {
      await userEvent.click(environmentFilter!)
    })

    await waitFor(() => {
      expect(screen.getByText(/new_env_test/)).toBeInTheDocument()
    })

    await act(async () => {
      await userEvent.click(screen.getByText(/new_env_test/))
    })

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(refetchListMonitoredService2).toHaveBeenCalledWith({
        queryParams: {
          accountId: 'accountId',
          environmentIdentifier: 'account.new_env_test',
          filter: '',
          offset: 0,
          orgIdentifier: 'orgIdentifier',
          pageSize: 10,
          projectIdentifier: 'project1',
          servicesAtRiskFilter: true
        }
      })
    })

    refetchListMonitoredService2.mockClear()

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    await waitFor(() => {
      expect(refetchListMonitoredService2).toHaveBeenCalledWith({
        queryParams: {
          accountId: 'accountId',
          environmentIdentifier: 'account.new_env_test',
          filter: '',
          offset: 0,
          orgIdentifier: 'orgIdentifier',
          pageSize: 10,
          projectIdentifier: 'project2',
          servicesAtRiskFilter: false
        }
      })
    })
  })
})
