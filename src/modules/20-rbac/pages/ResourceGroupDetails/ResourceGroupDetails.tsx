/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { Text, Layout, Container, Icon, ButtonVariation, useToaster, Page, Card, Button } from '@wings-software/uicore'
import { Color } from '@harness/design-system'

import { useParams } from 'react-router-dom'
import ReactTimeago from 'react-timeago'
import { defaultTo, uniqWith, isEqual } from 'lodash-es'
import type { ModulePathParams, ResourceGroupDetailsPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import ResourceTypeList from '@rbac/components/ResourceTypeList/ResourceTypeList'
import {
  useUpdateResourceGroupV2,
  ResourceGroupV2,
  useGetResourceTypes,
  ScopeSelector,
  useGetResourceGroupV2,
  ResourceGroupV2Request
} from 'services/resourcegroups'
import { ResourceType, ResourceCategory } from '@rbac/interfaces/ResourceType'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import routes from '@common/RouteDefinitions'
import RbacFactory from '@rbac/factories/RbacFactory'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { usePermission } from '@rbac/hooks/usePermission'
import { SelectionType } from '@rbac/utils/utils'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import ResourcesCardList from '@rbac/components/ResourcesCardList/ResourcesCardList'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { useDeepCompareEffect } from '@common/hooks'
import {
  cleanUpResourcesMap,
  computeResourceMapOnChange,
  computeResourceMapOnMultiChange,
  getDefaultIncludedScope,
  getFilteredResourceTypes,
  getFormattedDataForApi,
  getResourceSelectorsfromMap,
  getSelectedResourcesMap,
  getSelectedScopeType,
  getSelectionType,
  SelectorScope,
  validateResourceSelectors,
  ResourceSelectorValue
} from './utils'
import ResourceGroupScope from './views/ResourceGroupScope'
import css from './ResourceGroupDetails.module.scss'

const ResourceGroupDetails: React.FC = () => {
  const { accountId, projectIdentifier, orgIdentifier, resourceGroupIdentifier, module } = useParams<
    ResourceGroupDetailsPathProps & ModulePathParams
  >()
  const { getString } = useStrings()
  const { showError, showSuccess } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const [isUpdated, setIsUpdated] = useState<boolean>(false)
  const resourceGroupScope = getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
  const [includedScopes, setIncludedScopes] = useState<ScopeSelector[]>([])
  const [selectionType, setSelectionType] = useState<SelectionType>(SelectionType.SPECIFIED)
  const [selectedScope, setSelectedScope] = useState<SelectorScope | null>(null) // Initializing to non null value might render wrong data momentarily
  const [selectedResourcesMap, setSelectedResourceMap] = useState<Map<ResourceType, ResourceSelectorValue>>(new Map())
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([])
  const [resourceCategoryMap, setResourceCategoryMap] =
    useState<Map<ResourceType | ResourceCategory, ResourceType[] | undefined>>()

  const [canEdit] = usePermission(
    {
      resource: {
        resourceType: ResourceType.RESOURCEGROUP,
        resourceIdentifier: resourceGroupIdentifier
      },
      permissions: [PermissionIdentifier.UPDATE_RESOURCEGROUP]
    },
    [resourceGroupIdentifier]
  )

  const {
    data: resourceGroupDetails,
    error: errorInGettingResourceGroup,
    loading,
    refetch
  } = useGetResourceGroupV2({
    identifier: resourceGroupIdentifier,
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier
    }
  })

  const { data: resourceTypeData } = useGetResourceTypes({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier
    }
  })

  // Following is to be triggered only once after fetch call response data is updated
  useEffect(() => {
    if (selectedScope === null && resourceGroupDetails?.data?.resourceGroup) {
      setSelectedScope(
        getSelectedScopeType(
          getScopeFromDTO({ accountId, orgIdentifier, projectIdentifier }),
          resourceGroupDetails?.data?.resourceGroup.includedScopes
        )
      )
    }
    setSelectedResourceMap(
      getSelectedResourcesMap(resourceTypes, resourceGroupDetails?.data?.resourceGroup.resourceFilter)
    )
    setIsUpdated(false)
    setIncludedScopes(
      getDefaultIncludedScope(
        accountId,
        orgIdentifier,
        projectIdentifier,
        resourceGroupDetails?.data?.resourceGroup.includedScopes
      )
    )
    setSelectionType(getSelectionType(resourceGroupDetails?.data?.resourceGroup))
  }, [resourceGroupDetails?.data?.resourceGroup])

  useDeepCompareEffect(() => {
    if (!selectedScope) {
      // Wait for resourceGroupDetails response and selectedScope initialization
      return
    }
    const types = getFilteredResourceTypes(resourceTypeData, selectedScope)
    setResourceTypes(types)
    setResourceCategoryMap(_map => RbacFactory.getResourceCategoryList(types))
    setSelectedResourceMap(_selectedResourcesMap =>
      cleanUpResourcesMap(types, _selectedResourcesMap, selectionType, selectedScope)
    )
  }, [selectedScope, resourceTypeData, includedScopes])

  const { mutate: updateResourceGroup, loading: updating } = useUpdateResourceGroupV2({
    identifier: defaultTo(resourceGroupIdentifier, ''),
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const updateResourceGroupData = async (data: ResourceGroupV2): Promise<void> => {
    const resourceSelectors = getResourceSelectorsfromMap(selectedResourcesMap)
    const invalidResources = validateResourceSelectors(resourceSelectors)?.map(val =>
      getString(defaultTo(RbacFactory.getResourceTypeLabelKey(val), 'string'))
    )
    if (invalidResources.length > 0) {
      showError(getString('rbac.resourceSelectorErrorMessage', { resources: invalidResources.toString() }))
      return
    }
    const dataToSubmit: ResourceGroupV2Request = getFormattedDataForApi(
      data,
      selectionType,
      uniqWith(includedScopes, isEqual),
      resourceSelectors
    )

    try {
      const updated = await updateResourceGroup(dataToSubmit)
      if (updated) {
        showSuccess(getString('rbac.resourceGroup.updateSuccess'))
        refetch()
      }
    } /* istanbul ignore next */ catch (err) {
      showError(getRBACErrorMessage(err))
    }
  }

  const onResourceSelectionChange = (
    resourceType: ResourceType,
    isAdd: boolean,
    identifiers?: string[],
    attributeFilter?: string[]
  ): void => {
    setIsUpdated(true)
    computeResourceMapOnChange(
      setSelectedResourceMap,
      selectedResourcesMap,
      resourceType,
      isAdd,
      identifiers,
      attributeFilter
    )
  }

  const onSelectionTypeChange = (type: SelectionType): void => {
    setSelectionType(type)
    setIsUpdated(true)
    if (type === SelectionType.ALL) {
      computeResourceMapOnMultiChange(setSelectedResourceMap, selectedResourcesMap, resourceTypes, true)
    }
  }

  const onResourceCategorySelect = (types: ResourceType[], isAdd: boolean): void => {
    setIsUpdated(true)
    computeResourceMapOnMultiChange(setSelectedResourceMap, selectedResourcesMap, types, isAdd)
  }

  const resourceGroup = resourceGroupDetails?.data?.resourceGroup
  const isHarnessManaged = resourceGroupDetails?.data?.harnessManaged
  const disableAddingResources = isHarnessManaged || !canEdit || selectionType === SelectionType.ALL

  useDocumentTitle([defaultTo(resourceGroup?.name, ''), getString('resourceGroups')])

  if (loading) return <Page.Spinner />
  if (errorInGettingResourceGroup) return <Page.Error message={getRBACErrorMessage(errorInGettingResourceGroup)} />
  if (!resourceGroup)
    return <Page.NoDataCard icon="resources-icon" message={getString('rbac.resourceGroup.noResourceGroupFound')} />

  return (
    <>
      <Page.Header
        size="xlarge"
        breadcrumbs={
          <NGBreadcrumbs
            links={[
              {
                url: routes.toResourceGroups({ accountId, orgIdentifier, projectIdentifier, module }),
                label: `${getString('accessControl')}: ${getString('resourceGroups')}`
              }
            ]}
          />
        }
        title={
          <Layout.Horizontal spacing="medium" flex={{ justifyContent: 'flex-start', alignItems: 'center' }}>
            <div style={{ backgroundColor: resourceGroup.color }} className={css.colorDiv}></div>
            <Layout.Vertical padding={{ left: 'small' }} spacing="xsmall">
              <Text font="medium" lineClamp={1} color={Color.BLACK} width={700}>
                {resourceGroup.name}
              </Text>
              {resourceGroup.description && (
                <Text lineClamp={1} color={Color.GREY_400} width={700}>
                  {resourceGroup.description}
                </Text>
              )}
            </Layout.Vertical>
          </Layout.Horizontal>
        }
        toolbar={
          <Layout.Horizontal margin={{ top: 'huge' }}>
            <Layout.Horizontal
              padding={{ right: 'small' }}
              border={{ right: true, color: Color.GREY_300 }}
              spacing="xsmall"
            >
              <Text font="small">{getString('created').toUpperCase()}:</Text>
              <Text lineClamp={1} color={Color.BLACK} font="small">
                {isHarnessManaged ? (
                  <Text lineClamp={1} color={Color.BLACK}>
                    {getString('rbac.resourceGroup.builtInResourceGroup')}
                  </Text>
                ) : (
                  <ReactTimeago date={defaultTo(resourceGroupDetails?.data?.createdAt, '')} />
                )}
              </Text>
            </Layout.Horizontal>
            <Layout.Horizontal spacing="xsmall" padding={{ left: 'small' }}>
              <Text font="small">{getString('lastUpdated').toUpperCase()}:</Text>
              <Text lineClamp={1} color={Color.BLACK} font="small">
                {isHarnessManaged ? (
                  <Text lineClamp={1} color={Color.BLACK}>
                    {getString('rbac.resourceGroup.builtInResourceGroup')}
                  </Text>
                ) : (
                  <ReactTimeago date={defaultTo(resourceGroupDetails?.data?.lastModifiedAt, '')} />
                )}
              </Text>
            </Layout.Horizontal>
          </Layout.Horizontal>
        }
      />
      <Page.Body loading={updating || loading} className={css.resourceGroupDetails}>
        {!isHarnessManaged && (
          <Card className={css.subHeader}>
            <Layout.Horizontal flex={{ justifyContent: 'space-between' }} width="100%">
              <Text color={Color.BLACK}>{getString('rbac.resourceGroup.selectionHeading')}</Text>
              <Layout.Horizontal flex={{ justifyContent: 'flex-end' }} spacing="medium">
                {isUpdated && (
                  <Layout.Horizontal spacing="xsmall" flex>
                    <Icon name="dot" color={Color.ORANGE_600} size={20} />
                    <Text color={Color.ORANGE_600}>{getString('unsavedChanges')}</Text>
                  </Layout.Horizontal>
                )}
                <RbacButton
                  text={getString('save')}
                  onClick={() => updateResourceGroupData(resourceGroup)}
                  disabled={updating || !isUpdated}
                  variation={ButtonVariation.PRIMARY}
                  permission={{
                    resource: {
                      resourceType: ResourceType.RESOURCEGROUP,
                      resourceIdentifier: resourceGroupIdentifier
                    },
                    permission: PermissionIdentifier.UPDATE_RESOURCEGROUP
                  }}
                />
                <Button
                  text={getString('common.discard')}
                  onClick={() => refetch()}
                  disabled={!isUpdated}
                  variation={ButtonVariation.TERTIARY}
                />
              </Layout.Horizontal>
            </Layout.Horizontal>
          </Card>
        )}
        <Layout.Vertical spacing="small" flex={{ justifyContent: 'flex-start' }} padding="xlarge">
          <ResourceGroupScope
            resourceGroup={resourceGroup}
            includedScopes={includedScopes}
            isHarnessManaged={isHarnessManaged}
            onSuccess={scopes => {
              setIncludedScopes(_scopes => scopes)
              setSelectedScope(_scope => getSelectedScopeType(resourceGroupScope, scopes))
            }}
            setIsUpdated={setIsUpdated}
          />
          <Container className={css.pageContainer}>
            <Container padding="xlarge" className={css.resourceTypeListContainer}>
              <ResourceTypeList
                selectionType={selectionType}
                resourceCategoryMap={resourceCategoryMap}
                onResourceSelectionChange={onResourceSelectionChange}
                onResourceCategorySelect={onResourceCategorySelect}
                preSelectedResourceList={Array.from(selectedResourcesMap.keys())}
                disableAddingResources={disableAddingResources}
                onSelectionTypeChange={onSelectionTypeChange}
              />
            </Container>
            <Layout.Vertical spacing="small">
              <ResourcesCardList
                selectedResourcesMap={selectedResourcesMap}
                resourceCategoryMap={resourceCategoryMap}
                onResourceSelectionChange={onResourceSelectionChange}
                onResourceCategorySelect={onResourceCategorySelect}
                disableAddingResources={isHarnessManaged}
                disableSpecificResourcesSelection={
                  selectionType === SelectionType.ALL ||
                  getSelectedScopeType(resourceGroupScope, includedScopes) !== SelectorScope.CURRENT
                }
              />
            </Layout.Vertical>
          </Container>
        </Layout.Vertical>
      </Page.Body>
    </>
  )
}

export default ResourceGroupDetails
