/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { Color, FontVariation, Layout, Switch, Text, VisualYamlSelectedView as SelectedView } from '@harness/uicore'

import { useStrings } from 'framework/strings'

interface TitleWithSwitchProps {
  isTriggerRbacDisabled: boolean
  selectedView: SelectedView
  enabledStatus: boolean
  setEnabledStatus: (enabledStatus: boolean) => void
  triggerHeading: string
}

export default function TitleWithSwitch({
  triggerHeading,
  isTriggerRbacDisabled,
  selectedView,
  enabledStatus,
  setEnabledStatus
}: TitleWithSwitchProps): JSX.Element {
  const { getString } = useStrings()

  return (
    <Layout.Horizontal
      spacing="medium"
      padding={{
        left: 'xlarge',
        top: 'xsmall',
        right: 'huge'
      }}
      flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}
    >
      <Text
        color={Color.GREY_800}
        font={{ weight: 'bold', variation: FontVariation.H4 }}
        padding={{ right: 'small' }}
        lineClamp={1}
      >
        {triggerHeading}
      </Text>
      {selectedView !== SelectedView.YAML && (
        <Switch
          key={Date.now()}
          label={getString('enabledLabel')}
          disabled={isTriggerRbacDisabled}
          data-name="enabled-switch"
          checked={enabledStatus}
          onChange={() => setEnabledStatus(!enabledStatus)}
        />
      )}
    </Layout.Horizontal>
  )
}
