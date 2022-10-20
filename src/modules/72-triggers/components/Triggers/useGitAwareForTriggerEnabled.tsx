/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useMemo } from 'react'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useQueryParams } from '@common/hooks'
import { StoreType } from '@common/constants/GitSyncTypes'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'

const useGitAwareForTriggerEnabled = (): boolean => {
  const { storeType } = useQueryParams<GitQueryParams>()

  const { isGitSyncEnabled, gitSyncEnabledOnlyForFF } = useAppStore()

  const gitAwareForTriggerEnabled = useMemo(
    () => (isGitSyncEnabled && !gitSyncEnabledOnlyForFF) || storeType === StoreType.REMOTE,
    [isGitSyncEnabled, gitSyncEnabledOnlyForFF, storeType]
  )

  return gitAwareForTriggerEnabled
}

export default useGitAwareForTriggerEnabled
