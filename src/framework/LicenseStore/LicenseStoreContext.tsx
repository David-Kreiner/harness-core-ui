/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { useParams } from 'react-router-dom'
import { isEqual } from 'lodash-es'

import isEmpty from 'lodash/isEmpty'
import { PageSpinner } from '@harness/uicore'
import { useDeepCompareEffect } from '@common/hooks'
import { useAppStore } from 'framework/AppStore/AppStoreContext'

import {
  getLastModifiedTimeForAllModuleTypesPromise,
  ModuleLicenseDTO,
  useGetAccountLicenses,
  useGetLastModifiedTimeForAllModuleTypes
} from 'services/cd-ng'
import { ModuleName } from 'framework/types/ModuleName'
import type { Module } from '@common/interfaces/RouteInterfaces'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import GenericErrorPage, { GENERIC_ERROR_CODES } from '@common/pages/GenericError/GenericErrorPage'
import { Editions } from '@common/constants/SubscriptionTypes'
import { useStrings } from 'framework/strings'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { useFeaturesContext } from 'framework/featureStore/FeaturesContext'
import { VersionMap, LICENSE_STATE_VALUES } from './licenseStoreUtil'

// Only keep GA modules for now
export interface LicenseStoreContextProps {
  readonly licenseInformation: { [key: string]: ModuleLicenseDTO } | Record<string, undefined>
  readonly versionMap: VersionMap
  readonly CI_LICENSE_STATE: LICENSE_STATE_VALUES
  readonly FF_LICENSE_STATE: LICENSE_STATE_VALUES
  readonly CCM_LICENSE_STATE: LICENSE_STATE_VALUES
  readonly CD_LICENSE_STATE: LICENSE_STATE_VALUES
  readonly CHAOS_LICENSE_STATE: LICENSE_STATE_VALUES

  updateLicenseStore(data: Partial<Pick<LicenseStoreContextProps, 'licenseInformation'>>): void
}

export interface LicenseRedirectProps {
  licenseStateName: keyof Omit<LicenseStoreContextProps, 'licenseInformation' | 'updateLicenseStore' | 'versionMap'>
  startTrialRedirect: () => React.ReactElement
  expiredTrialRedirect: () => React.ReactElement
}

type licenseStateNames = keyof Omit<
  LicenseStoreContextProps,
  'licenseInformation' | 'updateLicenseStore' | 'versionMap'
>

export const LICENSE_STATE_NAMES: { [T in licenseStateNames]: T } = {
  CI_LICENSE_STATE: 'CI_LICENSE_STATE',
  FF_LICENSE_STATE: 'FF_LICENSE_STATE',
  CCM_LICENSE_STATE: 'CCM_LICENSE_STATE',
  CD_LICENSE_STATE: 'CD_LICENSE_STATE',
  CHAOS_LICENSE_STATE: 'CHAOS_LICENSE_STATE'
}

export const LicenseStoreContext = React.createContext<LicenseStoreContextProps>({
  licenseInformation: {},
  versionMap: {},
  CI_LICENSE_STATE: LICENSE_STATE_VALUES.NOT_STARTED,
  FF_LICENSE_STATE: LICENSE_STATE_VALUES.NOT_STARTED,
  CCM_LICENSE_STATE: LICENSE_STATE_VALUES.NOT_STARTED,
  CD_LICENSE_STATE: LICENSE_STATE_VALUES.NOT_STARTED,
  CHAOS_LICENSE_STATE: LICENSE_STATE_VALUES.NOT_STARTED,
  updateLicenseStore: () => void 0
})

export function useLicenseStore(): LicenseStoreContextProps {
  return React.useContext(LicenseStoreContext)
}

