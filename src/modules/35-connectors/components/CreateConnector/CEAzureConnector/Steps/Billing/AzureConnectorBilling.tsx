/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Layout,
  Text,
  Formik,
  FormikForm,
  FormInput,
  Icon,
  Button,
  StepProps,
  Container,
  ButtonSize,
  ButtonVariation
} from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import * as Yup from 'yup'
import { get } from 'lodash-es'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import type { BillingExportSpec, CEAzureConnector } from 'services/cd-ng'
import { CE_AZURE_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { connectorHelperUrls } from '@connectors/constants'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import ConnectorInstructionList from '@connectors/common/ConnectorCreationInstructionList/ConnectorCreationInstructionList'
import ShowExistingBillingExports from './AzureExistingBillingExports'
import { CEAzureDTO, guidRegex } from '../Overview/AzureConnectorOverview'
import css from '../../CreateCeAzureConnector_new.module.scss'

const storageAccountNameTest = (value: string) => {
  const regex = /^[a-z0-9]*$/
  const regexTest = regex.test(value)
  const lengthTest = value && value.length >= 3 && value.length <= 24
  return !!(lengthTest && regexTest)
}

const BillingExport: React.FC<StepProps<CEAzureDTO>> = props => {
  const { getString } = useStrings()
  const { prevStepData, previousStep, nextStep } = props
  const billingExportSpec = prevStepData?.spec.billingExportSpec
  const [showBillingExportForm, setShowBillingExportForm] = useState(
    !!prevStepData?.hasBilling || !(prevStepData?.existingBillingExports || []).length
  )

  useStepLoadTelemetry(CE_AZURE_CONNECTOR_CREATION_EVENTS.LOAD_AZURE_BILLING_EXPORT)

  const handleSubmit = (formData: BillingExportSpec) => {
    const nextStepData: CEAzureDTO = {
      ...((prevStepData || {}) as CEAzureDTO),
      spec: {
        ...((prevStepData?.spec || {}) as CEAzureConnector)
      }
    }

    if (showBillingExportForm) {
      nextStepData.spec.billingExportSpec = { ...formData }

      const features = [...(prevStepData!.spec?.featuresEnabled || [])]
      if (!features.includes('BILLING')) {
        nextStepData.spec.featuresEnabled = features.concat('BILLING')
        nextStepData.hasBilling = true
      }
    }

    nextStep?.(nextStepData)
  }

  const renderForm = () => {
    const FORM_INPUTS = [
      {
        name: 'storageAccountName',
        label: getString('connectors.ceAzure.billing.storageAccountName')
      },
      {
        name: 'subscriptionId',
        label: getString('connectors.ceAzure.billing.subscriptionId'),
        placeholder: getString('connectors.ceAzure.guidPlaceholder')
      },
      {
        name: 'containerName',
        label: getString('connectors.ceAzure.billing.containerName')
      },
      {
        name: 'directoryName',
        label: getString('connectors.ceAzure.billing.directoryName')
      },
      {
        name: 'reportName',
        label: getString('connectors.ceAzure.billing.reportName')
      }
    ]

    return (
      <Container style={{ minHeight: 385 }}>
        <Container className={cx(css.main, css.dataFields)}>
          {FORM_INPUTS.map(({ label, ...rest }, idx) => {
            return <FormInput.Text key={idx} {...rest} label={label} tooltipProps={{ dataTooltipId: rest.name }} />
          })}
        </Container>
      </Container>
    )
  }

  const renderBillingExports = () => {
    return (
      <Container style={{ minHeight: 430 }}>
        <Layout.Vertical className={css.existingReportsWrapper}>
          <ShowExistingBillingExports existingBillingExports={prevStepData?.existingBillingExports || []} />
          <ul>
            <li className={css.hintsLineItem}>
              {getString('connectors.ceAzure.existingExports.hints.nextStepHint1', {
                subscriptionId: prevStepData?.spec.subscriptionId
              })}
            </li>
            <li className={css.hintsLineItem}>
              {getString('connectors.ceAzure.existingExports.hints.nextStepHint2')}
              <Button
                rightIcon="chevron-right"
                text={getString('connectors.ceAzure.existingExports.createNewExportBtn')}
                onClick={() => {
                  setShowBillingExportForm(true)
                }}
                size={ButtonSize.SMALL}
                variation={ButtonVariation.SECONDARY}
              />
            </li>
          </ul>
        </Layout.Vertical>
      </Container>
    )
  }

  const getSchemaValidations = () => {
    if (!showBillingExportForm) return undefined
    return Yup.object().shape({
      storageAccountName: Yup.string()
        .required(getString('connectors.ceAzure.validation.storageAccountName'))
        .test(
          'storageAccountName',
          getString('connectors.ceAzure.billing.storageAccountNameRegexError'),
          storageAccountNameTest
        ),
      directoryName: Yup.string().required(getString('connectors.ceAzure.validation.directoryName')),
      containerName: Yup.string().required(getString('connectors.ceAzure.validation.containerName')),
      reportName: Yup.string().required(getString('connectors.ceAzure.validation.reportName')),
      subscriptionId: Yup.string()
        .required(getString('connectors.ceAzure.validation.subscriptionId'))
        .test('subscriptionId', getString('connectors.ceAzure.guidRegexError'), guidRegex)
    })
  }

  const instructionsList = [
    {
      type: 'button',
      text: 'connectors.ceAzure.billing.launchAzureConsole',
      icon: 'main-share',
      url: connectorHelperUrls.ceAzureLaunchConsole,
      listClassName: 'btnInstruction'
    },
    {
      type: 'text',
      text: 'connectors.ceAzure.billing.instructions.i1'
    },
    {
      type: 'hybrid',
      renderer: function instructionRenderer() {
        return (
          <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_800}>
            {getString('connectors.ceAzure.billing.instructions.i2')}
            <a href={connectorHelperUrls.ceAzureBillingExport} target="_blank" rel="noreferrer">
              {getString('connectors.ceAzure.billing.instructions.i3')}
              <Icon name="main-share" size={16} color={Color.PRIMARY_7} />
            </a>
          </Text>
        )
      }
    },
    {
      type: 'text',
      text: 'connectors.ceAzure.billing.instructions.i4'
    }
  ]

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.AzureConnectorBillingLoad, {
    category: Category.CONNECTOR
  })

  return (
    <Layout.Vertical className={css.stepContainer}>
      <Text
        font={{ variation: FontVariation.H3 }}
        tooltipProps={{ dataTooltipId: 'azureBillingExport' }}
        margin={{ bottom: 'large' }}
      >
        {getString('connectors.ceAzure.billing.heading')}
      </Text>
      <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_600} padding={{ bottom: 'medium' }}>
        {getString('connectors.ceAzure.billing.subHeading')}
      </Text>
      {showBillingExportForm && <ConnectorInstructionList instructionsList={instructionsList} />}
      <Container>
        <Formik<BillingExportSpec>
          onSubmit={formData => {
            trackEvent(ConnectorActions.AzureConnectorBillingSubmit, {
              category: Category.CONNECTOR
            })
            handleSubmit(formData)
          }}
          formName="billingExportsForm"
          validationSchema={getSchemaValidations()}
          initialValues={{
            storageAccountName: billingExportSpec?.storageAccountName || '',
            subscriptionId: billingExportSpec?.subscriptionId || get(prevStepData, 'spec.subscriptionId') || '',
            containerName: billingExportSpec?.containerName || '',
            directoryName: billingExportSpec?.directoryName || '',
            reportName: billingExportSpec?.reportName || ''
          }}
        >
          {() => {
            return (
              <FormikForm style={{ padding: '10px 0 25px' }}>
                {showBillingExportForm ? renderForm() : renderBillingExports()}
                <Layout.Horizontal spacing="medium">
                  <Button
                    text={getString('previous')}
                    icon="chevron-left"
                    onClick={() => {
                      previousStep?.(prevStepData)
                    }}
                  />
                  <Button type="submit" intent="primary" rightIcon="chevron-right" disabled={false}>
                    {getString('continue')}
                  </Button>
                </Layout.Horizontal>
              </FormikForm>
            )
          }}
        </Formik>
      </Container>
    </Layout.Vertical>
  )
}

export default BillingExport
