import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'

import { shouldShowError, useToaster } from '@harness/uicore'

import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'

import useRBACError from '@rbac/utils/useRBACError/useRBACError'

import { useGetClusterList } from 'services/cd-ng'

import type { ClusterData } from '../types'

export interface UseGetClustersDataProps {
  environmentIdentifier: string
}

export interface UseGetClustersDataReturn {
  /** Contains list of cluster config objects */
  clustersList: ClusterData[]
  loadingClustersList: boolean
}

export function useGetClustersData({ environmentIdentifier }: UseGetClustersDataProps): UseGetClustersDataReturn {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  // State
  const [clustersList, setClustersList] = useState<ClusterData[]>([])

  const {
    data: clustersListResponse,
    error: clustersListError,
    loading: loadingClustersList
  } = useGetClusterList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier
    }
  })

  const loading = loadingClustersList

  useEffect(() => {
    if (!loadingClustersList) {
      let _clustersList: ClusterData[] = []

      /* istanbul ignore else */
      if (clustersListResponse?.data?.content && Array.isArray(clustersListResponse?.data?.content)) {
        _clustersList = clustersListResponse.data.content.map(clusterInResponse => ({
          name: defaultTo(clusterInResponse?.name, ''),
          clusterRef: defaultTo(clusterInResponse?.clusterRef, '')
        }))
      }

      setClustersList(_clustersList)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, clustersListResponse?.data])

  useEffect(() => {
    /* istanbul ignore else */
    if (clustersListError?.message) {
      /* istanbul ignore else */
      if (shouldShowError(clustersListError)) {
        showError(getRBACErrorMessage(clustersListError))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clustersListError])

  return {
    clustersList,
    loadingClustersList
  }
}
