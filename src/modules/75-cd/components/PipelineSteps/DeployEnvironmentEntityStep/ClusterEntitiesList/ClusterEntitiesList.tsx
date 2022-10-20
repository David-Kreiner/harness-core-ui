/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { Intent, Spinner } from '@blueprintjs/core'

import { ConfirmationDialog, Container, useToggleOpen } from '@harness/uicore'

import { useStrings } from 'framework/strings'

import type { ClusterData } from '../types'
import { ClusterEntityCard } from './ClusterEntityCard'

import css from './ClusterEntitiesList.module.scss'

export interface ClusterEntitiesListProps {
  loading: boolean
  clustersData: ClusterData[]
  readonly: boolean
  onRemoveClusterFromList: (id: string) => void
}

export default function ClusterEntitiesList({
  loading,
  clustersData,
  readonly,
  onRemoveClusterFromList
}: ClusterEntitiesListProps): React.ReactElement {
  const { getString } = useStrings()

  const [clusterToDelete, setClusterToDelete] = React.useState<ClusterData | null>(null)

  const {
    isOpen: isDeleteConfirmationOpen,
    open: openDeleteConfirmation,
    close: closeDeleteConfirmation
  } = useToggleOpen()

  useEffect(() => {
    if (clusterToDelete) {
      openDeleteConfirmation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterToDelete])

  const handleDeleteConfirmation = (confirmed: boolean): void => {
    if (clusterToDelete && confirmed) {
      onRemoveClusterFromList(clusterToDelete.clusterRef)
    }
    setClusterToDelete(null)
    closeDeleteConfirmation()
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <>
      <Container className={css.clusterEntitiesList}>
        {clustersData.map(row => {
          return (
            <ClusterEntityCard
              key={row.clusterRef}
              name={row.name}
              clusterRef={row.clusterRef}
              onDeleteClick={setClusterToDelete}
              readonly={readonly}
            />
          )
        })}
      </Container>

      <ConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        titleText={getString('cd.pipelineSteps.environmentTab.deleteClusterFromListDialogTitleText')}
        contentText={getString('cd.pipelineSteps.environmentTab.deleteClusterFromListConfirmationText', {
          name: clusterToDelete?.name
        })}
        confirmButtonText={getString('common.remove')}
        cancelButtonText={getString('cancel')}
        onClose={handleDeleteConfirmation}
        intent={Intent.WARNING}
      />
    </>
  )
}
