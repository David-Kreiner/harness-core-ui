/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, waitFor, queryByAttribute, screen } from '@testing-library/react'
import type { ResponseWaitStepExecutionDetailsDto } from 'services/pipeline-ng'
import { TestWrapper, UseGetMockData } from '@common/utils/testUtils'
import { ExecutionStatusEnum } from '@pipeline/utils/statusHelpers'
import executionMetadata from '@pipeline/components/execution/StepDetails/common/ExecutionContent/PolicyEvaluationContent/__mocks__/executionMetadata.json'
import { WaitStepDetailsTab } from '../WaitStepDetailsTab'
import { msToTime } from '../WaitStepDetailstabUtil'

const RealDate = Date.now

beforeAll(() => {
  global.Date.now = jest.fn(() => new Date('2019-04-07T10:20:30Z').getTime())
})

afterAll(() => {
  global.Date.now = RealDate
})

const data = (status: string, startTs: number | undefined, endTs: number | undefined, details: any) => ({
  uuid: 'VsAwQ8XLTP2uktP0IPopTQ',
  setupId: 'Oo8abCrwTOektJy6r-Q_QA',
  name: 'Wait',
  identifier: 'wait',
  baseFqn: 'pipeline.stages.test1.spec.execution.steps.wait',
  outcomes: {},
  startTs: startTs,
  endTs: endTs,
  stepParameters: {
    identifier: ['abc'],
    name: ['Wait'],
    failureStrategies: [
      {
        onFailure: {
          errors: ['AUTHENTICATION_ERROR'],
          action: {
            type: undefined
          }
        }
      }
    ],
    type: ['Wait'],
    spec: {
      duration: {
        __recast: 'io.harness.yaml.core.timeout.Timeout',
        timeoutString: '10m',
        timeoutInMillis: 600000
      },
      uuid: 'VqFkDdyHSEOZ7P-3AyRx5Q'
    }
  },
  stepType: 'Wait',
  status: status,
  failureInfo: {
    message: '',
    failureTypeList: [],
    responseMessages: []
  },
  skipInfo: undefined,
  nodeRunInfo: {
    whenCondition: '<+OnStageSuccess>',
    evaluatedCondition: true,
    expressions: [
      {
        expression: 'OnStageSuccess',
        expressionValue: 'true',
        count: 1
      }
    ]
  },
  executableResponses: [
    {
      async: {
        callbackIds: ['U_JW-LnoT8uxedli6iku_w'],
        logKeys: [],
        units: [],
        timeout: 600000
      }
    }
  ],
  unitProgresses: [],
  progressData: undefined,
  delegateInfoList: [],
  interruptHistories: [],
  stepDetails: details,
  strategyMetadata: undefined,
  executionInputConfigured: false
})
const mockDetailResponse: UseGetMockData<ResponseWaitStepExecutionDetailsDto> = {
  loading: false,
  // eslint-disable-next-line
  // @ts-ignore
  refetch: jest.fn(),
  data: {
    correlationId: '',
    status: 'SUCCESS',
    metaData: null as unknown as undefined,
    data: {
      createdAt: 123456789123,
      duration: 10,
      nodeExecutionId: 'abcd'
    }
  }
}

const mutate = jest.fn()
jest.mock('services/pipeline-ng', () => ({
  useExecutionDetails: jest.fn(() => mockDetailResponse),
  useMarkWaitStep: jest.fn(() => ({ mutate }))
}))

const showError = jest.fn()
jest.mock('@harness/uicore', () => ({
  ...jest.requireActual('@harness/uicore'),
  useToaster: jest.fn(() => ({ showError }))
}))

enum Strategies {
  MarkAsSuccess = 'MarkAsSuccess',
  MarkAsFailure = 'MarkAsFailure'
}
const AllStrategies = Object.values(Strategies)

