/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { ErrorTracking } from '@cet/ErrorTrackingApp'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import CardWithOuterTitle from '@common/components/CardWithOuterTitle/CardWithOuterTitle'
import { CETAgentConfigProps } from '@cet/ErrorTracking.types'

export const CETAgentConfig: React.FC<CETAgentConfigProps> = props => {
  const { CET_PLATFORM_MONITORED_SERVICE } = useFeatureFlags()

  if (CET_PLATFORM_MONITORED_SERVICE) {
    return (
      <CardWithOuterTitle>
        <ChildAppMounter
          data-testid={'error-tracking-child-mounter'}
          ChildApp={ErrorTracking}
          componentLocation={'agent-config'}
          monitoredService={{
            serviceRef: props.serviceRef,
            environmentRef: props.environmentRef
          }}
        />
      </CardWithOuterTitle>
    )
  } else {
    return <></>
  }
}
