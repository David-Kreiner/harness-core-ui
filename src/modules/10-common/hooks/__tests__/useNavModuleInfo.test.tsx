/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { renderHook } from '@testing-library/react-hooks'
import { TestWrapper } from '@common/utils/testUtils'
import { ModuleName } from 'framework/types/ModuleName'
import useNavModuleInfo, { useNavModuleInfoMap } from '../useNavModuleInfo'

describe('useModuleInfo tests', () => {
  test('test cd', () => {
    const { result } = renderHook(() => useNavModuleInfo(ModuleName.CD), {
      wrapper: TestWrapper
    })

    expect(result.current.icon).toBe('cd-main')
    expect(result.current.label).toBe('common.purpose.cd.continuous')
    expect(result.current.shouldVisible).toBe(false)
  })

  test('test ci', () => {
    const { result } = renderHook(() => useNavModuleInfo(ModuleName.CI), {
      wrapper: TestWrapper
    })

    expect(result.current.icon).toBe('ci-main')
    expect(result.current.label).toBe('common.purpose.ci.continuous')
    expect(result.current.shouldVisible).toBe(false)
  })

  test('test cv', () => {
    const { result } = renderHook(() => useNavModuleInfo(ModuleName.CV), {
      wrapper: TestWrapper
    })

    expect(result.current.icon).toBe('cv-main')
    expect(result.current.label).toBe('common.serviceReliabilityManagement')
    expect(result.current.shouldVisible).toBe(false)
  })

  test('test cf', () => {
    const { result } = renderHook(() => useNavModuleInfo(ModuleName.CF), {
      wrapper: TestWrapper
    })

    expect(result.current.icon).toBe('ff-solid')
    expect(result.current.label).toBe('common.purpose.cf.continuous')
    expect(result.current.shouldVisible).toBe(false)
  })

  test('test ce', () => {
    const { result } = renderHook(() => useNavModuleInfo(ModuleName.CE), {
      wrapper: TestWrapper
    })

    expect(result.current.icon).toBe('ce-main')
    expect(result.current.label).toBe('common.purpose.ce.cloudCost')
    expect(result.current.shouldVisible).toBe(false)
  })

  test('test sto', () => {
    const { result } = renderHook(() => useNavModuleInfo(ModuleName.STO), {
      wrapper: TestWrapper
    })

    expect(result.current.icon).toBe('sto-color-filled')
    expect(result.current.label).toBe('common.purpose.sto.continuous')
    expect(result.current.shouldVisible).toBe(false)
  })

  test('test CHAOS', () => {
    const { result } = renderHook(() => useNavModuleInfo(ModuleName.CHAOS), {
      wrapper: TestWrapper
    })

    expect(result.current.icon).toBe('chaos-main')
    expect(result.current.label).toBe('chaos.homepage.chaosHomePageTitle')
    expect(result.current.shouldVisible).toBe(false)
  })

  test('test SCM', () => {
    const { result } = renderHook(() => useNavModuleInfo(ModuleName.SCM), {
      wrapper: TestWrapper
    })

    expect(result.current.icon).toBe('gitops-green')
    expect(result.current.label).toBe('common.purpose.scm.name')
    expect(result.current.shouldVisible).toBe(false)
  })

  test('test useNavModuleInfoMap', () => {
    const { result } = renderHook(() => useNavModuleInfoMap(), {
      wrapper: TestWrapper,
      initialProps: {
        defaultLicenseStoreValues: {
          licenseInformation: {
            SCM: {
              licenseType: 'PAID'
            }
          }
        }
      }
    })

    expect(result.current['SCM'].icon).toBe('gitops-green')
    expect(result.current['SCM'].label).toBe('common.purpose.scm.name')
    expect(result.current['SCM'].shouldVisible).toBe(false)
    expect(result.current['SCM'].licenseType).toBe('PAID')
  })
})
