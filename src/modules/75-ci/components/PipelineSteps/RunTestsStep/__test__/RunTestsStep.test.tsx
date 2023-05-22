/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, waitFor, fireEvent } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { StepViewType, StepFormikRef } from '@pipeline/components/AbstractSteps/Step'
import { InputTypes, fillAtForm } from '@common/utils/JestFormHelper'
import * as FeatureFlag from '@common/hooks/useFeatureFlag'
import * as licenseStoreContextMock from 'framework/LicenseStore/LicenseStoreContext'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { findPopoverContainer, UseGetReturnData } from '@common/utils/testUtils'
import type { ResponseConnectorResponse } from 'services/cd-ng'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { CIBuildInfrastructureType } from '@pipeline/utils/constants'
import { RunTestsStep } from '../RunTestsStep'

jest.mock('@common/components/MonacoEditor/MonacoEditor')
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

export const ConnectorResponse: UseGetReturnData<ResponseConnectorResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      connector: {
        name: 'connectorRef',
        identifier: 'connectorRef',
        description: '',
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

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn(() => ConnectorResponse)
}))

jest.mock('../../CIStep/StepUtils', () => ({
  useGetPropagatedStageById: jest.fn(() => ({
    stage: { spec: { infrastructure: { type: CIBuildInfrastructureType.KubernetesDirect } } }
  }))
}))

