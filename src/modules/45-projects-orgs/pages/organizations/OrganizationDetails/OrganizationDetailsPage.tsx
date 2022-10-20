/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Card, Heading, Icon, Layout, Text, Button, ButtonVariation } from '@wings-software/uicore'
import { useHistory, useParams } from 'react-router-dom'
import { Color } from '@harness/design-system'
import { Page } from '@common/exports'
import routes from '@common/RouteDefinitions'
import { Project, useGetOrganizationAggregateDTO } from 'services/cd-ng'
import { useCollaboratorModal } from '@projects-orgs/modals/ProjectModal/useCollaboratorModal'
import TagsRenderer from '@common/components/TagsRenderer/TagsRenderer'
import { useStrings, String } from 'framework/strings'
import { isEnterprisePlan, useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { ModuleName } from 'framework/types/ModuleName'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { OrgPathProps } from '@common/interfaces/RouteInterfaces'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import RbacAvatarGroup from '@rbac/components/RbacAvatarGroup/RbacAvatarGroup'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import ResourceCardList, { ResourceOption } from '@common/components/ResourceCardList/ResourceCardList'
import { useAnyEnterpriseLicense } from '@common/hooks/useModuleLicenses'
import { useProjectModal } from '@projects-orgs/modals/ProjectModal/useProjectModal'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import RbacButton from '@rbac/components/Button/Button'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import css from './OrganizationDetailsPage.module.scss'

const OrganizationDetailsPage: React.FC = () => {
  const { accountId, orgIdentifier } = useParams<OrgPathProps>()
  const { OPA_PIPELINE_GOVERNANCE, OPA_FF_GOVERNANCE, NG_DEPLOYMENT_FREEZE } = useFeatureFlags()
  const history = useHistory()
  const { getString } = useStrings()
  const canUsePolicyEngine = useAnyEnterpriseLicense()
  const { licenseInformation } = useLicenseStore()
  const isEnterpriseEdition = isEnterprisePlan(licenseInformation, ModuleName.CD)
  const showDeploymentFreeze = isEnterpriseEdition && NG_DEPLOYMENT_FREEZE

  const { data, refetch, loading, error } = useGetOrganizationAggregateDTO({
    identifier: orgIdentifier,
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const organization = data?.data?.organizationResponse.organization
  const invitePermission = {
    resourceScope: {
      accountIdentifier: accountId,
      orgIdentifier
    },
    resource: {
      resourceType: ResourceType.USER
    },
    permission: PermissionIdentifier.INVITE_USER
  }

  const { openCollaboratorModal } = useCollaboratorModal()
  useDocumentTitle([organization?.name || '', getString('orgsText')])

  const projectCreateSuccessHandler = (projectData?: Project): void => {
    if (projectData) {
      history.push(routes.toProjectDetails({ accountId, orgIdentifier, projectIdentifier: projectData.identifier }))
    }
  }

  const { openProjectModal, closeProjectModal } = useProjectModal({
    onSuccess: projectCreateSuccessHandler,
    onWizardComplete: projectData => {
      closeProjectModal()
      projectCreateSuccessHandler(projectData)
    }
  })

  /* istanbul ignore next */ if (loading) return <Page.Spinner />
  /* istanbul ignore next */ if (error)
    return <Page.Error message={(error.data as Error)?.message || error.message} onClick={() => refetch()} />
  /* istanbul ignore next */ if (!organization) return <></>

  const getResourceCardList = (): ResourceOption[] => {
    const list: ResourceOption[] = [
      {
        label: <String stringID="accessControl" />,
        icon: 'access-control',
        route: routes.toAccessControl({ accountId, orgIdentifier }),
        colorClass: css.accessControl
      },
      {
        label: <String stringID="common.auditTrail" />,
        icon: 'audit-trail',
        route: routes.toAuditTrail({ accountId, orgIdentifier }),
        colorClass: css.auditTrail
      }
    ]

    return list
  }

  const deploymentFreezeCard: ResourceOption[] = [
    {
      label: <String stringID="common.freezeWindows" />,
      icon: 'nav-settings',
      colorClass: css.freezeWindows,
      route: routes.toFreezeWindows({ accountId, orgIdentifier }),
      selectable: true
    } as ResourceOption
  ]

  const govFreezeCard: ResourceOption[] = [
    {
      label: <String stringID="common.governance" />,
      icon: 'governance',
      route: routes.toGovernance({ accountId, orgIdentifier }),
      colorClass: css.governance
    }
  ]

  const showGovCard = canUsePolicyEngine && (OPA_PIPELINE_GOVERNANCE || OPA_FF_GOVERNANCE)

  return (
    <>
      <Page.Header
        size="xlarge"
        breadcrumbs={
          <NGBreadcrumbs
            orgBreadCrumbOptional
            links={[
              {
                url: routes.toOrganizations({ accountId }),
                label: getString('orgsText')
              }
            ]}
          />
        }
        title={
          <Layout.Vertical spacing="small" className={css.title}>
            <Text font={{ size: 'medium', weight: 'bold' }} color={Color.BLACK}>
              {organization.name}
            </Text>
            {organization.description && (
              <Text font="small" lineClamp={2}>
                {organization.description}
              </Text>
            )}
            {organization.tags && (
              <Layout.Horizontal padding={{ top: 'small' }}>
                <TagsRenderer tags={organization.tags || {}} length={6} />
              </Layout.Horizontal>
            )}
          </Layout.Vertical>
        }
        toolbar={
          <Layout.Horizontal padding="xxlarge">
            <Layout.Vertical padding={{ right: 'large' }} spacing="xsmall" flex>
              <RbacAvatarGroup
                avatars={data?.data?.admins?.length ? data.data.admins : [{}]}
                onAdd={event => {
                  event.stopPropagation()
                  openCollaboratorModal({ orgIdentifier })
                }}
                restrictLengthTo={6}
                permission={invitePermission}
              />
              <Text font="xsmall">{getString('adminLabel')}</Text>
            </Layout.Vertical>
            <Layout.Vertical padding={{ right: 'large' }} spacing="xsmall" flex>
              <RbacAvatarGroup
                avatars={data?.data?.collaborators?.length ? data.data.collaborators : [{}]}
                onAdd={event => {
                  event.stopPropagation()
                  openCollaboratorModal({ orgIdentifier })
                }}
                restrictLengthTo={6}
                permission={invitePermission}
              />
              <Text font="xsmall">{getString('collaboratorsLabel')}</Text>
            </Layout.Vertical>
          </Layout.Horizontal>
        }
      />
      <Page.Body
        retryOnError={() => {
          refetch()
        }}
      >
        <Layout.Vertical padding="huge">
          <Layout.Vertical spacing="medium">
            <Heading font={{ size: 'medium', weight: 'bold' }} color={Color.BLACK}>
              {getString('projectsText')}
            </Heading>
            <Card className={css.projectsCard}>
              <Layout.Horizontal spacing="medium" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
                <Icon name="nav-project" size={60} color={Color.GREY_200}></Icon>
                <Text font={{ size: 'large', weight: 'bold' }} color={Color.PRIMARY_7} className={css.projectCount}>
                  {data?.data?.projectsCount}
                </Text>
                <Layout.Horizontal spacing="xxlarge" flex>
                  <Text font={{ size: 'medium', weight: 'light' }}>
                    <String stringID="projectsOrgs.projectsInOrg" useRichText={true} />
                  </Text>
                  <Layout.Horizontal spacing="small" padding={{ left: 'xxlarge' }}>
                    <RbacButton
                      featuresProps={{
                        featuresRequest: {
                          featureNames: [FeatureIdentifier.MULTIPLE_PROJECTS]
                        }
                      }}
                      variation={ButtonVariation.PRIMARY}
                      text={getString('projectsOrgs.createAProject')}
                      onClick={() => openProjectModal()}
                    />
                    <Button
                      variation={ButtonVariation.LINK}
                      text={getString('projectsOrgs.viewProjects')}
                      onClick={() => {
                        history.push({
                          pathname: routes.toProjects({ accountId }),
                          search: `?orgIdentifier=${orgIdentifier}`
                        })
                      }}
                    />
                  </Layout.Horizontal>
                </Layout.Horizontal>
              </Layout.Horizontal>
            </Card>
          </Layout.Vertical>

          <Layout.Vertical spacing="medium" padding={{ top: 'large' }}>
            <Heading font={{ size: 'medium', weight: 'bold' }} color={Color.BLACK}>
              {getString('projectsOrgs.orgResources.label')}
            </Heading>
            <div>
              <Text>{getString('projectsOrgs.orgResources.description1')}</Text>
              <Text>{getString('projectsOrgs.orgResources.description2')}</Text>
            </div>
            <ResourceCardList />
          </Layout.Vertical>
          <Layout.Vertical spacing="medium" padding={{ top: 'large' }}>
            <Heading font={{ size: 'medium', weight: 'bold' }} color={Color.BLACK}>
              {getString('projectsOrgs.orgAccessCtrlAndAuditTrail')}
            </Heading>
            <ResourceCardList items={getResourceCardList()} />
          </Layout.Vertical>
          {(showGovCard || showDeploymentFreeze) && (
            <Layout.Vertical spacing="medium" padding={{ top: 'large' }}>
              <Heading font={{ size: 'medium', weight: 'bold' }} color={Color.BLACK}>
                {getString('projectsOrgs.orgGovernance')}
              </Heading>
              <ResourceCardList
                items={[...(showGovCard ? govFreezeCard : []), ...(showDeploymentFreeze ? deploymentFreezeCard : [])]}
              />
            </Layout.Vertical>
          )}
        </Layout.Vertical>
      </Page.Body>
    </>
  )
}

export default OrganizationDetailsPage
