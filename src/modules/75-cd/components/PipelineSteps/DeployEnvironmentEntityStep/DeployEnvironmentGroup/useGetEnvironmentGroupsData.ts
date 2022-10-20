import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'

import { shouldShowError, useToaster } from '@harness/uicore'

import { useMutateAsGet } from '@common/hooks'
import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'

import useRBACError from '@rbac/utils/useRBACError/useRBACError'

import { useGetEnvironmentGroupList } from 'services/cd-ng'

import type { EnvironmentGroupData } from '../types'

export interface UseGetEnvironmentGroupsDataReturn {
  environmentGroupsList: EnvironmentGroupData[]
  loadingEnvironmentGroupsList: boolean
  updatingEnvironmentGroupsList: boolean
  refetchEnvironmentGroupsList(): void
  /** Used to prepend data to `environmentGroupsList` */
  prependEnvironmentGroupToEnvironmentGroupsList(newEnvironmentGroupInfo: EnvironmentGroupData): void
}

export function useGetEnvironmentGroupsData(): UseGetEnvironmentGroupsDataReturn {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  // State
  const [environmentGroupsList, setEnvironmentGroupsList] = useState<EnvironmentGroupData[]>([])

  const {
    data: environmentGroupsListResponse,
    error: environmentGroupsListError,
    initLoading: loadingEnvironmentGroupsList,
    loading: updatingEnvironmentGroupsList,
    refetch: refetchEnvironmentGroupsList
  } = useMutateAsGet(useGetEnvironmentGroupList, {
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier
    },
    body: { filterType: 'EnvironmentGroup' }
  })

  useEffect(() => {
    if (!loadingEnvironmentGroupsList) {
      let _environmentGroupsList: EnvironmentGroupData[] = []

      /* istanbul ignore else */
      if (environmentGroupsListResponse?.data?.content?.length) {
        _environmentGroupsList = environmentGroupsListResponse?.data?.content.map(environmentGroupInResponse => ({
          ...environmentGroupInResponse,
          envGroup: {
            ...environmentGroupInResponse.envGroup,
            name: defaultTo(environmentGroupInResponse.envGroup?.name, ''),
            identifier: defaultTo(environmentGroupInResponse.envGroup?.identifier, '')
          }
        }))
      }

      setEnvironmentGroupsList(_environmentGroupsList)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingEnvironmentGroupsList, environmentGroupsListResponse?.data?.content])

  useEffect(() => {
    /* istanbul ignore else */
    if (environmentGroupsListError?.message) {
      /* istanbul ignore else */
      if (shouldShowError(environmentGroupsListError)) {
        showError(getRBACErrorMessage(environmentGroupsListError))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environmentGroupsListError])

  const prependEnvironmentGroupToEnvironmentGroupsList = useCallback(
    (newEnvironmentGroupInfo: EnvironmentGroupData) => {
      setEnvironmentGroupsList(previousEnvironmentGroupsList => [
        newEnvironmentGroupInfo,
        ...(previousEnvironmentGroupsList || [])
      ])
    },
    []
  )

  return {
    environmentGroupsList,
    loadingEnvironmentGroupsList,
    updatingEnvironmentGroupsList,
    refetchEnvironmentGroupsList,
    prependEnvironmentGroupToEnvironmentGroupsList
  }
}
