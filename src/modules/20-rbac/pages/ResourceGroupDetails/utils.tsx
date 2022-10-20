/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import produce from 'immer'
import { RbacResourceGroupTypes } from '@rbac/constants/utils'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { isAtrributeFilterSelector, isDynamicResourceSelector, SelectionType } from '@rbac/utils/utils'
import type {
  ResourceSelector,
  ResponseResourceTypeDTO,
  ScopeSelector,
  ResourceGroupV2,
  ResourceSelectorV2,
  ResourceGroupV2Request,
  ResourceFilter,
  AttributeFilter
} from 'services/resourcegroups'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { UseStringsReturn } from 'framework/strings'
import RbacFactory from '@rbac/factories/RbacFactory'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'

interface Option {
  label: string
  value: string
}
export enum SelectorScope {
  CURRENT = 'CURRENT',
  INCLUDE_CHILD_SCOPES = 'INCLUDE_CHILD_SCOPES',
  CUSTOM = 'CUSTOM'
}

export const resourceAttributeMap = new Map<ResourceType, string>([
  [ResourceType.CONNECTOR, 'category'],
  [ResourceType.ENVIRONMENT, 'type']
])

export type ResourceSelectorValue = string[] | AttributeFilter | RbacResourceGroupTypes

enum ValidatorTypes {
  BY_RESOURCE_IDENTIFIER = 'BY_RESOURCE_IDENTIFIER',
  BY_RESOURCE_TYPE = 'BY_RESOURCE_TYPE',
  BY_RESOURCE_TYPE_INCLUDING_CHILD_SCOPES = 'BY_RESOURCE_TYPE_INCLUDING_CHILD_SCOPES'
}

export const getSelectedResourcesMap = (
  resourceTypes: ResourceType[],
  resourceFilter?: ResourceFilter
): Map<ResourceType, ResourceSelectorValue> => {
  const map: Map<ResourceType, ResourceSelectorValue> = new Map()
  if (resourceFilter?.includeAllResources) {
    resourceTypes.forEach(resourceType => {
      map.set(resourceType, RbacResourceGroupTypes.DYNAMIC_RESOURCE_SELECTOR)
    })
  } else {
    resourceFilter?.resources?.map(resourceSelector => {
      if (resourceSelector.identifiers?.length) {
        map.set(resourceSelector.resourceType as ResourceType, resourceSelector.identifiers)
      } else if (resourceSelector.attributeFilter?.attributeValues?.length) {
        map.set(resourceSelector.resourceType as ResourceType, resourceSelector.attributeFilter)
      } else {
        map.set(resourceSelector.resourceType as ResourceType, RbacResourceGroupTypes.DYNAMIC_RESOURCE_SELECTOR)
      }
    })
  }

  return map
}

export const validateResourceSelectors = (value: ResourceSelector[]): ResourceType[] => {
  return value
    .filter(val => {
      if (!isDynamicResourceSelector(val.type)) {
        if (val.identifiers?.length < 1) {
          return true
        }
      }
      return false
    })
    .map(val => val.resourceType)
}

export const getResourceSelectorsfromMap = (map: Map<ResourceType, ResourceSelectorValue>): ResourceSelectorV2[] => {
  const resourceSelectors: ResourceSelectorV2[] = []
  map.forEach((value, key) => {
    if (isDynamicResourceSelector(value)) {
      resourceSelectors.push({
        resourceType: key
      })
    } else if (isAtrributeFilterSelector(value)) {
      resourceSelectors.push({
        resourceType: key,
        attributeFilter: value as AttributeFilter
      })
    } else {
      resourceSelectors.push({
        resourceType: key,
        identifiers: value as string[]
      })
    }
  })
  return resourceSelectors
}

