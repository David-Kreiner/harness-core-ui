/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Icon, Text } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { ModuleName } from 'framework/types/ModuleName'
import useNavModuleInfo from '@common/hooks/useNavModuleInfo'
import css from './ModuleRenderer.module.scss'

const DefaultRenderer: React.FC = () => {
  const { getString } = useStrings()
  const { CVNG_ENABLED, CING_ENABLED, CENG_ENABLED, CFNG_ENABLED, CHAOS_ENABLED, CET_ENABLED } = useFeatureFlags()
  const { licenseInformation } = useLicenseStore()
  const { shouldVisible } = useNavModuleInfo(ModuleName.CD)
  return (
    <Layout.Vertical padding={{ top: 'xlarge' }} className={css.started}>
      <Text font={{ variation: FontVariation.TINY_SEMI }} color={Color.GREY_400} padding={{ bottom: 'xsmall' }}>
        {getString('modules')}
      </Text>
      <Layout.Horizontal spacing="small">
        {shouldVisible ? <Icon name="cd-main" size={20} /> : null}
        {CING_ENABLED ? <Icon name="ci-main" size={20} /> : null}
        {CFNG_ENABLED ? <Icon name="cf-main" size={20} /> : null}
        {CENG_ENABLED ? <Icon name="ce-main" size={20} /> : null}
        {CVNG_ENABLED ? <Icon name="cv-main" size={20} /> : null}
        {CHAOS_ENABLED ? <Icon name="chaos-main" size={20} /> : null}
        {licenseInformation['STO']?.status === 'ACTIVE' ? <Icon name="sto-color-filled" size={20} /> : null}
        {CET_ENABLED ? <Icon name="cet" size={20} /> : null}
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

export default DefaultRenderer
