/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
//xx
import type { FormikProps } from 'formik'
import type { SelectOption } from '@pipeline/components/PipelineSteps/Steps/StepsTypes'

export interface MapElkQueriesToServiceProps {
  onChange: (name: string, value: string | boolean | SelectOption) => void
  sampleRecord: Record<string, any> | null
  isQueryExecuted: boolean
  loading: boolean
  serviceInstance: string
  identifyTimestamp: string
  isTemplate?: boolean
  expressions?: string[]
  isConnectorRuntimeOrExpression?: boolean
  connectorIdentifier?: string
  messageIdentifier: string
  formikProps: FormikProps<any>
  logIndexes?: string
}
