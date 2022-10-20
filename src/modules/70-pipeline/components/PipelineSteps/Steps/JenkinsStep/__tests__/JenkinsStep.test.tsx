/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent, queryByAttribute, waitFor } from '@testing-library/react'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { TestStepWidget, factory } from '../../__tests__/StepTestUtil'
import {
  getJenkinsStepEditModeProps,
  getJenkinsStepEditModePropsWithConnectorId,
  getJenkinsSteplEditModePropsWithValues,
  getJenkinsStepDeploymentModeProps,
  mockConnectorResponse,
  mockJobResponse,
  mockJobParamterResponse,
  getJenkinsStepInputVariableModeProps
} from './JenkinsStepTestHelper'
import { JenkinsStep } from '../JenkinsStep'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/cd-ng', () => ({
  useGetConnector: () => mockConnectorResponse,
  useGetJobDetailsForJenkins: () => mockJobResponse,
  useGetJobParametersForJenkins: () => mockJobParamterResponse
}))
describe('Jira Approval fetch projects', () => {
  beforeAll(() => {
    // eslint-disable-next-line
    // @ts-ignore
    // useGetJiraProjects.mockImplementation(() => mockProjectsErrorResponse)
  })
  beforeEach(() => {
    factory.registerStep(new JenkinsStep())
  })
  test('show error if failed to fetch projects', () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = getJenkinsStepEditModePropsWithConnectorId()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.JenkinsBuild}
        stepViewType={StepViewType.Edit}
        ref={ref}
      />
    )
    expect(container).toMatchSnapshot()
  })
})

describe('Jenkins step tests', () => {
  beforeAll(() => {
    // eslint-disable-next-line
    // @ts-ignore
    // useGetJiraProjects.mockImplementation(() => mockProjectsResponse)
  })
  beforeEach(() => {
    factory.registerStep(new JenkinsStep())
  })

  test('Basic snapshot - inputset mode', async () => {
    const props = getJenkinsStepDeploymentModeProps()
    const { container, getByText, queryByText } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.JenkinsBuild}
        stepViewType={StepViewType.InputSet}
        inputSetData={props.inputSetData}
      />
    )

    fireEvent.click(getByText('Submit'))
    await waitFor(() => queryByText('Errors'))
    expect(container).toMatchSnapshot()
  })

  test('Basic snapshot - deploymentform mode', async () => {
    const props = getJenkinsStepDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.JenkinsBuild}
        stepViewType={StepViewType.DeploymentForm}
        inputSetData={props.inputSetData}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('deploymentform mode - readonly', async () => {
    const props = getJenkinsStepDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.JenkinsBuild}
        stepViewType={StepViewType.DeploymentForm}
        inputSetData={{ ...props.inputSetData, path: props.inputSetData?.path || '', readonly: true }}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('Basic snapshot - inputset mode but no runtime values', async () => {
    const props = getJenkinsStepDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.JenkinsBuild}
        template={props.inputSetData?.template}
        stepViewType={StepViewType.InputSet}
        inputSetData={props.inputSetData}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('Basic snapshot - input variable view', () => {
    const props = getJenkinsStepInputVariableModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.JenkinsBuild}
        stepViewType={StepViewType.InputVariable}
        customStepProps={props.customStepProps}
      />
    )

    expect(container).toMatchSnapshot('jira-approval-input variable view')
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test('Basic functions - edit stage view validations', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = getJenkinsStepEditModeProps()
    const { container, queryByText, getByText } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.JenkinsBuild}
        stepViewType={StepViewType.Edit}
        ref={ref}
      />
    )

    // Submit with empty form
    await act(() => ref.current?.submitForm()!)
    expect(queryByText('pipelineSteps.stepNameRequired')).toBeTruthy()

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    fireEvent.change(queryByNameAttribute('name')!, { target: { value: 'jenkins step' } })

    act(() => {
      fireEvent.click(getByText('pipelineSteps.timeoutLabel'))
    })
    fireEvent.change(queryByNameAttribute('timeout')!, { target: { value: '' } })

    await act(() => ref.current?.submitForm()!)
    expect(queryByText('validation.timeout10SecMinimum')).toBeTruthy()

    await act(() => ref.current?.submitForm()!)

    await waitFor(() => {
      expect(queryByText('pipeline.jenkinsStep.validations.jobName')).toBeTruthy()
    })
  })

  test('Edit stage - readonly', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = getJenkinsStepEditModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.JenkinsBuild}
        stepViewType={StepViewType.Edit}
        ref={ref}
        readonly={true}
      />
    )

    expect(container).toMatchSnapshot('edit stage view readonly')
  })

  test('Open a saved jenkins step - edit stage view', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = getJenkinsSteplEditModePropsWithValues()
    const { container, getByText, queryByDisplayValue, debug } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.JenkinsBuild}
        stepViewType={StepViewType.Edit}
        ref={ref}
        onUpdate={props.onUpdate}
      />
    )

    debug(container)

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    fireEvent.change(queryByNameAttribute('name')!, { target: { value: 'jenkins step' } })
    expect(queryByDisplayValue('10m')).toBeTruthy()

    expect(queryByDisplayValue('<+input>')).toBeTruthy()
    expect(queryByDisplayValue('x')).toBeTruthy()

    expect(queryByDisplayValue('10')).toBeTruthy()

    expect(getByText('pipeline.jenkinsStep.unstableStatusAsSuccess')).toBeTruthy()

    await act(() => ref.current?.submitForm()!)
    expect(props.onUpdate).toBeCalledWith({
      identifier: 'jenkins_step',
      timeout: '10m',
      type: StepType.JenkinsBuild,
      spec: {
        connectorRef: 'cid1',
        jobParameter: [
          {
            name: 'x',
            type: 'String',
            value: '10',
            id: 'f842f927-2ce7-41f5-8753-24f153eb3663'
          }
        ],
        delegateSelectors: [],
        unstableStatusAsSuccess: false,
        useConnectorUrlForJobExecution: false,
        jobName: '<+input>'
      },
      name: 'jenkins step'
    })
  })

  test('Minimum time cannot be less than 10s', () => {
    const response = new JenkinsStep().validateInputSet({
      data: {
        name: 'Test A',
        identifier: 'Test A',
        timeout: '1s',
        type: StepType.JenkinsBuild,
        spec: {
          connectorRef: '',
          jobName: '',
          jobParameter: [],
          delegateSelectors: []
        }
      },
      template: {
        name: 'Test A',
        identifier: 'Test A',
        timeout: '<+input>',
        type: StepType.JenkinsBuild,
        spec: {
          connectorRef: '',
          jobName: '',
          jobParameter: [],
          delegateSelectors: []
        }
      },
      viewType: StepViewType.TriggerForm
    })
    expect(response).toMatchSnapshot('Value must be greater than or equal to "10s"')
  })
})
