/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByText, queryByText, render, waitFor } from '@testing-library/react'
import { MultiTypeInputType, MultiTypeInputValue, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { SshWinRmAzureInfrastructure } from 'services/cd-ng'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { SshWinRmAzureInfrastructureSpec } from '../SshWinRmAzureInfrastructureSpec'
import {
  connectorsResponse,
  connectorResponse,
  subscriptionsResponse,
  resourceGroupsResponse,
  tagsResponse
} from './mocks'
import type { SshWinRmAzureInfrastructureTemplate } from '../SshWinRmAzureInfrastructureInterface'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const getInvalidYaml = (): string => `p ipe<>line:
sta ges:
   - st<>[]age:
              s pe<> c: <> sad-~`

const getYaml = (): string => `pipeline:
    stages:
        - stage:
              spec:
                  infrastructure:
                      infrastructureDefinition:
                          type: SshWinRmAzure
                          spec:
                              credentialsRef: account.secrets
                              connectorRef: account.connectorRef
                              subscriptionId: subscriptionId
                              resourceGroup: resourceGroup
                              `

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn(() => connectorResponse),
  useGetAzureSubscriptions: jest.fn(() => subscriptionsResponse),
  useGetAzureResourceGroupsBySubscription: jest.fn(() => resourceGroupsResponse),
  getConnectorListV2Promise: jest.fn(() => Promise.resolve(connectorsResponse.data)),
  getAzureSubscriptionsPromise: jest.fn(() => Promise.resolve(subscriptionsResponse.data)),
  getAzureResourceGroupsBySubscriptionPromise: jest.fn(() => Promise.resolve(resourceGroupsResponse.data)),
  useGetSubscriptionTags: jest.fn(() => tagsResponse),
  useGetAzureResourceGroupsV2: jest.fn(() => resourceGroupsResponse),
  getSubscriptionTagsPromise: jest.fn(() => Promise.resolve(tagsResponse.data)),
  useGetSubscriptionTagsV2: jest.fn(() => tagsResponse)
}))

const getInitialValues = (): SshWinRmAzureInfrastructure => ({
  credentialsRef: 'credentialsRef',
  connectorRef: 'connectorRef',
  subscriptionId: 'subscriptionId',
  resourceGroup: 'resourceGroup',
  hostConnectionType: 'Hostname',
  tags: {
    key: 'value'
  }
})

const getRuntimeInputsValues = (): SshWinRmAzureInfrastructureTemplate => ({
  credentialsRef: RUNTIME_INPUT_VALUE,
  connectorRef: RUNTIME_INPUT_VALUE,
  subscriptionId: RUNTIME_INPUT_VALUE,
  resourceGroup: RUNTIME_INPUT_VALUE,
  hostConnectionType: 'Hostname',
  tags: RUNTIME_INPUT_VALUE
})

const getParams = () => ({
  accountId: 'accountId',
  module: 'cd',
  orgIdentifier: 'default',
  pipelineIdentifier: '-1',
  projectIdentifier: 'projectIdentifier'
})
jest.mock('@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField', () => ({
  ...(jest.requireActual('@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField') as any),
  // eslint-disable-next-line react/display-name
  FormMultiTypeConnectorField: (props: any) => {
    return (
      <div>
        <button
          name={'changeFormMultiTypeConnectorField'}
          onClick={() => {
            props.onChange('value', MultiTypeInputValue.STRING, MultiTypeInputType.RUNTIME)
          }}
        >
          Form Multi Type Connector Field button
        </button>
      </div>
    )
  }
}))
// const credentialsRefPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.credentialsRef'
const connectorRefPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.connectorRef'
const subscriptionPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.subscriptionId'
const resourceGroupPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.resourceGroup'
const subscriptionTagsPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.tags'

