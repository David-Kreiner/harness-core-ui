/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'

import {
  Layout,
  Button,
  ButtonSize,
  ButtonVariation,
  IconProps,
  StepWizard,
  StepProps,
  Text,
  Icon
} from '@harness/uicore'
import type { IDialogProps } from '@blueprintjs/core'
import { Dialog, Classes } from '@blueprintjs/core'
import { FontVariation, Color } from '@harness/design-system'

import cx from 'classnames'
import get from 'lodash/get'
import set from 'lodash-es/set'
import { noop, defaultTo, isEmpty, isArray } from 'lodash-es'
import produce from 'immer'
import { useModalHook } from '@harness/use-modal'
import type { ConfigFileWrapper, StageElementConfig, ServiceDefinition } from 'services/cd-ng'
import { useCache } from '@common/hooks/useCache'

import { useQueryParams } from '@common/hooks'
import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'

import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { Connectors, CONNECTOR_CREDENTIALS_STEP_IDENTIFIER } from '@connectors/constants'
import ConnectorDetailsStep from '@connectors/components/CreateConnector/commonSteps/ConnectorDetailsStep'
import GitDetailsStep from '@connectors/components/CreateConnector/commonSteps/GitDetailsStep'
import ConnectorTestConnection from '@connectors/common/ConnectorTestConnection/ConnectorTestConnection'
import StepGitAuthentication from '@connectors/components/CreateConnector/GitConnector/StepAuth/StepGitAuthentication'

import StepGithubAuthentication from '@connectors/components/CreateConnector/GithubConnector/StepAuth/StepGithubAuthentication'
import StepBitbucketAuthentication from '@connectors/components/CreateConnector/BitbucketConnector/StepAuth/StepBitbucketAuthentication'
import StepGitlabAuthentication from '@connectors/components/CreateConnector/GitlabConnector/StepAuth/StepGitlabAuthentication'

import DelegateSelectorStep from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelectorStep'

import { getBuildPayload } from '../../ManifestSelection/Manifesthelper'

import { ConfigFilesWizard } from '../ConfigFilesWizard/ConfigFilesWizard'
import type { ConfigFilesListViewProps, ConfigFileType, ConfigInitStepData } from '../ConfigFilesInterface'
import {
  allowedConfigFilesTypes,
  ConfigFileTypeTitle,
  ConfigFileIconByType,
  ConfigFilesToConnectorMap,
  FILE_TYPE_VALUES
} from '../ConfigFilesHelper'
import { HarnessConfigStep } from '../ConfigFilesWizard/ConfigFilesSteps/HarnessConfigStep'
import css from '../ConfigFilesSelection.module.scss'

