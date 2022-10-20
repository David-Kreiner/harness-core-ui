/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { FreezeWindowContext } from '@freeze-windows/components/FreezeWindowStudio/FreezeWindowContext/FreezeWindowContext'
import { FreezeWindowStudioSubHeader } from '../FreezeWindowStudioSubHeader'
import { defaultContext } from './helper'

export const accountId = 'accountId'
export const projectIdentifier = 'project1'
export const orgIdentifier = 'default'

describe('Freeze Window Studio Sub Header', () => {
  test('it should render CreateNewFreezeWindow, when windowIdentifier is "-1"', () => {
    const onViewChange = jest.fn()
    const updateFreeze = jest.fn()
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/:module/orgs/:orgIdentifier/projects/:projectIdentifier/setup/freeze-window-studio/window/:windowIdentifier/"
        pathParams={{ projectIdentifier, orgIdentifier, accountId, module: 'cd', windowIdentifier: '-1' }}
      >
        <FreezeWindowContext.Provider
          value={{
            ...defaultContext,
            updateFreeze
          }}
        >
          <FreezeWindowStudioSubHeader onViewChange={onViewChange} />
        </FreezeWindowContext.Provider>
      </TestWrapper>
    )
    // check toggle, visual/yaml and right view is rendered in the sub header
    expect(document.getElementsByClassName('bp3-switch')[0]).toBeInTheDocument()
    expect(document.getElementsByClassName('visualYamlToggle')[0]).toBeInTheDocument()
    expect(document.getElementsByClassName('headerSaveBtnWrapper')[0]).toBeInTheDocument()

    const portal = document.getElementsByClassName('bp3-dialog')[0]
    expect(portal).toMatchSnapshot('CreateNewFreezeWindow Modal Dialog')
    expect(container).toMatchSnapshot('Freeze Window Sub Header')
  })
})
