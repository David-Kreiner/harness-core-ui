/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { UseStringsReturn } from 'framework/strings'
import { PipelineStages, PipelineStagesProps } from '@pipeline/components/PipelineStages/PipelineStages'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import { StageType } from '@pipeline/utils/stageHelpers'
import type { Module } from '@common/interfaces/RouteInterfaces'

interface GetPipelineStagesArgs {
  args: Omit<PipelineStagesProps, 'children'>
  getString: UseStringsReturn['getString']
  module?: Module
  isCIEnabled?: boolean
  isCDEnabled?: boolean
  isCFEnabled?: boolean
  isSTOEnabled?: boolean
  isApprovalStageEnabled?: boolean
  isPipelineChainingEnabled?: boolean
}

export const getPipelineStages: (args: GetPipelineStagesArgs) => React.ReactElement<PipelineStagesProps> = ({
  args,
  getString,
  module,
  isCIEnabled = false,
  isCDEnabled = false,
  isCFEnabled = false,
  isSTOEnabled = false,
  isApprovalStageEnabled = false,
  isPipelineChainingEnabled = false
}) => {
  if (module === 'ci') {
    return (
      <PipelineStages {...args}>
        {stagesCollection.getStage(StageType.BUILD, isCIEnabled, getString)}
        {stagesCollection.getStage(StageType.DEPLOY, isCDEnabled, getString)}
        {stagesCollection.getStage(StageType.APPROVAL, isApprovalStageEnabled, getString)}
        {stagesCollection.getStage(StageType.FEATURE, isCFEnabled, getString)}
        {stagesCollection.getStage(StageType.SECURITY, isSTOEnabled, getString)}
        {stagesCollection.getStage(StageType.PIPELINE, isPipelineChainingEnabled, getString)}
        {stagesCollection.getStage(StageType.CUSTOM, true, getString)}
        {stagesCollection.getStage(StageType.Template, false, getString)}
      </PipelineStages>
    )
  } else if (module === 'cf') {
    return (
      <PipelineStages {...args}>
        {stagesCollection.getStage(StageType.FEATURE, isCFEnabled, getString)}
        {/* {stagesCollection.getStage(StageType.DEPLOY, isCDEnabled, getString)}
        {stagesCollection.getStage(StageType.BUILD, isCIEnabled, getString)} */}
        {stagesCollection.getStage(StageType.PIPELINE, isPipelineChainingEnabled, getString)}
        {stagesCollection.getStage(StageType.APPROVAL, isApprovalStageEnabled, getString)}
        {stagesCollection.getStage(StageType.CUSTOM, true, getString)}
        {stagesCollection.getStage(StageType.Template, false, getString)}
      </PipelineStages>
    )
  } else {
    return (
      <PipelineStages {...args}>
        {stagesCollection.getStage(StageType.DEPLOY, isCDEnabled, getString)}
        {stagesCollection.getStage(StageType.BUILD, isCIEnabled, getString)}
        {stagesCollection.getStage(StageType.APPROVAL, isApprovalStageEnabled, getString)}
        {stagesCollection.getStage(StageType.FEATURE, isCFEnabled, getString)}
        {stagesCollection.getStage(StageType.SECURITY, isSTOEnabled, getString)}
        {stagesCollection.getStage(StageType.PIPELINE, isPipelineChainingEnabled, getString)}
        {stagesCollection.getStage(StageType.CUSTOM, true, getString)}
        {stagesCollection.getStage(StageType.Template, false, getString)}
      </PipelineStages>
    )
  }
}
