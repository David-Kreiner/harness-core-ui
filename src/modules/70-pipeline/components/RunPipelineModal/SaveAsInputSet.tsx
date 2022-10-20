/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Dispatch, SetStateAction } from 'react'
import { useParams } from 'react-router-dom'
import * as Yup from 'yup'
import type { FormikErrors } from 'formik'
import { defaultTo, isUndefined, omit, omitBy, isNull, set } from 'lodash-es'
import type { MutateMethod } from 'restful-react'
import { Button, ButtonVariation, Container, Formik, Layout, Popover } from '@wings-software/uicore'
import { Classes } from '@blueprintjs/core'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import {
  CreateInputSetForPipelineQueryParams,
  EntityGitDetails,
  ResponseInputSetResponse,
  useCreateInputSetForPipeline
} from 'services/pipeline-ng'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { NameIdDescriptionTags } from '@common/components'
import { useToaster } from '@common/exports'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import GitContextForm, { GitContextProps } from '@common/components/GitContextForm/GitContextForm'
import type { SaveToGitFormInterface } from '@common/components/SaveToGitForm/SaveToGitForm'
import { useSaveToGitDialog, UseSaveSuccessResponse } from '@common/modals/SaveToGitDialog/useSaveToGitDialog'
import type { GitQueryParams, PipelineType } from '@common/interfaces/RouteInterfaces'
import { StoreMetadata, StoreType } from '@common/constants/GitSyncTypes'
import { GitSyncForm } from '@gitsync/components/GitSyncForm/GitSyncForm'
import { getFormattedErrors } from '@pipeline/utils/runPipelineUtils'
import { useStrings } from 'framework/strings'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import type { InputSetDTO } from '@pipeline/utils/types'

function clearNullUndefined<T>(data: T): T {
  return omitBy(omitBy(data, isUndefined), isNull) as T
}

interface UseCreateUpdateInputSetReturnType {
  createUpdateInputSet: (
    inputSetObj: InputSetDTO,
    initialGitDetails?: EntityGitDetails | undefined,
    initialStoreMetadata?: StoreMetadata,
    gitDetails?: SaveToGitFormInterface | undefined,
    payload?: Omit<InputSetDTO, 'repo' | 'branch'> | undefined
  ) => Promise<ResponseInputSetResponse>
  createUpdateInputSetWithGitDetails: (
    savedInputSetObj: InputSetDTO,
    initialGitDetails: EntityGitDetails,
    initialStoreMetadata: StoreMetadata,
    gitDetails: SaveToGitFormInterface
  ) => Promise<ResponseInputSetResponse>
}

const useCreateUpdateInputSet = (
  pipeline: PipelineInfoConfig | undefined,
  repoIdentifier: string | undefined,
  branch: string | undefined,
  createInputSet: MutateMethod<ResponseInputSetResponse, string, CreateInputSetForPipelineQueryParams, void>,
  getInputSetsList: () => void,
  setFormErrors: Dispatch<SetStateAction<FormikErrors<InputSetDTO>>>
): UseCreateUpdateInputSetReturnType => {
  const { getString } = useStrings()
  const { showError, showSuccess } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      accountId: string
    }> &
      GitQueryParams
  >()

  const createUpdateInputSet = async (
    inputSetObj: InputSetDTO,
    initialGitDetails?: EntityGitDetails,
    initialStoreMetadata?: StoreMetadata,
    gitDetails?: SaveToGitFormInterface,
    payload?: Omit<InputSetDTO, 'repo' | 'branch'>
  ): Promise<ResponseInputSetResponse> => {
    try {
      const response = await createInputSet(
        yamlStringify({
          inputSet: { ...clearNullUndefined(defaultTo(payload, inputSetObj)), orgIdentifier, projectIdentifier }
        }),
        {
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            pipelineIdentifier: pipeline?.identifier as string,
            pipelineRepoID: repoIdentifier,
            pipelineBranch: branch,
            ...(initialStoreMetadata?.storeType === StoreType.REMOTE ? initialStoreMetadata : {}),
            ...(gitDetails ?? {}),
            ...(gitDetails && gitDetails.isNewBranch ? { baseBranch: initialGitDetails?.branch } : {})
          }
        }
      )
      if (response.data?.errorResponse) {
        const errors = getFormattedErrors(response.data.inputSetErrorWrapper?.uuidToErrorResponseMap)
        if (Object.keys(errors).length) {
          setFormErrors(errors)
        } else {
          showError(getString('inputSets.inputSetSavedError'), undefined, 'pipeline.save.inputset.error')
        }
      } else {
        showSuccess(getString('inputSets.inputSetSaved'))
      }
      return response
    } catch (e) {
      showError(getRBACErrorMessage(e))
      // throw error here so that it's uncaught in handleSubmit and we don'tr end up reloading the modal
      throw e
    }
  }

  const createUpdateInputSetWithGitDetails = (
    savedInputSetObj: InputSetDTO,
    initialGitDetails: EntityGitDetails,
    initialStoreMetadata: StoreMetadata,
    gitDetails: SaveToGitFormInterface
  ): Promise<UseSaveSuccessResponse> => {
    return createUpdateInputSet(savedInputSetObj, initialGitDetails, initialStoreMetadata, gitDetails).then(resp => {
      getInputSetsList()
      return resp
    })
  }

  return { createUpdateInputSet, createUpdateInputSetWithGitDetails }
}

