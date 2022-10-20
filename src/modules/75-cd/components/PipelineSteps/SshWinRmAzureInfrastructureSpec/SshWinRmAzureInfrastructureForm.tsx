/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useRef } from 'react'
import {
  Layout,
  FormInput,
  SelectOption,
  Formik,
  FormikForm,
  MultiTypeInputType,
  getMultiTypeFromValue,
  Text,
  Icon
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import type { FormikProps } from 'formik'
import { useParams } from 'react-router-dom'
import { debounce, noop, get, isEmpty } from 'lodash-es'
import cx from 'classnames'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import {
  AzureTagDTO,
  SshWinRmAzureInfrastructure,
  useGetAzureResourceGroupsBySubscription,
  useGetAzureSubscriptions,
  useGetSubscriptionTags
} from 'services/cd-ng'
import { getIconByType } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { Connectors } from '@connectors/constants'
import MultiTypeSecretInput, {
  getMultiTypeSecretInputType
} from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'
import {
  ConnectorReferenceDTO,
  FormMultiTypeConnectorField
} from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useStrings } from 'framework/strings'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import MultiTypeTagSelector from '@common/components/MultiTypeTagSelector/MultiTypeTagSelector'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { Scope } from '@common/interfaces/SecretsInterface'
import { SelectConfigureOptions } from '@common/components/ConfigureOptions/SelectConfigureOptions/SelectConfigureOptions'
import {
  AzureInfrastructureSpecEditableProps,
  getValue,
  getValidationSchema,
  subscriptionLabel,
  resourceGroupLabel
} from './SshWinRmAzureInfrastructureInterface'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './SshWinRmAzureInfrastructureSpec.module.scss'
const errorMessage = 'data.message'

const hostConnectionTypes = ['Hostname', 'PublicIP', 'PrivateIP']
const hostConnectionTypeOptions = hostConnectionTypes.map(type => ({
  value: type,
  label: type
}))
interface AzureInfrastructureUI extends Omit<SshWinRmAzureInfrastructure, 'subscriptionId' | 'resourceGroup'> {
  subscriptionId?: any
  resourceGroup?: any
}

