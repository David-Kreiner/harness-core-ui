/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { isEmpty } from 'lodash-es'
import { Icon } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import { Duration } from '@common/components/Duration/Duration'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import ExecutionStatusLabel from '@pipeline/components/ExecutionStatusLabel/ExecutionStatusLabel'
import ExecutionActions from '@pipeline/components/ExecutionActions/ExecutionActions'
import { formatDatetoLocale } from '@common/utils/dateUtils'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import GitPopover from '@pipeline/components/GitPopover/GitPopover'
import { String, useStrings } from 'framework/strings'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import type { ExecutionPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { StoreType } from '@common/constants/GitSyncTypes'
import type { ExecutionStatus } from '@pipeline/utils/statusHelpers'
import { useExecutionContext } from '@pipeline/context/ExecutionContext'
import { TagsPopover } from '@common/components'

import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import RetryHistory from '@pipeline/components/RetryPipeline/RetryHistory/RetryHistory'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import GitRemoteDetails from '@common/components/GitRemoteDetails/GitRemoteDetails'
import css from './ExecutionHeader.module.scss'

export function ExecutionHeader(): React.ReactElement {
  const { orgIdentifier, projectIdentifier, executionIdentifier, accountId, pipelineIdentifier, module, source } =
    useParams<PipelineType<ExecutionPathProps>>()
  const { refetch, pipelineExecutionDetail, isPipelineInvalid } = useExecutionContext()
  const { supportingGitSimplification } = useAppStore()
  const { getString } = useStrings()
  const { pipelineExecutionSummary = {} } = pipelineExecutionDetail || {}
  const [canEdit, canExecute] = usePermission(
    {
      resourceScope: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipelineIdentifier as string
      },
      permissions: [PermissionIdentifier.EDIT_PIPELINE, PermissionIdentifier.EXECUTE_PIPELINE]
    },
    [orgIdentifier, projectIdentifier, accountId, pipelineIdentifier]
  )

  useDocumentTitle([
    `${pipelineExecutionSummary?.status ? pipelineExecutionSummary?.status + ' | ' : ''} ${
      pipelineExecutionSummary.name || getString('pipelines')
    } ${getString(
      module === 'cd' ? 'execution.pipelineIdentifierTextCD' : 'execution.pipelineIdentifierTextCI',
      pipelineExecutionSummary
    )}`
  ])

  return (
    <header className={css.header}>
      <div className={css.headerTopRow}>
        <NGBreadcrumbs
          links={
            source === 'deployments'
              ? [
                  {
                    url: routes.toDeployments({ orgIdentifier, projectIdentifier, accountId, module }),
                    label: module === 'ci' ? getString('buildsText') : getString('deploymentsText')
                  }
                ]
              : [
                  {
                    url: routes.toPipelines({ orgIdentifier, projectIdentifier, accountId, module }),
                    label: getString('pipelines')
                  },
                  {
                    url: routes.toPipelineDeploymentList({
                      orgIdentifier,
                      projectIdentifier,
                      pipelineIdentifier,
                      accountId,
                      module,
                      repoIdentifier: pipelineExecutionSummary?.gitDetails?.repoIdentifier,
                      connectorRef: pipelineExecutionSummary?.connectorRef,
                      repoName: pipelineExecutionSummary?.gitDetails?.repoName,
                      branch: pipelineExecutionSummary?.gitDetails?.branch,
                      storeType: pipelineExecutionSummary?.storeType as StoreType
                    }),
                    label: pipelineExecutionSummary.name || getString('common.pipeline')
                  }
                ]
          }
        />
        <div className={css.actionsBar}>
          {pipelineExecutionSummary.status ? (
            <ExecutionStatusLabel status={pipelineExecutionSummary.status as ExecutionStatus} />
          ) : null}
          {pipelineExecutionSummary.startTs && (
            <div className={css.startTime}>
              <String tagName="div" className={css.startTimeText} stringID="pipeline.startTime" />
              <span>{formatDatetoLocale(pipelineExecutionSummary.startTs)}</span>
            </div>
          )}
          <Duration
            className={css.duration}
            startTime={pipelineExecutionSummary.startTs}
            endTime={pipelineExecutionSummary.endTs}
            icon="time"
            iconProps={{ size: 12 }}
            durationText={' '}
          />
          {pipelineExecutionSummary.showRetryHistory && (
            <RetryHistory
              canExecute={canExecute}
              showRetryHistory={pipelineExecutionSummary.showRetryHistory}
              canRetry={pipelineExecutionSummary.canRetry || false}
            />
          )}
          <Link
            className={css.view}
            to={routes.toPipelineStudio({
              orgIdentifier,
              projectIdentifier,
              pipelineIdentifier,
              accountId,
              module,
              repoIdentifier: pipelineExecutionSummary?.gitDetails?.repoIdentifier,
              connectorRef: pipelineExecutionSummary?.connectorRef,
              repoName: pipelineExecutionSummary?.gitDetails?.repoName,
              branch: pipelineExecutionSummary?.gitDetails?.branch,
              storeType: pipelineExecutionSummary?.storeType as StoreType
            })}
          >
            <Icon name="Edit" size={12} />
            <String stringID="edit" />
          </Link>

          <ExecutionActions
            executionStatus={pipelineExecutionSummary.status as ExecutionStatus}
            refetch={refetch}
            source={source}
            params={{
              orgIdentifier,
              pipelineIdentifier,
              projectIdentifier,
              accountId,
              executionIdentifier,
              module,
              repoIdentifier: pipelineExecutionSummary?.gitDetails?.repoIdentifier,
              connectorRef: pipelineExecutionSummary?.connectorRef,
              repoName: pipelineExecutionSummary?.gitDetails?.repoName,
              branch: pipelineExecutionSummary?.gitDetails?.branch,
              stagesExecuted: pipelineExecutionSummary?.stagesExecuted,
              storeType: pipelineExecutionSummary?.storeType as StoreType
            }}
            isPipelineInvalid={isPipelineInvalid}
            canEdit={canEdit}
            showEditButton={true}
            canExecute={canExecute}
            canRetry={pipelineExecutionSummary.canRetry}
            modules={pipelineExecutionSummary.modules}
          />
        </div>
      </div>
      <div className={css.titleContainer}>
        <div className={css.title}>{pipelineExecutionSummary.name}</div>
        <String
          tagName="div"
          className={css.pipelineId}
          stringID={module === 'cd' ? 'execution.pipelineIdentifierTextCD' : 'execution.pipelineIdentifierTextCI'}
          vars={pipelineExecutionSummary}
        />
        {!isEmpty(pipelineExecutionSummary?.tags) ? (
          <TagsPopover
            iconProps={{ size: 14 }}
            className={css.tags}
            popoverProps={{ wrapperTagName: 'div', targetTagName: 'div' }}
            tags={(pipelineExecutionSummary?.tags || []).reduce((val, tag) => {
              return Object.assign(val, { [tag.key]: tag.value })
            }, {} as { [key: string]: string })}
          />
        ) : null}
        {pipelineExecutionSummary.gitDetails ? (
          supportingGitSimplification && pipelineExecutionSummary?.storeType === StoreType.REMOTE ? (
            <div className={css.gitRemoteDetailsWrapper}>
              <GitRemoteDetails
                repoName={pipelineExecutionSummary.gitDetails.repoName}
                branch={pipelineExecutionSummary.gitDetails.branch}
                filePath={pipelineExecutionSummary.gitDetails.filePath}
                fileUrl={pipelineExecutionSummary.gitDetails.fileUrl}
                flags={{ readOnly: true }}
              />
            </div>
          ) : (
            <GitSyncStoreProvider>
              <GitPopover
                data={pipelineExecutionSummary.gitDetails}
                popoverProps={{ targetTagName: 'div', wrapperTagName: 'div', className: css.git }}
              />
            </GitSyncStoreProvider>
          )
        ) : null}
      </div>
    </header>
  )
}
