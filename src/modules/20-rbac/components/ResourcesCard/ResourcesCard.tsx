/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Layout, Text, Card, Button, Radio, Container, ButtonVariation } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import RbacFactory from '@rbac/factories/RbacFactory'
import { useStrings } from 'framework/strings'
import type { ResourceType } from '@rbac/interfaces/ResourceType'
import useAddResourceModal from '@rbac/modals/AddResourceModal/useAddResourceModal'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { isAtrributeFilterSelector, isDynamicResourceSelector } from '@rbac/utils/utils'
import type { ResourceSelectorValue } from '@rbac/pages/ResourceGroupDetails/utils'
import type { AttributeFilter } from 'services/resourcegroups'
import css from './ResourcesCard.module.scss'

interface ResourcesCardProps {
  resourceType: ResourceType
  resourceValues: ResourceSelectorValue
  onResourceSelectionChange: (
    resourceType: ResourceType,
    isAdd: boolean,
    identifiers?: string[] | undefined,
    attributeFilter?: string[] | undefined
  ) => void
  disableAddingResources?: boolean
  disableSpecificResourcesSelection?: boolean
}

const ResourcesCard: React.FC<ResourcesCardProps> = ({
  resourceType,
  resourceValues,
  onResourceSelectionChange,
  disableAddingResources,
  disableSpecificResourcesSelection
}) => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const isAtrributeFilterEnabled = useMemo(() => isAtrributeFilterSelector(resourceValues), [resourceValues])
  const { getString } = useStrings()
  const { openAddResourceModal } = useAddResourceModal({
    onSuccess: resources => {
      if (isAtrributeFilterEnabled) {
        onResourceSelectionChange(resourceType, true, undefined, resources)
      } else {
        onResourceSelectionChange(resourceType, true, resources)
      }
    }
  })

  const resourceDetails = RbacFactory.getResourceTypeHandler(resourceType)
  if (!resourceDetails) return null
  const { label, icon, addResourceModalBody, addAttributeModalBody, staticResourceRenderer, attributeRenderer } =
    resourceDetails
  const attributeSelectionEnabled = addAttributeModalBody
  const staticResourcesSelectionEnabled = !disableSpecificResourcesSelection && addResourceModalBody
  const hideRadioBtnSet = (disableSpecificResourcesSelection && !attributeSelectionEnabled) || disableAddingResources
  const staticResourceValues = isAtrributeFilterEnabled
    ? (resourceValues as AttributeFilter).attributeValues
    : resourceValues
  const resourceRenderer = isAtrributeFilterEnabled ? attributeRenderer : staticResourceRenderer

  return (
    <Card className={css.selectedResourceGroupCardDetails} key={resourceType}>
      <Layout.Horizontal flex={true}>
        <Container>
          <Text
            color={Color.BLACK}
            font={{ weight: 'semi-bold' }}
            icon={icon}
            iconProps={{ size: 30, padding: { right: 'medium' } }}
          >
            {getString(label)}
          </Text>
        </Container>
        {!hideRadioBtnSet && (
          <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} className={css.radioBtnSet}>
            <Container className={css.radioBtnCtr}>
              <Radio
                label={getString('rbac.resourceGroup.all')}
                data-testid={`dynamic-${resourceType}`}
                checked={isDynamicResourceSelector(resourceValues)}
                onChange={e => onResourceSelectionChange(resourceType, e.currentTarget.checked)}
                className={css.radioBtnLabel}
              />
            </Container>
            <Container className={css.radioBtnCtr} flex={true} padding={{ left: 'huge' }}>
              {attributeSelectionEnabled && (
                <Radio
                  label={getString('common.byType')}
                  data-testid={`attr-${resourceType}`}
                  checked={isAtrributeFilterEnabled}
                  onChange={e => onResourceSelectionChange(resourceType, e.currentTarget.checked, undefined, [])}
                  className={css.radioBtnLabel}
                />
              )}
            </Container>
            <Container className={css.radioBtnCtr}>
              {staticResourcesSelectionEnabled && (
                <Layout.Horizontal spacing="small" flex padding={{ left: 'huge' }}>
                  <Radio
                    label={getString('common.specified')}
                    data-testid={`static-${resourceType}`}
                    disabled={disableAddingResources}
                    checked={!isDynamicResourceSelector(resourceValues) && !isAtrributeFilterEnabled}
                    onChange={e => onResourceSelectionChange(resourceType, e.currentTarget.checked, [])}
                    className={css.radioBtnLabel}
                  />
                </Layout.Horizontal>
              )}
            </Container>
            <Container className={css.radioBtnCtr}>
              {(attributeSelectionEnabled || staticResourcesSelectionEnabled) && (
                <Button
                  variation={ButtonVariation.LINK}
                  data-testid={`addResources-${resourceType}`}
                  disabled={disableAddingResources || isDynamicResourceSelector(resourceValues)}
                  onClick={() => {
                    openAddResourceModal(
                      resourceType,
                      Array.isArray(staticResourceValues) ? staticResourceValues : [],
                      isAtrributeFilterEnabled
                    )
                  }}
                >
                  {getString('plusAdd')}
                </Button>
              )}
            </Container>
          </Layout.Horizontal>
        )}
      </Layout.Horizontal>

      {Array.isArray(staticResourceValues) && staticResourceValues.length > 0 && (
        <Layout.Vertical padding={{ top: 'large' }}>
          {resourceRenderer
            ? resourceRenderer({
                identifiers: staticResourceValues,
                resourceScope: { accountIdentifier: accountId, orgIdentifier, projectIdentifier },
                onResourceSelectionChange,
                resourceType,
                isAtrributeFilterEnabled
              })
            : staticResourceValues.map(resource => (
                <Layout.Horizontal padding="large" className={css.staticResource} key={resource} flex>
                  <Text>{resource}</Text>
                  <Button
                    icon="main-trash"
                    minimal
                    onClick={() => {
                      if (isAtrributeFilterEnabled) {
                        onResourceSelectionChange(resourceType, false, undefined, [resource])
                      } else {
                        onResourceSelectionChange(resourceType, false, [resource])
                      }
                    }}
                  />
                </Layout.Horizontal>
              ))}
        </Layout.Vertical>
      )}
    </Card>
  )
}
export default ResourcesCard
