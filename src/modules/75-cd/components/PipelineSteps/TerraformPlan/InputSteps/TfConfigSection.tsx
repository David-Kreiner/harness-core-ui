/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import cx from 'classnames'

import { useParams } from 'react-router-dom'
import { get, map } from 'lodash-es'
import { getMultiTypeFromValue, MultiTypeInputType, Label, SelectOption, useToaster, Layout } from '@harness/uicore'
import { connect } from 'formik'
import { Color } from '@harness/design-system'
import { useQueryParams } from '@common/hooks'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useStrings } from 'framework/strings'
import { Connectors } from '@connectors/constants'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useGetRepositoriesDetailsForArtifactory } from 'services/cd-ng'
import { TextFieldInputSetView } from '@pipeline/components/InputSetView/TextFieldInputSetView/TextFieldInputSetView'
import { isExecutionTimeFieldDisabled } from '@pipeline/utils/runPipelineUtils'
import { SelectInputSetView } from '@pipeline/components/InputSetView/SelectInputSetView/SelectInputSetView'
import FileStoreList from '@filestore/components/FileStoreList/FileStoreList'
import { fileTypes } from '@pipeline/components/StartupScriptSelection/StartupScriptInterface.types'
import type { TerraformPlanProps } from '../../Common/Terraform/TerraformInterfaces'
import { getPath } from '../../Common/Terraform/Editview/TerraformConfigFormHelper'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

