/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { Container, Heading, Layout, Text, RadioButtonGroup } from '@harness/uicore'
import { StringKeys, useStrings } from 'framework/strings'
import type { ApiKey, Feature } from 'services/cf'
import { LanguageSelection, PlatformEntry } from '@cf/components/LanguageSelection/LanguageSelection'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, FeatureActions } from '@common/constants/TrackingConstants'
import { OnboardingSelectedFlag } from '../OnboardingSelectedFlag'
import { SetUpAppInfoView } from './SetUpAppInfoView'
import { SelectEnvironmentView } from './SelectEnvironmentView'
import { SetUpYourCodeView } from './SetUpYourCodeView'
import css from './SetUpYourApplicationView.module.scss'

export interface SetUpYourApplicationViewProps {
  flagInfo: Feature
  language: PlatformEntry | undefined
  setLanguage: (language: PlatformEntry) => void
  apiKey: ApiKey | undefined
  setApiKey: (key: ApiKey | undefined) => void
  setEnvironmentIdentifier: (environmentIdentifier: string | undefined) => void
}

export const SetUpYourApplicationView: React.FC<SetUpYourApplicationViewProps> = props => {
  const { flagInfo } = props
  const { getString } = useStrings()
  const [language, setLanguage] = useState<PlatformEntry | undefined>(props.language)
  const [apiKey, setApiKey] = useState<ApiKey | undefined>(props.apiKey)
  const { trackEvent } = useTelemetry()
  const [currentOption, setCurrentOption] = useState<StringKeys>('cf.onboarding.android')
  const [currentReadme, setcurrentReadme] = useState<StringKeys>('cf.onboarding.readme.xamarinAndroid')

  useEffect(() => {
    trackEvent(FeatureActions.SetUpYourApplicationView, {
      category: Category.FEATUREFLAG
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Container height="100%">
      <Container className={css.container} width="calc(100% - 400px)" height="calc(100vh - 140px)">
        {flagInfo && <OnboardingSelectedFlag selectedFlag={flagInfo} />}
        <Heading level={2} className={css.setUpLabel}>
          {getString('cf.onboarding.setupLabel')}
        </Heading>
        <Container>
          <Layout.Vertical spacing="xsmall">
            <Text className={css.selectLanguage}>{getString('cf.onboarding.selectLanguage')}</Text>
            <Container className={css.languageSelectionContainer}>
              <LanguageSelection
                selected={language}
                onSelect={entry => {
                  trackEvent(FeatureActions.LanguageSelect, {
                    category: Category.FEATUREFLAG,
                    language: entry
                  })
                  setLanguage(entry)
                  props.setLanguage(entry)
                  setApiKey(undefined)
                  props.setApiKey(undefined)
                }}
              />
            </Container>
          </Layout.Vertical>
        </Container>

        {language && (
          <SelectEnvironmentView
            apiKey={apiKey}
            setApiKey={key => {
              setApiKey(key)
              props.setApiKey(key)
            }}
            setEnvironmentIdentifier={environmentIdentifier => {
              props.setEnvironmentIdentifier(environmentIdentifier)
            }}
            language={language}
          />
        )}

        {language && apiKey && (
          <Container margin={{ top: 'large' }}>
            <Layout.Vertical spacing="xsmall">
              <Text className={css.setUpYourCode}>{getString('cf.onboarding.setUpYourCode')}</Text>
              <Container className={css.setUpYourCodeContainer}>
                {language.name === getString('cf.onboarding.android') ||
                  (getString('cf.onboarding.ios') && (
                    <RadioButtonGroup
                      padding={{ top: 'small' }}
                      asPills
                      selectedValue={currentOption}
                      onChange={() => {
                        if (currentOption === 'cf.onboarding.android') {
                          setCurrentOption('cf.onboarding.ios')
                          setcurrentReadme('cf.onboarding.readme.xamarinIOS')
                        } else {
                          setCurrentOption('cf.onboarding.android')
                          setcurrentReadme('cf.onboarding.readme.xamarinAndroid')
                        }
                      }}
                      options={[
                        {
                          label: getString('cf.onboarding.android'),
                          value: 'cf.onboarding.android'
                        },
                        {
                          label: getString('cf.onboarding.ios'),
                          value: 'cf.onboarding.ios'
                        }
                      ]}
                    />
                  ))}
                <SetUpYourCodeView
                  apiKey={apiKey}
                  language={language}
                  flagName={flagInfo.name}
                  readmeOverrideString={currentReadme}
                />
              </Container>
            </Layout.Vertical>
          </Container>
        )}
      </Container>
      <SetUpAppInfoView />
    </Container>
  )
}
