/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { FreezeWindowStudioHeader } from '../FreezeWindowStudioHeader'

export const accountId = 'accountId'
export const projectIdentifier = 'project1'
export const orgIdentifier = 'default'

describe('Freeze Window Studio Header', () => {
  test('should render Studio Header for Project View', () => {
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/:module/orgs/:orgIdentifier/projects/:projectIdentifier/setup/freeze-window-studio/window/:windowIdentifier/"
        pathParams={{ projectIdentifier, orgIdentifier, accountId, module: 'cd', windowIdentifier: '-1' }}
      >
        <FreezeWindowStudioHeader />
      </TestWrapper>
    )
    expect(getByText('project1')).toBeDefined()
    expect(getByText('common.freezeWindows')).toBeDefined()
    expect(container.getElementsByTagName('a')).toMatchSnapshot('Project View - Studio Header')
  })
  test('should render Studio Header for Org View', () => {
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/settings/organizations/:orgIdentifier/setup/freeze-window-studio/window/:windowIdentifier/"
        pathParams={{ orgIdentifier, accountId, windowIdentifier: '-1' }}
      >
        <FreezeWindowStudioHeader />
      </TestWrapper>
    )
    expect(getByText('common.accountSettings')).toBeDefined()
    expect(getByText('default')).toBeDefined()
    expect(getByText('common.freezeWindows')).toBeDefined()
    expect(container.getElementsByTagName('a')).toMatchSnapshot('Org View - Studio Header')
  })
  test('should render Studio Header for Account View', () => {
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/settings/freeze-window-studio/window/:windowIdentifier/"
        pathParams={{ accountId, windowIdentifier: '-1' }}
      >
        <FreezeWindowStudioHeader />
      </TestWrapper>
    )
    expect(getByText('common.accountSettings')).toBeDefined()
    expect(getByText('common.freezeWindows')).toBeDefined()
    expect(container.getElementsByTagName('a')).toMatchSnapshot('Account View - Studio Header')
  })
})