export const AzureInfrastructureSpecForm: React.FC<AzureInfrastructureSpecEditableProps> = ({
  initialValues,
  onUpdate,
  readonly,
  allowableTypes
}): JSX.Element => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()

  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [subscriptions, setSubscriptions] = React.useState<SelectOption[]>([])
  const [resourceGroups, setResourceGroups] = React.useState<SelectOption[]>([])
  const [renderCount, setRenderCount] = React.useState<boolean>(true)
  const { expressions } = useVariablesExpression()

  const [azureTags, setAzureTags] = useState([])

  const [canTagsHaveFixedValue, setCanTagsHaveFixedValue] = useState(
    getMultiTypeFromValue(initialValues.subscriptionId) === MultiTypeInputType.FIXED &&
      getMultiTypeFromValue(initialValues.connectorRef) === MultiTypeInputType.FIXED
  )

  const delayedOnUpdate = useRef(debounce(onUpdate || noop, 300)).current
  const { getString } = useStrings()

  const formikRef = useRef<FormikProps<AzureInfrastructureUI> | null>(null)

  const queryParams = {
    connectorRef: get(initialValues, 'connectorRef', ''),
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier
  }
  const {
    data: subscriptionsData,
    loading: loadingSubscriptions,
    refetch: refetchSubscriptions,
    error: subscriptionsError
  } = useGetAzureSubscriptions({
    queryParams,
    lazy: true
  })
  React.useEffect(() => {
    const subscriptionValues =
      subscriptionsData?.data?.subscriptions?.map(sub => ({
        label: `${sub.subscriptionName}: ${sub.subscriptionId}`,
        value: sub.subscriptionId
      })) || []

    setSubscriptions(subscriptionValues)
  }, [subscriptionsData])

  const getSubscription = (values: AzureInfrastructureUI): SelectOption | undefined => {
    const value = values.subscriptionId ? values.subscriptionId : formikRef?.current?.values?.subscriptionId?.value

    /* istanbul ignore else */ if (getMultiTypeFromValue(value) === MultiTypeInputType.FIXED) {
      return (
        subscriptions.find(subscription => subscription.value === value) || {
          label: value,
          value: value
        }
      )
    }

    return get(values, 'subcriptionId', undefined)
  }
  React.useEffect(() => {
    if (getMultiTypeFromValue(formikRef?.current?.values.subscriptionId) === MultiTypeInputType.FIXED) {
      if (initialValues?.subscriptionId) {
        /* istanbul ignore else */ if (renderCount) {
          formikRef?.current?.setFieldValue('subscriptionId', getSubscription(initialValues))
          subscriptions?.length && setRenderCount(false)
        }
      } else {
        setRenderCount(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions])

  const {
    data: resourceGroupData,
    refetch: refetchResourceGroups,
    loading: loadingResourceGroups,
    error: resourceGroupsError
  } = useGetAzureResourceGroupsBySubscription({
    queryParams,
    subscriptionId: get(initialValues, 'subscriptionId', ''),
    lazy: true
  })
  const {
    data: subscriptionTagsData,
    refetch: refetchSubscriptionTags,
    loading: loadingSubscriptionTags,
    error: subscriptionTagsError
  } = useGetSubscriptionTags({
    queryParams,
    subscriptionId: get(initialValues, 'subscriptionId', ''),
    lazy: true
  })

  React.useEffect(() => {
    setAzureTags(
      get(subscriptionTagsData, 'data.tags', []).map((azureTag: AzureTagDTO) => ({
        label: azureTag.tag,
        value: azureTag.tag
      }))
    )
  }, [subscriptionTagsData])

  React.useEffect(() => {
    const options =
      resourceGroupData?.data?.resourceGroups?.map(rg => ({ label: rg.resourceGroup, value: rg.resourceGroup })) ||
      /* istanbul ignore next */ []
    setResourceGroups(options)
  }, [resourceGroupData])

  const getInitialValues = (): AzureInfrastructureUI => {
    const currentValues: AzureInfrastructureUI = {
      ...initialValues
    }

    /* istanbul ignore else */
    if (initialValues) {
      if (getMultiTypeFromValue(initialValues?.subscriptionId) === MultiTypeInputType.FIXED) {
        currentValues.subscriptionId = getSubscription(initialValues)
      }

      if (getMultiTypeFromValue(initialValues?.resourceGroup) === MultiTypeInputType.FIXED) {
        currentValues.resourceGroup = { label: initialValues.resourceGroup, value: initialValues.resourceGroup }
      }
    }

    return currentValues
  }

  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)

  React.useEffect(() => {
    subscribeForm({
      tab: DeployTabs.INFRASTRUCTURE,
      form: formikRef as React.MutableRefObject<FormikProps<unknown> | null>
    })
    if (
      initialValues?.connectorRef &&
      getMultiTypeFromValue(initialValues?.connectorRef) === MultiTypeInputType.FIXED
    ) {
      refetchSubscriptions({
        queryParams: {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          connectorRef: initialValues.connectorRef
        }
      })
    }
    if (
      initialValues?.connectorRef &&
      getMultiTypeFromValue(initialValues?.connectorRef) === MultiTypeInputType.FIXED &&
      initialValues.subscriptionId &&
      getMultiTypeFromValue(initialValues?.subscriptionId) === MultiTypeInputType.FIXED
    ) {
      refetchResourceGroups({
        queryParams: {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          connectorRef: initialValues?.connectorRef
        },
        pathParams: {
          subscriptionId: initialValues?.subscriptionId
        }
      })
      refetchSubscriptionTags({
        queryParams: {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          connectorRef: initialValues?.connectorRef
        },
        pathParams: {
          subscriptionId: initialValues?.subscriptionId
        }
      })
    }
    return () =>
      unSubscribeForm({
        tab: DeployTabs.INFRASTRUCTURE,
        form: formikRef as React.MutableRefObject<FormikProps<unknown> | null>
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isSvcEnvEnabled = useFeatureFlag(FeatureFlag.NG_SVC_ENV_REDESIGN)

  return (
    <Layout.Vertical spacing="medium">
      <Formik<AzureInfrastructureUI>
        formName="sshWinRmAzureInfra"
        initialValues={getInitialValues()}
        validate={value => {
          const data: Partial<SshWinRmAzureInfrastructure> = {
            credentialsRef: value.credentialsRef,
            connectorRef: undefined,
            subscriptionId:
              getValue(value.subscriptionId) === ''
                ? /* istanbul ignore next */ undefined
                : getValue(value.subscriptionId),
            resourceGroup:
              getValue(value.resourceGroup) === ''
                ? /* istanbul ignore next */ undefined
                : getValue(value.resourceGroup),
            tags: value.tags,
            hostConnectionType: value.hostConnectionType,
            allowSimultaneousDeployments: value.allowSimultaneousDeployments
          }
          /* istanbul ignore else */ if (value.connectorRef) {
            data.connectorRef = value.connectorRef?.value || /* istanbul ignore next */ value.connectorRef
          }
          delayedOnUpdate(data)
        }}
        validationSchema={getValidationSchema(getString)}
        onSubmit={noop}
      >
        {formik => {
          window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.INFRASTRUCTURE }))
          formikRef.current = formik
          return (
            <FormikForm>
              <Layout.Vertical flex={{ alignItems: 'flex-start' }} margin={{ bottom: 'medium' }} spacing="medium">
                <Text font={{ variation: FontVariation.H6 }}>{isSvcEnvEnabled ? 'Cluster Details' : ''}</Text>
              </Layout.Vertical>
              <Layout.Vertical spacing="medium">
                <Layout.Horizontal className={cx(stepCss.formGroup, stepCss.md, css.inputWrapper)}>
                  <FormMultiTypeConnectorField
                    name="connectorRef"
                    label={getString('connector')}
                    placeholder={getString('connectors.selectConnector')}
                    disabled={readonly}
                    accountIdentifier={accountId}
                    multiTypeProps={{
                      expressions,
                      allowableTypes,
                      onTypeChange: type => {
                        setCanTagsHaveFixedValue(
                          type === MultiTypeInputType.FIXED &&
                            getMultiTypeFromValue(getValue(formik.values.subscriptionId)) === MultiTypeInputType.FIXED
                        )
                        if (type !== MultiTypeInputType.FIXED) {
                          formik.setFieldValue('tags', '')
                        }
                      }
                    }}
                    projectIdentifier={projectIdentifier}
                    orgIdentifier={orgIdentifier}
                    width={400}
                    connectorLabelClass={css.connectorRef}
                    enableConfigureOptions={false}
                    style={{ marginBottom: 'var(--spacing-large)' }}
                    type={Connectors.AZURE}
                    gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
                    onChange={
                      /* istanbul ignore next */ (selected, _typeValue, type) => {
                        const item = selected as unknown as { record?: ConnectorReferenceDTO; scope: Scope }
                        if (type === MultiTypeInputType.FIXED) {
                          const connectorRef =
                            item.scope === Scope.ORG || item.scope === Scope.ACCOUNT
                              ? `${item.scope}.${item?.record?.identifier}`
                              : item.record?.identifier

                          formik.setFieldValue('connectorRef', connectorRef)
                        }
                        getMultiTypeFromValue(formik.values?.subscriptionId) === MultiTypeInputType.FIXED &&
                          formik.values?.subscriptionId?.value &&
                          formik.setFieldValue('subscriptionId', '')
                        getMultiTypeFromValue(formik.values?.resourceGroup) === MultiTypeInputType.FIXED &&
                          formik.values?.resourceGroup?.value &&
                          formik.setFieldValue('resourceGroup', '')
                        typeof formik.values?.tags !== 'string' &&
                          !isEmpty(formik.values?.tags) &&
                          formik.setFieldValue('tags', {})
                        setSubscriptions([])
                        setResourceGroups([])
                        setAzureTags([])
                      }
                    }
                  />
                  {getMultiTypeFromValue(formik.values.connectorRef) === MultiTypeInputType.RUNTIME && !readonly && (
                    <ConfigureOptions
                      value={formik.values?.connectorRef as string}
                      type={
                        <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
                          <Icon name={getIconByType(Connectors.AZURE)}></Icon>
                          <Text>{getString('common.azureConnector')}</Text>
                        </Layout.Horizontal>
                      }
                      variableName="connectorRef"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={
                        /* istanbul ignore next */ value => {
                          formik.setFieldValue('connectorRef', value)
                        }
                      }
                      isReadonly={readonly}
                      className={css.marginTop}
                    />
                  )}
                </Layout.Horizontal>
                <Layout.Horizontal className={cx(stepCss.formGroup, stepCss.md, css.inputWrapper)}>
                  <FormInput.MultiTypeInput
                    name="subscriptionId"
                    className={css.inputWidth}
                    selectItems={subscriptions}
                    disabled={readonly}
                    placeholder={
                      loadingSubscriptions
                        ? /* istanbul ignore next */ getString('loading')
                        : getString('cd.steps.azureInfraStep.subscriptionPlaceholder')
                    }
                    multiTypeInputProps={{
                      onChange: /* istanbul ignore next */ () => {
                        getMultiTypeFromValue(formik.values?.resourceGroup) === MultiTypeInputType.FIXED &&
                          formik.values?.resourceGroup?.value &&
                          formik.setFieldValue('resourceGroup', '')
                        getMultiTypeFromValue(formik.values?.tags) === MultiTypeInputType.FIXED &&
                          formik.setFieldValue('tags', undefined)

                        setResourceGroups([])
                        setAzureTags([])
                      },
                      onTypeChange: type => {
                        setCanTagsHaveFixedValue(
                          type === MultiTypeInputType.FIXED &&
                            getMultiTypeFromValue(getValue(formik.values.connectorRef)) === MultiTypeInputType.FIXED
                        )
                      },
                      expressions,
                      disabled: readonly,
                      onFocus: /* istanbul ignore next */ () => {
                        const connectorValue = getValue(formik.values?.connectorRef)
                        if (
                          getMultiTypeFromValue(formik.values?.subscriptionId) === MultiTypeInputType.FIXED &&
                          getMultiTypeFromValue(connectorValue) === MultiTypeInputType.FIXED
                        ) {
                          refetchSubscriptions({
                            queryParams: {
                              accountIdentifier: accountId,
                              projectIdentifier,
                              orgIdentifier,
                              connectorRef: connectorValue
                            }
                          })
                        }
                      },
                      selectProps: {
                        items: subscriptions,
                        allowCreatingNewItems: true,
                        addClearBtn: !(loadingSubscriptions || readonly),
                        noResults: (
                          <Text padding={'small'}>
                            {loadingSubscriptions
                              ? getString('loading')
                              : get(subscriptionsError, errorMessage, null) ||
                                getString('pipeline.ACR.subscriptionError')}
                          </Text>
                        )
                      },
                      allowableTypes
                    }}
                    label={getString(subscriptionLabel)}
                  />
                  {getMultiTypeFromValue(getValue(formik.values?.subscriptionId)) === MultiTypeInputType.RUNTIME &&
                    !readonly && (
                      <SelectConfigureOptions
                        value={getValue(formik.values?.subscriptionId)}
                        type="String"
                        variableName="subscriptionId"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={
                          /* istanbul ignore next */ value => {
                            formik.setFieldValue('subscriptionId', value)
                          }
                        }
                        isReadonly={readonly}
                        className={css.marginTop}
                        loading={loadingSubscriptions}
                        options={subscriptions}
                      />
                    )}
                </Layout.Horizontal>
                <Layout.Horizontal className={cx(stepCss.formGroup, stepCss.md, css.inputWrapper)}>
                  <FormInput.MultiTypeInput
                    name="resourceGroup"
                    className={css.inputWidth}
                    selectItems={resourceGroups}
                    disabled={readonly}
                    placeholder={
                      loadingResourceGroups
                        ? /* istanbul ignore next */ getString('loading')
                        : getString('cd.steps.azureInfraStep.resourceGroupPlaceholder')
                    }
                    multiTypeInputProps={{
                      expressions,
                      disabled: readonly,
                      onFocus: /* istanbul ignore next */ () => {
                        const connectorValue = getValue(formik.values?.connectorRef)
                        const subscriptionId = getValue(formik.values?.subscriptionId)
                        if (
                          getMultiTypeFromValue(formik.values?.resourceGroup) === MultiTypeInputType.FIXED &&
                          getMultiTypeFromValue(connectorValue) === MultiTypeInputType.FIXED &&
                          getMultiTypeFromValue(subscriptionId) === MultiTypeInputType.FIXED
                        ) {
                          refetchResourceGroups({
                            queryParams: {
                              accountIdentifier: accountId,
                              projectIdentifier,
                              orgIdentifier,
                              connectorRef: connectorValue
                            },
                            pathParams: {
                              subscriptionId
                            }
                          })
                          refetchSubscriptionTags({
                            queryParams: {
                              accountIdentifier: accountId,
                              projectIdentifier,
                              orgIdentifier,
                              connectorRef: connectorValue
                            },
                            pathParams: {
                              subscriptionId
                            }
                          })
                        }
                      },
                      selectProps: {
                        items: resourceGroups,
                        allowCreatingNewItems: true,
                        addClearBtn: !(loadingResourceGroups || readonly),
                        noResults: (
                          <Text padding={'small'}>
                            {loadingResourceGroups
                              ? getString('loading')
                              : get(resourceGroupsError, errorMessage, null) ||
                                getString('cd.steps.azureInfraStep.resourceGroupError')}
                          </Text>
                        )
                      },
                      allowableTypes
                    }}
                    label={getString(resourceGroupLabel)}
                  />
                  {getMultiTypeFromValue(getValue(formik.values?.resourceGroup)) === MultiTypeInputType.RUNTIME &&
                    !readonly && (
                      <SelectConfigureOptions
                        value={getValue(formik.values?.resourceGroup)}
                        type="String"
                        variableName="resourceGroup"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={
                          /* istanbul ignore next */ value => {
                            formik.setFieldValue('resourceGroup', value)
                          }
                        }
                        isReadonly={readonly}
                        className={css.marginTop}
                        loading={loadingResourceGroups}
                        options={resourceGroups}
                      />
                    )}
                </Layout.Horizontal>
                <Layout.Vertical className={css.inputWidth} spacing="small">
                  <MultiTypeTagSelector
                    name={'tags'}
                    allowableTypes={
                      canTagsHaveFixedValue
                        ? [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
                        : [MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
                    }
                    tags={azureTags}
                    isLoadingTags={loadingSubscriptionTags}
                    initialTags={initialValues?.tags}
                    className="tags-select"
                    expressions={expressions}
                    errorMessage={
                      get(subscriptionTagsError, errorMessage, '') ||
                      getString('cd.infrastructure.sshWinRmAzure.noTagsAzure')
                    }
                  />
                </Layout.Vertical>
                <Layout.Vertical className={cx(css.formRow, css.inputWidth, css.credentialsRef)}>
                  <MultiTypeSecretInput
                    name="credentialsRef"
                    type={getMultiTypeSecretInputType(initialValues.serviceType)}
                    label={getString('cd.steps.common.specifyCredentials')}
                    onSuccess={secret => {
                      if (secret) {
                        formikRef.current?.setFieldValue('credentialsRef', secret.referenceString)
                      }
                    }}
                    expressions={expressions}
                  />
                </Layout.Vertical>
                <Layout.Vertical className={css.inputWidth}>
                  <FormInput.Select
                    items={hostConnectionTypeOptions}
                    tooltipProps={{
                      dataTooltipId: 'sshWinrmAzureHostConnectionType'
                    }}
                    name={'hostConnectionType'}
                    label={getString('cd.infrastructure.sshWinRmAzure.hostConnectionType')}
                  />
                </Layout.Vertical>
              </Layout.Vertical>
              <Layout.Vertical className={css.simultaneousDeployment}>
                <FormInput.CheckBox
                  tooltipProps={{
                    dataTooltipId: 'pdcInfraAllowSimultaneousDeployments'
                  }}
                  name={'allowSimultaneousDeployments'}
                  label={getString('cd.allowSimultaneousDeployments')}
                  disabled={readonly}
                />
              </Layout.Vertical>
            </FormikForm>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}
