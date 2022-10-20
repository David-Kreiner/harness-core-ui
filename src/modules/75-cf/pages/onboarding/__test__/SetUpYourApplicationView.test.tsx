/* eslint-disable jest/no-commented-out-tests */
/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen } from '@testing-library/react'
import userEvent, { TargetElement } from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { SupportPlatforms } from '@cf/components/LanguageSelection/LanguageSelection'
import mockEnvironments from '@cf/pages/environments/__tests__/mockEnvironments'
import mockImport from 'framework/utils/mockImport'
import { SetUpYourApplicationView, SetUpYourApplicationViewProps } from '../views/SetUpYourApplicationView'

const setApiKey = jest.fn()
const setEnvironmentIdentifier = jest.fn()

const renderComponent = (props?: Partial<SetUpYourApplicationViewProps>): RenderResult => {
  return render(
    <TestWrapper
      path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
    >
      <SetUpYourApplicationView
        flagInfo={{
          project: 'dummy',
          createdAt: 1662647079713,
          name: 'hello world',
          identifier: 'hello_world',
          kind: 'boolean',
          archived: false,
          variations: [
            { identifier: 'true', name: 'True', value: 'true' },
            { identifier: 'false', name: 'False', value: 'false' }
          ],
          defaultOnVariation: 'true',
          defaultOffVariation: 'false',
          permanent: false
        }}
        language={undefined}
        setLanguage={jest.fn()}
        apiKey={{
          name: 'xxx-xxx-xxx',
          apiKey: 'xxx-xxx-xxx',
          identifier: 'xxx-xxx-xxx',
          type: 'server'
        }}
        setApiKey={setApiKey}
        setEnvironmentIdentifier={setEnvironmentIdentifier}
        {...props}
      />
    </TestWrapper>
  )
}

describe('SetUpYourApplicationView', () => {
  beforeEach(() => {
    jest.mock('@common/hooks/useTelemetry', () => ({
      useTelemetry: () => ({ identifyUser: jest.fn(), trackEvent: jest.fn() })
    }))
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })
    jest.mock('@cf/hooks/useEnvironmentSelectV2', () => ({
      useEnvironmentSelectV2: jest.fn().mockReturnValue({
        environments: mockEnvironments,
        loading: false,
        error: undefined,
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        },
        selectedEnvironmentIdentifier: 'foobar'
      })
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('It should render correctly when language is undefined', () => {
    renderComponent()

    expect(screen.getByTestId('ffOnboardingSelectedFlag')).toBeVisible()
    expect(screen.getByTestId('ffOnboardingSelectedFlag').textContent).toMatch(
      /cf\.onboarding\.youreUsinghello world.+hello_world.+/g
    )
    expect(screen.getByText('cf.onboarding.setupLabel')).toBeVisible()
    expect(screen.getByText('cf.onboarding.selectLanguage')).toBeVisible()
    expect(screen.getAllByTestId('selectLanguageBtn')).toHaveLength(13)

    // should not show until environment selected
    expect(screen.queryByText('cf.onboarding.selectYourEnvironment')).not.toBeInTheDocument()
  })

  test('It should render correctly when a language has been selected', () => {
    renderComponent({ language: SupportPlatforms[1] })

    expect(screen.getByTestId('ffOnboardingSelectedFlag')).toBeVisible()
    expect(screen.getByTestId('ffOnboardingSelectedFlag').textContent).toMatch(
      /cf\.onboarding\.youreUsinghello world.+hello_world.+/g
    )
    expect(screen.getByText('cf.onboarding.setupLabel')).toBeVisible()
    expect(screen.getByText('cf.onboarding.selectLanguage')).toBeVisible()
    expect(screen.getAllByTestId('selectLanguageBtn')).toHaveLength(13)

    expect(screen.getByText('cf.onboarding.selectYourEnvironment')).toBeVisible()
    expect(document.querySelector('input[name="environmentSelectEl"]')).toBeVisible()
    expect(document.querySelector('input[name="environmentSelectEl"]')).toHaveValue('foobar')
  })

  test('It should allow user select a language, then show dropdown to select an environment', () => {
    renderComponent()

    expect(screen.queryByText('cf.onboarding.selectYourEnvironment')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'JavaScript' })).toBeVisible()

    userEvent.click(screen.getByRole('button', { name: 'JavaScript' }))

    expect(screen.getByText('cf.onboarding.selectYourEnvironment')).toBeVisible()
    expect(setApiKey).toBeCalled()
    expect(document.querySelector('input[name="environmentSelectEl"]')).toBeVisible()
    expect(document.querySelector('input[name="environmentSelectEl"]')).toHaveValue('foobar')
  })

  test('It should select an environment', () => {
    renderComponent()

    expect(screen.queryByText('cf.onboarding.selectYourEnvironment')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'JavaScript' })).toBeVisible()

    userEvent.click(screen.getByRole('button', { name: 'JavaScript' }))

    expect(screen.getByText('cf.onboarding.selectYourEnvironment')).toBeVisible()
    expect(setApiKey).toBeCalled()
    expect(setEnvironmentIdentifier).toBeCalledWith('foobar')

    const envInput = document.querySelector('input[name="environmentSelectEl"]') as TargetElement
    expect(envInput).toBeVisible()
    expect(envInput).toHaveValue('foobar')

    userEvent.click(envInput)

    const dropdownOptions = document.querySelectorAll('li[class*="Select--menuItem"]')
    expect(dropdownOptions).toHaveLength(16)

    userEvent.click(dropdownOptions[1])
    expect(setEnvironmentIdentifier).toBeCalledWith('QB')
    expect(document.querySelector('input[name="environmentSelectEl"]')).toHaveValue('QB')
  })
})
