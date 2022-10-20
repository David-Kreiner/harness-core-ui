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
import { InputTypes, setFieldValue } from '@common/utils/JestFormHelper'
import { useToaster } from '@common/exports'
import * as cdng from 'services/cd-ng'
import { TestWrapper } from '@common/utils/testUtils'
import * as usePermission from '@rbac/hooks/usePermission'
import { branchStatusMock, gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
import * as hooks from '@common/hooks'
import * as FeatureFlag from '@common/hooks/useFeatureFlag'
import {
  GetGitTriggerEventDetailsResponse,
  GetTriggerResponse,
  PostCreateVariables,
  GetTriggerRepoOrgConnectorResponse,
  GetTriggerInvalidYamlResponse,
  GetTriggerEmptyActionsResponse,
  GetSchemaYaml,
  enabledFalseUpdateTriggerMockResponseYaml,
  GetCustomTriggerWithVariablesResponse,
  GetCustomWebhookTriggerResponse,
  updateCustomTriggerMockResponseYaml,
  GetSettingValueResponse,
  GetSecretV2PromiseResponse
} from './webhookMockResponses'

import {
  GetTriggerScheduleResponse,
  GetTriggerCronResponse,
  updateCronTriggerReplaceOnlyTwoSpace
} from './ScheduleMockResponses'
import {
  GetPipelineResponse,
  GetTemplateFromPipelineResponse,
  GetMergeInputSetFromPipelineTemplateWithListInputResponse,
  ConnectorResponse,
  RepoConnectorResponse,
  GetInputSetsResponse,
  GetUpdatedTemplateFromPipelineResponse,
  GetUpdatedPipelineWithVariablesResponse
} from './sharedMockResponses'
import TriggersWizardPage from '../TriggersWizardPage'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('@common/utils/YamlUtils', () => ({}))
jest.mock('react-monaco-editor', () => ({ value, onChange, name }: any) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} name={name || 'spec.source.spec.script'} />
))

jest.mock('@common/hooks', () => ({
  ...(jest.requireActual('@common/hooks') as any),

  useQueryParams: jest.fn(),
  useMutateAsGet: jest.fn()
}))

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

jest.spyOn(cdng, 'useGetListOfBranchesWithStatus').mockImplementation((): any => {
  return { data: branchStatusMock, refetch: getListOfBranchesWithStatus, loading: false }
})
jest.spyOn(cdng, 'useListGitSync').mockImplementation((): any => {
  return { data: gitConfigs, refetch: getListGitSync, loading: false }
})
jest.spyOn(cdng, 'useGetSourceCodeManagers').mockImplementation((): any => {
  return { data: sourceCodeManagers, refetch: jest.fn(), loading: false }
})

const mockUpdate = jest.fn().mockReturnValue(Promise.resolve({ data: {}, status: {} }))

const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
  <TestWrapper>{children}</TestWrapper>
)
const { result } = renderHook(() => useStrings(), { wrapper })

jest.mock('@pipeline/factories/ArtifactTriggerInputFactory', () => ({
  getTriggerFormDetails: jest.fn().mockImplementation(() => () => {
    return {
      component: <div>ABC</div>
    }
  })
}))

function WrapperComponent(): JSX.Element {
  return (
    <TestWrapper pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
      <TriggersWizardPage />
    </TestWrapper>
  )
}