function ConfigFilesListView({
  updateStage,
  stage,
  isPropagating,
  deploymentType,
  isReadonly,
  allowableTypes,
  selectedConfig,
  setSelectedConfig,
  selectedServiceResponse,
  isReadonlyServiceMode,
  serviceCacheId
}: ConfigFilesListViewProps): JSX.Element {
  const DIALOG_PROPS: IDialogProps = {
    isOpen: true,
    usePortal: true,
    autoFocus: true,
    canEscapeKeyClose: false,
    canOutsideClickClose: false,
    enforceFocus: false,
    style: { width: 1175, minHeight: 640, borderLeft: 0, paddingBottom: 0, position: 'relative', overflow: 'hidden' }
  }

  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const { getString } = useStrings()
  const [newConnectorView, setNewConnectorView] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [configStore, setConfigStore] = useState<ConfigFileType>('' as ConfigFileType)
  const [configFileIndex, setEditIndex] = useState(0)
  const [isNewFile, setIsNewFile] = useState(true)
  const { getCache } = useCache([serviceCacheId])
  const serviceInfo = getCache<ServiceDefinition>(serviceCacheId)

  const { expressions } = useVariablesExpression()

  const listOfConfigFiles = React.useMemo(() => {
    if (isReadonlyServiceMode && !isEmpty(serviceInfo)) {
      return defaultTo(serviceInfo?.spec.configFiles, [])
    }
    if (isPropagating) {
      return get(stage, 'stage.spec.serviceConfig.stageOverrides.configFiles', [])
    }

    return get(stage, 'stage.spec.serviceConfig.serviceDefinition.spec.configFiles', [])
  }, [isPropagating, isReadonly, selectedServiceResponse?.data?.service, stage])

  const commonProps = {
    name: getString('credentials'),
    onConnectorCreated: noop,
    isEditMode,
    setIsEditMode,
    accountId,
    orgIdentifier,
    projectIdentifier,
    connectorInfo: undefined,
    configFileIndex
  }

  const getInitialValues = (): ConfigInitStepData => {
    const initValues = get(listOfConfigFiles[configFileIndex], 'configFile.spec.store.spec', null)
    let files
    let fileType
    if (get(listOfConfigFiles[configFileIndex], 'configFile.spec.store.spec.secretFiles', []).length > 0) {
      files = get(listOfConfigFiles[configFileIndex], 'configFile.spec.store.spec.secretFiles', [''])
      fileType = FILE_TYPE_VALUES.ENCRYPTED
    } else {
      files = get(listOfConfigFiles[configFileIndex], 'configFile.spec.store.spec.files', [''])
      fileType = FILE_TYPE_VALUES.FILE_STORE
    }

    if (initValues && !isNewFile) {
      const values = {
        ...initValues,
        store: listOfConfigFiles[configFileIndex]?.configFile.spec?.store?.type,
        identifier: get(listOfConfigFiles[configFileIndex], 'configFile.identifier', ''),
        files: files || [''],
        secretFiles: get(listOfConfigFiles[configFileIndex], 'configFile.spec.store.spec.secretFiles', ['']),
        fileType
      }
      return values
    }
    return {
      store: configStore,
      files: [''],
      identifier: '',
      fileType: FILE_TYPE_VALUES.FILE_STORE
    }
  }

  const updateStageData = (): void => {
    const path = isPropagating
      ? 'stage.spec.serviceConfig.stageOverrides.configFiles'
      : 'stage.spec.serviceConfig.serviceDefinition.spec.configFiles'

    if (stage) {
      updateStage(
        produce(stage, draft => {
          set(draft, path, listOfConfigFiles)
        }).stage as StageElementConfig
      )
    }
  }

  const handleSubmit = (configFileObj: ConfigFileWrapper): void => {
    if (isPropagating) {
      if (listOfConfigFiles?.length > 0) {
        listOfConfigFiles.splice(configFileIndex, 1, configFileObj)
      } else {
        listOfConfigFiles.push(configFileObj)
      }
    } else {
      if (listOfConfigFiles?.length > 0 && isEditMode) {
        listOfConfigFiles.splice(configFileIndex, 1, configFileObj)
      } else {
        listOfConfigFiles.push(configFileObj)
      }
    }
    updateStageData()

    hideConnectorModal()
    setIsEditMode(false)
    setEditIndex(0)
    setConfigStore('' as ConfigFileType)
  }
  const commonLastStepProps = {
    handleSubmit,
    expressions
  }
  const getLastSteps = useCallback((): Array<React.ReactElement<StepProps<any>>> => {
    const arr: Array<React.ReactElement<StepProps<any>>> = []
    let configDetailStep = null

    switch (configStore) {
      case ConfigFilesToConnectorMap.Harness:
        configDetailStep = (
          <HarnessConfigStep
            {...commonProps}
            stepName={getString('pipeline.configFiles.title', { type: 'Details' })}
            name={getString('pipeline.configFiles.title', { type: 'Details' })}
            listOfConfigFiles={listOfConfigFiles}
            {...commonLastStepProps}
          />
        )
        break
      default:
        configDetailStep = (
          <HarnessConfigStep
            {...commonProps}
            stepName={getString('pipeline.configFiles.title', { type: 'Details' })}
            name={getString('pipeline.configFiles.title', { type: 'Details' })}
            listOfConfigFiles={listOfConfigFiles}
            {...commonLastStepProps}
          />
        )
        break
    }

    arr.push(configDetailStep)
    return arr
  }, [configStore, commonLastStepProps, getString])

  const getNewConnectorSteps = useCallback((): JSX.Element => {
    const buildPayload = getBuildPayload(ConfigFilesToConnectorMap[configStore])
    switch (configStore) {
      case ConfigFilesToConnectorMap.Harness:
        return (
          <HarnessConfigStep
            {...commonProps}
            expressions={expressions}
            stepName={getString('pipeline.configFiles.title')}
            name={getString('pipeline.configFiles.title')}
            handleSubmit={handleSubmit}
            listOfConfigFiles={listOfConfigFiles}
          />
        )
      case ConfigFilesToConnectorMap.Git:
        return (
          <StepWizard title={getString('connectors.createNewConnector')}>
            <ConnectorDetailsStep
              type={ConfigFilesToConnectorMap[configStore]}
              name={getString('overview')}
              isEditMode={isEditMode}
              gitDetails={{ repoIdentifier, branch, getDefaultFromOtherRepo: true }}
            />
            <GitDetailsStep
              type={ConfigFilesToConnectorMap[configStore]}
              name={getString('details')}
              isEditMode={isEditMode}
              connectorInfo={undefined}
            />
            {ConfigFilesToConnectorMap[configStore] === Connectors.GIT ? (
              <StepGitAuthentication {...commonProps} />
            ) : null}
            {ConfigFilesToConnectorMap[configStore] === Connectors.GITHUB ? (
              <StepGithubAuthentication {...commonProps} />
            ) : null}
            {ConfigFilesToConnectorMap[configStore] === Connectors.BITBUCKET ? (
              <StepBitbucketAuthentication {...commonProps} />
            ) : null}
            {ConfigFilesToConnectorMap[configStore] === Connectors.GITLAB ? (
              <StepGitlabAuthentication {...commonProps} identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER} />
            ) : null}
            <DelegateSelectorStep
              name={getString('delegate.DelegateselectionLabel')}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
              buildPayload={buildPayload}
              connectorInfo={undefined}
            />
            <ConnectorTestConnection
              name={getString('connectors.stepThreeName')}
              connectorInfo={undefined}
              isStep={true}
              isLastStep={false}
              type={ConfigFilesToConnectorMap[configStore]}
            />
          </StepWizard>
        )
      default:
        return <></>
    }
  }, [newConnectorView, configStore, isEditMode])

  const handleConnectorViewChange = (isConnectorView: boolean): void => {
    setNewConnectorView(isConnectorView)
    setIsEditMode(false)
  }

  const handleChangeStore = (store: ConfigFileType): void => {
    setConfigStore(store || '')
  }

  const getIconProps = (): IconProps => {
    const iconProps: IconProps = {
      name: ConfigFileIconByType[selectedConfig as ConfigFileType]
    }
    return iconProps
  }

  const editConfigFile = (configFileType: ConfigFileType, index: number): void => {
    setIsEditMode(true)
    setIsNewFile(false)
    setConfigStore(configFileType)
    setSelectedConfig(configFileType)
    setNewConnectorView(false)
    setEditIndex(index)
    showConnectorModal()
  }

  const removeConfigFileConfig = (index: number): void => {
    listOfConfigFiles.splice(index, 1)

    if (stage) {
      const newStage = produce(stage, draft => {
        set(draft, 'stage.spec.serviceConfig.serviceDefinition.spec.configFiles', listOfConfigFiles)
      }).stage

      if (newStage) {
        updateStage(newStage)
      }
    }
  }

  const [showConnectorModal, hideConnectorModal] = useModalHook(() => {
    const onClose = (): void => {
      setIsNewFile(false)
      setNewConnectorView(false)
      hideConnectorModal()
      setConfigStore('' as ConfigFileType)
      setIsEditMode(false)
      setSelectedConfig('' as ConfigFileType)
      setEditIndex(0)
    }

    return (
      <Dialog onClose={onClose} {...DIALOG_PROPS} className={cx(css.modal, Classes.DIALOG)}>
        <div className={css.createConnectorWizard}>
          <ConfigFilesWizard
            stores={allowedConfigFilesTypes[deploymentType]}
            newConnectorView={newConnectorView}
            expressions={expressions}
            allowableTypes={allowableTypes}
            handleConnectorViewChange={() => handleConnectorViewChange(true)}
            handleStoreChange={handleChangeStore}
            initialValues={getInitialValues()}
            newConnectorSteps={getNewConnectorSteps()}
            lastSteps={getLastSteps()}
            deploymentType={deploymentType}
            iconsProps={getIconProps()}
            isReadonly={isReadonly}
            isNewFile={isNewFile}
            configFileIndex={configFileIndex}
          />
        </div>
        <Button minimal icon="cross" onClick={onClose} className={css.crossIcon} />
      </Dialog>
    )
  }, [
    selectedConfig,
    newConnectorView,
    configFileIndex,
    configStore,
    expressions.length,
    expressions,
    allowableTypes,
    isEditMode,
    isNewFile
  ])

  const addNewConfigFile = (): void => {
    setIsNewFile(true)
    showConnectorModal()
  }

  return (
    <Layout.Vertical style={{ width: '100%' }}>
      <Layout.Vertical spacing={'medium'} flex={{ alignItems: 'flex-start' }} width="100%">
        {!!listOfConfigFiles?.length && (
          <div className={cx(css.configFilesList, css.listHeader)}>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('common.ID')}</Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('pipeline.configFiles.fileType')}</Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>
              {getString('pipelineSteps.serviceTab.manifestList.manifestStore')}
            </Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('location')}</Text>
            <span></span>
          </div>
        )}
        <Layout.Vertical style={{ flexShrink: 'initial' }} width="100%">
          <section>
            {listOfConfigFiles &&
              listOfConfigFiles.map((data: ConfigFileWrapper, index: number) => {
                const configFile = data['configFile']
                const filesType = configFile?.spec?.store?.spec?.files?.length
                  ? getString('pipeline.configFiles.plainText')
                  : getString('encrypted')
                const filesLocation = configFile?.spec?.store?.spec?.files?.length
                  ? configFile?.spec?.store?.spec?.files
                  : configFile?.spec?.store?.spec?.secretFiles
                return (
                  <div className={css.rowItem} key={`${configFile?.identifier}-${index}`}>
                    <section className={css.configFilesList}>
                      <div className={css.columnId}>
                        <Text color={Color.BLACK} lineClamp={1} inline>
                          {configFile?.identifier}
                        </Text>
                      </div>
                      <div>{filesType}</div>
                      <div className={css.columnStore}>
                        <Icon
                          inline
                          name={ConfigFileIconByType[configFile?.spec?.store?.type as ConfigFileType]}
                          size={20}
                        />
                        <Text
                          margin={{ left: 'xsmall' }}
                          inline
                          width={150}
                          className={css.type}
                          color={Color.BLACK}
                          lineClamp={1}
                        >
                          {getString(ConfigFileTypeTitle[configFile?.spec?.store?.type as ConfigFileType])}
                        </Text>
                      </div>
                      <div className={css.columnLocation}>
                        <Text
                          color={Color.BLACK}
                          lineClamp={1}
                          inline
                          tooltip={
                            isArray(filesLocation)
                              ? filesLocation.map((field: string, i: number) => {
                                  return (
                                    <Text padding="small" key={i}>
                                      {field}
                                    </Text>
                                  )
                                })
                              : filesLocation
                          }
                        >
                          {filesLocation}
                        </Text>
                      </div>
                      {!isReadonly && (
                        <span>
                          <Layout.Horizontal>
                            <Button
                              icon="Edit"
                              iconProps={{ size: 18 }}
                              onClick={() => editConfigFile(configFile?.spec?.store?.type as ConfigFileType, index)}
                              minimal
                            />

                            <Button
                              iconProps={{ size: 18 }}
                              icon="main-trash"
                              onClick={() => removeConfigFileConfig(index)}
                              minimal
                            />
                          </Layout.Horizontal>
                        </span>
                      )}
                    </section>
                  </div>
                )
              })}
          </section>
        </Layout.Vertical>
        {!isReadonly && (
          <Button
            id="add-config-file"
            size={ButtonSize.SMALL}
            variation={ButtonVariation.LINK}
            className={css.addConfig}
            data-test-id="addConfigFile"
            onClick={addNewConfigFile}
            icon="plus"
            text={getString('pipeline.configFiles.addConfigFile')}
          />
        )}
      </Layout.Vertical>
    </Layout.Vertical>
  )
}

export default ConfigFilesListView
