/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { useParams, useHistory, useRouteMatch } from 'react-router-dom'
import { Layout } from '@harness/uicore'
import routes from '@common/RouteDefinitions'
import { ProjectSelector, ProjectSelectorProps } from '@projects-orgs/components/ProjectSelector/ProjectSelector'
import type { CODEPathProps } from '@common/interfaces/RouteInterfaces'
import { SidebarLink } from '@common/navigation/SideNav/SideNav'
import { ModuleName } from 'framework/types/ModuleName'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { codePathProps } from '@common/utils/routeUtils'
import css from './SideNav.module.scss'

export default function SCMSideNav(): React.ReactElement {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier, repoName } = useParams<CODEPathProps>()
  const history = useHistory()
  const routeMatch = useRouteMatch()
  const { updateAppStore } = useAppStore()
  const projectSelectHandler: ProjectSelectorProps['onSelect'] = data => {
    updateAppStore({ selectedProject: data })

    history.push(
      routes.toCODERepositoriesListing({ space: [accountId, data.orgIdentifier as string, data.identifier].join('/') })
    )
  }
  const isCommits = useMemo(() => routeMatch.path.includes(codePathProps.commitRef), [routeMatch])
  const isBranches = useMemo(() => routeMatch.path.includes(codePathProps.branch), [routeMatch])
  const isSettings = useMemo(() => routeMatch.path.endsWith('/:repoName/settings'), [routeMatch])

  return (
    <Layout.Vertical spacing="small">
      <ProjectSelector
        moduleFilter={ModuleName.CODE as ProjectSelectorProps['moduleFilter']}
        onSelect={projectSelectHandler}
      />
      {projectIdentifier && orgIdentifier && (
        <>
          <SidebarLink
            label={getString('repositories')}
            to={routes.toCODERepositoriesListing({ space: [accountId, orgIdentifier, projectIdentifier].join('/') })}
            {...(repoName ? { activeClassName: '' } : {})}
          />

          {repoName && (
            <SidebarLink
              className={css.subNav}
              icon="file"
              textProps={{
                iconProps: {
                  size: 14
                }
              }}
              label={getString('common.files')}
              to={routes.toCODERepository({
                repoPath: [accountId, orgIdentifier, projectIdentifier, repoName].join('/')
              })}
              {...(isCommits || isBranches || isSettings ? { activeClassName: '' } : {})}
            />
          )}

          {repoName && (
            <SidebarLink
              className={css.subNav}
              icon="git-branch-existing"
              textProps={{
                iconProps: {
                  size: 14
                }
              }}
              label={getString('commits')}
              to={routes.toCODERepositoryCommits({
                repoPath: [accountId, orgIdentifier, projectIdentifier, repoName].join('/'),
                commitRef: ''
              })}
            />
          )}

          {repoName && (
            <SidebarLink
              className={css.subNav}
              icon="git-branch"
              textProps={{
                iconProps: {
                  size: 14
                }
              }}
              label={getString('code.branches')}
              to={routes.toCODERepositoryBranches({
                repoPath: [accountId, orgIdentifier, projectIdentifier, repoName].join('/'),
                branch: ''
              })}
            />
          )}

          {repoName && (
            <SidebarLink
              className={css.subNav}
              icon="cog"
              textProps={{
                iconProps: {
                  size: 14
                }
              }}
              label={getString('settingsLabel')}
              to={routes.toCODERepositorySettings({
                repoPath: [accountId, orgIdentifier, projectIdentifier, repoName].join('/')
              })}
            />
          )}
        </>
      )}
    </Layout.Vertical>
  )
}