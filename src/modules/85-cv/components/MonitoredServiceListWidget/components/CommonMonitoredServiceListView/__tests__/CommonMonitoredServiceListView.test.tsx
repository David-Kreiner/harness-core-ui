/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { FilterTypes } from '@cv/pages/monitored-service/CVMonitoredService/CVMonitoredService.types'
import routes from '@common/RouteDefinitions'
import { accountPathProps, orgPathProps, projectPathProps } from '@common/utils/routeUtils'
import type { TestWrapperProps } from '@common/utils/testUtils'
import {
  CD_MONITORED_SERVICE_CONFIG,
  PROJECT_MONITORED_SERVICE_CONFIG
} from '@cv/components/MonitoredServiceListWidget/MonitoredServiceListWidget.constants'
import mockImport from 'framework/utils/mockImport'
import CommonMonitoredServiceListView from '../CommonMonitoredServiceListView'
import { mockedMonitoredServiceListData } from './CommonMonitoredServiceListView.mock'

jest.mock('framework/strings', () => ({
  useStrings: () => ({
    getString: (key: string) => key
  })
}))

jest.mock('@cv/components/ContextMenuActions/ContextMenuActions', () => (props: any) => {
  return (
    <>
      <div className="context-menu-mock-edit" onClick={props.onEdit} />
      <div className="context-menu-mock-delete" onClick={props.onDelete} />
    </>
  )
})

mockImport('framework/LicenseStore/LicenseStoreContext', {
  useLicenseStore: jest.fn().mockImplementation(() => ({
    licenseInformation: {
      CV: {
        status: 'ACTIVE'
      }
    }
  }))
})

export const testWrapperProps: TestWrapperProps = {
  path: routes.toMonitoredServices({ ...accountPathProps, ...orgPathProps, ...projectPathProps }),
  pathParams: {
    accountId: '1234_accountId',
    projectIdentifier: '1234_project',
    orgIdentifier: '1234_org'
  }
}

