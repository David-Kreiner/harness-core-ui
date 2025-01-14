/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@harness/uicore'
import type { FailMetricThresholdSpec, MetricThreshold, MetricThresholdSpec } from 'services/cv'
import type { CriteriaPercentageType } from '../../common/MetricThresholds/MetricThresholds.types'
import type { HealthSourceTypes } from '../../types'
import type { CHART_VISIBILITY_ENUM, FIELD_ENUM } from './CommonHealthSource.constants'

export interface HealthSourcesConfig {
  [x: string]: HealthSourceConfig
}

export interface FieldMapping {
  type: FIELD_ENUM
  label: string
  identifier: keyof CommonCustomMetricFormikInterface
  defaultValue: string
}

export interface HealthSourceConfig {
  addQuery: {
    enableDefaultGroupName?: boolean
    label: string
  }
  customMetrics?: {
    enabled: boolean
    queryAndRecords: {
      enabled: boolean
    }
    fieldMappings?: FieldMapping[]
    metricsChart?: {
      enabled: boolean
      chartVisibilityMode: CHART_VISIBILITY_ENUM
    }
    logsTable?: {
      enabled: boolean
    }
  }
  sideNav?: {
    shouldBeAbleToDeleteLastMetric: boolean
  }
}

export interface HealthSourceSetupSource {
  healthSourceIdentifier: string
  healthSourceName: string
  product: SelectOption
  connectorRef?: { value: string } | string
  region?: string
  dataSourceType?: string
  workspaceId?: string

  // Custom metrics section
  customMetricsMap: Map<string, CommonCustomMetricFormikInterface>
  selectedMetric: string

  // metrics threshold section
  ignoreThresholds: HealthSourceMetricThresholdType[]
  failFastThresholds: HealthSourceMetricThresholdType[]
}

export interface HealthSourceInitialData {
  // Fields coming from define health source screen
  name: string
  identifier: string
  connectorRef: { connector: { identifier: string }; value: string }
  product: string
  type: HealthSourceTypes

  // Configurations Page
  // non custom metric section

  // Custom Metric section
  customMetricsMap: Map<string, CommonCustomMetricFormikInterface>
  selectedMetric?: string

  // metric thresholds
  ignoreThresholds?: HealthSourceMetricThresholdType[]
  failFastThresholds?: HealthSourceMetricThresholdType[]
}

export interface CommonHealthSourceConfigurations {
  // non custom metric section

  // Custom Metric section
  customMetricsMap: Map<string, CommonCustomMetricFormikInterface>
  selectedMetric: string

  // metric thresholds
  ignoreThresholds: HealthSourceMetricThresholdType[]
  failFastThresholds: HealthSourceMetricThresholdType[]
}

export interface CommonCustomMetricFormikInterface {
  identifier: string
  metricName: string
  groupName: SelectOption | string

  // Define Query
  query: string

  //Metric Chart Mapping & Log fields Mappings
  valueJsonPath?: string // for logs its log message and for metrics its metric path
  timestampJsonPath?: string
  timestampFormat?: string

  // Assign
  sli?: boolean
  continuousVerification?: boolean
  healthScore?: boolean

  // Risk
  // TODO - define RiskCategoryEnum
  riskCategory?: string

  // Deviation compare to baseline
  lowerBaselineDeviation?: boolean
  higherBaselineDeviation?: boolean

  //TODO - figure out how this can be controlled by config to
  // show dropdown/input/Json path selector
  serviceInstance?: string | SelectOption
}

// Metric Thresholds
export interface MetricThresholdsState {
  ignoreThresholds: HealthSourceMetricThresholdType[]
  failFastThresholds: HealthSourceMetricThresholdType[]
}

export type HealthSourceMetricThresholdType = Omit<MetricThreshold, 'groupName'> & {
  criteria: MetricThreshold['criteria'] & CriteriaPercentageType
  metricType?: string
  spec?: MetricThresholdSpec & FailMetricThresholdSpec
}
