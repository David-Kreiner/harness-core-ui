/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import { MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import type { UseGetMockData } from '@common/utils/testUtils'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type {
  ResponseConnectorResponse,
  ResponseJenkinsJobDetailsDTO,
  ResponsePageConnectorResponse
} from 'services/cd-ng'
import type { JenkinsStepDeploymentModeProps, JenkinsStepStepModeProps } from '../types'

export const getJenkinsStepEditModeProps = (): JenkinsStepStepModeProps => ({
  initialValues: {
    timeout: '5s',
    name: '',
    identifier: '',
    type: StepType.JenkinsBuild,
    spec: {
      connectorRef: '',
      jobName: '',
      jobParameter: [],
      delegateSelectors: [],
      unstableStatusAsSuccess: false,
      useConnectorUrlForJobExecution: false
    }
  },
  onUpdate: jest.fn(),
  stepViewType: StepViewType.Edit,
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
})

export const getJenkinsStepEditModePropsWithConnectorId = (): JenkinsStepStepModeProps => ({
  initialValues: {
    timeout: '5s',
    name: '',
    identifier: '',
    type: StepType.JenkinsBuild,
    spec: {
      connectorRef: 'cid1',
      jobName: '',
      jobParameter: [],
      delegateSelectors: [],
      unstableStatusAsSuccess: false,
      useConnectorUrlForJobExecution: false
    }
  },
  onUpdate: jest.fn(),
  stepViewType: StepViewType.Edit,
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
})

export const getJenkinsSteplEditModePropsWithValues = (): JenkinsStepStepModeProps => ({
  initialValues: {
    type: 'JenkinsBuild',
    name: 'ss',
    identifier: 'ss',
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
    timeout: '10m'
  },
  onUpdate: jest.fn(),
  onChange: jest.fn(),
  stepViewType: StepViewType.Edit,
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
})

export const getJenkinsStepDeploymentModeProps = (): JenkinsStepDeploymentModeProps => ({
  stepViewType: StepViewType.InputSet,
  initialValues: {
    identifier: 'ss',
    type: StepType.JenkinsBuild,
    spec: {
      jobName: '',
      connectorRef: '',
      delegateSelectors: [],
      jobParameter: []
    }
  },
  inputSetData: {
    template: {
      identifier: 'ss',
      type: StepType.JenkinsBuild,
      spec: {
        jobName: RUNTIME_INPUT_VALUE,
        connectorRef: '',
        delegateSelectors: [],
        jobParameter: []
      }
    },
    allValues: {
      type: StepType.JenkinsBuild,
      name: 'ss',
      identifier: 'ss',
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
        jobName: RUNTIME_INPUT_VALUE
      },
      timeout: '10m'
    },
    path: 'stages[0].stage.spec.execution.steps[0].step'
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
})

export const getJenkinsStepInputVariableModeProps = () => ({
  customStepProps: {
    variablesData: {
      type: 'JenkinsBuild',
      identifier: 'ss',
      name: '2EXRf9wXQ_WL9VaEGz1ziw',
      description: '-mBOU7zZSayg6MphoFJswQ',
      timeout: 'OX8p-G6UTLW9FHeYrwzctw',
      __uuid: 'HT0VrFaASNGWFBsFZX6NYQ',
      spec: {
        __uuid: '8Vgl2WAESmW2UrFeVGmbCw',
        connectorRef: 'b4Ab7Wq-SUKEU1euZu34SA',
        jobName: 'UMPJe_osQ1-3rL6PH33K7Q',
        jobParameter: [
          {
            name: 'iJeDEVzyQH2E3nNA0lLuRg',
            value: '10'
          }
        ],
        unstableStatusAsSuccess: false,
        useConnectorUrlForJobExecution: false,
        delegateSelectors: []
      }
    },
    metadataMap: {}
  },
  initialValues: {
    type: 'JenkinsBuild',
    name: 'ss',
    identifier: 'ss',
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
    timeout: '10m'
  },
  onUpdate: jest.fn()
})

export const mockConnectorResponse: UseGetMockData<ResponseConnectorResponse> = {
  loading: false,
  // eslint-disable-next-line
  // @ts-ignore
  refetch: jest.fn(),
  data: {
    correlationId: '',
    status: 'SUCCESS',
    metaData: null as unknown as undefined,
    data: {
      connector: { name: 'cid1', identifier: 'cid1', type: 'Jenkins', spec: {} }
    }
  }
}

export const mockConnectorsResponse: ResponsePageConnectorResponse = {
  correlationId: 'someid',
  status: 'SUCCESS',
  metaData: null as unknown as undefined,
  data: {
    content: [
      { connector: { name: 'cid1', identifier: 'cid1', type: 'Jenkins', spec: {} } },
      { connector: { name: 'cid2', identifier: 'cid2', type: 'Jenkins', spec: {} } }
    ]
  }
}

export const mockJobResponse: UseGetMockData<ResponseJenkinsJobDetailsDTO> = {
  loading: false,
  // eslint-disable-next-line
  // @ts-ignore
  refetch: jest.fn(),
  data: {
    status: 'SUCCESS',
    data: {
      jobDetails: [
        {
          jobName: 'automationNew',
          url: 'https://jenkins.dev.harness.io/job/automationNew/',
          parameters: [],
          folder: false
        },
        {
          jobName: 'AutomationQA',
          url: 'https://jenkins.dev.harness.io/job/AutomationQA/',
          parameters: [],
          folder: false
        }
      ]
    },
    metaData: {},
    correlationId: 'dc94e8bd-f662-4295-aee6-b66b5e46243c'
  }
}

export const mockJobParamterErrorResponse = {
  status: 'ERROR',
  code: 'ARTIFACT_SERVER_ERROR',
  message: 'Jenkins Get Job task failure due to error - Delegate task was never assigned and timed out.',
  correlationId: 'bd163c43-8062-41a1-ad5a-cbad4b552257',
  detailedMessage: null,
  responseMessages: [
    {
      code: 'ARTIFACT_SERVER_ERROR',
      level: 'ERROR',
      message: 'Jenkins Get Job task failure due to error - Delegate task was never assigned and timed out.',
      exception: null,
      failureTypes: []
    }
  ],
  metadata: null
}

export const mockJobParamterResponse = {
  status: 'SUCCESS',
  data: [
    {
      name: 'booleankey',
      options: ['true', 'false'],
      defaultValue: 'true',
      description: ''
    },
    {
      name: 'name',
      options: [],
      defaultValue: 'test name',
      description: ''
    },
    { name: 'test', options: [], defaultValue: '123', description: '' }
  ],
  metaData: null,
  correlationId: 'ad95ea52-11ea-43a3-ba16-e5c3312e6cb0'
}
