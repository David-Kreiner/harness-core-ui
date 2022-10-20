/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { isEmpty, omitBy } from 'lodash-es'
import { Link } from 'react-router-dom'
import cx from 'classnames'
import { PopoverInteractionKind, Position, ProgressBar } from '@blueprintjs/core'
import type { IconProps } from '@harness/icons'
import { Accordion, Button, Container, Layout, Popover, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import {
  ConnectorCheckResponse,
  PipelineInputResponse,
  PreFlightDTO,
  PreFlightEntityErrorInfo,
  ResponsePreFlightDTO,
  startPreflightCheckPromise,
  useGetPreflightCheckResponse
} from 'services/pipeline-ng'
import { getIdentifierFromValue } from '@common/components/EntityReference/EntityReference'
import { useToaster } from '@common/exports'
import type { GitQueryParams, Module } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'

import { yamlStringify } from '@common/utils/YamlHelperMethods'
import css from './PreFlightCheckModal.module.scss'

enum Section {
  CONNECTORS = 'CONNECTORS',
  INPUT_SET = 'INPUT_SET'
}

const getIconProps = (status?: string): IconProps => {
  if (status === 'SUCCESS') {
    return { color: Color.GREEN_500, name: 'small-tick' }
  } else if (status === 'IN_PROGRESS') {
    return { color: Color.GREY_400, name: 'pending', className: css.spinningIcon }
  } else if (status === 'FAILURE') {
    return { color: Color.RED_500, name: 'small-cross' }
  }
  return { color: Color.GREY_400, name: 'pending', className: css.spinningIcon }
}

const getStatusMessage = (status?: string): string => {
  if (status === 'SUCCESS') {
    return 'success'
  } else if (status === 'IN_PROGRESS') {
    return 'in progress'
  } else if (status === 'FAILURE') {
    return 'failure'
  }
  return 'unknown'
}

function RowStatus({ status }: { status: ConnectorCheckResponse['status'] }): React.ReactElement {
  return (
    <Text inline icon="dot" iconProps={{ color: getIconProps(status).color }} className={css.status}>
      {getStatusMessage(status)}
    </Text>
  )
}

interface SectionLabelsProps {
  selectedSection: Section
  setSelectedSection: (section: Section) => void
  preFlightCheckData?: PreFlightDTO
}

function SectionLabels({
  selectedSection,
  setSelectedSection,
  preFlightCheckData
}: SectionLabelsProps): React.ReactElement {
  const { getString } = useStrings()

  const inputSetStatus = preFlightCheckData?.pipelineInputWrapperResponse?.status
  const inputSetLabel = getString('pre-flight-check.verifyingPipelineInputs')

  const connectorStatus = preFlightCheckData?.connectorWrapperResponse?.status
  const connectorLabel = getString('pre-flight-check.verifyingConnectors')

  const inputSetIconProps = getIconProps(inputSetStatus)
  const connectorsIconProps = getIconProps(connectorStatus)

  return (
    <Layout.Vertical spacing="xlarge" className={css.sectionLabelsWrapper}>
      <Text
        inline
        font={{ weight: selectedSection === Section.INPUT_SET ? 'bold' : 'light' }}
        iconProps={inputSetIconProps}
        icon={inputSetIconProps.name}
        className={css.sectionLabelText}
        onClick={() => setSelectedSection(Section.INPUT_SET)}
      >
        {inputSetLabel}
      </Text>
      <Text
        inline
        font={{ weight: selectedSection === Section.CONNECTORS ? 'bold' : 'light' }}
        iconProps={connectorsIconProps}
        icon={connectorsIconProps.name}
        className={css.sectionLabelText}
        onClick={() => setSelectedSection(Section.CONNECTORS)}
      >
        {connectorLabel}
      </Text>
    </Layout.Vertical>
  )
}

interface ErrorPanelProps {
  errorInfo?: PreFlightEntityErrorInfo
}

function ErrorPanel({ errorInfo }: ErrorPanelProps): React.ReactElement {
  const { getString } = useStrings()

  return (
    <Container className={css.errorPanel}>
      <h3>{getString('errorSummaryText')}</h3>
      <Container margin={{ bottom: 'medium' }}>
        <Text>{errorInfo?.summary}</Text>
        <Text>{errorInfo?.description}</Text>
      </Container>
      {errorInfo?.causes && errorInfo?.causes.length > 0 && (
        <Container margin={{ bottom: 'medium' }}>
          <Text>{getString('pre-flight-check.possibleCauses')}</Text>
          {errorInfo?.causes?.map((cause, idx) => (
            <Text key={idx}>{cause.cause}</Text>
          ))}
        </Container>
      )}
      {errorInfo?.resolution && errorInfo?.resolution?.length > 0 && (
        <Container margin={{ bottom: 'medium' }}>
          <Text>{getString('pre-flight-check.resolution')}</Text>
          {errorInfo?.resolution?.map((res, idx) => (
            <Text key={idx}>{res.resolution}</Text>
          ))}
        </Container>
      )}
    </Container>
  )
}

interface ConnectorsSectionProps {
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  pipelineIdentifier: string
  module?: Module
  preFlightCheckData?: PreFlightDTO
}

function ConnectorsSection({
  accountId,
  orgIdentifier,
  projectIdentifier,
  pipelineIdentifier,
  module,
  preFlightCheckData,
  branch,
  repoIdentifier
}: ConnectorsSectionProps & GitQueryParams): React.ReactElement {
  const { getString } = useStrings()

  const data = preFlightCheckData?.connectorWrapperResponse?.checkResponses
  const status = preFlightCheckData?.connectorWrapperResponse?.status

  if (status === 'IN_PROGRESS' && isEmpty(data)) {
    return <Text>{getString('pre-flight-check.gettingConnectorResult')}</Text>
  }
  if (status === 'SUCCESS' && isEmpty(data)) {
    // No connectors to verify
    return <Text intent="success">{getString('success')}</Text>
  }
  if (status === 'FAILURE' && isEmpty(data)) {
    // No connectors to verify
    return <Text intent="danger">{getString('pre-flight-check.couldNotVerifyConnectors')}</Text>
  }

  function getConnectorUrl(connectorRef: string): string {
    const connectorId = getIdentifierFromValue(connectorRef)
    return routes.toConnectorDetails({
      projectIdentifier,
      orgIdentifier,
      connectorId,
      accountId,
      module
    })
  }

  const getStageLink = (stageId: string): string => {
    return `${routes.toPipelineStudio({
      accountId,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier,
      module,
      branch,
      repoIdentifier,
      stageId
    })}`
  }

  const getStepLink = (stageIdentifier: string, stepIdentifier: string): string => {
    return `${getStageLink(stageIdentifier)}&stepId=${stepIdentifier}`
  }

  const getDetails = (row: ConnectorCheckResponse, hasExpandableDetails: boolean) => (
    <Layout.Horizontal spacing="large" key={row.fqn} className={css.listRow}>
      <Text
        lineClamp={1}
        className={cx(css.connectorName, { [css.accordionPaddingCorrection]: !hasExpandableDetails })}
      >
        {row.connectorIdentifier}
      </Text>
      <span className={css.connectorId}>
        <Popover
          boundary={'window'}
          position={Position.TOP}
          interactionKind={PopoverInteractionKind.HOVER}
          portalClassName={css.locationPopover}
          modifiers={{ preventOverflow: { enabled: false } }}
        >
          {row.connectorIdentifier ? (
            <div className={css.connectorIdentifierHolder}>
              <span> {getString('idLabel')}</span>
              <Link target={'_blank'} to={getConnectorUrl(row.connectorIdentifier)}>
                <Text className={css.connectorIdentifier}> {row.connectorIdentifier}</Text>
              </Link>
            </div>
          ) : null}

          <Container className={css.locationPopoverContent}>
            <Text className={css.row}>{getString('pre-flight-check.connectorLocationInPipeline')}</Text>
            {!!row.stageIdentifier && (
              <Text className={css.row}>
                <strong>{getString('pre-flight-check.stageColon')}</strong>{' '}
                <Link target="_blank" to={getStageLink(row.stageIdentifier)}>
                  {row.stageName}
                </Link>
              </Text>
            )}
            {!!row.stageIdentifier && !!row.stepIdentifier && (
              <Text className={css.row}>
                <strong>{getString('pre-flight-check.stepColon')}</strong>{' '}
                <Link target="_blank" to={getStepLink(row.stageIdentifier, row.stepIdentifier)}>
                  {row.stepName}
                </Link>
              </Text>
            )}
          </Container>
        </Popover>
      </span>
      <RowStatus status={row.status} />
    </Layout.Horizontal>
  )

  return (
    <Layout.Vertical spacing="large">
      {data?.map(row => {
        return row.status === 'FAILURE' ? (
          <Accordion>
            <Accordion.Panel
              id={row.connectorIdentifier || ''}
              details={<ErrorPanel errorInfo={row.errorInfo} />}
              summary={getDetails(row, true)}
            ></Accordion.Panel>
          </Accordion>
        ) : (
          getDetails(row, false)
        )
      })}
    </Layout.Vertical>
  )
}

interface InputSetsSectionProps {
  preFlightCheckData?: PreFlightDTO
}

function InputSetsSection({ preFlightCheckData }: InputSetsSectionProps): React.ReactElement {
  const { getString } = useStrings()

  const data = preFlightCheckData?.pipelineInputWrapperResponse?.pipelineInputResponse
  const status = preFlightCheckData?.pipelineInputWrapperResponse?.status

  if (status === 'IN_PROGRESS' && isEmpty(data)) {
    return <Text>{getString('pre-flight-check.gettingResults')}</Text>
  }
  if (status === 'SUCCESS' && isEmpty(data)) {
    // No connectors to verify
    return <Text intent="success">{getString('success')}</Text>
  }
  if (status === 'FAILURE' && isEmpty(data)) {
    // No connectors to verify
    return <Text intent="danger">{getString('pre-flight-check.couldNotVerifyInputSets')}</Text>
  }

  const getDetails = (row: PipelineInputResponse, hasExpandableDetails: boolean) => (
    <Layout.Horizontal spacing="large" key={row.fqn} className={css.listRow}>
      <Text lineClamp={1} className={cx(css.inputFqn, { [css.accordionPaddingCorrection]: !hasExpandableDetails })}>
        {row.fqn}
      </Text>
      <RowStatus status={row.success ? 'SUCCESS' : 'FAILURE'} />
    </Layout.Horizontal>
  )

  return (
    <Layout.Vertical spacing="large">
      {data?.map(row => {
        return row.success === false ? (
          <Accordion>
            <Accordion.Panel
              id={row.fqn || ''}
              details={<ErrorPanel errorInfo={row.errorInfo} />}
              summary={getDetails(row, true)}
            ></Accordion.Panel>
          </Accordion>
        ) : (
          getDetails(row, false)
        )
      })}
    </Layout.Vertical>
  )
}

interface SectionPanelProps {
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  pipelineIdentifier: string
  module?: Module
  selectedSection: Section
  preFlightCheckData?: PreFlightDTO
}

function SectionPanel({
  accountId,
  orgIdentifier,
  projectIdentifier,
  pipelineIdentifier,
  module,
  selectedSection,
  preFlightCheckData,
  branch,
  repoIdentifier
}: SectionPanelProps & GitQueryParams): React.ReactElement {
  return (
    <div className={css.sectionPanelWrapper}>
      {selectedSection === Section.CONNECTORS ? (
        <ConnectorsSection
          accountId={accountId}
          orgIdentifier={orgIdentifier}
          projectIdentifier={projectIdentifier}
          pipelineIdentifier={pipelineIdentifier}
          module={module}
          preFlightCheckData={preFlightCheckData}
          branch={branch}
          repoIdentifier={repoIdentifier}
        />
      ) : (
        <InputSetsSection preFlightCheckData={preFlightCheckData} />
      )}
    </div>
  )
}

interface PreFlightCheckSectionsProps {
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  pipelineIdentifier: string
  module?: Module
  preFlightCheckData?: PreFlightDTO
}
function PreFlightCheckSections({
  accountId,
  orgIdentifier,
  projectIdentifier,
  pipelineIdentifier,
  module,
  preFlightCheckData,
  branch,
  repoIdentifier
}: PreFlightCheckSectionsProps & GitQueryParams): React.ReactElement {
  const [selectedSection, setSelectedSection] = useState(Section.INPUT_SET)

  const AUTO_SELECT_STATUSES = ['FAILURE', 'IN_PROGRESS']

  // auto select section
  useEffect(() => {
    if (preFlightCheckData) {
      let selection: Section | undefined = undefined

      if (AUTO_SELECT_STATUSES.indexOf(preFlightCheckData?.pipelineInputWrapperResponse?.status || '') !== -1) {
        selection = Section.INPUT_SET
      }
      if (AUTO_SELECT_STATUSES.indexOf(preFlightCheckData?.connectorWrapperResponse?.status || '') !== -1) {
        selection = Section.CONNECTORS
      }

      if (selection) setSelectedSection(selection)
    }
  }, [preFlightCheckData])

  return (
    <Layout.Horizontal spacing="medium" className={css.sectionsWrapper}>
      <SectionLabels
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        preFlightCheckData={preFlightCheckData}
      />
      <div className={css.divider} />
      <SectionPanel
        accountId={accountId}
        orgIdentifier={orgIdentifier}
        projectIdentifier={projectIdentifier}
        pipelineIdentifier={pipelineIdentifier}
        module={module}
        selectedSection={selectedSection}
        preFlightCheckData={preFlightCheckData}
        branch={branch}
        repoIdentifier={repoIdentifier}
      />
    </Layout.Horizontal>
  )
}

interface PreFlightCheckFooter {
  preFlightCheckData?: PreFlightDTO
  onContinuePipelineClick: () => void
  onCloseButtonClick: () => void
  onRetryButtonClick: () => void
}

function PreFlightCheckFooter({
  preFlightCheckData,
  onContinuePipelineClick,
  onCloseButtonClick,
  onRetryButtonClick
}: PreFlightCheckFooter): React.ReactElement {
  const { getString } = useStrings()
  // If the check is complete
  if (preFlightCheckData?.status === 'SUCCESS' || preFlightCheckData?.status === 'FAILURE') {
    return (
      <div className={css.footerFailure}>
        <Button intent="primary" text={getString('retry')} onClick={() => onRetryButtonClick()} />
        <Button text={getString('close')} onClick={() => onCloseButtonClick()} />
        <Button
          text={getString('pre-flight-check.continueToRunPipeline')}
          minimal
          intent="primary"
          onClick={() => onContinuePipelineClick()}
        />
      </div>
    )
  }
  return (
    <div className={css.footerInProgress}>
      <Button text={getString('pre-flight-check.skipCheckBtn')} onClick={() => onContinuePipelineClick()} />
      <Text className={css.footerSmallText}>{getString('pre-flight-check.skipCheckInfo')}</Text>
    </div>
  )
}

interface HeadLineProps {
  errorCount: number
}

function HeadLine({ errorCount }: HeadLineProps): React.ReactElement {
  const { getString } = useStrings()

  return (
    <Layout.Horizontal className={css.headLine}>
      <span className={css.title}>{getString('pre-flight-check.preFlightCheckTitle')}</span>
      {errorCount > 0 ? (
        <span className={css.error}>{getString('pre-flight-check.errorFoundCounter', { errorCount })}</span>
      ) : null}
    </Layout.Horizontal>
  )
}

export const POLL_INTERVAL = 3 /* sec */ * 1000 /* ms */

export interface PreFlightCheckModalProps {
  pipeline?: PipelineInfoConfig
  module?: Module
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  pipelineIdentifier: string
  onCloseButtonClick: () => void
  onContinuePipelineClick: () => void
}

export function PreFlightCheckModal({
  pipeline,
  module,
  accountId,
  orgIdentifier,
  projectIdentifier,
  pipelineIdentifier,
  branch,
  repoIdentifier,
  onCloseButtonClick,
  onContinuePipelineClick
}: PreFlightCheckModalProps & GitQueryParams): React.ReactElement {
  const [preFlightCheckId, setPreFlightCheckId] = useState<string | undefined>()
  const [preFlightCheckData, setPreFlightCheckData] = useState<ResponsePreFlightDTO | null>()

  const { showError } = useToaster()
  const { getString } = useStrings()
  const { isGitSyncEnabled: isGitSyncEnabledForProject, gitSyncEnabledOnlyForFF } = useAppStore()
  const isGitSyncEnabled = isGitSyncEnabledForProject && !gitSyncEnabledOnlyForFF
  const processResponseError = (error?: { message?: string }): void => {
    showError(error?.message ? error?.message : getString('somethingWentWrong'), undefined, 'pipeline.preflight.error')
    onCloseButtonClick()
  }

  // start preflight check
  useEffect(() => {
    if (!preFlightCheckId) {
      startPreflightCheckPromise({
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier,
          pipelineIdentifier,
          ...(isGitSyncEnabled ? { repoIdentifier, branch, getDefaultFromOtherRepo: true } : {})
        },
        body: !isEmpty(pipeline)
          ? (yamlStringify({ pipeline: omitBy(pipeline, (_value, key) => key.startsWith('_')) }) as any)
          : ''
      })
        .then(response => {
          if (response?.status === 'ERROR' || response?.status === 'FAILURE') {
            processResponseError(response as any)
          } else if (response.data) {
            setPreFlightCheckId(response.data)
          } else {
            processResponseError()
          }
        })
        .catch(error => {
          processResponseError(error)
        })
    }
  }, [pipeline, preFlightCheckId])

  const { data: preFlightCheckResponse, refetch } = useGetPreflightCheckResponse({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      preflightCheckId: preFlightCheckId || ''
    },
    lazy: true
  })

  useEffect(() => {
    setPreFlightCheckData(preFlightCheckResponse)
  }, [preFlightCheckResponse])

  // setting up the polling
  useEffect(() => {
    if (preFlightCheckId) {
      if (!preFlightCheckData || preFlightCheckData?.data?.status === 'IN_PROGRESS') {
        const timerId = window.setTimeout(
          () => {
            refetch()
          },
          !preFlightCheckData ? 1 : POLL_INTERVAL
        )

        return () => {
          window.clearTimeout(timerId)
        }
      }
    }
  }, [preFlightCheckId, preFlightCheckData])

  // auto close if check pass successfully
  useEffect(() => {
    if (preFlightCheckData?.data?.status === 'SUCCESS') {
      onContinuePipelineClick()
    }
  }, [preFlightCheckData])

  // count total, progress, failed
  const getChecksCount = (preFlight?: PreFlightDTO) => {
    const checkCount = { total: 0, progress: 0, failed: 0 }
    preFlight?.pipelineInputWrapperResponse?.pipelineInputResponse?.forEach(item => {
      checkCount.total++
      if (item.success === false) checkCount.failed++
    })
    preFlight?.connectorWrapperResponse?.checkResponses?.forEach(item => {
      checkCount.total++
      if (item.status === 'IN_PROGRESS') checkCount.progress++
      if (item.status === 'FAILURE') checkCount.failed++
    })

    return checkCount
  }

  const checkCounts = getChecksCount(preFlightCheckData?.data)
  const progressValue = checkCounts.total > 0 ? 1 - (1 / checkCounts.total) * checkCounts.progress : 0

  return (
    <Container className={css.preFlightCheckContainer} padding="medium">
      <HeadLine errorCount={checkCounts.failed} />
      <ProgressBar
        intent={preFlightCheckData?.data?.status === 'FAILURE' ? 'danger' : 'success'}
        value={progressValue}
      />
      <PreFlightCheckSections
        accountId={accountId}
        orgIdentifier={orgIdentifier}
        projectIdentifier={projectIdentifier}
        pipelineIdentifier={pipelineIdentifier}
        module={module}
        preFlightCheckData={preFlightCheckData?.data}
        branch={branch}
        repoIdentifier={repoIdentifier}
      />
      <PreFlightCheckFooter
        preFlightCheckData={preFlightCheckData?.data}
        onContinuePipelineClick={onContinuePipelineClick}
        onCloseButtonClick={onCloseButtonClick}
        onRetryButtonClick={() => {
          setPreFlightCheckData(null)
          setPreFlightCheckId(undefined)
        }}
      />
    </Container>
  )
}
