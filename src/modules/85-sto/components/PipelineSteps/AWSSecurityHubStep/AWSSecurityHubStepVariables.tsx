/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { flatObject } from '@ci/components/PipelineSteps/StepsFlatObject'
import type { AWSSecurityHubStepData } from './AWSSecurityHubStep'

export interface AWSSecurityHubStepVariablesProps {
  initialValues: AWSSecurityHubStepData
  stageIdentifier: string
  onUpdate?(data: AWSSecurityHubStepData): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: AWSSecurityHubStepData
}

export const AWSSecurityHubStepVariables: React.FC<AWSSecurityHubStepVariablesProps> = ({
  variablesData,
  metadataMap,
  initialValues
}) => <VariablesListTable data={flatObject(variablesData)} originalData={initialValues} metadataMap={metadataMap} />