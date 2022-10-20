/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { DeployEnvironmentEntityConfig, DeployEnvironmentEntityFormState } from '../types'
import { processSingleEnvironmentInitialValues, processSingleEnvironmentFormValues } from '../utils'

// eslint-disable-next-line jest/no-disabled-tests
describe('process single environment initial values', () => {
  test('env & infra fixed values with runtime inputs', () => {
    const output = processSingleEnvironmentInitialValues(
      {
        environmentRef: 'Env_1',
        environmentInputs: {
          variables: [
            {
              name: 'var1',
              type: 'String',
              value: '<+input>'
            }
          ]
        },
        infrastructureDefinitions: [
          {
            identifier: 'Infra_1',
            inputs: {
              identifier: 'Infra_1',
              type: 'Kubernetes',
              spec: {
                connectorRef: '<+input>'
              }
            }
          }
        ]
      },
      false
    )
    expect(output).toEqual({
      category: 'single',
      environment: 'Env_1',
      environmentInputs: {
        Env_1: {
          variables: [
            {
              name: 'var1',
              type: 'String',
              value: '<+input>'
            }
          ]
        }
      },
      infrastructure: 'Infra_1',
      infrastructureInputs: {
        Env_1: {
          Infra_1: {
            identifier: 'Infra_1',
            type: 'Kubernetes',
            spec: {
              connectorRef: '<+input>'
            }
          }
        }
      }
    } as DeployEnvironmentEntityFormState)
  })

  test('env fixed & infra runtime', () => {
    const output = processSingleEnvironmentInitialValues(
      {
        environmentRef: 'Env_1',
        infrastructureDefinitions: '<+input>' as any
      },
      false
    )
    expect(output).toEqual({
      category: 'single',
      environment: 'Env_1',
      environmentInputs: {
        Env_1: undefined
      },
      infrastructure: '<+input>',
      infrastructureInputs: {}
    } as DeployEnvironmentEntityFormState)
  })

  test('env & infra runtime', () => {
    const output = processSingleEnvironmentInitialValues(
      {
        environmentRef: '<+input>',
        infrastructureDefinitions: '<+input>' as any
      },
      false
    )
    expect(output).toEqual({
      category: 'single',
      environment: '<+input>'
    } as DeployEnvironmentEntityFormState)
  })

  test('env & cluster fixed values', () => {
    const output = processSingleEnvironmentInitialValues(
      {
        environmentRef: 'Env_1',
        gitOpsClusters: [
          {
            identifier: 'Cluster_1'
          }
        ]
      },
      true
    )
    expect(output).toEqual({
      category: 'single',
      environment: 'Env_1',
      environmentInputs: {},
      cluster: 'Cluster_1'
    } as DeployEnvironmentEntityFormState)
  })

  test('env fixed & cluster runtime', () => {
    const output = processSingleEnvironmentInitialValues(
      {
        environmentRef: 'Env_1',
        gitOpsClusters: '<+input>' as any
      },
      true
    )
    expect(output).toEqual({
      category: 'single',
      environment: 'Env_1',
      environmentInputs: {
        Env_1: undefined
      },
      cluster: '<+input>'
    } as DeployEnvironmentEntityFormState)
  })

  test('env & cluster runtime', () => {
    const output = processSingleEnvironmentInitialValues(
      {
        environmentRef: '<+input>',
        gitOpsClusters: '<+input>' as any
      },
      true
    )
    expect(output).toEqual({
      category: 'single',
      environment: '<+input>'
    } as DeployEnvironmentEntityFormState)
  })

  test('no env', () => {
    const output = processSingleEnvironmentInitialValues('' as any, false)
    expect(output).toEqual({
      category: 'single'
    } as DeployEnvironmentEntityFormState)
  })
})