function ConfigSectionRef(props: TerraformPlanProps & { formik?: any }): React.ReactElement {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { inputSetData, readonly, initialValues, path, allowableTypes, formik, stepViewType, isBackendConfig } = props

  const configPath = getPath(true, isBackendConfig)
  const config = inputSetData?.template?.spec?.configuration
  const configSpec = get(inputSetData?.template, configPath)
  const store = configSpec?.store
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const { expressions } = useVariablesExpression()
  const [connectorRepos, setConnectorRepos] = useState<SelectOption[]>()
  let connectorVal = get(formik.values, `${path}.${configPath}.store.spec.connectorRef`)
  if (!connectorVal) {
    connectorVal = get(props?.allValues, `${configPath}.store.spec.connectorRef`)
  }
  let repoName = get(formik.values, `${path}.${configPath}.store.spec.repositoryName`)
  if (!repoName) {
    repoName = get(props?.allValues, `${configPath}.store.spec.repositoryName`)
  }
  let storeType = get(formik?.values, `${path}.${configPath}.store.type`)
  if (!storeType) {
    storeType = get(props?.allValues, `${configPath}.store.type`)
  }
  const reposRequired = getMultiTypeFromValue(configSpec?.store?.spec?.repositoryName) === MultiTypeInputType.RUNTIME
  const {
    data: ArtifactRepoData,
    loading: ArtifactRepoLoading,
    refetch: getArtifactRepos,
    error: ArtifactRepoError
  } = useGetRepositoriesDetailsForArtifactory({
    queryParams: {
      connectorRef: connectorVal,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: true
  })

  useEffect(() => {
    if (ArtifactRepoError) {
      showError(getRBACErrorMessage(ArtifactRepoError))
    }
  }, [ArtifactRepoError])

  useEffect(() => {
    if (
      reposRequired &&
      storeType === Connectors.ARTIFACTORY &&
      connectorVal &&
      getMultiTypeFromValue(connectorVal) === MultiTypeInputType.FIXED &&
      !ArtifactRepoData
    ) {
      getArtifactRepos()
    }

    if (ArtifactRepoData) {
      setConnectorRepos(map(ArtifactRepoData.data?.repositories, repo => ({ label: repo, value: repo })))
    }
  }, [ArtifactRepoData, connectorVal, storeType])

  return (
    <>
      {(configSpec?.store?.spec || config?.workspace) && (
        <Label style={{ color: Color.GREY_900, paddingBottom: 'var(--spacing-medium)' }}>
          {isBackendConfig ? getString('pipelineSteps.backendConfig') : getString('cd.configurationFile')}
        </Label>
      )}
      {getMultiTypeFromValue(config?.workspace) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <TextFieldInputSetView
            name={`${path}.spec.configuration.workspace`}
            placeholder={getString('pipeline.terraformStep.workspace')}
            label={getString('pipelineSteps.workspace')}
            disabled={readonly}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            configureOptionsProps={{
              isExecutionTimeFieldDisabled: isExecutionTimeFieldDisabled(stepViewType)
            }}
            template={inputSetData?.template}
            fieldPath={`${path}.spec.configuration.workspace`}
          />
        </div>
      )}
      {getMultiTypeFromValue(configSpec?.store?.spec?.connectorRef) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormMultiTypeConnectorField
            accountIdentifier={accountId}
            selected={get(initialValues, `${configPath}.store.spec.connectorRef`, '')}
            projectIdentifier={projectIdentifier}
            orgIdentifier={orgIdentifier}
            multiTypeProps={{ allowableTypes, expressions }}
            configureOptionsProps={{
              isExecutionTimeFieldDisabled: isExecutionTimeFieldDisabled(stepViewType)
            }}
            width={400}
            type={
              store?.type === Connectors.ARTIFACTORY
                ? [Connectors.ARTIFACTORY]
                : [Connectors.GIT, Connectors.GITHUB, Connectors.GITLAB, Connectors.BITBUCKET]
            }
            name={`${path}.${configPath}.store.spec.connectorRef`}
            label={getString('connector')}
            placeholder={getString('select')}
            disabled={readonly}
            setRefValue
            gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
          />
        </div>
      )}
      {getMultiTypeFromValue(configSpec?.store?.spec?.repoName) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <TextFieldInputSetView
            label={getString('pipelineSteps.repoName')}
            name={`${path}.${configPath}.store.spec.repoName`}
            placeholder={getString('pipeline.manifestType.repoNamePlaceholder')}
            disabled={readonly}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            configureOptionsProps={{
              isExecutionTimeFieldDisabled: isExecutionTimeFieldDisabled(stepViewType)
            }}
            template={inputSetData?.template}
            fieldPath={`${path}.${configPath}.store.spec.repoName`}
          />
        </div>
      )}

      {getMultiTypeFromValue(configSpec?.store?.spec?.branch) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <TextFieldInputSetView
            label={getString('pipelineSteps.deploy.inputSet.branch')}
            name={`${path}.${configPath}.store.spec.branch`}
            placeholder={getString('pipeline.manifestType.branchPlaceholder')}
            disabled={readonly}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            configureOptionsProps={{
              isExecutionTimeFieldDisabled: isExecutionTimeFieldDisabled(stepViewType)
            }}
            template={inputSetData?.template}
            fieldPath={`${path}.${configPath}.store.spec.branch`}
          />
        </div>
      )}

      {getMultiTypeFromValue(configSpec?.store?.spec?.commitId) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <TextFieldInputSetView
            label={getString('pipeline.manifestType.commitId')}
            name={`${path}.${configPath}.store.spec.commitId`}
            placeholder={getString('pipeline.manifestType.commitPlaceholder')}
            disabled={readonly}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            configureOptionsProps={{
              isExecutionTimeFieldDisabled: isExecutionTimeFieldDisabled(stepViewType)
            }}
            template={inputSetData?.template}
            fieldPath={`${path}.${configPath}.store.spec.commitId`}
          />
        </div>
      )}

      {getMultiTypeFromValue(configSpec?.store?.spec?.folderPath) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <TextFieldInputSetView
            label={getString('common.git.folderPath')}
            name={`${path}.${configPath}.store.spec.folderPath`}
            placeholder={getString('pipeline.manifestType.pathPlaceholder')}
            disabled={readonly}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            configureOptionsProps={{
              isExecutionTimeFieldDisabled: isExecutionTimeFieldDisabled(stepViewType)
            }}
            template={inputSetData?.template}
            fieldPath={`${path}.${configPath}.store.spec.folderPath`}
          />
        </div>
      )}

      {reposRequired && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <SelectInputSetView
            label={getString('pipelineSteps.repoName')}
            name={`${path}.${configPath}.store.spec.repositoryName`}
            placeholder={getString(ArtifactRepoLoading ? 'common.loading' : 'cd.selectRepository')}
            disabled={readonly}
            selectItems={connectorRepos ? connectorRepos : []}
            useValue
            multiTypeInputProps={{
              selectProps: {
                allowCreatingNewItems: true,
                items: connectorRepos ? connectorRepos : []
              },
              expressions,
              allowableTypes
            }}
            configureOptionsProps={{
              isExecutionTimeFieldDisabled: isExecutionTimeFieldDisabled(stepViewType)
            }}
            template={inputSetData?.template}
            fieldPath={`${path}.${configPath}.store.spec.repositoryName`}
          />
        </div>
      )}

      {store?.type === Connectors.ARTIFACTORY &&
        getMultiTypeFromValue(configSpec?.store?.spec?.artifactPaths) === MultiTypeInputType.RUNTIME && (
          <div className={cx(stepCss.formGroup, stepCss.md)}>
            <TextFieldInputSetView
              label={getString('pipeline.artifactPathLabel')}
              name={`${path}.${configPath}.store.spec.artifactPaths`}
              placeholder={getString('pipeline.manifestType.pathPlaceholder')}
              disabled={readonly}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
              configureOptionsProps={{
                isExecutionTimeFieldDisabled: isExecutionTimeFieldDisabled(stepViewType)
              }}
              template={inputSetData?.template}
              fieldPath={`${path}.${configPath}.store.spec.artifactPaths`}
              onChange={value => formik?.setFieldValue(`${path}.${configPath}.store.spec.artifactPaths`, [value])}
            />
          </div>
        )}

      {store?.type === 'Harness' &&
        getMultiTypeFromValue(configSpec?.store?.spec?.files) === MultiTypeInputType.RUNTIME && (
          <Layout.Vertical className={cx(stepCss.inputWidth, stepCss.layoutVerticalSpacing)}>
            <FileStoreList
              name={`${path}.${configPath}.store.spec.files`}
              type={fileTypes.FILE_STORE}
              allowOnlyOne={true}
              formik={formik}
            />
          </Layout.Vertical>
        )}

      {store?.type === 'Harness' &&
        getMultiTypeFromValue(configSpec?.store?.spec?.secretFiles) === MultiTypeInputType.RUNTIME && (
          <Layout.Vertical className={cx(stepCss.inputWidth, stepCss.layoutVerticalSpacing)}>
            <FileStoreList
              name={`${path}.${configPath}.store.spec.secretFiles`}
              type={fileTypes.ENCRYPTED}
              allowOnlyOne={true}
              formik={formik}
            />
          </Layout.Vertical>
        )}
    </>
  )
}

const ConfigSection = connect(ConfigSectionRef)
export default ConfigSection
