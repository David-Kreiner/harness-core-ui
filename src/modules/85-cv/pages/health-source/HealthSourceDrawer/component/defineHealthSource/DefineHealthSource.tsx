/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, { useCallback, useContext, useMemo } from 'react'
import {
  Card,
  Container,
  Formik,
  FormikForm,
  FormInput,
  getMultiTypeFromValue,
  Icon,
  IconName,
  Layout,
  MultiTypeInputType,
  Text
} from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { HealthSourcesType } from '@cv/constants'
import { BGColorWrapper } from '@cv/pages/health-source/common/StyledComponents'
import DrawerFooter from '@cv/pages/health-source/common/DrawerFooter/DrawerFooter'
import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import { Connectors } from '@connectors/constants'
import { HealthSourceTypes } from '@cv/pages/health-source/types'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { AllMultiTypeInputTypesForStep } from '@ci/components/PipelineSteps/CIStep/StepUtils'
import { FormConnectorReferenceField } from '@connectors/components/ConnectorReferenceField/FormConnectorReferenceField'
import {
  healthSourceTypeMapping,
  healthSourceTypeMappingForReferenceField
} from '@cv/pages/monitored-service/MonitoredServiceInputSetsTemplate/MonitoredServiceInputSetsTemplate.utils'
import CardWithOuterTitle from '@common/components/CardWithOuterTitle/CardWithOuterTitle'
import { initConfigurationsForm } from '@cv/pages/health-source/connectors/CommonHealthSource/CommonHealthSource.constants'
import { ConnectorRefFieldName, HEALTHSOURCE_LIST } from './DefineHealthSource.constant'
import {
  getFeatureOption,
  getInitialValues,
  validate,
  getConnectorTypeName,
  getConnectorPlaceholderText,
  canShowDataSelector,
  canShowDataInfoSelector,
  formValidation,
  getIsConnectorDisabled
} from './DefineHealthSource.utils'
import PrometheusDataSourceTypeSelector from './components/DataSourceTypeSelector/DataSourceTypeSelector'
import DataInfoSelector from './components/DataInfoSelector/DataInfoSelector'
import css from './DefineHealthSource.module.scss'

interface DefineHealthSourceProps {
  onSubmit?: (values: any) => void
  isTemplate?: boolean
  expressions?: string[]
}

