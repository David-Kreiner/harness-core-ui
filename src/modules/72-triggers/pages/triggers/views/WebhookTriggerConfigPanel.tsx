/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import cx from 'classnames'
import { Layout, FormInput, SelectOption, Text, HarnessDocTooltip, PageSpinner } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { isEmpty } from 'lodash-es'
import { useGetGitTriggerEventDetails } from 'services/pipeline-ng'
import { NameIdDescriptionTags } from '@common/components'
import { useStrings } from 'framework/strings'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import WebhookSecretInputWithDialog from '@triggers/components/steps/WebhookTriggerConfigPanel/WebhookSecretInputWithDialog'
import { GitSourceProviders, getSourceRepoOptions } from '../utils/TriggersListUtils'
import {
  renderNonCustomEventFields,
  getEventAndActions,
  clearEventsAndActions
} from '../utils/WebhookTriggerConfigPanelUtils'
import css from './WebhookTriggerConfigPanel.module.scss'

export interface WebhookTriggerConfigPanelPropsInterface {
  formikProps?: any
  isEdit?: boolean
}

const WebhookTriggerConfigPanel: React.FC<WebhookTriggerConfigPanelPropsInterface> = ({
  formikProps,
  isEdit = false
}) => {
  const { sourceRepo, identifier, actions, event, connectorRef } = formikProps.values
  const {
    data: eventDetailsResponse,
    refetch: refetchEventDetails,
    error: eventDetailsError,
    loading: loadingGetGitTriggerEventDetails
  } = useGetGitTriggerEventDetails({
    lazy: true
  })

  const [eventOptions, setEventOptions] = useState<SelectOption[]>([])
  const [actionsOptions, setActionsOptions] = useState<SelectOption[]>([])
  const [actionsOptionsMap, setActionsOptionsMap] = useState<{ [key: string]: string[] }>({})
  const { getString } = useStrings()
  const isGitWebhookPollingEnabled = useFeatureFlag(FeatureFlag.GIT_WEBHOOK_POLLING)
  const loading = false

  useEffect(() => {
    if (eventDetailsResponse?.data && !isEmpty(eventDetailsResponse.data) && sourceRepo && !eventDetailsError) {
      const { eventOptions: newEventOptions, actionsOptionsMap: newActionsOptionsMap } = getEventAndActions({
        data: eventDetailsResponse?.data,
        sourceRepo
      })

      setEventOptions(newEventOptions)
      setActionsOptionsMap(newActionsOptionsMap)

      if (event) {
        clearEventsAndActions({ newActionsOptionsMap, formikProps, setActionsOptions, event })
      }
    }
  }, [eventDetailsResponse?.data, sourceRepo])

  useEffect(() => {
    if (!isEmpty(actionsOptionsMap) && event) {
      const newActionsOptions = actionsOptionsMap[event]?.map(val => ({ label: val, value: val }))
      setActionsOptions(newActionsOptions)
    }
  }, [event, actions])

  useEffect(() => {
    if (sourceRepo !== GitSourceProviders.CUSTOM.value && !eventDetailsResponse && !loadingGetGitTriggerEventDetails) {
      refetchEventDetails()
    }
  }, [sourceRepo])

  useEffect(() => {
    if (event && identifier && connectorRef) {
      // handle lack of validating when value present
      // identifier/connector needed otherwise page crash when event clicked first
      formikProps.validateForm()
    }
    if (
      Object.keys(formikProps.errors)?.includes('connectorRef') && // check that this does not break for keys of
      !Object.keys(formikProps.touched)?.includes('connectorRef') &&
      formikProps.submitCount === 0
    ) {
      const newErrors = { ...formikProps.errors }
      delete newErrors.connectorRef
      formikProps.setErrors(newErrors)
    }
  }, [event, formikProps.errors])

  return (
    <Layout.Vertical className={css.webhookConfigurationContainer} padding="xxlarge">
      {loading && (
        <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
          <PageSpinner />
        </div>
      )}
      <Text className={css.formContentTitle} inline={true} data-tooltip-id="triggerConfigurationLabel">
        {getString('triggers.triggerConfigurationLabel')}
        {!isEdit ? `: ${getString('triggers.onNewWebhookTitle')}` : ''}
        <HarnessDocTooltip tooltipId="triggerConfigurationLabel" useStandAlone={true} />
      </Text>

      <div className={css.formContent}>
        <NameIdDescriptionTags
          className={cx(css.nameIdDescriptionTags, css.bottomMarginZero)}
          formikProps={formikProps}
          identifierProps={{
            isIdentifierEditable: !isEdit
          }}
          tooltipProps={{
            dataTooltipId: 'webhookTrigger'
          }}
        />
      </div>
      <Text className={css.formContentTitle} inline={true} data-tooltip-id="listenOnNewWebhook">
        {getString('triggers.triggerConfigurationPanel.listenOnNewWebhook')}
        <HarnessDocTooltip tooltipId="listenOnNewWebhook" useStandAlone={true} />
      </Text>
      <div className={css.formContent}>
        <section style={{ width: '650px' }}>
          <FormInput.Select
            label={
              <Text color={Color.GREY_600} font={{ variation: FontVariation.FORM_INPUT_TEXT, weight: 'semi-bold' }}>
                {getString('triggers.triggerConfigurationPanel.payloadType')}
              </Text>
            }
            name="sourceRepo"
            className={cx(sourceRepo === GitSourceProviders.CUSTOM.value && css.bottomMarginZero)}
            items={getSourceRepoOptions(getString)}
            disabled={true}
          />
          {sourceRepo !== GitSourceProviders.CUSTOM.value &&
            renderNonCustomEventFields({
              sourceRepo,
              formikProps,
              event,
              eventOptions,
              getString,
              actionsOptions,
              actions,
              isGitWebhookPollingEnabled
            })}
          {sourceRepo === GitSourceProviders.GITHUB.value && <WebhookSecretInputWithDialog formikProps={formikProps} />}
        </section>
      </div>
    </Layout.Vertical>
  )
}
export default WebhookTriggerConfigPanel
