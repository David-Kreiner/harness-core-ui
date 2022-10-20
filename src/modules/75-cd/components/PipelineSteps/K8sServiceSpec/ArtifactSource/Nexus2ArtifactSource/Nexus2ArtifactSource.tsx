/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { defaultTo, get } from 'lodash-es'

import { FormInput, Layout } from '@wings-software/uicore'
import { useMutateAsGet } from '@common/hooks'
import { ArtifactSourceBase, ArtifactSourceRenderProps } from '@cd/factory/ArtifactSourceFactory/ArtifactSourceBase'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { SidecarArtifact, useGetBuildDetailsForNexusArtifactWithYaml } from 'services/cd-ng'

import { ArtifactToConnectorMap, ENABLED_ARTIFACT_TYPES } from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { TriggerDefaultFieldList } from '@triggers/pages/triggers/utils/TriggersWizardPageUtils'
import { RepositoryFormatTypes } from '@pipeline/utils/stageHelpers'
import { checkIfQueryParamsisNotEmpty } from '@pipeline/components/ArtifactsSelection/ArtifactUtils'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import type { queryInterface } from '@pipeline/components/ArtifactsSelection/ArtifactRepository/ArtifactLastSteps/NexusArtifact/NexusArtifact'
import ArtifactTagRuntimeField from '../ArtifactSourceRuntimeFields/ArtifactTagRuntimeField'
import {
  getDefaultQueryParam,
  getFinalQueryParamValue,
  getFqnPath,
  getImagePath,
  isFieldfromTriggerTabDisabled,
  isNewServiceEnvEntity,
  resetTags
} from '../artifactSourceUtils'
import { isFieldRuntime } from '../../K8sServiceSpecHelper'
import css from '../../../Common/GenericServiceSpec/GenericServiceSpec.module.scss'

