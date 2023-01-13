/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'

import { ZeroNorthStep } from './ZeroNorthStep/ZeroNorthStep'
import { BanditStep } from './BanditStep/BanditStep'
import { SnykStep } from './SnykStep/SnykStep'

factory.registerStep(new ZeroNorthStep())
factory.registerStep(new BanditStep())
factory.registerStep(new SnykStep())
