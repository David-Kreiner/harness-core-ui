/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Redirect, useParams } from 'react-router-dom'
import { OverviewChartsWithToggle } from '@common/components/OverviewChartsWithToggle/OverviewChartsWithToggle'
import { NavigationCheck } from '@common/components/NavigationCheck/NavigationCheck'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import routes from '@common/RouteDefinitions'
import { RouteWithLayout } from '@common/router'
import {
  accountPathProps,
  connectorPathProps,
  delegateConfigProps,
  delegatePathProps,
  orgPathProps,
  projectPathProps,
  resourceGroupPathProps,
  rolePathProps,
  secretPathProps,
  serviceAccountProps,
  userGroupPathProps,
  userPathProps
} from '@common/utils/routeUtils'
import { String as LocaleString } from 'framework/strings'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import AccessControlPage from '@rbac/pages/AccessControl/AccessControlPage'
import UsersPage from '@rbac/pages/Users/UsersPage'
import UserDetails from '@rbac/pages/UserDetails/UserDetails'
import UserGroups from '@rbac/pages/UserGroups/UserGroups'
import UserGroupDetails from '@rbac/pages/UserGroupDetails/UserGroupDetails'
import ServiceAccountsPage from '@rbac/pages/ServiceAccounts/ServiceAccounts'
import ServiceAccountDetails from '@rbac/pages/ServiceAccountDetails/ServiceAccountDetails'
import ResourceGroups from '@rbac/pages/ResourceGroups/ResourceGroups'
import RoleDetails from '@rbac/pages/RoleDetails/RoleDetails'
import Roles from '@rbac/pages/Roles/Roles'
import ResourceGroupDetails from '@rbac/pages/ResourceGroupDetails/ResourceGroupDetails'
import { ResourceCategory, ResourceType } from '@rbac/interfaces/ResourceType'
import RbacFactory from '@rbac/factories/RbacFactory'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import ConnectorsPage from '@connectors/pages/connectors/ConnectorsPage'
import { ConnectorReferenceField } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import CreateConnectorFromYamlPage from '@connectors/pages/createConnectorFromYaml/CreateConnectorFromYamlPage'
import SecretsPage from '@secrets/pages/secrets/SecretsPage'
import VariablesPage from '@variables/pages/variables/VariablesPage'
import ConnectorDetailsPage from '@connectors/pages/connectors/ConnectorDetailsPage/ConnectorDetailsPage'
import { RedirectToSecretDetailHome } from '@secrets/RouteDestinations'
import SecretDetailsHomePage from '@secrets/pages/secretDetailsHomePage/SecretDetailsHomePage'
import SecretDetails from '@secrets/pages/secretDetails/SecretDetails'
import SecretReferences from '@secrets/pages/secretReferences/SecretReferences'
import DelegatesPage from '@delegates/pages/delegates/DelegatesPage'
import DelegateListing from '@delegates/pages/delegates/DelegateListing'
import DelegateConfigurations from '@delegates/pages/delegates/DelegateConfigurations'
import DelegateDetails from '@delegates/pages/delegates/DelegateDetails'
import DelegateProfileDetails from '@delegates/pages/delegates/DelegateConfigurationDetailPage'
import DelegateTokens from '@delegates/components/DelegateTokens/DelegateTokens'
import CreateSecretFromYamlPage from '@secrets/pages/createSecretFromYaml/CreateSecretFromYamlPage'
import { validateYAMLWithSchema } from '@common/utils/YamlUtils'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import PipelineStudioFactory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import AuditTrailFactory, { ResourceScope } from '@audit-trail/factories/AuditTrailFactory'
import type { ResourceDTO } from 'services/audit'
import ExecFactory from '@pipeline/factories/ExecutionFactory'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import useCreateConnectorModal from '@connectors/modals/ConnectorModal/useCreateConnectorModal'
import SettingsList from '@default-settings/pages/SettingsList'
import ChaosEnvironments from '@chaos/pages/environments/EnvironmentsPage'
import { MinimalLayout } from '@common/layouts'
import { LicenseRedirectProps, LICENSE_STATE_NAMES } from 'framework/LicenseStore/LicenseStoreContext'
import { ModuleName } from 'framework/types/ModuleName'
import { RedirectToSubscriptionsFactory } from '@common/Redirects'
import ChaosHomePage from './pages/home/ChaosHomePage'
import type { ChaosCustomMicroFrontendProps } from './interfaces/Chaos.types'
import ChaosSideNav from './components/ChaosSideNav/ChaosSideNav'
import ChaosTrialHomePage from './pages/home/ChaosTrialHomePage'
import { ChaosExperimentStep } from './components/PipelineSteps/ChaosExperimentStep/ChaosExperimentStep'
import { ChaosExperimentExecView } from './components/PipelineSteps/ChaosExperimentStep/ChaosExperimentExecutionView/ChaosExperimentExecView'

