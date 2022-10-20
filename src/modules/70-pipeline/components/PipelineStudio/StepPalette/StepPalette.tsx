/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { ExpandingSearchInput, Text, Icon, Layout, Container, Heading } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { cloneDeep, uniqBy, isEmpty } from 'lodash-es'
import cx from 'classnames'
import { useParams } from 'react-router-dom'
import { StepCategory, StepData, StepPalleteModuleInfo, useGetStepsV2 } from 'services/pipeline-ng'
import { useMutateAsGet } from '@common/hooks'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useStrings } from 'framework/strings'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { StepActions } from '@common/constants/TrackingConstants'
import type { StageType } from '@pipeline/utils/stageHelpers'
import { StepPopover } from '@pipeline/components/PipelineStudio/StepPalette/StepPopover/StepPopover'
import type { AbstractStepFactory, StepData as FactoryStepData } from '../../AbstractSteps/AbstractStepFactory'

import { iconMapByName } from './iconMap'
import css from './StepPalette.module.scss'

export const getAllStepsCountForPalette = (originalData: StepCategory[]): number => {
  let count = 0
  originalData.forEach((data: StepCategory) => {
    const { stepCategories, stepsData } = data
    if (isEmpty(stepCategories)) {
      /*
        Ex - Kubernetes -> No nested categories -> add all the steps
      */
      count += stepsData ? stepsData.length : 0
    } else {
      /**
        Ex - Utilities -> nested categories -> add all steps of each category
      */
      stepCategories?.forEach((category: StepCategory) => {
        count += category.stepsData ? category.stepsData.length : 0
      })
    }
  })
  return count
}

const primaryTypes = {
  SHOW_ALL: 'show_all',
  RECENTLY_USED: 'recently_used'
}

enum FilterContext {
  NAV = 'NAV',
  SEARCH = 'SEARCH'
}

