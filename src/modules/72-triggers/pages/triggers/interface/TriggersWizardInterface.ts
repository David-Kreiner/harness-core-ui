/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ConnectorInfoDTO } from 'services/cd-ng'
import type {
  ArtifactTriggerConfig,
  GetActionsListQueryParams,
  ManifestTriggerConfig,
  NGTriggerConfigV2,
  NGTriggerSourceV2,
  PipelineInfoConfig,
  WebhookTriggerConfigV2
} from 'services/pipeline-ng'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import type { SecretReference } from '@secrets/components/CreateOrSelectSecret/CreateOrSelectSecret'
import type { AddConditionInterface } from '../views/AddConditionsSection'

export interface ConnectorRefInterface {
  identifier?: string
  repoName?: string
  value?: string
  connector?: ConnectorInfoDTO
  label?: string
  live?: boolean
}

export interface FlatInitialValuesInterface {
  triggerType: NGTriggerSourceV2['type']
  identifier?: string
  tags?: {
    [key: string]: string
  }
  pipeline?: string | PipelineInfoConfig
  originalPipeline?: PipelineInfoConfig
  resolvedPipeline?: PipelineInfoConfig
  inputSetTemplateYamlObj?: {
    pipeline: PipelineInfoConfig | Record<string, never>
  }
  name?: string
  // WEBHOOK-SPECIFIC
  sourceRepo?: string
  connectorRef?: ConnectorRefInterface
  // SCHEDULE-SPECIFIC
  selectedScheduleTab?: string
  pipelineBranchName?: string
  inputSetRefs?: string[]
  // Triggers authentication
  encryptedWebhookSecretIdentifier?: string
}

export interface FlatOnEditValuesInterface {
  name: string
  identifier: string
  // targetIdentifier: string
  description?: string
  tags?: {
    [key: string]: string
  }
  source?: NGTriggerSourceV2
  pipeline: PipelineInfoConfig
  triggerType: NGTriggerSourceV2['type']
  manifestType?: string
  artifactType?: string
  originalPipeline?: PipelineInfoConfig
  resolvedPipeline?: PipelineInfoConfig
  // WEBHOOK-SPECIFIC
  sourceRepo?: GetActionsListQueryParams['sourceRepo']
  connectorRef?: ConnectorRefInterface
  connectorIdentifier?: string
  repoName?: string
  repoUrl?: string
  autoAbortPreviousExecutions?: boolean
  event?: string
  actions?: string[]
  anyAction?: boolean // required for onEdit to show checked
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
  // SCHEDULE-SPECIFIC
  selectedScheduleTab?: string
  minutes?: string
  expression?: string
  // ARTIFACT/MANIFEST-SPECIFIC
  selectedArtifact?: any
  stageId?: string
  inputSetTemplateYamlObj?: {
    pipeline: PipelineInfoConfig | Record<string, never>
  }
  eventConditions?: AddConditionInterface[]
  versionValue?: string
  versionOperator?: string
  buildValue?: string
  buildOperator?: string
  pipelineBranchName?: string
  inputSetRefs?: string[]
  pollInterval?: string
  encryptedWebhookSecretIdentifier?: string
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
  pollInterval?: string
  encryptedWebhookSecretIdentifier?: SecretReference
}

export interface FlatValidScheduleFormikValuesInterface {
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
  expression: string
  pipelineBranchName?: string
  inputSetRefs?: string[]
}

export interface FlatValidArtifactFormikValuesInterface {
  name: string
  identifier: string
  description?: string
  tags?: {
    [key: string]: string
  }
  triggerType: NGTriggerSourceV2['type']
  selectedArtifact: any
  stageId: string
  pipeline: PipelineInfoConfig
  resolvedPipeline?: PipelineInfoConfig
}

export interface TriggerConfigDTO extends Omit<NGTriggerConfigV2, 'identifier'> {
  identifier?: string
  encryptedWebhookSecretIdentifier?: string
}

export interface TriggerGitQueryParams extends GitQueryParams {
  triggerType?: NGTriggerSourceV2['type']
  sourceRepo?: WebhookTriggerConfigV2['type']
  manifestType?: ManifestTriggerConfig['type']
  artifactType?: ArtifactTriggerConfig['type']
}

export interface artifactManifestData {
  artifactRef: string
  name: string
  stageId: string
  artifactRepository: string
  location: string
  buildTag?: string
  version?: string
  spec?: any
  [key: string]: any
}

export interface ManifestInterface {
  [key: string]: string
}
export interface artifactTableDetails {
  location?: string
  chartVersion?: string
  tag?: string
  storeType?: string
}

export interface artifactTableItem {
  artifactId: string
  artifactLabel: string
  stageId: string
  artifactRepository: string
  location: string
  version?: string // for manifest
  buildTag?: string // for artifact
  disabled: boolean
  hasRuntimeInputs: boolean
  isStageOverrideManifest: boolean // to hide in SelectArtifactModal if not unique
}

export type FlatValidFormikValuesInterface =
  | FlatValidArtifactFormikValuesInterface
  | FlatValidWebhookFormikValuesInterface
  | FlatValidScheduleFormikValuesInterface
