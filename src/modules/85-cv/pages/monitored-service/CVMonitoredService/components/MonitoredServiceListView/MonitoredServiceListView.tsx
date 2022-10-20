/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams, Link } from 'react-router-dom'
import type { CellProps, Renderer } from 'react-table'
import { Container, Text, Layout, TableV2, NoDataCard, Heading, Utils, TagsPopover } from '@wings-software/uicore'
import { Classes } from '@blueprintjs/core'
import { FontVariation, Color } from '@harness/design-system'
import { isEmpty } from 'lodash-es'
import { HelpPanel, HelpPanelType } from '@harness/help-panel'
import { useStrings } from 'framework/strings'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import routes from '@common/RouteDefinitions'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { usePermission } from '@rbac/hooks/usePermission'
import ToggleOnOff from '@cv/pages/monitored-service/CVMonitoredService/components/ToggleOnOff/ToggleOnOff'
import noServiceAvailableImage from '@cv/assets/noServiceAvailable.png'
import FilterCard from '@cv/components/FilterCard/FilterCard'
import ContextMenuActions from '@cv/components/ContextMenuActions/ContextMenuActions'
import type { MonitoredServiceListItemDTO } from 'services/cv'
import { EnvironmentToolTipDisplay } from '@cv/components/HarnessServiceAndEnvironment/components/EnvironmentToolTipDisplay'
import IconGrid from '../IconGrid/IconGrid'
import {
  calculateChangePercentage,
  RenderHealthTrend,
  RenderHealthScore,
  ServiceDeleteContext,
  getMonitoredServiceFilterOptions
} from '../../CVMonitoredService.utils'
import type { MonitoredServiceListViewProps } from '../../CVMonitoredService.types'
import MonitoredServiceCategory from '../../../components/Configurations/components/Dependency/component/components/MonitoredServiceCategory/MonitoredServiceCategory'
import { getListTitle } from './MonitoredServiceListView.utils'
import SLOsIconGrid from '../SLOsIconGrid/SLOsIconGrid'
import css from '../../CVMonitoredService.module.scss'

const CategoryProps: Renderer<CellProps<MonitoredServiceListItemDTO>> = ({ row }) => (
  <MonitoredServiceCategory type={row.original.type} abbrText verticalAlign />
)

const RenderServiceName: Renderer<CellProps<MonitoredServiceListItemDTO>> = ({ row }) => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { identifier, serviceName, tags = {}, environmentRefList, type, environmentRef } = row.original || {}

  const envRefList = environmentRefList

  return (
    <Layout.Vertical>
      <Layout.Horizontal spacing="small" flex={{ alignItems: 'flex-start', justifyContent: 'start' }}>
        <Link
          to={routes.toCVAddMonitoringServicesEdit({
            accountId,
            orgIdentifier,
            projectIdentifier,
            identifier,
            module: 'cv'
          })}
        >
          <Text
            color={Color.PRIMARY_7}
            className={css.monitoredServiceName}
            title={serviceName}
            font={{ align: 'left', size: 'normal', weight: 'semi-bold' }}
          >
            {serviceName}
          </Text>
        </Link>
        {!isEmpty(tags) ? (
          <TagsPopover
            tags={tags}
            iconProps={{ size: 12, color: Color.GREY_600 }}
            popoverProps={{ className: Classes.DARK }}
            className={css.tags}
          />
        ) : null}
      </Layout.Horizontal>
      <Link
        to={routes.toCVAddMonitoringServicesEdit({
          accountId,
          projectIdentifier,
          orgIdentifier,
          identifier,
          module: 'cv'
        })}
      >
        <EnvironmentToolTipDisplay
          type={type}
          color={Color.PRIMARY_7}
          font={{ align: 'left', size: 'xsmall' }}
          envRefList={envRefList}
          environmentRef={environmentRef}
        />
      </Link>
    </Layout.Vertical>
  )
}

