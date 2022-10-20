/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useToaster } from '@harness/uicore'
import pick from 'lodash-es/pick'
import { StartTrialTemplate } from '@rbac/components/TrialHomePageTemplate/StartTrialTemplate'
import { useStrings } from 'framework/strings'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import type { AccountPathProps, Module } from '@common/interfaces/RouteInterfaces'
import { handleUpdateLicenseStore, useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { useQueryParams } from '@common/hooks'
import { Editions, ModuleLicenseType } from '@common/constants/SubscriptionTypes'
import { ResponseModuleLicenseDTO, useStartFreeLicense, useStartTrialLicense } from 'services/cd-ng'
import useChaosTrialModal from '@chaos/modals/ChaosTrialModal/useChaosTrialModal'
import routes from '@common/RouteDefinitions'
import bgImageURL from '../../images/chaos.svg'

const ChaosTrialHomePage: React.FC = () => {
  const { getString } = useStrings()
  const history = useHistory()

  const { accountId } = useParams<AccountPathProps>()
  const { licenseInformation, updateLicenseStore } = useLicenseStore()
  const { experience } = useQueryParams<{ experience?: ModuleLicenseType }>()
  const isFreeEnabled = useFeatureFlag(FeatureFlag.FREE_PLAN_ENABLED)
  const module = 'chaos'
  const moduleType = 'CHAOS'

  const { mutate: startTrial } = useStartTrialLicense({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: startFreePlan } = useStartFreeLicense({
    queryParams: {
      accountIdentifier: accountId,
      moduleType
    },
    requestOptions: {
      headers: {
        'content-type': 'application/json'
      }
    }
  })

  function getExperience(): ModuleLicenseType {
    if (experience) {
      return experience
    }
    return isFreeEnabled ? ModuleLicenseType.FREE : ModuleLicenseType.TRIAL
  }

  const { showModal, hideModal } = useChaosTrialModal({
    onContinue: () => {
      hideModal()
      history.push(
        routes.toChaos({
          accountId
        })
      )
    },
    experience: getExperience()
  })

  const { showError } = useToaster()

  function startPlan(): Promise<ResponseModuleLicenseDTO> {
    return isFreeEnabled ? startFreePlan() : startTrial({ moduleType, edition: Editions.ENTERPRISE })
  }

  const handleStartTrial = async (): Promise<void> => {
    try {
      const data = await startPlan()

      const expiryTime = data?.data?.expiryTime

      const updatedLicenseInfo = data?.data && {
        ...licenseInformation?.[moduleType],
        ...pick(data?.data, ['licenseType', 'edition']),
        expiryTime
      }

      handleUpdateLicenseStore({ ...licenseInformation }, updateLicenseStore, module as Module, updatedLicenseInfo)
      showModal()
    } catch (error: any) {
      showError(error.data?.message)
    }
  }

  const startBtnDescription = isFreeEnabled
    ? getString('common.startFreePlan', { module: moduleType })
    : getString('chaos.chaosTrialHomePage.description')

  const startTrialProps = {
    description: getString('chaos.homepage.slogan'),
    learnMore: {
      description: getString('chaos.homepage.learnMore'),
      url: 'https://docs.harness.io/category/kl0mxwpfw1-hce-category'
    },
    startBtn: {
      description: startBtnDescription,
      onClick: handleStartTrial
    }
  }

  useEffect(() => {
    experience && showModal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience])

  return (
    <StartTrialTemplate
      title={getString('chaos.homepage.chaosHomePageTitle')}
      bgImageUrl={bgImageURL}
      startTrialProps={startTrialProps}
      module={module}
    />
  )
}

export default ChaosTrialHomePage
