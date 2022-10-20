/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { PageSpinner } from '@harness/uicore'

import { GetTriggerQueryParams, NGTriggerConfigV2RequestBody, useGetTrigger } from 'services/pipeline-ng'

import { useQueryParams } from '@common/hooks'
import type {
  GitQueryParams,
  PipelinePathProps,
  TriggerPathProps,
  TriggerQueryParams
} from '@common/interfaces/RouteInterfaces'
import { parse } from '@common/utils/YamlHelperMethods'

import factory from '@triggers/factory/TriggerFactory'
import { TriggerWidget } from '@triggers/components/Triggers/TriggerWidget'
import {
  ScheduleType,
  SourceRepo,
  TriggerBaseType,
  TriggerArtifactType,
  ManifestType,
  TriggerSubType
} from '@triggers/components/Triggers/TriggerInterface'
import TriggerDetailsV1 from '@triggers/pages/trigger-details/TriggerDetails'
import TriggersWizardPageV1 from '@triggers/pages/triggers/TriggersWizardPage'

export default function TriggersWizardPage(): JSX.Element {
  const {
    accountId: accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    pipelineIdentifier,
    triggerIdentifier
  } = useParams<PipelinePathProps & TriggerPathProps>()
  const { triggerType, sourceRepo, artifactType, manifestType, branch, scheduleType } = useQueryParams<
    TriggerQueryParams & GitQueryParams
  >()

  const [type, setType] = useState<TriggerSubType>(
    (sourceRepo as SourceRepo) ||
      (scheduleType as ScheduleType) ||
      (artifactType as TriggerArtifactType) ||
      (manifestType as ManifestType)
  )
  const [baseType, setBaseType] = useState<TriggerBaseType>(triggerType as TriggerBaseType)
  const [isV1ArtifactManifestTrigger, setIsV1ArtifactManifestTrigger] = useState(false)

  const { data: triggerResponse, loading: loadingTriggerData } = useGetTrigger({
    triggerIdentifier,
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      targetIdentifier: pipelineIdentifier,
      branch
    } as GetTriggerQueryParams,
    lazy: triggerIdentifier === 'new'
  })

  useEffect(() => {
    // istanbul ignore else
    if (!loadingTriggerData && triggerResponse?.data?.yaml) {
      const parsedTriggerYaml = parse(triggerResponse.data.yaml) as { trigger: NGTriggerConfigV2RequestBody }

      const triggerBaseType = parsedTriggerYaml?.trigger?.source?.type
      // istanbul ignore else
      if (triggerBaseType) {
        setBaseType(triggerBaseType as TriggerBaseType)
      }

      // istanbul ignore else
      if (parsedTriggerYaml?.trigger?.source?.spec?.type) {
        setType(parsedTriggerYaml?.trigger?.source?.spec?.type)
      }

      // istanbul ignore else
      if (
        (triggerBaseType === TriggerBaseType.ARTIFACT || triggerBaseType === TriggerBaseType.MANIFEST) &&
        parsedTriggerYaml?.trigger?.source?.spec?.stageIdentifier
      ) {
        setIsV1ArtifactManifestTrigger(true)
      }
    }
  }, [loadingTriggerData, triggerResponse?.data])

  if (loadingTriggerData) {
    return <PageSpinner />
  }

  if (isV1ArtifactManifestTrigger) {
    return (
      <TriggerDetailsV1 wizard={true}>
        <TriggersWizardPageV1 />
      </TriggerDetailsV1>
    )
  }

  return (
    <TriggerWidget
      factory={factory}
      type={type}
      baseType={baseType}
      initialValues={{}}
      isNewTrigger={triggerIdentifier === 'new'}
      triggerData={triggerResponse?.data}
    />
  )
}
