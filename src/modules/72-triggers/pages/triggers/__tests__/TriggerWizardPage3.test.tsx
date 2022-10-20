/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, queryByText, fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import type { UseMutateReturn } from 'restful-react'
import { useStrings } from 'framework/strings'
import * as pipelineNg from 'services/pipeline-ng'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'
import * as cdng from 'services/cd-ng'
import { TestWrapper } from '@common/utils/testUtils'
import { branchStatusMock, gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
// eslint-disable-next-line no-restricted-imports
import { KubernetesArtifacts } from '@cd/components/PipelineSteps/K8sServiceSpec/KubernetesArtifacts/KubernetesArtifacts'
// eslint-disable-next-line no-restricted-imports
import artifactSourceBaseFactory from '@cd/factory/ArtifactSourceFactory/ArtifactSourceBaseFactory'

import { connectorsData } from '@connectors/pages/connectors/__tests__/mockData'
import TriggerFactory from '@pipeline/factories/ArtifactTriggerInputFactory/index'
import { TriggerFormType } from '@pipeline/factories/ArtifactTriggerInputFactory/types'
import {
  PostCreateVariables,
  GetSchemaYaml,
  GetParseableArtifactTriggerResponse,
  GetParseableParallelStageArtifactTriggerResponse,
  clearedArtifactIdentifierResponse,
  GetSettingValueResponse
} from './webhookMockResponses'

import {
  GetArtifactPipelineResponse,
  GetParseableArtifactTemplateFromPipelineResponse,
  GetMergeInputSetArtifactTemplateWithListInputResponse,
  GetParallelArtifactPipelineResponse,
  GetParseableParallelArtifactTemplateFromPipelineResponse
} from './sharedMockResponses'
import TriggersWizardPage from '../TriggersWizardPage'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@common/utils/YamlUtils', () => ({}))
jest.mock('react-monaco-editor', () => ({ value, onChange, name }: any) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} name={name || 'spec.source.spec.script'} />
))

window.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null
}))

const params = {
  accountId: 'testAcc',
  orgIdentifier: 'testOrg',
  projectIdentifier: 'test',
  pipelineIdentifier: 'pipeline',
  triggerIdentifier: 'triggerIdentifier',
  module: 'cd'
}

const getListOfBranchesWithStatus = jest.fn(() => Promise.resolve(branchStatusMock))
const getListGitSync = jest.fn(() => Promise.resolve(gitConfigs))
const fetchConnectors = jest.fn(() => Promise.resolve(connectorsData))

jest.spyOn(cdng, 'useGetListOfBranchesWithStatus').mockImplementation((): any => {
  return { data: branchStatusMock, refetch: getListOfBranchesWithStatus, loading: false }
})

jest.spyOn(cdng, 'useGetConnector').mockImplementation((): any => {
  return { data: connectorsData, refetch: fetchConnectors, loading: false }
})

jest.spyOn(cdng, 'useListGitSync').mockImplementation((): any => {
  return { data: gitConfigs, refetch: getListGitSync, loading: false }
})
jest.spyOn(cdng, 'useGetSourceCodeManagers').mockImplementation((): any => {
  return { data: sourceCodeManagers, refetch: jest.fn(), loading: false }
})

const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
  <TestWrapper>{children}</TestWrapper>
)
const { result } = renderHook(() => useStrings(), { wrapper })

