/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import {
  useGetLicensesAndSummary,
  useStartTrialLicense,
  useExtendTrialLicense,
  useGetProjectList,
  useSaveFeedback
} from 'services/cd-ng'
import useChaosTrialModal from '@chaos/modals/ChaosTrialModal/useChaosTrialModal'
import ChaosHomePage from '../ChaosHomePage'

jest.mock('services/cd-ng')
const useGetModuleLicenseInfoMock = useGetLicensesAndSummary as jest.MockedFunction<any>
const useStartTrialMock = useStartTrialLicense as jest.MockedFunction<any>
const useGetProjectListMock = useGetProjectList as jest.MockedFunction<any>
const useExtendTrialLicenseMock = useExtendTrialLicense as jest.MockedFunction<any>
useExtendTrialLicenseMock.mockImplementation(() => {
  return {
    mutate: jest.fn()
  }
})
const useSaveFeedbackMock = useSaveFeedback as jest.MockedFunction<any>
useSaveFeedbackMock.mockImplementation(() => {
  return {
    mutate: jest.fn()
  }
})

jest.mock('@chaos/modals/ChaosTrialModal/useChaosTrialModal')
const useChaosTrialModalMock = useChaosTrialModal as jest.MockedFunction<any>

const currentUser = {
  accounts: [
    {
      uuid: '123',
      createdFromNG: true
    }
  ],
  uuid: '123'
}

describe('ChaosHomePage snapshot test', () => {
  test('should display a loading spinner if the module license call is loading', () => {
    useChaosTrialModalMock.mockImplementation(() => ({ showModal: jest.fn(), hideModal: jest.fn() }))
    useGetProjectListMock.mockImplementation(() => {
      return {
        data: {
          content: []
        }
      }
    })
    useGetModuleLicenseInfoMock.mockImplementation(() => {
      return {
        data: {
          data: {},
          status: 'SUCCESS'
        },
        loading: true,
        refetch: jest.fn()
      }
    })
    const { container } = render(
      <TestWrapper
        path="/account/:accountId"
        pathParams={{ accountId: '123' }}
        defaultAppStoreValues={{ currentUserInfo: currentUser }}
      >
        <ChaosHomePage />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should move to the trial page when query param trial is true', async () => {
    useChaosTrialModalMock.mockImplementation(() => ({ showModal: jest.fn(), hideModal: jest.fn() }))
    useStartTrialMock.mockImplementation(() => {
      return {
        cancel: jest.fn(),
        loading: false,
        mutate: jest.fn().mockImplementationOnce(() => {
          return {
            status: 'SUCCESS',
            data: {
              licenseType: 'TRIAL'
            }
          }
        })
      }
    })

    useGetProjectListMock.mockImplementation(() => {
      return {
        data: {
          content: []
        }
      }
    })

    useGetModuleLicenseInfoMock.mockImplementation(() => {
      return {
        data: {
          data: {},
          status: 'SUCCESS'
        },
        error: null,
        refetch: jest.fn()
      }
    })
    const { container } = render(
      <TestWrapper
        path="/account/:accountId"
        pathParams={{ accountId: '123' }}
        defaultAppStoreValues={{ currentUserInfo: currentUser }}
        queryParams={{ trial: true }}
      >
        <ChaosHomePage />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('should display an error if the get licenses call fails', () => {
    useChaosTrialModalMock.mockImplementation(() => ({ showModal: jest.fn(), hideModal: jest.fn() }))
    useGetProjectListMock.mockImplementation(() => {
      return {
        data: {
          content: []
        }
      }
    })
    useGetModuleLicenseInfoMock.mockImplementation(() => {
      return {
        data: {
          data: {}
        },
        loading: true,
        refetch: jest.fn()
      }
    })
    const { container } = render(
      <TestWrapper
        path="/account/:accountId"
        pathParams={{ accountId: '123' }}
        defaultAppStoreValues={{ currentUserInfo: currentUser }}
      >
        <ChaosHomePage />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})
