import React from 'react'
import type { Meta, Story } from '@storybook/react'
import { Card, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { stringify } from 'yaml'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { StepWidgetProps } from '@pipeline/components/AbstractSteps/StepWidget'
import { factory, TestStepWidget } from '../__tests__/StepTestUtil'
import { K8sRollingRollbackStep } from './K8sRollingRollback'
factory.registerStep(new K8sRollingRollbackStep())

export default {
  title: 'Pipelines / Pipeline Steps / K8sRollingRollbackStep',
  // eslint-disable-next-line react/display-name
  component: TestStepWidget,
  argTypes: {
    type: { control: { disable: true } },
    stepViewType: {
      control: {
        type: 'inline-radio',
        options: Object.keys(StepViewType)
      }
    },
    onUpdate: { control: { disable: true } },
    initialValues: {
      control: {
        type: 'object'
      }
    }
  }
} as Meta

export const K8sRollingRollback: Story<Omit<StepWidgetProps, 'factory'>> = args => {
  const [value, setValue] = React.useState({})
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', columnGap: '20px' }}>
      <Card>
        <TestStepWidget {...args} onUpdate={setValue} />
      </Card>
      <Card>
        <pre>{stringify(value)}</pre>
      </Card>
    </div>
  )
}
K8sRollingRollback.args = {
  initialValues: { identifier: 'Test_A', type: StepType.K8sRollingRollback },
  type: StepType.K8sRollingRollback,
  stepViewType: StepViewType.Edit,
  path: '',
  template: {
    identifier: 'Test_A',
    type: StepType.K8sRollingRollback,
    spec: { timeout: RUNTIME_INPUT_VALUE }
  },
  allValues: {
    type: StepType.K8sRollingRollback,
    name: 'Test A',
    identifier: 'Test_A',
    spec: { timeout: RUNTIME_INPUT_VALUE }
  }
}
