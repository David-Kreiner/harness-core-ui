/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Button, Layout, Text } from '@harness/uicore'
import React, { useState } from 'react'
import cx from 'classnames'
import type { StringKeys } from 'framework/strings'

import nodejs from '@cf/images/icons/nodejs.svg'
import android from '@cf/images/icons/android.svg'
import dotnet from '@cf/images/icons/dotnet.svg'
import golang from '@cf/images/icons/golang.svg'
import ios from '@cf/images/icons/ios.svg'
import java from '@cf/images/icons/java.svg'
import javascript from '@cf/images/icons/javascript.svg'
import python from '@cf/images/icons/python.svg'
import php from '@cf/images/icons/php.svg'
import ruby from '@cf/images/icons/ruby.svg'
import xamarin from '@cf/images/icons/xamarin.svg'
import flutter from '@cf/images/icons/flutter.svg'
import reactNative from '@cf/images/icons/react.svg'
import css from './LanguageSelection.module.scss'

export enum PlatformEntryType {
  CLIENT = 'client',
  SERVER = 'server'
}

export interface PlatformEntry {
  name: string
  icon: string
  type: PlatformEntryType
  readmeStringId: StringKeys
  disabled?: boolean
}

export const SupportPlatforms = [
  {
    name: 'NodeJS',
    icon: nodejs,
    type: PlatformEntryType.SERVER,
    readmeStringId: 'cf.onboarding.readme.nodejs'
  },
  {
    name: 'Java',
    icon: java,
    type: PlatformEntryType.SERVER,
    readmeStringId: 'cf.onboarding.readme.java'
  },
  {
    name: 'Golang',
    icon: golang,
    type: PlatformEntryType.SERVER,
    readmeStringId: 'cf.onboarding.readme.golang'
  },
  {
    name: 'PHP',
    icon: php,
    type: PlatformEntryType.SERVER,
    readmeStringId: 'cf.onboarding.readme.php'
  },
  {
    name: 'Ruby',
    icon: ruby,
    type: PlatformEntryType.SERVER,
    readmeStringId: 'cf.onboarding.readme.ruby'
  },
  {
    name: 'Xamarin',
    icon: xamarin,
    type: PlatformEntryType.CLIENT,
    readmeStringId: 'cf.onboarding.readme.xamarinAndroid'
  },
  {
    name: 'Flutter',
    icon: flutter,
    type: PlatformEntryType.CLIENT,
    readmeStringId: 'cf.onboarding.readme.flutter'
  },
  {
    name: 'React Native',
    icon: reactNative,
    type: PlatformEntryType.CLIENT,
    readmeStringId: 'cf.onboarding.readme.reactNative'
  },
  {
    name: '.NET',
    icon: dotnet,
    type: PlatformEntryType.SERVER,
    readmeStringId: 'cf.onboarding.readme.dotnet'
  },
  {
    name: 'Python',
    icon: python,
    type: PlatformEntryType.SERVER,
    readmeStringId: 'cf.onboarding.readme.python'
  },
  {
    name: 'JavaScript',
    icon: javascript,
    type: PlatformEntryType.CLIENT,
    readmeStringId: 'cf.onboarding.readme.javascript'
  },
  {
    name: 'Android',
    icon: android,
    type: PlatformEntryType.CLIENT,
    readmeStringId: 'cf.onboarding.readme.android'
  },
  {
    name: 'iOS',
    icon: ios,
    type: PlatformEntryType.CLIENT,
    readmeStringId: 'cf.onboarding.readme.ios'
  }
].sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)) as Array<PlatformEntry>

export interface LanguageSelectionProps {
  selected: PlatformEntry | undefined
  onSelect: (entry: PlatformEntry) => void
}

export const LanguageSelection: React.FC<LanguageSelectionProps> = ({ selected, onSelect }) => {
  const [selectedEntry, setSelectedEntry] = useState<PlatformEntry | undefined>(selected)

  return (
    <ul className={css.list}>
      {SupportPlatforms.filter(entry => !entry.disabled).map(entry => {
        const { name, icon } = entry
        return (
          <li key={name} className={css.item}>
            <Layout.Vertical spacing="small">
              <Button
                data-testid="selectLanguageBtn"
                aria-label={name}
                noStyling
                className={cx(css.button, selectedEntry?.name === name && css.selected)}
                onClick={() => {
                  setSelectedEntry(entry)
                  onSelect(entry)
                }}
              >
                <img src={icon} alt={name} width={35} height={35} />
              </Button>
              <Text inline style={{ fontWeight: 500, color: '#555770', fontSize: '12px', textAlign: 'center' }}>
                {name}
              </Text>
            </Layout.Vertical>
          </li>
        )
      })}
    </ul>
  )
}
