/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { defaultTo, isEmpty, isNil, set } from 'lodash-es'
import { useFormikContext } from 'formik'
import produce from 'immer'
import { v4 as uuid } from 'uuid'

import {
  AllowedTypes,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  SelectOption
} from '@harness/uicore'

import { useStrings } from 'framework/strings'

import { FormMultiTypeMultiSelectDropDown } from '@common/components/MultiTypeMultiSelectDropDown/MultiTypeMultiSelectDropDown'
import { SELECT_ALL_OPTION } from '@common/components/MultiTypeMultiSelectDropDown/MultiTypeMultiSelectDropDownUtils'

import ClusterEntitiesList from '../ClusterEntitiesList/ClusterEntitiesList'
import type { DeployEnvironmentEntityFormState } from '../types'
import { useGetClustersData } from './useGetClustersData'

interface DeployClusterProps {
  initialValues: DeployEnvironmentEntityFormState
  readonly: boolean
  allowableTypes: AllowedTypes
  environmentIdentifier: string
  isMultiCluster?: boolean
}

export function getAllFixedClusters(data: DeployEnvironmentEntityFormState, environmentIdentifier: string): string[] {
  if (data.cluster && getMultiTypeFromValue(data.cluster) === MultiTypeInputType.FIXED) {
    return [data.cluster as string]
  } else if (data.clusters?.[environmentIdentifier] && Array.isArray(data.clusters[environmentIdentifier])) {
    return data.clusters[environmentIdentifier].map(cluster => cluster.value as string)
  }

  return []
}

export function getSelectedClustersFromOptions(items: SelectOption[]): string[] {
  if (Array.isArray(items)) {
    return items.map(item => item.value as string)
  }

  return []
}

export default function DeployCluster({
  initialValues,
  readonly,
  allowableTypes,
  environmentIdentifier,
  isMultiCluster
}: DeployClusterProps): JSX.Element {
  const { values, setFieldValue, setValues } = useFormikContext<DeployEnvironmentEntityFormState>()
  const { getString } = useStrings()
  const uniquePathForClusters = React.useRef(`_pseudo_field_${uuid()}`)

  // State
  const [selectedClusters, setSelectedClusters] = useState(getAllFixedClusters(initialValues, environmentIdentifier))

  // Constants
  const isFixed =
    getMultiTypeFromValue(isMultiCluster ? values.clusters?.[environmentIdentifier] : values.cluster) ===
    MultiTypeInputType.FIXED

  // API
  const { clustersList, loadingClustersList } = useGetClustersData({
    environmentIdentifier
  })

  const selectOptions = useMemo(() => {
    /* istanbul ignore else */
    if (!isNil(clustersList)) {
      return clustersList.map(cluster => ({
        label: cluster.name,
        value: cluster.clusterRef
      }))
    }

    return []
  }, [clustersList])

  const loading = loadingClustersList

  useEffect(() => {
    if (!loading) {
      // update clusters in formik
      /* istanbul ignore else */
      if (values && selectedClusters.length > 0) {
        if (values.clusters && Array.isArray(values.clusters?.[environmentIdentifier])) {
          setValues({
            ...values,
            // set value of unique path created to handle clusters if some clusters are already selected, else select All
            [uniquePathForClusters.current]: selectedClusters.map(clusterId => ({
              label: defaultTo(
                clustersList.find(clusterInList => clusterInList.clusterRef === clusterId)?.name,
                clusterId
              ),
              value: clusterId
            }))
          })
        }
      } else if (isMultiCluster && isEmpty(selectedClusters)) {
        // set value of unique path to All in case no clusters are selected or runtime if clusters are set to runtime
        // This is specifically used for on load
        const clusterIdentifierValue =
          getMultiTypeFromValue(values.clusters?.[environmentIdentifier]) === MultiTypeInputType.RUNTIME
            ? values.clusters?.[environmentIdentifier]
            : [SELECT_ALL_OPTION]
        setFieldValue(`${uniquePathForClusters.current}`, clusterIdentifierValue)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, selectedClusters])

  const disabled = readonly || (isFixed && loading)

  let placeHolderForClusters =
    values.clusters && Array.isArray(values.clusters[environmentIdentifier])
      ? getString('common.clusters')
      : getString('common.allClusters')

  if (loading) {
    placeHolderForClusters = getString('loading')
  }

  const placeHolderForCluster = loading
    ? getString('loading')
    : getString('cd.pipelineSteps.environmentTab.specifyGitOpsCluster')

  const updateFormikAndLocalState = (newFormValues: DeployEnvironmentEntityFormState): void => {
    // this sets the form values
    setValues(newFormValues)
    // this updates the local state
    setSelectedClusters(getAllFixedClusters(newFormValues, environmentIdentifier))
  }

  const onRemoveClusterFromList = (clusterToDelete: string): void => {
    const newFormValues = produce(values, draft => {
      if (draft.cluster) {
        draft.cluster = ''
        delete draft.clusters
      } else if (draft.clusters && Array.isArray(draft.clusters[environmentIdentifier])) {
        const filteredClusters = draft.clusters[environmentIdentifier].filter(
          cluster => cluster.value !== clusterToDelete
        )
        draft.clusters[environmentIdentifier] = filteredClusters
        set(draft, uniquePathForClusters.current, filteredClusters)
      }
    })

    updateFormikAndLocalState(newFormValues)
  }

  return (
    <>
      <Layout.Horizontal spacing="medium" flex={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}>
        {isMultiCluster ? (
          <FormMultiTypeMultiSelectDropDown
            label={getString('cd.pipelineSteps.environmentTab.specifyGitOpsClusters')}
            tooltipProps={{ dataTooltipId: 'specifyGitOpsClusters' }}
            name={uniquePathForClusters.current}
            // Form group disabled
            disabled={disabled}
            dropdownProps={{
              placeholder: placeHolderForClusters,
              items: selectOptions,
              // Field disabled
              disabled,
              isAllSelectionSupported: true
            }}
            onChange={items => {
              if (items?.at(0)?.value === 'All') {
                setFieldValue(`clusters.${environmentIdentifier}`, undefined)
                setSelectedClusters([])
              } else {
                setFieldValue(`clusters.${environmentIdentifier}`, items)
                setSelectedClusters(getSelectedClustersFromOptions(items))
              }
            }}
            multiTypeProps={{
              width: 280,
              allowableTypes
            }}
          />
        ) : (
          <FormInput.MultiTypeInput
            tooltipProps={{ dataTooltipId: 'specifyGitOpsCluster' }}
            label={getString('cd.pipelineSteps.environmentTab.specifyGitOpsCluster')}
            name="cluster"
            useValue
            disabled={disabled}
            placeholder={placeHolderForCluster}
            multiTypeInputProps={{
              width: 300,
              selectProps: { items: selectOptions },
              allowableTypes,
              defaultValueToReset: '',
              onChange: item => {
                setSelectedClusters(getSelectedClustersFromOptions([item as SelectOption]))
              }
            }}
            selectItems={selectOptions}
          />
        )}
      </Layout.Horizontal>
      {isFixed && !isEmpty(selectedClusters) && (
        <ClusterEntitiesList
          loading={loading}
          clustersData={clustersList.filter(clusterInList => selectedClusters.includes(clusterInList.clusterRef))}
          readonly={readonly}
          onRemoveClusterFromList={onRemoveClusterFromList}
        />
      )}
    </>
  )
}
