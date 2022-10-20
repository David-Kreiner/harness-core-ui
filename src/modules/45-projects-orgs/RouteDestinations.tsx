/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams, Redirect, useLocation } from 'react-router-dom'
import AuditTrailsPage from '@audit-trail/pages/AuditTrails/AuditTrailsPage'
import AuditTrailFactory, { ResourceScope } from '@audit-trail/factories/AuditTrailFactory'
import { RouteWithLayout } from '@common/router'
import routes from '@common/RouteDefinitions'
import {
  accountPathProps,
  delegatePathProps,
  orgPathProps,
  projectPathProps,
  delegateConfigProps,
  resourceGroupPathProps,
  rolePathProps,
  userGroupPathProps,
  secretPathProps,
  userPathProps,
  connectorPathProps,
  serviceAccountProps
} from '@common/utils/routeUtils'

import ProjectsPage from '@projects-orgs/pages/projects/ProjectsPage'
import DelegateTokens from '@delegates/components/DelegateTokens/DelegateTokens'
import ProjectDetails from '@projects-orgs/pages/projects/views/ProjectDetails/ProjectDetails'
import OrganizationsPage from '@projects-orgs/pages/organizations/OrganizationsPage'
import OrganizationDetailsPage from '@projects-orgs/pages/organizations/OrganizationDetails/OrganizationDetailsPage'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import ProjectDetailsSideNav from '@projects-orgs/components/ProjectsSideNav/ProjectsSideNav'
import RbacFactory from '@rbac/factories/RbacFactory'
import AddProjectResourceModalBody from '@projects-orgs/components/ProjectResourceModalBody/ProjectResourceModalBody'
import OrgResourceModalBody from '@projects-orgs/components/OrgResourceModalBody/OrgResourceModalBody'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import ConnectorsPage from '@connectors/pages/connectors/ConnectorsPage'
import SecretsPage from '@secrets/pages/secrets/SecretsPage'
import DelegatesPage from '@delegates/pages/delegates/DelegatesPage'
import DelegateListing from '@delegates/pages/delegates/DelegateListing'
import DelegateConfigurations from '@delegates/pages/delegates/DelegateConfigurations'
import DelegateDetails from '@delegates/pages/delegates/DelegateDetails'
import ConnectorDetailsPage from '@connectors/pages/connectors/ConnectorDetailsPage/ConnectorDetailsPage'
import SecretDetails from '@secrets/pages/secretDetails/SecretDetails'
import { RedirectToSecretDetailHome } from '@secrets/RouteDestinations'
import SecretReferences from '@secrets/pages/secretReferences/SecretReferences'
import SecretDetailsHomePage from '@secrets/pages/secretDetailsHomePage/SecretDetailsHomePage'
import { ResourceType, ResourceCategory } from '@rbac/interfaces/ResourceType'
import ResourceGroupDetails from '@rbac/pages/ResourceGroupDetails/ResourceGroupDetails'
import AccessControlPage from '@rbac/pages/AccessControl/AccessControlPage'
import ResourceGroups from '@rbac/pages/ResourceGroups/ResourceGroups'
import RoleDetails from '@rbac/pages/RoleDetails/RoleDetails'
import Roles from '@rbac/pages/Roles/Roles'
import UserGroups from '@rbac/pages/UserGroups/UserGroups'
import UsersPage from '@rbac/pages/Users/UsersPage'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { String } from 'framework/strings'
import UserGroupDetails from '@rbac/pages/UserGroupDetails/UserGroupDetails'
import UserDetails from '@rbac/pages/UserDetails/UserDetails'
import DelegateProfileDetails from '@delegates/pages/delegates/DelegateConfigurationDetailPage'
import CreateSecretFromYamlPage from '@secrets/pages/createSecretFromYaml/CreateSecretFromYamlPage'
import CreateConnectorFromYamlPage from '@connectors/pages/createConnectorFromYaml/CreateConnectorFromYamlPage'
import { AccountSideNavProps, HomeSideNavProps, MainDashboardSideNavProps } from '@common/RouteDestinations'
import GitSyncEntityTab from '@gitsync/pages/entities/GitSyncEntityTab'
import GitSyncPage from '@gitsync/pages/GitSyncPage'
import GitSyncRepoTab from '@gitsync/pages/repos/GitSyncRepoTab'
import GitSyncErrors from '@gitsync/pages/errors/GitSyncErrors'
import ServiceAccountDetails from '@rbac/pages/ServiceAccountDetails/ServiceAccountDetails'
import ServiceAccountsPage from '@rbac/pages/ServiceAccounts/ServiceAccounts'
import { GovernanceRouteDestinations } from '@governance/RouteDestinations'
import type { ResourceDTO } from 'services/audit'
import GitSyncConfigTab from '@gitsync/pages/config/GitSyncConfigTab'
import VariablesPage from '@variables/pages/variables/VariablesPage'
import FileStorePage from '@filestore/pages/filestore/FileStorePage'
import SettingsList from '@default-settings/pages/SettingsList'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import LandingDashboardPage from './pages/LandingDashboardPage/LandingDashboardPage'

