/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { getErrorInfoFromErrorObject, useToaster } from '@harness/uicore'
import { useCreateFreeze, useUpdateFreeze } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { useQueryParams } from '@common/hooks'
import routes from '@common/RouteDefinitions'
import { FreezeWindowContext } from '@freeze-windows/context/FreezeWindowContext'
import type { ModulePathParams } from '@common/interfaces/RouteInterfaces'
import { DefaultFreezeId } from '@freeze-windows/context/FreezeWindowReducer'
import type { WindowPathProps } from '@freeze-windows/types'

export const useSaveFreeze = () => {
  const { getString } = useStrings()
  const history = useHistory()
  const { showSuccess, showError, clear } = useToaster()
  const [isMounted, setIsMounted] = React.useState<boolean>(false)
  const {
    state: { freezeObj, isUpdated },
    refetchFreezeObj
  } = React.useContext(FreezeWindowContext)
  const {
    accountId: accountIdentifier,
    projectIdentifier,
    orgIdentifier,
    windowIdentifier,
    module
  } = useParams<WindowPathProps & ModulePathParams>()
  const { sectionId } = useQueryParams<{ sectionId?: string }>()
  const isCreateMode = windowIdentifier === DefaultFreezeId
  const {
    mutate: createFreeze,
    loading: createLoading,
    error: createError
  } = useCreateFreeze({
    // loading
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier
    }
  })
  const {
    mutate: updateFreeze,
    loading: updateLoading,
    error: updateError
  } = useUpdateFreeze({
    freezeIdentifier: windowIdentifier,
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier
    }
  })

  const error = isCreateMode ? createError : updateError
  const loading = isCreateMode ? createLoading : updateLoading

  React.useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      return
    }
    const errorMessage = loading ? '' : error ? getErrorInfoFromErrorObject(error) : ''
    if (errorMessage) {
      clear()
      showError(errorMessage)
    }
    if (!errorMessage && !loading && freezeObj.identifier !== DefaultFreezeId) {
      showSuccess(
        getString(
          isCreateMode
            ? 'freezeWindows.freezeStudio.freezeCreatedSuccessfully'
            : 'freezeWindows.freezeStudio.freezeUpdatedSuccessfully'
        ),
        1000
      )
      history.push(
        routes.toFreezeWindowStudio({
          projectIdentifier,
          orgIdentifier,
          accountId: accountIdentifier,
          module,
          windowIdentifier: freezeObj.identifier as string,
          sectionId
        })
      )
      if (!isCreateMode) {
        refetchFreezeObj()
      }
    }
  }, [loading])

  const onSave = () => {
    try {
      // check errors
      const params = yamlStringify({ freeze: freezeObj })
      const headers = { headers: { 'content-type': 'application/json' } }
      isCreateMode ? createFreeze(params, headers) : updateFreeze(params, headers)
    } catch (e) {
      // console.log(e)
    }
  }

  return {
    onSave,
    isSaveInProgress: loading,
    isSaveDisabled: !isUpdated
  }
}
