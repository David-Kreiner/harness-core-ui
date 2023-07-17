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
import * as useFeatures from '@common/hooks/useFeatures'
import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import * as useLicenseStore from 'framework/LicenseStore/LicenseStoreContext'
import * as cvServices from 'services/cv'
import { RiskValues, getRiskLabelStringId, getCVMonitoringServicesSearchParam } from '@cv/utils/CommonUtils'
import { MonitoredServiceEnum } from '@cv/pages/monitored-service/MonitoredServicePage.constants'
import { PROJECT_MONITORED_SERVICE_CONFIG } from '@cv/components/MonitoredServiceListWidget/MonitoredServiceListWidget.constants'
import { useGetMonitoredServicesLiveProcessCount } from 'services/cet/cetComponents'
import CVMonitoredService from '../CVMonitoredService'
import {
  serviceCountData,
  MSListData,
  updatedServiceCountData,
  updatedMSListData,
  riskMSListData,
  graphData,
  MSListDataMock,
  checkFeatureReturnMock,
  licenseWithSRMActive,
  licenseWithSRMExpired
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

beforeEach(() => jest.clearAllMocks())

jest.spyOn(cvServices, 'useDeleteMonitoredService').mockImplementation(() => ({ mutate: jest.fn() } as any))
jest
  .spyOn(cvServices, 'useGetMonitoredServiceListEnvironments')
  .mockImplementation(() => ({ data: ['new_env_test', 'AppDTestEnv1', 'AppDTestEnv2'] } as any))
jest
  .spyOn(cvServices, 'useListMonitoredService')
  .mockImplementation(() => ({ data: MSListData, refetch: jest.fn() } as any))
jest.spyOn(cvServices, 'useGetServiceDependencyGraph').mockImplementation(() => ({ data: graphData } as any))
jest
  .spyOn(cvServices, 'useGetCountOfServices')
  .mockImplementation(() => ({ data: serviceCountData, refetch: refetchServiceCountData } as any))

describe('Monitored Service list', () => {
  const useLicenseStoreMock = jest.spyOn(useLicenseStore, 'useLicenseStore')

  beforeAll(() => {
    useLicenseStoreMock.mockReturnValue(licenseWithSRMActive as unknown as useLicenseStore.LicenseStoreContextProps)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

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

    await userEvent.click(container.querySelector('.context-menu-mock-edit')!)

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
    expect(document.title).toBe('cv.srmTitle | cv.monitoredServices.title | 1234_project | harness')

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

    await userEvent.click(container.querySelector('.context-menu-mock-delete')!)

    expect(container.querySelectorAll('.TableV2--body [role="row"]')).toHaveLength(2)
    await waitFor(() => expect(refetchServiceCountData).toBeCalledTimes(3))
  })

  test('Test Dependency Graph renders', async () => {
    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    await userEvent.click(container.querySelector('[data-icon="graph"]')!)

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
    jest.spyOn(useFeatures, 'useFeature').mockImplementation(() => ({ ...checkFeatureReturnMock } as any))
    jest.spyOn(useFeatures, 'useFeatures').mockImplementation(() => ({ features: new Map() } as any))

    const mutate = jest.fn()

    jest.spyOn(cvServices, 'useSetHealthMonitoringFlag').mockImplementation(() => ({ mutate } as any))

    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    await userEvent.click(container.querySelector('.toggleFlagButton:first-child [data-name="on-btn"]')!)

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
    await waitFor(() => expect(refetchServiceCountData).toBeCalledTimes(3))
  })

  test('Loading state', async () => {
    const mutate = jest.fn()

    jest.spyOn(cvServices, 'useSetHealthMonitoringFlag').mockImplementation(() => ({ loading: true } as any))

    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    await userEvent.click(container.querySelectorAll('[data-name="on-btn"]')[0])

    expect(mutate).not.toHaveBeenCalled()
  })

  test('Error state', async () => {
    jest.spyOn(useFeatures, 'useFeature').mockImplementation(() => ({ ...checkFeatureReturnMock } as any))
    jest.spyOn(useFeatures, 'useFeatures').mockImplementation(() => ({ features: new Map() } as any))

    const mutate = jest.fn().mockRejectedValue({ data: { message: 'Something went wrong' } })

    jest.spyOn(cvServices, 'useSetHealthMonitoringFlag').mockImplementation(() => ({ mutate } as any))

    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    await userEvent.click(container.querySelectorAll('[data-name="on-btn"]')[0])

    expect(mutate).toHaveBeenCalled()
    expect(refetchServiceCountData).toBeCalledTimes(2)
    await waitFor(() => expect(screen.queryByText('Something went wrong')).toBeInTheDocument())
  })

  test('empty MS list with MS template feature flag on', async () => {
    jest
      .spyOn(cvServices, 'useGetCountOfServices')
      .mockImplementationOnce(
        () => ({ data: { allServicesCount: 0, servicesAtRiskCount: 0 }, refetch: refetchServiceCountData } as any)
      )
    jest.spyOn(cvServices, 'useListMonitoredService').mockImplementationOnce(() => ({ refetch: jest.fn() } as any))
    const { getByText } = render(
      <TestWrapper {...testWrapperProps} defaultFeatureFlagValues={{ CVNG_TEMPLATE_MONITORED_SERVICE: true }}>
        <CVMonitoredService />
      </TestWrapper>
    )

    expect(getByText('cv.monitoredServices.youDontHaveAnyMonitoredServicesYet')).toBeInTheDocument()
    expect(getByText('connectors.cdng.monitoredService.monitoredServiceDef')).toBeInTheDocument()
    expect(getByText('common.useTemplate')).toBeInTheDocument()
  })

  test('empty MS list with applied filters', async () => {
    jest.spyOn(cvServices, 'useListMonitoredService').mockImplementationOnce(() => ({ refetch: jest.fn() } as any))
    const { getByText } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService />
      </TestWrapper>
    )

    expect(getByText('cv.monitoredServices.youHaveNoMonitoredServices')).toBeInTheDocument()
  })

  test('empty MS platform list', async () => {
    jest
      .spyOn(cvServices, 'useGetCountOfServices')
      .mockImplementationOnce(
        () => ({ data: { allServicesCount: 0, servicesAtRiskCount: 0 }, refetch: refetchServiceCountData } as any)
      )
    jest
      .spyOn(cvServices, 'useGetMonitoredServicePlatformList')
      .mockImplementationOnce(() => ({ refetch: jest.fn() } as any))
    const { getByText } = render(
      <TestWrapper {...testWrapperProps}>
        <CVMonitoredService config={PROJECT_MONITORED_SERVICE_CONFIG} />
      </TestWrapper>
    )

    expect(getByText('cv.monitoredServices.youDontHaveAnyMonitoredServicesYet')).toBeInTheDocument()
    expect(getByText('cv.commonMonitoredServices.definition')).toBeInTheDocument()
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

    jest
      .spyOn(cvServices, 'useListMonitoredService')
      .mockImplementation(() => ({ data: riskMSListData, refetch: jest.fn() } as any))

    await userEvent.click(container.querySelector('[data-icon="offline-outline"]')!)

    expect(refetchServiceCountData).toBeCalledTimes(3)
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

    jest.spyOn(cvServices, 'useListMonitoredService').mockImplementation(() => ({ refetch: jest.fn() } as any))
    await userEvent.click(container.querySelector('[data-icon="offline-outline"]')!)

    expect(refetchServiceCountData).toBeCalledTimes(3)
    expect(screen.queryByText(`cv.monitoredServices.showingServiceAtRisk`)).not.toBeInTheDocument()
    expect(screen.queryByText('connectors.cdng.monitoredService.monitoredServiceDef')).not.toBeInTheDocument()
    expect(screen.queryByText('cv.monitoredServices.youHaveNoMonitoredServices')).toBeInTheDocument()
  })

  test('should confirm that searching the expandable search input calls the api', async () => {
    jest
      .spyOn(cvServices, 'useListMonitoredService')
      .mockImplementation(() => ({ data: MSListData, refetch: jest.fn() } as any))

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
    expect(cvServices.useListMonitoredService).toBeCalledWith({
      lazy: true,
      queryParams: { ...expectedResponse.queryParams, environmentIdentifier: undefined }
    })
    await act(async () => {
      fireEvent.click(searchIcon!)
    })
    await act(async () => {
      fireEvent.change(searchInput!, { target: { value: query } })
    })
    await waitFor(() => expect(searchInput?.value).toBe(query))
    await waitFor(() => expect(cvServices.useListMonitoredService).toBeCalledTimes(2))
  })

  describe('SRM Enforcement framework tests', () => {
    // useFeatureFlags.mockReturnValue({ CVNG_ENABLED: true, CVNG_LICENSE_ENFORCEMENT: true })

    beforeEach(() => {
      useLicenseStoreMock.mockClear()
    })

    test('Should render the row switch as enabled, when SRM license is present and SRM_SERVICES feature is enabled, ', async () => {
      useLicenseStoreMock.mockReturnValue(licenseWithSRMActive as unknown as useLicenseStore.LicenseStoreContextProps)
      const checkFeatureReturnMock2 = {
        enabled: true
      }
      jest.spyOn(cvServices, 'useListMonitoredService').mockReturnValue({ data: MSListData, refetch: jest.fn() } as any)
      jest.spyOn(useFeatures, 'useFeature').mockReturnValue({ ...checkFeatureReturnMock2 } as any)

      render(
        <TestWrapper
          {...testWrapperProps}
          defaultFeatureFlagValues={{ CVNG_ENABLED: true, CVNG_LICENSE_ENFORCEMENT: true }}
        >
          <CVMonitoredService />
        </TestWrapper>
      )

      const toggleButton = document.querySelector('button.toggleFlagButton .optionBtn.notAllowed')

      expect(toggleButton).not.toBeInTheDocument()
    })

    test('Should render the row switch as enabled, when SRM active license is not present and CVNG_ENABLED feature flag is present', async () => {
      useLicenseStoreMock.mockReturnValue(licenseWithSRMExpired as unknown as useLicenseStore.LicenseStoreContextProps)

      const checkFeatureReturnMock2 = {
        enabled: true
      }
      jest.spyOn(cvServices, 'useListMonitoredService').mockReturnValue({ data: MSListData, refetch: jest.fn() } as any)
      jest.spyOn(useFeatures, 'useFeature').mockReturnValue({ ...checkFeatureReturnMock2 } as any)

      render(
        <TestWrapper
          {...testWrapperProps}
          defaultFeatureFlagValues={{ CVNG_ENABLED: true, CVNG_LICENSE_ENFORCEMENT: true }}
        >
          <CVMonitoredService />
        </TestWrapper>
      )

      const toggleButton = document.querySelector('button.toggleFlagButton .optionBtn.notAllowed')

      expect(toggleButton).not.toBeInTheDocument()
    })

    test('Should render the row switch as enabled, when SRM active license is present and CVNG_LICENSE_ENFORCEMENT feature flag is not present', async () => {
      useLicenseStoreMock.mockReturnValue(licenseWithSRMActive as unknown as useLicenseStore.LicenseStoreContextProps)

      const checkFeatureReturnMock2 = {
        enabled: true
      }
      jest.spyOn(cvServices, 'useListMonitoredService').mockReturnValue({ data: MSListData, refetch: jest.fn() } as any)
      jest.spyOn(useFeatures, 'useFeature').mockReturnValue({ ...checkFeatureReturnMock2 } as any)

      render(
        <TestWrapper
          {...testWrapperProps}
          defaultFeatureFlagValues={{ CVNG_ENABLED: true, CVNG_LICENSE_ENFORCEMENT: false }}
        >
          <CVMonitoredService />
        </TestWrapper>
      )

      const toggleButton = document.querySelector('button.toggleFlagButton .optionBtn.notAllowed')

      expect(toggleButton).not.toBeInTheDocument()
    })

    test('Should render the row switch as disabled, when SRM active license is not present and CVNG_ENABLED feature flag is not present', async () => {
      useLicenseStoreMock.mockReturnValue(licenseWithSRMExpired as unknown as useLicenseStore.LicenseStoreContextProps)
      const checkFeatureReturnMock2 = {
        enabled: true
      }
      jest.spyOn(cvServices, 'useListMonitoredService').mockReturnValue({ data: MSListData, refetch: jest.fn() } as any)
      jest.spyOn(useFeatures, 'useFeature').mockReturnValue({ ...checkFeatureReturnMock2 } as any)

      render(
        <TestWrapper
          {...testWrapperProps}
          defaultFeatureFlagValues={{ CVNG_ENABLED: false, CVNG_LICENSE_ENFORCEMENT: true }}
        >
          <CVMonitoredService />
        </TestWrapper>
      )

      const toggleButton = document.querySelector('button.toggleFlagButton .optionBtn.notAllowed')

      expect(toggleButton).toBeInTheDocument()
    })

    test('Should render the row switch as disabled, if SRM_SERVICES feature is disabled', async () => {
      useLicenseStoreMock.mockReturnValue(licenseWithSRMActive as unknown as useLicenseStore.LicenseStoreContextProps)

      const checkFeatureReturnMock2 = {
        enabled: false
      }
      jest
        .spyOn(cvServices, 'useListMonitoredService')
        .mockReturnValue({ data: MSListDataMock, refetch: jest.fn() } as any)
      jest.spyOn(useFeatures, 'useFeature').mockReturnValue({ ...checkFeatureReturnMock2 } as any)

      render(
        <TestWrapper
          {...testWrapperProps}
          defaultFeatureFlagValues={{ CVNG_ENABLED: true, CVNG_LICENSE_ENFORCEMENT: true }}
        >
          <CVMonitoredService />
        </TestWrapper>
      )

      const toggleButton = document.querySelector('button.toggleFlagButton .optionBtn.notAllowed')

      expect(toggleButton).toBeInTheDocument()
    })

    test('Should render the row switch as enabled, if its service is not already enabled somewhere and it did not reach the limit', async () => {
      useLicenseStoreMock.mockReturnValue(licenseWithSRMActive as unknown as useLicenseStore.LicenseStoreContextProps)

      const checkFeatureReturnMock2 = {
        enabled: true
      }
      jest
        .spyOn(cvServices, 'useListMonitoredService')
        .mockReturnValue({ data: MSListDataMock, refetch: jest.fn() } as any)
      jest.spyOn(useFeatures, 'useFeature').mockReturnValue({ ...checkFeatureReturnMock2 } as any)

      render(
        <TestWrapper
          {...testWrapperProps}
          defaultFeatureFlagValues={{ CVNG_ENABLED: true, CVNG_LICENSE_ENFORCEMENT: true }}
        >
          <CVMonitoredService />
        </TestWrapper>
      )

      const toggleButton = document.querySelector('button.toggleFlagButton .optionBtn.notAllowed')

      expect(toggleButton).not.toBeInTheDocument()
    })

    test('Should render the row switch as enabled, if its service is already enabled and it reached the limit', async () => {
      useLicenseStoreMock.mockReturnValue(licenseWithSRMActive as unknown as useLicenseStore.LicenseStoreContextProps)

      const checkFeatureReturnMock2 = {
        enabled: false
      }
      jest.spyOn(cvServices, 'useListMonitoredService').mockReturnValue({ data: MSListData, refetch: jest.fn() } as any)
      jest.spyOn(useFeatures, 'useFeature').mockReturnValue({ ...checkFeatureReturnMock2 } as any)

      render(
        <TestWrapper
          {...testWrapperProps}
          defaultFeatureFlagValues={{ CVNG_ENABLED: true, CVNG_LICENSE_ENFORCEMENT: true }}
        >
          <CVMonitoredService />
        </TestWrapper>
      )

      const toggleButton = document.querySelector('button.toggleFlagButton .optionBtn.notAllowed')

      expect(toggleButton).not.toBeInTheDocument()
    })

    test('Should render the row switch as disabled, if its service is not already enabled somewhere and it reached the limit', async () => {
      useLicenseStoreMock.mockReturnValue(licenseWithSRMActive as unknown as useLicenseStore.LicenseStoreContextProps)

      const checkFeatureReturnMock2 = {
        enabled: false
      }
      jest
        .spyOn(cvServices, 'useListMonitoredService')
        .mockReturnValue({ data: MSListDataMock, refetch: jest.fn() } as any)
      jest.spyOn(useFeatures, 'useFeature').mockReturnValue({ ...checkFeatureReturnMock2 } as any)

      render(
        <TestWrapper
          {...testWrapperProps}
          defaultFeatureFlagValues={{ CVNG_ENABLED: true, CVNG_LICENSE_ENFORCEMENT: true }}
        >
          <CVMonitoredService />
        </TestWrapper>
      )

      const toggleButton = document.querySelector('button.toggleFlagButton .optionBtn.notAllowed')

      expect(toggleButton).toBeInTheDocument()
    })
  })
})
