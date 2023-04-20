/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo } from 'react'
import { Text, Layout, Icon, Button, Popover, TagsPopover, TableV2 } from '@harness/uicore'
import type { CellProps, Renderer, Column } from 'react-table'
import { Color } from '@harness/design-system'
import { Classes, Position } from '@blueprintjs/core'
import { useHistory, useParams } from 'react-router-dom'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import type { Project, ProjectAggregateDTO, ResponsePageProjectAggregateDTO } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import { String, useStrings } from 'framework/strings'
import { ModuleName } from 'framework/types/ModuleName'
import ContextMenu from '@projects-orgs/components/Menu/ContextMenu'
import { getModuleIcon } from '@common/utils/utils'
import RbacAvatarGroup from '@rbac/components/RbacAvatarGroup/RbacAvatarGroup'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import DescriptionPopover from '@common/components/DescriptionPopover.tsx/DescriptionPopover'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import useNavModuleInfo from '@common/hooks/useNavModuleInfo'
import { useDefaultPaginationProps } from '@common/hooks/useDefaultPaginationProps'
import { COMMON_DEFAULT_PAGE_SIZE } from '@common/constants/Pagination'
import useDeleteProjectDialog from '../../DeleteProject'
import css from './ProjectListView.module.scss'

interface ProjectListViewProps {
  data: ResponsePageProjectAggregateDTO | null
  showEditProject?: (project: Project) => void
  collaborators?: (project: Project) => void
  reloadPage: () => Promise<void>
}

type CustomColumn<T extends Record<string, any>> = Column<T> & {
  refetchProjects?: () => Promise<void>
  editProject?: (project: Project) => void
  collaborators?: (project: Project) => void
}

export const RenderColumnProject: Renderer<CellProps<ProjectAggregateDTO>> = ({ row }) => {
  const project = row.original.projectResponse.project
  const { getString } = useStrings()
  return (
    <Layout.Horizontal
      spacing="small"
      flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
      padding={{ right: 'medium' }}
    >
      <div className={css.colorbox} style={{ backgroundColor: `${project.color}` }} />
      <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }} className={css.projectTextContainer}>
        <Layout.Horizontal spacing="small">
          <Text color={Color.BLACK} lineClamp={1} className={css.project}>
            {project.name}
          </Text>
          {project.tags && Object.keys(project.tags).length ? <TagsPopover tags={project.tags} /> : null}
          {project.description && <DescriptionPopover text={project.description} />}
        </Layout.Horizontal>
        <Text color={Color.GREY_600} lineClamp={1} className={css.project} font={{ size: 'small' }}>
          {getString('idLabel', { id: project.identifier })}
        </Text>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}
export const RenderColumnOrganization: Renderer<CellProps<ProjectAggregateDTO>> = ({ row }) => {
  const data = row.original
  return (
    <Text color={Color.BLACK} lineClamp={1} className={css.org}>
      {data.organization?.name}
    </Text>
  )
}

const RenderColumnModules: Renderer<CellProps<ProjectAggregateDTO>> = ({ row }) => {
  const { CVNG_ENABLED, CING_ENABLED, CENG_ENABLED, CFNG_ENABLED, CHAOS_ENABLED, CET_ENABLED } = useFeatureFlags()
  const { licenseInformation } = useLicenseStore()
  const data = row.original
  const shouldShowModules = data.projectResponse.project.modules?.length
  const { shouldVisible } = useNavModuleInfo(ModuleName.CD)
  function getModuleIcons(project: Project): React.ReactElement[] {
    const modules = project.modules
    const icons = []

    if (shouldVisible && modules?.includes(ModuleName.CD)) {
      icons.push(<Icon name={getModuleIcon(ModuleName.CD)} size={20} key={ModuleName.CD} />)
    }

    if (CING_ENABLED && modules?.includes(ModuleName.CI)) {
      icons.push(<Icon name={getModuleIcon(ModuleName.CI)} size={20} key={ModuleName.CI} />)
    }

    if (CFNG_ENABLED && modules?.includes(ModuleName.CF)) {
      icons.push(<Icon name={getModuleIcon(ModuleName.CF)} size={20} key={ModuleName.CF} />)
    }

    if (CENG_ENABLED && modules?.includes(ModuleName.CE)) {
      icons.push(<Icon name={getModuleIcon(ModuleName.CE)} size={20} key={ModuleName.CE} />)
    }

    if (CVNG_ENABLED && modules?.includes(ModuleName.CV)) {
      icons.push(<Icon name={getModuleIcon(ModuleName.CV)} size={20} key={ModuleName.CV} />)
    }

    if (licenseInformation['STO']?.status === 'ACTIVE' && modules?.includes(ModuleName.STO)) {
      icons.push(<Icon name={getModuleIcon(ModuleName.STO)} size={20} key={ModuleName.STO} />)
    }

    if (CHAOS_ENABLED && modules?.includes(ModuleName.CHAOS)) {
      icons.push(<Icon name={getModuleIcon(ModuleName.CHAOS)} size={20} key={ModuleName.CHAOS} />)
    }

    if (CET_ENABLED && modules?.includes(ModuleName.CET)) {
      icons.push(<Icon name={getModuleIcon(ModuleName.CET)} size={20} key={ModuleName.CET} />)
    }

    return icons
  }

  return (
    <Layout.Horizontal spacing="medium">
      {shouldShowModules ? (
        getModuleIcons(data.projectResponse.project)
      ) : (
        <Text color={Color.GREY_350} font={{ size: 'small' }}>
          <String stringID="moduleRenderer.start" />
        </Text>
      )}
    </Layout.Horizontal>
  )
}