interface JenkinsRenderContent extends ArtifactSourceRenderProps {
  isTagsSelectionDisabled: (data: ArtifactSourceRenderProps) => boolean
}
const Content = (props: JenkinsRenderContent): React.ReactElement => {
  const {
    isPrimaryArtifactsRuntime,
    isSidecarRuntime,
    template,
    formik,
    path,
    initialValues,
    accountId,
    projectIdentifier,
    orgIdentifier,
    readonly,
    repoIdentifier,
    branch,
    stageIdentifier,
    isTagsSelectionDisabled,
    pipelineIdentifier,
    allowableTypes,
    fromTrigger,
    artifact,
    isSidecar,
    artifactPath,
    serviceIdentifier
  } = props

  const { getString } = useStrings()
  const [lastQueryData, setLastQueryData] = useState<queryInterface>({
    connectorRef: '',
    repositoryFormat: '',
    repository: ''
  })
  const { expressions } = useVariablesExpression()

  const connectorRefValue = getDefaultQueryParam(
    artifact?.spec?.connectorRef,
    get(initialValues?.artifacts, `${artifactPath}.spec.connectorRef`, '')
  )

  const repositoryValue = getDefaultQueryParam(
    artifact?.spec?.repository,
    get(initialValues?.artifacts, `${artifactPath}.spec.repository`, '')
  )

  const repositoryFormatValue = getDefaultQueryParam(
    artifact?.spec?.repositoryFormat,
    get(initialValues?.artifacts, `${artifactPath}.spec.repositoryFormat`, '')
  )
  const isPropagatedStage = path?.includes('serviceConfig.stageOverrides')

  const artifactIdValue = getDefaultQueryParam(
    artifact?.spec?.spec?.artifactId,
    get(initialValues?.artifacts, `${artifactPath}.spec.spec.artifactId`, '')
  )

  const groupIdValue = getDefaultQueryParam(
    artifact?.spec?.spec?.groupId,
    get(initialValues?.artifacts, `${artifactPath}.spec.spec.groupId`, '')
  )

  const extensionValue = getDefaultQueryParam(
    artifact?.spec?.spec?.extension,
    get(initialValues?.artifacts, `${artifactPath}.spec.spec.extension`, '')
  )

  const classifierValue = getDefaultQueryParam(
    artifact?.spec?.spec?.classifier,
    get(initialValues?.artifacts, `${artifactPath}.spec.spec.classifier`, '')
  )

  const packageNameValue = getDefaultQueryParam(
    artifact?.spec?.spec?.packageName,
    get(initialValues?.artifacts, `${artifactPath}.spec.spec.packageName`, '')
  )

  const {
    data,
    loading: nexusBuildDetailsLoading,
    refetch: refetchNexusTag,
    error: nexusTagError
  } = useMutateAsGet(useGetBuildDetailsForNexusArtifactWithYaml, {
    body: yamlStringify({
      pipeline: formik?.values
    }),
    requestOptions: {
      headers: {
        'content-type': 'application/json'
      }
    },
    queryParams: {
      connectorRef: getFinalQueryParamValue(connectorRefValue),
      repository: getFinalQueryParamValue(repositoryValue),
      repositoryFormat: getFinalQueryParamValue(repositoryFormatValue),
      artifactId: getFinalQueryParamValue(artifactIdValue),
      groupId: getFinalQueryParamValue(groupIdValue),
      extension: getFinalQueryParamValue(extensionValue),
      classifier: getFinalQueryParamValue(classifierValue),
      packageName: getFinalQueryParamValue(packageNameValue),
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch,
      pipelineIdentifier: defaultTo(pipelineIdentifier, formik?.values?.identifier),
      serviceId: isNewServiceEnvEntity(path as string) ? serviceIdentifier : undefined,
      fqnPath: getFqnPath(path as string, !!isPropagatedStage, stageIdentifier, defaultTo(artifactPath, ''), 'tag')
    },
    lazy: true
  })

  useEffect(() => {
    if (checkIfQueryParamsisNotEmpty(Object.values(lastQueryData))) {
      refetchNexusTag()
    }
  }, [lastQueryData])

  const canFetchTags = (): boolean => {
    return !!(repositoryFormatValue === RepositoryFormatTypes.Maven
      ? lastQueryData.repositoryFormat !== repositoryFormatValue ||
        lastQueryData.repository !== repositoryValue ||
        lastQueryData.artifactId !== artifactIdValue ||
        lastQueryData.groupId !== groupIdValue ||
        lastQueryData.extension !== extensionValue ||
        lastQueryData.classifier !== classifierValue
      : lastQueryData.repositoryFormat !== repositoryFormatValue ||
        lastQueryData.repository !== repositoryValue ||
        lastQueryData.packageName !== packageNameValue)
  }
  const fetchTags = (): void => {
    if (canFetchTags()) {
      let repositoryDependentFields: any = {}
      if (repositoryFormatValue === RepositoryFormatTypes.Maven) {
        const optionalFields: any = {}
        if (extensionValue) optionalFields.extension = extensionValue

        if (classifierValue) optionalFields.classifier = classifierValue

        repositoryDependentFields = {
          artifactId: artifactIdValue,
          groupId: groupIdValue,
          ...optionalFields
        }
      } else {
        repositoryDependentFields = {
          packageName: packageNameValue
        }
      }
      setLastQueryData({
        repository: repositoryValue,
        repositoryFormat: repositoryFormatValue,
        ...repositoryDependentFields
      })
    }
  }

  const isFieldDisabled = (fieldName: string, isTag = false): boolean => {
    /* instanbul ignore else */
    if (
      readonly ||
      isFieldfromTriggerTabDisabled(
        fieldName,
        formik,
        stageIdentifier,
        fromTrigger,
        isSidecar ? (artifact as SidecarArtifact)?.identifier : undefined
      )
    ) {
      return true
    }
    if (isTag) {
      return isTagsSelectionDisabled(props)
    }
    return false
  }

  const isRuntime = isPrimaryArtifactsRuntime || isSidecarRuntime
  return (
    <>
      {isRuntime && (
        <Layout.Vertical key={artifactPath} className={css.inputWidth}>
          {isFieldRuntime(`artifacts.${artifactPath}.spec.connectorRef`, template) && (
            <FormMultiTypeConnectorField
              name={`${path}.artifacts.${artifactPath}.spec.connectorRef`}
              label={getString('pipelineSteps.deploy.inputSet.artifactServer')}
              selected={get(initialValues, `artifacts.${artifactPath}.spec.connectorRef`, '')}
              placeholder={''}
              accountIdentifier={accountId}
              projectIdentifier={projectIdentifier}
              orgIdentifier={orgIdentifier}
              width={391}
              setRefValue
              disabled={isFieldDisabled(`artifacts.${artifactPath}.spec.connectorRef`)}
              multiTypeProps={{
                allowableTypes,
                expressions
              }}
              onChange={() => resetTags(formik, `${path}.artifacts.${artifactPath}.spec.tag`)}
              className={css.connectorMargin}
              type={ArtifactToConnectorMap[defaultTo(artifact?.type, '')]}
              gitScope={{
                repo: defaultTo(repoIdentifier, ''),
                branch: defaultTo(branch, ''),
                getDefaultFromOtherRepo: true
              }}
            />
          )}
          {!!fromTrigger && isFieldRuntime(`artifacts.${artifactPath}.spec.tag`, template) && (
            <FormInput.MultiTextInput
              label={getString('tagLabel')}
              multiTextInputProps={{
                expressions,
                value: TriggerDefaultFieldList.build,
                allowableTypes
              }}
              disabled={true}
              name={`${path}.artifacts.${artifactPath}.spec.tag`}
            />
          )}

          {!fromTrigger && isFieldRuntime(`artifacts.${artifactPath}.spec.tag`, template) && (
            <ArtifactTagRuntimeField
              {...props}
              isFieldDisabled={() => isFieldDisabled(`artifacts.${artifactPath}.spec.tag`, true)}
              fetchingTags={nexusBuildDetailsLoading}
              buildDetailsList={data?.data?.buildDetailsList}
              fetchTagsError={nexusTagError}
              fetchTags={fetchTags}
              expressions={expressions}
              stageIdentifier={stageIdentifier}
            />
          )}
          {isFieldRuntime(`artifacts.${artifactPath}.spec.tagRegex`, template) && (
            <FormInput.MultiTextInput
              disabled={isFieldDisabled(`artifacts.${artifactPath}.spec.tagRegex`)}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
              label={getString('tagRegex')}
              name={`${path}.artifacts.${artifactPath}.spec.tagRegex`}
            />
          )}
          {isFieldRuntime(`artifacts.${artifactPath}.spec.repository`, template) && (
            <FormInput.MultiTextInput
              label={getString('repository')}
              name={`${path}.artifacts.${artifactPath}.spec.repository`}
              placeholder={getString('pipeline.artifactsSelection.repositoryPlaceholder')}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
            />
          )}
          {isFieldRuntime(`artifacts.${artifactPath}.spec.spec.groupId`, template) && (
            <FormInput.MultiTextInput
              label={getString('pipeline.artifactsSelection.groupId')}
              name={`${path}.artifacts.${artifactPath}.spec.spec.groupId`}
              placeholder={getString('pipeline.artifactsSelection.groupIdPlaceholder')}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
            />
          )}
          {isFieldRuntime(`artifacts.${artifactPath}.spec.spec.artifactId`, template) && (
            <FormInput.MultiTextInput
              label={getString('pipeline.artifactsSelection.artifactId')}
              name={`${path}.artifacts.${artifactPath}.spec.spec.artifactId`}
              placeholder={getString('pipeline.artifactsSelection.artifactIdPlaceholder')}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
            />
          )}

          {isFieldRuntime(`artifacts.${artifactPath}.spec.spec.extension`, template) && (
            <FormInput.MultiTextInput
              label={getString('pipeline.artifactsSelection.extension')}
              name={`${path}.artifacts.${artifactPath}.spec.spec.extension`}
              placeholder={getString('pipeline.artifactsSelection.extensionPlaceholder')}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
            />
          )}
          {isFieldRuntime(`artifacts.${artifactPath}.spec.spec.classifier`, template) && (
            <FormInput.MultiTextInput
              label={getString('pipeline.artifactsSelection.classifier')}
              name={`${path}.artifacts.${artifactPath}.spec.spec.classifier`}
              placeholder={getString('pipeline.artifactsSelection.classifierPlaceholder')}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
            />
          )}
          {isFieldRuntime(`artifacts.${artifactPath}.spec.spec.packageName`, template) && (
            <FormInput.MultiTextInput
              label={getString('pipeline.artifactsSelection.packageName')}
              name={`${path}.artifacts.${artifactPath}.spec.spec.packageName`}
              placeholder={getString('pipeline.manifestType.packagePlaceholder')}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
            />
          )}
        </Layout.Vertical>
      )}
    </>
  )
}

export class Nexus2ArtifactSource extends ArtifactSourceBase<ArtifactSourceRenderProps> {
  protected artifactType = ENABLED_ARTIFACT_TYPES.Nexus2Registry
  protected isSidecar = false

  isTagsSelectionDisabled(props: ArtifactSourceRenderProps): boolean {
    const { initialValues, artifactPath, artifact } = props

    const isImagePathPresent = getImagePath(
      artifact?.spec?.imagePath,
      get(initialValues, `artifacts.${artifactPath}.spec.imagePath`, '')
    )
    const isConnectorPresent = getDefaultQueryParam(
      artifact?.spec?.connectorRef,
      get(initialValues, `artifacts.${artifactPath}.spec.connectorRef`, '')
    )

    return !(isImagePathPresent && isConnectorPresent)
  }

  renderContent(props: ArtifactSourceRenderProps): JSX.Element | null {
    if (!props.isArtifactsRuntime) {
      return null
    }

    this.isSidecar = defaultTo(props.isSidecar, false)

    return <Content {...props} isTagsSelectionDisabled={this.isTagsSelectionDisabled.bind(this)} />
  }
}
