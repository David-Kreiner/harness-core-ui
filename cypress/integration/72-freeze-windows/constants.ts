/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const accountId = 'accountId'
export const projectId = 'project1'
export const orgId = 'default'

export const featureFlagsCall = `/api/users/feature-flags/accountId?routingId=${accountId}`
export const overviewPage = `#/account/${accountId}/settings/overview`
export const orgOverviewPage = `#/account/${accountId}/settings/organizations/${orgId}/details`
export const projectOverviewPage = `#/account/${accountId}/cd/orgs/${orgId}/projects/${projectId}/dashboard`

/** PROJECT LEVEL */
export const projLevelFreezeId = 'project_level_freeze'
export const newProjectLevelFreezeRoute = `#/account/${accountId}/cd/orgs/${orgId}/projects/${projectId}/setup/freeze-window-studio/window/-1`
export const existingProjectLevelFreezeRoute = `#/account/${accountId}/cd/orgs/${orgId}/projects/${projectId}/setup/freeze-window-studio/window/${projLevelFreezeId}/?sectionId=FREEZE_CONFIG`
export const projLevelPostFreezeCall = `ng/api/freeze?routingId=${accountId}&accountIdentifier=${accountId}&orgIdentifier=${orgId}&projectIdentifier=${projectId}`
export const projLevelPutFreezeCall = `ng/api/freeze/${projLevelFreezeId}?routingId=${accountId}&accountIdentifier=${accountId}&orgIdentifier=${orgId}&projectIdentifier=${projectId}`
export const projLevelGetFreezeCall = `ng/api/freeze/${projLevelFreezeId}?routingId=${accountId}&accountIdentifier=${accountId}&orgIdentifier=${orgId}&projectIdentifier=${projectId}`

/** ORG LEVEL */
export const orgLevelFreezeId = 'org_level_freeze'
export const newOrgLevelFreezeRoute = `#/account/${accountId}/settings/organizations/${orgId}/setup/freeze-window-studio/window/-1`
export const existingOrgLevelFreezeRoute = `#/account/${accountId}/settings/organizations/${orgId}/setup/freeze-window-studio/window/${orgLevelFreezeId}`
export const getOrgCall = `ng/api/aggregate/organizations/${orgId}?routingId=${accountId}&accountIdentifier=${accountId}`
export const projectsAPI = `ng/api/projects?routingId=${accountId}&accountIdentifier=${accountId}&orgIdentifier=${orgId}`
export const orgLevelPostFreezeCall = `ng/api/freeze?routingId=${accountId}&accountIdentifier=${accountId}&orgIdentifier=${orgId}`
export const orgLevelGetFreezeCall = `/ng/api/freeze/${orgLevelFreezeId}?routingId=${accountId}&accountIdentifier=${accountId}&orgIdentifier=${orgId}`
export const orgLevelPutFreezeCall = `ng/api/freeze/${orgLevelFreezeId}?routingId=${accountId}&accountIdentifier=${accountId}&orgIdentifier=${orgId}`
