/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@harness/icons'
import type { StoreType } from '@common/constants/GitSyncTypes'
import type {
  NodeRunInfo,
  EntityGitDetails,
  EntityValidityDetails,
  InputSetResponse,
  PipelineInfoConfig,
  StringNGVariable,
  NumberNGVariable,
  SecretNGVariable,
  StepElementConfig
} from 'services/pipeline-ng'

export type AllNGVariables = StringNGVariable | NumberNGVariable | SecretNGVariable

export interface ExecutionPageQueryParams {
  view?: 'log' | 'graph'
  stage?: string
  step?: string
  retryStep?: string
  stageExecId?: string // strategy nodes require stageExecId + stageID
}

export interface ExpressionBlock {
  expression?: string
  expressionValue?: string
}

export interface ConditionalExecutionNodeRunInfo extends NodeRunInfo {
  expressions?: ExpressionBlock[]
}

export type StatusType = 'SUCCESS' | 'FAILURE' | 'ERROR'

export type CreateUpdateInputSetsReturnType = Promise<{
  status?: StatusType
  nextCallback: () => void
}>

export interface InputSetType {
  name: string
  tags?: { [key: string]: string }
  identifier: string
  description: string
  orgIdentifier: string
  projectIdentifier: string
  pipeline: PipelineInfoConfig
  gitDetails: EntityGitDetails
  entityValidityDetails: EntityValidityDetails
  outdated?: boolean
  storeType?: StoreType.INLINE | StoreType.REMOTE
}

export interface InputSetDTO extends Omit<InputSetResponse, 'identifier' | 'pipeline'> {
  pipeline?: PipelineInfoConfig
  identifier?: string
  repo?: string
  branch?: string
}

export interface SaveInputSetDTO {
  inputSet: InputSetDTO
}

export interface Pipeline {
  pipeline: PipelineInfoConfig
}

export interface InputSet {
  inputSet: InputSetDTO
}

export type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export interface ECSRollingDeployStepInitialValues extends StepElementConfig {
  sameAsAlreadyRunningInstances?: boolean | string
  forceNewDeployment?: boolean | string
}

export type TemplateIcons = { [K: string]: string | undefined | TemplateIcons }

export type TriggerTypeIconAndExecutionText = {
  iconName: IconName
  getText: (startTs?: number, triggeredBy?: string) => string
}