// eslint-disable-next-line import/no-unresolved
const ChaosMicroFrontend = React.lazy(() => import('chaos/MicroFrontendApp'))

ExecFactory.registerStepDetails(StepType.ChaosExperiment, {
  component: React.memo(ChaosExperimentExecView)
})

const ChaosSideNavProps: SidebarContext = {
  navComponent: ChaosSideNav,
  subtitle: 'Chaos',
  title: 'Engineering',
  icon: 'chaos-main'
}

const chaosModuleParams: ModulePathParams = {
  module: ':module(chaos)'
}
const module = 'chaos'

// AuditTrail registrations
AuditTrailFactory.registerResourceHandler(ResourceType.CHAOS_HUB, {
  moduleIcon: {
    name: 'chaos-main'
  },
  moduleLabel: 'chaos.chaosHub',
  resourceLabel: 'chaos.chaosHub',
  resourceUrl: (resource: ResourceDTO, resourceScope: ResourceScope) => {
    const { accountIdentifier, orgIdentifier, projectIdentifier } = resourceScope

    return routes.toChaosHub({
      accountId: accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      identifier: resource.identifier
    })
  }
})

AuditTrailFactory.registerResourceHandler(ResourceType.CHAOS_EXPERIMENT, {
  moduleIcon: {
    name: 'chaos-main'
  },
  moduleLabel: 'chaos.chaosExperiment',
  resourceLabel: 'chaos.chaosExperiment',
  resourceUrl: (resource: ResourceDTO, resourceScope: ResourceScope) => {
    const { accountIdentifier, orgIdentifier, projectIdentifier } = resourceScope

    return routes.toChaosExperiment({
      accountId: accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      identifier: resource.identifier
    })
  }
})

AuditTrailFactory.registerResourceHandler(ResourceType.CHAOS_INFRASTRUCTURE, {
  moduleIcon: {
    name: 'chaos-main'
  },
  moduleLabel: 'chaos.chaosInfrastructure',
  resourceLabel: 'chaos.chaosInfrastructure',
  resourceUrl: (_: ResourceDTO, resourceScope: ResourceScope) => {
    const { accountIdentifier, orgIdentifier, projectIdentifier } = resourceScope

    return routes.toChaosEnvironments({
      accountId: accountIdentifier,
      orgIdentifier,
      projectIdentifier
    })
  }
})

AuditTrailFactory.registerResourceHandler(ResourceType.CHAOS_GAMEDAY, {
  moduleIcon: {
    name: 'chaos-main'
  },
  moduleLabel: 'chaos.chaosGameday',
  resourceLabel: 'chaos.chaosGameday'
})

// RedirectToAccessControlHome: redirects to users page in access control
const RedirectToAccessControlHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  return <Redirect to={routes.toUsers({ accountId, projectIdentifier, orgIdentifier, module })} />
}

// RedirectToChaosProject: if project is selected redirects to project dashboard, else to module homepage
const RedirectToChaosProject = (): React.ReactElement => {
  const { accountId } = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()
  if (selectedProject) {
    return (
      <Redirect
        to={routes.toProjectOverview({
          accountId,
          orgIdentifier: selectedProject.orgIdentifier || '',
          projectIdentifier: selectedProject.identifier,
          module
        })}
      />
    )
  } else {
    return <Redirect to={routes.toModuleHome({ accountId, module })} />
  }
}