const RenderColumnAdmin: Renderer<CellProps<ProjectAggregateDTO>> = ({ row, column }) => {
  const { accountId } = useParams<AccountPathProps>()
  const data = row.original
  const project = data.projectResponse.project
  return (
    <RbacAvatarGroup
      avatars={
        data.admins?.length
          ? data.admins.map(admin => {
              return { name: admin.name, email: admin.email }
            })
          : [{}]
      }
      onAdd={event => {
        event.stopPropagation()
        const { collaborators } = column as any
        collaborators(project)
      }}
      restrictLengthTo={2}
      permission={{
        resourceScope: {
          accountIdentifier: accountId,
          orgIdentifier: project.orgIdentifier,
          projectIdentifier: project.identifier
        },
        resource: {
          resourceType: ResourceType.USER
        },
        permission: PermissionIdentifier.INVITE_USER
      }}
    />
  )
}
const RenderColumnCollabrators: Renderer<CellProps<ProjectAggregateDTO>> = ({ row, column }) => {
  const { accountId } = useParams<AccountPathProps>()
  const data = row.original
  const project = data.projectResponse.project
  const { getString } = useStrings()
  return (
    <Layout.Horizontal flex={{ alignItems: 'center', inline: true }}>
      <RbacAvatarGroup
        avatars={data.collaborators?.length ? data.collaborators : [{}]}
        onAdd={event => {
          event.stopPropagation()
          const { collaborators } = column as any
          collaborators(project)
        }}
        restrictLengthTo={2}
        permission={{
          resourceScope: {
            accountIdentifier: accountId,
            orgIdentifier: project.orgIdentifier,
            projectIdentifier: project.identifier
          },
          resource: {
            resourceType: ResourceType.USER
          },
          permission: PermissionIdentifier.INVITE_USER
        }}
      />
      {!data.collaborators?.length ? (
        <Text font={{ size: 'small' }} color={Color.GREY_350}>
          {getString('projectsOrgs.noCollaborators')}
        </Text>
      ) : null}
    </Layout.Horizontal>
  )
}
const RenderColumnMenu: Renderer<CellProps<ProjectAggregateDTO>> = ({ row, column }) => {
  const data = row.original.projectResponse.project
  const [menuOpen, setMenuOpen] = useState(false)
  const onDeleted = (): void => {
    ;(column as any).refetchProjects()
  }
  const { openDialog } = useDeleteProjectDialog(data, onDeleted)

  return (
    <Layout.Horizontal className={css.layout}>
      <Popover
        isOpen={menuOpen}
        onInteraction={nextOpenState => {
          setMenuOpen(nextOpenState)
        }}
        className={Classes.DARK}
        position={Position.BOTTOM_RIGHT}
      >
        <Button
          minimal
          icon="Options"
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
          data-testid={`menu-${data.identifier + data.orgIdentifier}`}
        />
        <ContextMenu
          project={data}
          reloadProjects={(column as any).refetchProjects}
          editProject={(column as any).editProject}
          collaborators={(column as any).collaborators}
          setMenuOpen={setMenuOpen}
          openDialog={openDialog}
        />
      </Popover>
    </Layout.Horizontal>
  )
}

const ProjectListView: React.FC<ProjectListViewProps> = props => {
  const { data, showEditProject, collaborators, reloadPage } = props
  const history = useHistory()
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()

  const columns: CustomColumn<ProjectAggregateDTO>[] = useMemo(
    () => [
      {
        Header: getString('projectLabel'),
        id: 'name',
        accessor: row => row.projectResponse.project.name,
        width: '30%',
        Cell: RenderColumnProject
      },
      {
        Header: getString('orgLabel'),
        id: 'orgName',
        accessor: row => row.projectResponse.project.orgIdentifier,
        width: '20%',
        Cell: RenderColumnOrganization
      },
      {
        Header: getString('adminLabel'),
        id: 'admin',
        accessor: row => row.projectResponse.project.color,
        width: '15%',
        Cell: RenderColumnAdmin,
        collaborators: collaborators,
        disableSortBy: true
      },
      {
        Header: getString('collaboratorsLabel'),
        id: 'collaborators',
        accessor: row => row.projectResponse.createdAt,
        width: '15%',
        Cell: RenderColumnCollabrators,
        collaborators: collaborators,
        disableSortBy: true
      },
      {
        Header: getString('modules'),
        id: 'modules',
        accessor: row => row.projectResponse.project.modules,
        width: '15%',
        Cell: RenderColumnModules,
        disableSortBy: true
      },
      {
        Header: '',
        id: 'menu',
        accessor: row => row.projectResponse.project.identifier,
        width: '5%',
        Cell: RenderColumnMenu,
        refetchProjects: reloadPage,
        editProject: showEditProject,
        collaborators: collaborators,
        disableSortBy: true
      }
    ],
    [reloadPage, showEditProject, collaborators]
  )

  const paginationProps = useDefaultPaginationProps({
    itemCount: data?.data?.totalItems || 0,
    pageSize: data?.data?.pageSize || COMMON_DEFAULT_PAGE_SIZE,
    pageCount: data?.data?.totalPages || 0,
    pageIndex: data?.data?.pageIndex || 0
  })

  return (
    <TableV2<ProjectAggregateDTO>
      className={css.table}
      columns={columns}
      name="ProjectListView"
      data={data?.data?.content || []}
      onRowClick={project => {
        history.push(
          routes.toProjectDetails({
            projectIdentifier: project.projectResponse.project.identifier,
            orgIdentifier: project.projectResponse.project.orgIdentifier || '',
            accountId
          })
        )
      }}
      pagination={paginationProps}
    />
  )
}

export default ProjectListView