export const computeResourceMapOnChange = (
  setSelectedResourceMap: (value: React.SetStateAction<Map<ResourceType, ResourceSelectorValue>>) => void,
  selectedResourcesMap: Map<ResourceType, ResourceSelectorValue>,
  resourceType: ResourceType,
  isAdd: boolean,
  identifiers?: string[],
  attributeFilterValues?: string[]
): void => {
  if (identifiers) {
    if (isAdd) {
      setSelectedResourceMap(
        produce(selectedResourcesMap, draft => {
          draft.set(resourceType, identifiers)
        })
      )
    } else {
      setSelectedResourceMap(
        produce(selectedResourcesMap, draft => {
          if (Array.isArray(draft.get(resourceType))) {
            draft.set(
              resourceType,
              (draft.get(resourceType) as string[]).filter(el => !identifiers.includes(el))
            )
          }
          const updatedIdentifiers = draft.get(resourceType) as string[]
          if (updatedIdentifiers?.length === 0) {
            draft.delete(resourceType)
          }
        })
      )
    }
  } else if (attributeFilterValues) {
    if (isAdd) {
      const attributeFilter = {
        attributeName: resourceAttributeMap.get(resourceType),
        attributeValues: attributeFilterValues
      }
      setSelectedResourceMap(
        produce(selectedResourcesMap, draft => {
          draft.set(resourceType, attributeFilter)
        })
      )
    } else {
      setSelectedResourceMap(
        produce(selectedResourcesMap, draft => {
          const prevFilters = (draft.get(resourceType) as AttributeFilter).attributeValues
          const updatedFilters = prevFilters?.filter(attrFilter => !attributeFilterValues.includes(attrFilter))

          if (Array.isArray(updatedFilters) && updatedFilters.length > 0) {
            draft.set(resourceType, {
              attributeName: resourceAttributeMap.get(resourceType),
              attributeValues: updatedFilters
            })
          } else {
            draft.delete(resourceType)
          }
        })
      )
    }
  } else {
    if (isAdd) {
      setSelectedResourceMap(
        produce(selectedResourcesMap, draft => {
          draft.set(resourceType, RbacResourceGroupTypes.DYNAMIC_RESOURCE_SELECTOR)
        })
      )
    } else {
      setSelectedResourceMap(
        produce(selectedResourcesMap, draft => {
          draft.delete(resourceType)
        })
      )
    }
  }
}

export const computeResourceMapOnMultiChange = (
  setSelectedResourceMap: (value: React.SetStateAction<Map<ResourceType, ResourceSelectorValue>>) => void,
  selectedResourcesMap: Map<ResourceType, ResourceSelectorValue>,
  types: ResourceType[],
  isAdd: boolean
): void => {
  if (isAdd) {
    setSelectedResourceMap(
      produce(selectedResourcesMap, draft => {
        types.forEach(resourceType => {
          draft.set(resourceType, RbacResourceGroupTypes.DYNAMIC_RESOURCE_SELECTOR)
        })
      })
    )
  } else {
    setSelectedResourceMap(
      produce(selectedResourcesMap, draft => {
        types.forEach(resourceType => {
          draft.delete(resourceType)
        })
      })
    )
  }
}

export const getSelectedScopeLabel = (
  getString: UseStringsReturn['getString'],
  resourceGroupScope: Scope,
  scopes: ScopeSelector[]
): string => {
  const selectorScope = getSelectedScopeType(resourceGroupScope, scopes)
  const dropDownItems = getScopeDropDownItems(resourceGroupScope, getString)
  const option = dropDownItems.filter(item => item.value === selectorScope)
  return option.length ? option[0].label : ''
}

export const getScopeDropDownItems = (scope: Scope, getString: UseStringsReturn['getString']): Option[] => {
  switch (scope) {
    case Scope.PROJECT:
      return [{ label: getString('rbac.scopeItems.projectOnly'), value: SelectorScope.CURRENT }]
    case Scope.ORG:
      return [
        { label: getString('rbac.scopeItems.orgOnly'), value: SelectorScope.CURRENT },
        { label: getString('rbac.scopeItems.orgAll'), value: SelectorScope.INCLUDE_CHILD_SCOPES },
        { label: getString('rbac.scopeItems.specificProjects'), value: SelectorScope.CUSTOM }
      ]
    case Scope.ACCOUNT:
    default:
      return [
        { label: getString('rbac.scopeItems.accountOnly'), value: SelectorScope.CURRENT },
        { label: getString('rbac.scopeItems.accountAll'), value: SelectorScope.INCLUDE_CHILD_SCOPES },
        { label: getString('rbac.scopeItems.specificOrgsAndProjects'), value: SelectorScope.CUSTOM }
      ]
  }
}

export const getSelectionType = (resourceGroup?: ResourceGroupV2): SelectionType => {
  if (resourceGroup?.resourceFilter?.includeAllResources) {
    return SelectionType.ALL
  }
  return SelectionType.SPECIFIED
}