export interface StepPaletteProps {
  onSelect: (item: FactoryStepData) => void
  stepsFactory: AbstractStepFactory
  stepPaletteModuleInfos: StepPalleteModuleInfo[]
  stageType: StageType
  isProvisioner?: boolean
}
export function StepPalette({ onSelect, stepsFactory, stepPaletteModuleInfos }: StepPaletteProps): React.ReactElement {
  const [stepCategories, setStepsCategories] = useState<StepCategory[]>([])
  const [originalData, setOriginalCategories] = useState<StepCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState(primaryTypes.SHOW_ALL)
  const { trackEvent } = useTelemetry()
  // Need this when we have same names for category and sub category
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const { accountId } = useParams<{ module: string; accountId: string }>()
  const { CHAOS_ENABLED } = useFeatureFlags()

  function Message({ stepsDataLoading }: { stepsDataLoading: boolean }): React.ReactElement | null {
    const message = stepsDataLoading
      ? getString('stepPalette.loadingSteps')
      : isEmpty(stepCategories)
      ? getString('stepPalette.noSearchResultsFound')
      : ''
    // Only render this section if we're loading or if we do not have any steps
    return message ? (
      <section style={{ paddingTop: '50%', justifyContent: 'center', textAlign: 'center' }}>{message}</section>
    ) : null
  }

  const { data: stepsData, loading: stepsDataLoading } = useMutateAsGet(useGetStepsV2, {
    queryParams: {
      accountId
    },
    body: { stepPalleteModuleInfos: stepPaletteModuleInfos }
  })

  const { getString } = useStrings()
  useEffect(() => {
    const fromApi = stepsData?.data?.stepCategories
    const toShow: StepCategory[] = []
    fromApi?.forEach(stepCat => {
      if (stepCat?.stepCategories?.length) {
        toShow.push(...(stepCat?.stepCategories || []))
      }
    })

    if (toShow) {
      // Hide Chaos step when CHAOS_ENABLED is false
      if (!CHAOS_ENABLED) {
        const filterSteps = toShow.filter(step => step.name !== 'Chaos')
        setStepsCategories(filterSteps)
      } else {
        setStepsCategories(toShow)
      }
      setOriginalCategories(toShow)
    }
  }, [stepsData?.data?.stepCategories])

  const filterSteps = (stepName: string, context = FilterContext.NAV): void => {
    const filteredData: StepCategory[] = []
    const name = stepName.toLowerCase()
    const cloneOriginalData = cloneDeep(originalData)
    if (name !== primaryTypes.SHOW_ALL) {
      cloneOriginalData.forEach((k: StepCategory) => {
        if (k.name?.toLowerCase() === name) {
          filteredData.push(k)
        } else if (k.stepCategories && k.stepCategories.length > 0) {
          const _stepCategories: StepCategory[] = []
          k.stepCategories.forEach((v: StepCategory) => {
            if (v.name?.toLowerCase() === name) {
              _stepCategories.push(v)
            }
          })
          if (_stepCategories?.length) {
            k.stepCategories = _stepCategories

            filteredData.push(k)
          } else {
            const _stepsData: StepData[] = []
            // Each category has steps data inside it
            k.stepCategories.forEach((v: StepCategory) => {
              v?.stepsData?.forEach((m: StepData) => {
                if (m.name?.toLowerCase().indexOf(name) !== -1) {
                  _stepsData.push(m)
                }
              })

              if (_stepsData?.length) {
                // v.stepsData = _stepsData
                filteredData.push(k)
              }
            })
          }
        }

        if (context === FilterContext.SEARCH && k.stepsData) {
          const _stepsData: StepData[] = []
          k.stepsData.forEach((m: StepData) => {
            if (m.name?.toLowerCase().indexOf(name) !== -1) {
              _stepsData.push(m)
            }
          })
          if (_stepsData?.length) {
            k.stepsData = _stepsData
            filteredData.push(k)
          }
        }
      })
      const uniqueData: StepCategory[] = uniqBy(filteredData, 'name')
      setStepsCategories(uniqueData)
      setSelectedCategory(stepName)
    } else {
      setStepsCategories(originalData)
      setSelectedCategory(stepName)
    }
  }

  return (
    <div className={css.stepPalette}>
      <div className={css.stepInside}>
        <section className={css.stepsRenderer}>
          <Layout.Vertical padding="xlarge" spacing="large">
            <Layout.Horizontal spacing="medium" className={css.paletteCardHeader}>
              <Layout.Vertical>
                <Heading level={2} color={Color.GREY_800} font={{ weight: 'bold' }} className={css.title}>
                  {getString('stepPalette.title')}
                </Heading>
              </Layout.Vertical>

              <ExpandingSearchInput
                flip
                autoFocus
                width={232}
                throttle={200}
                onChange={(text: string) => filterSteps(text, FilterContext.SEARCH)}
              />
            </Layout.Horizontal>

            <Message stepsDataLoading={stepsDataLoading} />

            {stepCategories?.map((stepCategory: StepCategory, i) => {
              const categorySteps: JSX.Element[] = []
              /* istanbul ignore else */ if (stepCategory?.stepsData) {
                stepCategory.stepsData.forEach((stepData: StepData) => {
                  categorySteps.push(
                    <section
                      className={css.step}
                      key={`${stepData.name}-${i}`}
                      onClick={() => {
                        if (stepData.type !== 'Placeholder' && !stepData.disabled) {
                          onSelect({
                            name: stepData.name || '',
                            type: stepData.type || '',
                            icon: stepsFactory.getStepIcon(stepData.type || '')
                          })
                          trackEvent(StepActions.SelectStep, { name: stepData.name || '', type: stepData.type || '' })
                        }
                      }}
                    >
                      <StepPopover stepData={stepData} stepsFactory={stepsFactory} />
                      <section className={css.stepName}>{stepData.name}</section>
                    </section>
                  )
                })
              }

              if (stepCategory?.stepCategories && stepCategory.stepCategories.length > 0) {
                stepCategory.stepCategories.forEach((subStepData: StepCategory, j) => {
                  subStepData?.stepsData?.map((stepData: StepData) => {
                    categorySteps.push(
                      <section
                        className={css.step}
                        key={`${stepData.name}-${j}`}
                        onClick={() => {
                          /* istanbul ignore else */ if (stepData.type !== 'Placeholder') {
                            onSelect({
                              name: stepData.name || /* istanbul ignore next */ '',
                              type: stepData.type || /* istanbul ignore next */ '',
                              icon: stepsFactory.getStepIcon(stepData.type || '')
                            })
                            trackEvent(StepActions.SelectStep, { name: stepData.name || '', type: stepData.type || '' })
                          }
                        }}
                      >
                        <StepPopover stepData={stepData} stepsFactory={stepsFactory} />
                        <section className={css.stepName}>{stepData.name}</section>
                      </section>
                    )
                  })
                })
              }

              return (
                <section className={css.categorySteps} key={stepCategory.name}>
                  <section className={cx(css.categoryName)}>{stepCategory.name}</section>
                  <section className={cx(css.steps)}>{[...categorySteps]}</section>
                </section>
              )
            })}
          </Layout.Vertical>
        </section>
        <section className={css.categoriesRenderer}>
          <section className={css.headerContainer}>
            <Layout.Horizontal flex>
              <Container flex className={css.libraryHeader}>
                <Icon size={14} name="library" className={`${css.paletteIcon} ${css.library}`} />
                <Text color={Color.WHITE} style={{ fontSize: 14 }}>
                  {getString('stepPalette.library')}
                </Text>
              </Container>
            </Layout.Horizontal>

            <section
              onClick={() => {
                filterSteps(primaryTypes.SHOW_ALL)
              }}
              key={primaryTypes.SHOW_ALL}
              className={css.showAllBtn}
            >
              <Text color={Color.WHITE} style={{ fontSize: 11, fontWeight: 'bold' }}>
                {getString('stepPalette.showAllSteps')} ({getAllStepsCountForPalette(originalData)})
              </Text>
            </section>
          </section>
          <hr className={css.separator} />

          <section className={css.secCategories}>
            <Layout.Vertical>
              {originalData?.map((category: StepCategory) => {
                const stepRenderer = []
                if (category?.stepCategories && category.stepCategories.length === 0) {
                  stepRenderer.push(
                    <section
                      className={cx(
                        css.category,
                        selectedCategory === category.name && selectedLevel === 'category' && css.active,
                        !iconMapByName[category.name || '']?.keepOriginal && css.fillWhite
                      )}
                      onClick={() => {
                        setSelectedLevel('category')
                        filterSteps(category.name || /* istanbul ignore next */ '')
                      }}
                      key={category.name}
                    >
                      <Icon
                        size={14}
                        name={iconMapByName[category.name || /* istanbul ignore next */ '']?.icon}
                        className={css.paletteIcon}
                      />
                      {category.name} ({category.stepsData?.length})
                    </section>
                  )
                }
                if (category?.stepCategories && category.stepCategories.length > 0) {
                  const subCategory = category.stepCategories
                  stepRenderer.push(
                    <section
                      className={cx(
                        css.category,
                        selectedCategory === category.name && selectedLevel === 'category' && css.active,
                        subCategory.length && css.hasSubCategories,
                        !iconMapByName[category.name || '']?.keepOriginal && css.fillWhite
                      )}
                      onClick={() => {
                        setSelectedLevel('category')
                        filterSteps(category.name || '')
                      }}
                      key={category.name}
                    >
                      <Icon
                        size={14}
                        name={iconMapByName[category.name || /* istanbul ignore next */ '']?.icon}
                        className={css.paletteIcon}
                      />
                      {category.name} ({subCategory.length})
                    </section>
                  )
                  subCategory.forEach((subCat: StepCategory, k) =>
                    stepRenderer.push(
                      <section
                        className={cx(
                          css.category,
                          css.subCategory,
                          css.offset,
                          selectedCategory === subCat.name && selectedLevel === 'subCategory' && css.active,
                          k === subCategory.length - 1 && css.lastSubCategory
                        )}
                        onClick={() => {
                          setSelectedLevel('subCategory')
                          filterSteps(subCat.name || /* istanbul ignore next */ '')
                        }}
                        key={`${subCat.name}-${k}`}
                      >
                        {subCat.name} ({subCat.stepsData?.length})
                      </section>
                    )
                  )
                }
                return [...stepRenderer]
              })}
            </Layout.Vertical>
          </section>
        </section>
      </div>
    </div>
  )
}
