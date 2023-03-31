/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { UseGetReturnData, UseMutateMockData } from '@common/utils/testUtils'
import type { ResponseConnectorResponse } from 'services/cd-ng'
import type {
  ResponseInputSetTemplateResponse,
  ResponseInputSetResponse,
  ResponsePageInputSetSummaryResponse,
  ResponseMergeInputSetResponse,
  ResponseOverlayInputSetResponse,
  ResponseInputSetYamlDiff
} from 'services/pipeline-ng'

export const TemplateResponse: UseGetReturnData<ResponseInputSetTemplateResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml:
        'pipeline:\n  identifier: "testqqq"\n  stages:\n  - stage:\n      identifier: "asd"\n      type: "Deployment"\n      spec:\n        infrastructure:\n          infrastructureDefinition:\n            type: "KubernetesDirect"\n            spec:\n              connectorRef: "<+input>"\n              namespace: "<+input>"\n              releaseName: "<+input>"\n'
    },
    correlationId: '54a0c3b6-62aa-4f19-ba57-ab69599299b0'
  }
}

export const ConnectorResponse: UseGetReturnData<ResponseConnectorResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      connector: {
        name: 'tesa1',
        identifier: 'tesa1',
        description: '',
        orgIdentifier: 'Harness11',
        tags: {},
        type: 'K8sCluster',
        spec: {
          credential: {
            type: 'ManualConfig',
            spec: {
              masterUrl: 'asd',
              auth: { type: 'UsernamePassword', spec: { username: 'asd', passwordRef: 'account.test1111' } }
            }
          }
        }
      },
      createdAt: 1602062958274,
      lastModifiedAt: 1602062958274
    },
    correlationId: 'e1841cfc-9ed5-4f7c-a87b-c9be1eeaae34'
  }
}

export const GetInputSetsResponse: UseGetReturnData<ResponsePageInputSetSummaryResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      totalPages: 1,
      totalItems: 2,
      pageItemCount: 2,
      pageSize: 20,
      content: [
        {
          identifier: 'OverLayInput',
          name: 'OverLayInput',
          pipelineIdentifier: 'testqqq',
          description: 'OverLayInput',
          inputSetType: 'OVERLAY_INPUT_SET',
          overlaySetErrorDetails: {
            b: 'overlay field invalid'
          }
        },
        {
          identifier: 'asd',
          name: 'asd',
          pipelineIdentifier: 'testqqq',
          description: 'asd',
          inputSetType: 'INPUT_SET',
          inputSetErrorDetails: {
            uuidToErrorResponseMap: {
              a: {
                errors: [{ fieldName: 'a', message: 'a field invalid' }]
              }
            }
          }
        }
      ],
      pageIndex: 0,
      empty: false
    },
    correlationId: '946eea4b-3984-4ef4-932b-df496612b631'
  }
}

export const ValidInputSetsListResponse: UseGetReturnData<ResponsePageInputSetSummaryResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      totalPages: 1,
      totalItems: 2,
      pageItemCount: 2,
      pageSize: 20,
      content: [
        {
          identifier: 'OverLayInputSet1',
          name: 'OverLay Input Set 1',
          pipelineIdentifier: 'testqqq',
          description: 'OverLayInput',
          inputSetType: 'OVERLAY_INPUT_SET'
        },
        {
          identifier: 'Input_Set_1',
          name: 'Input Set 1',
          pipelineIdentifier: 'testqqq',
          description: 'IS1',
          inputSetType: 'INPUT_SET'
        }
      ],
      pageIndex: 0,
      empty: false
    },
    correlationId: '946eea4b-3984-4ef4-932b-df496612b631'
  }
}

export const GetInputSetEdit: UseGetReturnData<ResponseInputSetResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      accountId: 'kmpySmUISimoRrJL6NL73w',
      orgIdentifier: 'Harness11',
      projectIdentifier: 'Uhat_Project',
      pipelineIdentifier: 'testqqq',
      identifier: 'asd',
      inputSetYaml:
        'inputSet:\n  name: asd\n  identifier: asd\n  description: asd\n  pipeline:\n    identifier: testqqq\n    stages:\n      - stage:\n          identifier: asd\n          type: Deployment\n          spec:\n            infrastructure:\n              infrastructureDefinition:\n                type: KubernetesDirect\n                spec:\n                  connectorRef: org.tesa1\n                  namespace: asd\n                  releaseName: asd\n',
      name: 'asd',
      description: 'asd',
      errorResponse: false
    },
    correlationId: 'fdb1358f-c3b8-459b-aa89-4e570b7ac6d0'
  }
}

