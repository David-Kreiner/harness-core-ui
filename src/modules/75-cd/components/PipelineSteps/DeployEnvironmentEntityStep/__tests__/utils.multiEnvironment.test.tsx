/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import type { EnvironmentYamlV2 } from 'services/cd-ng'
import type { DeployEnvironmentEntityConfig, DeployEnvironmentEntityFormState } from '../types'
import {
  getEnvironmentsFormStateFromInitialValues,
  getEnvironmentsFormValuesFromFormState,
  processMultiEnvironmentFormValues,
  processMultiEnvironmentInitialValues
} from '../utils'

describe('process multi environment initial values', () => {
  test('parallel defaults to true', () => {
    const output = processMultiEnvironmentInitialValues({}, false)
    expect(output).toEqual({
      parallel: true,
      category: 'multi'
    })
  })

  test('false parallel value returns false', () => {
    const output = processMultiEnvironmentInitialValues(
      {
        environments: {
          metadata: {
            parallel: false
          }
        }
      },
      false
    )
    expect(output).toEqual({
      parallel: false,
      category: 'multi'
    })
  })
})

describe('get environments form state from initial values', () => {
  test('environments fixed values & combinations of infrastructures fixed values and GitOps disabled', () => {
    const output = getEnvironmentsFormStateFromInitialValues(
      [
        {
          environmentRef: 'Env_1',
          environmentInputs: {
            variables: [{ name: 'var1', type: 'String', value: 'test1' }]
          },
          deployToAll: true
        },
        {
          environmentRef: 'Env_2',
          deployToAll: false,
          infrastructureDefinitions: [
            {
              identifier: 'Infra_1',
              inputs: {
                identifier: 'Infra_1',
                type: 'Kubernetes',
                spec: {
                  namespace: RUNTIME_INPUT_VALUE
                }
              }
            },
            {
              identifier: 'Infra_2',
              inputs: {
                identifier: 'Infra_2',
                type: 'Kubernetes',
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE
                }
              }
            }
          ]
        },
        {
          environmentRef: 'Env_3',
          deployToAll: RUNTIME_INPUT_VALUE as any,
          infrastructureDefinitions: RUNTIME_INPUT_VALUE as any
        }
      ],
      false,
      false
    )

    expect(output).toEqual({
      environments: [
        {
          label: 'Env_1',
          value: 'Env_1'
        },
        {
          label: 'Env_2',
          value: 'Env_2'
        },
        {
          label: 'Env_3',
          value: 'Env_3'
        }
      ],
      environmentInputs: {
        Env_1: {
          variables: [{ name: 'var1', type: 'String', value: 'test1' }]
        },
        Env_2: undefined,
        Env_3: undefined
      },
      infrastructures: {
        Env_1: undefined as any,
        Env_2: [
          {
            label: 'Infra_1',
            value: 'Infra_1'
          },
          {
            label: 'Infra_2',
            value: 'Infra_2'
          }
        ],
        Env_3: RUNTIME_INPUT_VALUE as any
      },
      infrastructureInputs: {
        Env_2: {
          Infra_1: {
            identifier: 'Infra_1',
            type: 'Kubernetes',
            spec: {
              namespace: RUNTIME_INPUT_VALUE
            }
          },
          Infra_2: {
            identifier: 'Infra_2',
            type: 'Kubernetes',
            spec: {
              connectorRef: RUNTIME_INPUT_VALUE
            }
          }
        }
      }
    } as DeployEnvironmentEntityFormState)
  })

  test('environments as runtime value and GitOps disabled', () => {
    const output = getEnvironmentsFormStateFromInitialValues(RUNTIME_INPUT_VALUE as any, false, false)

    expect(output).toEqual({
      environments: RUNTIME_INPUT_VALUE as any,
      environmentInputs: {},
      infrastructures: {},
      infrastructureInputs: {}
    } as DeployEnvironmentEntityFormState)
  })

  test('environments as runtime value under env group and GitOps disabled', () => {
    /** The true in this test is used to negate the environments runtime value that we set when deployToAll is true
     * environmentGroup:
     *    envGroupRef: EG_1
     *    deployToAll: true
     *    environments: RUNTIME_INPUT_VALUE */
    const output = getEnvironmentsFormStateFromInitialValues(RUNTIME_INPUT_VALUE as any, true, false)

    expect(output).toEqual({
      environmentInputs: {},
      infrastructures: {},
      infrastructureInputs: {}
    } as DeployEnvironmentEntityFormState)
  })

  test('environments fixed values & combinations of infrastructures fixed values and GitOps enabled', () => {
    const output = getEnvironmentsFormStateFromInitialValues(
      [
        {
          environmentRef: 'Env_1',
          environmentInputs: {
            variables: [{ name: 'var1', type: 'String', value: 'test1' }]
          },
          deployToAll: true
        },
        {
          environmentRef: 'Env_2',
          deployToAll: false,
          gitOpsClusters: [
            {
              identifier: 'Cluster_1'
            },
            {
              identifier: 'Cluster_2'
            }
          ]
        },
        {
          environmentRef: 'Env_3',
          deployToAll: RUNTIME_INPUT_VALUE as any,
          gitOpsClusters: RUNTIME_INPUT_VALUE as any
        }
      ],
      false,
      true
    )

    expect(output).toEqual({
      environments: [
        {
          label: 'Env_1',
          value: 'Env_1'
        },
        {
          label: 'Env_2',
          value: 'Env_2'
        },
        {
          label: 'Env_3',
          value: 'Env_3'
        }
      ],
      environmentInputs: {
        Env_1: {
          variables: [{ name: 'var1', type: 'String', value: 'test1' }]
        },
        Env_2: undefined,
        Env_3: undefined
      },
      clusters: {
        Env_1: undefined as any,
        Env_2: [
          {
            label: 'Cluster_1',
            value: 'Cluster_1'
          },
          {
            label: 'Cluster_2',
            value: 'Cluster_2'
          }
        ],
        Env_3: RUNTIME_INPUT_VALUE as any
      }
    } as DeployEnvironmentEntityFormState)
  })

  test('environments as runtime value and GitOps enabled', () => {
    const output = getEnvironmentsFormStateFromInitialValues(RUNTIME_INPUT_VALUE as any, false, true)

    expect(output).toEqual({
      environments: RUNTIME_INPUT_VALUE as any,
      environmentInputs: {},
      clusters: {}
    } as DeployEnvironmentEntityFormState)
  })

  test('environments as runtime value under env group and GitOps enabled', () => {
    /** The true in this test is used to negate the environments runtime value that we set when deployToAll is true
     * environmentGroup:
     *    envGroupRef: EG_1
     *    deployToAll: true
     *    environments: RUNTIME_INPUT_VALUE */
    const output = getEnvironmentsFormStateFromInitialValues(RUNTIME_INPUT_VALUE as any, true, true)

    expect(output).toEqual({
      environmentInputs: {},
      clusters: {}
    } as DeployEnvironmentEntityFormState)
  })
})

