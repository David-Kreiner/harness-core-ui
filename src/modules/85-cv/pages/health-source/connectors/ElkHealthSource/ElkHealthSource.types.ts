/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MapElkQueryToService } from './components/MapQueriesToHarnessService/ElkQueryBuilder.types'

export interface ElkHealthSourceInfo {
  name?: string
  identifier?: string
  connectorRef?: string | { value: string }
  isEdit?: boolean
  product: string
  type: string
  mappedServicesAndEnvs: Map<string, MapElkQueryToService>
}
