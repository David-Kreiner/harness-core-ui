/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SeriesColumnOptions } from 'highcharts'

import type { LogData } from 'services/cv'

export type LogAnalysisRowData = {
  clusterType: LogData['tag']
  message: string
  count: number
  messageFrequency: SeriesColumnOptions[]
  riskStatus: LogData['riskStatus']
  clusterId?: string
}