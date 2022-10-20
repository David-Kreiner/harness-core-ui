/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, Layout, Text } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { Dialog } from '@blueprintjs/core'
import cx from 'classnames'
import moment from 'moment'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { TrialModalTemplate } from '@pipeline/components/TrialModalTemplate/TrialModalTemplate'
import { ModuleLicenseType, Editions } from '@common/constants/SubscriptionTypes'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import chaosTrialBg from '../../images/chaosTrial.png'

import css from './useChaosTrialModal.module.scss'

interface ChaosTrialModalData {
  onContinue: () => void
  experience?: ModuleLicenseType
}

interface UseChaosTrialModalProps {
  onClose?: () => void
  onContinue: () => void
  experience?: ModuleLicenseType
}

interface UseChaosTrialModalReturn {
  showModal: () => void
  hideModal: () => void
}

const ChaosTrial: React.FC<ChaosTrialModalData> = props => {
  const { onContinue, experience } = props

  const { getString } = useStrings()

  const { licenseInformation } = useLicenseStore()
  const chaosLicenseInformation = licenseInformation?.['CHAOS']

  const expiryTime = chaosLicenseInformation?.expiryTime
  const time = moment(expiryTime)
  const isFree = chaosLicenseInformation?.edition === Editions.FREE
  const expiryDate = isFree ? getString('common.subscriptions.overview.freeExpiry') : time.format('DD MMM YYYY')
  const isTrialPlan = experience === ModuleLicenseType.TRIAL

  function getChildComponent(): React.ReactElement {
    return (
      <>
        <Layout.Vertical flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }} spacing="medium">
          <Text className={css.titleText}>{getString('chaos.trial.modal.title')}</Text>
          {isTrialPlan && (
            <Text
              className={css.trialBadge}
              background={Color.ORANGE_500}
              color={Color.WHITE}
              width={120}
              border={{ radius: 3 }}
              margin={{ left: 30 }}
              inline
              font={{ align: 'center' }}
            >
              {getString('common.trialInProgress')}
            </Text>
          )}
          <Layout.Horizontal>
            <Text className={css.expiryText}>{`${getString('common.extendTrial.expiryDate')}:`}</Text>
            <Text className={css.expiryDate}>{`${expiryDate}`}</Text>
          </Layout.Horizontal>
        </Layout.Vertical>
        <Layout.Vertical
          className={css.descriptionBlock}
          flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
          height="35%"
        >
          <Layout.Vertical spacing="small">
            <Text className={css.description}>{getString('chaos.trial.modal.welcome')}</Text>
            <Text className={css.description}>{getString('chaos.trial.modal.description')}</Text>
          </Layout.Vertical>
          <Layout.Horizontal spacing="small" padding={{ top: 'large' }}>
            <Button
              intent="primary"
              text={getString('continue')}
              onClick={() => {
                onContinue()
              }}
            />
          </Layout.Horizontal>
        </Layout.Vertical>
      </>
    )
  }

  return (
    <TrialModalTemplate hideTrialBadge imgSrc={chaosTrialBg}>
      {getChildComponent()}
    </TrialModalTemplate>
  )
}

const useChaosTrialModal = (props: UseChaosTrialModalProps): UseChaosTrialModalReturn => {
  const { onContinue, experience } = props

  const [showModal, hideModal] = useModalHook(() => {
    return (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canOutsideClickClose={false}
        canEscapeKeyClose={false}
        onClose={onContinue}
        className={cx(css.dialog, css.ceTrial)}
      >
        <ChaosTrial onContinue={onContinue} experience={experience} />
      </Dialog>
    )
  }, [onContinue])

  return {
    showModal,
    hideModal
  }
}

export default useChaosTrialModal
