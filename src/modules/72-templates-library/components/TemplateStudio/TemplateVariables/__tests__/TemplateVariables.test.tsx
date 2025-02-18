/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import produce from 'immer'
import { set } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import { gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import {
  TemplateVariablesContext,
  TemplateVariablesData
} from '@pipeline/components/TemplateVariablesContext/TemplateVariablesContext'
import TemplateVariablesWrapper from '@templates-library/components/TemplateStudio/TemplateVariables/TemplateVariables'
import {
  deploymentTemplateMetaDataMap,
  deploymentTemplateMock,
  getTemplateContextMock,
  monitoedServiceMetaDataMap,
  monitoredServiceTemplateMock,
  pipelineTemplateMock,
  stageTemplateMock,
  stepTemplateMock
} from '@templates-library/components/TemplateStudio/__tests__/stateMock'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import * as PipelineVariables from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables'
import * as StepCard from '@pipeline/components/PipelineStudio/PipelineVariables/Cards/StepCard'
import * as StageCard from '@pipeline/components/PipelineStudio/PipelineVariables/Cards/StageCard'
import * as MonitoredServiceCard from '@pipeline/components/PipelineStudio/PipelineVariables/Cards/MonitoredServiceCard'
import * as DeploymentTemplateCard from '@pipeline/components/PipelineStudio/PipelineVariables/Cards/DeploymentTemplateCard'
import type { PipelineCardProps } from '@pipeline/components/PipelineStudio/PipelineVariables/Cards/PipelineCard'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import { DrawerTypes } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateActions'

jest.mock('services/cd-ng-rq', () => ({
  useListGitSyncQuery: jest.fn().mockImplementation(() => {
    return { data: gitConfigs, refetch: jest.fn() }
  }),
  useGetSourceCodeManagersQuery: jest.fn().mockImplementation(() => {
    return { data: sourceCodeManagers, refetch: jest.fn() }
  })
}))

jest.mock('@connectors/pages/connectors/hooks/useGetConnectorsListHook/useGetConectorsListHook', () => ({
  useGetConnectorsListHook: jest.fn().mockReturnValue({
    loading: false,
    categoriesMap: {},
    connectorsList: ['K8sCluster'],
    connectorCatalogueOrder: ['CLOUD_PROVIDER']
  })
}))
const variablesTemplate = { name: '', identifier: '' }

describe('<TemplateVariables /> tests', () => {
  test('should call PipelineCardPanel with correct props', async () => {
    const PipelineCardPanelMock = jest.spyOn(PipelineVariables, 'PipelineCardPanel')
    render(
      <TestWrapper>
        <TemplateContext.Provider value={{ ...getTemplateContextMock(TemplateType.Pipeline), isReadonly: true }}>
          <TemplateVariablesContext.Provider
            value={
              {
                originalTemplate: pipelineTemplateMock,
                variablesTemplate,
                serviceExpressionPropertiesList: []
              } as unknown as TemplateVariablesData
            }
          >
            <TemplateVariablesWrapper />
          </TemplateVariablesContext.Provider>
        </TemplateContext.Provider>
      </TestWrapper>
    )

    expect(PipelineCardPanelMock).toBeCalledWith(
      expect.objectContaining({
        pipeline: pipelineTemplateMock.spec,
        originalPipeline: pipelineTemplateMock.spec,
        readonly: true
      }),
      expect.anything()
    )
  })

  test('should call StepCardPanel with correct props', () => {
    const StepCardPanelMock = jest.spyOn(StepCard, 'StepCardPanel')
    render(
      <TestWrapper>
        <TemplateContext.Provider value={{ ...getTemplateContextMock(TemplateType.Step), isReadonly: true }}>
          <TemplateVariablesContext.Provider
            value={
              {
                originalTemplate: stepTemplateMock,
                variablesTemplate,
                serviceExpressionPropertiesList: []
              } as unknown as TemplateVariablesData
            }
          >
            <TemplateVariablesWrapper />
          </TemplateVariablesContext.Provider>
        </TemplateContext.Provider>
      </TestWrapper>
    )

    expect(StepCardPanelMock).toBeCalledWith(
      expect.objectContaining({ originalStep: stepTemplateMock.spec, readonly: true }),
      expect.anything()
    )
  })

  test('should call StageCard with correct props', () => {
    const StageCardMock = jest.spyOn(StageCard, 'default')
    render(
      <TestWrapper>
        <TemplateContext.Provider value={{ ...getTemplateContextMock(TemplateType.Stage), isReadonly: true }}>
          <TemplateVariablesContext.Provider
            value={
              {
                originalTemplate: stageTemplateMock,
                variablesTemplate,
                serviceExpressionPropertiesList: []
              } as unknown as TemplateVariablesData
            }
          >
            <TemplateVariablesWrapper />
          </TemplateVariablesContext.Provider>
        </TemplateContext.Provider>
      </TestWrapper>
    )

    expect(StageCardMock).toBeCalledWith(
      expect.objectContaining({
        originalStage: { ...stageTemplateMock.spec, identifier: 'stage_name' },
        readonly: true
      }),
      expect.anything()
    )
  })

  test('should render loader', () => {
    const { container } = render(
      <TestWrapper>
        <TemplateContext.Provider value={getTemplateContextMock(TemplateType.Pipeline)}>
          <TemplateVariablesContext.Provider
            value={
              {
                initLoading: true
              } as unknown as TemplateVariablesData
            }
          >
            <TemplateVariablesWrapper />
          </TemplateVariablesContext.Provider>
        </TemplateContext.Provider>
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('should render error', () => {
    const { container } = render(
      <TestWrapper>
        <TemplateContext.Provider value={getTemplateContextMock(TemplateType.Pipeline)}>
          <TemplateVariablesContext.Provider
            value={
              {
                error: { message: 'This is an error message' }
              } as unknown as TemplateVariablesData
            }
          >
            <TemplateVariablesWrapper />
          </TemplateVariablesContext.Provider>
        </TemplateContext.Provider>
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('should call apply and discard correctly', async () => {
    jest.spyOn(PipelineVariables, 'PipelineCardPanel').mockImplementation((props: PipelineCardProps) => {
      return (
        <div className={'pipeline-card-panel-mock'}>
          <button
            onClick={() => {
              props.updatePipeline({
                ...pipelineTemplateMock.spec,
                variables: [{ name: 'var', type: 'String', value: 'val' }]
              } as unknown as PipelineInfoConfig)
            }}
          >
            Update
          </button>
        </div>
      )
    })
    const templateContext = getTemplateContextMock(TemplateType.Pipeline)
    const { getByRole } = render(
      <TestWrapper>
        <TemplateContext.Provider value={templateContext}>
          <TemplateVariablesContext.Provider
            value={
              {
                originalTemplate: pipelineTemplateMock,
                variablesTemplate,
                serviceExpressionPropertiesList: []
              } as unknown as TemplateVariablesData
            }
          >
            <TemplateVariablesWrapper />
          </TemplateVariablesContext.Provider>
        </TemplateContext.Provider>
      </TestWrapper>
    )

    await act(async () => {
      fireEvent.click(getByRole('button', { name: 'pipeline.discard' }))
    })
    expect(templateContext.updateTemplateView).toBeCalledWith({
      drawerData: { data: { paletteData: { onSelection: expect.anything() } }, type: DrawerTypes.TemplateVariables },
      isDrawerOpened: false,
      isYamlEditable: false
    })

    await act(async () => {
      fireEvent.click(getByRole('button', { name: 'Update' }))
    })
    await act(async () => {
      fireEvent.click(getByRole('button', { name: 'applyChanges' }))
    })
    const updatedTemplate = produce(pipelineTemplateMock, draft => {
      set(draft, 'spec.variables', [{ name: 'var', type: 'String', value: 'val' }])
    })
    expect(templateContext.updateTemplate).toBeCalledWith(updatedTemplate)
    expect(templateContext.updateTemplateView).toBeCalledWith({
      drawerData: { data: { paletteData: { onSelection: expect.anything() } }, type: DrawerTypes.TemplateVariables },
      isDrawerOpened: false,
      isYamlEditable: false
    })
  })

  test('should call MonitoredServiceCard with correct props', async () => {
    const MonitoredServiceCardMock = jest.spyOn(MonitoredServiceCard, 'default')
    render(
      <TestWrapper>
        <TemplateContext.Provider value={getTemplateContextMock(TemplateType.MonitoredService)}>
          <TemplateVariablesContext.Provider
            value={
              {
                originalTemplate: monitoredServiceTemplateMock,
                metadataMap: monitoedServiceMetaDataMap,
                variablesTemplate,
                serviceExpressionPropertiesList: []
              } as unknown as TemplateVariablesData
            }
          >
            <TemplateVariablesWrapper />
          </TemplateVariablesContext.Provider>
        </TemplateContext.Provider>
      </TestWrapper>
    )

    expect(MonitoredServiceCardMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        metadataMap: monitoedServiceMetaDataMap
      }),
      expect.anything()
    )
  })

  test('should call DeploymentTemplateCard with correct props', async () => {
    const DeploymentTemplateCardMock = jest.spyOn(DeploymentTemplateCard, 'default')
    render(
      <TestWrapper>
        <TemplateContext.Provider value={getTemplateContextMock(TemplateType.CustomDeployment)}>
          <TemplateVariablesContext.Provider
            value={
              {
                originalTemplate: deploymentTemplateMock,
                metadataMap: deploymentTemplateMetaDataMap,
                variablesTemplate,
                serviceExpressionPropertiesList: []
              } as unknown as TemplateVariablesData
            }
          >
            <TemplateVariablesWrapper />
          </TemplateVariablesContext.Provider>
        </TemplateContext.Provider>
      </TestWrapper>
    )

    expect(DeploymentTemplateCardMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        metadataMap: deploymentTemplateMetaDataMap
      }),
      expect.anything()
    )
  })
})