export const GetOverlayInputSetEdit: UseGetReturnData<ResponseOverlayInputSetResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      accountId: 'kmpySmUISimoRrJL6NL73w',
      orgIdentifier: 'Harness11',
      projectIdentifier: 'Uhat_Project',
      pipelineIdentifier: 'testqqq',
      identifier: 'OverLayInput',
      name: 'OverLayInput',
      description: 'OverLayInput',
      inputSetReferences: ['asd', 'test'],
      overlayInputSetYaml:
        'overlayInputSet:\n  name: OverLayInput\n  identifier: OverLayInput\n  description: OverLayInput\n  inputSetReferences:\n    - asd\n    - test\n',
      errorResponse: false
    },
    correlationId: '4cccf1ad-e86d-4629-9c85-95a23225f2e4'
  }
}

export const MergeInputSetResponse: UseMutateMockData<ResponseMergeInputSetResponse> = {
  loading: false,
  mutate: () =>
    Promise.resolve({
      status: 'SUCCESS',
      data: {
        pipelineYaml:
          'pipeline:\n  identifier: "testqqq"\n  stages:\n  - stage:\n      identifier: "asd"\n      type: "Deployment"\n      spec:\n        infrastructure:\n          infrastructureDefinition:\n            type: "KubernetesDirect"\n            spec:\n              connectorRef: "org.tesa1"\n              namespace: "asd"\n              releaseName: "asd"\n',
        inputSetErrorWrapper: {},
        errorResponse: false
      },
      correlationId: 'ec1dec41-213d-4164-8cfc-4198d6565f88'
    })
}

export const GetInputSetYamlDiff: UseGetReturnData<ResponseInputSetYamlDiff> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      oldYAML:
        'inputSet:\n  identifier: "asd"\n  name: "asd"\n  tags: {}\n  orgIdentifier: "Harness11"\n  projectIdentifier: "Uhat_Project"\n  pipeline:\n    identifier: "testqqq"\n    stages:\n     - stage:\n        identifier: "stg1"\n        type: "Custom"\n        spec:\n          execution:\n            steps:\n            - step:\n                identifier: "stp1"\n                type: "Http"\n                spec:\n                  url: "https://test.com"\n                  method: "GET"\n                  requestBody: "req"\n',
      newYAML:
        'inputSet:\n  identifier: "asd"\n  name: "asd"\n  tags: {}\n  orgIdentifier: "Harness11"\n  projectIdentifier: "Uhat_Project"\n  pipeline:\n    identifier: "testqqq"\n    stages:\n     - stage:\n        identifier: "stg1"\n        type: "Custom"\n        spec:\n          execution:\n            steps:\n            - step:\n                identifier: "stp1"\n                type: "Http"\n                spec:\n                  url: "https://test.com"\n                  method: "GET"\n',
      noUpdatePossible: false,
      inputSetEmpty: false
    },
    correlationId: '2a9de950-6094-4022-9596-a7697071c15f'
  }
}

export const GetOverlayISYamlDiff: UseGetReturnData<ResponseInputSetYamlDiff> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      oldYAML:
        'overlayInputSet:\n  name: "OverLayInput"\n  identifier: "OverLayInput"\n  orgIdentifier: "Harness11"\n  projectIdentifier: "Uhat_Project"\n  pipelineIdentifier: "testpip"\n  inputSetReferences:\n  - "testInp2"\n  - "testInp1"\n  tags: {}\n',
      newYAML:
        'overlayInputSet:\n  name: "OverLayInput"\n  identifier: "OverLayInput"\n  orgIdentifier: "Harness11"\n  projectIdentifier: "Uhat_Project"\n  pipelineIdentifier: "testpip"\n  inputSetReferences:\n  - "testInp2"\n  tags: {}\n',
      noUpdatePossible: false,
      invalidReferences: ['testInp1'],
      inputSetEmpty: false
    },
    correlationId: '4ead5c76-39e9-4a00-b1b8-4f68baf5bf15'
  }
}