const RenderServiceChanges: Renderer<CellProps<MonitoredServiceListItemDTO>> = ({ row }) => {
  const { getString } = useStrings()
  const monitoredService = row.original

  if (!monitoredService.changeSummary?.categoryCountMap) {
    return <></>
  }

  const { Deployment, Infrastructure, Alert } = monitoredService.changeSummary.categoryCountMap
  const { color, percentage } = calculateChangePercentage(monitoredService.changeSummary)
  const styles = {
    font: { variation: FontVariation.H6 },
    color: Color.BLACK
  }

  return (
    <Layout.Horizontal spacing="medium" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
      <Text
        tooltip={getString('deploymentText')}
        icon="nav-project"
        iconProps={{ size: 16, color: Color.GREY_700 }}
        {...styles}
      >
        {Deployment.count ?? 0}
      </Text>
      <Text
        tooltip={getString('infrastructureText')}
        icon="infrastructure"
        iconProps={{ size: 20, color: Color.GREY_700 }}
        {...styles}
      >
        {Infrastructure.count ?? 0}
      </Text>
      <Text
        tooltip={getString('cv.changeSource.tooltip.incidents')}
        icon="warning-outline"
        iconProps={{ size: 16 }}
        {...styles}
      >
        {Alert.count ?? 0}
      </Text>
      <Text
        icon="symbol-triangle-up"
        color={color}
        font={{ variation: FontVariation.TINY_SEMI }}
        iconProps={{ size: 10, color: color }}
      >
        {`${percentage}%`}
      </Text>
    </Layout.Horizontal>
  )
}

const RenderDependenciesHealth: Renderer<CellProps<MonitoredServiceListItemDTO>> = ({ row }) => {
  const monitoredService = row.original

  if (monitoredService.dependentHealthScore?.length) {
    return (
      <IconGrid
        iconProps={{ name: 'polygon', size: 14, padding: { right: 'xsmall' } }}
        items={monitoredService.dependentHealthScore}
        width={100}
      />
    )
  }

  return null
}

const RenderSLOErrorBudgetData: Renderer<CellProps<MonitoredServiceListItemDTO>> = ({ row }) => {
  const monitoredService = row.original

  if (monitoredService.sloHealthIndicators?.length) {
    return (
      <SLOsIconGrid
        iconProps={{ name: 'symbol-square', size: 14, padding: { right: 'xsmall' } }}
        items={monitoredService.sloHealthIndicators}
        width={100}
      />
    )
  }

  return <></>
}

