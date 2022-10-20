/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import pick from 'lodash-es/pick'
import { PageError, PageSpinner } from '@harness/uicore'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { handleUpdateLicenseStore, useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import type { ModuleLicenseType } from '@common/constants/SubscriptionTypes'
import { useQueryParams } from '@common/hooks'
import { Project, useGetLicensesAndSummary } from 'services/cd-ng'
import { Module, ModuleName } from 'framework/types/ModuleName'
import routes from '@common/RouteDefinitions'
import { HomePageTemplate } from '@projects-orgs/pages/HomePageTemplate/HomePageTemplate'
import { useStrings } from 'framework/strings'
import bgImageURL from '../../images/chaos.svg'

// ChaosHomePage: Renders home page when no project is selected
export default function ChaosHomePage(): React.ReactElement {
  const { currentUserInfo } = useAppStore()
  const { getString } = useStrings()
  const { NG_LICENSES_ENABLED } = useFeatureFlags()
  const { licenseInformation, updateLicenseStore } = useLicenseStore()

  const { accountId } = useParams<AccountPathProps>()

  const { experience } = useQueryParams<{ experience?: ModuleLicenseType }>()
  const moduleType = ModuleName.CHAOS
  const module = moduleType.toLowerCase() as Module

  const { accounts } = currentUserInfo
  const createdFromNG = accounts?.find(account => account.uuid === accountId)?.createdFromNG

  const { data, error, refetch, loading } = useGetLicensesAndSummary({
    queryParams: { moduleType },
    accountIdentifier: accountId
  })

  const expiryTime = data?.data?.maxExpiryTime
  const updatedLicenseInfo = data?.data && {
    ...licenseInformation?.['CHAOS'],
    ...pick(data?.data, ['licenseType', 'edition']),
    expiryTime
  }

  useEffect(() => {
    handleUpdateLicenseStore({ ...licenseInformation }, updateLicenseStore, module, updatedLicenseInfo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience])

  const history = useHistory()

  if (loading) {
    return <PageSpinner />
  }

  if (error) {
    const message = (error?.data as Error)?.message || error?.message
    return <PageError message={message} onClick={() => refetch()} />
  }

  const showTrialPages = createdFromNG || NG_LICENSES_ENABLED

  if (showTrialPages && data?.status === 'SUCCESS' && !data.data) {
    history.push(
      routes.toModuleTrialHome({
        accountId,
        module
      })
    )
  }

  // projectCreateSuccessHandler: redirects to the project dashboard upon selection from new project modal
  const projectCreateSuccessHandler = (project?: Project): void => {
    if (project) {
      history.push(
        routes.toProjectOverview({
          projectIdentifier: project.identifier,
          orgIdentifier: project.orgIdentifier || '',
          accountId,
          module: 'chaos'
        })
      )
    }
  }

  return (
    <HomePageTemplate
      title={getString('chaos.homepage.chaosHomePageTitle')}
      bgImageUrl={bgImageURL}
      projectCreateSuccessHandler={projectCreateSuccessHandler}
      subTitle={getString('chaos.homepage.slogan')}
      documentText={getString('chaos.homepage.learnMore')}
      documentURL={'https://docs.harness.io/category/kl0mxwpfw1-hce-category'}
    />
  )
}
