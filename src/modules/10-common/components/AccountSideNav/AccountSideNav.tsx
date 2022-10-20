/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '@wings-software/uicore'

import routes from '@common/RouteDefinitions'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { SidebarLink } from '@common/navigation/SideNav/SideNav'
import { useStrings } from 'framework/strings'
import { isEnterprisePlan, useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { ModuleName } from 'framework/types/ModuleName'
import { returnLaunchUrl } from '@common/utils/routeUtils'
import { useAnyEnterpriseLicense } from '@common/hooks/useModuleLicenses'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useGetAccountNG } from 'services/cd-ng'
import { LaunchButton } from '../LaunchButton/LaunchButton'

export default function AccountSideNav(): React.ReactElement {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const { NG_LICENSES_ENABLED, OPA_PIPELINE_GOVERNANCE, OPA_FF_GOVERNANCE, NG_DEPLOYMENT_FREEZE } = useFeatureFlags()
  const canUsePolicyEngine = useAnyEnterpriseLicense()
  const { licenseInformation } = useLicenseStore()
  const isEnterpriseEdition = isEnterprisePlan(licenseInformation, ModuleName.CD)
  const showDeploymentFreeze = isEnterpriseEdition && NG_DEPLOYMENT_FREEZE
  const { data: accountData } = useGetAccountNG({
    accountIdentifier: accountId,
    queryParams: { accountIdentifier: accountId }
  })
  return (
    <Layout.Vertical spacing="small" margin={{ top: 'xxxlarge' }}>
      <SidebarLink exact label={getString('overview')} to={routes.toAccountSettingsOverview({ accountId })} />
      <SidebarLink label={getString('authentication')} to={routes.toAuthenticationSettings({ accountId })} />
      <SidebarLink label={getString('common.accountResources')} to={routes.toAccountResources({ accountId })} />
      {canUsePolicyEngine && (OPA_PIPELINE_GOVERNANCE || OPA_FF_GOVERNANCE) && (
        <SidebarLink label={getString('common.governance')} to={routes.toGovernance({ accountId })} />
      )}
      {showDeploymentFreeze ? (
        <SidebarLink label={getString('common.freezeWindows')} to={routes.toFreezeWindows({ accountId })} />
      ) : null}
      <SidebarLink to={routes.toAccessControl({ accountId })} label={getString('accessControl')} />
      {accountData?.data?.productLed && (
        <SidebarLink exact label={getString('common.billing')} to={routes.toBilling({ accountId })} />
      )}
      {NG_LICENSES_ENABLED && (
        <SidebarLink exact label={getString('common.subscriptions.title')} to={routes.toSubscriptions({ accountId })} />
      )}
      <SidebarLink label={getString('common.auditTrail')} to={routes.toAuditTrail({ accountId })} />
      <SidebarLink label={getString('orgsText')} to={routes.toOrganizations({ accountId })} />
      <LaunchButton
        launchButtonText={getString('common.cgLaunchText')}
        redirectUrl={returnLaunchUrl(`#/account/${accountId}/dashboard`)}
      />
    </Layout.Vertical>
  )
}
