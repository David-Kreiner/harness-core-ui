/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper, TestWrapperProps } from '@common/utils/testUtils'
import * as hooks from '@common/hooks/useFeatureFlag'
import routes from '@common/RouteDefinitions'
import { accountPathProps, orgPathProps, projectPathProps } from '@common/utils/routeUtils'
import { CETAgentConfig } from '../CETAgentConfig'

// Mock the ChildAppMounter component
jest.mock('microfrontends/ChildAppMounter', () => () => {
  return <div data-testid="error-tracking-child-mounter">mounted</div>
})

describe('CETAgentConfig', () => {
  // Mock the useFeatureFlags hook to return a specific value
  jest.spyOn(hooks, 'useFeatureFlags').mockReturnValue({
    CET_PLATFORM_MONITORED_SERVICE: true // Set to true for this test
  })

  const testWrapperProps: TestWrapperProps = {
    path: routes.toErrorTracking({ ...accountPathProps, ...orgPathProps, ...projectPathProps }),
    pathParams: {
      accountId: 'test_accountId',
      projectIdentifier: 'test_project',
      orgIdentifier: 'test_org'
    }
  }

  test('Verify if Error Tracking View is rendered when required params are defined', async () => {
    const props = {
      serviceRef: 'serviceRef',
      environmentRef: 'environmentRef'
    }

    const { getByTestId } = render(
      <TestWrapper {...testWrapperProps}>
        <CETAgentConfig {...props} />
      </TestWrapper>
    )

    const childAppMounter = getByTestId('error-tracking-child-mounter')
    expect(childAppMounter).toBeTruthy()
  })

  test('Verify if nothing is rendered when CET_PLATFORM_MONITORED_SERVICE is false', async () => {
    jest.spyOn(hooks, 'useFeatureFlags').mockReturnValue({
      CET_PLATFORM_MONITORED_SERVICE: false
    })

    const { container } = render(
      <TestWrapper {...testWrapperProps}>
        <CETAgentConfig />
      </TestWrapper>
    )

    expect(container.firstChild).toBeNull()
  })

  test('Snapshot test for CETAgentConfig component', () => {
    jest.spyOn(hooks, 'useFeatureFlags').mockReturnValue({
      CET_PLATFORM_MONITORED_SERVICE: false
    })

    const { asFragment } = render(
      <TestWrapper {...testWrapperProps}>
        <CETAgentConfig />
      </TestWrapper>
    )

    // Take a snapshot of the rendered component
    expect(asFragment()).toMatchSnapshot()
  })
})