interface SaveAsInputSetProps {
  pipeline?: PipelineInfoConfig
  currentPipeline?: { pipeline?: PipelineInfoConfig }
  template: string | undefined
  values: PipelineInfoConfig
  accountId: string
  projectIdentifier: string
  orgIdentifier: string
  canEdit: boolean
  repoIdentifier?: string
  connectorRef?: string
  repoName?: string
  branch?: string
  storeType?: 'INLINE' | 'REMOTE'
  isGitSyncEnabled?: boolean
  supportingGitSimplification?: boolean
  setFormErrors: Dispatch<SetStateAction<FormikErrors<InputSetDTO>>>
  refetchParentData: (newId?: string) => void
}

function SaveAsInputSet({
  pipeline,
  currentPipeline,
  template,
  orgIdentifier,
  projectIdentifier,
  accountId,
  values,
  canEdit,
  connectorRef,
  repoIdentifier,
  branch,
  storeType,
  isGitSyncEnabled = false,
  supportingGitSimplification = false,
  setFormErrors,
  refetchParentData
}: SaveAsInputSetProps): JSX.Element | null {
  const { getString } = useStrings()

  const { showError, showSuccess } = useToaster()
  const [savedInputSetObj, setSavedInputSetObj] = React.useState<InputSetDTO>({})
  const [initialGitDetails, setInitialGitDetails] = React.useState<EntityGitDetails>({ repoIdentifier, branch })
  const [initialStoreMetadata, setInitialStoreMetadata] = React.useState<StoreMetadata>({
    repoName: repoIdentifier,
    branch,
    connectorRef,
    storeType
  })

  const { mutate: createInputSet, loading: createInputSetLoading } = useCreateInputSetForPipeline({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      pipelineIdentifier: defaultTo(pipeline?.identifier, ''),
      projectIdentifier,
      pipelineRepoID: repoIdentifier,
      pipelineBranch: branch
    },
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })

  const { createUpdateInputSet, createUpdateInputSetWithGitDetails } = useCreateUpdateInputSet(
    pipeline,
    repoIdentifier,
    branch,
    createInputSet,
    refetchParentData,
    setFormErrors
  )

  const { openSaveToGitDialog } = useSaveToGitDialog({
    onSuccess: (
      data: SaveToGitFormInterface,
      _payload?: Omit<InputSetDTO, 'repo' | 'branch'>
    ): Promise<ResponseInputSetResponse> =>
      Promise.resolve(
        createUpdateInputSetWithGitDetails(
          defaultTo(_payload, savedInputSetObj),
          initialGitDetails,
          initialStoreMetadata,
          data
        ).then(res => {
          refetchParentData(res?.data?.identifier)
          return res
        })
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
      setInitialGitDetails(gitDetails as EntityGitDetails)
      setInitialStoreMetadata(defaultTo(storeMetadata, {}))

      if (inputSetObj) {
        if (isGitSyncEnabled || storeMetadata?.storeType === StoreType.REMOTE) {
          openSaveToGitDialog({
            isEditing: false,
            disableCreatingNewBranch: true,
            resource: {
              type: 'InputSets',
              name: inputSetObj.name as string,
              identifier: inputSetObj.identifier as string,
              gitDetails: gitDetails,
              storeMetadata: storeMetadata?.storeType === StoreType.REMOTE ? storeMetadata : undefined
            },
            payload: inputSetObj
          })
        } else {
          createUpdateInputSet(inputSetObj).then(data => {
            refetchParentData(data?.data?.identifier)
          })
        }
      }
    },
    [createInputSet, showSuccess, showError, isGitSyncEnabled, pipeline]
  )
  if (pipeline && currentPipeline && template) {
    return (
      <Popover
        disabled={!canEdit}
        lazy
        content={
          <div data-testid="save-as-inputset-form">
            <Formik<InputSetDTO & GitContextProps & StoreMetadata>
              formName="runPipelineForm"
              onSubmit={input => {
                handleSubmit(
                  input,
                  { repoIdentifier: input.repo, branch: input.branch, repoName: input.repo },
                  {
                    connectorRef: input.connectorRef,
                    repoName: input.repo,
                    branch: input.branch,
                    filePath: input.filePath,
                    storeType: input.storeType
                  }
                )
              }}
              validationSchema={Yup.object().shape({
                name: NameSchema({ requiredErrorMsg: getString('common.validation.nameIsRequired') }),
                identifier: IdentifierSchema()
              })}
              initialValues={
                {
                  pipeline: values,
                  name: '',
                  identifier: '',
                  repo: defaultTo(repoIdentifier, ''),
                  branch: defaultTo(branch, ''),
                  connectorRef: defaultTo(connectorRef, ''),
                  repoName: defaultTo(repoIdentifier, ''),
                  storeType: defaultTo(storeType, StoreType.INLINE),
                  filePath: '.harness/'
                } as InputSetDTO & GitContextProps
              }
            >
              {createInputSetFormikProps => {
                const { submitForm: submitFormIs } = createInputSetFormikProps
                return (
                  <Layout.Vertical padding="large" width={400}>
                    <NameIdDescriptionTags
                      identifierProps={{
                        inputLabel: getString('name'),
                        isIdentifierEditable: true,
                        inputGroupProps: {
                          disabled: !canEdit
                        }
                      }}
                      descriptionProps={{ disabled: !canEdit }}
                      tagsProps={{
                        disabled: !canEdit
                      }}
                      formikProps={createInputSetFormikProps}
                    />
                    {isGitSyncEnabled && (
                      <GitSyncStoreProvider>
                        <GitContextForm
                          formikProps={createInputSetFormikProps}
                          gitDetails={{ repoIdentifier, branch, getDefaultFromOtherRepo: false }}
                        />
                      </GitSyncStoreProvider>
                    )}

                    {supportingGitSimplification && storeType === StoreType.REMOTE && (
                      <Container>
                        <GitSyncForm
                          formikProps={createInputSetFormikProps as any}
                          isEdit={false}
                          disableFields={{
                            connectorRef: true,
                            repoName: true,
                            branch: true,
                            filePath: false
                          }}
                        ></GitSyncForm>
                      </Container>
                    )}

                    <Layout.Horizontal spacing="medium">
                      <Button
                        variation={ButtonVariation.PRIMARY}
                        text={createInputSetLoading ? getString('loading') : getString('save')}
                        type="submit"
                        disabled={createInputSetLoading}
                        onClick={event => {
                          event.stopPropagation()
                          submitFormIs()
                        }}
                      />
                      <Button
                        variation={ButtonVariation.SECONDARY}
                        className={Classes.POPOVER_DISMISS}
                        text={getString('cancel')}
                      />
                    </Layout.Horizontal>
                  </Layout.Vertical>
                )
              }}
            </Formik>
          </div>
        }
      >
        <RbacButton
          variation={ButtonVariation.SECONDARY}
          text={getString('inputSets.saveAsInputSet')}
          permission={{
            permission: PermissionIdentifier.EDIT_PIPELINE,
            resource: {
              resourceType: ResourceType.PIPELINE
            }
          }}
        />
      </Popover>
    )
  }
  return null
}

export default SaveAsInputSet