describe('process multi environment form values', () => {
  test('parallel value shows with runtime enviroment', () => {
    const output = processMultiEnvironmentFormValues(
      {
        category: 'multi',
        parallel: false,
        environments: RUNTIME_INPUT_VALUE as any
      },
      false
    )

    expect(output).toEqual({
      environments: {
        metadata: {
          parallel: false
        },
        values: RUNTIME_INPUT_VALUE as any
      }
    } as DeployEnvironmentEntityConfig)
  })

  test('no environments are passed', () => {
    const output = processMultiEnvironmentFormValues(
      {
        category: 'multi'
      },
      false
    )

    expect(output).toEqual({
      environments: {
        metadata: {
          parallel: undefined
        },
        values: []
      }
    } as DeployEnvironmentEntityConfig)
  })
})

describe('get environments form values from form state', () => {
  // environments as runtime is handled in the previous describe

  test('environments are selected and combination of infrastructures exist', () => {
    const output = getEnvironmentsFormValuesFromFormState(
      {
        environments: [
          {
            label: 'Env_1',
            value: 'Env_1'
          },
          {
            label: 'Env_2',
            value: 'Env_2'
          },
          {
            label: 'Env_3',
            value: 'Env_3'
          }
        ],
        environmentInputs: {
          Env_1: {
            variables: [
              {
                name: 'var1',
                type: 'String',
                value: 'test1'
              }
            ]
          },
          Env_2: undefined,
          Env_3: undefined
        },
        infrastructures: {
          Env_2: RUNTIME_INPUT_VALUE as any,
          Env_3: [
            {
              label: 'Infra_1',
              value: 'Infra_1'
            },
            {
              label: 'Infra_2',
              value: 'Infra_2'
            }
          ]
        },
        infrastructureInputs: {
          Env_3: {
            Infra_1: {
              identifier: 'Infra_1',
              spec: {
                namespace: RUNTIME_INPUT_VALUE
              }
            }
          }
        }
      },
      false
    )

    expect(output).toEqual([
      {
        environmentRef: 'Env_1',
        environmentInputs: {
          variables: [
            {
              name: 'var1',
              type: 'String',
              value: 'test1'
            }
          ]
        },
        deployToAll: true
      },
      {
        environmentRef: 'Env_2',
        deployToAll: RUNTIME_INPUT_VALUE,
        infrastructureDefinitions: RUNTIME_INPUT_VALUE as any
      },

      {
        environmentRef: 'Env_3',
        deployToAll: false,
        infrastructureDefinitions: [
          {
            identifier: 'Infra_1',
            inputs: {
              identifier: 'Infra_1',
              spec: {
                namespace: RUNTIME_INPUT_VALUE
              }
            }
          },
          {
            identifier: 'Infra_2'
          }
        ]
      }
    ] as EnvironmentYamlV2[])
  })

  test('environments are selected and combination of clusters exist', () => {
    const output = getEnvironmentsFormValuesFromFormState(
      {
        environments: [
          {
            label: 'Env_1',
            value: 'Env_1'
          },
          {
            label: 'Env_2',
            value: 'Env_2'
          },
          {
            label: 'Env_3',
            value: 'Env_3'
          }
        ],
        environmentInputs: {
          Env_1: {
            variables: [
              {
                name: 'var1',
                type: 'String',
                value: 'test1'
              }
            ]
          },
          Env_2: undefined,
          Env_3: undefined
        },
        clusters: {
          Env_2: RUNTIME_INPUT_VALUE as any,
          Env_3: [
            {
              label: 'Cluster_1',
              value: 'Cluster_1'
            },
            {
              label: 'Cluster_2',
              value: 'Cluster_2'
            }
          ]
        }
      },
      true
    )

    expect(output).toEqual([
      {
        environmentRef: 'Env_1',
        environmentInputs: {
          variables: [
            {
              name: 'var1',
              type: 'String',
              value: 'test1'
            }
          ]
        },
        deployToAll: true
      },
      {
        environmentRef: 'Env_2',
        deployToAll: RUNTIME_INPUT_VALUE,
        gitOpsClusters: RUNTIME_INPUT_VALUE as any
      },

      {
        environmentRef: 'Env_3',
        deployToAll: false,
        gitOpsClusters: [
          {
            identifier: 'Cluster_1'
          },
          {
            identifier: 'Cluster_2'
          }
        ]
      }
    ] as EnvironmentYamlV2[])
  })

  test('environments are empty and GitOps disabled', () => {
    const output = getEnvironmentsFormValuesFromFormState({}, false)

    expect(output).toEqual([])
  })
})