describe('RunTests Step', () => {
  beforeAll(() => {
    factory.registerStep(new RunTestsStep())
  })

  describe('Edit View', () => {
    test('should render properly', async () => {
      jest.spyOn(FeatureFlag, 'useFeatureFlags').mockReturnValue({
        TI_DOTNET: true
      })
      const { container, getByText, findByText } = render(
        <TestStepWidget initialValues={{}} type={StepType.RunTests} stepViewType={StepViewType.Edit} />
      )

      expect(container).toMatchSnapshot()

      act(() => {
        fireEvent.click(getByText('pipeline.additionalConfiguration'))
      })

      const dropdownSelects = container.querySelectorAll('[icon="chevron-down"]')
      expect(dropdownSelects.length).toEqual(5)

      await waitFor(() => {
        fireEvent.click(dropdownSelects[1])
        const menuItemLabels = findPopoverContainer()?.querySelectorAll('[class*="menuItemLabel"]')
        expect(menuItemLabels?.length).toEqual(4)
        expect(menuItemLabels?.[0].innerHTML).toEqual('ci.runTestsStep.csharp')
        expect(menuItemLabels?.[1].innerHTML).toEqual('ci.runTestsStep.java')
        expect(menuItemLabels?.[2].innerHTML).toEqual('ci.runTestsStep.kotlin')
        expect(menuItemLabels?.[3].innerHTML).toEqual('ci.runTestsStep.scala')
        expect(findByText('ci.runTestsErrorTrackingSetupText')).not.toBeNull()
      })

      try {
        getByText('common.shell')
      } catch (err) {
        expect(err).toBeTruthy()
      }
    })

    test('Error tracking should render properly', async () => {
      jest.spyOn(FeatureFlag, 'useFeatureFlags').mockReturnValue({
        TI_DOTNET: true,
        CVNG_ENABLED: true
      })

      jest.spyOn(licenseStoreContextMock, 'useLicenseStore').mockReturnValue({
        licenseInformation: {
          CET: { status: 'ACTIVE' }
        }
      } as any)

      const { container, getByText } = render(
        <TestStepWidget initialValues={{}} type={StepType.RunTests} stepViewType={StepViewType.Edit} />
      )

      fireEvent.click(getByText('pipeline.additionalConfiguration'))
      const dropdownSelects = container.querySelectorAll('[icon="chevron-down"]')
      expect(dropdownSelects.length).toEqual(5)

      fireEvent.click(dropdownSelects[1])

      const menuItemLabels = findPopoverContainer()?.querySelectorAll('[class*="menuItemLabel"]')
      expect(menuItemLabels?.length).toBe(4)

      menuItemLabels ? fireEvent.click(menuItemLabels[1]) : fail('Language menu items are not present')
      expect(getByText('ci.runTestsErrorTrackingSetupText')).toBeDefined()

      expect(container).toMatchSnapshot()
    })

    test('renders runtime inputs', async () => {
      jest.spyOn(FeatureFlag, 'useFeatureFlags').mockReturnValue({
        TI_DOTNET: true
      })
      const initialValues = {
        identifier: 'My_Run_Step',
        name: 'My RunTests Step',
        description: RUNTIME_INPUT_VALUE,
        timeout: RUNTIME_INPUT_VALUE,
        spec: {
          connectorRef: RUNTIME_INPUT_VALUE,
          image: RUNTIME_INPUT_VALUE,
          language: 'Java',
          buildTool: 'Bazel',
          args: RUNTIME_INPUT_VALUE,
          packages: RUNTIME_INPUT_VALUE,
          runOnlySelectedTests: RUNTIME_INPUT_VALUE,
          testAnnotations: RUNTIME_INPUT_VALUE,
          preCommand: RUNTIME_INPUT_VALUE,
          postCommand: RUNTIME_INPUT_VALUE,
          reports: {
            type: 'JUnit',
            spec: {
              paths: RUNTIME_INPUT_VALUE
            }
          },
          envVariables: RUNTIME_INPUT_VALUE,
          outputVariables: RUNTIME_INPUT_VALUE,
          // TODO: Right now we do not support Image Pull Policy but will do in the future
          // pull: RUNTIME_INPUT_VALUE,
          resources: {
            limits: {
              cpu: RUNTIME_INPUT_VALUE,
              memory: RUNTIME_INPUT_VALUE
            }
          }
        }
      }

      const onUpdate = jest.fn()
      const ref = React.createRef<StepFormikRef<unknown>>()
      const { container } = render(
        <TestStepWidget
          initialValues={initialValues}
          type={StepType.RunTests}
          stepViewType={StepViewType.Edit}
          onUpdate={onUpdate}
          ref={ref}
        />
      )

      expect(container).toMatchSnapshot()

      await act(() => ref.current?.submitForm()!)

      expect(onUpdate).toHaveBeenCalledWith(initialValues)
    })

    // TODO Fix flaky test
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('edit mode works', async () => {
      const initialValues = {
        identifier: 'My_Run_Step',
        name: 'My RunTests Step',
        description: 'Description',
        timeout: '10s',
        spec: {
          connectorRef: 'account.connectorRef',
          image: 'image',
          language: 'Java',
          buildTool: 'Maven',
          args: '-Dmaven.test.failure.ignore=true -T 2C test -e -Dbuild.number=${BUILD_NUMBER}',
          packages: 'io.harness., software.wings., migrations.',
          runOnlySelectedTests: false,
          testAnnotations: 'org.junit.Test, org.junit.jupiter.api.Test, org.testng.annotations.Test',
          preCommand: 'pre command',
          postCommand: 'post command',
          reports: {
            type: 'JUnit',
            spec: {
              paths: ['path1.xml', 'path2.xml', 'path3.xml', 'path4.xml', 'path5.xml']
            }
          },
          envVariables: {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3'
          },
          outputVariables: [{ name: 'variable1' }, { name: 'variable2' }, { name: 'variable3' }, { name: 'variable4' }],
          // TODO: Right now we do not support Image Pull Policy but will do in the future
          // pull: 'always',
          resources: {
            limits: {
              memory: '128Mi',
              cpu: '0.2'
            }
          }
        }
      }

      const onUpdate = jest.fn()
      const ref = React.createRef<StepFormikRef<unknown>>()
      const { container } = render(
        <TestStepWidget
          initialValues={initialValues}
          type={StepType.RunTests}
          stepViewType={StepViewType.Edit}
          onUpdate={onUpdate}
          ref={ref}
        />
      )

      expect(container).toMatchSnapshot()

      await act(() => ref.current?.submitForm()!)

      expect(onUpdate).toHaveBeenCalledWith(initialValues)
    })
  })

  describe('InputSet View', () => {
    test('should render properly', () => {
      const { container } = render(
        <TestStepWidget initialValues={{}} type={StepType.RunTests} stepViewType={StepViewType.InputSet} />
      )

      expect(container).toMatchSnapshot()
    })

    test('should render all fields', async () => {
      const template = {
        type: StepType.RunTests,
        identifier: 'My_Run_Step',
        description: RUNTIME_INPUT_VALUE,
        timeout: RUNTIME_INPUT_VALUE,
        spec: {
          connectorRef: RUNTIME_INPUT_VALUE,
          image: RUNTIME_INPUT_VALUE,
          args: RUNTIME_INPUT_VALUE,
          packages: RUNTIME_INPUT_VALUE,
          runOnlySelectedTests: RUNTIME_INPUT_VALUE,
          testAnnotations: RUNTIME_INPUT_VALUE,
          preCommand: RUNTIME_INPUT_VALUE,
          postCommand: RUNTIME_INPUT_VALUE,
          reports: {
            type: 'JUnit',
            spec: {
              paths: RUNTIME_INPUT_VALUE
            }
          },
          envVariables: RUNTIME_INPUT_VALUE,
          outputVariables: RUNTIME_INPUT_VALUE,
          // TODO: Right now we do not support Image Pull Policy but will do in the future
          // pull: RUNTIME_INPUT_VALUE,
          resources: {
            limits: {
              cpu: RUNTIME_INPUT_VALUE,
              memory: RUNTIME_INPUT_VALUE
            }
          }
        }
      }

      const allValues = {
        type: StepType.RunTests,
        name: 'Test A',
        identifier: 'My_Run_Step',
        description: RUNTIME_INPUT_VALUE,
        timeout: RUNTIME_INPUT_VALUE,
        spec: {
          connectorRef: RUNTIME_INPUT_VALUE,
          image: RUNTIME_INPUT_VALUE,
          args: RUNTIME_INPUT_VALUE,
          packages: RUNTIME_INPUT_VALUE,
          runOnlySelectedTests: RUNTIME_INPUT_VALUE,
          testAnnotations: RUNTIME_INPUT_VALUE,
          preCommand: RUNTIME_INPUT_VALUE,
          postCommand: RUNTIME_INPUT_VALUE,
          reports: {
            type: 'JUnit',
            spec: {
              paths: RUNTIME_INPUT_VALUE
            }
          },
          envVariables: RUNTIME_INPUT_VALUE,
          outputVariables: RUNTIME_INPUT_VALUE,
          // TODO: Right now we do not support Image Pull Policy but will do in the future
          // pull: RUNTIME_INPUT_VALUE,
          resources: {
            limits: {
              cpu: RUNTIME_INPUT_VALUE,
              memory: RUNTIME_INPUT_VALUE
            }
          }
        }
      }

      const onUpdate = jest.fn()

      const { container } = render(
        <TestStepWidget
          initialValues={{}}
          type={StepType.RunTests}
          template={template}
          allValues={allValues}
          stepViewType={StepViewType.InputSet}
          onUpdate={onUpdate}
        />
      )

      expect(container).toMatchSnapshot()
    })

    test('should not render any fields', async () => {
      const template = {
        type: StepType.RunTests,
        identifier: 'My_Run_Step'
      }

      const allValues = {
        type: StepType.RunTests,
        identifier: 'My_Run_Step',
        name: 'My RunTests Step',
        description: 'Description',
        timeout: '10s',
        spec: {
          connectorRef: 'account.connectorRef',
          image: 'image',
          language: 'Java',
          buildTool: 'Maven',
          args: '-Dmaven.test.failure.ignore=true -T 2C test -e -Dbuild.number=${BUILD_NUMBER}',
          packages: 'io.harness., software.wings., migrations.',
          runOnlySelectedTests: false,
          testAnnotations: 'org.junit.Test, org.junit.jupiter.api.Test, org.testng.annotations.Test',
          preCommand: 'pre command',
          postCommand: 'post command',
          reports: {
            type: 'JUnit',
            spec: {
              paths: ['path1.xml', 'path2.xml', 'path3.xml', 'path4.xml', 'path5.xml']
            }
          },
          envVariables: {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3'
          },
          outputVariables: [{ name: 'variable1' }, { name: 'variable2' }, { name: 'variable3' }, { name: 'variable4' }],
          // TODO: Right now we do not support Image Pull Policy but will do in the future
          // pull: 'always',
          resources: {
            limits: {
              memory: '128Mi',
              cpu: '0.2'
            }
          }
        }
      }

      const onUpdate = jest.fn()

      const { container } = render(
        <TestStepWidget
          initialValues={{}}
          type={StepType.RunTests}
          template={template}
          allValues={allValues}
          stepViewType={StepViewType.InputSet}
          onUpdate={onUpdate}
        />
      )

      expect(container).toMatchSnapshot()
    })
  })

  describe('InputVariable View', () => {
    test('should render properly', () => {
      const { container } = render(
        <TestStepWidget
          initialValues={{
            identifier: 'My_Run_Step',
            name: 'My RunTests Step',
            description: 'Description',
            timeout: '10s',
            spec: {
              connectorRef: 'account.connectorRef',
              image: 'image',
              language: 'Java',
              buildTool: 'Maven',
              args: '-Dmaven.test.failure.ignore=true -T 2C test -e -Dbuild.number=${BUILD_NUMBER}',
              packages: 'io.harness., software.wings., migrations.',
              runOnlySelectedTests: false,
              testAnnotations: 'org.junit.Test, org.junit.jupiter.api.Test, org.testng.annotations.Test',
              preCommand: 'pre command',
              postCommand: 'post command',
              reports: {
                type: 'JUnit',
                spec: {
                  paths: ['path1.xml', 'path2.xml', 'path3.xml', 'path4.xml', 'path5.xml']
                }
              },
              envVariables: {
                key1: 'value1',
                key2: 'value2',
                key3: 'value3'
              },
              outputVariables: [
                { name: 'variable1' },
                { name: 'variable2' },
                { name: 'variable3' },
                { name: 'variable4' }
              ],
              // TODO: Right now we do not support Image Pull Policy but will do in the future
              // pull: 'always',
              resources: {
                limits: {
                  memory: '128Mi',
                  cpu: '0.2'
                }
              }
            }
          }}
          customStepProps={{
            stageIdentifier: 'qaStage',
            metadataMap: {
              'step-name': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.name',
                  localName: 'step.runTests.name'
                }
              },
              'step-identifier': {
                yamlExtraProperties: {
                  properties: [
                    {
                      fqn: 'pipeline.stages.qaStage.execution.steps.runTests.identifier',
                      localName: 'step.runTests.identifier',
                      variableName: 'identifier'
                    }
                  ]
                }
              },
              'step-description': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.description',
                  localName: 'step.runTests.description'
                }
              },
              'step-timeout': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.timeout',
                  localName: 'step.runTests.timeout'
                }
              },
              'step-connectorRef': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.connectorRef',
                  localName: 'step.runTests.spec.connectorRef'
                }
              },
              'step-image': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.image',
                  localName: 'step.runTests.spec.image'
                }
              },
              'step-language': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.language',
                  localName: 'step.runTests.spec.language'
                }
              },
              'step-buildTool': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.buildTool',
                  localName: 'step.runTests.spec.buildTool'
                }
              },
              'step-args': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.args',
                  localName: 'step.runTests.spec.args'
                }
              },
              'step-packages': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.packages',
                  localName: 'step.runTests.spec.packages'
                }
              },
              'step-runOnlySelectedTests': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.runOnlySelectedTests',
                  localName: 'step.runTests.spec.runOnlySelectedTests'
                }
              },
              'step-testAnnotations': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.testAnnotations',
                  localName: 'step.runTests.spec.testAnnotations'
                }
              },
              'step-preCommand': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.preCommand',
                  localName: 'step.runTests.spec.preCommand'
                }
              },
              'step-postCommand': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.postCommand',
                  localName: 'step.runTests.spec.postCommand'
                }
              },
              'step-reportPaths': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.reports.spec.paths',
                  localName: 'step.runTests.spec.reports.spec.paths'
                }
              },
              'step-envVariables': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.spec.runTests.envVariables',
                  localName: 'step.runTests.spec.envVariables'
                }
              },
              'step-outputVariables': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.outputVariables',
                  localName: 'step.runTests.spec.outputVariables'
                }
              },
              // TODO: Right now we do not support Image Pull Policy but will do in the future
              // 'step-pull': {
              //   yamlProperties: {
              //     fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.pull',
              //     localName: 'step.runTests.spec.pull'
              //   }
              // },
              'step-limitMemory': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.resources.limits.memory',
                  localName: 'step.runTests.spec.resources.limits.memory'
                }
              },
              'step-limitCPU': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.runTests.spec.resources.limits.cpu',
                  localName: 'step.runTests.resources.spec.limits.cpu'
                }
              }
            },
            variablesData: {
              type: StepType.RunTests,
              __uuid: 'step-identifier',
              identifier: 'runTests',
              name: 'step-name',
              description: 'step-description',
              timeout: 'step-timeout',
              spec: {
                connectorRef: 'step-connectorRef',
                image: 'step-image',
                language: 'step-language',
                buildTool: 'step-buildTool',
                args: 'step-args',
                packages: 'step-packages',
                runOnlySelectedTests: 'step-runOnlySelectedTests',
                testAnnotations: 'step-testAnnotations',
                preCommand: 'step-preCommand',
                postCommand: 'step-postCommand',
                reports: {
                  spec: {
                    paths: 'step-reportPaths'
                  }
                },
                envVariables: 'step-envVariables',
                outputVariables: 'step-outputVariables',
                // TODO: Right now we do not support Image Pull Policy but will do in the future
                // pull: 'step-pull',
                resources: {
                  limits: {
                    memory: 'step-limitMemory',
                    cpu: 'step-limitCPU'
                  }
                }
              }
            }
          }}
          type={StepType.RunTests}
          stepViewType={StepViewType.InputVariable}
        />
      )

      expect(container).toMatchSnapshot()
    })
  })

  describe('Add Step', () => {
    test('should render properly for FF CI_PYTHON_TI', async () => {
      jest.spyOn(FeatureFlag, 'useFeatureFlags').mockReturnValue({
        CI_PYTHON_TI: true
      })
      const { container, getByText } = render(
        <TestStepWidget initialValues={{}} type={StepType.RunTests} stepViewType={StepViewType.Edit} />
      )

      act(() => {
        fireEvent.click(getByText('pipeline.additionalConfiguration'))
      })

      const dropdownSelects = container.querySelectorAll('[icon="chevron-down"]')

      await waitFor(() => {
        // Language dropdown
        fireEvent.click(dropdownSelects[1])
        const menuItemLabels = findPopoverContainer()?.querySelectorAll('[class*="menuItemLabel"]')
        expect(menuItemLabels?.length).toEqual(5)
        expect(menuItemLabels?.[0].innerHTML).toEqual('ci.runTestsStep.csharp')
        expect(menuItemLabels?.[1].innerHTML).toEqual('ci.runTestsStep.java')
        expect(menuItemLabels?.[2].innerHTML).toEqual('ci.runTestsStep.kotlin')
        expect(menuItemLabels?.[3].innerHTML).toEqual('ci.runTestsStep.scala')
        expect(menuItemLabels?.[4].innerHTML).toEqual('common.python')
      })

      fillAtForm([
        {
          container,
          type: InputTypes.SELECT,
          fieldId: 'spec.language',
          value: 'Python'
        }
      ])

      await waitFor(() => {
        // Build tool dropdown
        fireEvent.click(dropdownSelects[2])
        const menuItemLabels = findPopoverContainer()?.querySelectorAll('[class*="menuItemLabel"]')
        expect(menuItemLabels?.length).toEqual(2)
        expect(menuItemLabels?.[0].innerHTML).toEqual('ci.runTestsStep.pytest')
        expect(menuItemLabels?.[1].innerHTML).toEqual('ci.runTestsStep.unittest')
      })

      expect(getByText('ci.runTestsStep.testRoot')).toBeInTheDocument()
      expect(getByText('ci.runTestsStep.testGlobs')).toBeInTheDocument()
    })
  })
})
