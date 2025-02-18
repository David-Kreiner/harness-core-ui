/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { StepDetailsInterface } from '@cv/components/CVStepper/CVStepper.types'
import type { StepStatusType } from '../../Step.types'

export interface StepTitleInterface {
  step: StepDetailsInterface
  index: number
  isCurrent: boolean
  stepStatus: StepStatusType
  onClick: (index: number) => void
  isOptional?: boolean
}