export const ProjectDetailsSideNavProps: SidebarContext = {
  navComponent: ProjectDetailsSideNav,
  icon: 'nav-project',
  title: 'Projects'
}

RbacFactory.registerResourceTypeHandler(ResourceType.PROJECT, {
  icon: 'nav-project',
  label: 'projectsText',
  category: ResourceCategory.ADMINSTRATIVE_FUNCTIONS,
  permissionLabels: {
    [PermissionIdentifier.VIEW_PROJECT]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.CREATE_PROJECT]: <String stringID="rbac.permissionLabels.create" />,
    [PermissionIdentifier.UPDATE_PROJECT]: <String stringID="rbac.permissionLabels.edit" />,
    [PermissionIdentifier.DELETE_PROJECT]: <String stringID="rbac.permissionLabels.delete" />
  },
  // eslint-disable-next-line react/display-name
  addResourceModalBody: props => <AddProjectResourceModalBody {...props} />
})

RbacFactory.registerResourceTypeHandler(ResourceType.ORGANIZATION, {
  icon: 'settings',
  label: 'orgsText',
  category: ResourceCategory.ADMINSTRATIVE_FUNCTIONS,
  permissionLabels: {
    [PermissionIdentifier.VIEW_ORG]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.CREATE_ORG]: <String stringID="rbac.permissionLabels.create" />,
    [PermissionIdentifier.UPDATE_ORG]: <String stringID="rbac.permissionLabels.edit" />,
    [PermissionIdentifier.DELETE_ORG]: <String stringID="rbac.permissionLabels.delete" />
  },
  // eslint-disable-next-line react/display-name
  addResourceModalBody: props => <OrgResourceModalBody {...props} />
})

const platformLabel = 'auditTrail.Platform'
AuditTrailFactory.registerResourceHandler('ORGANIZATION', {
  moduleIcon: {
    name: 'nav-settings'
  },
  moduleLabel: platformLabel,
  resourceLabel: 'orgLabel',
  resourceUrl: (_resource: ResourceDTO, resourceScope: ResourceScope) => {
    const { orgIdentifier, accountIdentifier } = resourceScope
    return orgIdentifier ? routes.toOrganizationDetails({ orgIdentifier, accountId: accountIdentifier }) : undefined
  }
})

AuditTrailFactory.registerResourceHandler('PROJECT', {
  moduleIcon: {
    name: 'nav-settings'
  },
  moduleLabel: platformLabel,
  resourceLabel: 'projectLabel',
  resourceUrl: (_resource: ResourceDTO, resourceScope: ResourceScope) => {
    const { orgIdentifier, accountIdentifier, projectIdentifier } = resourceScope
    if (orgIdentifier && projectIdentifier) {
      return routes.toProjectDetails({ orgIdentifier, accountId: accountIdentifier, projectIdentifier })
    }
    return undefined
  }
})

const RedirectToAccessControlHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  return <Redirect to={routes.toUsers({ accountId, projectIdentifier, orgIdentifier })} />
}

const RedirectToGitSyncHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  return <Redirect to={routes.toGitSyncReposAdmin({ projectIdentifier, accountId, orgIdentifier })} />
}

const RedirectToDelegatesHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  return <Redirect to={routes.toDelegateList({ accountId, projectIdentifier, orgIdentifier })} />
}

const ProjectsRedirect = (): React.ReactElement => {
  const { accountId } = useParams<ProjectPathProps>()
  const { search } = useLocation()
  const { NEW_LEFT_NAVBAR_SETTINGS } = useFeatureFlags()

  if (NEW_LEFT_NAVBAR_SETTINGS) {
    return (
      <Redirect
        to={{
          pathname: routes.toAllProjects({
            accountId
          }),
          search
        }}
      />
    )
  }

  return <ProjectsPage />
}

const MainDashboardRedirect = (): React.ReactElement => {
  const { NEW_LEFT_NAVBAR_SETTINGS } = useFeatureFlags()
  const { accountId } = useParams<ProjectPathProps>()

  if (!NEW_LEFT_NAVBAR_SETTINGS) {
    return (
      <Redirect
        to={routes.toHome({
          accountId
        })}
      />
    )
  }

  return <LandingDashboardPage />
}