function DefineHealthSource(props: DefineHealthSourceProps): JSX.Element {
  const { onSubmit, isTemplate, expressions } = props
  const { getString } = useStrings()
  const { onNext, sourceData } = useContext(SetupSourceTabsContext)
  const { orgIdentifier, projectIdentifier, accountId, templateType } = useParams<
    ProjectPathProps & { identifier: string; templateType?: string }
  >()
  const { isEdit } = sourceData

  const isSplunkMetricEnabled = useFeatureFlag(FeatureFlag.CVNG_SPLUNK_METRICS)
  const isErrorTrackingEnabled = useFeatureFlag(FeatureFlag.CVNG_ENABLED)
  const isElkEnabled = useFeatureFlag(FeatureFlag.ELK_HEALTH_SOURCE)
  const isDataSourceTypeSelectorEnabled = useFeatureFlag(FeatureFlag.SRM_ENABLE_HEALTHSOURCE_AWS_PROMETHEUS)
  const isCloudWatchEnabled = useFeatureFlag(FeatureFlag.SRM_ENABLE_HEALTHSOURCE_CLOUDWATCH_METRICS)
  const isSumoLogicEnabled = useFeatureFlag(FeatureFlag.SRM_SUMO)

  const disabledByFF: string[] = useMemo(() => {
    const disabledConnectorsList = []

    if (!isErrorTrackingEnabled) {
      disabledConnectorsList.push(HealthSourceTypes.ErrorTracking)
    }

    if (!isElkEnabled) {
      disabledConnectorsList.push(HealthSourceTypes.Elk)
    }

    if (!isCloudWatchEnabled) {
      disabledConnectorsList.push(HealthSourceTypes.CloudWatch)
    }

    if (!isSumoLogicEnabled) {
      disabledConnectorsList.push(HealthSourceTypes.SumoLogic)
    }
    return disabledConnectorsList
  }, [isErrorTrackingEnabled, isElkEnabled, isCloudWatchEnabled, isSumoLogicEnabled])

  const initialValues = useMemo(() => {
    return getInitialValues(sourceData, getString, isDataSourceTypeSelectorEnabled)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceData?.healthSourceIdentifier])

  const isCardSelected = useCallback((name, formik) => {
    if (formik?.values?.product?.value) {
      const features = getFeatureOption(name, getString, isSplunkMetricEnabled)
      return features.some(el => el?.value === formik.values.product.value)
    } else {
      if (name === Connectors.GCP && formik?.values?.sourceType === HealthSourcesType.Stackdriver) {
        return true
      }
      return name == formik?.values?.sourceType
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connectorData = useCallback(
    formik => {
      const { connectorRef, sourceType, dataSourceType } = formik?.values || {}

      return isTemplate ? (
        <FormMultiTypeConnectorField
          enableConfigureOptions={false}
          name={ConnectorRefFieldName}
          disabled={!sourceType}
          label={
            <Text color={Color.BLACK} font={'small'} margin={{ bottom: 'small' }}>
              {getString('connectors.selectConnector')}
            </Text>
          }
          placeholder={getString('cv.healthSource.connectors.selectConnector', {
            sourceType: healthSourceTypeMapping(sourceType)
          })}
          accountIdentifier={accountId}
          projectIdentifier={projectIdentifier}
          orgIdentifier={orgIdentifier}
          width={400}
          type={healthSourceTypeMapping(sourceType)}
          multiTypeProps={{ expressions, allowableTypes: AllMultiTypeInputTypesForStep }}
          onChange={(value: any) => {
            const connectorValue =
              value?.scope && value?.scope !== 'project'
                ? `${value.scope}.${value?.record?.identifier}`
                : value?.record?.identifier || value
            formik?.setFieldValue(ConnectorRefFieldName, connectorValue)
          }}
        />
      ) : (
        <FormConnectorReferenceField
          width={400}
          formik={formik}
          type={healthSourceTypeMappingForReferenceField(sourceType, dataSourceType)}
          name={ConnectorRefFieldName}
          label={
            <Text color={Color.BLACK} font={'small'} margin={{ bottom: 'small' }}>
              {getString('connectors.selectConnector')}
            </Text>
          }
          accountIdentifier={accountId}
          projectIdentifier={projectIdentifier}
          orgIdentifier={orgIdentifier}
          placeholder={getString('cv.healthSource.connectors.selectConnector', {
            sourceType: getConnectorPlaceholderText(sourceType, dataSourceType)
          })}
          disabled={getIsConnectorDisabled({
            isEdit,
            connectorRef,
            sourceType,
            dataSourceType,
            isDataSourceTypeSelectorEnabled
          })}
          tooltipProps={{ dataTooltipId: 'selectHealthSourceConnector' }}
        />
      )
    },
    [templateType]
  )

  const getDetails = (value: string) => {
    switch (getMultiTypeFromValue(value)) {
      case MultiTypeInputType.RUNTIME:
        return MultiTypeInputType.RUNTIME
      case MultiTypeInputType.EXPRESSION:
        return MultiTypeInputType.EXPRESSION
      default:
        return value
    }
  }

  const getDataSourceTypeSelector = (sourceType?: string): JSX.Element | null => {
    if (canShowDataSelector(sourceType, isDataSourceTypeSelectorEnabled)) {
      return <PrometheusDataSourceTypeSelector isEdit={isEdit} />
    }

    return null
  }

  const getDataInfoSelector = (sourceType?: string, dataSourceType?: string): JSX.Element | null => {
    if (canShowDataInfoSelector(sourceType, dataSourceType, isDataSourceTypeSelectorEnabled)) {
      return <DataInfoSelector isEdit={isEdit} />
    }

    return null
  }

  return (
    <BGColorWrapper>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        formName={'defineHealthsource'}
        validate={values => {
          return formValidation({
            values,
            isDataSourceTypeSelectorEnabled,
            isEdit,
            getString
          })
        }}
        validationSchema={validate(getString)}
        onSubmit={values => {
          onSubmit?.(values)
          let formValues = values
          if (sourceData.selectedDashboards && values?.connectorRef !== sourceData?.connectorRef) {
            formValues = { ...values, selectedDashboards: new Map() }
          }
          // formValues shoudl always be of defineHealthSource
          onNext(formValues, { tabStatus: 'SUCCESS' })
        }}
      >
        {formik => {
          const featureOption = getFeatureOption(formik?.values?.sourceType, getString, isSplunkMetricEnabled)
          return (
            <FormikForm className={css.formFullheight}>
              <CardWithOuterTitle title={getString('cv.healthSource.defineHealthSource')}>
                <>
                  <Text
                    color={Color.BLACK}
                    font={'small'}
                    margin={{ bottom: 'large' }}
                    tooltipProps={{ dataTooltipId: 'selectHealthSourceType' }}
                  >
                    {getString('cv.healthSource.selectHealthSource')}
                  </Text>
                  <FormInput.CustomRender
                    name={'sourceType'}
                    render={() => {
                      return (
                        <Layout.Horizontal
                          className={cx(css.healthSourceListContainer, {
                            [css.disabled]: isEdit
                          })}
                        >
                          {HEALTHSOURCE_LIST.filter(({ name }) => !disabledByFF.includes(name)).map(
                            ({ name, icon }) => {
                              const connectorTypeName = getConnectorTypeName(name)

                              return (
                                <div key={name} className={cx(css.squareCardContainer, isEdit && css.disabled)}>
                                  <Card
                                    disabled={false}
                                    interactive={true}
                                    selected={isCardSelected(connectorTypeName, formik)}
                                    cornerSelected={isCardSelected(connectorTypeName, formik)}
                                    className={css.squareCard}
                                    onClick={() => {
                                      const featureOptionConnectorType = getFeatureOption(
                                        connectorTypeName,
                                        getString,
                                        isSplunkMetricEnabled
                                      )
                                      formik.setValues((currentValues: any) => {
                                        if (!currentValues) {
                                          return {}
                                        }

                                        return {
                                          ...currentValues,
                                          sourceType: connectorTypeName,
                                          dataSourceType: null,
                                          product:
                                            featureOptionConnectorType.length === 1
                                              ? featureOptionConnectorType[0]
                                              : '',
                                          [ConnectorRefFieldName]: null
                                        }
                                      })
                                    }}
                                  >
                                    <Icon name={icon as IconName} size={26} height={26} />
                                  </Card>
                                  <Text
                                    className={css.healthSourceName}
                                    style={{
                                      color: name === formik.values.sourceType ? 'var(--grey-900)' : 'var(--grey-350)'
                                    }}
                                  >
                                    {name}
                                  </Text>
                                </div>
                              )
                            }
                          )}
                        </Layout.Horizontal>
                      )
                    }}
                  />
                  <Container margin={{ bottom: 'large' }} width={'400px'} color={Color.BLACK}>
                    <FormInput.InputWithIdentifier
                      isIdentifierEditable={!isEdit}
                      inputName="healthSourceName"
                      inputLabel={getString('cv.healthSource.nameLabel')}
                      inputGroupProps={{
                        placeholder: getString('cv.healthSource.namePlaceholder')
                      }}
                      idName="healthSourceIdentifier"
                    />
                  </Container>
                  <Text font={'small'} color={Color.BLACK}>
                    {getString('cv.healthSource.seriveEnvironmentNote', {
                      service: templateType ? getDetails(formik?.values?.serviceRef) : formik?.values?.serviceRef,
                      environment: templateType
                        ? getDetails(formik?.values?.environmentRef)
                        : formik?.values?.environmentRef
                    })}
                  </Text>
                </>
              </CardWithOuterTitle>
              <CardWithOuterTitle title={getString('cv.healthSource.connectHealthSource')}>
                <>
                  {getDataSourceTypeSelector(formik?.values?.sourceType)}

                  <Container margin={{ bottom: 'large' }} width={'400px'}>
                    <div className={css.connectorField}>{connectorData(formik)}</div>
                  </Container>
                  <Container margin={{ bottom: 'large' }} width={'400px'}>
                    <Text
                      color={Color.BLACK}
                      font={'small'}
                      margin={{ bottom: 'small' }}
                      tooltipProps={{ dataTooltipId: 'selectFeature' }}
                    >
                      {featureOption.length === 1
                        ? getString('common.purpose.cf.feature')
                        : getString('cv.healthSource.featureLabel')}
                    </Text>
                    <FormInput.Select
                      items={featureOption}
                      placeholder={getString('cv.healthSource.featurePlaceholder', {
                        sourceType: formik?.values?.sourceType
                      })}
                      value={formik?.values?.product}
                      name="product"
                      disabled={isEdit || featureOption.length === 1}
                      onChange={product => {
                        // resetting the configurations page whenever product is changed
                        const newValues = {
                          ...formik.values,
                          product,
                          ...initConfigurationsForm
                        }
                        formik.setValues(newValues)
                      }}
                    />
                  </Container>

                  {getDataInfoSelector(formik?.values?.sourceType, formik?.values?.dataSourceType)}
                </>
              </CardWithOuterTitle>
              <DrawerFooter onNext={() => formik.submitForm()} />
            </FormikForm>
          )
        }}
      </Formik>
    </BGColorWrapper>
  )
}

export default DefineHealthSource
