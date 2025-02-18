/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import type { LicenseRedirectProps } from 'framework/LicenseStore/LicenseStoreContext'
import { RouteWithLayout } from '@common/router'
import { AccountSideNavProps } from '@common/RouteDestinations'
import routes from '@common/RouteDefinitions'
import { accountPathProps, orgPathProps, projectPathProps, templatePathProps } from '@common/utils/routeUtils'
import TemplatesPage from '@templates-library/pages/TemplatesPage/TemplatesPage'
import { TemplateStudio } from '@templates-library/components/TemplateStudio/TemplateStudio'
import RbacFactory from '@rbac/factories/RbacFactory'
import { ResourceCategory, ResourceType } from '@rbac/interfaces/ResourceType'
import { String } from 'framework/strings'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { ResourceDTO } from 'services/audit'
import AuditTrailFactory, { ResourceScope } from '@audit-trail/factories/AuditTrailFactory'
import type { Module, ModulePathParams } from '@common/interfaces/RouteInterfaces'
import { ProjectDetailsSideNavProps } from '@projects-orgs/RouteDestinations'
import TemplateResourceModal from './components/RbacResourceModals/TemplateResourceModal'
import TemplateResourceRenderer from './components/RbacResourceModals/TemplateResourceRenderer'
import './components/PipelineSteps'
import './components/TemplateStage'
import './components/Templates'

/**
 * Register RBAC resources
 */
RbacFactory.registerResourceTypeHandler(ResourceType.TEMPLATE, {
  icon: 'pipeline-deployment',
  label: 'common.templates',
  labelSingular: 'common.template.label',
  category: ResourceCategory.SHARED_RESOURCES,
  permissionLabels: {
    [PermissionIdentifier.VIEW_TEMPLATE]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_TEMPLATE]: <String stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_TEMPLATE]: <String stringID="rbac.permissionLabels.delete" />,
    [PermissionIdentifier.ACCESS_TEMPLATE]: <String stringID="rbac.permissionLabels.access" />,
    [PermissionIdentifier.COPY_TEMPLATE]: <String stringID="rbac.permissionLabels.copy" />
  },
  // eslint-disable-next-line react/display-name
  addResourceModalBody: props => <TemplateResourceModal {...props} />,
  // eslint-disable-next-line react/display-name
  staticResourceRenderer: props => <TemplateResourceRenderer {...props} />
})

/**
 * Register for Audit Trail
 * */
const cdLabel = 'common.purpose.cd.continuous'
AuditTrailFactory.registerResourceHandler(ResourceType.TEMPLATE, {
  moduleIcon: {
    name: 'cd-main'
  },
  moduleLabel: cdLabel,
  resourceLabel: 'common.template.label',
  resourceUrl: (_: ResourceDTO, resourceScope: ResourceScope, module?: Module) => {
    const { accountIdentifier, orgIdentifier, projectIdentifier } = resourceScope
    if (module && orgIdentifier && projectIdentifier) {
      return routes.toTemplates({
        module,
        orgIdentifier,
        projectIdentifier,
        accountId: accountIdentifier
      })
    }
    return undefined
  }
})

export default (
  <>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toTemplates({ ...accountPathProps })} exact>
      <TemplatesPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toTemplateStudio({
        ...accountPathProps,
        ...{
          templateIdentifier: ':templateIdentifier',
          templateType: ':templateType'
        }
      })}
      exact
    >
      <TemplateStudio />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toTemplates({ ...orgPathProps })} exact>
      <TemplatesPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toTemplateStudio({
        ...orgPathProps,
        ...{
          templateIdentifier: ':templateIdentifier',
          templateType: ':templateType'
        }
      })}
      exact
    >
      <TemplateStudio />
    </RouteWithLayout>
  </>
)

export const TemplateRouteDestinations: React.FC<{
  templateStudioComponent?: React.FC
  templateStudioPageName?: PAGE_NAME
  moduleParams: ModulePathParams
  licenseRedirectData?: LicenseRedirectProps
  sidebarProps?: SidebarContext
}> = ({
  templateStudioComponent: TemplateStudioWrapper = TemplateStudio,
  templateStudioPageName = PAGE_NAME.TemplateStudioWrapper,
  moduleParams,
  licenseRedirectData,
  sidebarProps
}) => (
  <>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toTemplates({ ...accountPathProps, ...projectPathProps, ...moduleParams })}
      pageName={PAGE_NAME.TemplatesPage}
    >
      <TemplatesPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toTemplates({ ...accountPathProps, ...projectPathProps })}
      pageName={PAGE_NAME.TemplatesPage}
    >
      <TemplatesPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toTemplateStudio({ ...accountPathProps, ...templatePathProps, ...moduleParams })}
      pageName={templateStudioPageName}
    >
      <TemplateStudioWrapper />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={ProjectDetailsSideNavProps}
      path={routes.toTemplateStudio({ ...accountPathProps, ...templatePathProps })}
      pageName={templateStudioPageName}
    >
      <TemplateStudioWrapper />
    </RouteWithLayout>
  </>
)
