/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import { FreezeWindowContext } from '@freeze-windows/components/FreezeWindowStudio/FreezeWindowContext/FreezeWindowContext'
import { FreezeStudioOverviewSection } from '../FreezeStudioOverviewSection'
import { defaultContext } from './helper'

export const accountId = 'accountId'
export const projectIdentifier = 'project1'
export const orgIdentifier = 'default'

describe('Freeze Window Studio OverView Section', () => {
  test('it should render Overview section in create mode', async () => {
    const updateFreeze = jest.fn()
    const onNext = jest.fn()
    const { getByText, container } = render(
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
          <FreezeStudioOverviewSection isReadOnly={false} onNext={onNext} />
        </FreezeWindowContext.Provider>
      </TestWrapper>
    )

    expect(getByText('freezeWindows.freezeStudio.freezeOverview')).toBeInTheDocument()
    await userEvent.click(getByText('continue'))
    await waitFor(() => {
      expect(getByText('common.validation.nameIsRequired')).toBeInTheDocument()
    })
    expect(onNext).not.toBeCalled()
    expect(container).toMatchSnapshot('Overview Section Snapshot')
    await fillAtForm([{ container, fieldId: 'name', type: InputTypes.TEXTFIELD, value: 'Weekend Freeze' }])
    expect(updateFreeze).toHaveBeenCalledWith({ name: 'Weekend Freeze', identifier: 'Weekend_Freeze' })
    await userEvent.click(getByText('continue'))
  })
})