describe('TriggersWizardPage Triggers tests', () => {
  describe('Renders/snapshots', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.spyOn(hooks, 'useQueryParams').mockReturnValue({
        storeType: 'INLINE',
        triggerIdentifier: 'test'
      })
    })

    test('OnEdit Render - GitHub Show all fields filled', async () => {
      jest.spyOn(cdng, 'useGetConnector').mockReturnValue(ConnectorResponse as any)

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

      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)

      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(hooks, 'useMutateAsGet').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerResponse as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
        mutate: mockUpdate as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      jest.spyOn(cdng, 'getSecretV2Promise').mockReturnValue(GetSecretV2PromiseResponse as any)
      jest.spyOn(FeatureFlag, 'useFeatureFlag').mockReturnValue(true)
      const { container } = render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
      await waitFor(() =>
        expect(() =>
          queryByText(document.body, result.current.getString('triggers.triggerConfigurationPanel.listenOnNewWebhook'))
        ).not.toBeNull()
      )
      expect(container).toMatchSnapshot()
    })

    test('OnEdit Render - GitHub with repo org level connector', async () => {
      // anyAction checked due to empty actions,
      jest.spyOn(cdng, 'useGetConnector').mockReturnValue(RepoConnectorResponse as any)
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
      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)
      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerRepoOrgConnectorResponse as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
        mutate: mockUpdate as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      jest.spyOn(cdng, 'getSecretV2Promise').mockReturnValue(GetSecretV2PromiseResponse as any)
      jest.spyOn(FeatureFlag, 'useFeatureFlag').mockReturnValue(true)
      const { container } = render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
      await waitFor(() =>
        expect(() => queryByText(document.body, result.current.getString('common.repositoryName'))).not.toBeNull()
      )
      expect(container).toMatchSnapshot()
    })

    test('OnEdit Render - Schedule ', async () => {
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
      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerScheduleResponse as unknown as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      const { container } = render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
      await waitFor(() => expect(() => queryByText(document.body, result.current.getString('name'))).not.toBeNull())
      expect(container).toMatchSnapshot()
      const tab2 = document.body.querySelector('[class*="bp3-tab-list"] [data-tab-id="Schedule"]')
      if (!tab2) {
        throw Error('No Schedule tab, likely cannot parse yaml. Can take snapshot/look at yaml.')
      }
      fireEvent.click(tab2)
      await waitFor(() =>
        expect(() =>
          queryByText(document.body, result.current.getString('triggers.schedulePanel.enterCustomCron'))
        ).not.toBeNull()
      )
      expect(container).toMatchSnapshot()
    })

    test('Invalid yaml shows error message', async () => {
      jest.spyOn(cdng, 'useGetConnector').mockReturnValue(ConnectorResponse as any)
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
      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)
      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerInvalidYamlResponse as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
        mutate: mockUpdate as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
      await waitFor(() =>
        expect(() =>
          queryByText(document.body, result.current.getString('triggers.cannotParseTriggersData'))
        ).not.toBeNull()
      )
    })
  })

  describe('Payload/Values Comparison', () => {
    afterEach(() => {
      jest.clearAllMocks()
      const { clear } = useToaster()
      clear()
    })
    test('Submit shows all onEdit values were parsed into FormikValues for re-submission', async () => {
      jest.spyOn(cdng, 'useGetConnector').mockReturnValue(ConnectorResponse as any)
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

      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)

      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerResponse as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
        mutate: mockUpdate as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      jest.spyOn(FeatureFlag, 'useFeatureFlag').mockReturnValue(false)
      const { container } = render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
      await waitFor(() =>
        expect(() =>
          queryByText(document.body, result.current.getString('triggers.triggerConfigurationPanel.listenOnNewWebhook'))
        ).not.toBeNull()
      )
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
      // expect(mockUpdate).toBeCalledWith(updateTriggerMockResponseYaml)
      expect(mockUpdate).toBeCalled()
    })
    test('OnEdit Webhook to yaml and back renders correct values', async () => {
      jest.spyOn(cdng, 'useGetConnector').mockReturnValue(ConnectorResponse as any)
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

      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)
      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerResponse as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
        mutate: mockUpdate as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      jest.spyOn(FeatureFlag, 'useFeatureFlag').mockReturnValue(false)
      const { container } = render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
      await waitFor(() =>
        expect(() =>
          queryByText(document.body, result.current.getString('triggers.triggerConfigurationPanel.listenOnNewWebhook'))
        ).not.toBeNull()
      )
      // Go to YAML View
      const yamlButton = container.querySelector('[data-name="toggle-option-two"]')
      if (!yamlButton) {
        throw Error('Cannot find YAML button')
      }
      fireEvent.click(yamlButton)
      // Go to Visual View

      const visualButton = container.querySelector('[data-name="toggle-option-one"]')
      if (!visualButton) {
        throw Error('Cannot find YAML button')
      }
      fireEvent.click(visualButton)

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
      // expect(mockUpdate).toBeCalledWith(updateTriggerMockResponseYaml)
      expect(mockUpdate).toBeCalled()
    })

    test('OnEdit CUSTOM Webhook to yaml and back renders correct values', async () => {
      // jest.spyOn(cdng, 'useGetConnector').mockReturnValue(ConnectorResponse as any)
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

      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)
      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetCustomWebhookTriggerResponse as any)
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
          queryByText(document.body, result.current.getString('triggers.triggerConfigurationPanel.listenOnNewWebhook'))
        ).not.toBeNull()
      )
      // Go to YAML View
      const yamlButton = container.querySelector('[data-name="toggle-option-two"]')
      if (!yamlButton) {
        throw Error('Cannot find YAML button')
      }
      fireEvent.click(yamlButton)
      // Go to Visual View

      const visualButton = container.querySelector('[data-name="toggle-option-one"]')
      if (!visualButton) {
        throw Error('Cannot find YAML button')
      }
      fireEvent.click(visualButton)

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
      // expect(mockUpdate).toBeCalledWith(updateTriggerMockResponseYaml)
      expect(mockUpdate).toBeCalledWith(updateCustomTriggerMockResponseYaml)
    })

    test('Submit onEdit values with Enabled False', async () => {
      jest.spyOn(cdng, 'useGetConnector').mockReturnValue(ConnectorResponse as any)
      jest.spyOn(usePermission, 'usePermission').mockImplementation(() => [true])
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
      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)
      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(hooks, 'useMutateAsGet').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerResponse as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
        mutate: mockUpdate as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      jest.spyOn(FeatureFlag, 'useFeatureFlag').mockReturnValue(false)
      const { container } = render(<WrapperComponent />)
      await waitFor(() =>
        queryByText(container, result.current.getString('triggers.triggerConfigurationPanel.listenOnNewWebhook'))
      )

      const enabledSwitch = container.querySelector('[data-name="enabled-switch"]')
      if (!enabledSwitch) {
        throw Error('cannot find enabled switch')
      } else {
        fireEvent.click(enabledSwitch)
      }

      const tab3 = document.body.querySelector('[class*="bp3-tab-list"] [data-tab-id="Pipeline Input"]')
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
      expect(mockUpdate).toBeCalledWith(enabledFalseUpdateTriggerMockResponseYaml)
    })

    test('Submit onEdit does not require push because empty actions response', async () => {
      jest.spyOn(cdng, 'useGetConnector').mockReturnValue(ConnectorResponse as any)
      jest.spyOn(usePermission, 'usePermission').mockImplementation(() => [true])
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
      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)
      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerResponse as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
        mutate: mockUpdate as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      jest.spyOn(FeatureFlag, 'useFeatureFlag').mockReturnValue(false)
      const { container } = render(<WrapperComponent />)

      await waitFor(() => expect(() => queryByText(document.body, result.current.getString('name'))).not.toBeNull())

      setFieldValue({ container, type: InputTypes.SELECT, fieldId: 'event', value: 'Push' })

      await waitFor(() => expect(() => queryByText(document.body, 'Push')).not.toBeNull())

      const tab3 = document.body.querySelector('[class*="bp3-tab-list"] [data-tab-id="Pipeline Input"]')
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
    })

    test('OnEdit Schedule to yaml and back renders correct values ', async () => {
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
      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerScheduleResponse as unknown as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      const { container } = render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
      await waitFor(() => expect(() => queryByText(document.body, result.current.getString('name'))).not.toBeNull())

      const tab2 = document.body.querySelector('[class*="bp3-tab-list"] [data-tab-id="Schedule"]')
      const tab3 = document.body.querySelector('[class*="bp3-tab-list"] [data-tab-id="Pipeline Input"]')

      if (!tab2) {
        throw Error('No Schedule tab, likely cannot parse yaml. Can take snapshot/look at yaml.')
      }
      fireEvent.click(tab2)
      await waitFor(() =>
        expect(() =>
          queryByText(document.body, result.current.getString('triggers.schedulePanel.enterCustomCron'))
        ).not.toBeNull()
      )

      setFieldValue({ container, type: InputTypes.TEXTFIELD, fieldId: 'expression', value: '4 3 * * MON' })

      await waitFor(() => expect(() => queryByText(document.body, '4 3 * * MON')).not.toBeNull())

      const yamlBtn = document.body.querySelector('[data-name="toggle-option-two"]')
      if (!yamlBtn) {
        throw Error('No yaml button, likely cannot parse yaml. Can take snapshot/look at yaml.')
      }
      fireEvent.click(yamlBtn)
      await waitFor(() =>
        expect(() => queryByText(document.body, result.current.getString('triggers.updateTrigger'))).not.toBeNull()
      )

      if (!tab3) {
        throw Error('No pipelineinput button, likely cannot parse yaml. Can take snapshot/look at yaml.')
      }

      fireEvent.click(tab3)

      const visualBtn = document.body.querySelector('[data-name="toggle-option-one"]')
      if (!visualBtn) {
        throw Error('No visual button')
      }
      fireEvent.click(visualBtn)

      await waitFor(() => expect(() => queryByText(document.body, 'test-cron')).not.toBeNull())
      fireEvent.click(tab2)
      await waitFor(() => expect(() => queryByText(document.body, '4 3 * * MON')).not.toBeNull())
    })

    test('OnEdit Cron all values submit', async () => {
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
      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
        mutate: mockUpdate as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerCronResponse as unknown as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      const { container } = render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
      await waitFor(() => expect(() => queryByText(document.body, result.current.getString('name'))).not.toBeNull())

      const tab2 = document.body.querySelector('[class*="bp3-tab-list"] [data-tab-id="Schedule"]')
      const tab3 = document.body.querySelector('[class*="bp3-tab-list"] [data-tab-id="Pipeline Input"]')

      if (!tab2) {
        throw Error('No Schedule tab, likely cannot parse yaml. Can take snapshot/look at yaml.')
      }
      fireEvent.click(tab2)
      await waitFor(() =>
        expect(() =>
          queryByText(document.body, result.current.getString('triggers.schedulePanel.enterCustomCron'))
        ).not.toBeNull()
      )

      setFieldValue({ container, type: InputTypes.TEXTFIELD, fieldId: 'expression', value: '4 3 * * MON' })

      await waitFor(() => expect(() => queryByText(document.body, '4 3 * * MON')).not.toBeNull())

      if (!tab3) {
        throw Error('No pipelineinput button, likely cannot parse yaml. Can take snapshot/look at yaml.')
      }

      fireEvent.click(tab3)
      const updateButton = queryByText(container, result.current.getString('triggers.updateTrigger'))

      if (!updateButton) {
        throw Error('Cannot find Update Trigger button')
      }
      fireEvent.click(updateButton)
      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))

      // does not equal for comparison due to yaml spaces
      expect(mockUpdate).toBeCalledWith(updateCronTriggerReplaceOnlyTwoSpace)
    })

    test('OnEdit Render - Show all fields filled with any actions checked', async () => {
      jest.spyOn(cdng, 'useGetConnector').mockReturnValue(ConnectorResponse as any)
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
      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)
      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerEmptyActionsResponse as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
        mutate: mockUpdate as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())

      await waitFor(() =>
        expect(() =>
          queryByText(document.body, result.current.getString('triggers.triggerConfigurationPanel.listenOnNewWebhook'))
        ).not.toBeNull()
      )

      expect(document.querySelector('[name="actions"]')).toHaveProperty('disabled', true)
      expect(document.querySelector('[name="anyAction"]')).toHaveProperty('checked', true)
    })

    test('Existing Trigger has pipeline with updated runtime input and pipeline variables', async () => {
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

      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetUpdatedPipelineWithVariablesResponse as any)
      jest
        .spyOn(pipelineNg, 'useGetTemplateFromPipeline')
        .mockReturnValue(GetUpdatedTemplateFromPipelineResponse as any)
      jest.spyOn(hooks, 'useMutateAsGet').mockReturnValue(GetUpdatedTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useCreateVariablesV2').mockImplementation(() => ({
        cancel: jest.fn(),
        loading: false,
        error: null,
        mutate: jest.fn().mockImplementation(() => PostCreateVariables)
      }))
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetCustomTriggerWithVariablesResponse as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      const { container, getByText } = render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
      await waitFor(() =>
        expect(() =>
          queryByText(document.body, result.current.getString('triggers.triggerConfigurationPanel.listenOnNewWebhook'))
        ).not.toBeNull()
      )
      const tab3 = container.querySelector('[data-tab-id="Pipeline Input"]')

      if (!tab3) {
        throw Error('No Pipeline Input tab')
      }
      fireEvent.click(tab3)
      await waitFor(() => expect(result.current.getString('triggers.updateTrigger')).not.toBeNull())

      expect(getByText('var2')).toBeDefined()
      expect(container).toMatchSnapshot()
      // snapshot should display new fields var2, var3withDefault, Description
      // and persist values Namespaec: default, Git Branch: test

      expect(getByText('var3withDefault')).toBeDefined()
      // Need to ensure var1: 123 and var3withDefault shows var1 as deafult
    })
  })

  describe('Initial Renders/snapshots', () => {
    test('Initial Render - GitHub Webhook', async () => {
      jest.spyOn(cdng, 'useGetConnector').mockReturnValue(ConnectorResponse as any)

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

      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)
      jest.spyOn(hooks, 'useQueryParams').mockReturnValue({
        storeType: 'INLINE',
        triggerType: 'Webhook',
        sourceRepo: 'Github'
      })

      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(hooks, 'useMutateAsGet').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue({
        loading: false,
        refetch: jest.fn(),
        error: null,
        data: {
          status: 'SUCCESS',
          data: {},
          metaData: null as unknown as undefined,
          correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
        }
      } as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      jest.spyOn(cdng, 'getSecretV2Promise').mockReturnValue(GetSecretV2PromiseResponse as any)
      jest.spyOn(FeatureFlag, 'useFeatureFlag').mockReturnValue(true)
      const { container } = render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
      await waitFor(() =>
        expect(() =>
          queryByText(document.body, result.current.getString('triggers.triggerConfigurationPanel.listenOnNewWebhook'))
        ).not.toBeNull()
      )
      expect(container).toMatchSnapshot()
    })

    test('Initial Render - Schedule', async () => {
      jest.spyOn(cdng, 'useGetConnector').mockReturnValue(ConnectorResponse as any)

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

      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)
      jest.spyOn(hooks, 'useQueryParams').mockReturnValue({
        storeType: 'INLINE',
        triggerType: 'Scheduled'
      })

      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(hooks, 'useMutateAsGet').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue({
        loading: false,
        refetch: jest.fn(),
        error: null,
        data: {
          status: 'SUCCESS',
          data: {},
          metaData: null as unknown as undefined,
          correlationId: '25df5700-e9a4-49c4-98eb-dea4c371fd6e'
        }
      } as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      const { container } = render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())
      await waitFor(() =>
        expect(() =>
          queryByText(document.body, result.current.getString('triggers.triggerConfigurationPanel.listenOnNewWebhook'))
        ).not.toBeNull()
      )
      expect(container).toMatchSnapshot()
    })
    test('Initial Render - Page Not Found', async () => {
      jest.spyOn(hooks, 'useQueryParams').mockReturnValue({
        storeType: 'INLINE',
        triggerType: 'nonexistanttriggertype'
      })

      const { getByText } = render(<WrapperComponent />)
      await waitFor(() => expect(() => queryByText(document.body, 'Loading, please wait...')).toBeDefined())

      expect(getByText('triggers.pageNotFound')).toBeInTheDocument()
    })
  })

  describe('Need to Run Tests Last', () => {
    test('Submit onEdit shows toast to fill out actions', async () => {
      jest.spyOn(cdng, 'useGetConnector').mockReturnValue(ConnectorResponse as any)
      jest.spyOn(usePermission, 'usePermission').mockImplementation(() => [true])
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
      jest.spyOn(pipelineNg, 'useGetGitTriggerEventDetails').mockReturnValue(GetGitTriggerEventDetailsResponse as any)
      jest.spyOn(pipelineNg, 'useGetInputSetsListForPipeline').mockReturnValue(GetInputSetsResponse as any)
      jest.spyOn(pipelineNg, 'useGetPipeline').mockReturnValue(GetPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTemplateFromPipeline').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(hooks, 'useMutateAsGet').mockReturnValue(GetTemplateFromPipelineResponse as any)
      jest.spyOn(pipelineNg, 'useGetTrigger').mockReturnValue(GetTriggerResponse as any)
      jest.spyOn(pipelineNg, 'useGetMergeInputSetFromPipelineTemplateWithListInput').mockReturnValue({
        mutate: jest.fn().mockReturnValue(GetMergeInputSetFromPipelineTemplateWithListInputResponse) as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(pipelineNg, 'useUpdateTrigger').mockReturnValue({
        mutate: mockUpdate as unknown
      } as UseMutateReturn<any, any, any, any, any>)
      jest.spyOn(cdng, 'useGetSettingValue').mockReturnValue(GetSettingValueResponse as any)
      const { container } = render(<WrapperComponent />)
      setFieldValue({ container, type: InputTypes.SELECT, fieldId: 'event', value: 'PullRequest' })
      const tab3 = document.body.querySelector('[class*="bp3-tab-list"] [data-tab-id="Pipeline Input"]')
      if (!tab3) {
        throw Error('No Pipeline Input tab, likely cannot parse yaml. Can take snapshot/look at yaml.')
      }
      fireEvent.click(tab3)
      await waitFor(() => expect(result.current.getString('triggers.updateTrigger')).not.toBeNull())
      const updateButton = queryByText(container, result.current.getString('triggers.updateTrigger'))
      if (!updateButton) {
        throw Error('Cannot find Update Trigger button')
      }
      fireEvent.click(updateButton)
      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(0))
      await waitFor(() => expect(result.current.getString('addressErrorFields')).not.toBeNull())
    })
  })
})