describe('process single environment form values', () => {
  test('single env only selected', () => {
    const output = processSingleEnvironmentFormValues(
      {
        category: 'single',
        environment: 'Env_1',
        environmentInputs: {
          Env_1: {
            variables: [
              {
                name: 'var1',
                type: 'String',
                value: 'test1'
              }
            ]
          }
        }
      },
      false
    )

    expect(output).toEqual({
      environment: {
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
        deployToAll: false
      }
    } as DeployEnvironmentEntityConfig)
  })

  test('single env single infra selected', () => {
    const output = processSingleEnvironmentFormValues(
      {
        category: 'single',
        environment: 'Env_1',
        environmentInputs: {
          Env_1: {
            variables: [
              {
                name: 'var1',
                type: 'String',
                value: 'test1'
              }
            ]
          }
        },
        infrastructure: 'Infra_1',
        infrastructureInputs: {
          Env_1: {
            Infra_1: {
              identifier: 'Infra_1',
              type: 'Kubernetes',
              spec: {
                connectorRef: '<+input>'
              }
            }
          }
        }
      },
      false
    )

    expect(output).toEqual({
      environment: {
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
        deployToAll: false,
        infrastructureDefinitions: [
          {
            identifier: 'Infra_1',
            inputs: {
              identifier: 'Infra_1',
              type: 'Kubernetes',
              spec: {
                connectorRef: '<+input>'
              }
            }
          }
        ]
      }
    } as DeployEnvironmentEntityConfig)
  })

  test('single env selected, infra runtime', () => {
    const output = processSingleEnvironmentFormValues(
      {
        category: 'single',
        environment: 'Env_1',
        environmentInputs: {
          Env_1: undefined
        },
        infrastructure: '<+input>',
        infrastructureInputs: {
          Env_1: {
            // Validation when it remains as is, will the form get updated correctly
            Infra_1: {
              identifier: 'Infra_1',
              type: 'Kubernetes',
              spec: {
                connectorRef: '<+input>'
              }
            }
          }
        }
      },
      false
    )

    expect(output).toEqual({
      environment: {
        environmentRef: 'Env_1',
        deployToAll: false,
        infrastructureDefinitions: '<+input>' as any
      }
    } as DeployEnvironmentEntityConfig)
  })

  test('single env single cluster selected', () => {
    const output = processSingleEnvironmentFormValues(
      {
        category: 'single',
        environment: 'Env_1',
        environmentInputs: {
          Env_1: {
            variables: [
              {
                name: 'var1',
                type: 'String',
                value: 'test1'
              }
            ]
          }
        },
        cluster: 'Cluster_1'
      },
      true
    )

    expect(output).toEqual({
      environment: {
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
        deployToAll: false,
        gitOpsClusters: [
          {
            identifier: 'Cluster_1'
          }
        ]
      }
    } as DeployEnvironmentEntityConfig)
  })

  test('single env selected, cluster runtime', () => {
    const output = processSingleEnvironmentFormValues(
      {
        category: 'single',
        environment: 'Env_1',
        environmentInputs: {
          Env_1: undefined
        },
        cluster: '<+input>'
      },
      true
    )

    expect(output).toEqual({
      environment: {
        environmentRef: 'Env_1',
        deployToAll: false,
        gitOpsClusters: '<+input>' as any
      }
    } as DeployEnvironmentEntityConfig)
  })

  test('single env runtime, GitOps disabled', () => {
    const output = processSingleEnvironmentFormValues(
      {
        category: 'single',
        environment: '<+input>',
        // Validation when all the below remains as is, will the form get updated correctly
        environmentInputs: {
          Env_1: {
            variables: [
              {
                name: 'var1',
                type: 'String',
                value: 'test1'
              }
            ]
          }
        },
        infrastructure: 'Infra_1',
        infrastructureInputs: {
          Env_1: {
            Infra_1: {
              identifier: 'Infra_1',
              type: 'Kubernetes',
              spec: {
                connectorRef: '<+input>'
              }
            }
          }
        }
      },
      false
    )

    expect(output).toEqual({
      environment: {
        environmentRef: '<+input>',
        environmentInputs: '<+input>' as any,
        deployToAll: false,
        infrastructureDefinitions: '<+input>' as any
      }
    } as DeployEnvironmentEntityConfig)
  })

  test('single env runtime, GitOps enabled', () => {
    const output = processSingleEnvironmentFormValues(
      {
        category: 'single',
        environment: '<+input>',
        // Validation when all the below remains as is, will the form get updated correctly
        environmentInputs: {
          Env_1: {
            variables: [
              {
                name: 'var1',
                type: 'String',
                value: 'test1'
              }
            ]
          }
        },
        cluster: 'Cluster_1'
      },
      true
    )

    expect(output).toEqual({
      environment: {
        environmentRef: '<+input>',
        environmentInputs: '<+input>' as any,
        deployToAll: false,
        gitOpsClusters: '<+input>' as any
      }
    } as DeployEnvironmentEntityConfig)
  })

  test('no environment in form state', () => {
    const output = processSingleEnvironmentFormValues({}, false)

    expect(output).toEqual({})
  })
})
