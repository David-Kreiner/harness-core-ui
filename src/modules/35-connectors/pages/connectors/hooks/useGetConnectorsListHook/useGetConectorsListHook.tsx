/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ConnectorCatalogueItem, ResponseConnectorCatalogueResponse, useGetConnectorCatalogue } from 'services/cd-ng'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { AddDrawerMapInterface, ItemInterface, CategoryInterface } from '@common/components/AddDrawer/AddDrawer'
import { Connectors } from '@connectors/constants'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { getConnectorDisplayName, getIconByType } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { FeatureWarningTooltip } from '@common/components/FeatureWarning/FeatureWarningWithTooltip'
import { useStrings } from 'framework/strings'
import { usePermissionsContext } from 'framework/rbac/PermissionsContext'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { useFeature } from '@common/hooks/useFeatures'
import type { UseGetMockData } from '@common/utils/testUtils'
import RBACTooltip from '@rbac/components/RBACTooltip/RBACTooltip'
import type { ComputedDrawerMapData, UseGetConnectorsListHookReturn } from './useGetConectorsListHook.types'
import css from './useGetConnectorsListHook.module.scss'

export const useGetConnectorsListHook = (
  catalogueMockData?: UseGetMockData<ResponseConnectorCatalogueResponse>
): UseGetConnectorsListHookReturn => {
  const isErrorTrackingEnabled = useFeatureFlag(FeatureFlag.CVNG_ENABLED)
  const isCustomSMEnabled = useFeatureFlag(FeatureFlag.CUSTOM_SECRET_MANAGER_NG)
  const isGcpSMEnabled = useFeatureFlag(FeatureFlag.PL_ENABLE_GOOGLE_SECRET_MANAGER_IN_NG)
  const isSpotElastigroupEnabled = useFeatureFlag(FeatureFlag.SPOT_ELASTIGROUP_NG)
  // This list will control which categories will be displayed in UI and its order
  const connectorCatalogueOrder: Array<ConnectorCatalogueItem['category']> = [
    'CLOUD_PROVIDER',
    'ARTIFACTORY',
    'CLOUD_COST',
    'CODE_REPO',
    'TICKETING',
    'MONITORING',
    'SECRET_MANAGER'
  ]
  const { getString } = useStrings()
  const { checkPermission } = usePermissionsContext()

  const ConnectorCatalogueNames = new Map<ConnectorCatalogueItem['category'], string>()

  ConnectorCatalogueNames.set('CLOUD_PROVIDER', getString('cloudProviders'))
  ConnectorCatalogueNames.set('ARTIFACTORY', getString('artifactRepositories'))
  ConnectorCatalogueNames.set('CODE_REPO', getString('codeRepositories'))
  ConnectorCatalogueNames.set('TICKETING', getString('ticketingSystems'))
  ConnectorCatalogueNames.set('MONITORING', getString('monitoringAndLoggingSystems'))
  ConnectorCatalogueNames.set('SECRET_MANAGER', getString('secretManagers'))
  ConnectorCatalogueNames.set('CLOUD_COST', getString('cloudCostsText'))

  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps & ModulePathParams>()
  const [connectorsData, setConnectorsData] = useState<ComputedDrawerMapData>()
  const { data, loading } = useGetConnectorCatalogue({
    queryParams: { accountIdentifier: accountId },
    ...(catalogueMockData && { mock: catalogueMockData })
  })

  const featureInfo = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.CCM_K8S_CLUSTERS
    }
  })

  const computeCategoriesMap = React.useCallback(
    (catalogueData: ResponseConnectorCatalogueResponse | null): ComputedDrawerMapData => {
      const originalData = catalogueData?.data?.catalogue || []
      originalData.forEach(value => {
        if (value.category === 'SECRET_MANAGER') {
          value.connectors = ['Vault', 'AwsKms', 'AzureKeyVault', 'AwsSecretManager', 'GcpKms', 'CustomSecretManager']
          if (isGcpSMEnabled) {
            value.connectors.push('GcpSecretManager')
          }
        }
      })
      const orderedCatalogue: ConnectorCatalogueItem[] | { category: string; connectors: string[] } = []
      connectorCatalogueOrder.forEach(catalogueItem => {
        const catalogueEntry = originalData.find(item => item['category'] === catalogueItem)
        const isProjectOrOrg = projectIdentifier != undefined || orgIdentifier != undefined
        if (catalogueEntry && !(catalogueEntry.category == 'CLOUD_COST' && isProjectOrOrg)) {
          // CLOUD_COST should not be displayed at project or org level drawer
          orderedCatalogue.push(catalogueEntry)
        }
      })

      const k8sLimitWarningRenderer = (): JSX.Element => {
        const { featureDetail: { count, limit } = {} } = featureInfo
        return (
          <section className={css.limitWarningTooltipCtn}>
            <FeatureWarningTooltip
              featureName={FeatureIdentifier.CCM_K8S_CLUSTERS}
              warningMessage={getString('connectors.ceK8.featureWarning', { count, limit })}
            />
          </section>
        )
      }

      const RestrictionLimitWarningRenderers: Record<string, (item: ItemInterface) => React.ReactNode> = {
        CEK8sCluster: k8sLimitWarningRenderer
      }

      const isRestrictedConnector = (item: ConnectorCatalogueItem, connector: string): boolean => {
        const { category } = item
        if (!category) {
          return false
        }

        if (connectorCatalogueOrder.includes(category)) {
          const permissionRequest = {
            resourceScope: {
              accountIdentifier: accountId,
              orgIdentifier,
              projectIdentifier
            },
            resourceAttributes: {
              category
            },
            resourceType: ResourceType.CONNECTOR,
            permission: PermissionIdentifier.UPDATE_CONNECTOR
          }
          return !checkPermission(permissionRequest) // Invert the boolean resultas restricted is inversion of permitted
        }

        // TODO: make it generic
        return connector === 'CEK8sCluster' && !featureInfo.enabled
      }

      const filterConnectors = (connector: string): boolean => {
        switch (connector) {
          case Connectors.ERROR_TRACKING:
            return isErrorTrackingEnabled
          case Connectors.CUSTOM_SECRET_MANAGER:
            return isCustomSMEnabled
          case Connectors.SPOT:
            return isSpotElastigroupEnabled
          default:
            return true
        }
      }

      const getAccessWarningMessage = (category: ResourceType, resourceTypeLabel: string): ReactElement => {
        return (
          <RBACTooltip
            permission={PermissionIdentifier.UPDATE_CONNECTOR}
            resourceType={category as ResourceType}
            resourceTypeLabel={resourceTypeLabel}
            resourceScope={{
              accountIdentifier: accountId,
              projectIdentifier,
              orgIdentifier
            }}
          />
        )
      }

      const categoriesList = [] as any
      const categories =
        orderedCatalogue.map((item: ConnectorCatalogueItem) => {
          const categoryLabel = ConnectorCatalogueNames.get(item['category']) || ''
          return {
            categoryLabel,
            warningTooltipRenderer: i => {
              if (connectorCatalogueOrder.includes(item['category'])) {
                return getAccessWarningMessage(item['category'] as ResourceType, categoryLabel)
              }
              const renderer = RestrictionLimitWarningRenderers[i.value]
              return renderer && renderer(i)
            },
            items:
              item.connectors
                ?.filter(connector => filterConnectors(connector))
                .sort((a, b) => (getConnectorDisplayName(a) < getConnectorDisplayName(b) ? -1 : 1))
                .filter(entry => {
                  const name = entry.valueOf() || ''
                  if (name === 'CustomSecretManager') {
                    return isCustomSMEnabled
                  }
                  return true
                })
                .map(entry => {
                  const name = entry.valueOf() || ''
                  categoriesList.push(name)
                  return {
                    itemLabel: getConnectorDisplayName(entry) || name,
                    iconName: getIconByType(entry),
                    value: name,
                    disabled: isRestrictedConnector(item, entry)
                  }
                }) || []
          } as CategoryInterface
        }) || []

      return {
        categoriesMap: {
          drawerLabel: 'Connectors',
          categories
        },
        categoriesList
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    const computedDrawerMapData = computeCategoriesMap(data)
    setConnectorsData(computedDrawerMapData)
  }, [computeCategoriesMap, data])

  return {
    loading,
    categoriesMap: connectorsData?.categoriesMap as AddDrawerMapInterface,
    connectorsList: connectorsData?.categoriesList,
    connectorCatalogueOrder
  }
}
