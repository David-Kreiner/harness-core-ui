/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useEffect, useState } from 'react'
import { useInterval } from '@common/hooks/useInterval'
import type { FreezeSummaryResponse } from 'services/cd-ng'
import { FreezeStatus, getComputedFreezeStatusMap } from '@freeze-windows/utils/freezeWindowUtils'

const ONE_MINUTE = 60_000

// runs a continuous timer check to calculate if the current time falls in between the given range
export const useComputedFreezeStatusMap = (content?: FreezeSummaryResponse[]): Record<string, FreezeStatus> => {
  const [freezeStatusMap, setFreezeStatusMap] = useState(() => getComputedFreezeStatusMap(content))

  useInterval(() => {
    setFreezeStatusMap(getComputedFreezeStatusMap(content))
  }, ONE_MINUTE)

  useEffect(() => {
    setFreezeStatusMap(getComputedFreezeStatusMap(content))
  }, [content])

  return freezeStatusMap
}
