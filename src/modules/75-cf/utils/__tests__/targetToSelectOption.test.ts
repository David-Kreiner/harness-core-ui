/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { Target } from 'services/cf'
import targetToSelectOption from '../targetToSelectOption'

describe('targetToSelectOption', () => {
  test('it should return a select option when passed a target', async () => {
    const target: Target = {
      identifier: 'test-123',
      name: 'Target Name',
      account: '',
      environment: '',
      org: '',
      project: ''
    }

    expect(targetToSelectOption(target)).toEqual(
      expect.objectContaining({ label: target.name, value: target.identifier })
    )
  })
})
