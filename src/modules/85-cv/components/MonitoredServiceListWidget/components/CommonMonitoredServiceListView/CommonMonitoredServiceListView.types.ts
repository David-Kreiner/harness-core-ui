/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { FilterTypes } from '@cv/pages/monitored-service/CVMonitoredService/CVMonitoredService.types'
import type { PageMonitoredServicePlatformResponse } from 'services/cv'
import { MonitoredServiceActiveAgentsDTOArray } from '@cet/ErrorTracking.types'
import type { MonitoredServiceConfig } from '../../MonitoredServiceListWidget.types'

export interface CommonMonitoredServiceListViewProps {
  setPage: (n: number) => void
  selectedFilter: FilterTypes
  onEditService: (identifier: string) => void
  onDeleteService: (identifier: string) => Promise<void>
  monitoredServiceListData?: PageMonitoredServicePlatformResponse & MonitoredServiceActiveAgentsDTOArray
  config: MonitoredServiceConfig
  appliedSearchAndFilter: boolean
  createButton: JSX.Element
}
