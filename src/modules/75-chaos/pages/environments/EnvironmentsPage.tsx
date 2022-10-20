/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import type { Column } from 'react-table'
import { get, defaultTo, isEmpty } from 'lodash-es'
import { Container, Layout, Pagination, Text, TableV2, FontVariation, Color, TagsPopover } from '@harness/uicore'
import { Intent } from '@harness/design-system'
import cx from 'classnames'
import { HelpPanel, HelpPanelType } from '@harness/help-panel'
import {
  EnvironmentResponseDTO,
  GetEnvironmentListForProjectQueryParams,
  useDeleteEnvironmentV2,
  useGetEnvironmentListForProject
} from 'services/cd-ng'
import { useToaster } from '@common/exports'
import { EnvironmentType } from '@common/constants/EnvironmentType'
import { useConfirmAction } from '@common/hooks/useConfirmAction'
import { String, useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import ListingPageTemplate from '@chaos/components/ListingPageTemplate/ListingPageTemplate'
import EnvironmentDialog from '@chaos/components/CreateEnvironmentDialog/EnvironmentDialog'
import { NoEnvironment } from '@chaos/components/NoEnvironment/NoEnvironment'
import RbacOptionsMenuButton from '@rbac/components/RbacOptionsMenuButton/RbacOptionsMenuButton'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { withTableData } from '@chaos/utils/withTableData'

import css from './EnvironmentsPage.module.scss'

type EnvData = { environment: EnvironmentResponseDTO }
const withEnvironment = withTableData<EnvironmentResponseDTO, EnvData>(({ row }) => ({ environment: row.original }))
const withActions = withTableData<
  EnvironmentResponseDTO,
  EnvData & { actions: { [P in 'onEdit' | 'onDelete']?: (id: string) => void } }
>(({ row, column }) => ({
  environment: row.original,
  actions: (column as any).actions as { [P in 'onEdit' | 'onDelete']?: (id: string) => void }
}))

export const NameCell = withEnvironment(({ environment }) => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal
      flex={{ distribution: 'space-between', align: 'center-center' }}
      padding={{ left: 'small', right: 'small' }}
    >
      <Layout.Vertical spacing="xsmall">
        <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing="small">
          <Text color={Color.BLACK}>{environment.name}</Text>
          {!isEmpty(environment.tags) && (
            <TagsPopover
              className={css.tagsPopover}
              iconProps={{ size: 14, color: Color.GREY_600 }}
              tags={defaultTo(environment.tags, {})}
            />
          )}
        </Layout.Horizontal>

        <Container padding={{ top: 'xsmall' }} margin={{ bottom: 'xsmall' }}>
          <Text color={Color.GREY_600} font={{ variation: FontVariation.SMALL }}>
            {getString('common.ID')}: {environment.identifier}
          </Text>
        </Container>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
})

export const TypeCell = withEnvironment(({ environment }) => {
  return (
    <Text
      className={cx(css.environmentType, {
        [css.production]: environment.type === EnvironmentType.PRODUCTION
      })}
      font={{ size: 'small' }}
    >
      {environment.type === EnvironmentType.PRODUCTION ? 'Prod' : 'Pre-Prod'}
    </Text>
  )
})

export const ModifiedByCell = withActions(({ environment, actions }) => {
  const { getString } = useStrings()
  const identifier = environment.identifier as string
  const deleteEnvironment = useConfirmAction({
    title: getString('chaos.environments.delete.title'),
    message: <String useRichText stringID="chaos.environments.delete.message" vars={{ name: environment.name }} />,
    action: () => {
      actions.onDelete?.(identifier)
    },
    intent: Intent.DANGER,
    confirmText: getString('delete')
  })

  return (
    <Layout.Horizontal style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* TODO: Add user info when BE is ready */}
      <Container
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
        }}
      >
        <RbacOptionsMenuButton
          items={[
            {
              icon: 'edit',
              text: getString('edit'),
              onClick: () => actions.onEdit?.(identifier),
              permission: {
                resource: { resourceType: ResourceType.ENVIRONMENT },
                permission: PermissionIdentifier.EDIT_ENVIRONMENT
              }
            },
            {
              icon: 'trash',
              text: getString('delete'),
              onClick: deleteEnvironment,
              permission: {
                resource: { resourceType: ResourceType.ENVIRONMENT },
                permission: PermissionIdentifier.DELETE_ENVIRONMENT
              }
            }
          ]}
        />
      </Container>
    </Layout.Horizontal>
  )
})

type CustomColumn<T extends Record<string, any>> = Column<T>

