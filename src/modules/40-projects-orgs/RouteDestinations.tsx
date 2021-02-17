import React from 'react'
import { useParams, Redirect, Route } from 'react-router-dom'

import { RouteWithLayout } from '@common/router'
import routes from '@common/RouteDefinitions'
import { accountPathProps, orgPathProps, projectPathProps } from '@common/utils/routeUtils'
import { MinimalLayout } from '@common/layouts'

import ProjectsPage from '@projects-orgs/pages/projects/ProjectsPage'
import GetStartedProject from '@projects-orgs/pages/projects/views/GetStartedProject/GetStartedProject'

import ProjectDetails from '@projects-orgs/pages/projects/views/ProjectDetails/ProjectDetails'
import OrganizationsPage from '@projects-orgs/pages/organizations/OrganizationsPage'
import OrganizationDetailsPage from '@projects-orgs/pages/organizations/OrganizationDetails/OrganizationDetailsPage'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import AccountSettingsSideNav from '@common/navigation/AccountSettingsSideNav/AccountSettingsSideNav'
import ProjectDetailsSideNav from '@projects-orgs/components/SideNav/SideNav'
import RbacFactory from '@rbac/factories/RbacFactory'
import AddProjectResourceModalBody from '@projects-orgs/components/AddProjectResourceModalBody/AddProjectResourceModalBody'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import ResourcesPage from '@common/pages/resources/ResourcesPage'
import ConnectorsPage from '@connectors/pages/connectors/ConnectorsPage'
import SecretsPage from '@secrets/pages/secrets/SecretsPage'
import ConnectorDetailsPage from '@connectors/pages/connectors/ConnectorDetailsPage'
import SecretDetails from '@secrets/pages/secretDetails/SecretDetails'

const AccountSettingsSideNavProps: SidebarContext = {
  navComponent: AccountSettingsSideNav,
  subtitle: 'ACCOUNT',
  title: 'Settings',
  icon: 'nav-settings'
}

const ProjectDetailsSideNavProps: SidebarContext = {
  navComponent: ProjectDetailsSideNav,
  icon: 'harness'
}

RbacFactory.registerResourceTypeHandler('PROJECT', {
  icon: 'nav-project',
  label: 'Projects',
  addResourceModalBody: <AddProjectResourceModalBody />
})

RbacFactory.registerResourceTypeHandler('ORGANIZATION', {
  icon: 'settings',
  label: 'Organizations',
  addResourceModalBody: <></>
})

const RedirectToResourcesHome = (): React.ReactElement => {
  const params = useParams<ProjectPathProps>()
  return <Redirect to={routes.toProjectResourcesConnectors(params)} />
}

export default (
  <>
    <RouteWithLayout layout={MinimalLayout} path={routes.toProjects({ ...accountPathProps })} exact>
      <ProjectsPage />
    </RouteWithLayout>

    <RouteWithLayout layout={MinimalLayout} path={routes.toProjectsGetStarted({ ...accountPathProps })} exact>
      <GetStartedProject />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toProjectDetails({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <ProjectDetails />
    </RouteWithLayout>

    <Route exact path={routes.toProjectResources({ ...accountPathProps, ...projectPathProps })}>
      <RedirectToResourcesHome />
    </Route>

    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toProjectResourcesConnectors({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <ResourcesPage>
        <ConnectorsPage />
      </ResourcesPage>
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toProjectResourcesSecrets({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <ResourcesPage>
        <SecretsPage />
      </ResourcesPage>
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toProjectResourcesConnectorDetails({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <ResourcesPage>
        <ConnectorDetailsPage />
      </ResourcesPage>
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toProjectResourcesSecretDetails({ ...accountPathProps, ...projectPathProps })}
      exact
    >
      <ResourcesPage>
        <SecretDetails />
      </ResourcesPage>
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={AccountSettingsSideNavProps}
      path={routes.toOrganizations({ ...accountPathProps })}
      exact
    >
      <OrganizationsPage />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={AccountSettingsSideNavProps}
      path={routes.toOrganizationDetails({ ...accountPathProps, ...orgPathProps })}
      exact
    >
      <OrganizationDetailsPage />
    </RouteWithLayout>
  </>
)
