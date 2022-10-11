/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Container } from '@harness/uicore'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { AgentListProps, ErrorTracking as EventList } from '@et/ErrorTrackingApp'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { useStrings } from 'framework/strings'
import { HorizontalLayout } from '../health-source/common/StyledComponents'
import css from './CVCodeErrorsAgents.module.scss'



export const CVCodeErrorsAgents = (): JSX.Element => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const SRM_ET_EXPERIMENTAL = useFeatureFlag(FeatureFlag.SRM_ET_EXPERIMENTAL)

  const componentLocation = {
    pathname: '/agents'
  }

  useDocumentTitle([getString('cv.srmTitle'), getString('cv.codeErrorsAgents')])

  if (SRM_ET_EXPERIMENTAL) {
    return (
      <Container width="100%" height="100%">
        <div className={css.pageHeaderDiv}>
          <HorizontalLayout>
            <NGBreadcrumbs />
          </HorizontalLayout>
          <h3 className={css.pageHeaderTitle}>{getString('cv.codeErrorsAgents', {projectName: '[' + projectIdentifier + ']'})}</h3>
          <p className={css.pageHeaderText}>{getString('cv.codeErrorsAgentsHeading')}</p>
        </div>
        <ChildAppMounter<AgentListProps>
          ChildApp={EventList}
          componentLocation={componentLocation}
          orgId={orgIdentifier}
          accountId={accountId}
          projectId={projectIdentifier}
          serviceId={''}
          environmentId={''}
          versionId={''}
          toBaseRouteDefinition={() =>
            routes.toCVCodeErrorsAgents({
              accountId,
              orgIdentifier,
              projectIdentifier
            })
          }
        />
      </Container>
    )
  } else {
    return <></>
  }
}