describe('Test Azure Infrastructure Spec snapshot', () => {
  beforeEach(() => {
    factory.registerStep(new SshWinRmAzureInfrastructureSpec())
  })

  test('Should render edit view with empty initial values', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.SshWinRmAzure} stepViewType={StepViewType.Edit} />
    )
    expect(container).toMatchSnapshot()
  })

  test('Should render edit view with values', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        type={StepType.SshWinRmAzure}
        stepViewType={StepViewType.Edit}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('Should render edit view with runtime values', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getRuntimeInputsValues()}
        type={StepType.SshWinRmAzure}
        stepViewType={StepViewType.Edit}
      />
    )
    expect(container).toMatchSnapshot()
  })
  test('Should render edit view for inputset view and fetch dropdowns on focus', async () => {
    const { container, getByPlaceholderText } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValues()}
        type={StepType.SshWinRmAzure}
        stepViewType={StepViewType.InputSet}
      />
    )
    expect(container).toMatchSnapshot()

    const subscriptionInput = getByPlaceholderText('cd.steps.azureInfraStep.subscriptionPlaceholder') as HTMLElement
    subscriptionInput.focus()
    await waitFor(() => expect(subscriptionsResponse.refetch).toHaveBeenCalled())

    const resourceGroupInput = getByPlaceholderText('cd.steps.azureInfraStep.resourceGroupPlaceholder') as HTMLElement
    resourceGroupInput.focus()
    await waitFor(() => expect(resourceGroupsResponse.refetch).toHaveBeenCalled())
  })

  test('Should render variable view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValues()}
        type={StepType.SshWinRmAzure}
        stepViewType={StepViewType.InputVariable}
      />
    )

    expect(container).toMatchSnapshot()
  })
})

describe('Test Azure Infrastructure Spec behavior', () => {
  beforeEach(() => {
    factory.registerStep(new SshWinRmAzureInfrastructureSpec())
  })

  test('Should call onUpdate if valid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { container, findByText, getByPlaceholderText } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValues()}
        type={StepType.SshWinRmAzure}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    const button = await waitFor(() => findByText('Form Multi Type Connector Field button'))
    act(() => {
      fireEvent.click(button)
    })
    const subscriptionInput = getByPlaceholderText('cd.steps.azureInfraStep.subscriptionPlaceholder') as HTMLElement
    expect(subscriptionInput).not.toBeDisabled()
    fireEvent.change(subscriptionInput!, { target: { label: 's1', value: 'subscription1' } })
    const resourceGroupInput = getByPlaceholderText('cd.steps.azureInfraStep.resourceGroupPlaceholder') as HTMLElement
    fireEvent.change(resourceGroupInput!, { target: { value: 'rg1' } })
    const addTags = container.querySelector('[data-icon="add"]') as HTMLElement
    fireEvent.click(addTags!)
    expect(getByText(container, 'keyLabel')).toBeTruthy()
    expect(container).toMatchSnapshot()
    const tagEl = container.querySelector('[name="tagslabel1"]') as HTMLElement
    fireEvent.change(tagEl!, { target: { value: 'newKey' } })
    const tagValEl = container.querySelector('[name=".tags."]') as HTMLElement
    fireEvent.change(tagValEl!, { target: { value: 'newValue' } })
    const deleteTag = container.querySelector('[data-icon="trash"]') as HTMLElement
    fireEvent.click(deleteTag!)
    expect(queryByText(container, 'keyLabel')).toBeNull()
    expect(subscriptionInput).not.toBeDisabled()
    await waitFor(() => expect(container.querySelector('[value="newValue"]')).toBeDefined())
  })
  test('Should call onUpdate if valid values entered - edit view', async () => {
    const onUpdateHandler = jest.fn()
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container, getByPlaceholderText } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getInitialValues()}
        allValues={getInitialValues()}
        type={StepType.SshWinRmAzure}
        stepViewType={StepViewType.Edit}
        onUpdate={onUpdateHandler}
        ref={ref}
      />
    )

    expect(container).toMatchSnapshot()
    const subscriptionInput = getByPlaceholderText('cd.steps.azureInfraStep.subscriptionPlaceholder') as HTMLElement
    expect(subscriptionInput).not.toBeDisabled()
    fireEvent.change(subscriptionInput!, { target: { label: 's1', value: 'subscription1' } })
    const resourceGroupInput = getByPlaceholderText('cd.steps.azureInfraStep.resourceGroupPlaceholder') as HTMLElement
    fireEvent.change(resourceGroupInput!, { target: { value: 'rg1' } })
    const tagEl = container.querySelector('[name="tagslabel1"]') as HTMLElement
    fireEvent.change(tagEl!, { target: { value: 'newKey' } })
    const tagValEl = container.querySelector('[name="tags.key"]') as HTMLElement
    fireEvent.change(tagValEl!, { target: { value: 'newValue' } })
    expect(container).toMatchSnapshot()
    const deleteTag = container.querySelector('[data-icon="trash"]') as HTMLElement
    fireEvent.click(deleteTag!)
    expect(queryByText(container, 'keyLabel')).toBeNull()
    const addTags = container.querySelector('[data-icon="add"]') as HTMLElement
    fireEvent.click(addTags!)
    expect(getByText(container, 'keyLabel')).toBeTruthy()
    await waitFor(() => expect(onUpdateHandler).toHaveBeenCalled())
  })
  test('Validations Test', () => {
    const response = new SshWinRmAzureInfrastructureSpec().validateInputSet({
      data: {
        credentialsRef: '',
        connectorRef: '',
        subscriptionId: '',
        resourceGroup: '',
        hostConnectionType: 'Hostname',
        tags: {
          key: 'value'
        }
      },
      template: {
        credentialsRef: '<+input>',
        connectorRef: '<+input>',
        subscriptionId: '<+input>',
        resourceGroup: '<+input>',
        hostConnectionType: 'Hostname',
        tags: {
          key: 'value'
        }
      },
      viewType: StepViewType.TriggerForm
    })
    expect(response).toMatchSnapshot('Required Fields check snap')
  })
})

