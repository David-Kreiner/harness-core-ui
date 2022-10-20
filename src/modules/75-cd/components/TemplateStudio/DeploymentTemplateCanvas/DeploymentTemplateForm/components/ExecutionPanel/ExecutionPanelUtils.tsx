/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import produce from 'immer'
import { set } from 'lodash-es'
import type { DeploymentConfig } from '@pipeline/components/PipelineStudio/PipelineVariables/types'
import type { TemplateSummaryResponse } from 'services/template-ng'
import type { TemplateDetailsByRef } from '@cd/context/DeploymentContext/DeploymentContextProvider'

interface Params {
  templateRef: string
  deploymentConfig: DeploymentConfig
}

export const getUpdatedDeploymentConfig = ({ templateRef, deploymentConfig }: Params): DeploymentConfig =>
  produce(deploymentConfig, draft => {
    const stepTemplateRefs = deploymentConfig.execution?.stepTemplateRefs || /* istanbul ignore next */ []
    const updatedStepTemplateRefs = [templateRef, ...stepTemplateRefs]

    set(draft, 'execution.stepTemplateRefs', updatedStepTemplateRefs)
  })

export const getUpdatedTemplateDetailsByRef = ({
  templateDetailsObj,
  templateDetailsByRef,
  templateRef
}: {
  templateDetailsObj: TemplateSummaryResponse
  templateDetailsByRef: TemplateDetailsByRef
  templateRef: string
}): TemplateDetailsByRef =>
  produce(templateDetailsByRef, draft => {
    set(draft, templateRef, templateDetailsObj)
  })
