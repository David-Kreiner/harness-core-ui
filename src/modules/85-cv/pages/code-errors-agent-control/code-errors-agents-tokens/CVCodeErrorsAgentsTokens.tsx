/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { AgentListProps, ErrorTracking } from '@et/ErrorTrackingApp'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { useStrings } from 'framework/strings'

export const CVCodeErrorsAgentsTokens = (): JSX.Element => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const SRM_ET_EXPERIMENTAL = useFeatureFlag(FeatureFlag.SRM_ET_EXPERIMENTAL)

  const componentLocation = {
    pathname: '/tokens'
  }

  useDocumentTitle([getString('cv.srmTitle'), getString('cv.codeErrorsAgentsTokens')])

  if (SRM_ET_EXPERIMENTAL) {
    return (
      <>
        <ChildAppMounter<AgentListProps>
          ChildApp={ErrorTracking}
          componentLocation={componentLocation}
          toBaseRouteDefinition={() =>
            routes.toCVCodeErrorsAgentsTokens({
              accountId,
              orgIdentifier,
              projectIdentifier
            })
          }
        />
      </>
    )
  } else {
    return <></>
  }
}
