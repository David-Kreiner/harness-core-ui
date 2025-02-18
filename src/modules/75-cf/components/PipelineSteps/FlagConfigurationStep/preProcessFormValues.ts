/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { Features } from 'services/cf'
import type { FlagConfigurationStepData } from './types'

export default function preProcessFormValues(
  initialValues: FlagConfigurationStepData,
  featuresData: Features | null
): FlagConfigurationStepData {
  if (Array.isArray(initialValues.spec.instructions) && featuresData?.features) {
    const feature = featuresData.features.find(({ identifier }) => identifier === initialValues.spec.feature)
    const percentageRolloutInstruction = initialValues.spec.instructions.find(
      instruction => instruction.spec?.distribution?.clauses[0]?.op === 'segmentMatch'
    )

    if (feature && percentageRolloutInstruction) {
      percentageRolloutInstruction.spec.distribution.variations = feature.variations.map(({ identifier }) => ({
        variation: identifier,
        weight:
          percentageRolloutInstruction.spec.distribution.variations.find(
            ({ variation }: Record<string, string | number>) => variation === identifier
          )?.weight || 0
      }))
    }
  }

  return initialValues
}
