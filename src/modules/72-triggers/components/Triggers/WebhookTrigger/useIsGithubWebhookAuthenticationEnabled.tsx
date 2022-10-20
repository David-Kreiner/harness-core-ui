/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { useGetSettingValue } from 'services/cd-ng'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getWebhookGithubTriggersAuthenticationSetting } from './utils'

const useIsGithubWebhookAuthenticationEnabled = (): boolean => {
  const isSpgNgGithubWebhookAuthenticationEnabled = useFeatureFlag(FeatureFlag.SPG_NG_GITHUB_WEBHOOK_AUTHENTICATION)
  const {
    accountId: accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    module
  } = useParams<ProjectPathProps & ModulePathParams>()

  const { data: projectSettingData } = useGetSettingValue({
    identifier: getWebhookGithubTriggersAuthenticationSetting(module),
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier
    }
  })

  const isGithubWebhookAuthenticationEnabled = useMemo(() => {
    return isSpgNgGithubWebhookAuthenticationEnabled && projectSettingData?.data?.value === 'true'
  }, [projectSettingData, isSpgNgGithubWebhookAuthenticationEnabled])

  return isGithubWebhookAuthenticationEnabled
}

export default useIsGithubWebhookAuthenticationEnabled