export default function ChaosRoutes(): React.ReactElement {
  const isChaosEnabled = useFeatureFlag(FeatureFlag.CHAOS_ENABLED)

  // Register Chaos into RBAC Factory and AuditTrail only when Feature Flag is enabled
  if (isChaosEnabled) {
    // Pipeline registrations
    PipelineStudioFactory.registerStep(new ChaosExperimentStep())
    // RBAC registrations
    RbacFactory.registerResourceCategory(ResourceCategory.CHAOS, {
      icon: 'chaos-main',
      label: 'common.chaosText'
    })

    RbacFactory.registerResourceTypeHandler(ResourceType.CHAOS_HUB, {
      icon: 'chaos-main',
      label: 'chaos.chaosHub',
      category: ResourceCategory.CHAOS,
      permissionLabels: {
        [PermissionIdentifier.VIEW_CHAOS_HUB]: <LocaleString stringID="rbac.permissionLabels.view" />,
        [PermissionIdentifier.EDIT_CHAOS_HUB]: <LocaleString stringID="rbac.permissionLabels.createEdit" />,
        [PermissionIdentifier.DELETE_CHAOS_HUB]: <LocaleString stringID="delete" />
      }
    })

    RbacFactory.registerResourceTypeHandler(ResourceType.CHAOS_EXPERIMENT, {
      icon: 'chaos-main',
      label: 'chaos.chaosExperiment',
      category: ResourceCategory.CHAOS,
      permissionLabels: {
        [PermissionIdentifier.VIEW_CHAOS_EXPERIMENT]: <LocaleString stringID="rbac.permissionLabels.view" />,
        [PermissionIdentifier.EDIT_CHAOS_EXPERIMENT]: <LocaleString stringID="rbac.permissionLabels.createEdit" />,
        [PermissionIdentifier.DELETE_CHAOS_EXPERIMENT]: <LocaleString stringID="delete" />
      }
    })

    RbacFactory.registerResourceTypeHandler(ResourceType.CHAOS_INFRASTRUCTURE, {
      icon: 'chaos-main',
      label: 'chaos.chaosInfrastructure',
      category: ResourceCategory.CHAOS,
      permissionLabels: {
        [PermissionIdentifier.VIEW_CHAOS_INFRASTRUCTURE]: <LocaleString stringID="rbac.permissionLabels.view" />,
        [PermissionIdentifier.EDIT_CHAOS_INFRASTRUCTURE]: <LocaleString stringID="rbac.permissionLabels.createEdit" />,
        [PermissionIdentifier.DELETE_CHAOS_INFRASTRUCTURE]: <LocaleString stringID="delete" />
      }
    })

    RbacFactory.registerResourceTypeHandler(ResourceType.CHAOS_GAMEDAY, {
      icon: 'chaos-main',
      label: 'chaos.chaosGameday',
      category: ResourceCategory.CHAOS,
      permissionLabels: {
        [PermissionIdentifier.VIEW_CHAOS_GAMEDAY]: <LocaleString stringID="rbac.permissionLabels.view" />,
        [PermissionIdentifier.EDIT_CHAOS_GAMEDAY]: <LocaleString stringID="rbac.permissionLabels.createEdit" />
      }
    })
  }

  const RedirectToModuleTrialHome = (): React.ReactElement => {
    const { accountId } = useParams<{
      accountId: string
    }>()

    return (
      <Redirect
        to={routes.toModuleTrialHome({
          accountId,
          module: 'chaos'
        })}
      />
    )
  }

  const RedirectToDelegatesHome = (): React.ReactElement => {
    const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

    return <Redirect to={routes.toDelegateList({ accountId, projectIdentifier, orgIdentifier, module })} />
  }

  const licenseRedirectData: LicenseRedirectProps = {
    licenseStateName: LICENSE_STATE_NAMES.CHAOS_LICENSE_STATE,
    startTrialRedirect: RedirectToModuleTrialHome,
    expiredTrialRedirect: RedirectToSubscriptionsFactory(ModuleName.CHAOS)
  }

  return (
    <>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={routes.toChaos({ ...accountPathProps })}
        exact
      >
        <RedirectToChaosProject />
      </RouteWithLayout>

      {/* Chaos Routes */}
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={routes.toModuleHome({ ...projectPathProps, ...chaosModuleParams })}
        exact
        pageName={PAGE_NAME.ChaosHomePage}
      >
        <ChaosHomePage />
      </RouteWithLayout>

      <RouteWithLayout
        layout={MinimalLayout}
        path={routes.toModuleTrialHome({ ...accountPathProps, module: 'chaos' })}
        exact
        pageName={PAGE_NAME.ChaosTrialHomePage}
      >
        <ChaosTrialHomePage />
      </RouteWithLayout>

      {/* Access Control */}
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toConnectors({ ...accountPathProps, ...projectPathProps, ...chaosModuleParams })}
      >
        <ConnectorsPage />
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toCreateConnectorFromYaml({ ...accountPathProps, ...projectPathProps, ...chaosModuleParams })}
        pageName={PAGE_NAME.CreateConnectorFromYamlPage}
      >
        <CreateConnectorFromYamlPage />
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toCreateConnectorFromYaml({ ...accountPathProps, ...orgPathProps })}
        pageName={PAGE_NAME.CreateConnectorFromYamlPage}
      >
        <CreateConnectorFromYamlPage />
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toSecrets({ ...accountPathProps, ...projectPathProps, ...chaosModuleParams })}
        pageName={PAGE_NAME.SecretsPage}
      >
        <SecretsPage />
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toVariables({ ...accountPathProps, ...projectPathProps, ...chaosModuleParams })}
      >
        <VariablesPage />
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toConnectorDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...connectorPathProps,
          ...chaosModuleParams
        })}
        pageName={PAGE_NAME.ConnectorDetailsPage}
      >
        <ConnectorDetailsPage />
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toSecretDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...secretPathProps,
          ...chaosModuleParams
        })}
      >
        <RedirectToSecretDetailHome />
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toSecretDetailsOverview({
          ...accountPathProps,
          ...projectPathProps,
          ...secretPathProps,
          ...chaosModuleParams
        })}
        pageName={PAGE_NAME.SecretDetails}
      >
        <SecretDetailsHomePage>
          <SecretDetails />
        </SecretDetailsHomePage>
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toSecretDetailsReferences({
          ...accountPathProps,
          ...projectPathProps,
          ...secretPathProps,
          ...chaosModuleParams
        })}
        pageName={PAGE_NAME.SecretReferences}
      >
        <SecretDetailsHomePage>
          <SecretReferences />
        </SecretDetailsHomePage>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={routes.toDelegates({ ...accountPathProps, ...projectPathProps, ...chaosModuleParams })}
        exact
      >
        <RedirectToDelegatesHome />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toDelegateList({
          ...accountPathProps,
          ...projectPathProps,
          ...chaosModuleParams
        })}
        pageName={PAGE_NAME.DelegateListing}
      >
        <DelegatesPage>
          <DelegateListing />
        </DelegatesPage>
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toDelegateConfigs({
          ...accountPathProps,
          ...projectPathProps,
          ...chaosModuleParams
        })}
        pageName={PAGE_NAME.DelegateConfigurations}
      >
        <DelegatesPage>
          <DelegateConfigurations />
        </DelegatesPage>
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toDelegatesDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...delegatePathProps,
          ...chaosModuleParams
        })}
        pageName={PAGE_NAME.DelegateDetails}
      >
        <DelegateDetails />
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={[
          routes.toDelegateConfigsDetails({
            ...accountPathProps,
            ...projectPathProps,
            ...delegateConfigProps,
            ...chaosModuleParams
          }),
          routes.toEditDelegateConfigsDetails({
            ...accountPathProps,
            ...projectPathProps,
            ...delegateConfigProps,
            ...chaosModuleParams
          })
        ]}
        pageName={PAGE_NAME.DelegateProfileDetails}
      >
        <DelegateProfileDetails />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={[
          routes.toDelegateTokens({
            ...accountPathProps,
            ...projectPathProps,
            ...chaosModuleParams
          })
        ]}
        pageName={PAGE_NAME.DelegateTokens}
      >
        <DelegatesPage>
          <DelegateTokens />
        </DelegatesPage>
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={routes.toCreateSecretFromYaml({
          ...accountPathProps,
          ...projectPathProps,
          ...orgPathProps,
          ...chaosModuleParams
        })}
        exact
        pageName={PAGE_NAME.CreateSecretFromYamlPage}
      >
        <CreateSecretFromYamlPage />
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={routes.toAccessControl({ ...projectPathProps, ...chaosModuleParams })}
        exact
      >
        <RedirectToAccessControlHome />
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={[routes.toUsers({ ...projectPathProps, ...chaosModuleParams })]}
        exact
        pageName={PAGE_NAME.UsersPage}
      >
        <AccessControlPage>
          <UsersPage />
        </AccessControlPage>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={routes.toUserDetails({ ...projectPathProps, ...chaosModuleParams, ...userPathProps })}
        exact
        pageName={PAGE_NAME.UserDetails}
      >
        <UserDetails />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={[routes.toUserGroups({ ...projectPathProps, ...chaosModuleParams })]}
        exact
        pageName={PAGE_NAME.UserGroups}
      >
        <AccessControlPage>
          <UserGroups />
        </AccessControlPage>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={routes.toUserGroupDetails({ ...projectPathProps, ...chaosModuleParams, ...userGroupPathProps })}
        exact
        pageName={PAGE_NAME.UserGroupDetails}
      >
        <UserGroupDetails />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={routes.toServiceAccounts({ ...projectPathProps, ...chaosModuleParams })}
        exact
        pageName={PAGE_NAME.ServiceAccountsPage}
      >
        <AccessControlPage>
          <ServiceAccountsPage />
        </AccessControlPage>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={routes.toServiceAccountDetails({ ...projectPathProps, ...chaosModuleParams, ...serviceAccountProps })}
        exact
        pageName={PAGE_NAME.ServiceAccountDetails}
      >
        <ServiceAccountDetails />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={[routes.toResourceGroups({ ...projectPathProps, ...chaosModuleParams })]}
        exact
        pageName={PAGE_NAME.ResourceGroups}
      >
        <AccessControlPage>
          <ResourceGroups />
        </AccessControlPage>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={[routes.toRoles({ ...projectPathProps, ...chaosModuleParams })]}
        exact
        pageName={PAGE_NAME.Roles}
      >
        <AccessControlPage>
          <Roles />
        </AccessControlPage>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toDefaultSettings({
          ...accountPathProps,
          ...projectPathProps,
          ...chaosModuleParams
        })}
      >
        <SettingsList />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={[routes.toRoleDetails({ ...projectPathProps, ...chaosModuleParams, ...rolePathProps })]}
        exact
        pageName={PAGE_NAME.RoleDetails}
      >
        <RoleDetails />
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={[routes.toResourceGroupDetails({ ...projectPathProps, ...chaosModuleParams, ...resourceGroupPathProps })]}
        exact
        pageName={PAGE_NAME.ResourceGroupDetails}
      >
        <ResourceGroupDetails />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toChaosEnvironments({ ...projectPathProps, ...chaosModuleParams })}
        pageName={PAGE_NAME.Environments}
      >
        <ChaosEnvironments />
      </RouteWithLayout>

      {/* Loads the Chaos MicroFrontend */}
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={ChaosSideNavProps}
        path={routes.toChaosMicroFrontend({ ...projectPathProps })}
      >
        <ChildAppMounter<ChaosCustomMicroFrontendProps>
          ChildApp={ChaosMicroFrontend}
          customComponents={{
            ConnectorReferenceField,
            OverviewChartsWithToggle,
            NavigationCheck
          }}
          customFunctions={{ validateYAMLWithSchema }}
          customHooks={{ useCreateConnectorModal }}
        />
      </RouteWithLayout>
    </>
  )
}