function WrapperComponent(): JSX.Element {
  return (
    <TestWrapper pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
      <TriggersWizardPage />
    </TestWrapper>
  )
}
const mockRegions = {
  resource: [{ name: 'region1', value: 'region1' }]
}
jest.mock('services/portal', () => ({
  useListAwsRegions: jest.fn().mockImplementation(() => {
    return { data: mockRegions, refetch: jest.fn(), error: null, loading: false }
  })
}))
describe('Artifact Trigger Tests', () => {
  beforeAll(() => {
    TriggerFactory.registerTriggerForm(TriggerFormType.Artifact, {
      component: KubernetesArtifacts,
      baseFactory: artifactSourceBaseFactory
    })
  })
  test('Artifact Trigger - submit on edit with right payload', async () => {
    const mockUpdate = jest.fn().mockReturnValue(Promise.resolve({ data: {}, status: {} }))

    jest.spyOn(pipelineNg, 'useGetSchemaYaml').mockImplementation(() => {
      return {
        data: GetSchemaYaml as any,
        refetch: jest.fn(),
        error: null,
        loading: false,
        absolutePath: '',
        cancel: jest.fn(),
        response: null
      }
    })

    jest.spyOn(pipelineNg, 'useCreateVariablesV2').mockImplementation(() => ({
      cancel: jest.fn(),
      loading: false,
      error: null,
      mutate: jest.fn().mockImplementation(() => PostCreateVariables)
    }))

    jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetArtifactPipelineResponse as any)
    jest
      .spyOn(pipelineNg, 'useGetTemplateFromPipeline')
      .mockReturnValue(GetParseableArtifactTemplateFromPipelineResponse as any)
    jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetParseableArtifactTriggerResponse as any)
    jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
      mutate: jest.fn().mockReturnValue(GetMergeInputSetArtifactTemplateWithListInputResponse) as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
      mutate: mockUpdate as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
    const { container } = render(<WrapperComponent />)
    await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())

    const tab3 = container.querySelector('[data-tab-id="Pipeline Input"]')

    if (!tab3) {
      throw Error('No Pipeline Input tab')
    }
    fireEvent.click(tab3)

    await waitFor(() => expect(result.current.getString('triggers.updateTrigger')).not.toBeNull())
    const updateButton = queryByText(container, result.current.getString('triggers.updateTrigger'))
    if (!updateButton) {
      throw Error('Cannot find Update Trigger button')
    }

    fireEvent.click(updateButton)
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))

    expect(mockUpdate).toBeCalled()
  })

  test('Artifact Trigger - submit clears undefined artifact identifier in parallel stage', async () => {
    const mockUpdate = jest.fn().mockReturnValue(Promise.resolve({ data: {}, status: {} }))

    jest.spyOn(pipelineNg, 'useGetSchemaYaml').mockImplementation(() => {
      return {
        data: GetSchemaYaml as any,
        refetch: jest.fn(),
        error: null,
        loading: false,
        absolutePath: '',
        cancel: jest.fn(),
        response: null
      }
    })

    jest.spyOn(pipelineNg, 'useCreateVariablesV2').mockImplementation(() => ({
      cancel: jest.fn(),
      loading: false,
      error: null,
      mutate: jest.fn().mockImplementation(() => PostCreateVariables)
    }))

    jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetParallelArtifactPipelineResponse as any)
    jest
      .spyOn(pipelineNg, 'useGetTemplateFromPipeline')
      .mockReturnValue(GetParseableParallelArtifactTemplateFromPipelineResponse as any)
    jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetParseableParallelStageArtifactTriggerResponse as any)
    jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
      mutate: jest.fn().mockReturnValue(GetParseableParallelArtifactTemplateFromPipelineResponse) as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
      mutate: mockUpdate as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
    const { container } = render(<WrapperComponent />)
    await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())

    const tab3 = container.querySelector('[data-tab-id="Pipeline Input"]')

    if (!tab3) {
      throw Error('No Pipeline Input tab')
    }
    fireEvent.click(tab3)

    await waitFor(() => expect(result.current.getString('triggers.updateTrigger')).not.toBeNull())
    const updateButton = queryByText(container, result.current.getString('triggers.updateTrigger'))
    if (!updateButton) {
      throw Error('Cannot find Update Trigger button')
    }

    fireEvent.click(updateButton)
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))

    expect(mockUpdate).toBeCalled()
    expect(mockUpdate).toBeCalledWith(clearedArtifactIdentifierResponse)
  })
})
