/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Card, Layout, Text, Checkbox, Radio } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import RbacFactory from '@rbac/factories/RbacFactory'
import type { ResourceType, ResourceCategory } from '@rbac/interfaces/ResourceType'
import { useStrings } from 'framework/strings'
import { SelectionType } from '@rbac/utils/utils'
import css from './ResourceTypeList.module.scss'

interface ResourceTypeListProps {
  selectionType: SelectionType
  resourceCategoryMap?: Map<ResourceType | ResourceCategory, ResourceType[] | undefined>
  onSelectionTypeChange: (type: SelectionType) => void
  onResourceSelectionChange: (resource: ResourceType, isAdd: boolean) => void
  onResourceCategorySelect: (types: ResourceType[], isAdd: boolean) => void
  preSelectedResourceList: ResourceType[]
  disableAddingResources?: boolean
}
const ResourceTypeList: React.FC<ResourceTypeListProps> = props => {
  const {
    selectionType,
    resourceCategoryMap,
    onSelectionTypeChange,
    onResourceSelectionChange,
    onResourceCategorySelect,
    preSelectedResourceList,
    disableAddingResources
  } = props

  const { getString } = useStrings()

  const getChecked = (resourceCategory: ResourceType | ResourceCategory, resourceTypes?: ResourceType[]): boolean => {
    if (resourceTypes) {
      return Array.from(resourceTypes).every(value => preSelectedResourceList.includes(value))
    } else {
      return preSelectedResourceList.includes(resourceCategory as ResourceType)
    }
  }

  const getIntermittent = (resourceTypes: ResourceType[]): boolean =>
    Array.from(resourceTypes).some(value => preSelectedResourceList.includes(value))

  return (
    <Layout.Vertical flex spacing="small" className={css.resourceTypeList}>
      <Layout.Horizontal flex className={css.resourcePicker} padding={{ bottom: 'small' }}>
        <Text font={{ variation: FontVariation.H5 }} color={Color.GREY_800}>
          {getString('resources')}
        </Text>

        <Layout.Horizontal flex spacing="huge">
          <Radio
            label={getString('rbac.resourceGroup.all')}
            inline={true}
            disabled={disableAddingResources}
            value={SelectionType.ALL}
            checked={selectionType === SelectionType.ALL}
            onChange={e => {
              onSelectionTypeChange(e.currentTarget.value as SelectionType)
            }}
          />
          <Radio
            label={getString('common.specified')}
            inline={true}
            disabled={disableAddingResources}
            value={SelectionType.SPECIFIED}
            checked={selectionType === SelectionType.SPECIFIED}
            onChange={e => {
              onSelectionTypeChange(e.currentTarget.value as SelectionType)
            }}
          />
        </Layout.Horizontal>
      </Layout.Horizontal>
      {resourceCategoryMap?.keys() &&
        Array.from(resourceCategoryMap.keys()).map(resourceCategory => {
          const resourceCategoryHandler =
            RbacFactory.getResourceCategoryHandler(resourceCategory as ResourceCategory) ||
            RbacFactory.getResourceTypeHandler(resourceCategory as ResourceType)
          const resourceTypes = resourceCategoryMap.get(resourceCategory)
          return (
            resourceCategoryHandler && (
              <Card
                className={css.resourceTypeCard}
                key={resourceCategory}
                draggable={!disableAddingResources}
                onDragStart={e => {
                  e.dataTransfer.setData('text/plain', resourceCategory)
                  e.dataTransfer.dropEffect = 'copy'
                }}
              >
                <Layout.Vertical>
                  <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
                    <Checkbox
                      data-testid={`CHECK-BOX-${resourceCategory}`}
                      key={resourceCategory}
                      disabled={disableAddingResources}
                      checked={getChecked(resourceCategory, resourceTypes)}
                      indeterminate={
                        resourceTypes
                          ? getIntermittent(resourceTypes) && !getChecked(resourceCategory, resourceTypes)
                          : undefined
                      }
                      className={css.checkBox}
                      onChange={e => {
                        if (resourceTypes) onResourceCategorySelect(resourceTypes, e.currentTarget.checked)
                        else onResourceSelectionChange(resourceCategory as ResourceType, e.currentTarget.checked)
                      }}
                      value={resourceCategory}
                    />

                    <Text
                      font={{ size: 'small', weight: 'semi-bold' }}
                      color={Color.GREY_600}
                      icon={resourceCategoryHandler.icon}
                      iconProps={{ padding: { right: 'small' } }}
                    >
                      {getString(resourceCategoryHandler.label).toUpperCase()}
                    </Text>
                  </Layout.Horizontal>
                  {resourceTypes &&
                    Array.from(resourceTypes).map(resource => {
                      const resourceHandler = RbacFactory.getResourceTypeHandler(resource)
                      return (
                        resourceHandler && (
                          <Layout.Horizontal
                            key={resource}
                            flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
                            className={css.resourceSubList}
                          >
                            <Checkbox
                              data-testid={`CHECK-BOX-${resource}`}
                              disabled={disableAddingResources}
                              onChange={e => {
                                onResourceSelectionChange(resource, e.currentTarget.checked)
                              }}
                              checked={getChecked(resource)}
                            />
                            <Text font="small" color={Color.GREY_800}>
                              {getString(resourceHandler.label)}
                            </Text>
                          </Layout.Horizontal>
                        )
                      )
                    })}
                </Layout.Vertical>
              </Card>
            )
          )
        })}
    </Layout.Vertical>
  )
}
export default ResourceTypeList