const ChaosEnvironments: React.FC = () => {
  const { getString } = useStrings()
  const { showError, showSuccess } = useToaster()
  const history = useHistory()
  const [page, setPage] = useState(0)
  const { accountId: accountIdentifier, projectIdentifier, orgIdentifier } = useParams<Record<string, string>>()
  const queryParams = useMemo<GetEnvironmentListForProjectQueryParams>(() => {
    return {
      accountId: accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      size: 15,
      page
    }
  }, [accountIdentifier, orgIdentifier, projectIdentifier, page])
  const {
    data: envData,
    loading,
    error,
    refetch
  } = useGetEnvironmentListForProject({
    queryParams
  })
  const { mutate: deleteEnvironment } = useDeleteEnvironmentV2({
    queryParams: {
      accountIdentifier,
      projectIdentifier,
      orgIdentifier
    }
  })
  const environments = envData?.data?.content
  const hasEnvs = Boolean(!loading && envData?.data?.content?.length)
  const emptyEnvs = Boolean(!loading && envData?.data?.content?.length === 0)

  const handleEdit = (id: string) => {
    history.push(
      routes.toChaosEnvironmentDetails({
        environmentIdentifier: id,
        projectIdentifier,
        orgIdentifier,
        accountId: accountIdentifier
      })
    )
  }

  const handleDeleteEnv = async (id: string) => {
    try {
      await deleteEnvironment(id, { headers: { 'content-type': 'application/json' } })
      showSuccess(getString('chaos.environments.delete.toastMessage', { environmentId: id }))
      refetch()
    } catch (e) {
      /* istanbul ignore next */
      showError(get(e, 'data.message', e?.message), 0, 'chaos.delete.env.error')
    }
  }

  const columns: CustomColumn<EnvironmentResponseDTO>[] = useMemo(
    () => [
      {
        Header: getString('environment'),
        font: FontVariation.TABLE_HEADERS,
        id: 'name',
        width: '20%',
        accessor: 'name',
        Cell: NameCell
      },
      {
        Header: getString('typeLabel'),
        font: FontVariation.TABLE_HEADERS,
        id: 'type',
        accessor: 'type',
        width: '20%',
        Cell: TypeCell
      },
      {
        id: 'modifiedBy',
        font: FontVariation.TABLE_HEADERS,
        width: '60%',
        Cell: ModifiedByCell,
        actions: {
          onEdit: handleEdit,
          onDelete: handleDeleteEnv
        }
      }
    ],
    [getString, handleDeleteEnv]
  )

  const params = useParams<ProjectPathProps>()

  return (
    <ListingPageTemplate
      title={getString('chaos.environments.pageTitle', { projectName: projectIdentifier })}
      breadcrumbs={[
        {
          label: getString('environments'),
          url: routes.toChaosEnvironments({ ...params })
        }
      ]}
      toolbar={
        hasEnvs && (
          <Layout.Horizontal>
            <EnvironmentDialog
              disabled={loading}
              environments={environments}
              onCreate={response => {
                /* istanbul ignore next */
                setTimeout(() => {
                  history.push(
                    routes.toChaosEnvironmentDetails({
                      environmentIdentifier: response?.data?.identifier as string,
                      projectIdentifier,
                      orgIdentifier,
                      accountId: accountIdentifier
                    })
                  )
                }, 1000)
              }}
            />
          </Layout.Horizontal>
        )
      }
      pagination={
        <Pagination
          itemCount={envData?.data?.totalItems || 0}
          pageSize={envData?.data?.pageSize || 0}
          pageCount={envData?.data?.totalPages || 0}
          pageIndex={page}
          gotoPage={index => {
            /* istanbul ignore next */
            setPage(index)
            /* istanbul ignore next */
            refetch({ queryParams: { ...queryParams, page: index } })
          }}
        />
      }
      error={error}
      retryOnError={refetch}
      loading={loading}
    >
      {hasEnvs && (
        <Container padding={{ top: 'medium', right: 'xlarge', left: 'xlarge' }}>
          <TableV2<EnvironmentResponseDTO>
            columns={columns}
            data={(environments as EnvironmentResponseDTO[]) || []}
            onRowClick={({ identifier }) => handleEdit(identifier as string)}
          />
        </Container>
      )}
      {emptyEnvs && (
        <Container flex={{ align: 'center-center' }} height="100%">
          <NoEnvironment
            onCreated={
              /* istanbul ignore next */ response =>
                setTimeout(() => {
                  history.push(
                    routes.toChaosEnvironmentDetails({
                      environmentIdentifier: response?.data?.identifier as string,
                      projectIdentifier,
                      orgIdentifier,
                      accountId: accountIdentifier
                    })
                  )
                }, 1000)
            }
          />
        </Container>
      )}
      <HelpPanel referenceId="chaosEnvironment" type={HelpPanelType.FLOATING_CONTAINER} />
    </ListingPageTemplate>
  )
}

export default ChaosEnvironments
