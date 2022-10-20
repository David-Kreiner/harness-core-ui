/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { Intent, Spinner } from '@blueprintjs/core'

import { AllowedTypes, ConfirmationDialog, Container, ModalDialog, useToggleOpen } from '@harness/uicore'

import { useStrings } from 'framework/strings'

import CreateEnvironmentGroupModal from '@cd/components/EnvironmentGroups/CreateEnvironmentGroupModal'

import type {
  DeployEnvironmentEntityCustomStepProps,
  DeployEnvironmentEntityFormState,
  EnvironmentGroupData
} from '../types'
import { EnvironmentGroupCard } from './EnvironmentGroupEntityCard'

export interface EnvironmentGroupsListProps extends Required<DeployEnvironmentEntityCustomStepProps> {
  loading: boolean
  environmentGroupsList: EnvironmentGroupData[]
  readonly: boolean
  allowableTypes: AllowedTypes
  onEnvironmentGroupEntityUpdate: () => void
  onRemoveEnvironmentGroupFromList: () => void
  initialValues: DeployEnvironmentEntityFormState
}

export default function EnvironmentGroupsList({
  loading,
  environmentGroupsList,
  readonly,
  allowableTypes,
  onEnvironmentGroupEntityUpdate,
  onRemoveEnvironmentGroupFromList,
  initialValues,
  stageIdentifier,
  deploymentType,
  customDeploymentRef,
  gitOpsEnabled
}: EnvironmentGroupsListProps): React.ReactElement {
  const { getString } = useStrings()

  const [environmentGroupToEdit, setEnvironmentGroupToEdit] = React.useState<EnvironmentGroupData | null>(null)
  const [environmentGroupToDelete, setEnvironmentGroupToDelete] = React.useState<EnvironmentGroupData | null>(null)

  const {
    isOpen: isDeleteConfirmationOpen,
    open: openDeleteConfirmation,
    close: closeDeleteConfirmation
  } = useToggleOpen()

  useEffect(() => {
    if (environmentGroupToDelete) {
      openDeleteConfirmation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environmentGroupToDelete])

  const handleDeleteConfirmation = (confirmed: boolean): void => {
    if (environmentGroupToDelete && confirmed) {
      onRemoveEnvironmentGroupFromList()
    }
    setEnvironmentGroupToDelete(null)
    closeDeleteConfirmation()
  }

  const closeEditModal = (): void => {
    setEnvironmentGroupToEdit(null)
  }

  const handleEnvironmentGroupEntityUpdate = (): void => {
    closeEditModal()
    onEnvironmentGroupEntityUpdate()
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <>
      <Container>
        {environmentGroupsList.map(row => {
          return (
            <EnvironmentGroupCard
              key={row.envGroup?.identifier}
              envGroup={row.envGroup}
              initialValues={initialValues}
              onDeleteClick={setEnvironmentGroupToDelete}
              onEditClick={setEnvironmentGroupToEdit}
              allowableTypes={allowableTypes}
              readonly={readonly}
              stageIdentifier={stageIdentifier}
              deploymentType={deploymentType}
              customDeploymentRef={customDeploymentRef}
              gitOpsEnabled={gitOpsEnabled}
            />
          )
        })}
      </Container>

      <ModalDialog
        isOpen={!!environmentGroupToEdit}
        onClose={closeEditModal}
        title={getString('common.editName', { name: getString('common.environmentGroup.label') })}
        canEscapeKeyClose={false}
        canOutsideClickClose={false}
        enforceFocus={false}
        lazy
        width={1024}
      >
        <CreateEnvironmentGroupModal
          data={{
            ...environmentGroupToEdit?.envGroup
          }}
          onCreateOrUpdate={handleEnvironmentGroupEntityUpdate}
          closeModal={closeEditModal}
          isEdit={true}
        />
      </ModalDialog>

      <ConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        titleText={getString('cd.pipelineSteps.environmentTab.deleteEnvironmentGroupFromListDialogTitleText')}
        contentText={getString('cd.pipelineSteps.environmentTab.deleteEnvironmentGroupFromListConfirmationText', {
          name: environmentGroupToDelete?.envGroup?.name
        })}
        confirmButtonText={getString('common.remove')}
        cancelButtonText={getString('cancel')}
        onClose={handleDeleteConfirmation}
        intent={Intent.WARNING}
      />
    </>
  )
}
