/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { MutateMethod } from 'restful-react'
import { defaultTo, isEmpty, noop, omit, omitBy, set } from 'lodash-es'
import { useHistory, useParams } from 'react-router-dom'

import { useToaster } from '@harness/uicore'
import type { CreateUpdateInputSetsReturnType, InputSetDTO, SaveInputSetDTO } from '@pipeline/utils/types'
import { AppStoreContext } from 'framework/AppStore/AppStoreContext'
import type {
  CreateInputSetForPipelineQueryParams,
  EntityGitDetails,
  ResponseInputSetResponse,
  UpdateInputSetForPipelinePathParams,
  UpdateInputSetForPipelineQueryParams
} from 'services/pipeline-ng'
import type { SaveToGitFormInterface } from '@common/components/SaveToGitForm/SaveToGitForm'
import { StoreMetadata, StoreType } from '@common/constants/GitSyncTypes'
import { UseSaveSuccessResponse, useSaveToGitDialog } from '@common/modals/SaveToGitDialog/useSaveToGitDialog'
import { getFormattedErrors } from '@pipeline/utils/runPipelineUtils'
import type { InputSetGitQueryParams, InputSetPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import type { GitData } from '@common/modals/GitDiffEditor/useGitDiffEditorDialog'
import { useStrings } from 'framework/strings'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { clearNullUndefined } from '@pipeline/utils/inputSetUtils'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'

interface GetUpdatedGitDetailsReturnType extends EntityGitDetails {
  lastObjectId?: string
  lastCommitId?: string
  baseBranch?: string
}

const getUpdatedGitDetails = (
  isEdit: boolean,
  gitDetails: SaveToGitFormInterface | undefined,
  lastObjectId: string,
  initialGitDetails: EntityGitDetails,
  conflictCommitId?: string
): GetUpdatedGitDetailsReturnType => {
  let updatedGitDetails: GetUpdatedGitDetailsReturnType = {}
  if (gitDetails) {
    updatedGitDetails = { ...gitDetails }
    if (isEdit) {
      updatedGitDetails['lastObjectId'] = lastObjectId
      updatedGitDetails['lastCommitId'] = conflictCommitId || initialGitDetails.commitId
    }
    if (gitDetails.isNewBranch) {
      updatedGitDetails['baseBranch'] = initialGitDetails.branch
    }
  }
  return updatedGitDetails
}

interface UseSaveInputSetReturnType {
  handleSubmit: (
    inputSetObjWithGitInfo: InputSetDTO,
    gitDetails?: EntityGitDetails,
    storeMetadata?: StoreMetadata
  ) => Promise<void>
}

interface InputSetInfo {
  createInputSet: MutateMethod<ResponseInputSetResponse, string, CreateInputSetForPipelineQueryParams, void>
  updateInputSet: MutateMethod<
    ResponseInputSetResponse,
    string,
    UpdateInputSetForPipelineQueryParams,
    UpdateInputSetForPipelinePathParams
  >
  inputSetResponse: ResponseInputSetResponse | null
  isEdit: boolean
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  onCreateSuccess?: (response: ResponseInputSetResponse) => void
}

export function useSaveInputSet(inputSetInfo: InputSetInfo): UseSaveInputSetReturnType {
  const {
    createInputSet,
    updateInputSet,
    inputSetResponse,
    isEdit,
    setFormErrors,
    onCreateSuccess = noop
  } = inputSetInfo
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const history = useHistory()

  const { projectIdentifier, orgIdentifier, accountId, pipelineIdentifier } = useParams<
    PipelineType<InputSetPathProps> & { accountId: string }
  >()
  const { repoIdentifier, branch, repoName, connectorRef, storeType } = useQueryParams<InputSetGitQueryParams>()

  const [savedInputSetObj, setSavedInputSetObj] = React.useState<InputSetDTO>({})
  const [initialGitDetails, setInitialGitDetails] = React.useState<EntityGitDetails>({ repoIdentifier, branch })
  const [initialStoreMetadata, setInitialStoreMetadata] = React.useState<StoreMetadata>({
    repoName,
    branch,
    connectorRef,
    storeType
  })

  const { isGitSyncEnabled: isGitSyncEnabledForProject, gitSyncEnabledOnlyForFF } = React.useContext(AppStoreContext)
  const isGitSyncEnabled = isGitSyncEnabledForProject && !gitSyncEnabledOnlyForFF

  const createUpdateInputSet = React.useCallback(
    async (
      inputSetObj: InputSetDTO,
      gitDetails?: SaveToGitFormInterface,
      objectId = '',
      onCreateInputSetSuccess: (response: ResponseInputSetResponse) => void = noop,
      conflictCommitId?: string
    ): CreateUpdateInputSetsReturnType => {
      let response: ResponseInputSetResponse | null = null
      try {
        const updatedGitDetails = getUpdatedGitDetails(
          isEdit,
          gitDetails,
          objectId,
          initialGitDetails,
          conflictCommitId
        )
        if (isEdit) {
          if (inputSetObj.identifier) {
            response = await updateInputSet(yamlStringify({ inputSet: clearNullUndefined(inputSetObj) }), {
              pathParams: {
                inputSetIdentifier: defaultTo(inputSetObj.identifier, '')
              },
              queryParams: {
                accountIdentifier: accountId,
                orgIdentifier,
                pipelineIdentifier,
                projectIdentifier,
                ...(isGitSyncEnabled
                  ? {
                      pipelineRepoID: repoIdentifier,
                      pipelineBranch: branch
                    }
                  : {}),
                ...(initialStoreMetadata.storeType === StoreType.REMOTE ? initialStoreMetadata : {}),
                ...updatedGitDetails
              }
            })
          } else {
            throw new Error(getString('common.validation.identifierIsRequired'))
          }
        } else {
          response = await createInputSet(yamlStringify({ inputSet: clearNullUndefined(inputSetObj) }), {
            queryParams: {
              accountIdentifier: accountId,
              orgIdentifier,
              pipelineIdentifier,
              projectIdentifier,
              ...(isGitSyncEnabled
                ? {
                    pipelineRepoID: repoIdentifier,
                    pipelineBranch: branch
                  }
                : {}),
              ...(initialStoreMetadata.storeType === StoreType.REMOTE ? initialStoreMetadata : {}),
              ...updatedGitDetails
            }
          })
          onCreateInputSetSuccess(response)
        }
        if (!isGitSyncEnabled && initialStoreMetadata.storeType !== StoreType.REMOTE) {
          showSuccess(getString('inputSets.inputSetSaved'))
          history.goBack()
        }
      } catch (e) {
        const errors = getFormattedErrors(e?.data?.metadata?.uuidToErrorResponseMap)
        if (!isEmpty(errors)) {
          setFormErrors(errors)
        }
        // This is done because when git sync is enabled / storeType in REMOTE, errors are displayed in a modal
        if (!isGitSyncEnabled && initialStoreMetadata.storeType !== StoreType.REMOTE) {
          showError(getRBACErrorMessage(e), undefined, 'pipeline.update.create.inputset')
        } else {
          throw e
        }
      }
      return {
        status: response?.status, // nextCallback can be added if required,        response,
        nextCallback: () => history.goBack()
      }
    },
    [
      accountId,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier,
      repoIdentifier,
      branch,
      createInputSet,
      updateInputSet,
      initialGitDetails,
      getString,
      history,
      isEdit,
      isGitSyncEnabled,
      setFormErrors,
      showSuccess,
      showError
    ]
  )

  const { openSaveToGitDialog } = useSaveToGitDialog<SaveInputSetDTO>({
    onSuccess: (gitData: GitData, payload?: SaveInputSetDTO, objectId?: string): Promise<UseSaveSuccessResponse> =>
      createUpdateInputSet(
        payload?.inputSet || savedInputSetObj,
        gitData,
        objectId,
        onCreateSuccess,
        gitData?.resolvedConflictCommitId
      )
  })

  const handleSubmit = React.useCallback(
    async (inputSetObjWithGitInfo: InputSetDTO, gitDetails?: EntityGitDetails, storeMetadata?: StoreMetadata) => {
      const inputSetObj = omit(
        inputSetObjWithGitInfo,
        'repo',
        'branch',
        'connectorRef',
        'repoName',
        'filePath',
        'storeType'
      )

      // This removes the pseudo fields set for handling multiple fields in the form at once
      set(
        inputSetObj,
        'pipeline',
        omitBy(inputSetObjWithGitInfo.pipeline, (_val, key) => key.startsWith('_'))
      )

      setSavedInputSetObj(inputSetObj)
      setInitialGitDetails(defaultTo(isEdit ? inputSetResponse?.data?.gitDetails : gitDetails, {}))
      setInitialStoreMetadata(defaultTo(storeMetadata, {}))

      if (inputSetObj) {
        if (isGitSyncEnabled || storeMetadata?.storeType === StoreType.REMOTE) {
          openSaveToGitDialog({
            isEditing: isEdit,
            resource: {
              type: 'InputSets',
              name: inputSetObj.name as string,
              identifier: inputSetObj.identifier as string,
              gitDetails: isEdit ? inputSetResponse?.data?.gitDetails : gitDetails,
              storeMetadata: storeMetadata?.storeType === StoreType.REMOTE ? storeMetadata : undefined
            },
            payload: { inputSet: inputSetObj }
          })
        } else {
          createUpdateInputSet(inputSetObj)
        }
      }
    },
    [isEdit, isGitSyncEnabled, inputSetResponse, createUpdateInputSet, openSaveToGitDialog]
  )

  return {
    handleSubmit
  }
}
