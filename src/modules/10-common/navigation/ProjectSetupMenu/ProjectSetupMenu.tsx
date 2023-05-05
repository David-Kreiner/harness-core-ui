/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import routes from '@common/RouteDefinitions'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useHostedBuilds } from '@common/hooks/useHostedBuild'
import type { GovernancePathProps, Module, PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useStrings } from 'framework/strings'
import { isEnterprisePlan, useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { ModuleName } from 'framework/types/ModuleName'
import { useAnyEnterpriseLicense } from '@common/hooks/useModuleLicenses'
import { useSideNavContext } from 'framework/SideNavStore/SideNavContext'
import { SidebarLink } from '../SideNav/SideNav'
import NavExpandable from '../NavExpandable/NavExpandable'

interface ProjectSetupMenuProps {
  module?: Module
  defaultExpanded?: boolean
}

const ProjectSetupMenu: React.FC<ProjectSetupMenuProps> = ({ module, defaultExpanded }) => {
  const { getString } = useStrings()
  const {
    accountId,
    orgIdentifier: orgIdentifierFromParams,
    projectIdentifier: projectIdentifierFromParams
  } = useParams<PipelineType<ProjectPathProps>>()

  const {
    CVNG_TEMPLATE_MONITORED_SERVICE,
    NG_SETTINGS,
    SRM_ET_EXPERIMENTAL,
    NEW_LEFT_NAVBAR_SETTINGS,
    SRM_DOWNTIME,
    STO_JIRA_INTEGRATION
  } = useFeatureFlags()
  const { showGetStartedTabInMainMenu } = useSideNavContext()
  const { enabledHostedBuildsForFreeUsers } = useHostedBuilds()
  const { isGitSimplificationEnabled, isGitSyncEnabled, gitSyncEnabledOnlyForFF, selectedProject } = useAppStore()
  const { orgIdentifier = orgIdentifierFromParams, identifier: projectIdentifier = projectIdentifierFromParams } =
    selectedProject || {}
  const params = {
    accountId,
    orgIdentifier,
    projectIdentifier,
    module
  }
  // Get and set the visibility of the "cd" getStarted link
  const isCDGetStartedVisible = showGetStartedTabInMainMenu['cd']
  const isCIGetStartedVisible = showGetStartedTabInMainMenu['ci']

  const isCD = module === 'cd'
  const isCI = module === 'ci'
  const isCV = module === 'cv'
  const isSTO = module === 'sto'
  const isCIorCD = isCI || isCD
  const isCIorCDorSTO = isCI || isCD || isSTO
  // we don't want to show Policies tab for modules that use this file and don't support it
  const isNonPolicyEngineModule = module === 'iacm' || module === 'ssca' || module === 'chaos'
  const { licenseInformation } = useLicenseStore()
  const isEnterpriseEdition = isEnterprisePlan(licenseInformation, ModuleName.CD)
  const showDeploymentFreeze = isEnterpriseEdition && isCD

  const canUsePolicyEngine = useAnyEnterpriseLicense()
  // Supporting GIT_SIMPLIFICATION by default, old GitSync will be enabled only for already enabled projects
  // isGitSimplificationEnabled will true if Git SImplification is enabled using API
  const isGitSyncSupported =
    isGitSyncEnabled && !gitSyncEnabledOnlyForFF && (isCIorCDorSTO || !module) && !isGitSimplificationEnabled

  const showTemplates = isCIorCDorSTO || (!module && NEW_LEFT_NAVBAR_SETTINGS)
  const showFileStore = isCIorCD || !module

  return (
    <NavExpandable
      title={getString('common.projectSetup')}
      route={routes.toSetup(params)}
      defaultExpanded={defaultExpanded}
    >
      <Layout.Vertical spacing="small">
        <SidebarLink label={getString('connectorsLabel')} to={routes.toConnectors(params)} />
        <SidebarLink label={getString('common.secrets')} to={routes.toSecrets(params)} />
        <SidebarLink label={getString('common.variables')} to={routes.toVariables(params)} />
        <SidebarLink to={routes.toAccessControl(params)} label={getString('accessControl')} />
        <SidebarLink label={getString('delegate.delegates')} to={routes.toDelegates(params)} />

        {NG_SETTINGS && (
          <SidebarLink label={getString('common.defaultSettings')} to={routes.toDefaultSettings(params)} />
        )}
        {isGitSyncSupported ? (
          <SidebarLink
            label={getString('gitManagement')}
            to={routes.toGitSyncAdmin({ accountId, orgIdentifier, projectIdentifier, module })}
          />
        ) : null}
        {showTemplates && <SidebarLink label={getString('common.templates')} to={routes.toTemplates(params)} />}
        {CVNG_TEMPLATE_MONITORED_SERVICE && isCV && (
          <SidebarLink
            label={getString('common.templates')}
            to={routes.toTemplates({ ...params, templateType: 'MonitoredService' })}
          />
        )}
        {!isNonPolicyEngineModule && canUsePolicyEngine && (
          <SidebarLink label={getString('common.governance')} to={routes.toGovernance(params as GovernancePathProps)} />
        )}
        {showDeploymentFreeze ? (
          <SidebarLink
            label={getString('common.freezeWindows')}
            to={routes.toFreezeWindows({ ...params, module: params.module || 'cd' })}
          />
        ) : null}
        {showFileStore && <SidebarLink label={getString('resourcePage.fileStore')} to={routes.toFileStore(params)} />}
        {enabledHostedBuildsForFreeUsers && !isCIGetStartedVisible && module === 'ci' && (
          <SidebarLink label={getString('getStarted')} to={routes.toGetStartedWithCI({ ...params, module })} />
        )}

        {module === 'cd' && !isCDGetStartedVisible && (
          <SidebarLink label={getString('getStarted')} to={routes.toGetStartedWithCD({ ...params, module })} />
        )}
        {SRM_ET_EXPERIMENTAL && module === 'cv' && (
          <SidebarLink
            label={getString('common.codeErrorsSettings')}
            to={routes.toCVCodeErrorsSettings({ ...params })}
          />
        )}
        {SRM_DOWNTIME && isCV && (
          <SidebarLink label={getString('common.sloDowntimeLabel')} to={routes.toCVSLODowntime({ ...params })} />
        )}
        {STO_JIRA_INTEGRATION && module === 'sto' && (
          <SidebarLink
            label={getString('common.tickets.externalTickets')}
            to={routes.toProjectTicketSettings({ ...params, module })}
          />
        )}
      </Layout.Vertical>
    </NavExpandable>
  )
}

export default ProjectSetupMenu
