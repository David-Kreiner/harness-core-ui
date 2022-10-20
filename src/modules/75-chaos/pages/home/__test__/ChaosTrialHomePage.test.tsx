import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { useStartTrialLicense, useStartFreeLicense } from 'services/cd-ng'
import ChaosTrialHomePage from '../ChaosTrialHomePage'

jest.mock('services/cd-ng')
const useStartTrialMock = useStartTrialLicense as jest.MockedFunction<any>
const useStartFreeLicenseMock = useStartFreeLicense as jest.MockedFunction<any>

describe('ChaosTrialHomePage snapshot test', () => {
  beforeEach(() => {
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
    }),
      useStartFreeLicenseMock.mockImplementation(() => {
        return {
          cancel: jest.fn(),
          loading: false,
          mutate: jest.fn().mockImplementationOnce(() => {
            return {
              status: 'SUCCESS',
              data: {
                licenseType: 'FREE'
              }
            }
          })
        }
      })
  })

  test('it should render properly', async () => {
    const { getByText } = render(
      <TestWrapper>
        <ChaosTrialHomePage />
      </TestWrapper>
    )
    fireEvent.click(getByText('chaos.chaosTrialHomePage.description'))
    await waitFor(() => expect('chaos.homepage.slogan'))
  })
})
