/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Button, Container, FormInput, Layout, Text, TextInput } from '@harness/uicore'
import React, { useCallback } from 'react'
import HorizontalLineWithText from '@cv/components/HorizontalLineWithText/HorizontalLineWithText'
import { useStrings } from 'framework/strings'
import type { NotificationRuleRowProps } from './SLONotificationRuleRow.types'
import { getValueFromEvent } from './SLONotificationRuleRow.utils'
import { SLOCondition, sloConditionOptions } from './SLONotificationRuleRow.constants'
import css from './SLONotificationRuleRow.module.scss'

export default function SLONotificationRuleRow({
  notificationRule,
  showDeleteNotificationsIcon,
  handleDeleteNotificationRule,
  handleChangeField,
  index
}: NotificationRuleRowProps): JSX.Element {
  const { getString } = useStrings()
  const { threshold, lookBackDuration, id, condition } = notificationRule || {}

  const handleThresholdChange = useCallback(
    e => {
      handleChangeField(notificationRule, getValueFromEvent(e), 'threshold', 'lookBackDuration', lookBackDuration)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lookBackDuration, notificationRule]
  )

  const renderThresholdField = (idx: number): JSX.Element => {
    switch (condition?.value) {
      case SLOCondition.ERROR_BUDGET_REMAINING_MINUTES:
        return (
          <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
            <Text>{'Value (min)'}</Text>
            <TextInput
              required
              type="number"
              placeholder={'min'}
              min={0}
              value={threshold as string}
              name={`${idx}.threshold`}
              className={css.numberField}
              onChange={handleThresholdChange}
            />
          </Layout.Vertical>
        )
      case SLOCondition.ERROR_BUDGET_BURN_RATE_IS_ABOVE:
        return (
          <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
            <Text>{'Value (%)'}</Text>
            <TextInput
              required
              type="number"
              placeholder={'%'}
              min={0}
              value={threshold as string}
              name={`${idx}.threshold`}
              className={css.numberField}
              onChange={handleThresholdChange}
            />
          </Layout.Vertical>
        )
      case SLOCondition.ERROR_BUDGET_REMAINING_PERCENTAGE:
        return (
          <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
            <Text>{'Value (%)'}</Text>
            <TextInput
              required
              type="number"
              placeholder={'%'}
              min={0}
              max={100}
              value={threshold as string}
              name={`${idx}.threshold`}
              className={css.numberField}
              onChange={handleThresholdChange}
            />
          </Layout.Vertical>
        )
      default:
        return <></>
    }
  }

  return (
    <>
      <Layout.Horizontal padding={{ top: 'large' }} key={id} spacing="medium">
        <Layout.Vertical spacing="xsmall" padding={{ right: 'small' }}>
          <Text>{getString('cv.notifications.condition')}</Text>

          <FormInput.Select
            name={`conditions.${index}.condition`}
            data-name="condition"
            className={css.sloConditionField}
            value={condition}
            items={sloConditionOptions}
            onChange={option => {
              handleChangeField(notificationRule, option, 'condition', 'threshold', threshold)
            }}
          />
        </Layout.Vertical>
        {threshold ? renderThresholdField(index) : null}
        {lookBackDuration && condition?.value === SLOCondition.ERROR_BUDGET_BURN_RATE_IS_ABOVE ? (
          <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
            <Text>{'Lookback Duration (min)'}</Text>
            <TextInput
              required
              type="number"
              min={0}
              placeholder="min"
              value={lookBackDuration as string}
              name={`${index}.lookBackDuration`}
              className={css.numberField}
              onChange={e => {
                handleChangeField(notificationRule, getValueFromEvent(e), 'lookBackDuration')
              }}
            />
          </Layout.Vertical>
        ) : null}
        {showDeleteNotificationsIcon ? (
          <Container padding={{ top: 'large' }}>
            <Button
              data-name="trash"
              icon="main-trash"
              iconProps={{ size: 20 }}
              minimal
              onClick={() => handleDeleteNotificationRule(notificationRule.id)}
            />
          </Container>
        ) : null}
      </Layout.Horizontal>
      <Container padding={{ top: 'small' }}>
        <HorizontalLineWithText text={'OR'} />
      </Container>
    </>
  )
}
