/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { AllowedTypesWithRunTime, MultiTypeInputType } from '@harness/uicore'
import { findByText, fireEvent, render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import type { StageElementWrapper } from '@pipeline/utils/pipelineTypes'

import ReleaseRepoListView from '../ReleaseRepoListView'

const props = {
  isPropagating: false,
  updateStage: jest.fn(),
  stage: {
    stage: {
      name: 'Stage Name',
      identifier: 'stage_id',
      spec: {
        serviceConfig: {
          serviceDefinition: {
            spec: {
              manifests: [
                {
                  manifest: {
                    identifier: 'sadsa',
                    type: 'ReleaseRepo',
                    spec: {
                      store: {
                        type: 'Git',
                        spec: {
                          connectorRef: '<+input>',
                          gitFetchType: 'Branch',
                          paths: ['sdas'],
                          branch: 'sadsa'
                        }
                      }
                    }
                  }
                }
              ]
            },
            type: 'Kubernetes'
          },
          serviceRef: 'Service_1'
        }
      }
    }
  } as StageElementWrapper,
  connectors: {
    totalPages: 0,
    totalItems: 0,
    pageItemCount: 0,
    pageSize: 10,
    content: [],
    pageIndex: 0,
    empty: true
  },
  refetchConnectors: jest.fn(),
  listOfManifests: [
    {
      manifest: {
        identifier: 'sadsa',
        type: 'ReleaseRepo',
        spec: {
          store: {
            type: 'Git',
            spec: {
              connectorRef: '<+input>',
              gitFetchType: 'Branch',
              paths: ['sdas'],
              branch: 'sadsa'
            }
          }
        }
      }
    }
  ],
  isReadonly: false,
  deploymentType: 'Kubernetes' as any,
  allowableTypes: [
    MultiTypeInputType.FIXED,
    MultiTypeInputType.RUNTIME,
    MultiTypeInputType.EXPRESSION
  ] as AllowedTypesWithRunTime[]
}

const editProps = {
  isPropagating: false,
  updateStage: jest.fn(),
  stage: {
    stage: {
      name: 'Stage Name',
      identifier: 'stage_id',
      spec: {
        serviceConfig: {
          serviceDefinition: {
            spec: {
              manifests: []
            },
            type: 'Kubernetes'
          },
          serviceRef: 'Service_1'
        }
      }
    }
  },
  connectors: {
    totalPages: 0,
    totalItems: 0,
    pageItemCount: 0,
    pageSize: 10,
    content: [],
    pageIndex: 0,
    empty: true
  },
  refetchConnectors: jest.fn(),
  listOfManifests: [],
  isReadonly: false,
  deploymentType: 'Kubernetes' as any,
  allowableTypes: [
    MultiTypeInputType.FIXED,
    MultiTypeInputType.RUNTIME,
    MultiTypeInputType.EXPRESSION
  ] as AllowedTypesWithRunTime[]
}
describe('Release repo list view ', () => {
  test('initial render with manifests', () => {
    const { container } = render(
      <TestWrapper>
        <ReleaseRepoListView {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('edit release repo manifest works correctly', async () => {
    const { container } = render(
      <TestWrapper>
        <ReleaseRepoListView {...props} />
      </TestWrapper>
    )

    const editManifestBtn = container.querySelectorAll('[data-icon="Edit"]')[0]
    expect(editManifestBtn).toBeDefined()
    fireEvent.click(editManifestBtn)
    const portal = document.getElementsByClassName('bp3-dialog')[0]
    expect(portal.querySelector('.createConnectorWizard')).toBeDefined()
    const closeButton = portal.querySelector("button[class*='crossIcon']") as Element
    fireEvent.click(closeButton)
    expect(container).toMatchSnapshot()
  })

  test('onsubmit works correctly', async () => {
    const { container } = render(
      <TestWrapper>
        <ReleaseRepoListView {...props} />
      </TestWrapper>
    )

    const editManifestBtn = container.querySelectorAll('[data-icon="Edit"]')[0]
    expect(editManifestBtn).toBeDefined()
    fireEvent.click(editManifestBtn)
    const portal = document.getElementsByClassName('bp3-dialog')[0]
    expect(portal.querySelector('.createConnectorWizard')).toBeDefined()
    const continueButton = await findByText(portal as HTMLElement, 'continue')
    expect(continueButton).toBeDefined()
    fireEvent.click(continueButton!)
    const artifactRepoLabel = await findByText(portal as HTMLElement, 'pipeline.manifestType.manifestDetails')
    expect(artifactRepoLabel).toBeDefined()
    fireEvent.click(portal.querySelector('button[type="submit"]')!)
  })
  test('remove manifest', () => {
    const { container } = render(
      <TestWrapper>
        <ReleaseRepoListView {...props} />
      </TestWrapper>
    )
    fireEvent.click(container.querySelector('[data-test-id=remove-release-repo]')!)
    expect(container).toMatchSnapshot()
  })

  test('render with no manifests', () => {
    const { container } = render(
      <TestWrapper>
        <ReleaseRepoListView {...editProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('click on release repo manifest btn', async () => {
    const { container } = render(
      <TestWrapper>
        <ReleaseRepoListView {...editProps} />
      </TestWrapper>
    )

    const addFileButton = await findByText(container, 'pipeline.addReleaseRepo')
    expect(addFileButton).toBeDefined()
    fireEvent.click(addFileButton)
    const portal = document.getElementsByClassName('bp3-dialog')[0]
    expect(portal.querySelector('.createConnectorWizard')).toBeDefined()
  })

  test('deployment Repo Manifest - should show addDeploymenteRepo button', () => {
    const { container, getByText } = render(
      <TestWrapper defaultFeatureFlagValues={{ GITOPS_FETCH_LINKED_APPS: true }}>
        <ReleaseRepoListView {...props} listOfManifests={[]} />
      </TestWrapper>
    )
    expect(getByText('pipeline.addReleaseRepo')).toBeInTheDocument()
    expect(getByText('pipeline.addDeploymenteRepo')).toBeInTheDocument()
    expect(container).toMatchSnapshot('deployment Repo Manifest')
  })
  test('deployment Repo Manifest - should not show addDeploymenteRepo button when deploymentRepo manifest is present', () => {
    const { queryByText, container } = render(
      <TestWrapper defaultFeatureFlagValues={{ GITOPS_FETCH_LINKED_APPS: true }}>
        <ReleaseRepoListView
          {...props}
          listOfManifests={[
            {
              manifest: {
                identifier: 'deploymentTypeRepo',
                type: 'DeploymentRepo',
                spec: {
                  store: {
                    type: 'Git',
                    spec: {
                      connectorRef: '<+input>',
                      gitFetchType: 'Branch',
                      paths: ['sdas'],
                      branch: 'sadsa'
                    }
                  }
                }
              }
            }
          ]}
        />
      </TestWrapper>
    )
    expect(queryByText('deploymentTypeRepo')).toBeInTheDocument()
    expect(queryByText('pipeline.deploymentRepo')).toBeInTheDocument()
    expect(queryByText('pipeline.releaseRepo')).not.toBeInTheDocument()
    expect(queryByText('pipeline.addReleaseRepo')).toBeInTheDocument()
    expect(queryByText('pipeline.addDeploymenteRepo')).not.toBeInTheDocument()
    expect(container).toMatchSnapshot('deployment Repo Manifest - no button')
  })
  test('release Repo Manifest - should not show addReleaseRepo button when releaseRepo manifest is present', () => {
    const { queryByText, container } = render(
      <TestWrapper defaultFeatureFlagValues={{ GITOPS_FETCH_LINKED_APPS: true }}>
        <ReleaseRepoListView
          {...props}
          listOfManifests={[
            {
              manifest: {
                identifier: 'sadsa',
                type: 'ReleaseRepo',
                spec: {
                  store: {
                    type: 'Git',
                    spec: {
                      connectorRef: '<+input>',
                      gitFetchType: 'Branch',
                      paths: ['sdas'],
                      branch: 'sadsa'
                    }
                  }
                }
              }
            }
          ]}
        />
      </TestWrapper>
    )
    expect(queryByText('sadsa')).toBeInTheDocument()
    expect(queryByText('pipeline.releaseRepo')).toBeInTheDocument()
    expect(queryByText('pipeline.deploymentRepo')).not.toBeInTheDocument()
    expect(queryByText('pipeline.addReleaseRepo')).not.toBeInTheDocument()
    expect(queryByText('pipeline.addDeploymenteRepo')).toBeInTheDocument()
    expect(container).toMatchSnapshot('release Repo Manifest - no button')
  })
})