describe('Test Azure Infrastructure Spec autocomplete', () => {
  test('Test connector autocomplete', async () => {
    const step = new SshWinRmAzureInfrastructureSpec() as any
    let list: CompletionItemInterface[]

    list = await step.getConnectorsListForYaml(connectorRefPath, getYaml(), getParams())
    expect(list).toHaveLength(1)
    expect(list[0].insertText).toBe('azuretestconnector')

    list = await step.getConnectorsListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    list = await step.getConnectorsListForYaml(connectorRefPath, getInvalidYaml(), getParams())
    expect(list).toHaveLength(0)
  })

  test('Test subscription names autocomplete', async () => {
    const step = new SshWinRmAzureInfrastructureSpec() as any
    let list: CompletionItemInterface[]

    list = await step.getSubscriptionListForYaml(subscriptionPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('12d2db62-5aa9-471d-84bb-faa489b3e319')

    list = await step.getSubscriptionListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    list = await step.getSubscriptionListForYaml(subscriptionPath, getInvalidYaml(), getParams())
    expect(list).toHaveLength(0)
  })

  test('Test resource groups names autocomplete', async () => {
    const step = new SshWinRmAzureInfrastructureSpec() as any
    let list: CompletionItemInterface[]

    list = await step.getResourceGroupListForYaml(resourceGroupPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('NetworkWatcherRG')

    list = await step.getResourceGroupListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    list = await step.getResourceGroupListForYaml(resourceGroupPath, getInvalidYaml(), getParams())
    expect(list).toHaveLength(0)
  })
  test('Test tags names autocomplete', async () => {
    const step = new SshWinRmAzureInfrastructureSpec() as any
    let list: CompletionItemInterface[]

    list = await step.getTagsForYaml(subscriptionTagsPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('tag1')

    list = await step.getTagsForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    list = await step.getTagsForYaml(subscriptionTagsPath, getInvalidYaml(), getParams())
    expect(list).toHaveLength(0)
  })
})
