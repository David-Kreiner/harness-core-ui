/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { ErrorTracking } from '@et/ErrorTrackingApp'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { useStrings } from 'framework/strings'

export const CVCodeErrors = (): JSX.Element => {
  const { getString } = useStrings()
  const SRM_ET_EXPERIMENTAL = useFeatureFlag(FeatureFlag.SRM_ET_EXPERIMENTAL)

  const componentLocation = {
    pathname: '/eventsummary'
  }

  useDocumentTitle([getString('cv.srmTitle'), getString('cv.codeErrors')])

  if (SRM_ET_EXPERIMENTAL) {
    return <ChildAppMounter ChildApp={ErrorTracking} componentLocation={componentLocation} />
  } else {
    return <></>
  }
}
