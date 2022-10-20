/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import { RouteWithLayout } from '@common/router'
import SettingsList from '@default-settings/pages/SettingsList'
import routes from '@common/RouteDefinitions'

import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import { AccountSideNavProps } from '@common/RouteDestinations'
import type { ModulePathParams } from '@common/interfaces/RouteInterfaces'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import type { LicenseRedirectProps } from 'framework/LicenseStore/LicenseStoreContext'
import AuditTrailFactory, { ResourceScope } from '@audit-trail/factories/AuditTrailFactory'
import type { ResourceDTO } from 'services/audit'
import RbacFactory from '@rbac/factories/RbacFactory'
import { ResourceCategory, ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

import { String } from 'framework/strings'
import DefaultSettingsFactory from './factories/DefaultSettingsFactory'
import { SettingType } from './interfaces/SettingType.types'
import {
  DefaultSettingCheckBoxWithTrueAndFalse,
  DefaultSettingRadioBtnWithTrueAndFalse
} from './components/ReusableHandlers'

DefaultSettingsFactory.registerCategory('CORE', {
  icon: 'cog',
  label: 'common.module.core',
  modulesWhereCategoryWillBeDisplayed: ['cd', 'ce', 'cf', 'chaos', 'ci', 'cv', 'scm', 'sto']
})
DefaultSettingsFactory.registerSettingHandler(SettingType.DISABLE_HARNESS_BUILT_IN_SECRET_MANAGER, {
  label: 'common.accountSetting.connector.disableBISMHeading',
  settingRenderer: props => <DefaultSettingCheckBoxWithTrueAndFalse {...props} />,
  yupValidation: Yup.boolean(),
  settingCategory: 'CORE'
})
AuditTrailFactory.registerResourceHandler('SETTING', {
  moduleIcon: {
    name: 'nav-settings'
  },
  moduleLabel: 'common.defaultSettings',
  resourceLabel: 'common.defaultSettings',
  resourceUrl: (_resource_: ResourceDTO, resourceScope: ResourceScope) => {
    const { orgIdentifier, accountIdentifier, projectIdentifier } = resourceScope
    return routes.toDefaultSettings({
      orgIdentifier,
      accountId: accountIdentifier,
      projectIdentifier
    })
  }
})

RbacFactory.registerResourceTypeHandler(ResourceType.SETTING, {
  icon: 'nav-settings',
  label: 'common.defaultSettings',
  category: ResourceCategory.ADMINSTRATIVE_FUNCTIONS,
  permissionLabels: {
    [PermissionIdentifier.VIEW_CORE_SETTING]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_CORE_SETTING]: <String stringID="rbac.permissionLabels.createEdit" />
  }
})

DefaultSettingsFactory.registerCategory('CD', {
  icon: 'cd-main',
  label: 'deploymentsText',
  settingsAndGroupDisplayOrder: [SettingType.WEBHOOK_GITHUB_TRIGGERS_AUTHENTICATION_CD],
  modulesWhereCategoryWillBeDisplayed: ['cd']
})

DefaultSettingsFactory.registerSettingHandler(SettingType.WEBHOOK_GITHUB_TRIGGERS_AUTHENTICATION_CD, {
  label: 'defaultSettings.mandateWebhookSecretsGithubTriggers',
  settingRenderer: props => <DefaultSettingRadioBtnWithTrueAndFalse {...props} />,
  settingCategory: 'CD'
})

DefaultSettingsFactory.registerCategory('CI', {
  icon: 'ci-main',
  label: 'buildsText',
  settingsAndGroupDisplayOrder: [SettingType.WEBHOOK_GITHUB_TRIGGERS_AUTHENTICATION_CI],
  modulesWhereCategoryWillBeDisplayed: ['ci']
})

DefaultSettingsFactory.registerSettingHandler(SettingType.WEBHOOK_GITHUB_TRIGGERS_AUTHENTICATION_CI, {
  label: 'defaultSettings.mandateWebhookSecretsGithubTriggers',
  settingRenderer: props => <DefaultSettingRadioBtnWithTrueAndFalse {...props} />,
  settingCategory: 'CI'
})

export default function DefaultSettingsRoutes(): React.ReactElement {
  return (
    <>
      <RouteWithLayout
        sidebarProps={AccountSideNavProps}
        path={routes.toDefaultSettings({ ...accountPathProps })}
        exact
      >
        <SettingsList />
      </RouteWithLayout>
    </>
  )
}
export const DefaultSettingsRouteDestinations: React.FC<{
  moduleParams: ModulePathParams
  licenseRedirectData?: LicenseRedirectProps
  sidebarProps?: SidebarContext
}> = ({ moduleParams, licenseRedirectData, sidebarProps }) => (
  <>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toDefaultSettings({
        ...accountPathProps,
        ...projectPathProps,
        ...moduleParams
      })}
    >
      <SettingsList />
    </RouteWithLayout>
  </>
)
