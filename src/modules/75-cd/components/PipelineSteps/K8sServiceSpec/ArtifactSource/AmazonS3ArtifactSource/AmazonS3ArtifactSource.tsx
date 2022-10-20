/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import type { FormikValues } from 'formik'
import { defaultTo, get, isEmpty, isNil, memoize } from 'lodash-es'
import { Menu } from '@blueprintjs/core'

import {
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  SelectOption,
  Text
} from '@wings-software/uicore'
import { BucketResponse, SidecarArtifact, useListBucketsWithServiceV2 } from 'services/cd-ng'
import { useListAwsRegions } from 'services/portal'
import { useStrings } from 'framework/strings'
import { useMutateAsGet } from '@common/hooks'
import { Scope } from '@common/interfaces/SecretsInterface'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { ConnectorReferenceDTO } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import useRBACError, { RBACError } from '@rbac/utils/useRBACError/useRBACError'
import { ArtifactToConnectorMap, ENABLED_ARTIFACT_TYPES } from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { EXPRESSION_STRING } from '@pipeline/utils/constants'
import { ArtifactSourceBase, ArtifactSourceRenderProps } from '@cd/factory/ArtifactSourceFactory/ArtifactSourceBase'
import { isFieldRuntime } from '../../K8sServiceSpecHelper'
import {
  getDefaultQueryParam,
  getFinalQueryParamValue,
  getFqnPath,
  getYamlData,
  isFieldfromTriggerTabDisabled,
  isNewServiceEnvEntity,
  shouldFetchTagsSource
} from '../artifactSourceUtils'
import css from '../../../Common/GenericServiceSpec/GenericServiceSpec.module.scss'

export const resetBuckets = (formik: FormikValues, bucketPath: string): void => {
  const bucketValue = get(formik.values, bucketPath, '')
  if (getMultiTypeFromValue(bucketValue) === MultiTypeInputType.FIXED && bucketValue?.length) {
    formik.setFieldValue(bucketPath, '')
  }
}

export interface AmazonS3ContentProps extends ArtifactSourceRenderProps {
  isBucketSelectionDisabled: (props: ArtifactSourceRenderProps) => boolean
}

