/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import { GetInputSetsResponse } from '@pipeline/pages/inputSet-list/__tests__/InputSetListMocks'
import { RunPipelineModalParams, useRunPipelineModal } from '../useRunPipelineModal'
import { getMockFor_Generic_useMutate, getMockFor_useGetTemplateFromPipeline } from './mocks'

const props: RunPipelineModalParams & GitQueryParams = {
  pipelineIdentifier: 'pipelineIdentifier',
  branch: 'propsBranch',
  repoIdentifier: 'propsRepo'
}

window.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null
}))

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@common/utils/YamlUtils', () => ({}))
jest.mock('services/cd-ng', () => ({
  useShouldDisableDeployment: jest.fn().mockReturnValue({
    loading: false,
    data: {}
  }),
  useGetYamlSchema: jest.fn(() => ({ data: null })),
  useGetSourceCodeManagers: () => ({
    data: []
  }),
  useCreatePR: () => ({ data: [], mutate: jest.fn() }),
  useCreatePRV2: () => ({
    data: [],
    mutate: jest.fn()
  }),
  useGetFileContent: () => ({
    data: [],
    mutate: jest.fn(),
    refetch: jest.fn()
  }),
  useGetFileByBranch: jest.fn().mockImplementation(() => ({ refetch: jest.fn() })),
  useListGitSync: () => ({
    data: [],
    mutate: jest.fn(),
    refetch: jest.fn()
  })
}))
jest.mock('services/pipeline-ng', () => ({
  useGetInputsetYaml: jest.fn(() => ({ data: null })),
  useGetTemplateFromPipeline: jest.fn(() => getMockFor_useGetTemplateFromPipeline()),
  useGetStagesExecutionList: jest.fn(() => ({})),
  useGetPipeline: jest.fn(() => ({ data: null })),
  usePostPipelineExecuteWithInputSetYaml: jest.fn(() => getMockFor_Generic_useMutate()),
  useRePostPipelineExecuteWithInputSetYaml: jest.fn(() => getMockFor_Generic_useMutate()),
  useRerunStagesWithRuntimeInputYaml: jest.fn(() => getMockFor_Generic_useMutate()),
  useGetMergeInputSetFromPipelineTemplateWithListInput: jest.fn(() => getMockFor_Generic_useMutate()),
  useGetInputSetsListForPipeline: jest.fn(() => ({ data: null, refetch: jest.fn() })),
  useCreateVariablesV2: jest.fn(() => ({})),
  useCreateInputSetForPipeline: jest.fn(() => getMockFor_Generic_useMutate()),
  useGetInputsetYamlV2: jest.fn(() => ({ data: null })),
  useRunStagesWithRuntimeInputYaml: jest.fn(() => getMockFor_Generic_useMutate()),
  getInputSetForPipelinePromise: jest.fn().mockImplementation(() => Promise.resolve(GetInputSetsResponse.data)),
  useValidateTemplateInputs: jest.fn(() => getMockFor_Generic_useMutate())
}))

function Wrapped(): React.ReactElement {
  const { openRunPipelineModal } = useRunPipelineModal({ ...props })
  return (
    <>
      <button className="check" onClick={() => openRunPipelineModal()} />
    </>
  )
}

function WrappedWithInputSets(): React.ReactElement {
  const { openRunPipelineModal } = useRunPipelineModal({
    ...props,
    inputSetSelected: [
      {
        type: 'INPUT_SET',
        label: 'is1',
        value: 'is1',
        gitDetails: {
          branch: 'br',
          repoIdentifier: 'repo'
        }
      }
    ]
  })
  return (
    <>
      <button className="check" onClick={() => openRunPipelineModal()} />
    </>
  )
}

function WrappedWithInputSetsWithoutGitDetails(): React.ReactElement {
  const { openRunPipelineModal } = useRunPipelineModal({
    ...props,
    inputSetSelected: [
      {
        type: 'INPUT_SET',
        label: 'is1',
        value: 'is1'
      }
    ]
  })
  return (
    <>
      <button className="check" onClick={() => openRunPipelineModal()} />
    </>
  )
}

describe('useRunPipelineModal tests', () => {
  test('without input sets', () => {
    const { container, getAllByText } = render(
      <TestWrapper>
        <Wrapped />
      </TestWrapper>
    )

    const mockedButton = container.querySelector('.check')
    fireEvent.click(mockedButton!)
    expect(getAllByText('runPipeline')).toBeDefined()
    const runPipelineHeader = container.querySelector('.runModalHeaderTitle')
    expect(runPipelineHeader).toBeDefined()
  })

  test('with selected input sets', async () => {
    const { container } = render(
      <TestWrapper>
        <WrappedWithInputSets />
      </TestWrapper>
    )
    const mockedButton = container.querySelector('.check')
    fireEvent.click(mockedButton!)

    let form = findDialogContainer()
    expect(form).toBeTruthy()
    await act(async () => {
      fireEvent.click(form?.querySelector('[icon="cross"]')!)
    })
    form = findDialogContainer()
    expect(form).toBeFalsy()
  })

  test('with selected input sets but without git details', async () => {
    const { container } = render(
      <TestWrapper>
        <WrappedWithInputSetsWithoutGitDetails />
      </TestWrapper>
    )

    const mockedButton = container.querySelector('.check')
    fireEvent.click(mockedButton!)
    const form = findDialogContainer()
    expect(form).toBeTruthy()
  })
})
