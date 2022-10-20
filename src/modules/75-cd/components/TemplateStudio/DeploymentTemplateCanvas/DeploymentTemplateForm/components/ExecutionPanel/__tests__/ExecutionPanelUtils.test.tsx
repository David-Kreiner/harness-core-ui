/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { getUpdatedDeploymentConfig, getUpdatedTemplateDetailsByRef } from '../ExecutionPanelUtils'
import { stepTemplateMock } from './mocks'

describe('ExecutionPanel utils Test', () => {
  test('should return updated deployment config with added template ref', () => {
    const data = {
      templateRef: 'http_project_level',
      deploymentConfig: {
        infrastructure: {},
        execution: {
          stepTemplateRefs: ['org.http_org_level', 'account.accountSetup']
        }
      }
    }
    expect(getUpdatedDeploymentConfig(data)).toEqual({
      infrastructure: {},
      execution: {
        stepTemplateRefs: ['http_project_level', 'org.http_org_level', 'account.accountSetup']
      }
    })
  })

  test('should return updated TemplateDetailsByRef obj', () => {
    const data = {
      templateDetailsObj: stepTemplateMock,
      templateDetailsByRef: {},
      templateRef: 'http_project_level'
    }
    expect(getUpdatedTemplateDetailsByRef(data)).toEqual({
      http_project_level: stepTemplateMock
    })
  })
})
