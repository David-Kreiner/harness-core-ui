/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ButtonVariation, Layout, ExpandingSearchInput, Button } from '@harness/uicore'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'

import RbacButton from '@rbac/components/Button/Button'
import { useStrings } from 'framework/strings'

import { Page } from '@common/exports'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { getLinkForAccountResources } from '@common/utils/BreadcrumbUtils'
import ScopedTitle from '@common/components/Title/ScopedTitle'
import { Scope } from '@common/interfaces/SecretsInterface'
import useCreateEditVariableModal from '@variables/modals/CreateEditVariableModal/useCreateEditVariableModal'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { useGetVariablesList } from 'services/cd-ng'
import VariableListView from './views/VariableListView'
import css from './VariablesPage.module.scss'

const VariablesPage: React.FC = () => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps & ModulePathParams>()
  const { getString } = useStrings()
  const variableLabel = getString('common.variables')
  const [searchTerm, setSearchTerm] = useState<string | undefined>()
  const [page, setPage] = useState(0)

  useDocumentTitle(variableLabel)

  const {
    data: variableResponse,
    loading,
    error,
    refetch
  } = useGetVariablesList({
    queryParams: {
      pageIndex: page,
      pageSize: 10,
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      searchTerm
    }
  })

  const { openCreateUpdateVariableModal } = useCreateEditVariableModal({
    onSuccess: refetch
  })

  return (
    <>
      <Page.Header
        breadcrumbs={
          <NGBreadcrumbs
            links={getLinkForAccountResources({ accountId, orgIdentifier, projectIdentifier, getString })}
          />
        }
        title={
          <ScopedTitle
            title={{
              [Scope.PROJECT]: variableLabel,
              [Scope.ORG]: variableLabel,
              [Scope.ACCOUNT]: variableLabel
            }}
          />
        }
      />

      {variableResponse?.data?.content?.length || searchTerm || loading || error ? (
        <Layout.Horizontal flex className={css.header}>
          <Layout.Horizontal spacing="small">
            <RbacButton
              variation={ButtonVariation.PRIMARY}
              text={getString('variables.newVariable')}
              icon="plus"
              id="newVariableBtn"
              data-test="newVariableButton"
              onClick={() => openCreateUpdateVariableModal()}
              permission={{
                permission: PermissionIdentifier.EDIT_VARIABLE,
                resource: {
                  resourceType: ResourceType.VARIABLE
                }
              }}
            />
          </Layout.Horizontal>
          <ExpandingSearchInput
            alwaysExpanded
            onChange={text => {
              setSearchTerm(text.trim())
              setPage(0)
            }}
            width={250}
          />
        </Layout.Horizontal>
      ) : null}

      <Page.Body
        className={css.listBody}
        loading={loading}
        retryOnError={() => refetch()}
        error={(error?.data as Error)?.message || error?.message}
        noData={{
          when: () => !variableResponse?.data?.content?.length,
          message: !searchTerm
            ? getString('variables.noVariableExist', {
                resourceName: projectIdentifier ? 'project' : orgIdentifier ? 'organization' : 'account'
              })
            : getString('variables.noVariableFound'),
          button: !searchTerm ? (
            <Button
              icon="plus"
              text={getString('variables.newVariable')}
              variation={ButtonVariation.PRIMARY}
              onClick={() => openCreateUpdateVariableModal()}
            />
          ) : undefined
        }}
      >
        <VariableListView
          variables={variableResponse?.data}
          gotoPage={pageNumber => setPage(pageNumber)}
          refetch={refetch}
          openCreateUpdateVariableModal={openCreateUpdateVariableModal}
        />
      </Page.Body>
    </>
  )
}

export default VariablesPage