describe('<WaitStepDetailsTab /> tests', () => {
  beforeEach(() => {
    mutate.mockClear()
    showError.mockClear()
  })

  test('snapshot test', () => {
    const details = {}
    const step = data(ExecutionStatusEnum.WaitStepRunning, undefined, undefined, details)
    const { container } = render(
      <TestWrapper>
        <WaitStepDetailsTab
          step={step as any}
          loading={false}
          executionDetails={mockDetailResponse.data}
          executionMetadata={executionMetadata}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('snapshot test after completion', () => {
    const details = { waitStepActionTaken: { actionTaken: 'MARK_AS_SUCCESS' } }
    const step = data(ExecutionStatusEnum.Success, undefined, undefined, details)
    const { container } = render(
      <TestWrapper>
        <WaitStepDetailsTab
          step={step as any}
          loading={false}
          executionDetails={mockDetailResponse.data}
          executionMetadata={executionMetadata}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
  test('snapshot test with no startTs and endTs', () => {
    const details = {}
    const step = data(ExecutionStatusEnum.WaitStepRunning, undefined, undefined, details)
    const { container } = render(
      <TestWrapper>
        <WaitStepDetailsTab
          step={step as any}
          loading={false}
          executionDetails={mockDetailResponse.data}
          executionMetadata={executionMetadata}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('snapshot test completed', () => {
    const details = {}
    const step = data(ExecutionStatusEnum.WaitStepRunning, undefined, undefined, details)
    const { container } = render(
      <TestWrapper>
        <WaitStepDetailsTab
          step={step as any}
          loading={false}
          executionDetails={mockDetailResponse.data}
          executionMetadata={executionMetadata}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('shows loading spinner when loading prop is true', () => {
    const details = {}
    const step = data(ExecutionStatusEnum.WaitStepRunning, undefined, undefined, details)
    const { container } = render(
      <TestWrapper>
        <WaitStepDetailsTab
          step={step as any}
          loading={true}
          executionDetails={mockDetailResponse.data}
          executionMetadata={executionMetadata}
        />
      </TestWrapper>
    )

    expect(container.querySelector('.bp3-spinner')).toBeInTheDocument()
  })

  test('renders duration and elapsed time', () => {
    const step = data(ExecutionStatusEnum.Success, 1670253216499, 1670253223862, {})
    render(
      <TestWrapper>
        <WaitStepDetailsTab
          step={step as any}
          loading={false}
          executionDetails={{
            data: {
              createdAt: 1670253216539,
              duration: 300000,
              nodeExecutionId: 'foo'
            }
          }}
          executionMetadata={executionMetadata}
        />
      </TestWrapper>
    )

    expect(screen.getByText('5 Minutes 0 Seconds')).toBeInTheDocument()
    expect(screen.getByText('7s')).toBeInTheDocument()
  })

  test.each(AllStrategies)('interrupt %s works', async strategy => {
    const details = {}
    const step = data(ExecutionStatusEnum.WaitStepRunning, 0, undefined, details)
    const { container } = render(
      <TestWrapper>
        <WaitStepDetailsTab
          step={step as any}
          loading={false}
          executionDetails={mockDetailResponse.data}
          executionMetadata={executionMetadata}
        />
      </TestWrapper>
    )

    const btn = queryByAttribute('value', container, strategy)!
    fireEvent.click(btn)
    const waitStepRequestDto = { action: strategy === 'MarkAsFailure' ? 'MARK_AS_FAIL' : 'MARK_AS_SUCCESS' }
    await waitFor(() => {
      expect(mutate).toHaveBeenLastCalledWith(waitStepRequestDto, {
        headers: { 'content-type': 'application/json' },
        queryParams: {
          accountIdentifier: 'acc',
          orgIdentifier: 'org',
          projectIdentifier: 'project'
        }
      })
    })
  })

  test(' ms to date function test case', () => {
    const epochTime = 123456789123
    const time = msToTime(epochTime)
    expect(time).toEqual('1428 Days 21 Hrs')
  })

  test(' ms to date function test case for seconds', () => {
    const epochTime = 1000
    const time = msToTime(epochTime)
    expect(time).toEqual('1 Second')
  })

  test(' ms to date function test case for minutes', () => {
    const epochTime = 70000
    const time = msToTime(epochTime)
    expect(time).toEqual('1 Minute 10 Seconds')
  })
  test(' ms to date function test case for hrs', () => {
    const epochTime = 5000000
    const time = msToTime(epochTime)
    expect(time).toEqual('1 Hr 23 Minutes')
  })
})