const Content = (props: AmazonS3ContentProps): JSX.Element => {
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
    allowableTypes,
    fromTrigger,
    artifact,
    isSidecar,
    artifactPath,
    isBucketSelectionDisabled,
    pipelineIdentifier,
    serviceIdentifier,
    stepViewType
  } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { getRBACErrorMessage } = useRBACError()
  const { NG_SVC_ENV_REDESIGN } = useFeatureFlags()

  const isPropagatedStage = path?.includes('serviceConfig.stageOverrides')
  const fixedConnectorValue = defaultTo(
    get(initialValues?.artifacts, `${artifactPath}.spec.connectorRef`),
    artifact?.spec?.connectorRef
  )
  const fixedRegionValue = defaultTo(
    get(initialValues?.artifacts, `${artifactPath}.spec.region`),
    artifact?.spec?.region
  )
  const fixedFilePathRegexValue = defaultTo(
    get(initialValues?.artifacts, `${artifactPath}.spec.filePathRegex`),
    artifact?.spec?.filePathRegex
  )

  const [regions, setRegions] = React.useState<SelectOption[]>([])
  const [lastQueryData, setLastQueryData] = React.useState({
    connectorRef: '',
    region: ''
  })

  const {
    data: regionData,
    loading: loadingRegions,
    error: errorRegions
  } = useListAwsRegions({
    queryParams: {
      accountId
    }
  })

  React.useEffect(() => {
    const regionValues = (regionData?.resource || []).map(region => ({
      value: region.value,
      label: region.name
    }))

    setRegions(regionValues as SelectOption[])
  }, [regionData?.resource])

  const bucketListAPIQueryParams = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    connectorRef: fixedConnectorValue,
    region: getFinalQueryParamValue(fixedRegionValue),
    pipelineIdentifier: defaultTo(pipelineIdentifier, formik?.values?.identifier),
    serviceId: isNewServiceEnvEntity(path as string) ? serviceIdentifier : undefined,
    fqnPath: getFqnPath(
      path as string,
      !!isPropagatedStage,
      stageIdentifier,
      defaultTo(
        isSidecar
          ? artifactPath?.split('[')[0].concat(`.${get(initialValues?.artifacts, `${artifactPath}.identifier`)}`)
          : artifactPath,
        ''
      ),
      'bucketName'
    )
  }

  const {
    data: bucketData,
    error,
    loading,
    refetch: refetchBuckets
  } = useMutateAsGet(useListBucketsWithServiceV2, {
    body: getYamlData(formik?.values, stepViewType as StepViewType, path as string),
    requestOptions: {
      headers: {
        'content-type': 'application/json'
      }
    },
    queryParams: {
      ...bucketListAPIQueryParams
    },
    lazy: true,
    debounce: 300
  })

  const selectItems = useMemo(() => {
    return defaultTo(
      bucketData?.data?.map((bucket: BucketResponse) => ({
        value: defaultTo(bucket.bucketName, ''),
        label: defaultTo(bucket.bucketName, '')
      })),
      []
    )
  }, [bucketData?.data])

  const getBuckets = React.useCallback((): { label: string; value: string }[] => {
    if (loading) {
      return [{ label: 'Loading Buckets...', value: 'Loading Buckets...' }]
    }
    return defaultTo(selectItems, [])
  }, [loading, selectItems])

  const canFetchBuckets = React.useCallback((): boolean => {
    if (NG_SVC_ENV_REDESIGN) {
      let shouldFetchBuckets = false
      if (isFieldRuntime(`artifacts.${artifactPath}.spec.connectorRef`, template)) {
        shouldFetchBuckets = !!(
          lastQueryData.connectorRef !== fixedConnectorValue && shouldFetchTagsSource([fixedConnectorValue])
        )
      }
      if (!shouldFetchBuckets && isFieldRuntime(`artifacts.${artifactPath}.spec.region`, template)) {
        // Checking if fixedRegionValue is empty because region is not required to get buckets
        if (!isEmpty(fixedRegionValue)) {
          shouldFetchBuckets = !!(
            lastQueryData.region !== fixedRegionValue && shouldFetchTagsSource([fixedRegionValue])
          )
        }
      }
      return shouldFetchBuckets || isNil(bucketData?.data)
    } else {
      return !!(
        (lastQueryData.connectorRef != fixedConnectorValue || lastQueryData.region !== fixedRegionValue) &&
        shouldFetchTagsSource([fixedConnectorValue])
      )
    }
    return true
  }, [NG_SVC_ENV_REDESIGN, template, lastQueryData, fixedConnectorValue, fixedRegionValue, bucketData?.data])

  const fetchBuckets = React.useCallback((): void => {
    if (canFetchBuckets()) {
      setLastQueryData({
        connectorRef: fixedConnectorValue,
        region: fixedRegionValue
      })
      refetchBuckets()
    }
  }, [canFetchBuckets, refetchBuckets, fixedConnectorValue, fixedRegionValue])

  const isFieldDisabled = (fieldName: string, isBucket = false): boolean => {
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

    if (isBucket) {
      return isBucketSelectionDisabled(props)
    }

    return false
  }

  const isRuntime = isPrimaryArtifactsRuntime || isSidecarRuntime
  const itemRenderer = memoize((item: { label: string }, { handleClick }) => (
    <div key={item.label.toString()}>
      <Menu.Item
        text={
          <Layout.Horizontal spacing="small">
            <Text>{item.label}</Text>
          </Layout.Horizontal>
        }
        disabled={loading}
        onClick={handleClick}
      />
    </div>
  ))

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
                allowableTypes: [MultiTypeInputType.EXPRESSION, MultiTypeInputType.FIXED],
                expressions
              }}
              onChange={(selected, _typeValue) => {
                const item = selected as unknown as { record?: ConnectorReferenceDTO; scope: Scope }
                const connectorRefValue =
                  item.scope === Scope.ORG || item.scope === Scope.ACCOUNT
                    ? `${item.scope}.${item?.record?.identifier}`
                    : item.record?.identifier

                if (connectorRefValue !== fixedConnectorValue) {
                  resetBuckets(formik, `${path}.artifacts.${artifactPath}.spec.bucketName`)
                }
              }}
              className={css.connectorMargin}
              type={ArtifactToConnectorMap[defaultTo(artifact?.type, '')]}
              gitScope={{
                repo: defaultTo(repoIdentifier, ''),
                branch: defaultTo(branch, ''),
                getDefaultFromOtherRepo: true
              }}
            />
          )}
          {isFieldRuntime(`artifacts.${artifactPath}.spec.region`, template) && (
            <FormInput.MultiTypeInput
              name={`${path}.artifacts.${artifactPath}.spec.region`}
              selectItems={regions}
              useValue
              disabled={(!fromTrigger && isFieldDisabled(`artifacts.${artifactPath}.spec.region`)) || loading}
              multiTypeInputProps={{
                onChange: selected => {
                  if (fixedRegionValue !== (selected as any).value) {
                    resetBuckets(formik, `${path}.artifacts.${artifactPath}.spec.bucketName`)
                  }
                },
                selectProps: {
                  items: regions,
                  noResults: (
                    <Text lineClamp={1} width={500} height={100}>
                      {getRBACErrorMessage(errorRegions as RBACError) || getString('pipeline.noRegions')}
                    </Text>
                  )
                }
              }}
              label={getString('optionalField', { name: getString('regionLabel') })}
              placeholder={loadingRegions ? getString('loading') : getString('select')}
            />
          )}

          {isFieldRuntime(`artifacts.${artifactPath}.spec.bucketName`, template) && (
            <FormInput.MultiTypeInput
              selectItems={getBuckets()}
              label={getString('pipeline.manifestType.bucketName')}
              placeholder={loading ? getString('loading') : getString('pipeline.manifestType.bucketPlaceHolder')}
              name={`${path}.artifacts.${artifactPath}.spec.bucketName`}
              disabled={!fromTrigger && isFieldDisabled(`artifacts.${artifactPath}.spec.bucketName`, true)}
              helperText={
                !get(formik, `values.${path}.artifacts.${artifactPath}.spec.connectorRef`)?.length &&
                getMultiTypeFromValue(artifact?.spec?.connectorRef) === MultiTypeInputType.RUNTIME &&
                getString('pipeline.dependencyRequired')
              }
              useValue
              multiTypeInputProps={{
                expressions,
                allowableTypes,
                selectProps: {
                  noResults: (
                    <Text lineClamp={1} width={500} height={100} padding="small">
                      {getRBACErrorMessage(error as RBACError) || getString('pipeline.noBucketsFound')}
                    </Text>
                  ),
                  itemRenderer: itemRenderer,
                  items: getBuckets(),
                  allowCreatingNewItems: true
                },
                onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
                  if (
                    e?.target?.type !== 'text' ||
                    (e?.target?.type === 'text' && e?.target?.placeholder === EXPRESSION_STRING)
                  ) {
                    return
                  }
                  if (!loading) {
                    fetchBuckets()
                  }
                }
              }}
            />
          )}

          {isFieldRuntime(`artifacts.${artifactPath}.spec.filePath`, template) && (
            <FormInput.MultiTextInput
              label={getString('common.git.filePath')}
              name={`${path}.artifacts.${artifactPath}.spec.filePath`}
              placeholder={getString('pipeline.manifestType.pathPlaceholder')}
              disabled={isFieldDisabled(`artifacts.${artifactPath}.spec.filePath`)}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
            />
          )}

          {!fromTrigger && isFieldRuntime(`artifacts.${artifactPath}.spec.filePathRegex`, template) && (
            <FormInput.MultiTextInput
              label={getString('pipeline.artifactsSelection.filePathRegexLabel')}
              name={`${path}.artifacts.${artifactPath}.spec.filePathRegex`}
              placeholder={getString('pipeline.artifactsSelection.filePathRegexPlaceholder')}
              disabled={isFieldDisabled(`artifacts.${artifactPath}.spec.filePathRegex`)}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
            />
          )}

          {!!fromTrigger && !isFieldRuntime(`artifacts.${artifactPath}.spec.filePathRegex`, template) && (
            <FormInput.MultiTextInput
              label={getString('pipeline.artifactsSelection.filePathRegexLabel')}
              multiTextInputProps={{
                expressions,
                value: fixedFilePathRegexValue,
                allowableTypes
              }}
              disabled={true}
              name={`${path}.artifacts.${artifactPath}.spec.filePathRegex`}
            />
          )}

          {!!fromTrigger && isFieldRuntime(`artifacts.${artifactPath}.spec.filePathRegex`, template) && (
            <FormInput.MultiTextInput
              label={getString('pipeline.artifactsSelection.filePathRegexLabel')}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
              name={`${path}.artifacts.${artifactPath}.spec.filePathRegex`}
            />
          )}
        </Layout.Vertical>
      )}
    </>
  )
}

