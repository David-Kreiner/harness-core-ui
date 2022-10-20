/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { HostData } from 'services/cv'

export type HostTestData = { risk: HostData['risk']; points: Highcharts.SeriesLineOptions['data']; name: string }

export type HostControlTestData = Omit<HostTestData, 'risk' | 'name'> & {
  risk?: HostData['risk']
  name?: string | null
}

export const widthPercentagePerGraph = 1
