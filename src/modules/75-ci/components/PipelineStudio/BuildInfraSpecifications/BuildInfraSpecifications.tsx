/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import * as yup from 'yup'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import {
  Layout,
  Formik,
  FormikForm,
  FormInput,
  Text,
  Card,
  Accordion,
  ThumbnailSelect,
  ThumbnailSelectProps,
  Container,
  getMultiTypeFromValue,
  Icon,
  MultiTypeInputType,
  PageSpinner
} from '@wings-software/uicore'
import type { Item } from '@wings-software/uicore/dist/components/ThumbnailSelect/ThumbnailSelect'
import { isEmpty, isUndefined, set, uniqBy, get } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { produce } from 'immer'
import type { FormikProps } from 'formik'
import { DelegateGroupDetails, useGetDelegateGroupsNGV2 } from 'services/portal'
import Volumes, { VolumesTypes } from '@pipeline/components/Volumes/Volumes'
import MultiTypeCustomMap from '@common/components/MultiTypeCustomMap/MultiTypeCustomMap'
import MultiTypeMap from '@common/components/MultiTypeMap/MultiTypeMap'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useStrings, UseStringsReturn } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import {
  getStageIndexFromPipeline,
  getFlattenedStages
} from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import { MultiTypeTextField } from '@common/components/MultiTypeText/MultiTypeText'
import { MultiTypeSelectField } from '@common/components/MultiTypeSelect/MultiTypeSelect'
import { FormMultiTypeCheckboxField, Separator } from '@common/components'
import type {
  MultiTypeMapType,
  MultiTypeMapUIType,
  MapType,
  MultiTypeListType,
  MultiTypeListUIType
} from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import { useGitScope } from '@pipeline/utils/CIUtils'
import { MultiTypeList } from '@common/components/MultiTypeList/MultiTypeList'
import { useHostedBuilds } from '@common/hooks/useHostedBuild'
import type { PipelinePathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import type { BuildStageElementConfig } from '@pipeline/utils/pipelineTypes'
import type {
  K8sDirectInfraYaml,
  UseFromStageInfraYaml,
  VmInfraYaml,
  VmPoolYaml,
  Infrastructure,
  CIVolume,
  EmptyDirYaml,
  PersistentVolumeClaimYaml,
  HostPathYaml,
  Platform,
  Runtime
} from 'services/ci'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { k8sLabelRegex, k8sAnnotationRegex } from '@common/utils/StringUtils'
import ErrorsStripBinded from '@pipeline/components/ErrorsStrip/ErrorsStripBinded'
import { Connectors } from '@connectors/constants'
import { OsTypes, ArchTypes, CIBuildInfrastructureType } from '@pipeline/utils/constants'
import { BuildTabs } from '../CIPipelineStagesUtils'
import {
  KUBERNETES_HOSTED_INFRA_ID,
  ProvisionedByHarnessDelegateGroupIdentifier,
  ProvisioningStatus
} from '../../../pages/get-started-with-ci/InfraProvisioningWizard/Constants'
import { InfraProvisioningCarousel } from '../../../pages/get-started-with-ci/InfraProvisioningCarousel/InfraProvisioningCarousel'
import { ProvisioningStatusPill } from '../../../pages/get-started-with-ci/InfraProvisioningWizard/ProvisioningStatusPill'
import { useProvisionDelegateForHostedBuilds } from '../../../hooks/useProvisionDelegateForHostedBuilds'
import css from './BuildInfraSpecifications.module.scss'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

type VolumeInterface = CIVolume | EmptyDirYaml | PersistentVolumeClaimYaml | HostPathYaml
const logger = loggerFor(ModuleName.CD)
const k8sClusterKeyRef = 'connectors.title.k8sCluster'
const namespaceKeyRef = 'pipelineSteps.build.infraSpecifications.namespace'
const poolNameKeyRef = 'pipeline.buildInfra.poolName'

interface KubernetesBuildInfraFormValues {
  connectorRef?: string
  namespace?: string
  serviceAccountName?: string
  runAsUser?: string
  initTimeout?: string
  useFromStage?: string
  annotations?: MultiTypeMapUIType
  labels?: MultiTypeMapUIType
  priorityClassName?: string
  volumes?: VolumeInterface[]
  automountServiceAccountToken?: boolean
  privileged?: boolean
  allowPrivilegeEscalation?: boolean
  addCapabilities?: MultiTypeListUIType
  dropCapabilities?: MultiTypeListUIType
  runAsNonRoot?: boolean
  readOnlyRootFilesystem?: boolean
  tolerations?: { effect?: string; key?: string; operator?: string; value?: string }[]
  nodeSelector?: MultiTypeMapUIType
  harnessImageConnectorRef?: string
  os?: string
}

interface ContainerSecurityContext {
  privileged?: boolean
  allowPrivilegeEscalation?: boolean
  capabilities?: { add?: string[]; drop?: string[] }
  runAsNonRoot?: boolean
  readOnlyRootFilesystem?: boolean
  runAsUser?: number
}
interface AWSVMInfraFormValues {
  poolId?: string // deprecated
  poolName?: string
  harnessImageConnectorRef?: string
  os?: string
}

interface CloudInfraFormValues {
  os?: string
  arch?: string
}

type BuildInfraFormValues = (KubernetesBuildInfraFormValues | AWSVMInfraFormValues | CloudInfraFormValues) & {
  buildInfraType?: CIBuildInfrastructureType
}

enum Modes {
  Propagate,
  NewConfiguration
}

type FieldValueType = yup.Ref | yup.Schema<any> | yup.MixedSchema<any>

const runAsUserStringKey = 'pipeline.stepCommonFields.runAsUser'
const priorityClassNameStringKey = 'pipeline.buildInfra.priorityClassName'
const harnessImageConnectorRefKey = 'connectors.title.harnessImageConnectorRef'

const getInitialMapValues: (value: MultiTypeMapType) => MultiTypeMapUIType = value => {
  const map =
    typeof value === 'string'
      ? value
      : Object.keys(value || {}).map(key => ({
          id: uuid('', nameSpace()),
          key: key,
          value: value[key]
        }))

  return map
}

const getInitialListValues: (value: MultiTypeListType) => MultiTypeListUIType = value =>
  typeof value === 'string'
    ? value
    : value
        ?.filter((path: string) => !!path)
        ?.map((_value: string) => ({
          id: uuid('', nameSpace()),
          value: _value
        })) || []

const validateUniqueList = ({
  value,
  getString,
  uniqueKey,
  stringKey
}: {
  value: string[] | unknown
  getString: UseStringsReturn['getString']
  uniqueKey?: string
  stringKey?: keyof StringsMap
}): any => {
  if (Array.isArray(value)) {
    return yup.array().test('valuesShouldBeUnique', getString(stringKey || 'validation.uniqueValues'), list => {
      if (!list) {
        return true
      }

      return uniqBy(list, uniqueKey || 'value').length === list.length
    })
  } else {
    return yup.string()
  }
}

const getMapValues: (value: MultiTypeMapUIType) => MultiTypeMapType = value => {
  const map: MapType = {}
  if (Array.isArray(value)) {
    value.forEach(mapValue => {
      if (mapValue.key) {
        map[mapValue.key] = mapValue.value
      }
    })
  }

  return typeof value === 'string' ? value : map
}

const testLabelKey = (value: string): boolean => {
  return (
    ['accountid', 'orgid', 'projectid', 'pipelineid', 'pipelineexecutionid', 'stageid', 'buildnumber'].indexOf(
      value.toLowerCase()
    ) === -1
  )
}

const getFieldSchema = (
  value: FieldValueType,
  regex: RegExp,
  getString?: UseStringsReturn['getString']
): Record<string, any> => {
  if (Array.isArray(value)) {
    return yup
      .array()
      .of(
        yup.object().shape(
          {
            key: yup.string().when('value', {
              is: val => val?.length,
              then: yup
                .string()
                .matches(regex, getString?.('validation.validKeyRegex'))
                .required(getString?.('validation.keyRequired'))
            }),
            value: yup.string().when('key', {
              is: val => val?.length,
              then: yup.string().required(getString?.('validation.valueRequired'))
            })
          },
          [['key', 'value']]
        )
      )
      .test('keysShouldBeUnique', getString?.('validation.uniqueKeys') || '', map => {
        if (!map) return true

        return uniqBy(map, 'key').length === map.length
      })
  } else {
    return yup.string()
  }
}

const renderUseFromStageVM = ({
  propagatedStage,
  getString
}: {
  propagatedStage?: { stage?: BuildStageElementConfig }
  getString: UseStringsReturn['getString']
}): JSX.Element => {
  const poolName = ((propagatedStage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.poolName
  // poolId is deprecated
  const poolId = ((propagatedStage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.identifier

  return (
    <>
      {(poolName || poolId) && (
        <>
          <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
            {getString(poolNameKeyRef)}
          </Text>
          <Text color="black" margin={{ bottom: 'medium' }}>
            {poolName || poolId}
          </Text>
        </>
      )}
      {((propagatedStage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.os && (
        <>
          <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
            {getString('pipeline.infraSpecifications.os')}
          </Text>
          <Text color="black" margin={{ bottom: 'medium' }}>
            {((propagatedStage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.os}
          </Text>
        </>
      )}
      {((propagatedStage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec
        ?.harnessImageConnectorRef && (
        <>
          <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
            {getString(harnessImageConnectorRefKey)}
          </Text>
          <Text color="black" margin={{ bottom: 'medium' }}>
            {
              ((propagatedStage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec
                ?.harnessImageConnectorRef
            }
          </Text>
        </>
      )}
    </>
  )
}

const renderUseFromStageCloud = ({
  propagatedStage,
  getString
}: {
  propagatedStage?: { stage?: BuildStageElementConfig }
  getString: UseStringsReturn['getString']
}): JSX.Element => {
  return (
    <>
      {(propagatedStage?.stage?.spec?.platform as Platform)?.os && (
        <>
          <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
            {getString('pipeline.infraSpecifications.os')}
          </Text>
          <Text color="black" margin={{ bottom: 'medium' }}>
            {(propagatedStage?.stage?.spec?.platform as Platform).os}
          </Text>
        </>
      )}
      {(propagatedStage?.stage?.spec?.platform as Platform)?.arch && (
        <>
          <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
            {getString('pipeline.infraSpecifications.architecture')}
          </Text>
          <Text color="black" margin={{ bottom: 'medium' }}>
            {(propagatedStage?.stage?.spec?.platform as Platform).arch}
          </Text>
        </>
      )}
    </>
  )
}

export default function BuildInfraSpecifications({ children }: React.PropsWithChildren<unknown>): JSX.Element {
  const { module } = useParams<Partial<PipelineType<PipelinePathProps>>>()
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const gitScope = useGitScope()
  const {
    state: {
      pipeline,
      selectionState: { selectedStageId }
    },
    allowableTypes,
    isReadonly,
    updateStage,
    getStageFromPipeline
  } = usePipelineContext()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const {
    data: delegateDetails,
    refetch: fetchDelegateDetails,
    loading: fetchingDelegateDetails
  } = useGetDelegateGroupsNGV2({
    queryParams: { accountId },
    lazy: true
  })
  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)
  const formikRef = React.useRef<FormikProps<BuildInfraFormValues>>()
  const { initiateProvisioning, delegateProvisioningStatus } = useProvisionDelegateForHostedBuilds()
  const { CIE_HOSTED_VMS, CI_DOCKER_INFRASTRUCTURE } = useFeatureFlags()
  const { enabledHostedBuildsForFreeUsers } = useHostedBuilds()
  const [isProvisionedByHarnessDelegateHealthy, setIsProvisionedByHarnessDelegateHealthy] = useState<boolean>(false)

  const BuildInfraTypes: ThumbnailSelectProps['items'] = [
    ...(enabledHostedBuildsForFreeUsers && CIE_HOSTED_VMS
      ? [
          {
            label: getString('ci.buildInfra.cloud'),
            icon: 'harness',
            value: CIBuildInfrastructureType.Cloud
          } as Item
        ]
      : []),
    ...(enabledHostedBuildsForFreeUsers && !CIE_HOSTED_VMS
      ? [
          {
            label: getString('ci.getStartedWithCI.hostedByHarness'),
            icon: 'harness',
            value: CIBuildInfrastructureType.KubernetesHosted
          } as Item
        ]
      : []),
    {
      label: getString('pipeline.serviceDeploymentTypes.kubernetes'),
      icon: 'service-kubernetes',
      value: CIBuildInfrastructureType.KubernetesDirect
    },
    ...(CI_DOCKER_INFRASTRUCTURE
      ? [
          {
            label: getString('delegate.cardData.docker.name'),
            icon: 'docker-step',
            value: CIBuildInfrastructureType.Docker
          } as Item
        ]
      : []),
    {
      label: getString('ci.buildInfra.vMs'),
      icon: 'service-vm',
      value: CIBuildInfrastructureType.VM
    } as Item
  ]
  const [showInfraProvisioningCarousel, setShowInfraProvisioningCarousel] = useState<boolean>(false)

  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  const { stage } = getStageFromPipeline<BuildStageElementConfig>(selectedStageId || '')

  const [currentMode, setCurrentMode] = React.useState(() =>
    (stage?.stage?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage
      ? Modes.Propagate
      : Modes.NewConfiguration
  )

  const { index: stageIndex } = getStageIndexFromPipeline(pipeline, selectedStageId || '')
  const { stages } = getFlattenedStages(pipeline)
  const { stage: propagatedStage } = getStageFromPipeline<BuildStageElementConfig>(
    (stage?.stage?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage || ''
  )

  const [buildInfraType, setBuildInfraType] = useState<CIBuildInfrastructureType | undefined>(undefined)

  React.useEffect(() => {
    if (
      !fetchingDelegateDetails &&
      delegateDetails?.resource?.delegateGroupDetails?.find(
        (item: DelegateGroupDetails) => item?.delegateGroupIdentifier === ProvisionedByHarnessDelegateGroupIdentifier
      )?.activelyConnected
    ) {
      setIsProvisionedByHarnessDelegateHealthy(true)
    }
  }, [fetchingDelegateDetails, delegateDetails])

  React.useEffect(() => {
    if (isProvisionedByHarnessDelegateHealthy) {
      formikRef?.current?.validateForm()
    }
  }, [isProvisionedByHarnessDelegateHealthy])

  React.useEffect(() => {
    if (delegateProvisioningStatus === ProvisioningStatus.IN_PROGRESS) {
      setShowInfraProvisioningCarousel(true)
    } else if (delegateProvisioningStatus === ProvisioningStatus.SUCCESS) {
      formikRef?.current?.validateForm()
    }
  }, [delegateProvisioningStatus])

  React.useEffect(() => {
    const stageBuildInfraType =
      (stage?.stage?.spec?.infrastructure?.type as CIBuildInfrastructureType) ||
      (stage?.stage?.spec?.runtime?.type as CIBuildInfrastructureType)
    const propagatedStageType =
      (propagatedStage?.stage?.spec?.infrastructure?.type as CIBuildInfrastructureType) ||
      (propagatedStage?.stage?.spec?.runtime?.type as CIBuildInfrastructureType)
    currentMode === Modes.NewConfiguration
      ? setBuildInfraType(stageBuildInfraType)
      : setBuildInfraType(propagatedStageType)
  }, [stage, propagatedStage, currentMode])

  /* If a stage A propagates it's infra from another stage B and number of stages in the pipeline change due to deletion of propagated stage B, then infra for stage A needs to be reset */
  React.useEffect(() => {
    const stageData = stage?.stage
    const propagatedStageId = (stageData?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage
    if (stageData && propagatedStageId) {
      if (!propagatedStage) {
        set(stageData, 'spec.infrastructure', {
          useFromStage: {}
        })
        set(stageData, 'spec.runtime', undefined)
        set(stageData, 'spec.platform', undefined)
        setCurrentMode(Modes.NewConfiguration)
      }
    }
  }, [pipeline?.stages?.length])

  React.useEffect(() => {
    subscribeForm({
      tab: BuildTabs.INFRASTRUCTURE,
      form: formikRef as React.MutableRefObject<FormikProps<unknown> | null>
    })
    return () =>
      unSubscribeForm({
        tab: BuildTabs.INFRASTRUCTURE,
        form: formikRef as React.MutableRefObject<FormikProps<unknown> | null>
      })
  }, [])

  const otherBuildStagesWithInfraConfigurationOptions: { label: string; value: string }[] = []

  if (stages && stages.length > 0) {
    stages.forEach((item, index) => {
      if (
        index < stageIndex &&
        item.stage?.type === 'CI' &&
        (((item.stage as BuildStageElementConfig)?.spec?.infrastructure as K8sDirectInfraYaml)?.spec ||
          (item.stage as BuildStageElementConfig)?.spec?.platform)
      ) {
        otherBuildStagesWithInfraConfigurationOptions.push({
          label: `Stage [${item.stage.name}]`,
          value: item.stage.identifier
        })
      }
    })
  }

  const getKubernetesInfraPayload = useMemo((): BuildInfraFormValues => {
    const autoServiceAccountToken = (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
      ?.automountServiceAccountToken
    return {
      namespace: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.namespace,
      serviceAccountName: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.serviceAccountName,
      volumes: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.volumes,
      runAsUser:
        ((stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext
          ?.runAsUser as unknown as string) ||
        ((stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.runAsUser as unknown as string), // migrate deprecated runAsUser
      initTimeout: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.initTimeout,
      annotations: getInitialMapValues(
        (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.annotations || {}
      ),
      labels: getInitialMapValues((stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.labels || {}),
      buildInfraType: CIBuildInfrastructureType.KubernetesDirect,
      priorityClassName: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
        ?.priorityClassName as unknown as string,
      automountServiceAccountToken: typeof autoServiceAccountToken === 'undefined' ? true : autoServiceAccountToken,
      privileged: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext
        ?.privileged,
      allowPrivilegeEscalation: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
        ?.containerSecurityContext?.allowPrivilegeEscalation,
      addCapabilities: getInitialListValues(
        (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext?.capabilities?.add ||
          []
      ),
      dropCapabilities: getInitialListValues(
        (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext?.capabilities
          ?.drop || []
      ),
      runAsNonRoot: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext
        ?.runAsNonRoot,
      readOnlyRootFilesystem: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext
        ?.readOnlyRootFilesystem,
      tolerations: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.tolerations,
      nodeSelector: getInitialMapValues(
        (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.nodeSelector || {}
      ),
      harnessImageConnectorRef: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
        ?.harnessImageConnectorRef,
      os: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.os || OsTypes.Linux
    }
  }, [stage])

  const getVmInfraPayload = useMemo(
    (): BuildInfraFormValues => ({
      buildInfraType: CIBuildInfrastructureType.VM,
      harnessImageConnectorRef: ((stage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec
        ?.harnessImageConnectorRef,
      os: ((stage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.os || OsTypes.Linux
    }),
    [stage]
  )

  const getInitialValues = useMemo((): BuildInfraFormValues => {
    const additionalDefaultFields: { automountServiceAccountToken?: boolean } = {}
    if (
      buildInfraType === CIBuildInfrastructureType.KubernetesDirect ||
      (stage?.stage?.spec?.infrastructure as Infrastructure)?.type === CIBuildInfrastructureType.KubernetesDirect
    ) {
      additionalDefaultFields.automountServiceAccountToken = true
    }
    if (stage?.stage?.spec?.infrastructure) {
      if ((stage?.stage?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage) {
        return {
          useFromStage: (stage?.stage?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage,
          buildInfraType: undefined
        }
      } else {
        const infraType = (stage?.stage?.spec?.infrastructure as Infrastructure)?.type
        if (infraType === CIBuildInfrastructureType.KubernetesDirect) {
          const connectorId =
            ((stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.connectorRef as string) || ''
          if (!isEmpty(connectorId)) {
            return {
              connectorRef: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.connectorRef,
              ...getKubernetesInfraPayload
            }
          } else {
            return {
              connectorRef: undefined,
              ...getKubernetesInfraPayload
            }
          }
        } else if (infraType === CIBuildInfrastructureType.VM) {
          const identifier =
            ((stage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.poolName ||
            ((stage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.identifier ||
            ''
          if (!isEmpty(identifier)) {
            return {
              poolName: identifier,
              ...getVmInfraPayload
            }
          } else {
            return {
              poolName: '',
              ...getVmInfraPayload
            }
          }
        } else if (enabledHostedBuildsForFreeUsers && infraType === CIBuildInfrastructureType.KubernetesHosted) {
          return {
            buildInfraType: CIBuildInfrastructureType.KubernetesHosted
          }
        }
        return {
          connectorRef: undefined,
          namespace: '',
          annotations: '',
          labels: '',
          buildInfraType: undefined,
          poolName: undefined,
          harnessImageConnectorRef: undefined,
          os: OsTypes.Linux,
          ...additionalDefaultFields
        }
      }
    }
    if (stage?.stage?.spec?.runtime) {
      return {
        buildInfraType: (stage?.stage?.spec?.runtime as Runtime)?.type as CIBuildInfrastructureType,
        os: (stage?.stage?.spec?.platform as Platform)?.os || OsTypes.Linux,
        arch: (stage?.stage?.spec?.platform as Platform)?.arch || ArchTypes.Amd64
      }
    }

    return {
      connectorRef: undefined,
      namespace: '',
      annotations: '',
      labels: '',
      buildInfraType: undefined,
      poolName: undefined,
      harnessImageConnectorRef: undefined,
      os: OsTypes.Linux,
      arch: ArchTypes.Amd64,
      ...additionalDefaultFields
    }
  }, [stage])

  const handleValidate = (values: any): void => {
    if (stage) {
      const _buildInfraType: CIBuildInfrastructureType = values.buildInfraType || buildInfraType
      const errors: { [key: string]: string } = {}
      const stageData = produce(stage, draft => {
        if (currentMode === Modes.Propagate && values.useFromStage) {
          const { stage: validationPropagatedStage } = getStageFromPipeline<BuildStageElementConfig>(
            values.useFromStage
          )
          if (validationPropagatedStage?.stage?.spec?.infrastructure) {
            set(draft, 'stage.spec.infrastructure', {
              useFromStage: values.useFromStage
            })
            set(draft, 'stage.spec.platform', undefined)
            set(draft, 'stage.spec.runtime', undefined)
          }
          if (validationPropagatedStage?.stage?.spec?.platform && validationPropagatedStage.stage.spec.runtime) {
            set(draft, 'stage.spec.infrastructure', undefined)
            set(draft, 'stage.spec.platform', validationPropagatedStage?.stage?.spec?.platform)
            set(draft, 'stage.spec.runtime', validationPropagatedStage?.stage?.spec?.runtime)
          }
        } else if ([CIBuildInfrastructureType.Cloud, CIBuildInfrastructureType.Docker].includes(_buildInfraType)) {
          set(draft, 'stage.spec.platform', {
            os: values.os,
            arch: values.arch
          })
          set(draft, 'stage.spec.runtime', {
            type: _buildInfraType,
            spec: {}
          })
          set(draft, 'stage.spec.infrastructure', undefined)
        } else if (_buildInfraType !== CIBuildInfrastructureType.KubernetesHosted) {
          const filteredLabels = getMapValues(
            Array.isArray(values.labels) ? values.labels.filter((val: any) => testLabelKey(val.key)) : values.labels
          )
          const filteredTolerations = Array.isArray(values.tolerations)
            ? values.tolerations.map(
                (val: { effect?: string; key?: string; operator?: string; value?: string; id?: string }) => {
                  const newVal = val
                  delete newVal.id
                  return newVal
                }
              )
            : values.tolerations

          const filteredVolumes = Array.isArray(values.volumes)
            ? values.volumes.filter(
                (volume: EmptyDirYaml | PersistentVolumeClaimYaml | HostPathYaml) => volume.mountPath && volume.type
              )
            : values.volumes

          const harnessImageConnectorRef =
            values?.harnessImageConnectorRef === ''
              ? undefined
              : values?.harnessImageConnectorRef?.value || values?.harnessImageConnectorRef

          try {
            getDurationValidationSchema().validateSync(values.initTimeout)
          } catch (e) {
            errors.initTimeout = e.message
          }
          const additionalKubernetesFields: { containerSecurityContext?: ContainerSecurityContext } = {}
          if (_buildInfraType === CIBuildInfrastructureType.KubernetesDirect) {
            const containerSecurityContext: ContainerSecurityContext = {
              capabilities: {}
            }
            if (typeof values.privileged !== 'undefined') {
              containerSecurityContext.privileged = values.privileged
            }

            if (typeof values.allowPrivilegeEscalation !== 'undefined') {
              containerSecurityContext.allowPrivilegeEscalation = values.allowPrivilegeEscalation
            }

            if (typeof values.runAsNonRoot !== 'undefined') {
              containerSecurityContext.runAsNonRoot = values.runAsNonRoot
            }

            if (typeof values.readOnlyRootFilesystem !== 'undefined') {
              containerSecurityContext.readOnlyRootFilesystem = values.readOnlyRootFilesystem
            }

            if (typeof values.runAsUser !== 'undefined') {
              containerSecurityContext.runAsUser = values.runAsUser
            }

            if (containerSecurityContext?.capabilities && values.addCapabilities && values.addCapabilities.length > 0) {
              containerSecurityContext.capabilities.add =
                typeof values.addCapabilities === 'string'
                  ? values.addCapabilities
                  : values.addCapabilities.map((listValue: { id: string; value: string }) => listValue.value)
            }
            if (
              containerSecurityContext?.capabilities &&
              values.dropCapabilities &&
              values.dropCapabilities.length > 0
            ) {
              containerSecurityContext.capabilities.drop =
                typeof values.dropCapabilities === 'string'
                  ? values.dropCapabilities
                  : values.dropCapabilities.map((listValue: { id: string; value: string }) => listValue.value)
            }
            if (containerSecurityContext.capabilities && isEmpty(containerSecurityContext.capabilities)) {
              delete containerSecurityContext.capabilities
            }
            if (!isEmpty(containerSecurityContext) && values.os !== OsTypes.Windows) {
              additionalKubernetesFields.containerSecurityContext = containerSecurityContext
            }
          }
          set(
            draft,
            'stage.spec.infrastructure',
            _buildInfraType === CIBuildInfrastructureType.KubernetesDirect
              ? {
                  type: CIBuildInfrastructureType.KubernetesDirect,
                  spec: {
                    connectorRef:
                      values?.connectorRef?.value ||
                      values?.connectorRef ||
                      (draft.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.connectorRef,
                    namespace: values.namespace,
                    ...(filteredVolumes?.length ? { volumes: filteredVolumes } : {}),
                    serviceAccountName: values.serviceAccountName,
                    runAsUser: values.runAsUser,
                    initTimeout: errors.initTimeout ? undefined : values.initTimeout,
                    annotations: getMapValues(values.annotations),
                    labels: !isEmpty(filteredLabels) ? filteredLabels : undefined,
                    automountServiceAccountToken: values.automountServiceAccountToken,
                    priorityClassName: values.priorityClassName,
                    ...(filteredTolerations?.length ? { tolerations: filteredTolerations } : {}),
                    nodeSelector: getMapValues(values.nodeSelector),
                    ...additionalKubernetesFields,
                    harnessImageConnectorRef,
                    os: values.os
                  }
                }
              : _buildInfraType === CIBuildInfrastructureType.VM
              ? {
                  type: CIBuildInfrastructureType.VM,
                  spec: {
                    type: 'Pool',
                    spec: {
                      poolName: values.poolName,
                      harnessImageConnectorRef,
                      os: values.os
                    }
                  }
                }
              : { type: undefined, spec: {} }
          )

          if (
            !values.annotations ||
            !values.annotations.length ||
            (values.annotations.length === 1 && !values.annotations[0].key)
          ) {
            delete (draft.stage?.spec?.infrastructure as K8sDirectInfraYaml).spec.annotations
          }

          if (
            values.runAsUser &&
            ((draft?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext?.runAsUser ||
              values.os === OsTypes.Windows)
          ) {
            // move deprecated runAsUser to containerSecurityContext
            delete (draft.stage?.spec?.infrastructure as K8sDirectInfraYaml).spec.runAsUser
          }

          set(draft, 'stage.spec.platform', undefined)
          set(draft, 'stage.spec.runtime', undefined)
        } else {
          if (get(stage, 'stage.spec.infrastructure.spec.identifier') !== KUBERNETES_HOSTED_INFRA_ID) {
            set(draft, 'stage.spec.infrastructure', {
              type: CIBuildInfrastructureType.KubernetesHosted,
              ...((isProvisionedByHarnessDelegateHealthy ||
                delegateProvisioningStatus === ProvisioningStatus.SUCCESS) && {
                spec: { identifier: KUBERNETES_HOSTED_INFRA_ID }
              })
            })
          }

          set(draft, 'stage.spec.platform', undefined)
          set(draft, 'stage.spec.runtime', undefined)
        }
      })
      const shouldUpdate = stageData.stage && JSON.stringify(stage.stage) !== JSON.stringify(stageData.stage)
      if (stageData.stage && shouldUpdate) {
        updateStage(stageData.stage)
      }

      return values.labels?.reduce?.((acc: Record<string, string>, curr: any, index: number) => {
        if (!testLabelKey(curr.key)) {
          acc[`labels[${index}].key`] = curr.key + ' is not allowed.'
        }
        return acc
      }, errors)
    }
  }

  const renderTimeOutFields = React.useCallback((): React.ReactElement => {
    return (
      <>
        <Container className={css.bottomMargin7}>
          <FormMultiTypeDurationField
            name="initTimeout"
            multiTypeDurationProps={{ expressions, allowableTypes }}
            label={
              <Text
                font={{ variation: FontVariation.FORM_LABEL }}
                margin={{ bottom: 'xsmall' }}
                tooltipProps={{ dataTooltipId: 'timeout' }}
              >
                {getString('pipeline.infraSpecifications.initTimeout')}
              </Text>
            }
            disabled={isReadonly}
            style={{ width: 300 }}
          />
        </Container>
      </>
    )
  }, [])

  const renderCheckboxFields = React.useCallback(
    ({
      name,
      stringKey,
      tooltipId
    }: {
      name: string
      stringKey: keyof StringsMap
      tooltipId: string
    }): React.ReactElement => {
      return (
        <>
          <Container width={300}>
            <FormMultiTypeCheckboxField
              name={name}
              label={getString(stringKey)}
              multiTypeTextbox={{
                expressions,
                allowableTypes,
                disabled: isReadonly
              }}
              tooltipProps={{ dataTooltipId: tooltipId }}
              disabled={isReadonly}
            />
          </Container>
        </>
      )
    },
    []
  )

  const renderMultiTypeMap = React.useCallback(
    ({ fieldName, stringKey }: { fieldName: string; stringKey: keyof StringsMap }): React.ReactElement => (
      <Container className={cx(css.bottomMargin7, css.formGroup)}>
        <MultiTypeMap
          appearance={'minimal'}
          cardStyle={{ width: '50%' }}
          name={fieldName}
          valueMultiTextInputProps={{ expressions, allowableTypes }}
          multiTypeFieldSelectorProps={{
            label: (
              <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
                {getString(stringKey)}
              </Text>
            ),
            disableTypeSelection: true
          }}
          disabled={isReadonly}
        />
      </Container>
    ),
    [expressions]
  )

  const renderContainerSecurityContext = React.useCallback(
    ({ formik }: { formik: FormikProps<unknown> }): JSX.Element => {
      return (
        <>
          <Separator topSeparation={0} />
          <div className={css.tabSubHeading} id="containerSecurityContext">
            {getString('pipeline.buildInfra.containerSecurityContext')}
          </div>
          {renderCheckboxFields({
            name: 'privileged',
            stringKey: 'pipeline.buildInfra.privileged',
            tooltipId: 'privileged'
          })}
          {renderCheckboxFields({
            name: 'allowPrivilegeEscalation',
            stringKey: 'pipeline.buildInfra.allowPrivilegeEscalation',
            tooltipId: 'allowPrivilegeEscalation'
          })}
          <Container className={css.bottomMargin7} width={300}>
            <MultiTypeList
              name="addCapabilities"
              multiTextInputProps={{
                expressions,
                allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
              }}
              formik={formik}
              multiTypeFieldSelectorProps={{
                label: (
                  <Text tooltipProps={{ dataTooltipId: 'addCapabilities' }}>
                    {getString('pipeline.buildInfra.addCapabilities')}
                  </Text>
                ),
                allowedTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]
              }}
              disabled={isReadonly}
            />
          </Container>
          <Container width={300} className={css.bottomMargin7}>
            <MultiTypeList
              name="dropCapabilities"
              multiTextInputProps={{
                expressions,
                allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
              }}
              formik={formik}
              multiTypeFieldSelectorProps={{
                label: (
                  <Text tooltipProps={{ dataTooltipId: 'dropCapabilities' }}>
                    {getString('pipeline.buildInfra.dropCapabilities')}
                  </Text>
                ),
                allowedTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION, MultiTypeInputType.RUNTIME]
              }}
              disabled={isReadonly}
            />
          </Container>
          {renderCheckboxFields({
            name: 'runAsNonRoot',
            stringKey: 'pipeline.buildInfra.runAsNonRoot',
            tooltipId: 'runAsNonRoot'
          })}
          {renderCheckboxFields({
            name: 'readOnlyRootFilesystem',
            stringKey: 'pipeline.buildInfra.readOnlyRootFilesystem',
            tooltipId: 'readOnlyRootFilesystem'
          })}
          <Container className={css.bottomMargin7}>
            <MultiTypeTextField
              label={
                <Text
                  font={{ variation: FontVariation.FORM_LABEL }}
                  margin={{ bottom: 'xsmall' }}
                  tooltipProps={{ dataTooltipId: 'runAsUser' }}
                >
                  {getString(runAsUserStringKey)}
                </Text>
              }
              name="runAsUser"
              style={{ width: 300, marginBottom: 'var(--spacing-xsmall)' }}
              multiTextInputProps={{
                multiTextInputProps: { expressions, allowableTypes },
                disabled: isReadonly,
                placeholder: '1000'
              }}
            />
          </Container>
          <Separator topSeparation={0} />
        </>
      )
    },
    [expressions]
  )

  const renderKubernetesBuildInfraAdvancedSection = React.useCallback(
    ({ showCardView = false, formik }: { formik: any; showCardView?: boolean }): React.ReactElement => {
      return (
        <Container padding={{ bottom: 'medium' }}>
          <Accordion activeId={''}>
            <Accordion.Panel
              id="advanced"
              addDomId={true}
              summary={
                <div
                  className={css.tabHeading}
                  id="advanced"
                  style={{ paddingLeft: 'var(--spacing-small)', marginBottom: 0 }}
                >
                  {getString('advancedTitle')}
                </div>
              }
              details={
                showCardView ? (
                  <Card disabled={isReadonly} className={css.sectionCard}>
                    {renderAccordianDetailSection({ formik })}
                  </Card>
                ) : (
                  renderAccordianDetailSection({ formik })
                )
              }
            />
          </Accordion>
        </Container>
      )
    },
    [expressions]
  )

  const renderPropagateKeyValuePairs = ({
    keyValue,
    stringKey
  }: {
    keyValue: string | string[] | any
    stringKey: keyof StringsMap
  }): JSX.Element | undefined =>
    keyValue && (
      <>
        <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
          {getString(stringKey)}
        </Text>
        {typeof keyValue === 'string' ? (
          <Text className={css.bottomMargin3} color="black">
            {keyValue}
          </Text>
        ) : (
          <ul className={css.plainList}>
            {Object.entries(keyValue || {})?.map((entry: [string, unknown], idx: number) => (
              <li key={idx}>
                <Text color="black">
                  {entry[0]}:{entry[1]}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </>
    )

  const renderPropagateList = ({
    value,
    stringKey
  }: {
    value: string | string[] | any
    stringKey: keyof StringsMap
  }): JSX.Element | undefined =>
    value && (
      <>
        <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
          {getString(stringKey)}
        </Text>
        {typeof value === 'string' ? (
          <Text className={css.bottomMargin3} color="black">
            {value}
          </Text>
        ) : (
          <ul className={css.plainList}>
            {value?.map((str: string, idx: number) => (
              <li key={idx}>
                <Text color="black">{str}</Text>
              </li>
            ))}
          </ul>
        )}
      </>
    )

  const renderPropagateDynamicList = ({
    value,
    stringKey
  }: {
    value: string | string[] | any
    stringKey: keyof StringsMap
  }): JSX.Element | undefined =>
    value && (
      <>
        <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
          {getString(stringKey)}
        </Text>
        {typeof value === 'string' ? (
          <Text margin={{ bottom: 'xsmall' }} color="black">
            {value}
          </Text>
        ) : (
          <ul className={css.plainList}>
            {value.map((row: { [key: string]: string | { spec: { [key: string]: string } } }[], idx: number) => {
              const entries = Object.entries(row)
              return (
                <li key={idx}>
                  <Text color="black" lineClamp={1} width={371}>
                    {entries.map(entry => {
                      if (typeof entry[1] === 'string' && entry[1] !== '') {
                        return `${entry[0]}:${entry[1]} `
                      } else if (entry[0] === 'spec' && typeof entry[1] === 'object') {
                        // special handling for Volumes
                        const nestedEntries = Object.entries(entry[1] || {})
                        return nestedEntries.map(nestedEntry =>
                          typeof entry[1] === 'string' && entry[1] !== '' ? `${nestedEntry[0]}:${nestedEntry[1]} ` : ''
                        )
                      } else {
                        return ''
                      }
                    })}
                  </Text>
                </li>
              )
            })}
          </ul>
        )}
      </>
    )

  const renderPlatformInfraSection = (): React.ReactElement => (
    <>
      <MultiTypeSelectField
        label={
          <Text
            tooltipProps={{ dataTooltipId: 'os' }}
            font={{ variation: FontVariation.FORM_LABEL }}
            margin={{ bottom: 'xsmall' }}
          >
            {getString('pipeline.infraSpecifications.selectOs')}
          </Text>
        }
        name={'os'}
        style={{ width: 300, paddingBottom: 'var(--spacing-small)' }}
        multiTypeInputProps={{
          selectItems: [
            { label: getString('delegate.cardData.linux.name'), value: OsTypes.Linux },
            { label: getString('pipeline.infraSpecifications.osTypes.macos'), value: OsTypes.MacOS },
            {
              label: getString('pipeline.infraSpecifications.osTypes.windows'),
              value: OsTypes.Windows
            }
          ],
          multiTypeInputProps: {
            allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME],
            disabled: isReadonly
          }
        }}
        useValue
      />
      {[CIBuildInfrastructureType.Cloud, CIBuildInfrastructureType.Docker].includes(
        buildInfraType as CIBuildInfrastructureType
      ) && (
        <MultiTypeSelectField
          label={
            <Text
              tooltipProps={{ dataTooltipId: 'arch' }}
              font={{ variation: FontVariation.FORM_LABEL }}
              margin={{ bottom: 'xsmall' }}
            >
              {getString('pipeline.infraSpecifications.selectArchitecture')}
            </Text>
          }
          name={'arch'}
          style={{ width: 300, paddingBottom: 'var(--spacing-small)' }}
          multiTypeInputProps={{
            selectItems: [
              {
                label: getString('pipeline.infraSpecifications.architectureTypes.amd64'),
                value: ArchTypes.Amd64
              },
              {
                label: getString('pipeline.infraSpecifications.architectureTypes.arm64'),
                value: ArchTypes.Arm64
              }
            ],
            multiTypeInputProps: {
              allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME],
              disabled: isReadonly
            }
          }}
          useValue
        />
      )}
    </>
  )

  const renderBuildInfraMainSection = React.useCallback((): React.ReactElement => {
    switch (buildInfraType) {
      case CIBuildInfrastructureType.KubernetesDirect:
        return renderKubernetesBuildInfraForm()
      case CIBuildInfrastructureType.VM:
        return renderAWSVMBuildInfraForm()
      case CIBuildInfrastructureType.KubernetesHosted:
        /* Button to start provisioning should be shown only if provisioned delegate is not healthy */
        return fetchingDelegateDetails ? (
          <PageSpinner />
        ) : isProvisionedByHarnessDelegateHealthy ? (
          <></>
        ) : !(stage?.stage?.spec?.infrastructure as any)?.spec?.identifier ? (
          /* For Hosted K8s Build Infra, populate infrastructure yaml only once provisioning is done. Once done, button to start provisioning should go away. */
          <Layout.Vertical spacing="medium">
            <Text font={{ variation: FontVariation.FORM_INPUT_TEXT }}>
              {getString('ci.getStartedWithCI.provisioningHelpText')}
            </Text>

            <Container width="25%" padding={{ bottom: 'medium' }}>
              <ProvisioningStatusPill
                provisioningStatus={delegateProvisioningStatus}
                onStartProvisioning={() => initiateProvisioning()}
                showProvisioningStatus={false}
              />
            </Container>
          </Layout.Vertical>
        ) : (
          <></>
        )
      default:
        return <></>
    }
  }, [
    buildInfraType,
    delegateProvisioningStatus,
    stage,
    isProvisionedByHarnessDelegateHealthy,
    fetchingDelegateDetails
  ])

  const renderHarnessImageConnectorRefField = React.useCallback((): React.ReactElement => {
    return (
      <div className={cx(css.fieldsGroup, css.withoutSpacing)}>
        <FormMultiTypeConnectorField
          width={300}
          name="harnessImageConnectorRef"
          label={
            <Text
              tooltipProps={{ dataTooltipId: 'harnessImageConnectorRef' }}
              font={{ variation: FontVariation.FORM_LABEL }}
              margin={{ bottom: 'xsmall' }}
            >
              {`${getString(harnessImageConnectorRefKey)} ${getString('common.optionalLabel')}`}
            </Text>
          }
          placeholder={getString('connectors.placeholder.harnessImageConnectorRef')}
          accountIdentifier={accountId}
          projectIdentifier={projectIdentifier}
          orgIdentifier={orgIdentifier}
          gitScope={gitScope}
          multiTypeProps={{
            disabled: isReadonly,
            allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]
          }}
          type={Connectors.DOCKER}
        />
      </div>
    )
  }, [])

  const renderAWSVMBuildInfraForm = React.useCallback((): React.ReactElement => {
    return (
      <>
        <div className={cx(css.fieldsGroup, css.withoutSpacing)}>
          <MultiTypeTextField
            label={
              <Text
                tooltipProps={{ dataTooltipId: 'poolName' }}
                font={{ variation: FontVariation.FORM_LABEL }}
                margin={{ bottom: 'xsmall' }}
              >
                {getString('pipeline.buildInfra.poolName')}
              </Text>
            }
            name={'poolName'}
            style={{ width: 300 }}
            multiTextInputProps={{
              multiTextInputProps: { expressions, allowableTypes },
              disabled: isReadonly
            }}
          />
        </div>
        {!CIE_HOSTED_VMS && !CI_DOCKER_INFRASTRUCTURE && (
          <div className={cx(css.fieldsGroup, css.withoutSpacing)}>
            <MultiTypeSelectField
              label={
                <Text
                  tooltipProps={{ dataTooltipId: 'os' }}
                  font={{ variation: FontVariation.FORM_LABEL }}
                  margin={{ bottom: 'xsmall' }}
                >
                  {getString('pipeline.infraSpecifications.os')}
                </Text>
              }
              name={'os'}
              style={{ width: 300, paddingBottom: 'var(--spacing-small)' }}
              multiTypeInputProps={{
                selectItems: [
                  { label: getString('delegate.cardData.linux.name'), value: OsTypes.Linux },
                  { label: getString('pipeline.infraSpecifications.osTypes.macos'), value: OsTypes.MacOS },
                  { label: getString('pipeline.infraSpecifications.osTypes.windows'), value: OsTypes.Windows }
                ],
                multiTypeInputProps: {
                  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME],
                  disabled: isReadonly
                }
              }}
              useValue
            />
          </div>
        )}
        {renderHarnessImageConnectorRefField()}
      </>
    )
  }, [])

  const renderKubernetesBuildInfraForm = React.useCallback((): React.ReactElement => {
    return (
      <>
        <div className={cx(css.fieldsGroup, css.withoutSpacing)}>
          <FormMultiTypeConnectorField
            width={300}
            name="connectorRef"
            label={
              <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
                {getString(k8sClusterKeyRef)}
              </Text>
            }
            placeholder={getString('pipelineSteps.build.infraSpecifications.kubernetesClusterPlaceholder')}
            accountIdentifier={accountId}
            projectIdentifier={projectIdentifier}
            orgIdentifier={orgIdentifier}
            gitScope={gitScope}
            multiTypeProps={{ expressions, disabled: isReadonly, allowableTypes }}
          />
        </div>
        <div className={cx(css.fieldsGroup, css.withoutSpacing)}>
          <MultiTypeTextField
            label={
              <Text
                tooltipProps={{ dataTooltipId: 'namespace' }}
                font={{ variation: FontVariation.FORM_LABEL }}
                margin={{ bottom: 'xsmall' }}
              >
                {getString(namespaceKeyRef)}
              </Text>
            }
            name={'namespace'}
            style={{ width: 300, paddingBottom: 'var(--spacing-small)' }}
            multiTextInputProps={{
              multiTextInputProps: { expressions, allowableTypes },
              disabled: isReadonly,
              placeholder: getString('pipeline.infraSpecifications.namespacePlaceholder')
            }}
          />
        </div>
        {!CIE_HOSTED_VMS && !CI_DOCKER_INFRASTRUCTURE && (
          <div className={cx(css.fieldsGroup, css.withoutSpacing)}>
            <MultiTypeSelectField
              label={
                <Text
                  tooltipProps={{ dataTooltipId: 'os' }}
                  font={{ variation: FontVariation.FORM_LABEL }}
                  margin={{ bottom: 'xsmall' }}
                >
                  {getString('pipeline.infraSpecifications.os')}
                </Text>
              }
              name={'os'}
              style={{ width: 300, paddingBottom: 'var(--spacing-small)' }}
              multiTypeInputProps={{
                selectItems: [
                  { label: getString('delegate.cardData.linux.name'), value: OsTypes.Linux },
                  { label: getString('pipeline.infraSpecifications.osTypes.windows'), value: OsTypes.Windows }
                ],
                multiTypeInputProps: {
                  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME],
                  disabled: isReadonly
                }
              }}
              useValue
            />
          </div>
        )}
      </>
    )
  }, [expressions])

  const renderAccordianDetailSection = React.useCallback(
    ({ formik }: { formik: any }): React.ReactElement => {
      const tolerationsValue = get(formik?.values, 'tolerations')
      const showContainerSecurityContext = get(formik?.values, 'os') !== OsTypes.Windows
      return (
        <>
          <Container className={css.bottomMargin7}>
            <Volumes
              name="volumes"
              formik={formik}
              expressions={expressions}
              disabled={isReadonly}
              allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]}
            />
          </Container>
          <Container className={css.bottomMargin4}>
            <MultiTypeTextField
              label={
                <Text
                  font={{ variation: FontVariation.FORM_LABEL }}
                  margin={{ bottom: 'xsmall' }}
                  tooltipProps={{ dataTooltipId: 'serviceAccountName' }}
                >
                  {getString('pipeline.infraSpecifications.serviceAccountName')}
                </Text>
              }
              name="serviceAccountName"
              style={{ width: 300 }}
              multiTextInputProps={{
                multiTextInputProps: { expressions, allowableTypes },
                disabled: isReadonly,
                placeholder: getString('pipeline.infraSpecifications.serviceAccountNamePlaceholder')
              }}
            />
          </Container>
          <Container width={300}>
            <FormMultiTypeCheckboxField
              name="automountServiceAccountToken"
              label={getString('pipeline.buildInfra.automountServiceAccountToken')}
              multiTypeTextbox={{
                expressions,
                allowableTypes,
                disabled: isReadonly
              }}
              tooltipProps={{ dataTooltipId: 'automountServiceAccountToken' }}
              disabled={isReadonly}
            />
          </Container>
          <Container className={css.bottomMargin7}>
            {renderMultiTypeMap({ fieldName: 'labels', stringKey: 'ci.labels' })}
          </Container>
          <Container className={css.bottomMargin7}>
            {renderMultiTypeMap({ fieldName: 'annotations', stringKey: 'ci.annotations' })}
          </Container>
          {showContainerSecurityContext && renderContainerSecurityContext({ formik })}
          <Container className={css.bottomMargin7}>
            <MultiTypeTextField
              label={
                <Text
                  font={{ variation: FontVariation.FORM_LABEL }}
                  margin={{ bottom: 'xsmall' }}
                  tooltipProps={{ dataTooltipId: 'priorityClassName' }}
                >
                  {getString(priorityClassNameStringKey)}
                </Text>
              }
              name="priorityClassName"
              style={{ width: 300, marginBottom: 'var(--spacing-xsmall)' }}
              multiTextInputProps={{
                multiTextInputProps: { expressions, allowableTypes },
                disabled: isReadonly
              }}
            />
          </Container>
          <Container className={css.bottomMargin7}>
            {renderMultiTypeMap({
              fieldName: 'nodeSelector',
              stringKey: 'pipeline.buildInfra.nodeSelector'
            })}
          </Container>
          <Container className={css.bottomMargin7}>
            <Container
              className={cx(stepCss.formGroup, css.bottomMargin7)}
              {...(typeof tolerationsValue === 'string' &&
                getMultiTypeFromValue(tolerationsValue) === MultiTypeInputType.RUNTIME && { width: 300 })}
            >
              <MultiTypeCustomMap
                name="tolerations"
                appearance={'minimal'}
                cardStyle={{ width: '50%' }}
                valueMultiTextInputProps={{
                  expressions,
                  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
                }}
                formik={formik}
                multiTypeFieldSelectorProps={{
                  label: (
                    <Text
                      font={{ variation: FontVariation.FORM_LABEL }}
                      margin={{ bottom: 'xsmall' }}
                      tooltipProps={{ dataTooltipId: 'tolerations' }}
                    >
                      {getString('pipeline.buildInfra.tolerations')}
                    </Text>
                  ),
                  allowedTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION, MultiTypeInputType.RUNTIME]
                }}
                disabled={isReadonly}
                multiTypeMapKeys={[
                  { label: 'Effect', value: 'effect' },
                  { label: 'Key', value: 'key' },
                  { label: 'Operator', value: 'operator' },
                  { label: 'Value', value: 'value' }
                ]}
                enableConfigureOptions={false}
              />
            </Container>
          </Container>
          {renderTimeOutFields()}
          {renderHarnessImageConnectorRefField()}
        </>
      )
    },
    [expressions]
  )

  const getValidationSchema = React.useCallback((): yup.Schema<unknown> => {
    switch (buildInfraType) {
      case CIBuildInfrastructureType.KubernetesDirect:
        return yup.object().shape({
          connectorRef: yup
            .string()
            .nullable()
            .test(
              'connectorRef required only for New configuration',
              getString('fieldRequired', { field: getString(k8sClusterKeyRef) }) || '',
              function (connectorRef) {
                if (isEmpty(connectorRef) && currentMode === Modes.NewConfiguration) {
                  return false
                }
                return true
              }
            ),
          namespace: yup
            .string()
            .nullable()
            .test(
              'namespace required only for New configuration',
              getString('fieldRequired', { field: getString(namespaceKeyRef) }) || '',
              function (namespace) {
                if (isEmpty(namespace) && currentMode === Modes.NewConfiguration) {
                  return false
                }
                return true
              }
            ),
          useFromStage: yup
            .string()
            .nullable()
            .test(
              'useFromStage required only when Propagate from an existing stage',
              getString('pipeline.infraSpecifications.validation.requiredExistingStage') || '',
              function (useFromStage) {
                if (isEmpty(useFromStage) && currentMode === Modes.Propagate) {
                  return false
                }
                return true
              }
            ),
          runAsUser: yup.string().test(
            'Must be a number and allows runtimeinput or expression',
            getString('pipeline.stepCommonFields.validation.mustBeANumber', {
              label: getString(runAsUserStringKey)
            }) || '',
            function (runAsUser) {
              if (isUndefined(runAsUser) || !runAsUser) {
                return true
              } else if (runAsUser.startsWith('<+')) {
                return true
              }
              return !isNaN(runAsUser)
            }
          ),
          volumes: yup
            .array()
            .test({
              test: value => !value || uniqBy(value, 'mountPath').length === value.length,
              message: getString('pipeline.ci.validations.mountPathUnique')
            })
            .test({
              test: value => {
                const pattern = /^\d+(\.\d+)?$|^\d+(\.\d+)?(G|M|Gi|Mi)$|^$/
                // invalid if size doesn't follow pattern or is an integer without units
                const isSizeInvalid = value?.some(
                  (volume: EmptyDirYaml) =>
                    volume?.spec?.size &&
                    (!pattern.test(volume.spec.size) || !isNaN(volume.spec.size as unknown as number))
                )
                return !isSizeInvalid
              },
              message: getString('pipeline.ci.validations.invalidSize')
            })
            .test({
              test: value => {
                const isPathMissing = value?.some(
                  (volume: HostPathYaml) => volume.type === VolumesTypes.HostPath && !volume.spec?.path
                )
                return !isPathMissing
              },
              message: getString('pipeline.ci.validations.pathRequiredForHostPath')
            })
            .test({
              test: value => {
                const isTypeMissing = value?.some(
                  (volume: EmptyDirYaml | PersistentVolumeClaimYaml | HostPathYaml) => volume.mountPath && !volume.type
                )
                return !isTypeMissing
              },
              message: 'Type is required'
            }),
          annotations: yup.lazy(
            (value: FieldValueType) => getFieldSchema(value, k8sAnnotationRegex) as yup.Schema<FieldValueType>
          ),
          labels: yup.lazy(
            (value: FieldValueType) => getFieldSchema(value, k8sLabelRegex) as yup.Schema<FieldValueType>
          ),
          addCapabilities: yup.lazy(value => validateUniqueList({ value, getString })),
          dropCapabilities: yup.lazy(value => validateUniqueList({ value, getString })),
          tolerations: yup.lazy(value =>
            validateUniqueList({ value, getString, uniqueKey: 'key', stringKey: 'pipeline.ci.validations.keyUnique' })
          ),
          os: yup
            .string()
            .test(
              'OS required only for New configuration',
              getString('fieldRequired', { field: getString('pipeline.infraSpecifications.os') }) || '',
              function (os) {
                if (isEmpty(os) && currentMode === Modes.NewConfiguration) {
                  return false
                }
                return true
              }
            )
        })
      case CIBuildInfrastructureType.VM:
        return yup.object().shape({
          useFromStage: yup
            .string()
            .nullable()
            .test(
              'useFromStage required only when Propagate from an existing stage',
              getString('pipeline.infraSpecifications.validation.requiredExistingStage') || '',
              function (useFromStage) {
                if (isEmpty(useFromStage) && currentMode === Modes.Propagate) {
                  return false
                }
                return true
              }
            ),
          poolName: yup
            .string()
            .nullable()
            .test(
              'pool name required only for New configuration',
              getString('fieldRequired', { field: getString(poolNameKeyRef) }) || '',
              function (poolName) {
                if (isEmpty(poolName) && currentMode === Modes.NewConfiguration) {
                  return false
                }
                return true
              }
            ),
          os: yup
            .string()
            .test(
              'OS required only for New configuration',
              getString('fieldRequired', { field: getString('pipeline.infraSpecifications.os') }) || '',
              function (os) {
                if (isEmpty(os) && currentMode === Modes.NewConfiguration) {
                  return false
                }
                return true
              }
            )
        })
      case 'UseFromStage':
        return yup.object().shape({
          buildInfraType: yup
            .string()
            .nullable()
            .test(
              'buildInfraType required only when Propagate from an existing stage',
              getString('ci.buildInfra.label') || '',
              function (buildInfra) {
                return !isEmpty(buildInfra)
              }
            )
        })
      case CIBuildInfrastructureType.Cloud:
      case CIBuildInfrastructureType.Docker:
        return yup.object().shape({
          os: yup
            .string()
            .test(
              'OS required only for New configuration',
              getString('fieldRequired', { field: getString('pipeline.infraSpecifications.os') }) || '',
              function (os) {
                if (isEmpty(os) && currentMode === Modes.NewConfiguration) {
                  return false
                }
                return true
              }
            ),
          arch: yup
            .string()
            .test(
              'Architecture required only for New configuration',
              getString('fieldRequired', { field: getString('pipeline.infraSpecifications.architecture') }) || '',
              function (arch) {
                if (isEmpty(arch) && currentMode === Modes.NewConfiguration) {
                  return false
                }
                return true
              }
            )
        })
      case CIBuildInfrastructureType.KubernetesHosted:
      default:
        return yup.object()
    }
  }, [buildInfraType, currentMode])

  const renderPropagationSection = (formik: FormikProps<BuildInfraFormValues>): JSX.Element => {
    const { setFieldValue } = formik
    return (
      <>
        <Card
          disabled={isReadonly}
          className={cx(css.sectionCard)}
          {...(currentMode === Modes.Propagate && { ['data-testId']: 'propagate-stage-card' })}
        >
          <Layout.Horizontal spacing="xxlarge">
            <div
              className={cx(css.card, { [css.active]: currentMode === Modes.Propagate })}
              onClick={() => {
                setCurrentMode(Modes.Propagate)
              }}
            >
              <Text className={css.cardTitle} color="black" margin={{ bottom: 'large' }}>
                {getString('pipelineSteps.build.infraSpecifications.propagate')}
              </Text>
              <FormInput.Select
                name="useFromStage"
                items={otherBuildStagesWithInfraConfigurationOptions}
                disabled={isReadonly}
              />
              {buildInfraType === CIBuildInfrastructureType.KubernetesDirect && (
                <>
                  {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.connectorRef && (
                    <>
                      <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
                        {getString(k8sClusterKeyRef)}
                      </Text>
                      <Text color="black" margin={{ bottom: 'medium' }}>
                        {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.connectorRef}
                      </Text>
                    </>
                  )}
                  {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.namespace && (
                    <>
                      <Text
                        font={{ variation: FontVariation.FORM_LABEL }}
                        margin={{ bottom: 'xsmall' }}
                        tooltipProps={{ dataTooltipId: 'namespace' }}
                      >
                        {getString(namespaceKeyRef)}
                      </Text>
                      <Text color="var(--black)" margin={{ bottom: 'medium' }}>
                        {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.namespace}
                      </Text>
                    </>
                  )}
                  {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                    ?.harnessImageConnectorRef && (
                    <>
                      <Text
                        font={{ variation: FontVariation.FORM_LABEL }}
                        margin={{ bottom: 'xsmall' }}
                        tooltipProps={{ dataTooltipId: 'harnessImageConnectorRef' }}
                      >
                        {getString(harnessImageConnectorRefKey)}
                      </Text>
                      <Text color="var(--black)" margin={{ bottom: 'medium' }}>
                        {
                          (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                            ?.harnessImageConnectorRef
                        }
                      </Text>
                    </>
                  )}
                  {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.os && (
                    <>
                      <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
                        {getString('pipeline.infraSpecifications.os')}
                      </Text>
                      <Text color="black">
                        {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.os}
                      </Text>
                    </>
                  )}

                  <Accordion activeId={''}>
                    <Accordion.Panel
                      id="advanced"
                      addDomId={true}
                      summary={
                        <div
                          className={css.tabHeading}
                          id="advanced"
                          style={{ paddingLeft: 'var(--spacing-small)', marginBottom: 0 }}
                        >
                          {getString('advancedTitle')}
                        </div>
                      }
                      details={
                        <>
                          {renderPropagateDynamicList({
                            value: (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.volumes,
                            stringKey: 'pipeline.buildInfra.volumes'
                          })}
                          {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                            ?.serviceAccountName && (
                            <>
                              <Text
                                font={{ variation: FontVariation.FORM_LABEL }}
                                margin={{ bottom: 'xsmall' }}
                                tooltipProps={{ dataTooltipId: 'serviceAccountName' }}
                              >
                                {getString('pipeline.infraSpecifications.serviceAccountName')}
                              </Text>
                              <Text color="black" margin={{ bottom: 'medium' }}>
                                {
                                  (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                    ?.serviceAccountName
                                }
                              </Text>
                            </>
                          )}
                          {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.runAsUser && (
                            <>
                              <Text
                                font={{ variation: FontVariation.FORM_LABEL }}
                                margin={{ bottom: 'xsmall' }}
                                tooltipProps={{ dataTooltipId: 'runAsUser' }}
                              >
                                {getString(runAsUserStringKey)}
                              </Text>
                              <Text color="black" margin={{ bottom: 'medium' }}>
                                {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.runAsUser}
                              </Text>
                            </>
                          )}
                          {renderPropagateKeyValuePairs({
                            keyValue: (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                              ?.labels,
                            stringKey: 'ci.labels'
                          })}
                          {renderPropagateKeyValuePairs({
                            keyValue: (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                              ?.annotations,
                            stringKey: 'ci.annotations'
                          })}
                          {typeof (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                            ?.automountServiceAccountToken !== 'undefined' && (
                            <>
                              <Text
                                font={{ variation: FontVariation.FORM_LABEL }}
                                margin={{ bottom: 'xsmall' }}
                                tooltipProps={{ dataTooltipId: 'timeout' }}
                              >
                                {getString('pipeline.buildInfra.automountServiceAccountToken')}
                              </Text>
                              <Text color="black" margin={{ bottom: 'medium' }}>
                                {`${
                                  (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                    ?.automountServiceAccountToken
                                }`}
                              </Text>
                            </>
                          )}
                          {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                            ?.priorityClassName && (
                            <>
                              <Text
                                font={{ variation: FontVariation.FORM_LABEL }}
                                margin={{ bottom: 'xsmall' }}
                                tooltipProps={{ dataTooltipId: 'timeout' }}
                              >
                                {getString(priorityClassNameStringKey)}
                              </Text>
                              <Text color="black" margin={{ bottom: 'medium' }}>
                                {
                                  (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                    ?.priorityClassName
                                }
                              </Text>
                            </>
                          )}
                          <div className={css.tabSubHeading} id="containerSecurityContext">
                            {getString('pipeline.buildInfra.containerSecurityContext')}
                          </div>
                          {typeof (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                            ?.containerSecurityContext?.privileged !== 'undefined' && (
                            <>
                              <Text
                                font={{ variation: FontVariation.FORM_LABEL }}
                                margin={{ bottom: 'xsmall' }}
                                tooltipProps={{ dataTooltipId: 'timeout' }}
                              >
                                {getString('pipeline.buildInfra.privileged')}
                              </Text>
                              <Text color="black" margin={{ bottom: 'medium' }}>
                                {`${
                                  (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                    ?.containerSecurityContext?.privileged
                                }`}
                              </Text>
                            </>
                          )}
                          {typeof (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                            ?.containerSecurityContext?.allowPrivilegeEscalation !== 'undefined' && (
                            <>
                              <Text
                                font={{ variation: FontVariation.FORM_LABEL }}
                                margin={{ bottom: 'xsmall' }}
                                tooltipProps={{ dataTooltipId: 'timeout' }}
                              >
                                {getString('pipeline.buildInfra.allowPrivilegeEscalation')}
                              </Text>
                              <Text color="black" margin={{ bottom: 'medium' }}>
                                {`${
                                  (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                    ?.containerSecurityContext?.allowPrivilegeEscalation
                                }`}
                              </Text>
                            </>
                          )}
                          {renderPropagateList({
                            value: (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                              ?.containerSecurityContext?.capabilities?.add,
                            stringKey: 'pipeline.buildInfra.addCapabilities'
                          })}
                          {renderPropagateList({
                            value: (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                              ?.containerSecurityContext?.capabilities?.drop,
                            stringKey: 'pipeline.buildInfra.dropCapabilities'
                          })}
                          {typeof (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                            ?.containerSecurityContext?.runAsNonRoot !== 'undefined' && (
                            <>
                              <Text
                                font={{ variation: FontVariation.FORM_LABEL }}
                                margin={{ bottom: 'xsmall' }}
                                tooltipProps={{ dataTooltipId: 'timeout' }}
                              >
                                {getString('pipeline.buildInfra.runAsNonRoot')}
                              </Text>
                              <Text color="black" margin={{ bottom: 'medium' }}>
                                {`${
                                  (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                    ?.containerSecurityContext?.runAsNonRoot
                                }`}
                              </Text>
                            </>
                          )}
                          {typeof (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                            ?.containerSecurityContext?.readOnlyRootFilesystem !== 'undefined' && (
                            <>
                              <Text
                                font={{ variation: FontVariation.FORM_LABEL }}
                                margin={{ bottom: 'xsmall' }}
                                tooltipProps={{ dataTooltipId: 'timeout' }}
                              >
                                {getString('pipeline.buildInfra.readOnlyRootFilesystem')}
                              </Text>
                              <Text color="black" margin={{ bottom: 'medium' }}>
                                {`${
                                  (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                    ?.containerSecurityContext?.readOnlyRootFilesystem
                                }`}
                              </Text>
                            </>
                          )}
                          {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                            ?.containerSecurityContext?.runAsUser && (
                            <>
                              <Text
                                font={{ variation: FontVariation.FORM_LABEL }}
                                margin={{ bottom: 'xsmall' }}
                                tooltipProps={{ dataTooltipId: 'timeout' }}
                              >
                                {getString(runAsUserStringKey)}
                              </Text>
                              <Text color="black" margin={{ bottom: 'medium' }}>
                                {`${
                                  (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                    ?.containerSecurityContext?.runAsUser
                                }`}
                              </Text>
                            </>
                          )}
                          {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                            ?.priorityClassName && (
                            <>
                              <Text
                                font={{ variation: FontVariation.FORM_LABEL }}
                                margin={{ bottom: 'xsmall' }}
                                tooltipProps={{ dataTooltipId: 'timeout' }}
                              >
                                {getString(priorityClassNameStringKey)}
                              </Text>
                              <Text color="black" margin={{ bottom: 'medium' }}>
                                {
                                  (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                    ?.priorityClassName
                                }
                              </Text>
                            </>
                          )}
                          {renderPropagateKeyValuePairs({
                            keyValue: (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                              ?.nodeSelector,
                            stringKey: 'pipeline.buildInfra.nodeSelector'
                          })}
                          {renderPropagateDynamicList({
                            value: (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                              ?.tolerations,
                            stringKey: 'pipeline.buildInfra.tolerations'
                          })}
                          {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.initTimeout && (
                            <>
                              <Text
                                font={{ variation: FontVariation.FORM_LABEL }}
                                margin={{ bottom: 'xsmall' }}
                                tooltipProps={{ dataTooltipId: 'timeout' }}
                              >
                                {getString('pipeline.infraSpecifications.initTimeout')}
                              </Text>
                              <Text color="black" margin={{ bottom: 'medium' }}>
                                {
                                  (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                    ?.initTimeout
                                }
                              </Text>
                            </>
                          )}
                        </>
                      }
                    />
                  </Accordion>
                </>
              )}
              {buildInfraType === CIBuildInfrastructureType.VM &&
                renderUseFromStageVM({
                  propagatedStage,
                  getString
                })}
              {buildInfraType &&
                [CIBuildInfrastructureType.Cloud, CIBuildInfrastructureType.Docker].includes(buildInfraType) &&
                renderUseFromStageCloud({
                  propagatedStage,
                  getString
                })}
            </div>
            {/* New configuration section */}
            <div
              className={cx(css.card, { [css.active]: currentMode === Modes.NewConfiguration })}
              onClick={() => {
                if (currentMode === Modes.Propagate) {
                  const newStageData = produce(stage, draft => {
                    if (draft) {
                      set(
                        draft,
                        'stage.spec.infrastructure',
                        buildInfraType === CIBuildInfrastructureType.KubernetesDirect
                          ? {
                              type: CIBuildInfrastructureType.KubernetesDirect,
                              spec: {
                                connectorRef: '',
                                namespace: '',
                                annotations: {},
                                labels: {},
                                nodeSelector: {},
                                harnessImageConnectorRef: '',
                                os: ''
                              }
                            }
                          : buildInfraType === CIBuildInfrastructureType.VM
                          ? {
                              type: CIBuildInfrastructureType.VM,
                              spec: {
                                identifier: '',
                                harnessImageConnectorRef: '',
                                os: ''
                              }
                            }
                          : { type: undefined, spec: {} }
                      )
                    }
                  })
                  formik.setValues({
                    ...formik.values,
                    buildInfraType: buildInfraType,
                    useFromStage: ''
                  })
                  if (newStageData?.stage) {
                    updateStage(newStageData.stage)
                  }
                }
                setCurrentMode(Modes.NewConfiguration)
              }}
            >
              <>
                <Text className={css.cardTitle} color="black" margin={{ bottom: 'large' }}>
                  {getString('ci.buildInfra.useNewInfra')}
                </Text>
                <ThumbnailSelect
                  name={'buildInfraType'}
                  items={BuildInfraTypes}
                  isReadonly={isReadonly}
                  onChange={val => {
                    const infraType = val as CIBuildInfrastructureType
                    setFieldValue('buildInfraType', infraType)
                    setBuildInfraType(infraType)
                  }}
                />
              </>
            </div>
          </Layout.Horizontal>
          {currentMode === Modes.NewConfiguration ? (
            <>
              {buildInfraType ? <Separator topSeparation={30} /> : null}
              {CIE_HOSTED_VMS && <Container margin={{ top: 'large' }}>{renderPlatformInfraSection()}</Container>}
              <Container margin={{ top: 'large' }}>{renderBuildInfraMainSection()}</Container>
            </>
          ) : null}
        </Card>
        {currentMode === Modes.NewConfiguration && buildInfraType === CIBuildInfrastructureType.KubernetesDirect
          ? renderKubernetesBuildInfraAdvancedSection({ showCardView: true, formik })
          : null}
      </>
    )
  }

  const renderOldInfraSection = (): JSX.Element => {
    return (
      <div className={css.wrapper}>
        <ErrorsStripBinded domRef={scrollRef as React.MutableRefObject<HTMLElement | undefined>} />
        <div className={css.contentSection} ref={scrollRef}>
          <Formik
            initialValues={getInitialValues}
            validationSchema={getValidationSchema()}
            validate={handleValidate}
            formName="ciBuildInfra"
            onSubmit={values => logger.info(JSON.stringify(values))}
          >
            {formik => {
              window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: BuildTabs.INFRASTRUCTURE }))
              formikRef.current = formik
              return (
                <Layout.Vertical>
                  <Text font={{ variation: FontVariation.H5 }} id="infrastructureDefinition">
                    {getString(
                      (() => {
                        switch (module) {
                          case 'sto':
                            return 'ci.pipelineSteps.build.infraSpecifications.whereToRunSTO'
                          default:
                            return 'pipelineSteps.build.infraSpecifications.whereToRun'
                        }
                      })()
                    )}
                  </Text>
                  <FormikForm>
                    <Layout.Horizontal spacing="xxlarge">
                      <Layout.Vertical>
                        {otherBuildStagesWithInfraConfigurationOptions.length ? (
                          renderPropagationSection(formik)
                        ) : (
                          <>
                            <Card disabled={isReadonly} className={cx(css.sectionCard)}>
                              <Layout.Vertical spacing="small">
                                <>
                                  <Text
                                    font={{ variation: FontVariation.FORM_INPUT_TEXT }}
                                    padding={{ bottom: 'medium' }}
                                  >
                                    {getString('ci.buildInfra.selectInfra')}
                                  </Text>
                                  <ThumbnailSelect
                                    name={'buildInfraType'}
                                    items={BuildInfraTypes}
                                    isReadonly={isReadonly}
                                    onChange={val => {
                                      const infraType = val as CIBuildInfrastructureType
                                      setBuildInfraType(infraType)
                                      if (infraType === CIBuildInfrastructureType.KubernetesHosted) {
                                        fetchDelegateDetails()
                                      }

                                      // macOs is only supported for VMs - default to linux
                                      const os =
                                        formik?.values?.os === OsTypes.MacOS &&
                                        infraType !== CIBuildInfrastructureType.VM
                                          ? OsTypes.Linux
                                          : formik?.values?.os

                                      formik.setValues({
                                        ...formik.values,
                                        buildInfraType: infraType,
                                        automountServiceAccountToken:
                                          infraType === CIBuildInfrastructureType.KubernetesDirect ? true : undefined,
                                        os
                                      })
                                    }}
                                  />
                                </>
                                <>
                                  {buildInfraType ? <Separator topSeparation={10} /> : null}
                                  {renderBuildInfraMainSection()}
                                </>
                              </Layout.Vertical>
                            </Card>
                            {buildInfraType === CIBuildInfrastructureType.KubernetesDirect
                              ? renderKubernetesBuildInfraAdvancedSection({ showCardView: true, formik })
                              : null}
                          </>
                        )}
                      </Layout.Vertical>
                      {enabledHostedBuildsForFreeUsers ? (
                        <Container
                          className={css.helptext}
                          margin={{ top: 'medium' }}
                          padding={{ top: 'xlarge', bottom: 'xlarge', left: 'large', right: 'large' }}
                        >
                          <Layout.Horizontal spacing="xsmall" flex={{ justifyContent: 'start' }}>
                            <Icon name="info-messaging" size={20} />
                            <Text font={{ variation: FontVariation.H5 }}>
                              {getString('ci.buildInfra.infrastructureTypesLabel')}
                            </Text>
                          </Layout.Horizontal>
                          {enabledHostedBuildsForFreeUsers ? (
                            <>
                              <Text
                                font={{ variation: FontVariation.BODY2 }}
                                padding={{ top: 'xlarge', bottom: 'xsmall' }}
                              >
                                {getString('ci.getStartedWithCI.hostedByHarness')}
                              </Text>
                              <Text font={{ variation: FontVariation.SMALL }}>
                                {getString('ci.getStartedWithCI.hostedByHarnessBuildLocation')}
                              </Text>
                              <Separator />
                            </>
                          ) : null}
                          <>
                            <Text
                              font={{ variation: FontVariation.BODY2 }}
                              padding={{ top: enabledHostedBuildsForFreeUsers ? 0 : 'xlarge', bottom: 'xsmall' }}
                            >
                              {getString('ci.buildInfra.k8sLabel')}
                            </Text>
                            <Text font={{ variation: FontVariation.SMALL }}>
                              {getString('ci.buildInfra.kubernetesHelpText')}
                            </Text>
                          </>
                          <>
                            <Separator />
                            <Text font={{ variation: FontVariation.BODY2 }} padding={{ bottom: 'xsmall' }}>
                              {getString('ci.buildInfra.vmLabel')}
                            </Text>
                            <Text font={{ variation: FontVariation.SMALL }}>
                              {getString('ci.buildInfra.awsHelpText')}
                            </Text>
                          </>
                        </Container>
                      ) : null}
                    </Layout.Horizontal>
                  </FormikForm>
                </Layout.Vertical>
              )
            }}
          </Formik>
          {children}
          {showInfraProvisioningCarousel ? (
            <InfraProvisioningCarousel
              show={showInfraProvisioningCarousel}
              onClose={() => setShowInfraProvisioningCarousel(false)}
              provisioningStatus={delegateProvisioningStatus}
            />
          ) : null}
        </div>
      </div>
    )
  }

  const renderNewInfraSection = (): JSX.Element => {
    return (
      <div className={css.wrapper}>
        <ErrorsStripBinded domRef={scrollRef as React.MutableRefObject<HTMLElement | undefined>} />
        <div className={css.contentSection} ref={scrollRef}>
          <Formik
            initialValues={getInitialValues}
            validationSchema={getValidationSchema()}
            validate={handleValidate}
            formName="ciBuildInfra"
            onSubmit={values => logger.info(JSON.stringify(values))}
          >
            {formik => {
              window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: BuildTabs.INFRASTRUCTURE }))
              formikRef.current = formik
              return (
                <Layout.Vertical>
                  {otherBuildStagesWithInfraConfigurationOptions.length ? (
                    renderPropagationSection(formik)
                  ) : (
                    <FormikForm>
                      <Text font={{ variation: FontVariation.H5 }} id="infrastructureDefinition">
                        {getString('infrastructureText')}
                      </Text>
                      <Card disabled={isReadonly} className={cx(css.sectionCard)}>
                        <Text font={{ variation: FontVariation.FORM_INPUT_TEXT }} padding={{ bottom: 'medium' }}>
                          {getString('ci.buildInfra.selectInfra')}
                        </Text>
                        <ThumbnailSelect
                          name={'buildInfraType'}
                          items={BuildInfraTypes}
                          isReadonly={isReadonly}
                          onChange={val => {
                            const infraType = val as CIBuildInfrastructureType
                            setBuildInfraType(infraType)
                          }}
                          expandAllByDefault
                        />
                      </Card>
                      <Text font={{ variation: FontVariation.H5 }} id="infrastructureDefinition">
                        {getString('auditTrail.Platform')}
                      </Text>
                      <Card disabled={isReadonly} className={cx(css.sectionCard)}>
                        {buildInfraType !== CIBuildInfrastructureType.KubernetesHosted && renderPlatformInfraSection()}
                        {![
                          CIBuildInfrastructureType.Cloud,
                          CIBuildInfrastructureType.Docker,
                          CIBuildInfrastructureType.KubernetesHosted
                        ].includes(buildInfraType as CIBuildInfrastructureType) ? (
                          <Separator topSeparation={10} bottomSeparation={0} />
                        ) : null}
                        <Container margin={{ top: 'large' }}>{renderBuildInfraMainSection()}</Container>
                      </Card>
                      {buildInfraType === CIBuildInfrastructureType.KubernetesDirect
                        ? renderKubernetesBuildInfraAdvancedSection({ showCardView: true, formik })
                        : null}
                    </FormikForm>
                  )}
                </Layout.Vertical>
              )
            }}
          </Formik>
          {children}
        </div>
      </div>
    )
  }

  return CIE_HOSTED_VMS || CI_DOCKER_INFRASTRUCTURE ? renderNewInfraSection() : renderOldInfraSection()
}
