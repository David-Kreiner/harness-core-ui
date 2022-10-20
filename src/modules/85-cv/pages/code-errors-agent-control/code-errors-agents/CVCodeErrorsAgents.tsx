/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { AgentListProps, ErrorTracking } from '@et/ErrorTrackingApp'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import { useStrings } from 'framework/strings'

interface Props {
  pathComponentLocation: string
}

export const CVCodeErrorsAgents = (props: Props): JSX.Element => {
  const { getString } = useStrings()
  const componentLocation = {
    pathname: props.pathComponentLocation
  }

  useDocumentTitle([getString('cv.srmTitle'), getString('cv.codeErrorsAgents')])

  return <ChildAppMounter<AgentListProps> ChildApp={ErrorTracking} componentLocation={componentLocation} />
}