export default (
  <>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toAllProjects({ ...accountPathProps })}
      exact
    >
      <ProjectsPage />
    </RouteWithLayout>

    <RouteWithLayout sidebarProps={HomeSideNavProps} path={routes.toProjects({ ...accountPathProps })} exact>
      <ProjectsRedirect />
    </RouteWithLayout>

    <RouteWithLayout sidebarProps={HomeSideNavProps} path={routes.toLandingDashboard({ ...accountPathProps })} exact>
      <LandingDashboardPage />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={MainDashboardSideNavProps}
      path={routes.toMainDashboard({ ...accountPathProps })}
      exact
    >
      <MainDashboardRedirect />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toProjectDetails({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <ProjectDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toConnectors({ ...projectPathProps })}
      exact
    >
      <ConnectorsPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toVariables({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <VariablesPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toSecrets({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <SecretsPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toDelegatesDetails({ ...projectPathProps, ...delegatePathProps })}
      exact
    >
      <DelegateDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toDelegatesDetails({ ...orgPathProps, ...delegatePathProps })}
      exact
    >
      <DelegateDetails />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toDelegates({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <RedirectToDelegatesHome />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toDelegates({ ...accountPathProps, ...orgPathProps })}
      exact
    >
      <RedirectToDelegatesHome />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toDelegateList({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <DelegatesPage>
        <DelegateListing />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toDelegateList({ ...accountPathProps, ...orgPathProps })}
      exact
    >
      <DelegatesPage>
        <DelegateListing />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toDelegateConfigs({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <DelegatesPage>
        <DelegateConfigurations />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toDelegateConfigs({ ...accountPathProps, ...orgPathProps })}
      exact
    >
      <DelegatesPage>
        <DelegateConfigurations />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toDelegateConfigsDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...delegateConfigProps
      })}
      exact
    >
      <DelegateProfileDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toDelegateConfigsDetails({
        ...accountPathProps,
        ...orgPathProps,
        ...delegateConfigProps
      })}
      exact
    >
      <DelegateProfileDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toDelegateTokens({
        ...accountPathProps,
        ...projectPathProps
      })}
      exact
    >
      <DelegatesPage>
        <DelegateTokens />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toDelegateTokens({
        ...accountPathProps,
        ...orgPathProps
      })}
      exact
    >
      <DelegatesPage>
        <DelegateTokens />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toEditDelegateConfigsDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...delegateConfigProps
      })}
      exact
    >
      <DelegateProfileDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toEditDelegateConfigsDetails({
        ...accountPathProps,
        ...orgPathProps,
        ...delegateConfigProps
      })}
      exact
    >
      <DelegateProfileDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toConnectorDetails({ ...accountPathProps, ...projectPathProps, ...connectorPathProps })}
      exact
    >
      <ConnectorDetailsPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toConnectorDetails({ ...orgPathProps, ...connectorPathProps })}
      exact
    >
      <ConnectorDetailsPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toSecretDetails({ ...accountPathProps, ...projectPathProps, ...secretPathProps })}
      exact
    >
      <RedirectToSecretDetailHome />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toSecretDetailsOverview({ ...accountPathProps, ...projectPathProps, ...secretPathProps })}
      exact
    >
      <SecretDetailsHomePage>
        <SecretDetails />
      </SecretDetailsHomePage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toSecretDetailsReferences({ ...accountPathProps, ...projectPathProps, ...secretPathProps })}
      exact
    >
      <SecretDetailsHomePage>
        <SecretReferences />
      </SecretDetailsHomePage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toCreateSecretFromYaml({
        ...accountPathProps,
        ...projectPathProps,
        ...orgPathProps
      })}
      exact
    >
      <CreateSecretFromYamlPage />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toOrganizations({ ...accountPathProps })} exact>
      <OrganizationsPage />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toConnectors({ ...orgPathProps })} exact>
      <ConnectorsPage />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toVariables({ ...orgPathProps })} exact>
      <VariablesPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toConnectorDetails({ ...orgPathProps, ...connectorPathProps })}
      exact
    >
      <ConnectorDetailsPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toCreateConnectorFromYaml({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <CreateConnectorFromYamlPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toCreateConnectorFromYaml({ ...orgPathProps })}
      exact
    >
      <CreateConnectorFromYamlPage />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toSecrets({ ...orgPathProps })} exact>
      <SecretsPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toSecretDetails({
        ...orgPathProps,
        ...secretPathProps
      })}
      exact
    >
      <RedirectToSecretDetailHome />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toSecretDetailsOverview({
        ...orgPathProps,
        ...secretPathProps
      })}
      exact
    >
      <SecretDetailsHomePage>
        <SecretDetails />
      </SecretDetailsHomePage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toSecretDetailsReferences({
        ...orgPathProps,
        ...secretPathProps
      })}
      exact
    >
      <SecretDetailsHomePage>
        <SecretReferences />
      </SecretDetailsHomePage>
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toFileStore({ ...orgPathProps })} exact>
      <FileStorePage />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toAuditTrail({ ...orgPathProps })} exact>
      <AuditTrailsPage />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toCreateSecretFromYaml({ ...orgPathProps })} exact>
      <CreateSecretFromYamlPage />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={[routes.toAccessControl({ ...orgPathProps })]} exact>
      <RedirectToAccessControlHome />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={[routes.toUsers({ ...orgPathProps })]} exact>
      <AccessControlPage>
        <UsersPage />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={[routes.toUserDetails({ ...orgPathProps, ...userPathProps })]}
      exact
    >
      <UserDetails />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={[routes.toUserGroups({ ...orgPathProps })]} exact>
      <AccessControlPage>
        <UserGroups />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={[routes.toUserGroupDetails({ ...orgPathProps, ...userGroupPathProps })]}
      exact
    >
      <UserGroupDetails />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toServiceAccounts({ ...orgPathProps })} exact>
      <AccessControlPage>
        <ServiceAccountsPage />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toServiceAccountDetails({ ...orgPathProps, ...serviceAccountProps })}
      exact
    >
      <ServiceAccountDetails />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={[routes.toResourceGroups({ ...orgPathProps })]} exact>
      <AccessControlPage>
        <ResourceGroups />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={[routes.toRoles({ ...orgPathProps })]} exact>
      <AccessControlPage>
        <Roles />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={[routes.toRoleDetails({ ...orgPathProps, ...rolePathProps })]}
      exact
    >
      <RoleDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={[routes.toResourceGroupDetails({ ...orgPathProps, ...resourceGroupPathProps })]}
      exact
    >
      <ResourceGroupDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toDefaultSettings({ ...projectPathProps })}
      exact
    >
      <SettingsList />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toDefaultSettings({ ...orgPathProps })} exact>
      <SettingsList />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toOrganizationDetails({ ...accountPathProps, ...orgPathProps })}
      exact
    >
      <OrganizationDetailsPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={[routes.toAccessControl({ ...projectPathProps })]}
      exact
    >
      <RedirectToAccessControlHome />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={ProjectDetailsSideNavProps} path={[routes.toUsers({ ...projectPathProps })]} exact>
      <AccessControlPage>
        <UsersPage />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={[routes.toUserDetails({ ...projectPathProps, ...userPathProps })]}
      exact
    >
      <UserDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={[routes.toUserGroups({ ...projectPathProps })]}
      exact
    >
      <AccessControlPage>
        <UserGroups />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={[routes.toUserGroupDetails({ ...projectPathProps, ...userGroupPathProps })]}
      exact
    >
      <UserGroupDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toServiceAccounts({ ...projectPathProps })}
      exact
    >
      <AccessControlPage>
        <ServiceAccountsPage />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toServiceAccountDetails({ ...projectPathProps, ...serviceAccountProps })}
      exact
    >
      <ServiceAccountDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={[routes.toResourceGroups({ ...projectPathProps })]}
      exact
    >
      <AccessControlPage>
        <ResourceGroups />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={ProjectDetailsSideNavProps} path={[routes.toRoles({ ...projectPathProps })]} exact>
      <AccessControlPage>
        <Roles />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={[routes.toRoleDetails({ ...projectPathProps, ...rolePathProps })]}
      exact
    >
      <RoleDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={[routes.toResourceGroupDetails({ ...projectPathProps, ...resourceGroupPathProps })]}
      exact
    >
      <ResourceGroupDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      exact
      path={[routes.toGitSyncAdmin({ ...accountPathProps, ...projectPathProps })]}
    >
      <RedirectToGitSyncHome />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toGitSyncReposAdmin({ ...accountPathProps, ...projectPathProps })}
    >
      <GitSyncPage>
        <GitSyncRepoTab />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toGitSyncEntitiesAdmin({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <GitSyncPage>
        <GitSyncEntityTab />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toGitSyncErrors({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <GitSyncPage>
        <GitSyncErrors />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toGitSyncConfig({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <GitSyncPage>
        <GitSyncConfigTab />
      </GitSyncPage>
    </RouteWithLayout>
    {GovernanceRouteDestinations({
      sidebarProps: AccountSideNavProps,
      pathProps: { ...accountPathProps, ...orgPathProps }
    })}
  </>
)