const MonitoredServiceListView: React.FC<MonitoredServiceListViewProps> = ({
  serviceCountData,
  monitoredServiceListData,
  selectedFilter,
  onFilter,
  onEditService,
  onDeleteService,
  onToggleService,
  healthMonitoringFlagLoading,
  refetchServiceCountData,
  setPage
}) => {
  const { getString } = useStrings()

  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()

  const { content, pageSize = 0, pageIndex = 0, totalPages = 0, totalItems = 0 } = monitoredServiceListData || {}

  const RenderStatusToggle: Renderer<CellProps<MonitoredServiceListItemDTO>> = ({ row }) => {
    const monitoredService = row.original

    const [canToggle] = usePermission(
      {
        resource: {
          resourceType: ResourceType.MONITOREDSERVICE,
          resourceIdentifier: projectIdentifier
        },
        permissions: [PermissionIdentifier.TOGGLE_MONITORED_SERVICE]
      },
      [projectIdentifier]
    )

    const onCopy = (): void => {
      const environmentVariables = `ET_COLLECTOR_URL: <check documentation for value>
ET_PROJECT_ID: ${projectIdentifier}
ET_ACCOUNT_ID: ${accountId}
ET_ORG_ID: ${orgIdentifier}
ET_ENV_ID: ${monitoredService.environmentRef}
ET_APPLICATION_NAME: ${monitoredService.serviceRef}
ET_DEPLOYMENT_NAME: <replace with deployment version>`
      Utils.copy(environmentVariables)
    }

    return (
      <>
        <HelpPanel referenceId="monitoredServiceDetails" type={HelpPanelType.FLOATING_CONTAINER} />
        <Layout.Horizontal flex={{ alignItems: 'center' }}>
          <ToggleOnOff
            disabled={!canToggle}
            checked={Boolean(monitoredService.healthMonitoringEnabled)}
            loading={healthMonitoringFlagLoading}
            onChange={checked => {
              onToggleService(monitoredService.identifier as string, checked)
            }}
          />
          <ContextMenuActions
            titleText={getString('common.delete', { name: monitoredService.serviceName })}
            contentText={<ServiceDeleteContext serviceName={monitoredService.serviceName} />}
            confirmButtonText={getString('yes')}
            deleteLabel={getString('cv.monitoredServices.deleteService')}
            onDelete={() => {
              onDeleteService(monitoredService.identifier as string)
            }}
            editLabel={getString('cv.monitoredServices.editService')}
            onEdit={() => {
              onEditService(monitoredService.identifier as string)
            }}
            copyLabel={getString('cv.monitoredServices.copyET')}
            onCopy={onCopy}
            RbacPermissions={{
              edit: {
                permission: PermissionIdentifier.EDIT_MONITORED_SERVICE,
                resource: {
                  resourceType: ResourceType.MONITOREDSERVICE,
                  resourceIdentifier: projectIdentifier
                }
              },
              delete: {
                permission: PermissionIdentifier.DELETE_MONITORED_SERVICE,
                resource: {
                  resourceType: ResourceType.MONITOREDSERVICE,
                  resourceIdentifier: projectIdentifier
                }
              }
            }}
          />
        </Layout.Horizontal>
      </>
    )
  }

  const filterOptions = getMonitoredServiceFilterOptions(getString, serviceCountData)

  return (
    <Container padding={{ top: 'medium', left: 'xlarge', right: 'xlarge' }} height="inherit">
      <FilterCard
        data={filterOptions}
        cardClassName={css.filterCard}
        selected={filterOptions.find(card => card.type === selectedFilter)}
        onChange={item => onFilter(item.type)}
      />
      {content?.length ? (
        <>
          <Heading
            level={2}
            font={{ variation: FontVariation.H6 }}
            color={Color.GREY_800}
            padding={{ top: 'large', bottom: 'large' }}
          >
            {getListTitle(getString, selectedFilter, totalItems)}
          </Heading>
          <TableV2
            sortable={true}
            columns={[
              {
                Header: ' ',
                width: '2.5%',
                Cell: CategoryProps
              },
              {
                Header: getString('name'),
                width: '13.5%',
                Cell: RenderServiceName
              },
              {
                Header: getString('cv.monitoredServices.sloErrorBudget'),
                width: '13%',
                Cell: RenderSLOErrorBudgetData
              },
              {
                Header: getString('cv.monitoredServices.table.changes'),
                width: '15%',
                Cell: RenderServiceChanges
              },
              {
                Header: getString('cv.monitoredServices.table.lastestHealthTrend'),
                width: '18%',
                Cell: RenderHealthTrend
              },
              {
                Header: getString('cv.monitoredServices.table.serviceHealthScore'),
                width: '15%',
                Cell: RenderHealthScore
              },
              {
                Header: getString('cv.monitoredServices.dependenciesHealth'),
                width: '15%',
                Cell: RenderDependenciesHealth
              },
              {
                Header: getString('enabledLabel'),
                width: '8%',
                Cell: RenderStatusToggle
              }
            ]}
            data={content}
            pagination={{
              pageSize,
              pageIndex,
              pageCount: totalPages,
              itemCount: totalItems,
              gotoPage: nextPage => {
                setPage(nextPage)
                refetchServiceCountData()
              }
            }}
          />
        </>
      ) : content && !content.length ? (
        <NoDataCard
          image={noServiceAvailableImage}
          message={getString('cv.monitoredServices.youHaveNoMonitoredServices')}
          imageClassName={css.noServiceAvailableImage}
          containerClassName={css.noDataContainer}
        />
      ) : null}
    </Container>
  )
}

export default MonitoredServiceListView
