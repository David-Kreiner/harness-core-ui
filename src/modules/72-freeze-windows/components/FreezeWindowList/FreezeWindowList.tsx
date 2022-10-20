/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useUpdateQueryParams, useQueryParams } from '@common/hooks'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { FreezeWindowListTable } from '@freeze-windows/components/FreezeWindowList/FreezeWindowListTable'
import type { FreezeListUrlQueryParams } from '@freeze-windows/types'
import { getQueryParamOptions } from '@freeze-windows/utils/queryUtils'
import type { PageFreezeSummaryResponse, FreezeSummaryResponse } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useFreezeWindowListContext } from '@freeze-windows/context/FreezeWindowListContext'
import type { FreezeStatus } from '@freeze-windows/utils/freezeWindowUtils'
import type { FreezeWindowListColumnActions } from './FreezeWindowListCells'

export interface FreezeWindowList {
  data: PageFreezeSummaryResponse
  onDeleteRow: FreezeWindowListColumnActions['onDeleteRow']
  onToggleFreezeRow: FreezeWindowListColumnActions['onToggleFreezeRow']
  freezeStatusMap: Record<string, FreezeStatus>
}

export const FreezeWindowList: FC<FreezeWindowList> = ({ data, onToggleFreezeRow, onDeleteRow, freezeStatusMap }) => {
  const history = useHistory()
  const { toggleRowSelect, selectedItems } = useFreezeWindowListContext()

  const { projectIdentifier, orgIdentifier, accountId, module } = useParams<ProjectPathProps & ModulePathParams>()
  const { updateQueryParams } = useUpdateQueryParams<Partial<FreezeListUrlQueryParams>>()
  const queryParams = useQueryParams<FreezeListUrlQueryParams>(getQueryParamOptions())
  const { sort } = queryParams
  const [canEdit] = usePermission({
    resourceScope: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    resource: {
      resourceType: ResourceType.DEPLOYMENTFREEZE
    },
    permissions: [PermissionIdentifier.MANAGE_DEPLOYMENT_FREEZE]
  })

  const getViewFreezeRowLink = (feezeWindowItem: FreezeSummaryResponse): string =>
    routes.toFreezeWindowStudio({
      projectIdentifier,
      orgIdentifier,
      accountId,
      module,
      windowIdentifier: feezeWindowItem.identifier || '-1'
    })

  const onViewFreezeRow = (feezeWindow: FreezeSummaryResponse) => history.push(getViewFreezeRowLink(feezeWindow))

  const onRowSelectToggle: (data: { freezeWindowId: string; checked: boolean }) => void = ({
    freezeWindowId,
    checked
  }) => toggleRowSelect(freezeWindowId, checked)

  return (
    <FreezeWindowListTable
      data={data}
      selectedItems={selectedItems}
      onRowSelectToggle={onRowSelectToggle}
      onToggleFreezeRow={onToggleFreezeRow}
      onDeleteRow={onDeleteRow}
      onViewFreezeRow={onViewFreezeRow}
      getViewFreezeRowLink={getViewFreezeRowLink}
      gotoPage={pageNumber => updateQueryParams({ page: pageNumber })}
      setSortBy={appliedSort => updateQueryParams({ sort: appliedSort })}
      sortBy={sort}
      disabled={!canEdit}
      freezeStatusMap={freezeStatusMap}
    />
  )
}
