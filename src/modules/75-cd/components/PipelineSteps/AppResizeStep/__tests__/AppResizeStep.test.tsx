/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, render, waitFor } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { StepViewType, StepFormikRef } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import type { TasAppResizeStepInfo } from 'services/cd-ng'
import { AppResizeStep } from '../AppResizeStep'
import { InstanceTypes } from '../InstanceDropdownField'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
factory.registerStep(new AppResizeStep())

describe('Test AppResizeStep', () => {
  test('should render edit view as new step', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.AppResize} stepViewType={StepViewType.Edit} />
    )
    expect(container).toMatchSnapshot()
  })
  test('should render edit view as edit step with all runtime inputs', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'AppResize',
          name: 'App Resize Step',
          identifier: 'App_Resize_Step',
          spec: {
            timeout: RUNTIME_INPUT_VALUE,
            newAppInstances: {
              type: InstanceTypes.Count,
              spec: { value: RUNTIME_INPUT_VALUE }
            },
            oldAppInstances: {
              type: InstanceTypes.Count,
              spec: { value: RUNTIME_INPUT_VALUE }
            }
          }
        }}
        type={StepType.AppResize}
        stepViewType={StepViewType.Edit}
      />
    )
    expect(container).toMatchSnapshot()
  })
  test('should render input set view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{ identifier: 'App_Resize_Step', type: 'AppResize', spec: {} }}
        template={{
          identifier: 'App_Resize_Step',
          type: 'AppResize',
          spec: {
            timeout: RUNTIME_INPUT_VALUE,
            newAppInstances: {
              type: InstanceTypes.Count,
              spec: { value: RUNTIME_INPUT_VALUE }
            },
            oldAppInstances: {
              type: InstanceTypes.Count,
              spec: { value: RUNTIME_INPUT_VALUE }
            }
          }
        }}
        allValues={{
          type: 'AppResize',
          name: 'App Resize Step',
          identifier: 'App_Resize_Step',
          spec: {
            timeout: RUNTIME_INPUT_VALUE,
            newAppInstances: {
              type: InstanceTypes.Count,
              spec: { value: RUNTIME_INPUT_VALUE }
            },
            oldAppInstances: {
              type: InstanceTypes.Count,
              spec: { value: RUNTIME_INPUT_VALUE }
            }
          }
        }}
        type={StepType.AppResize}
        stepViewType={StepViewType.InputSet}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render edit view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          identifier: 'App_Resize_Step',
          type: 'AppResize',
          spec: {
            timeout: '10m',
            newAppInstances: { type: InstanceTypes.Count, spec: { value: 15 } },
            oldAppInstances: { type: InstanceTypes.Count, spec: { value: 15 } }
          }
        }}
        type={StepType.AppResize}
        stepViewType={StepViewType.Edit}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should submit with valid paylod for instace type count', async () => {
    const onUpdate = jest.fn()
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container } = render(
      <TestStepWidget
        initialValues={{
          identifier: 'App_Resize_Step',
          type: 'AppResize',
          timeout: '10m',
          spec: {
            newAppInstances: { spec: { value: 15 }, type: InstanceTypes.Count },
            oldAppInstances: { spec: { value: 15 }, type: InstanceTypes.Count }
          },
          name: 'App Resize Step'
        }}
        type={StepType.AppResize}
        ref={ref}
        stepViewType={StepViewType.Edit}
        onUpdate={onUpdate}
      />
    )

    await act(() => ref.current?.submitForm()!)

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith({
        identifier: 'App_Resize_Step',
        name: 'App Resize Step',
        spec: {
          newAppInstances: {
            spec: { value: 15 },
            type: InstanceTypes.Count
          },
          oldAppInstances: {
            spec: { value: 15 },
            type: InstanceTypes.Count
          }
        },
        timeout: '10m',
        type: 'AppResize'
      })
    )
    expect(container).toMatchSnapshot()
  })

  test('should submit with valid payload for instance type percentage', async () => {
    const onUpdate = jest.fn()
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container } = render(
      <TestStepWidget
        initialValues={{
          identifier: 'App_Resize_Step',
          type: 'AppResize',
          timeout: '10m',
          spec: {
            newAppInstances: {
              spec: { value: 20 },
              type: InstanceTypes.Percentage
            },
            oldAppInstances: {
              spec: { value: 20 },
              type: InstanceTypes.Percentage
            }
          },
          name: 'App Resize Step'
        }}
        type={StepType.AppResize}
        stepViewType={StepViewType.Edit}
        onUpdate={onUpdate}
        ref={ref}
      />
    )

    await act(() => ref.current?.submitForm()!)

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith({
        identifier: 'App_Resize_Step',
        name: 'App Resize Step',
        spec: {
          newAppInstances: {
            spec: { value: 20 },
            type: InstanceTypes.Percentage
          },
          oldAppInstances: {
            spec: { value: 20 },
            type: InstanceTypes.Percentage
          }
        },
        timeout: '10m',
        type: 'AppResize'
      })
    )
    expect(container).toMatchSnapshot()
    expect(onUpdate).toBeCalled()
  })

  test('on Edit view for instance type percentage', async () => {
    const onUpdate = jest.fn()
    const ref = React.createRef<StepFormikRef<unknown>>()

    render(
      <TestStepWidget
        initialValues={{
          identifier: 'App_Resize_Step',
          name: 'App Resize Step',
          timeout: '10m',
          spec: {
            newAppInstances: {
              spec: { value: 10 },
              type: InstanceTypes.Percentage
            },
            oldAppInstances: {
              spec: { value: 10 },
              type: InstanceTypes.Percentage
            }
          },
          type: 'AppResize'
        }}
        type={StepType.AppResize}
        stepViewType={StepViewType.Edit}
        onUpdate={onUpdate}
        ref={ref}
      />
    )
    await act(() => ref.current?.submitForm()!)

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith({
        identifier: 'App_Resize_Step',
        name: 'App Resize Step',
        spec: {
          newAppInstances: {
            spec: { value: 10 },
            type: InstanceTypes.Percentage
          },
          oldAppInstances: {
            spec: { value: 10 },
            type: InstanceTypes.Percentage
          }
        },
        timeout: '10m',
        type: 'AppResize'
      })
    )
  })

  test('on Edit view for instance type count', async () => {
    const onUpdate = jest.fn()
    const ref = React.createRef<StepFormikRef<unknown>>()

    render(
      <TestStepWidget
        initialValues={{
          identifier: 'App_Resize_Step',
          name: 'App Resize Step',
          timeout: '10m',
          spec: {
            newAppInstances: {
              spec: { value: 10 },
              type: InstanceTypes.Count
            },
            oldAppInstances: {
              spec: { value: 10 },
              type: InstanceTypes.Count
            }
          },
          type: 'AppResize'
        }}
        type={StepType.AppResize}
        stepViewType={StepViewType.Edit}
        onUpdate={onUpdate}
        ref={ref}
      />
    )
    await act(() => ref.current?.submitForm()!)

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith({
        identifier: 'App_Resize_Step',
        name: 'App Resize Step',
        spec: {
          newAppInstances: {
            spec: { value: 10 },
            type: InstanceTypes.Count
          },
          oldAppInstances: {
            spec: { value: 10 },
            type: InstanceTypes.Count
          }
        },
        timeout: '10m',
        type: 'AppResize'
      })
    )
  })

  test('should render variable view', () => {
    const onUpdate = jest.fn()
    const { container } = render(
      <TestStepWidget
        initialValues={{
          identifier: 'App_Resize_Step',
          name: 'App Resize Step',
          spec: {
            newAppInstances: {
              spec: { value: 10 },
              type: InstanceTypes.Percentage
            },
            oldAppInstances: {
              spec: { value: 10 },
              type: InstanceTypes.Percentage
            }
          },
          timeout: '10m',
          type: 'AppResize'
        }}
        type={StepType.AppResize}
        onUpdate={onUpdate}
        customStepProps={{
          stageIdentifier: 'qaStage',
          metadataMap: {
            'step-name': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.AppResize.name',
                localName: 'step.AppResize.name'
              }
            },

            'step-timeout': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.AppResize.timeout',
                localName: 'step.AppResize.timeout'
              }
            }
          },
          variablesData: {
            identifier: 'App_Resize_Step',
            name: 'step-name',
            spec: {
              newAppInstances: {
                spec: {
                  percentage: 10
                },
                type: InstanceTypes.Percentage
              },
              oldAppInstances: {
                spec: {
                  percentage: 10
                },
                type: InstanceTypes.Percentage
              }
            },
            timeout: 'step-timeout',
            type: 'AppResize'
          }
        }}
        stepViewType={StepViewType.InputVariable}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render null for StepviewType.template', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.AppResize} stepViewType={StepViewType.Template} />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render input set with percentage and timeout runtime', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{}}
        path={'/abc'}
        template={{
          identifier: 'App_Resize_Step',
          type: 'AppResize',
          timeout: RUNTIME_INPUT_VALUE,
          spec: {
            skipDryRun: RUNTIME_INPUT_VALUE,
            newAppInstances: {
              spec: { value: RUNTIME_INPUT_VALUE },
              type: InstanceTypes.Percentage
            },
            oldAppInstances: {
              spec: { value: RUNTIME_INPUT_VALUE },
              type: InstanceTypes.Percentage
            }
          }
        }}
        type={StepType.AppResize}
        stepViewType={StepViewType.InputSet}
      />
    )
    expect(container).toMatchSnapshot()
  })
  test('validate time to not be less than 10s', () => {
    const response = new AppResizeStep().validateInputSet({
      data: {
        name: 'App Resize Step',
        identifier: 'Test A',
        timeout: '1s',
        type: 'AppResize',
        spec: {
          newAppInstances: {
            spec: { value: '10' },
            type: InstanceTypes.Percentage
          },
          oldAppInstances: {
            spec: { value: '10' },
            type: InstanceTypes.Percentage
          }
        }
      },
      template: {
        name: 'App_Resize',
        identifier: 'App_Resize_Step',
        type: 'AppResize',
        timeout: RUNTIME_INPUT_VALUE,
        spec: {
          newAppInstances: {
            spec: { value: RUNTIME_INPUT_VALUE },
            type: InstanceTypes.Percentage
          },
          oldAppInstances: {
            spec: { value: RUNTIME_INPUT_VALUE },
            type: InstanceTypes.Percentage
          }
        }
      },
      viewType: StepViewType.TriggerForm
    })
    expect(response).toMatchSnapshot()
  })
  test('validate time to not be less than 10s with percentage as runtime', () => {
    const data = {
      data: {
        name: 'App Resize Step',
        identifier: 'Test A',
        timeout: '1s',
        type: 'AppResize',
        spec: {}
      } as any,
      template: {
        name: 'App_Resize',
        identifier: 'App_Resize_Step',
        type: 'AppResize',
        spec: {
          timeout: '1s',
          newAppInstances: {
            spec: { value: RUNTIME_INPUT_VALUE },
            type: InstanceTypes.Count
          },
          oldAppInstances: {
            spec: { value: RUNTIME_INPUT_VALUE },
            type: InstanceTypes.Count
          }
        } as TasAppResizeStepInfo
      },
      viewType: StepViewType.TriggerForm
    }
    const response = new AppResizeStep().validateInputSet(data)
    const processForm = new AppResizeStep().processFormData(data.template)
    expect(processForm).toMatchSnapshot()
    expect(response).toMatchSnapshot()
  })
})
