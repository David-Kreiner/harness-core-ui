/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Page, TabNavigation } from '@harness/uicore'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { useStrings } from 'framework/strings'
import ScopedTitle from '@common/components/Title/ScopedTitle'

const CVCodeErrorsAgentsControl: React.FC = ({ children }) => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  const SRM_ET_EXPERIMENTAL = useFeatureFlag(FeatureFlag.SRM_ET_EXPERIMENTAL)

  interface AgentTokenLink {
    label: string
    to: string
  }

  const agentTokenLinks: AgentTokenLink[] = [
    {
      label: getString('cv.codeErrorsAgents'),
      to: routes.toCVCodeErrorsAgents({ accountId, orgIdentifier, projectIdentifier })
    },
    {
      label: getString('common.tokens'),
      to: routes.toCVCodeErrorsAgentsTokens({ accountId, orgIdentifier, projectIdentifier })
    }
  ]

  useDocumentTitle([getString('cv.srmTitle'), getString('cv.codeErrorsAgents')])

  if (SRM_ET_EXPERIMENTAL) {
    return (
      <>
        <Page.Header
          breadcrumbs={<NGBreadcrumbs />}
          title={<ScopedTitle title={getString('cv.codeErrorsAgents')} />}
          toolbar={
            <TabNavigation size={'small'} links={agentTokenLinks.map(link => ({ label: link.label, to: link.to }))} />
          }
        />
        <Page.Body>{children}</Page.Body>
      </>
    )
  } else {
    return <></>
  }
}

export default CVCodeErrorsAgentsControl
