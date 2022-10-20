/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import {
  Layout,
  FormInput,
  Text,
  SelectOption,
  getMultiTypeFromValue,
  MultiTypeInputType,
  AllowedTypes
} from '@wings-software/uicore'
import { useFormikContext } from 'formik'
import { useParams } from 'react-router-dom'
import { get, defaultTo } from 'lodash-es'
import cx from 'classnames'
import { SshWinRmAwsInfrastructure, useRegionsForAws, useTagsV2 } from 'services/cd-ng'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useStrings } from 'framework/strings'
import { Connectors } from '@connectors/constants'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import MultiTypeSecretInput, {
  getMultiTypeSecretInputType
} from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'
import MultiTypeTagSelector from '@common/components/MultiTypeTagSelector/MultiTypeTagSelector'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import type { SshWinRmAwsInfrastructureTemplate } from './SshWinRmAwsInfrastructureSpec'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface AwsInfrastructureSpecEditableProps {
  initialValues: SshWinRmAwsInfrastructure
  allValues?: SshWinRmAwsInfrastructure
  readonly?: boolean
  template?: SshWinRmAwsInfrastructureTemplate
  allowableTypes: AllowedTypes
  path: string
}

const errorMessage = 'data.message'

export const SshWimRmAwsInfrastructureSpecInputForm: React.FC<AwsInfrastructureSpecEditableProps> = ({
  initialValues,
  template,
  allowableTypes,
  allValues,
  readonly,
  path
}) => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [regions, setRegions] = useState<SelectOption[]>([])
  const [tags, setTags] = useState<SelectOption[]>([])
  const { expressions } = useVariablesExpression()
  const formik = useFormikContext()

  const { getString } = useStrings()

  const environmentRef = useMemo(
    () => defaultTo(initialValues.environmentRef, allValues?.environmentRef),
    [initialValues.environmentRef, allValues?.environmentRef]
  )

  const infrastructureRef = useMemo(
    () => defaultTo(initialValues.infrastructureRef, allValues?.infrastructureRef),
    [initialValues.infrastructureRef, allValues?.infrastructureRef]
  )

  const { data: regionsData, loading: loadingRegions, error: regionsError } = useRegionsForAws({})

  useEffect(() => {
    const regionOptions = Object.entries(get(regionsData, 'data', {})).map(regEntry => ({
      value: regEntry[0],
      label: regEntry[1]
    }))
    setRegions(regionOptions)
  }, [regionsData])

  const {
    data: tagsData,
    refetch: refetchTags,
    loading: loadingTags,
    error: tagsError
  } = useTagsV2({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      region: get(initialValues, 'region', undefined),
      awsConnectorRef: get(initialValues, 'connectorRef', undefined),
      envId: environmentRef,
      infraDefinitionId: infrastructureRef
    },
    lazy: true
  })

  useEffect(() => {
    setTags([])
    refetchTags()
  }, [initialValues.region, initialValues.connectorRef])

  useEffect(() => {
    const tagOptions = get(tagsData, 'data', []).map((tagItem: string) => ({
      value: tagItem,
      label: tagItem
    }))
    setTags(tagOptions)
  }, [tagsData])

  return (
    <Layout.Vertical
      spacing="small"
      onKeyDown={event => {
        if (event.key === 'Enter') {
          event.stopPropagation()
        }
      }}
    >
      {getMultiTypeFromValue(get(template, 'connectorRef', '')) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormMultiTypeConnectorField
            accountIdentifier={accountId}
            projectIdentifier={projectIdentifier}
            orgIdentifier={orgIdentifier}
            name={`${path}.connectorRef`}
            tooltipProps={{
              dataTooltipId: 'awsInfraConnector'
            }}
            label={getString('connector')}
            enableConfigureOptions={false}
            placeholder={getString('connectors.selectConnector')}
            disabled={readonly}
            multiTypeProps={{ allowableTypes, expressions }}
            type={Connectors.AWS}
            setRefValue
            gitScope={{ repo: defaultTo(repoIdentifier, ''), branch, getDefaultFromOtherRepo: true }}
            onChange={() => {
              formik.setFieldValue(`${path}.awsInstanceFilter.tags`, undefined)
            }}
          />
        </div>
      )}
      {getMultiTypeFromValue(get(template, 'region', '')) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.MultiTypeInput
            name={`${path}.region`}
            tooltipProps={{
              dataTooltipId: 'awsInfraRegion'
            }}
            disabled={readonly}
            placeholder={
              loadingRegions ? /* istanbul ignore next */ getString('loading') : getString('pipeline.regionPlaceholder')
            }
            useValue
            selectItems={regions}
            label={getString('regionLabel')}
            multiTypeInputProps={{
              onChange: () => {
                formik.setFieldValue(`${path}.awsInstanceFilter.tags`, undefined)
              },
              selectProps: {
                items: regions,
                allowCreatingNewItems: true,
                addClearBtn: !(loadingRegions || readonly),
                noResults: (
                  <Text padding={'small'}>
                    {loadingRegions
                      ? getString('loading')
                      : defaultTo(
                          get(regionsError, errorMessage, get(regionsError, 'message', '')),
                          getString('cd.steps.awsInfraStep.regionError')
                        )}
                  </Text>
                )
              },
              expressions,
              allowableTypes
            }}
          />
        </div>
      )}
      {getMultiTypeFromValue(get(template, 'awsInstanceFilter.tags', '')) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <MultiTypeTagSelector
            name={`${path}.awsInstanceFilter.tags`}
            tooltipProps={{
              dataTooltipId: 'awsInfraTags'
            }}
            allowableTypes={allowableTypes}
            tags={tags}
            expressions={expressions}
            isLoadingTags={loadingTags}
            initialTags={initialValues?.awsInstanceFilter?.tags}
            errorMessage={get(tagsError, 'data.message', '')}
            className="tags-select"
          />
        </div>
      )}
      {getMultiTypeFromValue(get(template, 'credentialsRef', '')) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <MultiTypeSecretInput
            name={`${path}.credentialsRef`}
            type={getMultiTypeSecretInputType(initialValues.serviceType)}
            label={getString('cd.steps.common.specifyCredentials')}
            expressions={expressions}
          />
        </div>
      )}
    </Layout.Vertical>
  )
}