export class AmazonS3ArtifactSource extends ArtifactSourceBase<AmazonS3ContentProps> {
  protected artifactType = ENABLED_ARTIFACT_TYPES.AmazonS3
  protected isSidecar = false

  // NOTE: This is not used anywhere currently, this written because it is abstract method in ArtifactSourceBase class
  // ArtifactSourceBase should extended here, otherwise AmazonS3ArtifactSource class instancecan not be registered
  // in src/modules/75-cd/factory/ArtifactSourceFactory/ArtifactSourceBaseFactory.tsx file
  isTagsSelectionDisabled(_props: ArtifactSourceRenderProps): boolean {
    return false
  }

  isBucketSelectionDisabled(props: ArtifactSourceRenderProps): boolean {
    const { initialValues, artifactPath, artifact } = props

    const isConnectorPresent = getDefaultQueryParam(
      artifact?.spec?.connectorRef,
      get(initialValues, `artifacts.${artifactPath}.spec.connectorRef`, '')
    )
    return !isConnectorPresent
  }

  renderContent(props: ArtifactSourceRenderProps): JSX.Element | null {
    if (!props.isArtifactsRuntime) {
      return null
    }

    this.isSidecar = defaultTo(props.isSidecar, false)

    return <Content {...props} isBucketSelectionDisabled={this.isBucketSelectionDisabled.bind(this)} />
  }
}