describe('CommonMonitoredServiceListView', () => {
  const mockedSelectedFilter = FilterTypes.ALL

  const mockedOnEditService = jest.fn()
  const mockedOnDeleteService = jest.fn()
  const mockedSetPage = jest.fn()
  const createButton = <div />

  test('should render the list title correctly', () => {
    render(
      <MemoryRouter>
        <CommonMonitoredServiceListView
          monitoredServiceListData={mockedMonitoredServiceListData}
          selectedFilter={mockedSelectedFilter}
          onEditService={mockedOnEditService}
          onDeleteService={mockedOnDeleteService}
          setPage={mockedSetPage}
          config={PROJECT_MONITORED_SERVICE_CONFIG}
          appliedSearchAndFilter={false}
          createButton={createButton}
        />
      </MemoryRouter>
    )
    const listTitle = screen.getByText('cv.monitoredServices.showingAllServices')
    expect(listTitle).toBeInTheDocument()
  })

  test('should render the empty state when no monitored services are created', () => {
    const { getByText } = render(
      <MemoryRouter>
        <CommonMonitoredServiceListView
          monitoredServiceListData={{ content: [] }}
          selectedFilter={mockedSelectedFilter}
          onEditService={mockedOnEditService}
          onDeleteService={mockedOnDeleteService}
          setPage={mockedSetPage}
          config={PROJECT_MONITORED_SERVICE_CONFIG}
          appliedSearchAndFilter={false}
          createButton={createButton}
        />
      </MemoryRouter>
    )
    expect(getByText('cv.monitoredServices.youDontHaveAnyMonitoredServicesYet')).toBeInTheDocument()
    expect(getByText('cv.commonMonitoredServices.definition')).toBeInTheDocument()
  })

  test('should render the empty state when listing api returns empty response', () => {
    const { getByText } = render(
      <MemoryRouter>
        <CommonMonitoredServiceListView
          monitoredServiceListData={{}}
          selectedFilter={mockedSelectedFilter}
          onEditService={mockedOnEditService}
          onDeleteService={mockedOnDeleteService}
          setPage={mockedSetPage}
          config={PROJECT_MONITORED_SERVICE_CONFIG}
          appliedSearchAndFilter={false}
          createButton={createButton}
        />
      </MemoryRouter>
    )
    expect(getByText('Help Panel')).toBeInTheDocument()
  })

  test('should render the empty state when api with filters applied returns empty response', () => {
    const { getByText } = render(
      <MemoryRouter>
        <CommonMonitoredServiceListView
          monitoredServiceListData={{ content: [] }}
          selectedFilter={mockedSelectedFilter}
          onEditService={mockedOnEditService}
          onDeleteService={mockedOnDeleteService}
          setPage={mockedSetPage}
          config={PROJECT_MONITORED_SERVICE_CONFIG}
          appliedSearchAndFilter={true}
          createButton={createButton}
        />
      </MemoryRouter>
    )
    expect(getByText('cv.monitoredServices.youHaveNoMonitoredServices')).toBeInTheDocument()
  })

  test('should render the table columns correctly for Project level monitored service config', () => {
    const { queryByText } = render(
      <MemoryRouter>
        <CommonMonitoredServiceListView
          monitoredServiceListData={mockedMonitoredServiceListData}
          selectedFilter={mockedSelectedFilter}
          onEditService={mockedOnEditService}
          onDeleteService={mockedOnDeleteService}
          setPage={mockedSetPage}
          config={PROJECT_MONITORED_SERVICE_CONFIG}
          appliedSearchAndFilter={false}
          createButton={createButton}
        />
      </MemoryRouter>
    )
    expect(queryByText('CV.COMMONMONITOREDSERVICES.MONITOREDSERVICE')).toBeInTheDocument()
    expect(queryByText('CV.COMMONMONITOREDSERVICES.HEALTHSOURCE')).toBeInTheDocument()
    expect(queryByText('CV.COMMONMONITOREDSERVICES.CHANGESOURCE')).toBeInTheDocument()
    expect(queryByText('CV.COMMONMONITOREDSERVICES.GOTO')).toBeInTheDocument()
  })

  test('should render the table columns correctly for Project level monitored service config when SRM license is not present', () => {
    mockImport('framework/LicenseStore/LicenseStoreContext', {
      useLicenseStore: jest.fn().mockImplementation(() => ({
        licenseInformation: {}
      }))
    })

    const { queryByText } = render(
      <MemoryRouter>
        <CommonMonitoredServiceListView
          monitoredServiceListData={mockedMonitoredServiceListData}
          selectedFilter={mockedSelectedFilter}
          onEditService={mockedOnEditService}
          onDeleteService={mockedOnDeleteService}
          setPage={mockedSetPage}
          config={PROJECT_MONITORED_SERVICE_CONFIG}
          appliedSearchAndFilter={false}
          createButton={createButton}
        />
      </MemoryRouter>
    )
    expect(queryByText('CV.COMMONMONITOREDSERVICES.MONITOREDSERVICE')).toBeInTheDocument()
    expect(queryByText('CV.COMMONMONITOREDSERVICES.HEALTHSOURCE')).toBeInTheDocument()
    expect(queryByText('CV.COMMONMONITOREDSERVICES.CHANGESOURCE')).not.toBeInTheDocument()
    expect(queryByText('CV.COMMONMONITOREDSERVICES.GOTO')).not.toBeInTheDocument()
  })

  test('should render the table columns correctly for CD Monitored service config', () => {
    const { queryByText } = render(
      <MemoryRouter>
        <CommonMonitoredServiceListView
          monitoredServiceListData={mockedMonitoredServiceListData}
          selectedFilter={mockedSelectedFilter}
          onEditService={mockedOnEditService}
          onDeleteService={mockedOnDeleteService}
          setPage={mockedSetPage}
          config={CD_MONITORED_SERVICE_CONFIG}
          appliedSearchAndFilter={false}
          createButton={createButton}
        />
      </MemoryRouter>
    )
    expect(queryByText('CV.COMMONMONITOREDSERVICES.MONITOREDSERVICE')).toBeInTheDocument()
    expect(queryByText('CV.COMMONMONITOREDSERVICES.HEALTHSOURCE')).toBeInTheDocument()
    expect(queryByText('CV.COMMONMONITOREDSERVICES.CHANGESOURCE')).not.toBeInTheDocument()
    expect(queryByText('CV.COMMONMONITOREDSERVICES.GOTO')).not.toBeInTheDocument()
  })

  test('edit flow works correctly', async () => {
    const { container } = render(
      <MemoryRouter>
        <CommonMonitoredServiceListView
          monitoredServiceListData={mockedMonitoredServiceListData}
          selectedFilter={mockedSelectedFilter}
          onEditService={mockedOnEditService}
          onDeleteService={mockedOnDeleteService}
          setPage={mockedSetPage}
          config={CD_MONITORED_SERVICE_CONFIG}
          appliedSearchAndFilter={false}
          createButton={createButton}
        />
      </MemoryRouter>
    )

    // should be able to click on the edit icon.
    expect(container.querySelector('.context-menu-mock-edit')!).toBeInTheDocument()
    userEvent.click(container.querySelector('.context-menu-mock-edit')!)
  })

  test('delete flow works correctly', async () => {
    const { container } = render(
      <MemoryRouter>
        <CommonMonitoredServiceListView
          monitoredServiceListData={mockedMonitoredServiceListData}
          selectedFilter={mockedSelectedFilter}
          onEditService={mockedOnEditService}
          onDeleteService={mockedOnDeleteService}
          setPage={mockedSetPage}
          config={CD_MONITORED_SERVICE_CONFIG}
          appliedSearchAndFilter={false}
          createButton={createButton}
        />
      </MemoryRouter>
    )

    // should be able to click on the delete icon.
    expect(container.querySelector('.context-menu-mock-delete')!).toBeInTheDocument()
    userEvent.click(container.querySelector('.context-menu-mock-delete')!)
  })
})
