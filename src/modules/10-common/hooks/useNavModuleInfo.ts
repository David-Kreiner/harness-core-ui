/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useParams } from 'react-router-dom'
import type { IconName } from '@harness/icons'
import type { StringKeys } from 'framework/strings'
import { ModuleName } from 'framework/types/ModuleName'
import routes from '@common/RouteDefinitions'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import type { ModuleLicenseDTO } from '../../../services/cd-ng'

export type NavModuleName =
  | ModuleName.CD
  | ModuleName.CI
  | ModuleName.CV
  | ModuleName.CF
  | ModuleName.CE
  | ModuleName.CHAOS
  | ModuleName.STO
  | ModuleName.CODE

// Default order of modules on side nav, please add modules to this list accordingly.
// For any module to be visible on side nav, it has to be added in this list
export const DEFAULT_MODULES_ORDER: NavModuleName[] = [
  ModuleName.CODE,
  ModuleName.CD,
  ModuleName.CI,
  ModuleName.CF,
  ModuleName.CE,
  ModuleName.CV,
  ModuleName.STO,
  ModuleName.CHAOS
]

export interface useNavModuleInfoReturnType {
  shouldVisible: boolean
  label: StringKeys
  icon: IconName
  homePageUrl: string
  hasLicense?: boolean
  color: string
}

interface ModuleInfo {
  icon: IconName
  label: StringKeys
  getHomePageUrl: (accountId: string) => string
  featureFlagName?: FeatureFlag
  color: string
}

const moduleInfoMap: Record<NavModuleName, ModuleInfo> = {
  [ModuleName.CD]: {
    icon: 'cd-main',
    label: 'common.cdAndGitops',
    getHomePageUrl: (accountId: string) => routes.toCD({ accountId }),
    featureFlagName: FeatureFlag.CDNG_ENABLED,
    color: '--cd-border'
  },
  [ModuleName.CI]: {
    icon: 'ci-main',
    label: 'common.purpose.ci.continuous',
    getHomePageUrl: (accountId: string) => routes.toCI({ accountId }),
    featureFlagName: FeatureFlag.CING_ENABLED,
    color: '--ci-border'
  },
  [ModuleName.CV]: {
    icon: 'cv-main',
    label: 'common.serviceReliabilityManagement',
    getHomePageUrl: (accountId: string) => routes.toCV({ accountId }),
    featureFlagName: FeatureFlag.CVNG_ENABLED,
    color: '--srm-border'
  },
  [ModuleName.CF]: {
    icon: 'ff-solid',
    label: 'common.purpose.cf.continuous',
    getHomePageUrl: (accountId: string) => routes.toCF({ accountId }),
    featureFlagName: FeatureFlag.CFNG_ENABLED,
    color: '--ff-border'
  },
  [ModuleName.CE]: {
    icon: 'ce-main',
    label: 'common.purpose.ce.continuous',
    getHomePageUrl: (accountId: string) => routes.toCE({ accountId }),
    featureFlagName: FeatureFlag.CENG_ENABLED,
    color: '--ccm-border'
  },
  [ModuleName.STO]: {
    icon: 'sto-color-filled',
    label: 'common.purpose.sto.continuous',
    getHomePageUrl: (accountId: string) => routes.toSTO({ accountId }),
    color: '--sto-border'
  },
  [ModuleName.CHAOS]: {
    icon: 'chaos-main',
    label: 'chaos.homepage.chaosHomePageTitle',
    getHomePageUrl: (accountId: string) => routes.toChaos({ accountId }),
    featureFlagName: FeatureFlag.CHAOS_ENABLED,
    color: '--chaos-border'
  },
  [ModuleName.CODE]: {
    icon: 'code',
    label: 'common.purpose.code.name',
    getHomePageUrl: (accountId: string) => routes.toCODE({ accountId }),
    featureFlagName: FeatureFlag.CODE_ENABLED,
    color: '--default-module-border'
  }
}

export interface GroupConfig {
  label: StringKeys
  items: NavModuleName[]
}

// Grouping of modules with label
export const moduleGroupConfig: GroupConfig[] = [
  {
    label: 'common.moduleList.buildAndTest',
    items: [ModuleName.CI, ModuleName.CHAOS, ModuleName.STO]
  },
  {
    label: 'common.moduleList.deployChanges',
    items: [ModuleName.CD, ModuleName.CF]
  },
  {
    label: 'common.moduleList.manageImpact',
    items: [ModuleName.CE, ModuleName.CV]
  }
]

const getModuleInfo = (
  moduleInfo: ModuleInfo,
  accountId: string,
  hasLicense: boolean,
  shouldVisible: boolean,
  color: string
): useNavModuleInfoReturnType => {
  const { icon: moduleIcon, label, getHomePageUrl } = moduleInfo
  return {
    icon: moduleIcon,
    label,
    homePageUrl: getHomePageUrl(accountId),
    shouldVisible: shouldVisible,
    hasLicense,
    color
  }
}

const shouldBeVisible = (
  module: NavModuleName,
  featureFlags: Partial<Record<FeatureFlag, boolean>>,
  licenseInformation: { [key: string]: ModuleLicenseDTO } | Record<string, undefined>
) => {
  const featureFlagName = moduleInfoMap[module]?.featureFlagName
  return featureFlagName !== undefined
    ? !!featureFlags[featureFlagName]
    : licenseInformation[module]?.status === 'ACTIVE'
}

const useNavModuleInfo = (module: NavModuleName) => {
  const { accountId } = useParams<AccountPathProps>()
  const featureFlags = useFeatureFlags()
  const { licenseInformation } = useLicenseStore()

  const { color } = moduleInfoMap[module]

  return getModuleInfo(
    moduleInfoMap[module],
    accountId,
    !!licenseInformation[module]?.id,
    shouldBeVisible(module, featureFlags, licenseInformation),
    color
  ) as useNavModuleInfoReturnType
}

export const useNavModuleInfoMap = (): Record<NavModuleName, useNavModuleInfoReturnType> => {
  const { accountId } = useParams<AccountPathProps>()
  const featureFlags = useFeatureFlags()

  const { licenseInformation } = useLicenseStore()

  const modules = Object.keys(moduleInfoMap) as NavModuleName[]

  const infoMap = modules.reduce((map, module) => {
    return {
      ...map,
      [module]: getModuleInfo(
        moduleInfoMap[module],
        accountId,
        !!licenseInformation[module]?.id,
        shouldBeVisible(module, featureFlags, licenseInformation),
        moduleInfoMap[module].color
      )
    }
  }, {})

  return infoMap as Record<NavModuleName, useNavModuleInfoReturnType>
}

export default useNavModuleInfo
