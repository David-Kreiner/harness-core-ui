/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Classes, Dialog, IDialogProps, Intent } from '@blueprintjs/core'
import cx from 'classnames'
import {
  Button,
  ButtonSize,
  ButtonVariation,
  Container,
  Icon,
  Layout,
  PageSpinner,
  SelectOption,
  Text,
  useConfirmationDialog,
  useToaster,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { matchPath, useHistory, useParams } from 'react-router-dom'
import { defaultTo, isEmpty, isEqual, merge, omit } from 'lodash-es'
import produce from 'immer'
import { parse, stringify } from '@common/utils/YamlHelperMethods'
import type { CacheResponseMetadata, Error, PipelineInfoConfig } from 'services/pipeline-ng'
import { EntityGitDetails, InputSetSummaryResponse, useGetInputsetYaml } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'
import { AppStoreContext, useAppStore } from 'framework/AppStore/AppStoreContext'
import { NavigationCheck } from '@common/components/NavigationCheck/NavigationCheck'
import { accountPathProps, pipelineModuleParams, pipelinePathProps } from '@common/utils/routeUtils'
import type {
  GitQueryParams,
  PathFn,
  PipelinePathProps,
  PipelineStudioQueryParams,
  PipelineType,
  ProjectPathProps,
  RunPipelineQueryParams
} from '@common/interfaces/RouteInterfaces'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { usePermission } from '@rbac/hooks/usePermission'
import routes from '@common/RouteDefinitions'
import { useQueryParams, useUpdateQueryParams } from '@common/hooks'
import type { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import { TagsPopover } from '@common/components'
import type { IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { PipelineVariablesContextProvider } from '@pipeline/components/PipelineVariablesContext/PipelineVariablesContext'
import GenericErrorHandler from '@common/pages/GenericErrorHandler/GenericErrorHandler'
import NoEntityFound, { handleFetchFailure } from '@pipeline/pages/utils/NoEntityFound/NoEntityFound'
import { getFeaturePropsForRunPipelineButton } from '@pipeline/utils/runPipelineUtils'
import { RunPipelineForm } from '@pipeline/components/RunPipelineModal/RunPipelineForm'
import { createTemplate } from '@pipeline/utils/templateUtils'
import StageBuilder from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilder'
import { TemplatePipelineBuilder } from '@pipeline/components/PipelineStudio/PipelineTemplateBuilder/TemplatePipelineBuilder/TemplatePipelineBuilder'
import {
  SavePipelineHandle,
  SavePipelinePopoverWithRef
} from '@pipeline/components/PipelineStudio/SavePipelinePopover/SavePipelinePopover'
import { useSaveTemplateListener } from '@pipeline/components/PipelineStudio/hooks/useSaveTemplateListener'
import { StoreMetadata, StoreType } from '@common/constants/GitSyncTypes'
import GitRemoteDetails from '@common/components/GitRemoteDetails/GitRemoteDetails'
import { useTemplateSelector } from 'framework/Templates/TemplateSelectorContext/useTemplateSelector'
import type { Pipeline } from '@pipeline/utils/types'
import useDiffDialog from '@common/hooks/useDiffDialog'
import { PipelineOutOfSyncErrorStrip } from '@pipeline/components/TemplateLibraryErrorHandling/PipelineOutOfSyncErrorStrip/PipelineOutOfSyncErrorStrip'
import DescriptionPopover from '@common/components/DescriptionPopover.tsx/DescriptionPopover'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { usePipelineContext } from '../PipelineContext/PipelineContext'
import CreatePipelines from '../CreateModal/PipelineCreate'
import { DefaultNewPipelineId, DrawerTypes } from '../PipelineContext/PipelineActions'
import PipelineYamlView from '../PipelineYamlView/PipelineYamlView'
import { RightBar } from '../RightBar/RightBar'
import StudioGitPopover from '../StudioGitPopover'
import usePipelineErrors from './PipelineErrors/usePipelineErrors'
import { getDuplicateStepIdentifierList } from './PipelineCanvasUtils'
import PipelineCachedCopy from './PipelineCachedCopy/PipelineCachedCopy'
import css from './PipelineCanvas.module.scss'

interface OtherModalProps {
  onSubmit?: (values: PipelineInfoConfig) => void
  initialValues?: PipelineInfoConfig
  onClose?: () => void
}

interface PipelineWithGitContextFormProps extends PipelineInfoConfig {
  repo?: string
  branch?: string
  connectorRef?: string
  filePath?: string
  storeType?: string
}

interface InputSetValue extends SelectOption {
  type: InputSetSummaryResponse['inputSetType']
  gitDetails?: EntityGitDetails
}

const runModalProps: IDialogProps = {
  isOpen: true,
  // usePortal: true,
  autoFocus: true,
  canEscapeKeyClose: true,
  canOutsideClickClose: false,
  enforceFocus: false,
  className: css.runPipelineDialog,
  style: { width: 872, height: 'fit-content', overflow: 'auto' },
  isCloseButtonShown: false
}

export interface PipelineCanvasProps {
  // diagram?: DiagramFactory
  toPipelineStudio: PathFn<PipelineType<PipelinePathProps> & PipelineStudioQueryParams>
  toPipelineDetail: PathFn<PipelineType<PipelinePathProps>>
  toPipelineList: PathFn<PipelineType<ProjectPathProps>>
  toPipelineProject: PathFn<PipelineType<ProjectPathProps>>
  getOtherModal?: (
    onSubmit: (values: PipelineInfoConfig, storeMetadata?: StoreMetadata, gitDetails?: EntityGitDetails) => void,
    onClose: () => void
  ) => React.ReactElement<OtherModalProps>
}

export function PipelineCanvas({
  // diagram,
  toPipelineList,
  toPipelineStudio,
  getOtherModal
}: PipelineCanvasProps): JSX.Element {
  const { isGitSyncEnabled: isGitSyncEnabledForProject, gitSyncEnabledOnlyForFF } = React.useContext(AppStoreContext)
  const isGitSyncEnabled = isGitSyncEnabledForProject && !gitSyncEnabledOnlyForFF
  const {
    state,
    updatePipeline,
    updatePipelineStoreMetadata,
    updateGitDetails,
    deletePipelineCache,
    fetchPipeline,
    view,
    setView,
    isReadonly,
    updatePipelineView,
    setSelectedStageId,
    setSelectedSectionId
  } = usePipelineContext()
  const { getTemplate } = useTemplateSelector()
  const {
    repoIdentifier,
    branch,
    runPipeline,
    executionId,
    inputSetType,
    inputSetValue,
    inputSetLabel,
    inputSetRepoIdentifier,
    inputSetBranch,
    stagesExecuted,
    repoName,
    connectorRef,
    storeType
  } = useQueryParams<GitQueryParams & RunPipelineQueryParams>()
  const { updateQueryParams, replaceQueryParams } = useUpdateQueryParams<PipelineStudioQueryParams>()
  const {
    pipeline,
    isUpdated,
    modules,
    pipelineView: { isYamlEditable },
    pipelineView,
    isLoading,
    isInitialized,
    originalPipeline,
    yamlHandler,
    isBEPipelineUpdated,
    gitDetails,
    remoteFetchError,
    storeMetadata,
    entityValidityDetails,
    templateError,
    yamlSchemaErrorWrapper,
    cacheResponse: pipelineCacheResponse
  } = state

  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier, pipelineIdentifier, module } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      pipelineIdentifier: string
      accountId: string
    }> &
      GitQueryParams
  >()
  const history = useHistory()
  const isPipelineGitCacheEnabled = useFeatureFlag(FeatureFlag.PIE_NG_GITX_CACHING)

  // For remote pipeline queryParam will always as branch as selected branch except coming from list view
  // While opeining studio from list view, selected branch can be any branch as in pipeline response
  // We also have to discard Transition url which was without branch

  React.useEffect(() => {
    if (
      originalPipeline?.identifier !== DefaultNewPipelineId &&
      storeType === StoreType.REMOTE &&
      !branch &&
      gitDetails?.branch
    ) {
      history.replace(toPipelineList({ orgIdentifier, projectIdentifier, accountId, module }))
      updateQueryParams({ branch: gitDetails?.branch })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, gitDetails?.branch, module, originalPipeline?.identifier, projectIdentifier])

  const { showError, clear } = useToaster()

  useDocumentTitle([parse(pipeline?.name || getString('pipelines'))])
  const [discardBEUpdateDialog, setDiscardBEUpdate] = React.useState(false)
  const { openDialog: openConfirmBEUpdateError } = useConfirmationDialog({
    cancelButtonText: getString('cancel'),
    contentText: getString('pipelines-studio.pipelineUpdatedError'),
    titleText: getString('pipelines-studio.pipelineUpdated'),
    confirmButtonText: getString('update'),
    intent: Intent.WARNING,
    onCloseDialog: isConfirmed => {
      if (isConfirmed) {
        fetchPipeline({ forceFetch: true, forceUpdate: true })
      } else {
        setDiscardBEUpdate(true)
      }
    }
  })

  const { supportingGitSimplification } = useAppStore()
  const { openPipelineErrorsModal } = usePipelineErrors()
  const isYaml = view === SelectedView.YAML
  const [isYamlError, setYamlError] = React.useState(false)
  const [loadFromCache, setLoadFromCache] = React.useState(true)
  const [blockNavigation, setBlockNavigation] = React.useState(false)
  const [selectedBranch, setSelectedBranch] = React.useState(defaultTo(branch, ''))
  const [disableVisualView, setDisableVisualView] = React.useState(entityValidityDetails?.valid === false)
  const [useTemplate, setUseTemplate] = React.useState<boolean>(false)
  const [modalMode, setModalMode] = React.useState<'edit' | 'create'>('create')

  const isPipelineRemote = supportingGitSimplification && storeType === StoreType.REMOTE
  const savePipelineHandleRef = React.useRef<SavePipelineHandle | null>(null)

  React.useEffect(() => {
    if (isGitSyncEnabled || isPipelineRemote) {
      openPipelineErrorsModal(yamlSchemaErrorWrapper?.schemaErrors)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yamlSchemaErrorWrapper, isGitSyncEnabled, isPipelineRemote])

  const [canExecute] = usePermission(
    {
      resourceScope: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipeline?.identifier as string
      },
      permissions: [PermissionIdentifier.EXECUTE_PIPELINE]
    },
    [orgIdentifier, projectIdentifier, accountId, pipeline?.identifier]
  )

  const permissionText = canExecute
    ? getString('common.viewAndExecutePermissions')
    : getString('common.readonlyPermissions')

  const customButtonContainer = (
    <Container className={css.customButtons}>
      <Button
        text={getString('pipeline.discard')}
        variation={ButtonVariation.SECONDARY}
        size={ButtonSize.MEDIUM}
        onClick={() => {
          updatePipelineView({ ...pipelineView, isYamlEditable: false })
          fetchPipeline({ forceFetch: true, forceUpdate: true })
          closeUnsavedChangesDialog()
        }}
      />
      <Button
        text={getString('cancel')}
        variation={ButtonVariation.TERTIARY}
        size={ButtonSize.MEDIUM}
        onClick={() => closeUnsavedChangesDialog()}
      />
    </Container>
  )

  const { openDialog: openUnsavedChangesDialog, closeDialog: closeUnsavedChangesDialog } = useConfirmationDialog({
    className: css.paddingTop8,
    customButtons: customButtonContainer,
    contentText: isYamlError ? getString('navigationYamlError') : getString('navigationCheckText'),
    titleText: isYamlError ? getString('navigationYamlErrorTitle') : getString('navigationCheckTitle'),
    confirmButtonText: getString('confirm'),
    intent: Intent.WARNING,
    showCloseButton: false,
    onCloseDialog: async isConfirmed => {
      if (isConfirmed) {
        deletePipelineCache(gitDetails).then(() => {
          history.push(
            routes.toPipelineStudio({
              projectIdentifier,
              orgIdentifier,
              pipelineIdentifier: defaultTo(pipeline?.identifier, '-1'),
              accountId,
              module,
              branch: selectedBranch,
              repoIdentifier,
              repoName,
              connectorRef,
              storeType
            })
          )
          location.reload()
        })
      } else {
        setSelectedBranch(branch || '')
      }
      setBlockNavigation(false)
    }
  })

  const isValidYaml = function (): boolean {
    if (yamlHandler) {
      try {
        const parsedYaml = parse<Pipeline>(yamlHandler.getLatestYaml())
        if (!parsedYaml) {
          clear()
          showError(getString('invalidYamlText'))
          return false
        }
        if (yamlHandler.getYAMLValidationErrorMap()?.size > 0) {
          clear()
          setYamlError(true)
          showError(getString('invalidYamlText'))
          return false
        }
        updatePipeline(parsedYaml.pipeline)
      } catch (e) {
        clear()
        setYamlError(true)
        showError(defaultTo(e.message, getString('invalidYamlText')))
        return false
      }
    }
    return true
  }

  useSaveTemplateListener()

  const getDialogWidth = (): string => {
    if (supportingGitSimplification) {
      return '800px'
    } else {
      return isGitSyncEnabled ? '614px' : 'auto'
    }
  }

  const [showModal, hideModal] = useModalHook(() => {
    if (getOtherModal) {
      pipeline.identifier = ''
      updatePipeline(pipeline)
      return (
        <PipelineVariablesContextProvider pipeline={pipeline} storeMetadata={storeMetadata}>
          {getOtherModal(onSubmit, onCloseCreate)}
        </PipelineVariablesContextProvider>
      )
    } else {
      return (
        <PipelineVariablesContextProvider pipeline={pipeline} storeMetadata={storeMetadata}>
          <Dialog
            style={{
              width: getDialogWidth(),
              background: 'var(--form-bg)',
              paddingTop: '36px'
            }}
            enforceFocus={false}
            isOpen={true}
            className={'padded-dialog'}
            onClose={onCloseCreate}
            title={modalMode === 'create' ? getString('moduleRenderer.newPipeLine') : getString('editPipeline')}
          >
            <CreatePipelines
              afterSave={onSubmit}
              initialValues={merge(pipeline, {
                repo: repoName || gitDetails.repoIdentifier || '',
                branch: branch || gitDetails.branch || '',
                connectorRef: defaultTo(connectorRef, ''),
                storeType: defaultTo(storeType, StoreType.INLINE),
                filePath: gitDetails.filePath
              })}
              closeModal={onCloseCreate}
              gitDetails={{ ...gitDetails, remoteFetchFailed: Boolean(remoteFetchError) } as IGitContextFormProps}
              primaryButtonText={modalMode === 'create' ? getString('start') : getString('continue')}
            />
          </Dialog>
        </PipelineVariablesContextProvider>
      )
    }
  }, [
    supportingGitSimplification,
    isGitSyncEnabled,
    pipeline,
    pipelineIdentifier,
    repoName,
    gitDetails,
    branch,
    connectorRef,
    modalMode
  ])

  React.useEffect(() => {
    // for new pipeline always use UI as default view
    if (pipelineIdentifier === DefaultNewPipelineId) {
      setView(SelectedView.VISUAL)
    } else if (entityValidityDetails?.valid === false || view === SelectedView.YAML) {
      setView(SelectedView.YAML)
    } else {
      setView(SelectedView.VISUAL)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineIdentifier, entityValidityDetails?.valid])

  React.useEffect(() => {
    if (entityValidityDetails?.valid === false) {
      setDisableVisualView(true)
    } else {
      setDisableVisualView(false)
    }
  }, [entityValidityDetails?.valid])

  React.useEffect(() => {
    if (isInitialized) {
      if (pipeline?.identifier === DefaultNewPipelineId) {
        setModalMode('create')
        showModal()
      }
      if (isBEPipelineUpdated && !discardBEUpdateDialog) {
        openConfirmBEUpdateError()
      }
      if (blockNavigation && isUpdated) {
        openUnsavedChangesDialog()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    pipeline?.identifier,
    showModal,
    isInitialized,
    isBEPipelineUpdated,
    discardBEUpdateDialog,
    blockNavigation
  ])

  React.useEffect(() => {
    if (pipeline?.name) {
      window.dispatchEvent(new CustomEvent('RENAME_PIPELINE', { detail: pipeline?.name }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline?.name])

  const onCloseCreate = React.useCallback(() => {
    delete (pipeline as PipelineWithGitContextFormProps).repo
    delete (pipeline as PipelineWithGitContextFormProps).branch
    delete (pipeline as PipelineWithGitContextFormProps).connectorRef
    delete (pipeline as PipelineWithGitContextFormProps).filePath
    delete (pipeline as PipelineWithGitContextFormProps).storeType
    if (pipelineIdentifier === DefaultNewPipelineId || getOtherModal) {
      deletePipelineCache(gitDetails)
      history.push(toPipelineList({ orgIdentifier, projectIdentifier, accountId, module }))
    }
    hideModal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accountId,
    hideModal,
    history,
    module,
    orgIdentifier,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    pipeline?.identifier,
    projectIdentifier,
    toPipelineList,
    getOtherModal,
    gitDetails,
    deletePipelineCache
  ])

  const onSubmit = React.useCallback(
    (
      values: PipelineInfoConfig,
      currStoreMetadata?: StoreMetadata,
      updatedGitDetails?: EntityGitDetails,
      shouldUseTemplate = false
    ) => {
      pipeline.name = values.name
      pipeline.description = values.description
      pipeline.identifier = values.identifier
      pipeline.tags = values.tags ?? {}
      delete (pipeline as PipelineWithGitContextFormProps).repo
      delete (pipeline as PipelineWithGitContextFormProps).branch
      delete (pipeline as PipelineWithGitContextFormProps).connectorRef
      delete (pipeline as PipelineWithGitContextFormProps).filePath
      delete (pipeline as PipelineWithGitContextFormProps).storeType
      updatePipeline(pipeline)
      if (currStoreMetadata?.storeType) {
        updatePipelineStoreMetadata(currStoreMetadata, gitDetails)
      }

      if (updatedGitDetails) {
        if (gitDetails?.objectId || gitDetails?.commitId) {
          updatedGitDetails = { ...gitDetails, ...updatedGitDetails }
        }
        updateGitDetails(updatedGitDetails).then(() => {
          if (updatedGitDetails) {
            if (isGitSyncEnabled) {
              updateQueryParams(
                { repoIdentifier: updatedGitDetails.repoIdentifier, branch: updatedGitDetails.branch },
                { skipNulls: true }
              )
            } else if (supportingGitSimplification && currStoreMetadata?.storeType === StoreType.REMOTE) {
              updateQueryParams(
                {
                  connectorRef: currStoreMetadata.connectorRef,
                  repoName: updatedGitDetails?.repoName,
                  branch: updatedGitDetails.branch,
                  storeType: currStoreMetadata.storeType as StoreType
                },
                { skipNulls: true }
              )
            }
          }
        })
      }
      setUseTemplate(shouldUseTemplate)
      hideModal()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hideModal, pipeline, updatePipeline]
  )

  const getPipelineTemplate = async (): Promise<void> => {
    const { template: newTemplate, isCopied } = await getTemplate({
      templateType: 'Pipeline',
      gitDetails,
      storeMetadata
    })
    const processNode = isCopied
      ? produce(
          defaultTo(parse<any>(defaultTo(newTemplate?.yaml, ''))?.template.spec, {}) as PipelineInfoConfig,
          draft => {
            draft.name = defaultTo(pipeline?.name, '')
            draft.identifier = defaultTo(pipeline?.identifier, '')
          }
        )
      : createTemplate(pipeline, newTemplate)
    processNode.description = pipeline.description
    processNode.tags = pipeline.tags
    processNode.projectIdentifier = pipeline.projectIdentifier
    processNode.orgIdentifier = pipeline.orgIdentifier
    await updatePipeline(processNode)
  }

  React.useEffect(() => {
    if (
      useTemplate &&
      (!isGitSyncEnabled || !isEmpty(gitDetails)) &&
      (!supportingGitSimplification || !isEmpty(storeMetadata))
    ) {
      getPipelineTemplate()
        .catch(_ => {
          // Do nothing.. user cancelled template selection
        })
        .finally(() => {
          setUseTemplate(false)
        })
    }
  }, [useTemplate, gitDetails, isGitSyncEnabled, storeMetadata, supportingGitSimplification])

  function handleViewChange(newView: SelectedView): boolean {
    if (newView === view) return false
    if (newView === SelectedView.VISUAL) {
      const duplicateStepIdentifiersList = pipeline?.stages ? getDuplicateStepIdentifierList(pipeline?.stages) : []
      if (duplicateStepIdentifiersList.length) {
        clear()
        showError(
          getString('pipeline.duplicateStepIdentifiers', {
            duplicateIdString: duplicateStepIdentifiersList.join(', ')
          }),
          5000
        )
        return false
      }
      if (yamlHandler && isYamlEditable) {
        if (!isValidYaml()) return false
      }
    }
    setView(newView)
    updatePipelineView({
      splitViewData: {},
      isDrawerOpened: false,
      isYamlEditable: false,
      isSplitViewOpen: false,
      drawerData: { type: DrawerTypes.AddStep }
    })
    setSelectedStageId(undefined)
    setSelectedSectionId(undefined)
    return true
  }

  const [inputSetYaml, setInputSetYaml] = React.useState('')

  const { data, refetch, loading } = useGetInputsetYaml({
    planExecutionId: executionId ?? '',
    queryParams: {
      orgIdentifier,
      projectIdentifier,
      accountIdentifier: accountId
    },
    lazy: true,
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })

  const getInputSetSelected = (): InputSetValue[] => {
    if (inputSetType) {
      const inputSetSelected: InputSetValue[] = [
        {
          type: inputSetType as InputSetSummaryResponse['inputSetType'],
          value: inputSetValue ?? '',
          label: inputSetLabel ?? '',
          gitDetails: {
            repoIdentifier: inputSetRepoIdentifier,
            branch: inputSetBranch
          }
        }
      ]
      return inputSetSelected
    }
    return []
  }

  React.useEffect(() => {
    if (data) {
      ;(data as unknown as Response).text().then(str => {
        setInputSetYaml(str)
      })
    }
  }, [data])

  React.useEffect(() => {
    if (executionId && executionId !== null) {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionId])

  function onCloseRunPipelineModal(): void {
    closeRunPipelineModal()
    setInputSetYaml('')
    replaceQueryParams({ repoIdentifier, branch, connectorRef, storeType, repoName }, { skipNulls: true }, true)
  }

  const allowOpeningRunPipelineModal: boolean = React.useMemo(() => {
    /**
     * This is done because Run Pipeline modal was opening twice for Remote Pipelines.
     * For remote pipeline when we land on Pipeline Studio from Deployments page, there is no branch initially,
     * because pipeline in list view does not have branch, so there is no branch in url initially and then we update branch in the url.
     * Because of all this, useModalHook for opening Run Pipeline modal runs twice and modal visibly opens twice.
     * To Prevent the issue, added a check which waits for branch name to appear in url when pipeline is of Remote type,
     */
    let shouldOpenRunPipelineModal = false
    if (!isPipelineRemote) {
      shouldOpenRunPipelineModal = true
    } else if (isPipelineRemote && !isEmpty(branch)) {
      shouldOpenRunPipelineModal = true
    }
    return shouldOpenRunPipelineModal
  }, [branch, isPipelineRemote])

  React.useEffect(() => {
    if (runPipeline && allowOpeningRunPipelineModal) {
      openRunPipelineModal()
    }
  }, [runPipeline, allowOpeningRunPipelineModal])

  React.useEffect(() => {
    isPipelineRemote &&
      gitDetails.repoName &&
      gitDetails.branch &&
      updatePipelineStoreMetadata({ connectorRef, storeType }, gitDetails)
  }, [isPipelineRemote, gitDetails, connectorRef, storeType])

  const [openRunPipelineModal, closeRunPipelineModal] = useModalHook(
    () =>
      loading ? (
        <PageSpinner />
      ) : (
        <Dialog {...runModalProps}>
          <Layout.Vertical className={css.modalCard}>
            <RunPipelineForm
              pipelineIdentifier={pipelineIdentifier}
              orgIdentifier={orgIdentifier}
              projectIdentifier={projectIdentifier}
              accountId={accountId}
              module={module}
              inputSetYAML={defaultTo(inputSetYaml, '')}
              inputSetSelected={getInputSetSelected()}
              connectorRef={connectorRef}
              repoIdentifier={isPipelineRemote ? repoName : repoIdentifier}
              branch={branch}
              source="executions"
              onClose={() => {
                onCloseRunPipelineModal()
              }}
              stagesExecuted={stagesExecuted}
              storeType={storeType}
              storeMetadata={storeMetadata}
            />
            <Button
              aria-label="close modal"
              icon="cross"
              variation={ButtonVariation.ICON}
              onClick={() => {
                onCloseRunPipelineModal()
              }}
              className={css.crossIcon}
            />
          </Layout.Vertical>
        </Dialog>
      ),
    [
      loading,
      inputSetYaml,
      inputSetRepoIdentifier,
      inputSetBranch,
      branch,
      repoIdentifier,
      inputSetType,
      inputSetValue,
      inputSetLabel,
      pipelineIdentifier
    ]
  )

  const updateEntity = React.useCallback(
    async (entityYaml: string) => {
      await savePipelineHandleRef.current?.updatePipeline(entityYaml)
    },
    [savePipelineHandleRef.current]
  )

  const onGitBranchChange = React.useMemo(
    () => (selectedFilter: GitFilterScope, defaultSelected?: boolean) => {
      setSelectedBranch(selectedFilter.branch as string)
      if (isUpdated && branch !== selectedFilter.branch) {
        setBlockNavigation(true)
      } else if (branch !== selectedFilter.branch) {
        deletePipelineCache({
          repoIdentifier: defaultTo(selectedFilter.repo, ''),
          branch: defaultTo(selectedFilter.branch, '')
        }).then(() => {
          history.push(
            routes.toPipelineStudio({
              projectIdentifier,
              orgIdentifier,
              pipelineIdentifier: defaultTo(pipelineIdentifier, '-1'),
              accountId,
              module,
              branch: selectedFilter.branch,
              repoIdentifier: selectedFilter.repo,
              ...(isPipelineRemote
                ? {
                    repoIdentifier: repoName,
                    repoName,
                    connectorRef,
                    storeType
                  }
                : {})
            })
          )
          if (!defaultSelected) {
            fetchPipeline({
              forceFetch: true,
              forceUpdate: true,
              repoIdentifier: selectedFilter.repo,
              branch: selectedFilter.branch
            })
          }
        })
      }
    },
    [
      isUpdated,
      branch,
      deletePipelineCache,
      history,
      projectIdentifier,
      orgIdentifier,
      pipelineIdentifier,
      accountId,
      module,
      isPipelineRemote,
      repoName,
      connectorRef,
      storeType
    ]
  )

  const { open: openDiffModal } = useDiffDialog({
    originalYaml: stringify(originalPipeline),
    updatedYaml: stringify(pipeline),
    title: getString('pipeline.piplineDiffTitle')
  })

  if (isLoading) {
    return (
      <React.Fragment>
        <PageSpinner />
        <div /> {/* this empty div is required for rendering layout correctly */}
      </React.Fragment>
    )
  }

  if (templateError?.data && !isGitSyncEnabled && !isPipelineRemote) {
    return (
      <GenericErrorHandler
        errStatusCode={templateError?.status}
        errorMessage={(templateError?.data as Error)?.message}
      />
    )
  }

  if (templateError?.data && isEmpty(pipeline) && (isGitSyncEnabled || isPipelineRemote)) {
    return <NoEntityFound identifier={pipelineIdentifier} entityType={'pipeline'} />
  }

  return (
    <PipelineVariablesContextProvider pipeline={pipeline} storeMetadata={storeMetadata}>
      <div
        className={cx(Classes.POPOVER_DISMISS, css.content)}
        onClick={e => {
          e.stopPropagation()
        }}
      >
        <NavigationCheck
          when={getOtherModal && pipeline.identifier !== ''}
          onDiscardButtonClick={() => {
            updatePipelineView({ ...pipelineView, isYamlEditable: false })
            fetchPipeline({ forceFetch: true, forceUpdate: true })
          }}
          showDiscardBtn={true}
          shouldBlockNavigation={nextLocation => {
            let localUpdated = isUpdated
            const matchDefault = matchPath(nextLocation.pathname, {
              path: toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams }),
              exact: true
            })

            // This is special handler when user update yaml and immediately click on run
            if (isYaml && yamlHandler && isYamlEditable && !localUpdated) {
              try {
                const parsedYaml = parse<Pipeline>(yamlHandler.getLatestYaml())
                if (!parsedYaml) {
                  clear()
                  showError(getString('invalidYamlText'), undefined, 'pipeline.parse.yaml.error')
                  return true
                }
                if (yamlHandler.getYAMLValidationErrorMap()?.size > 0) {
                  setYamlError(true)
                  return true
                }
                localUpdated = !isEqual(omit(originalPipeline, 'repo', 'branch'), parsedYaml.pipeline)
                updatePipeline(parsedYaml.pipeline)
              } catch (e) {
                setYamlError(true)
                return true
              }
            }
            setYamlError(false)
            const shouldBlockNavigation =
              !matchDefault?.isExact &&
              localUpdated &&
              !isReadonly &&
              !(pipelineIdentifier === DefaultNewPipelineId && isEmpty(pipeline?.name)) &&
              !(useTemplate && isEmpty(pipeline?.template))
            if (!shouldBlockNavigation) {
              !matchDefault?.isExact && deletePipelineCache(gitDetails)
            }
            return shouldBlockNavigation
          }}
          textProps={{
            contentText: isYamlError ? getString('navigationYamlError') : getString('navigationCheckText'),
            titleText: isYamlError ? getString('navigationYamlErrorTitle') : getString('navigationCheckTitle')
          }}
          navigate={newPath => {
            const isPipeline = matchPath(newPath, {
              path: toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams }),
              exact: true
            })
            !isPipeline?.isExact && deletePipelineCache(gitDetails)
            history.push(newPath)
          }}
        />
        <Layout.Vertical height={'100%'}>
          {(remoteFetchError as Error)?.code === 'ENTITY_NOT_FOUND' ? null : (
            <div className={css.titleBar}>
              <div className={css.titleSubheader}>
                <div
                  className={cx(css.breadcrumbsMenu, {
                    [css.remotePipelineName]: isPipelineRemote
                  })}
                >
                  <div className={css.pipelineMetadataContainer}>
                    <Layout.Horizontal className={css.pipelineNameContainer}>
                      <Icon className={css.pipelineIcon} padding={{ right: 'small' }} name="pipeline" size={32} />
                      <Text className={css.pipelineName} lineClamp={1}>
                        {pipeline?.name}
                      </Text>
                      {!isEmpty(pipeline?.tags) && pipeline.tags && (
                        <Container className={css.tagsContainer}>
                          <TagsPopover tags={pipeline.tags} />
                        </Container>
                      )}
                      {pipeline.description && (
                        <Container className={cx({ [css.tagsContainer]: isGitSyncEnabled })}>
                          <DescriptionPopover text={pipeline.description} />
                        </Container>
                      )}
                      {isGitSyncEnabled && (
                        <StudioGitPopover
                          gitDetails={gitDetails}
                          identifier={pipelineIdentifier}
                          isReadonly={isReadonly}
                          entityData={{ ...pipeline, versionLabel: '', type: 'Step' }} // Just to avoid type issues
                          onGitBranchChange={onGitBranchChange}
                          entityType={'Pipeline'}
                        />
                      )}
                      {isYaml || isReadonly ? null : (
                        <Button
                          variation={ButtonVariation.ICON}
                          icon="Edit"
                          onClick={() => {
                            setModalMode('edit')
                            showModal()
                          }}
                          aria-label={getString('editPipeline')}
                        />
                      )}
                    </Layout.Horizontal>
                  </div>
                </div>
                {isPipelineRemote && (
                  <div className={css.gitRemoteDetailsWrapper}>
                    <GitRemoteDetails
                      connectorRef={connectorRef}
                      repoName={repoName || gitDetails.repoName || gitDetails.repoIdentifier || ''}
                      filePath={defaultTo(gitDetails.filePath, '')}
                      fileUrl={defaultTo(gitDetails.fileUrl, '')}
                      branch={defaultTo(branch, '')}
                      onBranchChange={onGitBranchChange}
                      flags={{
                        readOnly: pipelineIdentifier === DefaultNewPipelineId
                      }}
                    />
                  </div>
                )}
              </div>
              {remoteFetchError ? null : (
                <>
                  <VisualYamlToggle
                    className={css.visualYamlToggle}
                    selectedView={isYaml || disableVisualView ? SelectedView.YAML : SelectedView.VISUAL}
                    disableToggle={disableVisualView}
                    onChange={nextMode => {
                      handleViewChange(nextMode)
                    }}
                    showDisableToggleReason={true}
                  />
                  <div>
                    <div className={css.savePublishContainer}>
                      {isPipelineGitCacheEnabled && !isEmpty(pipelineCacheResponse) && (
                        <PipelineCachedCopy
                          reloadContent={getString('common.pipeline')}
                          cacheResponse={pipelineCacheResponse as CacheResponseMetadata}
                          reloadFromCache={() => {
                            setLoadFromCache(false)
                            updatePipelineView({ ...pipelineView, isYamlEditable: false })
                            fetchPipeline({ forceFetch: true, forceUpdate: true, loadFromCache: false })
                          }}
                          fetchError={remoteFetchError}
                        />
                      )}
                      {isReadonly && (
                        <div className={css.readonlyAccessTag}>
                          <Icon name="eye-open" size={16} />
                          <div className={css.readonlyAccessText}>{permissionText}</div>
                        </div>
                      )}
                      {isUpdated && !isReadonly && (
                        <Button
                          variation={ButtonVariation.LINK}
                          intent="warning"
                          className={css.unsavedChanges}
                          onClick={openDiffModal}
                        >
                          {getString('unsavedChanges')}
                        </Button>
                      )}
                      <SavePipelinePopoverWithRef toPipelineStudio={toPipelineStudio} ref={savePipelineHandleRef} />
                      {pipelineIdentifier !== DefaultNewPipelineId && !isReadonly && (
                        <Button
                          disabled={!isUpdated}
                          onClick={() => {
                            updatePipelineView({ ...pipelineView, isYamlEditable: false })
                            fetchPipeline({ forceFetch: true, forceUpdate: true })
                          }}
                          className={css.discardBtn}
                          variation={ButtonVariation.SECONDARY}
                          text={getString('pipeline.discard')}
                        />
                      )}
                      <RbacButton
                        data-testid="card-run-pipeline"
                        variation={ButtonVariation.PRIMARY}
                        icon="run-pipeline"
                        intent="success"
                        disabled={isUpdated || entityValidityDetails?.valid === false}
                        className={css.runPipelineBtn}
                        text={getString('runPipelineText')}
                        tooltip={
                          entityValidityDetails?.valid === false
                            ? getString('pipeline.cannotRunInvalidPipeline')
                            : isUpdated
                            ? 'Please click Save and then run the pipeline.'
                            : ''
                        }
                        onClick={e => {
                          e.stopPropagation()
                          openRunPipelineModal()
                        }}
                        featuresProps={getFeaturePropsForRunPipelineButton({
                          modules,
                          getString
                        })}
                        permission={{
                          resourceScope: {
                            accountIdentifier: accountId,
                            orgIdentifier,
                            projectIdentifier
                          },
                          resource: {
                            resourceType: ResourceType.PIPELINE,
                            resourceIdentifier: pipeline?.identifier as string
                          },
                          permission: PermissionIdentifier.EXECUTE_PIPELINE
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <PipelineOutOfSyncErrorStrip
            updateRootEntity={updateEntity}
            loadFromcache={isPipelineGitCacheEnabled && loadFromCache}
          />
          {remoteFetchError ? (
            handleFetchFailure(
              'pipeline',
              pipelineIdentifier,
              !isGitSyncEnabled && storeType !== StoreType.REMOTE,
              remoteFetchError as unknown as Error
            )
          ) : (
            <Container className={css.builderContainer}>
              {isYaml ? <PipelineYamlView /> : pipeline.template ? <TemplatePipelineBuilder /> : <StageBuilder />}
            </Container>
          )}
        </Layout.Vertical>
      </div>
      <RightBar />
    </PipelineVariablesContextProvider>
  )
}
