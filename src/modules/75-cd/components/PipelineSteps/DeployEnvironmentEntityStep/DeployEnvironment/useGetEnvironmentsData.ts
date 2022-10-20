/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'

import { shouldShowError, useToaster } from '@harness/uicore'

import { useMutateAsGet } from '@common/hooks'
import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import { yamlParse } from '@common/utils/YamlHelperMethods'

import useRBACError from '@rbac/utils/useRBACError/useRBACError'

import {
  EnvironmentYaml,
  useGetEnvironmentAccessList,
  useGetEnvironmentsInputYamlAndServiceOverrides
} from 'services/cd-ng'

import type { EnvironmentData } from '../types'

export interface UseGetEnvironmentsDataProps {
  envIdentifiers: string[]
  envGroupIdentifier?: string
}

export interface UseGetEnvironmentsDataReturn {
  /** Contains list of environment config objects */
  environmentsList: EnvironmentYaml[]
  /** Contains list of environment objects with inputs */
  environmentsData: EnvironmentData[]
  loadingEnvironmentsList: boolean
  loadingEnvironmentsData: boolean
  /** Used only for loading state while updating data */
  updatingEnvironmentsData: boolean
  refetchEnvironmentsList(): void
  refetchEnvironmentsData(): void
  /** Used to prepend data to `environmentsList` */
  prependEnvironmentToEnvironmentList(newEnvironmentInfo: EnvironmentYaml): void
}

export function useGetEnvironmentsData({
  envIdentifiers,
  envGroupIdentifier
}: UseGetEnvironmentsDataProps): UseGetEnvironmentsDataReturn {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  // State
  const [environmentsList, setEnvironmentsList] = useState<EnvironmentYaml[]>([])
  const [environmentsData, setEnvironmentsData] = useState<EnvironmentData[]>([])

  const {
    data: environmentsListResponse,
    error: environmentsListError,
    loading: loadingEnvironmentsList,
    refetch: refetchEnvironmentsList
  } = useGetEnvironmentAccessList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      ...(Boolean(envGroupIdentifier) && { envGroupIdentifier })
    }
  })

  const {
    data: environmentsDataResponse,
    error: environmentsDataError,
    initLoading: loadingEnvironmentsData,
    loading: updatingEnvironmentsData,
    refetch: refetchEnvironmentsData
  } = useMutateAsGet(useGetEnvironmentsInputYamlAndServiceOverrides, {
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    body: {
      ...(envIdentifiers ? { envIdentifiers } : { ...(envGroupIdentifier && { envGroupIdentifier }) }),
      serviceIdentifiers: []
    },
    lazy: !(envGroupIdentifier || envIdentifiers.length)
  })

  const loading = loadingEnvironmentsList || loadingEnvironmentsData

  useEffect(() => {
    if (!loading) {
      let _environmentsList: EnvironmentYaml[] = []
      let _environmentsData: EnvironmentData[] = []

      /* istanbul ignore else */
      if (environmentsListResponse?.data?.length) {
        _environmentsList = environmentsListResponse.data.map(environmentResponse => ({
          name: defaultTo(environmentResponse.environment?.name, ''),
          identifier: defaultTo(environmentResponse.environment?.identifier, ''),
          description: environmentResponse.environment?.description,
          tags: environmentResponse.environment?.tags,
          type: defaultTo(environmentResponse.environment?.type, 'PreProduction'),
          yaml: environmentResponse.environment?.yaml
        }))
      }

      const environmentsAndServiceOverridesInResponse = defaultTo(
        environmentsDataResponse?.data?.environmentsInputYamlAndServiceOverrides,
        []
      )

      const yamlMetadataList = environmentsAndServiceOverridesInResponse.map(environmentInResponse => {
        return {
          environmentIdentifier: environmentInResponse.envRef,
          environmentYaml: environmentInResponse.envYaml,
          environmentRuntimeTemplateYaml: environmentInResponse.envRuntimeInputYaml
        }
      })

      if (yamlMetadataList?.length) {
        _environmentsData = yamlMetadataList.map(row => {
          const environmentYaml = defaultTo(row.environmentYaml, '{}')
          const environment = yamlParse<Pick<EnvironmentData, 'environment'>>(environmentYaml).environment
          environment.yaml = environmentYaml
          const environmentInputs = yamlParse<Pick<EnvironmentData, 'environmentInputs'>>(
            defaultTo(row.environmentRuntimeTemplateYaml, '{}')
          ).environmentInputs

          /* istanbul ignore else */
          if (environment) {
            const existsInList = _environmentsList.find(svc => svc.identifier === row.environmentIdentifier)

            if (!existsInList) {
              _environmentsList.unshift(environment)
            }
          }

          return { environment, environmentInputs }
        })
      }

      setEnvironmentsList(_environmentsList)
      setEnvironmentsData(_environmentsData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    environmentsListResponse?.data,
    environmentsDataResponse?.data?.environmentsInputYamlAndServiceOverrides
  ])

  useEffect(() => {
    /* istanbul ignore else */
    if (environmentsListError?.message) {
      /* istanbul ignore else */
      if (shouldShowError(environmentsListError)) {
        showError(getRBACErrorMessage(environmentsListError))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environmentsListError])

  useEffect(() => {
    /* istanbul ignore else */
    if (environmentsDataError?.message) {
      /* istanbul ignore else */
      if (shouldShowError(environmentsDataError)) {
        showError(getRBACErrorMessage(environmentsDataError))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environmentsDataError])

  const prependEnvironmentToEnvironmentList = useCallback((newEnvironmentInfo: EnvironmentYaml) => {
    setEnvironmentsList(previousEnvironmentsList => [newEnvironmentInfo, ...(previousEnvironmentsList || [])])
  }, [])

  return {
    environmentsList,
    environmentsData,
    loadingEnvironmentsList,
    loadingEnvironmentsData,
    updatingEnvironmentsData,
    refetchEnvironmentsList,
    refetchEnvironmentsData,
    prependEnvironmentToEnvironmentList
  }
}