export function LicenseStoreProvider(props: React.PropsWithChildren<unknown>): React.ReactElement {
  const { currentUserInfo } = useAppStore()
  const { NG_LICENSES_ENABLED } = useFeatureFlags()
  const { getString } = useStrings()
  const { accountId } = useParams<{
    accountId: string
  }>()

  const { accounts } = currentUserInfo

  const createdFromNG = accounts?.find(account => account.uuid === accountId)?.createdFromNG

  // If the user has been created from NG signup we will always enforce licensing
  // If the user is a CG user we will look at the NG_LICENSES_ENABLED feature flag to determine whether or not we should enforce licensing
  const shouldLicensesBeDisabled = __DEV__ || (!createdFromNG && !NG_LICENSES_ENABLED)

  const defaultLicenses = {
    CD: {
      edition: Editions.FREE
    },
    CI: {
      edition: Editions.FREE
    },
    CF: {
      edition: Editions.FREE
    },
    CE: {
      edition: Editions.FREE
    },
    CHAOS: {
      edition: Editions.FREE
    }
  }

  const [state, setState] = useState<Omit<LicenseStoreContextProps, 'updateLicenseStore' | 'strings'>>({
    licenseInformation: shouldLicensesBeDisabled ? defaultLicenses : {},
    versionMap: {},
    CI_LICENSE_STATE: shouldLicensesBeDisabled ? LICENSE_STATE_VALUES.ACTIVE : LICENSE_STATE_VALUES.NOT_STARTED,
    FF_LICENSE_STATE: shouldLicensesBeDisabled ? LICENSE_STATE_VALUES.ACTIVE : LICENSE_STATE_VALUES.NOT_STARTED,
    CCM_LICENSE_STATE: shouldLicensesBeDisabled ? LICENSE_STATE_VALUES.ACTIVE : LICENSE_STATE_VALUES.NOT_STARTED,
    CD_LICENSE_STATE: shouldLicensesBeDisabled ? LICENSE_STATE_VALUES.ACTIVE : LICENSE_STATE_VALUES.NOT_STARTED,
    CHAOS_LICENSE_STATE: shouldLicensesBeDisabled ? LICENSE_STATE_VALUES.ACTIVE : LICENSE_STATE_VALUES.NOT_STARTED
  })

  const {
    data: accountLicensesData,
    refetch: getAccountLicenses,
    error,
    loading: getAccountLicensesLoading
  } = useGetAccountLicenses({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: getVersionMap } = useGetLastModifiedTimeForAllModuleTypes({
    queryParams: {
      accountIdentifier: accountId
    },
    requestOptions: {
      headers: {
        'content-type': 'application/json'
      }
    }
  })

  useEffect(() => {
    getVersionMap()
      .then(response => {
        setState(prevState => ({
          ...prevState,
          versionMap: response.data || {}
        }))
      })
      .catch(_err => {
        // do nothing
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 1000 milliseconds * 60 seconds * 1 minute
  const POLL_VERSION_INTERVAL = 1000 * 60 * 1

  const { requestFeatures } = useFeaturesContext()

  /*
   * this is to poll versionMap every minute
   * if versionMap changes, refresh license
   * and refresh feature context
   * if versionMap call fails, stop calling
   */
  useEffect(() => {
    let getVersionTimeOut = setTimeout(() => {
      pollVersionMap(state.versionMap)
    }, POLL_VERSION_INTERVAL)

    async function pollVersionMap(versionMap: VersionMap): Promise<void> {
      try {
        // We are using promise since mutate was rerendering the whole applications every 60 seconds
        // even if no data change in store
        const response = await getLastModifiedTimeForAllModuleTypesPromise({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          queryParams: { accountIdentifier: accountId, routingId: accountId } as any,
          body: undefined,
          requestOptions: {
            headers: {
              'content-type': 'application/json'
            }
          }
        })
        const latestVersionMap = response.data
        if (latestVersionMap && !isEqual(latestVersionMap, versionMap)) {
          // refresh licenses
          getAccountLicenses()

          // refresh feature context
          requestFeatures(
            { featureName: FeatureIdentifier.BUILDS },
            {
              skipCache: true
            }
          )

          // refresh versionMap
          setState(prevState => ({
            ...prevState,
            versionMap: response.data || {}
          }))
        }

        // set next poll
        getVersionTimeOut = setTimeout(() => {
          pollVersionMap(latestVersionMap || versionMap)
        }, POLL_VERSION_INTERVAL)
      } catch (_err) {
        clearTimeout(getVersionTimeOut)
      }
    }

    return () => {
      clearTimeout(getVersionTimeOut)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [isLoading, setIsLoading] = useState(true)

  const getLicenseState = React.useCallback(
    (expiryTime?: number): LICENSE_STATE_VALUES => {
      if (!expiryTime) {
        return LICENSE_STATE_VALUES.NOT_STARTED
      }

      const days = Math.round(moment(expiryTime).diff(moment.now(), 'days', true))
      const isExpired = days < 0

      if (shouldLicensesBeDisabled) {
        return LICENSE_STATE_VALUES.ACTIVE
      }

      return isExpired ? LICENSE_STATE_VALUES.EXPIRED : LICENSE_STATE_VALUES.ACTIVE
    },
    [shouldLicensesBeDisabled]
  )

  useDeepCompareEffect(() => {
    const allLicenses = accountLicensesData?.data?.allModuleLicenses || {}
    const licenses: { [key: string]: ModuleLicenseDTO } = {}
    Object.keys(allLicenses).forEach((key: string) => {
      const moduleLicenses = allLicenses[key]
      if (moduleLicenses?.length > 0) {
        licenses[key] = moduleLicenses[moduleLicenses.length - 1]
      }
    })

    const CIModuleLicenseData = licenses['CI']
    const FFModuleLicenseData = licenses['CF']
    const CCMModuleLicenseData = licenses['CE']
    const CDModuleLicenseData = licenses['CD']
    const ChaosModuleLicenseData = licenses['CHAOS']

    const updatedCILicenseState: LICENSE_STATE_VALUES = getLicenseState(CIModuleLicenseData?.expiryTime)
    const updatedFFLicenseState: LICENSE_STATE_VALUES = getLicenseState(FFModuleLicenseData?.expiryTime)
    const updatedCCMLicenseState: LICENSE_STATE_VALUES = getLicenseState(CCMModuleLicenseData?.expiryTime)
    const updatedCDLicenseState: LICENSE_STATE_VALUES = getLicenseState(CDModuleLicenseData?.expiryTime)
    const updatedChaosLicenseState: LICENSE_STATE_VALUES = getLicenseState(ChaosModuleLicenseData?.expiryTime)

    setState(prevState => ({
      ...prevState,
      licenseInformation: shouldLicensesBeDisabled ? { ...defaultLicenses, ...licenses } : licenses,
      CI_LICENSE_STATE: shouldLicensesBeDisabled ? LICENSE_STATE_VALUES.ACTIVE : updatedCILicenseState,
      FF_LICENSE_STATE: shouldLicensesBeDisabled ? LICENSE_STATE_VALUES.ACTIVE : updatedFFLicenseState,
      CCM_LICENSE_STATE: shouldLicensesBeDisabled ? LICENSE_STATE_VALUES.ACTIVE : updatedCCMLicenseState,
      CD_LICENSE_STATE: shouldLicensesBeDisabled ? LICENSE_STATE_VALUES.ACTIVE : updatedCDLicenseState,
      CHAOS_LICENSE_STATE: shouldLicensesBeDisabled ? LICENSE_STATE_VALUES.ACTIVE : updatedChaosLicenseState
    }))

    if (!getAccountLicensesLoading && !isEmpty(currentUserInfo)) {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountLicensesData?.data?.allModuleLicenses, currentUserInfo])

  const updateLicenseStore = React.useCallback(
    (
      updateData: Partial<
        Pick<
          LicenseStoreContextProps,
          | 'licenseInformation'
          | 'CI_LICENSE_STATE'
          | 'FF_LICENSE_STATE'
          | 'CCM_LICENSE_STATE'
          | 'CD_LICENSE_STATE'
          | 'CHAOS_LICENSE_STATE'
        >
      >
    ): void => {
      const CIModuleLicenseData = updateData.licenseInformation?.['CI']
      const FFModuleLicenseData = updateData.licenseInformation?.['CF']
      const CCMModuleLicenseData = updateData.licenseInformation?.['CE']
      const CDModuleLicenseData = updateData.licenseInformation?.['CD']
      const ChaosModuleLicenseData = updateData.licenseInformation?.['CHAOS']

      setState(prevState => ({
        ...prevState,
        licenseInformation: updateData.licenseInformation || prevState.licenseInformation,
        CI_LICENSE_STATE: CIModuleLicenseData?.expiryTime
          ? getLicenseState(CIModuleLicenseData.expiryTime)
          : prevState.CI_LICENSE_STATE,
        FF_LICENSE_STATE: FFModuleLicenseData?.expiryTime
          ? getLicenseState(FFModuleLicenseData.expiryTime)
          : prevState.FF_LICENSE_STATE,
        CCM_LICENSE_STATE: CCMModuleLicenseData?.expiryTime
          ? getLicenseState(CCMModuleLicenseData.expiryTime)
          : prevState.CCM_LICENSE_STATE,
        CD_LICENSE_STATE: CDModuleLicenseData?.expiryTime
          ? getLicenseState(CDModuleLicenseData.expiryTime)
          : prevState.CD_LICENSE_STATE,
        CHAOS_LICENSE_STATE: ChaosModuleLicenseData?.expiryTime
          ? getLicenseState(ChaosModuleLicenseData.expiryTime)
          : prevState.CHAOS_LICENSE_STATE
      }))
    },
    [getLicenseState]
  )

  let childComponent

  if (error) {
    if ((error.data as any)?.code === 'NG_ACCESS_DENIED') {
      childComponent = <GenericErrorPage code={GENERIC_ERROR_CODES.UNAUTHORIZED} />
    } else {
      childComponent = <GenericErrorPage message={getString('common.genericErrors.licenseCallFailed')} />
    }
  } else if (isLoading) {
    childComponent = <PageSpinner />
  } else {
    childComponent = props.children
  }

  return (
    <LicenseStoreContext.Provider
      value={{
        CCM_LICENSE_STATE: state.CCM_LICENSE_STATE,
        CD_LICENSE_STATE: state.CD_LICENSE_STATE,
        CI_LICENSE_STATE: state.CI_LICENSE_STATE,
        FF_LICENSE_STATE: state.FF_LICENSE_STATE,
        CHAOS_LICENSE_STATE: state.CHAOS_LICENSE_STATE,
        licenseInformation: state.licenseInformation,
        versionMap: state.versionMap,
        updateLicenseStore
      }}
    >
      {childComponent}
    </LicenseStoreContext.Provider>
  )
}

export function handleUpdateLicenseStore(
  newLicenseInformation: Record<string, ModuleLicenseDTO> | Record<string, undefined>,
  updateLicenseStore: (data: Partial<Pick<LicenseStoreContextProps, 'licenseInformation'>>) => void,
  module: Module,
  data?: ModuleLicenseDTO
): void {
  if (!data) {
    return
  }
  let licenseStoreData:
    | Partial<
        Pick<
          LicenseStoreContextProps,
          | 'licenseInformation'
          | 'CI_LICENSE_STATE'
          | 'FF_LICENSE_STATE'
          | 'CCM_LICENSE_STATE'
          | 'CD_LICENSE_STATE'
          | 'CHAOS_LICENSE_STATE'
        >
      >
    | undefined

  if (module.toUpperCase() === ModuleName.CI) {
    newLicenseInformation[ModuleName.CI] = data
    licenseStoreData = {
      licenseInformation: newLicenseInformation
    }
  } else if (module.toUpperCase() === ModuleName.CF) {
    newLicenseInformation[ModuleName.CF] = data
    licenseStoreData = {
      licenseInformation: newLicenseInformation
    }
  } else if (module.toUpperCase() === ModuleName.CE) {
    newLicenseInformation[ModuleName.CE] = data
    licenseStoreData = {
      licenseInformation: newLicenseInformation
    }
  } else if (module.toUpperCase() === ModuleName.CD) {
    newLicenseInformation[ModuleName.CD] = data
    licenseStoreData = {
      licenseInformation: newLicenseInformation
    }
  } else if (module.toUpperCase() === ModuleName.CHAOS) {
    newLicenseInformation[ModuleName.CHAOS] = data
    licenseStoreData = {
      licenseInformation: newLicenseInformation
    }
  }

  if (licenseStoreData) {
    updateLicenseStore(licenseStoreData)
  }
}

export const isFreePlan = (
  license: { [p: string]: ModuleLicenseDTO } | undefined | Record<string, undefined>,
  moduleName: ModuleName
): boolean => {
  return license?.[moduleName]?.edition === Editions.FREE
}

export const isEnterprisePlan = (
  license: { [p: string]: ModuleLicenseDTO } | undefined | Record<string, undefined>,
  moduleName: ModuleName
): boolean => {
  return license?.[moduleName]?.edition === Editions.ENTERPRISE
}

export const isTeamPlan = (
  license: { [p: string]: ModuleLicenseDTO } | undefined | Record<string, undefined>,
  moduleName: ModuleName
): boolean => {
  return license?.[moduleName]?.edition === Editions.TEAM
}
