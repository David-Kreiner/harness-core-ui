/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, queryByText, fireEvent, act, getByText } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import type { UseMutateReturn } from 'restful-react'
import { useStrings } from 'framework/strings'
import * as pipelineNg from 'services/pipeline-ng'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'
import * as cdng from 'services/cd-ng'
import { findDialogContainer, queryByNameAttribute, TestWrapper } from '@common/utils/testUtils'
import { branchStatusMock, gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
// eslint-disable-next-line no-restricted-imports
import { KubernetesManifests } from '@cd/components/PipelineSteps/K8sServiceSpec/KubernetesManifests/KubernetesManifests'
// eslint-disable-next-line no-restricted-imports
import manifestSourceBaseFactory from '@cd/factory/ManifestSourceFactory/ManifestSourceBaseFactory'
// eslint-disable-next-line no-restricted-imports
import { KubernetesArtifacts } from '@cd/components/PipelineSteps/K8sServiceSpec/KubernetesArtifacts/KubernetesArtifacts'
// eslint-disable-next-line no-restricted-imports
import artifactSourceBaseFactory from '@cd/factory/ArtifactSourceFactory/ArtifactSourceBaseFactory'

import { connectorsData } from '@connectors/pages/connectors/__tests__/mockData'
import TriggerFactory from '@pipeline/factories/ArtifactTriggerInputFactory/index'
import { TriggerFormType } from '@pipeline/factories/ArtifactTriggerInputFactory/types'
import * as hooks from '@common/hooks'
import {
  PostCreateVariables,
  GetSchemaYaml,
  GetManifestTriggerResponse,
  GetParseableManifestTriggerResponse,
  GetTriggerWithEventConditionsResponse,
  GetParseableArtifactTriggerResponse,
  GetSettingValueResponse
} from './webhookMockResponses'

import {
  GetPipelineResponse,
  GetTemplateFromPipelineResponse,
  GetMergeInputSetFromPipelineTemplateWithListInputResponse,
  GetInputSetsResponse,
  GetManifestPipelineResponse,
  GetManifestTemplateFromPipelineResponse,
  GetManifestInputSetsResponse,
  GetParseableTemplateFromPipelineResponse,
  GetArtifactPipelineResponse,
  GetParseableArtifactTemplateFromPipelineResponse,
  GetMergeInputSetArtifactTemplateWithListInputResponse
} from './sharedMockResponses'
import TriggersWizardPage from '../TriggersWizardPage'
jest.mock('@common/hooks', () => ({
  ...(jest.requireActual('@common/hooks') as any),

  useMutateAsGet: jest.fn().mockImplementation(() => {
    return GetTemplateFromPipelineResponse
  })
}))
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
jest.spyOn(hooks, 'useMutateAsGet').mockImplementation((): any => {
  return GetTemplateFromPipelineResponse
})
const mockUpdate = jest.fn().mockReturnValue(Promise.resolve({ data: {}, status: {} }))

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

describe('Manifest Trigger Tests', () => {
  beforeAll(() => {
    TriggerFactory.registerTriggerForm(TriggerFormType.Manifest, {
      component: KubernetesManifests,
      baseFactory: manifestSourceBaseFactory
    })

    TriggerFactory.registerTriggerForm(TriggerFormType.Artifact, {
      component: KubernetesArtifacts,
      baseFactory: artifactSourceBaseFactory
    })
  })

  test('throws validation error when select artifact/manifest is not added', async () => {
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

    jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetManifestTriggerResponse as any)

    jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
    jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
    jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
    jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetManifestTriggerResponse as any)
    jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
      mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
      mutate: mockUpdate as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
    const { container } = render(<WrapperComponent />)
    await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
    await waitFor(() =>
      expect(() =>
        queryByText(document.body, result.current.getString('pipeline.artifactTriggerConfigPanel.listenOnNewArtifact'))
      ).not.toBeNull()
    )
    const tab3 = container.querySelector('[data-tab-id="Pipeline Input"]')

    if (!tab3) {
      throw Error('No Pipeline Input tab')
    }

    expect(container).toMatchSnapshot()
    await waitFor(() =>
      expect(() =>
        queryByText(
          document.body,
          result.current.getString('pipeline.artifactTriggerConfigPanel.noSelectableArtifactsFound')
        )
      ).toBeDefined()
    )
  })

  test('Check chartVersion to be disabled and default value is <+trigger.manifest.version>', async () => {
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
    jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetManifestInputSetsResponse as any)
    jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetManifestPipelineResponse as any)
    jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetManifestTemplateFromPipelineResponse as any)

    jest.spyOn(hooks, 'useMutateAsGet').mockImplementation((): any => {
      return GetManifestTemplateFromPipelineResponse
    })
    jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetManifestTriggerResponse as any)
    jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
      mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
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

    const chartVersionElem = queryByNameAttribute(
      'pipeline.stages[0].stage.spec.serviceConfig.serviceDefinition.spec.manifests[1].manifest.spec.chartVersion',
      container
    ) as HTMLInputElement
    expect(chartVersionElem.value).toBe('<+trigger.manifest.version>')
    expect(chartVersionElem).toBeDisabled()
    expect(container).toMatchSnapshot()
  })

  test('submit on edit with right payload', async () => {
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
    jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetManifestInputSetsResponse as any)
    jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetManifestPipelineResponse as any)
    jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetManifestTemplateFromPipelineResponse as any)
    jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetManifestTriggerResponse as any)
    jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
      mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
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
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(0)) // trigger save should not happen without adding CI Codebase details
    // expect(mockUpdate).toBeCalledWith(updateManifestTriggerMockResponseYaml)
  })

  test('function getArtifactSpecObj by displaying select artifact', async () => {
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
    jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetManifestInputSetsResponse as any)
    jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetManifestPipelineResponse as any)
    jest
      .spyOn(pipelineNg, 'useGetTemplateFromPipeline')
      .mockReturnValue(GetParseableTemplateFromPipelineResponse as any)
    jest.spyOn(hooks, 'useMutateAsGet').mockImplementation((): any => {
      return GetParseableTemplateFromPipelineResponse
    })
    jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetParseableManifestTriggerResponse as any)
    jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
      mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
      mutate: mockUpdate as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
    const { container } = render(<WrapperComponent />)
    await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())

    const yamlBtn = container.querySelector('[data-name="toggle-option-two"]')

    if (!yamlBtn) {
      throw Error('No yaml button')
    }
    fireEvent.click(yamlBtn)

    await waitFor(() => expect(result.current.getString('triggers.updateTrigger')).not.toBeNull())

    const visualBtn = container.querySelector('[data-name="toggle-option-one"]')

    if (!visualBtn) {
      throw Error('No visual button')
    }
    fireEvent.click(visualBtn)

    await waitFor(() => expect(result.current.getString('triggers.triggerConfigurationLabel')).not.toBeNull())

    expect(container).toMatchSnapshot()
    const deleteIcon = container.querySelector('[data-name="main-delete"]')
    if (!deleteIcon) {
      throw Error('No delete icon')
    }
    fireEvent.click(deleteIcon)

    const selectManifest = container.querySelector('[data-name="plusAdd"]')
    if (!selectManifest) {
      throw Error('No select manifest')
    }
    fireEvent.click(selectManifest)

    await waitFor(() =>
      expect(
        result.current.getString('pipeline.artifactTriggerConfigPanel.plusSelect', {
          artifact: 'Manifest'
        })
      ).not.toBeNull()
    )
  })

  test('on click of edit - submits thru the right payload', async () => {
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
    jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetManifestInputSetsResponse as any)
    jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetManifestPipelineResponse as any)
    jest
      .spyOn(pipelineNg, 'useGetTemplateFromPipeline')
      .mockReturnValue(GetParseableTemplateFromPipelineResponse as any)
    jest.spyOn(hooks, 'useMutateAsGet').mockImplementation((): any => {
      return GetParseableTemplateFromPipelineResponse
    })
    jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetParseableManifestTriggerResponse as any)
    jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
      mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
      mutate: mockUpdate as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
    const { container } = render(<WrapperComponent />)
    await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())

    const yamlBtn = container.querySelector('[data-name="toggle-option-two"]')

    if (!yamlBtn) {
      throw Error('No yaml button')
    }
    fireEvent.click(yamlBtn)

    await waitFor(() => expect(result.current.getString('triggers.updateTrigger')).not.toBeNull())

    const visualBtn = container.querySelector('[data-name="toggle-option-one"]')

    if (!visualBtn) {
      throw Error('No visual button')
    }
    fireEvent.click(visualBtn)

    await waitFor(() => expect(result.current.getString('triggers.triggerConfigurationLabel')).not.toBeNull())

    expect(container).toMatchSnapshot()

    const editIcon = container.querySelector('[data-name="select-artifact-edit"]')

    fireEvent.click(editIcon!)

    await act(async () => {
      const dialog = findDialogContainer() as HTMLElement
      const applyBtn = getByText(dialog, 'filters.apply')
      fireEvent.click(applyBtn!)
      expect(dialog).toMatchSnapshot()
    })

    const deleteIcon = container.querySelector('[data-name="main-delete"]')
    if (!deleteIcon) {
      throw Error('No delete icon')
    }
    fireEvent.click(deleteIcon)

    const selectManifest = container.querySelector('[data-name="plusAdd"]')
    if (!selectManifest) {
      throw Error('No select manifest')
    }
    fireEvent.click(selectManifest)

    await waitFor(() =>
      expect(
        result.current.getString('pipeline.artifactTriggerConfigPanel.plusSelect', {
          artifact: 'Manifest'
        })
      ).not.toBeNull()
    )
  })

  test('on edit -with event conditions payload', async () => {
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
    jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetManifestInputSetsResponse as any)
    jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetManifestPipelineResponse as any)
    jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetManifestTemplateFromPipelineResponse as any)
    jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerWithEventConditionsResponse as any)
    jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
      mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
      mutate: mockUpdate as unknown
    } as UseMutateReturn<any, any, any, any, any>)
    jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
    const { container } = render(<WrapperComponent />)
    await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())

    const tab2 = container.querySelector('[data-tab-id="Conditions"]')

    if (!tab2) {
      throw Error('No conditions tab')
    }
    fireEvent.click(tab2)
    expect(container).toMatchSnapshot()
  })

  test('on click of edit artifact - submits thru the right payload', async () => {
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
    jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetManifestInputSetsResponse as any)
    jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetArtifactPipelineResponse as any)
    jest
      .spyOn(pipelineNg, 'useGetTemplateFromPipeline')
      .mockReturnValue(GetParseableArtifactTemplateFromPipelineResponse as any)
    jest.spyOn(hooks, 'useMutateAsGet').mockImplementation((): any => {
      return GetParseableArtifactTemplateFromPipelineResponse
    })
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

    const yamlBtn = container.querySelector('[data-name="toggle-option-two"]')

    if (!yamlBtn) {
      throw Error('No yaml button')
    }
    fireEvent.click(yamlBtn)

    await waitFor(() => expect(result.current.getString('triggers.updateTrigger')).not.toBeNull())

    const visualBtn = container.querySelector('[data-name="toggle-option-one"]')

    if (!visualBtn) {
      throw Error('No visual button')
    }
    fireEvent.click(visualBtn)

    await waitFor(() => expect(result.current.getString('triggers.triggerConfigurationLabel')).not.toBeNull())

    expect(container).toMatchSnapshot()

    const editIcon = container.querySelector('[data-name="select-artifact-edit"]')

    fireEvent.click(editIcon!)

    await act(async () => {
      const dialog = findDialogContainer() as HTMLElement
      const applyBtn = getByText(dialog, 'filters.apply')
      fireEvent.click(applyBtn!)
      expect(dialog).toMatchSnapshot()
    })

    const deleteIcon = container.querySelector('[data-name="main-delete"]')
    if (!deleteIcon) {
      throw Error('No delete icon')
    }
    fireEvent.click(deleteIcon)

    const selectManifest = container.querySelector('[data-name="plusAdd"]')
    if (!selectManifest) {
      throw Error('No select manifest')
    }
    fireEvent.click(selectManifest)

    await waitFor(() =>
      expect(
        result.current.getString('pipeline.artifactTriggerConfigPanel.plusSelect', {
          artifact: 'Artifact'
        })
      ).not.toBeNull()
    )
  })
})
