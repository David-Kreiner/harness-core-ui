/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { FormikProps } from 'formik'
import { useParams } from 'react-router-dom'
import { Layout, MultiTypeInputType, shouldShowError, useToaster } from '@harness/uicore'
import { useGetConnectorListV2, PageConnectorResponse } from 'services/cd-ng'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import { getIdentifierFromValue } from '@common/components/EntityReference/EntityReference'
import useRBACError, { RBACError } from '@rbac/utils/useRBACError/useRBACError'
import { useDeepCompareEffect } from '@common/hooks'
import { getConnectorPath } from '@pipeline/components/ManifestSelection/ManifestWizardSteps/ManifestUtils'
import {
  getHelmManifestSpec,
  getManifestTriggerInitialSource
} from '@triggers/components/Triggers/ManifestTrigger/ManifestWizardPageUtils'
import ManifestListView from './ManifestListView/ManifestListView'
import type { ManifestTriggerFormikValues } from './ManifestInterface'

type ManifestSelectionProps = {
  formikProps: FormikProps<ManifestTriggerFormikValues>
}

export default function ManifestSelection({ formikProps }: ManifestSelectionProps): JSX.Element | null {
  const { source: triggerSource } = formikProps.values
  const { spec: triggerSpec } = triggerSource ?? getManifestTriggerInitialSource()
  const { spec: manifestSpec } = triggerSpec ?? getHelmManifestSpec()
  const { store } = manifestSpec

  const [fetchedConnectorResponse, setFetchedConnectorResponse] = React.useState<PageConnectorResponse | undefined>()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  const { accountId, orgIdentifier, projectIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      accountId: string
    }>
  >()
  const defaultQueryParams = {
    pageIndex: 0,
    pageSize: 10,
    searchTerm: '',
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    includeAllConnectorsAvailableAtScope: true
  }
  const { mutate: fetchConnectors } = useGetConnectorListV2({
    queryParams: defaultQueryParams
  })

  const refetchConnectorList = async (): Promise<void> => {
    try {
      const connectorIdentifiers = [getIdentifierFromValue(getConnectorPath(store?.type as string, triggerSpec))]
      const response = await fetchConnectors({ filterType: 'Connector', connectorIdentifiers })
      /* istanbul ignore else */
      if (response.data) {
        const { data: connectorResponse } = response
        setFetchedConnectorResponse(connectorResponse)
      }
    } catch (e) {
      /* istanbul ignore else */
      if (shouldShowError(e)) {
        showError(getRBACErrorMessage(e as RBACError))
      }
    }
  }

  useDeepCompareEffect(() => {
    refetchConnectorList()
  }, [triggerSource])

  return (
    <Layout.Vertical>
      <ManifestListView
        connectors={fetchedConnectorResponse}
        isReadonly={false}
        allowableTypes={[MultiTypeInputType.FIXED]}
        formikProps={formikProps}
      />
    </Layout.Vertical>
  )
}
