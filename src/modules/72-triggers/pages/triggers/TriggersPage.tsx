/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Container, Tabs } from '@harness/uicore'
import { defaultTo } from 'lodash-es'
import { Expander } from '@blueprintjs/core'
import routes from '@common/RouteDefinitions'
import type { GitQueryParams, PipelineType, TriggerPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useQueryParams, useUpdateQueryParams } from '@common/hooks'
import { useGetPipelineSummaryQuery } from 'services/pipeline-rq'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import TriggersList from './views/TriggersList'
import type { TriggerDataInterface } from './utils/TriggersListUtils'
import TriggerExplorer from './views/TriggerExplorer'
import css from './TriggersPage.module.scss'

interface TriggersQueryParams {
  sectionId?: 'LISTING' | 'EXPLORER'
}
type TriggersDetailsTab = Required<TriggersQueryParams>['sectionId']

const TriggersPage: React.FC = (): React.ReactElement => {
  const { orgIdentifier, projectIdentifier, accountId, pipelineIdentifier, module } =
    useParams<PipelineType<TriggerPathProps>>()
  const { sectionId } = useQueryParams<TriggersQueryParams>()
  const { updateQueryParams } = useUpdateQueryParams<TriggersQueryParams>()
  const { CDS_TRIGGER_ACTIVITY_PAGE } = useFeatureFlags()

  const history = useHistory()
  const { repoIdentifier, branch, connectorRef, repoName, storeType } = useQueryParams<GitQueryParams>()
  const onNewTriggerClick = (val: TriggerDataInterface): void => {
    const { triggerType, sourceRepo, manifestType, artifactType, scheduleType } = val
    history.push(
      routes.toTriggersWizardPage({
        accountId,
        orgIdentifier,
        projectIdentifier,
        pipelineIdentifier,
        triggerIdentifier: 'new', // new is a reserved identifier
        triggerType,
        sourceRepo,
        manifestType,
        artifactType,
        scheduleType,
        module,
        repoIdentifier,
        connectorRef,
        repoName,
        branch,
        storeType
      })
    )
  }
  const { getString } = useStrings()

  const { data: pipeline } = useGetPipelineSummaryQuery(
    {
      pipelineIdentifier,
      queryParams: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier,
        branch,
        repoIdentifier,
        getMetadataOnly: true
      }
    },
    {
      staleTime: 5 * 60 * 1000
    }
  )

  useDocumentTitle([pipeline?.data?.name || getString('pipelines'), getString('common.triggersLabel')])

  const isPipelineInvalid = pipeline?.data?.entityValidityDetails?.valid === false

  const { supportingGitSimplification } = useAppStore()
  const isGitSyncEnabled = useMemo(() => !!pipeline?.data?.gitDetails?.branch, [pipeline])
  const gitAwareForTriggerEnabled = useMemo(
    () => isGitSyncEnabled && supportingGitSimplification,
    [isGitSyncEnabled, supportingGitSimplification]
  )

  const [selectedTabId, setSelectedTabId] = useState<TriggersDetailsTab>(defaultTo(sectionId, 'LISTING'))

  const handleTabChange = (tabId: TriggersDetailsTab): void => {
    updateQueryParams({
      sectionId: tabId
    })
    setSelectedTabId(tabId)
  }

  return CDS_TRIGGER_ACTIVITY_PAGE ? (
    <Container className={css.triggersPageBody}>
      <Tabs
        id="triggerDetails"
        onChange={handleTabChange}
        selectedTabId={selectedTabId}
        data-tabId={selectedTabId}
        tabList={[
          {
            id: 'LISTING',
            title: getString('triggers.triggerListing'),
            panel: (
              <TriggersList
                onNewTriggerClick={onNewTriggerClick}
                repoIdentifier={repoIdentifier}
                branch={branch}
                isPipelineInvalid={isPipelineInvalid}
                gitAwareForTriggerEnabled={gitAwareForTriggerEnabled}
              />
            )
          },
          {
            id: 'EXPLORER',
            title: getString('triggers.triggerExplorer.tabName'),
            panel: <TriggerExplorer />
          }
        ]}
      >
        <Expander />
      </Tabs>
    </Container>
  ) : (
    <TriggersList
      onNewTriggerClick={onNewTriggerClick}
      repoIdentifier={repoIdentifier}
      branch={branch}
      isPipelineInvalid={isPipelineInvalid}
      gitAwareForTriggerEnabled={gitAwareForTriggerEnabled}
    />
  )
}

export default TriggersPage