export const getSelectedScopeType = (
  scopeOfResourceGroup: Scope,
  scopes?: ScopeSelector[],
  isHarnessManaged?: boolean
): SelectorScope => {
  if (scopes?.length) {
    if (scopes.length > 1) {
      return SelectorScope.CUSTOM
    }
    for (const scope of scopes) {
      if (scopeOfResourceGroup === getScopeFromDTO(scope) || isHarnessManaged) {
        return scope.filter === 'INCLUDING_CHILD_SCOPES' ? SelectorScope.INCLUDE_CHILD_SCOPES : SelectorScope.CURRENT
      } else {
        return SelectorScope.CUSTOM
      }
    }
  }

  return SelectorScope.CURRENT
}

export const getFormattedDataForApi = (
  data: ResourceGroupV2,
  selectionType: SelectionType,
  includedScopes: ScopeSelector[],
  resourceSelectors: ResourceSelectorV2[]
): ResourceGroupV2Request => {
  return {
    resourceGroup: {
      ...data,
      resourceFilter:
        selectionType === SelectionType.ALL
          ? {
              includeAllResources: true
            }
          : {
              resources: resourceSelectors,
              includeAllResources: false
            },
      includedScopes: includedScopes
    }
  }
}

export const getFilteredResourceTypes = (
  data: ResponseResourceTypeDTO | null,
  selectedScope: SelectorScope
): ResourceType[] => {
  const resourceTypes = data?.data?.resourceTypes || []
  return resourceTypes?.reduce((acc: ResourceType[], value) => {
    if (
      value.name &&
      RbacFactory.isRegisteredResourceType(value.name as ResourceType) &&
      ((selectedScope === SelectorScope.CURRENT && value.validatorTypes?.includes(ValidatorTypes.BY_RESOURCE_TYPE)) ||
        selectedScope !== SelectorScope.CURRENT)
    ) {
      acc.push(value.name as ResourceType)
    }
    return acc
  }, [])
}

export const includeCustomProjects = (orgScopes?: ScopeSelector[]): boolean => {
  return orgScopes?.filter(item => item.filter === 'EXCLUDING_CHILD_SCOPES' || !!item.projectIdentifier).length !== 0
}

export const includeProjects = (orgScopes?: ScopeSelector[]): boolean => {
  return orgScopes?.filter(item => item.filter === 'INCLUDING_CHILD_SCOPES' || !!item.projectIdentifier).length !== 0
}

export const includedProjectsLength = (orgScopes?: ScopeSelector[]): number => {
  return orgScopes?.filter(item => item.filter === 'INCLUDING_CHILD_SCOPES' || !!item.projectIdentifier).length || 0
}

export const getAllProjects = (orgScopes?: ScopeSelector[]): string[] => {
  return (
    orgScopes
      ?.filter(item => item.filter === 'EXCLUDING_CHILD_SCOPES' && !!item.projectIdentifier)
      .map(item => item.projectIdentifier || '') || []
  )
}

export const cleanUpResourcesMap = (
  resourceTypes: ResourceType[],
  selectedResourcesMap: Map<ResourceType, ResourceSelectorValue>,
  selectionType: SelectionType,
  selectedScope: SelectorScope
): Map<ResourceType, ResourceSelectorValue> => {
  const types = [...resourceTypes]
  selectedResourcesMap.forEach((value, key) => {
    if (!types.includes(key)) {
      selectedResourcesMap.delete(key)
    } else {
      types.splice(types.indexOf(key), 1)
      if (selectedScope === SelectorScope.CURRENT) {
        selectedResourcesMap.set(key, value)
      } else {
        if (isAtrributeFilterSelector(value)) {
          selectedResourcesMap.set(key, value)
        } else {
          selectedResourcesMap.set(key, RbacResourceGroupTypes.DYNAMIC_RESOURCE_SELECTOR)
        }
      }
    }
  })
  if (selectionType === SelectionType.ALL) {
    types.map(resourceType => {
      selectedResourcesMap.set(resourceType, RbacResourceGroupTypes.DYNAMIC_RESOURCE_SELECTOR)
    })
  }
  return selectedResourcesMap
}

export const getDefaultIncludedScope = (
  accountIdentifier: string,
  orgIdentifier?: string,
  projectIdentifier?: string,
  includedScopes?: ScopeSelector[]
): ScopeSelector[] => {
  if (includedScopes?.length) {
    return includedScopes
  }
  return [
    {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      filter: 'EXCLUDING_CHILD_SCOPES'
    }
  ]
}

export const includesCurrentScope = (scopes: ScopeSelector[], resourceScope: Scope): boolean => {
  return !!scopes.find(scope => getScopeFromDTO(scope) === resourceScope && scope.filter === 'EXCLUDING_CHILD_SCOPES')
}
