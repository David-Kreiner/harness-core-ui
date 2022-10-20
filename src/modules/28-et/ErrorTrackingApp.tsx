/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

/* istanbul ignore next */
// eslint-disable-next-line import/no-unresolved
export const ErrorTracking = React.lazy(() => import('errortracking/App'))

/* istanbul ignore next */
export interface ErrorTrackingLocation {
  pathname: string
}

/* istanbul ignore next */
interface ChildAppProps {
  componentLocation?: ErrorTrackingLocation
}

/* istanbul ignore next */
export interface EventListProps extends ChildAppProps {
  orgId: string
  accountId: string
  projectId: string
  serviceId: string
  environmentId: string
  versionId?: string
  fromDateTime: number
  toDateTime: number
  toBaseRouteDefinition?: () => string
  handleBackAction?: () => void
}

/* istanbul ignore next */
export interface AgentListProps extends ChildAppProps {
  handleBackAction?: () => void
}
