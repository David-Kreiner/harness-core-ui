/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SecretReference } from '@secrets/components/CreateOrSelectSecret/CreateOrSelectSecret'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import type { NGTriggerConfigV2, NGTriggerSourceV2, PipelineInfoConfig } from 'services/pipeline-ng'
import type { AddConditionInterface } from '../AddConditionsSection/AddConditionsSection'

export interface ConnectorRefInterface {
  identifier?: string
  repoName?: string
  value?: string
  connector?: ConnectorInfoDTO
  label?: string
  live?: boolean
}
export interface FlatValidWebhookFormikValuesInterface {
  name: string
  identifier: string
  description?: string
  tags?: {
    [key: string]: string
  }
  target?: string
  targetIdentifier?: string
  pipeline: PipelineInfoConfig
  resolvedPipeline?: PipelineInfoConfig
  sourceRepo: string
  triggerType: NGTriggerSourceV2['type']
  repoName?: string
  connectorRef?: { connector: { spec: { type: string } }; value: string } // get from dto interface when available
  autoAbortPreviousExecutions: boolean
  event?: string
  actions?: string[]
  secureToken?: string
  sourceBranchOperator?: string
  sourceBranchValue?: string
  targetBranchOperator?: string
  targetBranchValue?: string
  changedFilesOperator?: string
  changedFilesValue?: string
  tagConditionOperator?: string
  tagConditionValue?: string
  headerConditions?: AddConditionInterface[]
  payloadConditions?: AddConditionInterface[]
  jexlCondition?: string
  pipelineBranchName?: string
  inputSetRefs?: string[]
  encryptedWebhookSecretIdentifier?: SecretReference
}
export interface TriggerTypeSourceInterface {
  triggerType: NGTriggerSourceV2['type']
  sourceRepo?: string
  manifestType?: string
  artifactType?: string
}

export interface TriggerConfigDTO extends Omit<NGTriggerConfigV2, 'identifier'> {
  identifier?: string
}

export type FlatValidFormikValuesInterface = FlatValidWebhookFormikValuesInterface
