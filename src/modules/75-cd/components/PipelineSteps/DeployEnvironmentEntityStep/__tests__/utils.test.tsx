/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import type { DeployEnvironmentEntityConfig, DeployEnvironmentEntityFormState } from '../types'
import { processInitialValues, processFormValues } from '../utils'

describe('process initial values', () => {
  test('clean slate', () => {
    const output = processInitialValues({}, { gitOpsEnabled: false })

    expect(output).toEqual({
      category: 'single'
    })
  })

  test('environment ref selected', () => {
    const output = processInitialValues(
      {
        environment: {
          environmentRef: 'Env_1',
          deployToAll: false,
          infrastructureDefinitions: [
            {
              identifier: 'Infra_1'
            }
          ]
        }
      },
      { gitOpsEnabled: false }
    )

    expect(output).toEqual({
      category: 'single',
      environment: 'Env_1',
      environmentInputs: {
        Env_1: undefined
      },
      infrastructure: 'Infra_1',
      infrastructureInputs: {
        Env_1: {
          Infra_1: undefined
        }
      }
    } as DeployEnvironmentEntityFormState)
  })

  test('environments selected', () => {
    const output = processInitialValues(
      {
        environments: {
          metadata: {
            parallel: false
          },
          values: [
            {
              environmentRef: 'Env_1',
              deployToAll: true
            }
          ]
        }
      },
      { gitOpsEnabled: false }
    )

    expect(output).toEqual({
      category: 'multi',
      environments: [{ label: 'Env_1', value: 'Env_1' }],
      environmentInputs: {
        Env_1: undefined
      },
      infrastructures: { Env_1: undefined as any },
      parallel: false
    } as DeployEnvironmentEntityFormState)
  })

  test('environment group selected ', () => {
    const output = processInitialValues(
      {
        environmentGroup: {
          envGroupRef: 'Env_Group_1',
          deployToAll: true,
          environments: RUNTIME_INPUT_VALUE as any
        }
      },
      { gitOpsEnabled: false }
    )

    expect(output).toEqual({
      category: 'group',
      environmentGroup: 'Env_Group_1',
      environmentInputs: {},
      infrastructures: {},
      infrastructureInputs: {}
    } as DeployEnvironmentEntityFormState)
  })
})

describe('process form values', () => {
  test('clean slate', () => {
    const output = processInitialValues({}, { gitOpsEnabled: false })

    expect(output).toEqual({
      category: 'single'
    })
  })

  test('environment ref selected', () => {
    const output = processFormValues(
      {
        category: 'single',
        environment: 'Env_1',
        environmentInputs: {
          Env_1: undefined
        },
        infrastructure: 'Infra_1',
        infrastructureInputs: {
          Env_1: {
            Infra_1: undefined
          }
        }
      },
      { gitOpsEnabled: false }
    )

    expect(output).toEqual({
      environment: {
        environmentRef: 'Env_1',
        deployToAll: false,
        infrastructureDefinitions: [
          {
            identifier: 'Infra_1'
          }
        ]
      }
    } as DeployEnvironmentEntityConfig)
  })

  test('environments selected', () => {
    const output = processFormValues(
      {
        category: 'multi',
        environments: [{ label: 'Env_1', value: 'Env_1' }],
        environmentInputs: {
          Env_1: undefined
        },
        infrastructures: { Env_1: undefined as any },
        parallel: false
      },
      { gitOpsEnabled: false }
    )

    expect(output).toEqual({
      environments: {
        metadata: {
          parallel: false
        },
        values: [
          {
            environmentRef: 'Env_1',
            deployToAll: true
          }
        ]
      }
    } as DeployEnvironmentEntityConfig)
  })

  test('environment group selected ', () => {
    const output = processFormValues(
      {
        category: 'group',
        environmentGroup: 'Env_Group_1',
        environmentInputs: {},
        infrastructures: {},
        infrastructureInputs: {}
      },
      { gitOpsEnabled: false }
    )

    expect(output).toEqual({
      environmentGroup: {
        envGroupRef: 'Env_Group_1',
        deployToAll: true,
        environments: RUNTIME_INPUT_VALUE as any
      }
    } as DeployEnvironmentEntityConfig)
  })
})
