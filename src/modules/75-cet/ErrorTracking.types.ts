/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type React from 'react'
import type { NotificationMethodsProps } from '@pipeline/components/Notifications/Steps/NotificationMethods'
import type { OverviewProps } from '@pipeline/components/Notifications/Steps/Overview'
import { MonitoredServiceActiveAgentsDTO } from 'services/cet/cetSchemas'
import type { ChildAppProps } from './ErrorTrackingApp'

export interface ETCustomMicroFrontendProps extends ChildAppProps {
  customComponents: {
    NotificationWizardOverviewStep: React.ComponentType<OverviewProps>
    NotificationWizardMethodStep: React.ComponentType<NotificationMethodsProps>
  }
}

export interface MonitoredServiceActiveAgentsDTOArray {
  cetMonitoredServiceAgentConfigData?: MonitoredServiceActiveAgentsDTO[]
}

export interface CETAgentConfigProps {
  serviceRef?: string
  environmentRef?: string
}
