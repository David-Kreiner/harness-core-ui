/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { render, waitFor, act, fireEvent } from '@testing-library/react'
import * as cdngServices from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import { accountPathProps, orgPathProps, projectPathProps } from '@common/utils/routeUtils'
import VariablesPage from '../VariablesPage'
import {
  VariableSuccessResponseWithContentUndefined,
  VariableSuccessResponseWithData,
  VariableSuccessResponseWithDataFor2Pages,
  VariableSuccessResponseWithDataUndefined,
  VariableSuccessResponseWithError,
  VariableSuccessResponseWithNoData
} from './mock/variableResponse'

jest.useFakeTimers()
jest.mock('@harness/uicore', () => {
  const fullModule = jest.requireActual('@harness/uicore')

  return {
    ...fullModule,
    ExpandingSearchInput: () => <div></div>
  }
})

describe('Variables Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('render page at account level', async () => {
    jest
      .spyOn(cdngServices, 'useGetVariablesList')
      .mockImplementation(() => ({ data: VariableSuccessResponseWithData, loading: false } as any))
    const { container, getByText, getAllByText } = render(
      <TestWrapper path={routes.toVariables({ ...accountPathProps })} pathParams={{ accountId: 'dummy' }}>
        <VariablesPage />
      </TestWrapper>
    )

    await waitFor(() => getAllByText('variables.newVariable'))
    await waitFor(() => getAllByText('CUSTOM_VARIABLE'))
    expect(getByText('account common.variables')).toBeDefined()
    expect(getByText('variables.newVariable')).toBeDefined()
    const neVarBtn = getByText('variables.newVariable')
    act(() => {
      fireEvent.click(neVarBtn!)
    })

    await waitFor(() => expect(getByText('common.addVariable')))
    expect(container).toMatchSnapshot()
  })

  test('render page at account level with no data - case 1', async () => {
    jest
      .spyOn(cdngServices, 'useGetVariablesList')
      .mockImplementation(() => ({ data: VariableSuccessResponseWithNoData, loading: false } as any))
    const { getByText } = render(
      <TestWrapper path={routes.toVariables({ ...accountPathProps })} pathParams={{ accountId: 'dummy' }}>
        <VariablesPage />
      </TestWrapper>
    )
    await waitFor(() => getByText('variables.newVariable'))
    expect(getByText('variables.noVariableExist')).toBeDefined()
    const neVarBtn = getByText('variables.newVariable')
    act(() => {
      fireEvent.click(neVarBtn)
    })

    await waitFor(() => expect(getByText('common.addVariable')))
  })

  test('render page at account level with no data- case 2', async () => {
    jest
      .spyOn(cdngServices, 'useGetVariablesList')
      .mockImplementation(() => ({ data: VariableSuccessResponseWithDataUndefined, loading: false } as any))
    const { getByText, getAllByText } = render(
      <TestWrapper path={routes.toVariables({ ...accountPathProps })} pathParams={{ accountId: 'dummy' }}>
        <VariablesPage />
      </TestWrapper>
    )
    await waitFor(() => getAllByText('variables.newVariable'))
    expect(getByText('variables.noVariableExist')).toBeDefined()
    const neVarBtn = getByText('variables.newVariable')
    act(() => {
      fireEvent.click(neVarBtn)
    })

    await waitFor(() => expect(getByText('common.addVariable')))
  })

  test('render page at account level with no data - case 3', async () => {
    jest
      .spyOn(cdngServices, 'useGetVariablesList')
      .mockImplementation(() => ({ data: VariableSuccessResponseWithContentUndefined, loading: false } as any))
    const { getByText, getAllByText } = render(
      <TestWrapper path={routes.toVariables({ ...accountPathProps })} pathParams={{ accountId: 'dummy' }}>
        <VariablesPage />
      </TestWrapper>
    )
    await waitFor(() => getAllByText('variables.newVariable'))
    expect(getByText('variables.noVariableExist')).toBeDefined()
    const neVarBtn = getByText('variables.newVariable')
    act(() => {
      fireEvent.click(neVarBtn)
    })

    await waitFor(() => expect(getByText('common.addVariable')))
  })

  test('render page at account level with no data - case 4', async () => {
    jest
      .spyOn(cdngServices, 'useGetVariablesList')
      .mockImplementation(() => ({ data: undefined, loading: false } as any))
    const { getByText, getAllByText } = render(
      <TestWrapper path={routes.toVariables({ ...accountPathProps })} pathParams={{ accountId: 'dummy' }}>
        <VariablesPage />
      </TestWrapper>
    )
    await waitFor(() => getAllByText('variables.newVariable'))
    expect(getByText('variables.noVariableExist')).toBeDefined()
    const neVarBtn = getByText('variables.newVariable')
    act(() => {
      fireEvent.click(neVarBtn)
    })

    await waitFor(() => expect(getByText('common.addVariable')))
  })

  test('render page at account level with error', async () => {
    const mockListRefect = jest.fn()
    jest
      .spyOn(cdngServices, 'useGetVariablesList')
      .mockImplementation(
        () => ({ error: VariableSuccessResponseWithError, loading: false, refetch: mockListRefect } as any)
      )
    const { getByText } = render(
      <TestWrapper path={routes.toVariables({ ...accountPathProps })} pathParams={{ accountId: 'dummy' }}>
        <VariablesPage />
      </TestWrapper>
    )
    await waitFor(() => getByText('Retry'))
    expect(getByText('Invalid request: Failed to connect')).toBeDefined()
    const retryBtn = getByText('Retry')
    expect(retryBtn).toBeDefined()
    act(() => {
      fireEvent.click(retryBtn)
    })
    await waitFor(() => expect(mockListRefect).toBeCalled())
  })

  test('render page at account level when loading state', async () => {
    const mockListRefect = jest.fn()
    jest
      .spyOn(cdngServices, 'useGetVariablesList')
      .mockImplementation(
        () => ({ error: VariableSuccessResponseWithError, loading: true, refetch: mockListRefect } as any)
      )
    const { getByText, getAllByText } = render(
      <TestWrapper path={routes.toVariables({ ...accountPathProps })} pathParams={{ accountId: 'dummy' }}>
        <VariablesPage />
      </TestWrapper>
    )
    await waitFor(() => getAllByText('Loading, please wait...'))
    expect(getByText('Loading, please wait...')).toBeDefined()
  })

  test('render page at org level', async () => {
    jest
      .spyOn(cdngServices, 'useGetVariablesList')
      .mockImplementation(() => ({ data: VariableSuccessResponseWithData, loading: false } as any))
    const { getByText } = render(
      <TestWrapper
        path={routes.toVariables({ ...orgPathProps })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummyOrg' }}
      >
        <VariablesPage />
      </TestWrapper>
    )
    await waitFor(() => getByText('variables.newVariable'))
    expect(getByText('variables.newVariable')).toBeDefined()
    expect(getByText('orgLabel common.variables')).toBeDefined()
    expect(getByText('dummyOrg')).toBeDefined()
  })
  test('render page at project level', async () => {
    jest
      .spyOn(cdngServices, 'useGetVariablesList')
      .mockImplementation(() => ({ data: VariableSuccessResponseWithData, loading: false } as any))
    const { getByText } = render(
      <TestWrapper
        path={routes.toVariables({ ...projectPathProps, module: 'cd' })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummyOrg', projectIdentifier: 'dummyProject' }}
      >
        <VariablesPage />
      </TestWrapper>
    )
    await waitFor(() => getByText('variables.newVariable'))

    expect(getByText('variables.newVariable')).toBeDefined()
    expect(getByText('projectLabel common.variables')).toBeDefined()
    expect(getByText('dummyProject')).toBeDefined()
  })

  test('render page at project level - click new variable button', async () => {
    jest
      .spyOn(cdngServices, 'useGetVariablesList')
      .mockImplementation(() => ({ data: VariableSuccessResponseWithData, loading: false } as any))
    const { getByText } = render(
      <TestWrapper
        path={routes.toVariables({ ...projectPathProps, module: 'cd' })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummyOrg', projectIdentifier: 'dummyProject' }}
      >
        <VariablesPage />
      </TestWrapper>
    )
    await waitFor(() => getByText('variables.newVariable'))
    expect(getByText('variables.newVariable')).toBeDefined()
    const newVarBtn = getByText('variables.newVariable')
    act(() => {
      fireEvent.click(newVarBtn)
    })

    await waitFor(() => expect(getByText('common.addVariable')))
    const dialog = findDialogContainer() as HTMLElement
    expect(dialog).toMatchSnapshot()
  })

  test('render component at account level - with 2 pages', async () => {
    jest
      .spyOn(cdngServices, 'useGetVariablesList')
      .mockImplementation(() => ({ data: VariableSuccessResponseWithDataFor2Pages, loading: false } as any))
    const { container, getByText } = render(
      <TestWrapper
        path={routes.toVariables({ ...projectPathProps, module: 'cd' })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummyOrg', projectIdentifier: 'dummyProject' }}
      >
        <VariablesPage />
      </TestWrapper>
    )

    await waitFor(() => getByText('CUSTOM_VARIABLE'))

    const nextBtn = container.querySelector('[class*="Button--withRightIcon"]')
    act(() => {
      fireEvent.click(nextBtn!)
    })
    await waitFor(() => getByText('CUSTOM_VARIABLE'))
    expect(getByText('CUSTOM_VARIABLE')).toBeDefined()
  })
})
