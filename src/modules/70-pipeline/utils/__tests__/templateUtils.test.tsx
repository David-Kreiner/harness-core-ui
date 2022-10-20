/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as uuid from 'uuid'
import { render } from '@testing-library/react'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { TestWrapper } from '@common/utils/testUtils'
import * as utils from '../templateUtils'
import { replaceDefaultValues } from '../templateUtils'

jest.mock('uuid')

const mockYaml =
  'template:\n  name: testTemplate123\n  identifier: testTemplate123\n  versionLabel: v1\n  type: Stage\n  projectIdentifier: Depanshu_gitx\n  orgIdentifier: default\n  tags: {}\n  spec:\n    type: Custom\n    spec:\n      execution:\n        steps:\n          - step:\n              name: vcxvv\n              identifier: vcxvv\n              template:\n                templateRef: account.RemoteStep1\n                versionLabel: v1\n                templateInputs:\n                  type: ShellScript\n                  spec:\n                    source:\n                      type: Inline\n                      spec:\n                        script: <+input>\n          - step:\n              name: s\n              identifier: s\n              template:\n                templateRef: account.Step12Oct\n                versionLabel: v1\n                templateInputs:\n                  type: ShellScript\n                  spec:\n                    source:\n                      type: Inline\n                      spec:\n                        script: <+input>\n'

jest.mock('services/template-ng', () => {
  return {
    ...jest.requireActual('services/template-ng'),
    getTemplateListPromise: jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 'SUCCESS',
        data: {
          content: [
            {
              identifier: 'testTemplate123',
              yaml: mockYaml
            }
          ]
        }
      })
    ),
    getTemplatePromise: jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 'SUCCESS',
        data: {
          identifier: 'testTemplate123',
          yaml: mockYaml
        }
      })
    )
  }
})

describe('templateUtils', () => {
  describe('createStepNodeFromTemplate tests', () => {
    const template: TemplateSummaryResponse = {
      accountId: 'px7xd_BFRCi-pfWPYXVjvw',
      childType: 'Http',
      description: '',
      identifier: 'Test_Http_Step',
      lastUpdatedAt: 1641755022840,
      name: 'Test Http Step',
      orgIdentifier: 'default',
      projectIdentifier: 'Yogesh_Test',
      stableTemplate: false,
      tags: {},
      templateEntityType: 'Step',
      templateScope: 'project',
      version: 0,
      versionLabel: 'v2',
      yaml: 'template:\n    name: Test Http Step\n    identifier: Test_Http_Step\n    versionLabel: v2\n    type: Step\n    projectIdentifier: Yogesh_Test\n    orgIdentifier: default\n    tags: {}\n    spec:\n        type: Http\n        timeout: 30s\n        spec:\n            url: <+input>\n            method: GET\n            headers: []\n            outputVariables: []\n            requestBody: <+input>\n'
    }
    test('when isCopied is false', () => {
      jest.spyOn(uuid, 'v5').mockReturnValue('MockedUUID')
      const result = utils.createStepNodeFromTemplate(template)
      expect(result).toEqual({
        name: 'Test Http Step',
        identifier: 'MockedUUID',
        template: { templateRef: 'Test_Http_Step', versionLabel: 'v2' }
      })
    })
    test('when isCopied is true', () => {
      jest.spyOn(uuid, 'v5').mockReturnValue('MockedUUID')
      const result = utils.createStepNodeFromTemplate(template, true)
      expect(result).toEqual({
        name: 'Test Http Step',
        identifier: 'MockedUUID',
        spec: {
          headers: [],
          method: 'GET',
          outputVariables: [],
          requestBody: '<+input>',
          url: '<+input>'
        },
        timeout: '30s',
        type: 'Http'
      })
    })
  })

  test('replaceDefaultValues test', () => {
    const template = {
      var1: '<+input>',
      var2: { var3: { var4: '<+input>', var5: '<+input>.default(myDefaultValue)' } },
      var6: '<+input>.default(myDefaultValue).executionInput()'
    }

    expect(replaceDefaultValues(template)).toEqual({
      var1: '<+input>',
      var2: { var3: { var4: '<+input>', var5: 'myDefaultValue' } },
      var6: '<+input>.default(myDefaultValue).executionInput()'
    })
  })

  test('getTemplateErrorMessage test', () => {
    const error1: any = {
      data: {
        message: 'error1'
      }
    }

    const error2: any = {
      data: {
        status: 'ERROR',
        code: 'INVALID_REQUEST',
        message:
          'Invalid request: Error while retrieving template with identifier [testDeletePipeline] and versionLabel [v1]',
        correlationId: 'dff1d3e3-997c-4428-9f5e-8a29f3cf2bbd',
        detailedMessage: null,
        responseMessages: [
          {
            code: 'INVALID_REQUEST',
            level: 'ERROR',
            message:
              'Invalid request: Error while retrieving template with identifier [testDeletePipeline] and versionLabel [v1]',
            exception: null,
            failureTypes: []
          },
          {
            code: 'HINT',
            level: 'INFO',
            message:
              'Please check the requested file path [.harness/testDeletePipeline_v1.yaml] / branch [main] / Github repo name [gitx] if they exist or not.',
            exception: null,
            failureTypes: []
          },
          {
            code: 'EXPLANATION',
            level: 'INFO',
            message:
              "The requested file path [.harness/testDeletePipeline_v1.yaml] doesn't exist in git. Possible reasons can be:\n1. The requested file path doesn't exist for given branch [main] and repo [gitx]\n2. The given branch [main] or repo [gitx] is invalid",
            exception: null,
            failureTypes: []
          },
          { code: 'SCM_BAD_REQUEST', level: 'ERROR', message: 'File not found', exception: null, failureTypes: [] }
        ],
        metadata: null
      }
    }

    expect(utils.getTemplateErrorMessage(error1)).toBe('error1')

    const { getByText } = render(<TestWrapper>{utils.getTemplateErrorMessage(error2, 'errorHandler')}</TestWrapper>)

    expect(
      getByText(
        'Invalid request: Error while retrieving template with identifier [testDeletePipeline] and versionLabel [v1]'
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        '- Please check the requested file path [.harness/testDeletePipeline_v1.yaml] / branch [main] / Github repo name [gitx] if they exist or not.'
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        "- The requested file path [.harness/testDeletePipeline_v1.yaml] doesn't exist in git. Possible reasons can be:"
      )
    ).toBeInTheDocument()
  })

  test('areTemplatesEqual test', () => {
    const template1 = {
      identifier: 'Test_Http_Step',
      name: 'Test Http Step',
      orgIdentifier: 'default',
      projectIdentifier: 'Test ID Proj',
      versionLabel: 'v2'
    }
    const template2 = Object.assign({}, template1)
    const template3 = Object.assign({}, template1, { versionLabel: 'v3' })

    expect(utils.areTemplatesEqual(template1, template2)).toBe(true)
    expect(utils.areTemplatesEqual(template1, template3)).toBe(false)
  })

  test('getTemplateNameWithLabel test', () => {
    const template1 = {
      name: 'Test Http Step',
      versionLabel: 'v2'
    }
    const template2 = {
      name: 'Test Http Step'
    }

    expect(utils.getTemplateNameWithLabel(template1)).toBe('Test Http Step (v2)')
    expect(utils.getTemplateNameWithLabel(template2)).toBe('Test Http Step (Stable)')
  })

  test('getTemplateRefVersionLabelObject test', () => {
    const template1 = {
      identifier: 'Test_Http_Step',
      name: 'Test Http Step',
      orgIdentifier: 'default',
      projectIdentifier: 'Test ID Proj',
      versionLabel: 'v2'
    }
    const template2 = {
      identifier: 'Test_Http_Step',
      name: 'Test Http Step',
      versionLabel: 'v2'
    }

    expect(utils.getTemplateRefVersionLabelObject(template1)).toStrictEqual({
      templateRef: 'Test_Http_Step',
      versionLabel: 'v2'
    })

    expect(utils.getTemplateRefVersionLabelObject(template2)).toStrictEqual({
      templateRef: 'account.Test_Http_Step',
      versionLabel: 'v2'
    })
  })

  test('getScopedTemplatesFromTemplateRefs', () => {
    expect(
      utils.getScopedTemplatesFromTemplateRefs(['account.T1', 'account.T2', 'org.T3', 'org.T4', 'T5', 'T6'])
    ).toStrictEqual({ account: ['T1', 'T2'], org: ['T3', 'T4'], project: ['T5', 'T6'] })
  })

  test('getTemplateTypesByRefV1', async () => {
    expect(
      await utils.getTemplateTypesByRef(
        {
          accountIdentifier: '123'
        },
        ['account.testTemplate123']
      )
    ).toStrictEqual({ templateTypes: { account: { testTemplate123: 'Custom' } }, templateServiceData: {} })
  })

  test('getTemplateTypesByRefV2', async () => {
    expect(
      await utils.getTemplateTypesByRef(
        {
          accountIdentifier: '123'
        },
        ['account.testTemplate123'],
        {
          storeType: 'REMOTE'
        },
        true
      )
    ).toStrictEqual({ templateTypes: { account: { testTemplate123: 'Custom' } }, templateServiceData: {} })
  })

  test('createTemplate', () => {
    expect(
      utils.createTemplate(
        {
          name: 'temp1',
          identifier: 'temp1'
        },
        {
          identifier: 'tempInner',
          versionLabel: 'v1'
        }
      )
    ).toStrictEqual({
      identifier: 'temp1',
      name: 'temp1',
      template: {
        templateInputs: undefined,
        templateRef: 'account.tempInner',
        versionLabel: 'v1'
      }
    })
  })

  test('getResolvedTemplateDetailsByRef', async () => {
    expect(
      await utils.getResolvedTemplateDetailsByRef(
        {
          accountIdentifier: '123',
          templateListType: 'Stable'
        },
        ['account.testTemplate123']
      )
    ).toStrictEqual({
      templateDetailsByRef: { account: { testTemplate123: { identifier: 'testTemplate123', yaml: mockYaml } } }
    })
  })
})
