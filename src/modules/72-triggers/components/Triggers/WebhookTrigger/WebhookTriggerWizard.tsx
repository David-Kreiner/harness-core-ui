/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import type { FormikErrors, FormikProps } from 'formik'
import { defaultTo, get, isEmpty, isUndefined, merge, noop, omit, omitBy } from 'lodash-es'
import { parse } from 'yaml' // Use parse from yaml helper
import { CompletionItemKind } from 'vscode-languageserver-types'

import {
  Button,
  ButtonVariation,
  getMultiTypeFromValue,
  Intent,
  Layout,
  MultiTypeInputType,
  SelectOption,
  Text,
  useConfirmationDialog,
  useToaster,
  VisualYamlSelectedView as SelectedView
} from '@harness/uicore'

import {
  NGTriggerConfigV2,
  NGTriggerSourceV2,
  PipelineInfoConfig,
  ResponseNGTriggerResponse,
  useCreateTrigger,
  useGetPipeline,
  useGetSchemaYaml,
  useGetTemplateFromPipeline,
  useUpdateTrigger
} from 'services/pipeline-ng'
import { Failure, getConnectorListV2Promise, GetConnectorQueryParams, useGetConnector } from 'services/cd-ng'
import { useStrings } from 'framework/strings'

import type {
  CompletionItemInterface,
  InvocationMapFunction,
  YamlBuilderHandlerBinding,
  YamlBuilderProps
} from '@common/interfaces/YAMLBuilderProps'
import type {
  GitQueryParams,
  ModulePathParams,
  PipelinePathProps,
  TriggerPathProps
} from '@common/interfaces/RouteInterfaces'
import { Scope } from '@common/interfaces/SecretsInterface'
import routes from '@common/RouteDefinitions'
import { useConfirmAction, useDeepCompareEffect, useMutateAsGet, useQueryParams } from '@common/hooks'
import { memoizedParse, yamlStringify } from '@common/utils/YamlHelperMethods'
import {
  getIdentifierFromValue,
  getScopeFromDTO,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import type { FormikEffectProps } from '@common/components/FormikEffect/FormikEffect'

import { usePermission } from '@rbac/hooks/usePermission'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'

import { connectorUrlType } from '@connectors/constants'

import type { InputSetValue } from '@pipeline/components/InputSetSelector/utils'
import { validatePipeline } from '@pipeline/components/PipelineStudio/StepUtil'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { ErrorsStrip } from '@pipeline/components/ErrorsStrip/ErrorsStrip'
import type { Pipeline } from '@pipeline/utils/types'
import {
  getPipelineWithoutCodebaseInputs,
  isCloneCodebaseEnabledAtLeastOneStage,
  isCodebaseFieldsRuntimeInputs
} from '@pipeline/utils/CIUtils'
import { clearRuntimeInput, mergeTemplateWithInputSetData } from '@pipeline/utils/runPipelineUtils'

import TabWizard from '@triggers/components/TabWizard/TabWizard'

import type { AddConditionInterface } from '@triggers/components/AddConditionsSection/AddConditionsSection'
import TitleWithSwitch from '../components/TitleWithSwitch/TitleWithSwitch'
import {
  ConnectorRefInterface,
  eventTypes,
  FlatInitialValuesInterface,
  FlatOnEditValuesInterface,
  flattenKeys,
  getDefaultPipelineReferenceBranch,
  getModifiedTemplateValues,
  getPanels,
  getValidationSchema
} from './utils'
import type { TriggerProps } from '../Trigger'
import { TriggerBaseType } from '../TriggerInterface'
import {
  GitSourceProviders,
  clearNullUndefined,
  displayPipelineIntegrityResponse,
  getConnectorName,
  getConnectorValue,
  getErrorMessage,
  getOrderedPipelineVariableValues,
  isRowFilled,
  PayloadConditionTypes,
  ResponseStatus
} from '../utils'
import type {
  FlatValidFormikValuesInterface,
  FlatValidWebhookFormikValuesInterface,
  TriggerConfigDTO
} from '../TriggerWizardInterface'
import useGitAwareForTriggerEnabled from '../useGitAwareForTriggerEnabled'
import useIsGithubWebhookAuthenticationEnabled from './useIsGithubWebhookAuthenticationEnabled'

type ResponseNGTriggerResponseWithMessage = ResponseNGTriggerResponse & { message?: string }

export default function WebhookTriggerWizard(
  props: TriggerProps<any> & { children: JSX.Element[] }
): React.ReactElement {
  const { isNewTrigger, baseType, triggerData, type: sourceRepo } = props

  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const [selectedView, setSelectedView] = useState<SelectedView>(SelectedView.VISUAL)

  const history = useHistory()
  const { getString } = useStrings()
  const { showSuccess, showError, clear } = useToaster()

  const {
    accountId: accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    pipelineIdentifier,
    triggerIdentifier,
    module
  } = useParams<PipelinePathProps & TriggerPathProps & ModulePathParams>()

  const {
    repoIdentifier,
    connectorRef: pipelineConnectorRef,
    repoName: pipelineRepoName,
    branch,
    storeType
  } = useQueryParams<GitQueryParams>()

  const { data: template, loading: fetchingTemplate } = useMutateAsGet(useGetTemplateFromPipeline, {
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      pipelineIdentifier,
      projectIdentifier,
      branch,
      parentEntityConnectorRef: pipelineConnectorRef,
      parentEntityRepoName: pipelineRepoName
    },
    body: {
      stageIdentifiers: []
    }
  })

  const { data: pipelineResponse } = useGetPipeline({
    pipelineIdentifier,
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      getTemplatesResolvedPipeline: true,
      branch,
      parentEntityConnectorRef: pipelineConnectorRef,
      parentEntityRepoName: pipelineRepoName
    }
  })

  //! This can be moved to the wizard to load the schema yaml when yaml builder loads
  const { loading: loadingYamlSchema, data: triggerSchema } = useGetSchemaYaml({
    queryParams: {
      entityType: 'Triggers',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier,
      scope: getScopeFromDTO({
        accountIdentifier,
        orgIdentifier,
        projectIdentifier
      })
    }
  })

  const isGithubWebhookAuthenticationEnabled = useIsGithubWebhookAuthenticationEnabled()

  const returnToTriggersPage = (): void =>
    history.push(
      routes.toTriggersPage({
        accountId: accountIdentifier,
        orgIdentifier,
        projectIdentifier,
        pipelineIdentifier,
        module,
        repoIdentifier,
        connectorRef: pipelineConnectorRef,
        repoName: pipelineRepoName,
        branch,
        storeType
      })
    )

  const gitAwareForTriggerEnabled = useGitAwareForTriggerEnabled()

  const [ignoreError, setIgnoreError] = useState<boolean>(false)

  const createUpdateTriggerQueryParams = useMemo(
    () => ({
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      targetIdentifier: pipelineIdentifier,
      ...(gitAwareForTriggerEnabled
        ? {
            ignoreError,
            branch,
            connectorRef: pipelineConnectorRef,
            repoName: pipelineRepoName,
            storeType
          }
        : undefined)
    }),
    [
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier,
      ignoreError,
      gitAwareForTriggerEnabled,
      branch,
      pipelineConnectorRef,
      pipelineRepoName,
      storeType
    ]
  )

  const { mutate: createTrigger, loading: createTriggerLoading } = useCreateTrigger({
    queryParams: createUpdateTriggerQueryParams,
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })

  const { mutate: updateTrigger, loading: updateTriggerLoading } = useUpdateTrigger({
    triggerIdentifier,
    queryParams: createUpdateTriggerQueryParams,
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })

  const { openDialog, closeDialog } = useConfirmationDialog({
    contentText: getString('triggers.updateTriggerDetails'),
    intent: Intent.WARNING,
    titleText: getString('triggers.updateTrigger'),
    customButtons: (
      <Button variation={ButtonVariation.PRIMARY} text={getString('close')} onClick={() => closeDialog()} />
    )
  })

  const retryFn = useRef<() => void>(noop)
  const [retrySavingConfirmationMessage, setRetrySavingConfirmation] = useState('')
  const confirmIgnoreErrorAndResubmit = useConfirmAction({
    intent: Intent.PRIMARY,
    title: getString('triggers.triggerCouldNotBeSavedTitle'),
    confirmText: getString('continue'),
    message: (
      <Layout.Vertical spacing="medium">
        <Text>
          {retrySavingConfirmationMessage}
          {getString('triggers.triggerSaveWithError')}
        </Text>
        <Text>{getString('triggers.triggerCouldNotBeSavedContent')}</Text>
      </Layout.Vertical>
    ),
    action: () => {
      retryFn.current?.()
    }
  })

  const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
    fileName: `${triggerData?.identifier ?? 'Trigger'}.yaml`,
    entityType: 'Triggers',
    width: 'calc(100vw - 350px)',
    height: 'calc(100vh - 280px)',
    showSnippetSection: false,
    yamlSanityConfig: {
      removeEmptyString: false,
      removeEmptyObject: false,
      removeEmptyArray: false
    }
  }

  const [currentPipeline, setCurrentPipeline] = useState<{ pipeline?: PipelineInfoConfig } | undefined>(undefined)

  const originalPipeline: PipelineInfoConfig | undefined = memoizedParse<Pipeline>(
    defaultTo(pipelineResponse?.data?.yamlPipeline, '')
  )?.pipeline

  const resolvedPipeline: PipelineInfoConfig | undefined = memoizedParse<Pipeline>(
    defaultTo(pipelineResponse?.data?.resolvedTemplatesPipelineYaml, '')
  )?.pipeline

  const [onEditInitialValues, setOnEditInitialValues] = useState<FlatOnEditValuesInterface>({
    triggerType: baseType as NGTriggerSourceV2['type']
  })

  const getInitialValues = (): FlatInitialValuesInterface => {
    let newPipeline = { ...(currentPipeline?.pipeline || {}) }
    // only applied for CI, Not cloned codebase
    if (
      newPipeline?.template?.templateInputs &&
      isCodebaseFieldsRuntimeInputs(newPipeline.template.templateInputs as PipelineInfoConfig) &&
      resolvedPipeline &&
      !isCloneCodebaseEnabledAtLeastOneStage(resolvedPipeline as PipelineInfoConfig)
    ) {
      newPipeline = getPipelineWithoutCodebaseInputs(newPipeline) as Pipeline['pipeline']
    }

    return {
      triggerType: baseType,
      sourceRepo,
      identifier: '',
      tags: {},
      ...(sourceRepo === GitSourceProviders.GITHUB.value && { encryptedWebhookSecretIdentifier: '' }),
      pipeline: newPipeline as PipelineInfoConfig,
      originalPipeline,
      resolvedPipeline,
      anyAction: false,
      autoAbortPreviousExecutions: false,
      pipelineBranchName: getDefaultPipelineReferenceBranch(baseType)
    }
  }

  const [initialValues, setInitialValues] = useState<FlatInitialValuesInterface>(
    Object.assign(getInitialValues(), onEditInitialValues)
  )

  useEffect(() => {
    let newInitialValues = Object.assign(getInitialValues(), onEditInitialValues)
    if (onEditInitialValues?.identifier) {
      newInitialValues = newInitialValues?.pipeline?.template
        ? getModifiedTemplateValues(newInitialValues)
        : newInitialValues
    }

    setInitialValues(newInitialValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onEditInitialValues, currentPipeline])

  useEffect(() => {
    const yamlPipeline = pipelineResponse?.data?.yamlPipeline
    const resolvedYamlPipeline = pipelineResponse?.data?.resolvedTemplatesPipelineYaml

    if (
      yamlPipeline &&
      resolvedYamlPipeline &&
      ((initialValues && !initialValues.originalPipeline && !initialValues.resolvedPipeline) ||
        (onEditInitialValues?.identifier &&
          !onEditInitialValues.originalPipeline &&
          !onEditInitialValues.resolvedPipeline))
    ) {
      try {
        let newOriginalPipeline = parse(yamlPipeline)?.pipeline
        let newResolvedPipeline = parse(resolvedYamlPipeline)?.pipeline
        // only applied for CI, Not cloned codebase
        if (
          newOriginalPipeline?.template?.templateInputs &&
          isCodebaseFieldsRuntimeInputs(newOriginalPipeline.template.templateInputs as PipelineInfoConfig) &&
          resolvedPipeline &&
          !isCloneCodebaseEnabledAtLeastOneStage(resolvedPipeline)
        ) {
          const newOriginalPipelineWithoutCodebaseInputs = getPipelineWithoutCodebaseInputs(newOriginalPipeline)
          const newResolvedPipelineWithoutCodebaseInputs = getPipelineWithoutCodebaseInputs(newResolvedPipeline)
          newOriginalPipeline = newOriginalPipelineWithoutCodebaseInputs
          newResolvedPipeline = newResolvedPipelineWithoutCodebaseInputs
        }
        const additionalValues: {
          inputSetTemplateYamlObj?: {
            pipeline: PipelineInfoConfig | Record<string, never>
          }
        } = {}

        if (onEditInitialValues?.identifier) {
          const newPipeline = currentPipeline?.pipeline ? currentPipeline.pipeline : onEditInitialValues.pipeline || {}
          setOnEditInitialValues({
            ...onEditInitialValues,
            originalPipeline: newOriginalPipeline,
            resolvedPipeline: newResolvedPipeline,
            pipeline: newPipeline as PipelineInfoConfig,
            ...additionalValues
          })
        } else {
          setInitialValues({
            ...initialValues,
            originalPipeline: newOriginalPipeline,
            resolvedPipeline: newResolvedPipeline,
            ...additionalValues
          })
        }
      } catch (e) {
        // set error
        showError(getString('triggers.cannotParseInputValues'))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pipelineResponse?.data?.yamlPipeline,
    pipelineResponse?.data?.resolvedTemplatesPipelineYaml,
    onEditInitialValues?.identifier,
    initialValues,
    currentPipeline
  ])

  const [connectorScopeParams, setConnectorScopeParams] = useState<GetConnectorQueryParams | undefined>(undefined)
  const [wizardKey, setWizardKey] = useState<number>(0)

  const { data: connectorData, refetch: getConnectorDetails } = useGetConnector({
    identifier: getIdentifierFromValue(
      wizardKey < 1 // wizardKey >1 means we've reset initialValues cause of Yaml Switching (onEdit or new) and should use those formik values instead
        ? onEditInitialValues?.connectorRef?.identifier || ''
        : initialValues?.connectorRef?.identifier || ''
    ),
    queryParams: connectorScopeParams,
    lazy: true
  })

  useEffect(() => {
    if (onEditInitialValues?.connectorRef?.identifier && !isUndefined(connectorScopeParams) && !connectorData) {
      getConnectorDetails()
    } else if (
      initialValues?.connectorRef?.value &&
      (!initialValues.connectorRef.label ||
        (connectorData?.data?.connector?.identifier &&
          !initialValues?.connectorRef?.identifier?.includes(connectorData?.data?.connector?.identifier)))
    ) {
      // need to get label due to switching from yaml to visual
      getConnectorDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onEditInitialValues?.connectorRef?.identifier, connectorScopeParams, initialValues?.connectorRef])

  useEffect(() => {
    if (connectorData?.data?.connector?.name && onEditInitialValues?.connectorRef?.identifier && wizardKey < 1) {
      // Assigns label on Visual mode for onEdit
      const { connector, status } = connectorData.data
      const connectorRef: ConnectorRefInterface = {
        ...(onEditInitialValues || initialValues).connectorRef,
        label: connector.name,
        connector,
        live: status?.status === 'SUCCESS'
      }
      if (onEditInitialValues?.connectorRef?.identifier) {
        setOnEditInitialValues({ ...onEditInitialValues, connectorRef })
      }
    } else if (connectorData?.data?.connector?.name && initialValues?.connectorRef?.identifier) {
      // means we switched from yaml to visual and need to get the label
      const { connector, status } = connectorData.data
      const connectorRef: ConnectorRefInterface = {
        ...initialValues.connectorRef,
        label: connector.name,
        connector,
        live: status?.status === 'SUCCESS'
      }
      setInitialValues({ ...initialValues, connectorRef })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    connectorData?.data?.connector,
    onEditInitialValues?.connectorRef?.identifier,
    initialValues?.connectorRef?.identifier
  ])

  const [isMergedPipelineReady, setIsMergedPipelineReady] = useState<boolean>(false)

  useDeepCompareEffect(() => {
    if (template?.data?.inputSetTemplateYaml !== undefined) {
      if (onEditInitialValues?.pipeline && !isMergedPipelineReady) {
        let newOnEditPipeline: PipelineInfoConfig = merge(
          parse(template?.data?.inputSetTemplateYaml)?.pipeline,
          onEditInitialValues.pipeline || {}
        )

        /*this check is needed as when trigger is already present with 1 stage and then tries to add parallel stage,
        we need to have correct yaml with both stages as a part of parallel*/
        if (newOnEditPipeline?.stages?.some(stages => stages?.stage && stages?.parallel)) {
          openDialog() // give warning to update trigger
          newOnEditPipeline = parse(template?.data?.inputSetTemplateYaml)?.pipeline
        }

        const newPipeline = clearRuntimeInput(newOnEditPipeline)
        setOnEditInitialValues({
          ...onEditInitialValues,
          pipeline: newPipeline as unknown as PipelineInfoConfig
        })
        if (!isMergedPipelineReady) {
          setCurrentPipeline({ pipeline: newPipeline }) // will reset initialValues
          setIsMergedPipelineReady(true)
        }
      } else if (!isMergedPipelineReady) {
        const inpuSet = clearRuntimeInput(memoizedParse<Pipeline>(template?.data?.inputSetTemplateYaml).pipeline)
        const newPipeline = mergeTemplateWithInputSetData({
          inputSetPortion: { pipeline: inpuSet },
          templatePipeline: { pipeline: inpuSet },
          allValues: { pipeline: defaultTo(resolvedPipeline, {} as PipelineInfoConfig) },
          shouldUseDefaultValues: true
        })
        setCurrentPipeline(newPipeline)
      }
    }
  }, [template?.data?.inputSetTemplateYaml, onEditInitialValues?.pipeline, resolvedPipeline, fetchingTemplate])

  const [enabledStatus, setEnabledStatus] = useState<boolean>(true)

  useEffect(() => {
    if (triggerData?.enabled === false) {
      setEnabledStatus(false)
    }
  }, [triggerData?.enabled])

  const getWebhookTriggerValues = ({
    triggerResponseYaml,
    triggerYaml
  }: {
    triggerResponseYaml?: string
    triggerYaml?: { trigger: NGTriggerConfigV2 }
  }): FlatOnEditValuesInterface | undefined => {
    // triggerResponseYaml comes from onEdit render, triggerYaml comes from visualYaml toggle
    let triggerValues: FlatOnEditValuesInterface | undefined

    if (triggerYaml && triggerYaml?.trigger?.enabled === false) {
      setEnabledStatus(false)
    } else if (triggerYaml && triggerYaml?.trigger?.enabled === true) {
      setEnabledStatus(true)
    }
    try {
      const triggerResponseJson = triggerResponseYaml ? parse(triggerResponseYaml) : triggerYaml

      if (triggerResponseJson?.trigger?.source?.spec?.type !== GitSourceProviders.CUSTOM.value) {
        // non-custom flow #github | gitlab | bitbucket
        const {
          trigger: {
            name,
            identifier,
            description,
            tags,
            inputYaml,
            inputSetRefs = [],
            source: {
              spec: {
                type: sourceRepoForYaml,
                spec: {
                  type: event,
                  spec: {
                    actions,
                    connectorRef,
                    repoName,
                    payloadConditions,
                    headerConditions,
                    authToken,
                    jexlCondition,
                    autoAbortPreviousExecutions = false
                  }
                }
              }
            },
            pipelineBranchName = getDefaultPipelineReferenceBranch(event),
            encryptedWebhookSecretIdentifier
          }
        } = triggerResponseJson

        const { value: sourceBranchValue, operator: sourceBranchOperator } =
          payloadConditions?.find(
            (payloadCondition: AddConditionInterface) => payloadCondition.key === PayloadConditionTypes.SOURCE_BRANCH
          ) || {}
        const { value: targetBranchValue, operator: targetBranchOperator } =
          payloadConditions?.find(
            (payloadCondition: AddConditionInterface) => payloadCondition.key === PayloadConditionTypes.TARGET_BRANCH
          ) || {}
        const { value: changedFilesValue, operator: changedFilesOperator } =
          payloadConditions?.find(
            (payloadCondition: AddConditionInterface) => payloadCondition.key === PayloadConditionTypes.CHANGED_FILES
          ) || {}
        const { value: tagConditionValue, operator: tagConditionOperator } =
          payloadConditions?.find(
            (payloadCondition: AddConditionInterface) => payloadCondition.key === PayloadConditionTypes.TAG
          ) || {}

        let pipelineJson = undefined

        if (inputYaml) {
          try {
            pipelineJson = parse(inputYaml)?.pipeline
            // Ensure ordering of variables and their values respectively for UI
            if (pipelineJson?.variables) {
              pipelineJson.variables = getOrderedPipelineVariableValues({
                originalPipelineVariables: resolvedPipeline?.variables,
                currentPipelineVariables: pipelineJson.variables
              })
            }
          } catch (e) {
            // set error
            showError(getString('triggers.cannotParseInputValues'))
          }
        } else if (gitAwareForTriggerEnabled) {
          pipelineJson = resolvedPipeline
        }

        triggerValues = {
          name,
          identifier,
          description,
          tags,
          ...(sourceRepo === GitSourceProviders.GITHUB.value && { encryptedWebhookSecretIdentifier }),
          pipeline: pipelineJson,
          sourceRepo: sourceRepoForYaml,
          triggerType: TriggerBaseType.WEBHOOK,
          event,
          autoAbortPreviousExecutions,
          connectorRef,
          repoName,
          secureToken: authToken?.spec?.value,
          actions: (actions || []).map((action: string) => ({
            label: action,
            value: action
          })),
          anyAction: (actions || []).length === 0,
          sourceBranchOperator,
          sourceBranchValue,
          targetBranchOperator,
          targetBranchValue,
          changedFilesOperator,
          changedFilesValue,
          tagConditionOperator,
          tagConditionValue,
          headerConditions,
          payloadConditions: payloadConditions?.filter(
            (payloadCondition: AddConditionInterface) =>
              payloadCondition.key !== PayloadConditionTypes.SOURCE_BRANCH &&
              payloadCondition.key !== PayloadConditionTypes.TARGET_BRANCH &&
              payloadCondition.key !== PayloadConditionTypes.CHANGED_FILES &&
              payloadCondition.key !== PayloadConditionTypes.TAG
          ),
          jexlCondition,
          pipelineBranchName,
          inputSetRefs
        }

        // connectorRef in Visual UI is an object (with the label), but in YAML is a string
        if (triggerValues?.connectorRef && typeof triggerValues.connectorRef === 'string') {
          const connectorRefWithBlankLabel: ConnectorRefInterface = {
            value: triggerValues.connectorRef,
            identifier: triggerValues.connectorRef
          }

          if (triggerYaml && connectorData?.data?.connector?.name) {
            const { connector } = connectorData.data

            connectorRefWithBlankLabel.connector = connector
            connectorRefWithBlankLabel.connector.identifier = triggerValues.connectorRef

            connectorRefWithBlankLabel.label = '' // will fetch details on useEffect
          }

          triggerValues.connectorRef = connectorRefWithBlankLabel

          const connectorParams: GetConnectorQueryParams = {
            accountIdentifier
          }
          if (triggerValues?.connectorRef?.value) {
            if (getScopeFromValue(triggerValues.connectorRef?.value) === Scope.ORG) {
              connectorParams.orgIdentifier = orgIdentifier
            } else if (getScopeFromValue(triggerValues.connectorRef?.value) === Scope.PROJECT) {
              connectorParams.orgIdentifier = orgIdentifier
              connectorParams.projectIdentifier = projectIdentifier
            }

            setConnectorScopeParams(connectorParams)
          }
        }

        return triggerValues
      } else {
        // custom webhook flow
        const {
          trigger: {
            name,
            identifier,
            description,
            tags,
            inputYaml,
            pipelineBranchName = getDefaultPipelineReferenceBranch(),
            inputSetRefs = [],
            source: {
              spec: {
                type: sourceRepoForCustomYaml,
                spec: { payloadConditions, headerConditions, authToken, jexlCondition }
              }
            }
          }
        } = triggerResponseJson

        let pipelineJson = undefined

        if (inputYaml) {
          try {
            pipelineJson = parse(inputYaml)?.pipeline
            // Ensure ordering of variables and their values respectively for UI
            if (pipelineJson?.variables) {
              pipelineJson.variables = getOrderedPipelineVariableValues({
                originalPipelineVariables: resolvedPipeline?.variables,
                currentPipelineVariables: pipelineJson.variables
              })
            }
          } catch (e) {
            // set error
            showError(getString('triggers.cannotParseInputValues'))
          }
        } else if (gitAwareForTriggerEnabled) {
          pipelineJson = resolvedPipeline
        }

        triggerValues = {
          name,
          identifier,
          description,
          tags,
          pipeline: pipelineJson,
          sourceRepo: sourceRepoForCustomYaml,
          triggerType: TriggerBaseType.WEBHOOK,
          secureToken: authToken?.spec?.value,
          headerConditions,
          payloadConditions,
          jexlCondition,
          pipelineBranchName,
          inputSetRefs
        }

        return triggerValues
      }
    } catch (e) {
      // set error
      showError(getString('triggers.cannotParseTriggersData'))
    }

    return triggerValues
  }

  useEffect(() => {
    if (triggerData?.yaml && triggerData.type === TriggerBaseType.WEBHOOK) {
      const newOnEditInitialValues = getWebhookTriggerValues({
        triggerResponseYaml: triggerData.yaml
      })
      setOnEditInitialValues({
        ...onEditInitialValues,
        ...newOnEditInitialValues
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerIdentifier, triggerData, template])

  const getWebhookTriggerYaml = ({
    values: val,
    persistIncomplete = false
  }: {
    values: FlatValidWebhookFormikValuesInterface
    persistIncomplete?: boolean
  }): TriggerConfigDTO => {
    const {
      name = '',
      identifier,
      description = '',
      tags,
      pipeline: pipelineRuntimeInput,
      sourceRepo: formikValueSourceRepo,
      triggerType: formikValueTriggerType,
      repoName,
      connectorRef,
      event = '',
      actions,
      sourceBranchOperator,
      sourceBranchValue,
      targetBranchOperator,
      targetBranchValue,
      changedFilesOperator,
      changedFilesValue,
      tagConditionOperator,
      tagConditionValue,
      headerConditions = [],
      payloadConditions = [],
      jexlCondition,
      secureToken,
      autoAbortPreviousExecutions = false,
      pipelineBranchName = getDefaultPipelineReferenceBranch(event),
      encryptedWebhookSecretIdentifier: { referenceString } = { referenceString: '' }
    } = val
    const inputSetRefs = get(val, 'inputSetSelected', []).map((_inputSet: InputSetValue) => _inputSet.value)

    const stringifyPipelineRuntimeInput = yamlStringify({
      pipeline: clearNullUndefined(pipelineRuntimeInput)
    })

    if (formikValueSourceRepo !== GitSourceProviders.CUSTOM.value) {
      if (
        ((targetBranchOperator && targetBranchValue?.trim()) ||
          (persistIncomplete && (targetBranchOperator || targetBranchValue?.trim()))) &&
        !payloadConditions.some(pc => pc.key === PayloadConditionTypes.TARGET_BRANCH) &&
        event !== eventTypes.TAG
      ) {
        payloadConditions.unshift({
          key: PayloadConditionTypes.TARGET_BRANCH,
          operator: targetBranchOperator || '',
          value: targetBranchValue || ''
        })
      }
      if (
        ((sourceBranchOperator && sourceBranchValue?.trim()) ||
          (persistIncomplete && (sourceBranchOperator || sourceBranchValue?.trim()))) &&
        !payloadConditions.some((pc: AddConditionInterface) => pc.key === PayloadConditionTypes.SOURCE_BRANCH) &&
        event !== eventTypes.PUSH &&
        event !== eventTypes.TAG
      ) {
        payloadConditions.unshift({
          key: PayloadConditionTypes.SOURCE_BRANCH,
          operator: sourceBranchOperator || '',
          value: sourceBranchValue || ''
        })
      }
      if (
        ((changedFilesOperator && changedFilesValue?.trim()) ||
          (persistIncomplete && (changedFilesOperator || changedFilesValue?.trim()))) &&
        !payloadConditions.some((pc: AddConditionInterface) => pc.key === PayloadConditionTypes.CHANGED_FILES) &&
        event !== eventTypes.TAG
      ) {
        payloadConditions.unshift({
          key: PayloadConditionTypes.CHANGED_FILES,
          operator: changedFilesOperator || '',
          value: changedFilesValue || ''
        })
      }
      if (
        ((tagConditionOperator && tagConditionValue?.trim()) ||
          (persistIncomplete && (tagConditionOperator || tagConditionValue?.trim()))) &&
        !payloadConditions.some((pc: AddConditionInterface) => pc.key === PayloadConditionTypes.TAG) &&
        event === eventTypes.TAG
      ) {
        payloadConditions.unshift({
          key: PayloadConditionTypes.TAG,
          operator: tagConditionOperator || '',
          value: tagConditionValue || ''
        })
      }

      // actions will be required thru validation
      const actionsValues = (actions as unknown as SelectOption[])?.map(action => action.value)
      const triggerYaml: NGTriggerConfigV2 = {
        name,
        identifier,
        enabled: enabledStatus,
        description,
        tags,
        ...(formikValueSourceRepo === GitSourceProviders.GITHUB.value && {
          encryptedWebhookSecretIdentifier: referenceString
        }),
        orgIdentifier,
        projectIdentifier,
        pipelineIdentifier,
        source: {
          type: formikValueTriggerType as unknown as NGTriggerSourceV2['type'],
          spec: {
            type: formikValueSourceRepo, // Github
            spec: {
              type: event,
              spec: {
                connectorRef: connectorRef?.value || '',
                autoAbortPreviousExecutions
              }
            }
          }
        },
        inputYaml: stringifyPipelineRuntimeInput,
        pipelineBranchName: gitAwareForTriggerEnabled ? pipelineBranchName : null,
        inputSetRefs: gitAwareForTriggerEnabled ? inputSetRefs : null
      } as NGTriggerConfigV2
      if (triggerYaml.source?.spec?.spec) {
        triggerYaml.source.spec.spec.spec.payloadConditions = persistIncomplete
          ? payloadConditions
          : payloadConditions.filter(payloadCondition => isRowFilled(payloadCondition))

        triggerYaml.source.spec.spec.spec.headerConditions = persistIncomplete
          ? headerConditions
          : headerConditions.filter(headerCondition => isRowFilled(headerCondition))

        if (jexlCondition) {
          triggerYaml.source.spec.spec.spec.jexlCondition = jexlCondition
        }

        if (repoName) {
          triggerYaml.source.spec.spec.spec.repoName = repoName
        } else if (connectorRef?.connector?.spec?.type === connectorUrlType.ACCOUNT) {
          triggerYaml.source.spec.spec.spec.repoName = ''
        }
        if (actionsValues) {
          triggerYaml.source.spec.spec.spec.actions = actionsValues
        }
      }
      return clearNullUndefined(triggerYaml)
    } else {
      const triggerYaml: NGTriggerConfigV2 = {
        name,
        identifier,
        enabled: enabledStatus,
        description,
        tags,
        orgIdentifier,
        projectIdentifier,
        pipelineIdentifier,
        source: {
          type: formikValueTriggerType as unknown as NGTriggerSourceV2['type'],
          spec: {
            type: formikValueSourceRepo, // Custom
            spec: {
              payloadConditions: []
            }
          }
        },
        inputYaml: stringifyPipelineRuntimeInput,
        pipelineBranchName: gitAwareForTriggerEnabled ? pipelineBranchName : null,
        inputSetRefs: gitAwareForTriggerEnabled ? inputSetRefs : null
      } as NGTriggerConfigV2

      if (secureToken && triggerYaml.source?.spec) {
        triggerYaml.source.spec.spec = {
          authToken: { type: 'inline', spec: { value: secureToken } }
        }
      }

      if (triggerYaml.source?.spec) {
        triggerYaml.source.spec.spec.payloadConditions = persistIncomplete
          ? payloadConditions
          : payloadConditions.filter(payloadCondition => isRowFilled(payloadCondition))
      }

      if (triggerYaml.source?.spec) {
        triggerYaml.source.spec.spec.headerConditions = persistIncomplete
          ? headerConditions
          : headerConditions.filter(headerCondition => isRowFilled(headerCondition))
      }

      if (jexlCondition && triggerYaml.source?.spec) {
        triggerYaml.source.spec.spec.jexlCondition = jexlCondition
      }

      if (triggerYaml?.source?.spec && isEmpty(triggerYaml.source.spec.spec)) {
        delete triggerYaml.source.spec.spec
      }

      return clearNullUndefined(triggerYaml)
    }
  }

  const convertFormikValuesToYaml = (values: any): { trigger: TriggerConfigDTO } | undefined => {
    const res = getWebhookTriggerYaml({ values, persistIncomplete: true })
    // remove invalid values
    if (res?.source?.spec?.spec && !res.source.spec.spec.actions) {
      delete res.source.spec.spec.actions
    }
    if (res?.source?.spec?.spec && !res.source.spec.spec.event) {
      delete res.source.spec.spec.event
    }

    if (gitAwareForTriggerEnabled) {
      delete res.inputYaml
      if (values.inputSetSelected?.length) {
        res.inputSetRefs = values.inputSetSelected.map((inputSet: InputSetValue) => inputSet.value)
      }
    }

    return { trigger: res }
  }

  const formikRef = useRef<FormikProps<any>>()
  const [formErrors, setFormErrors] = useState<FormikErrors<FlatValidFormikValuesInterface>>({})

  const renderErrorsStrip = (): JSX.Element => <ErrorsStrip formErrors={formErrors} />

  const onFormikEffect: FormikEffectProps['onChange'] = ({ formik, prevValues, nextValues }) => {
    formikRef.current = formik

    // Clear Errors Trip when Input Set Refs is changed (from users)
    if (
      formErrors &&
      Object.keys(formErrors).length &&
      nextValues.inputSetRefs?.length &&
      prevValues.inputSetRefs?.length !== nextValues.inputSetRefs?.length
    ) {
      setFormErrors({})
    }

    // Set pipelineBranchName to proper default expression when event is changed
    if (prevValues.event !== nextValues.event) {
      const { event, pipelineBranchName } = nextValues
      if (
        !(pipelineBranchName || '').trim() ||
        getMultiTypeFromValue(pipelineBranchName) === MultiTypeInputType.EXPRESSION
      ) {
        const defaultBranchName = getDefaultPipelineReferenceBranch(event)
        if (pipelineBranchName !== defaultBranchName) {
          formik.setFieldValue('pipelineBranchName', defaultBranchName)
        }
      }
    }
  }

  // Fix https://harness.atlassian.net/browse/CI-3411
  useEffect(() => {
    if (Object.keys(formErrors || {}).length > 0) {
      Object.entries({
        ...flattenKeys(omit(formErrors, ['pipelineBranchName', 'inputSetRefs'])),
        pipelineBranchName: get(formErrors, 'pipelineBranchName'),
        inputSetRefs: get(formErrors, 'inputSetRefs')
      }).forEach(([fieldName, fieldError]) => {
        formikRef?.current?.setFieldTouched(fieldName, true, true)
        setTimeout(() => formikRef?.current?.setFieldError(fieldName, fieldError), 0)
      })
    }
  }, [formErrors, formikRef])

  const getTriggerPipelineValues = (
    triggerYaml: string,
    formikProps: any
  ): { pipeline: PipelineInfoConfig } | undefined => {
    try {
      const triggerResponseJson = parse(triggerYaml)
      try {
        return parse(triggerResponseJson?.trigger.inputYaml || '')
      } catch (e) {
        showError(getString('triggers.cannotParseInputYaml'))
        // backend api to provide additional details on submit
        return
      }
    } catch (e) {
      showError(getString('triggers.cannotParseTriggersYaml'))
      formikProps
        .setSubmitting(false)(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          e as any
        )
        .preventDefault()
      // backend api to provide additional details on submit
      return
    }
  }

  const yamlTemplate = useMemo(() => {
    return parse(defaultTo(template?.data?.inputSetTemplateYaml, ''))?.pipeline
  }, [template?.data?.inputSetTemplateYaml])

  const getFormErrors = async ({
    latestPipeline,
    latestYamlTemplate,
    orgPipeline,
    setSubmitting
  }: {
    latestPipeline: { pipeline: PipelineInfoConfig }
    latestYamlTemplate: PipelineInfoConfig
    orgPipeline: PipelineInfoConfig | undefined
    setSubmitting: (bool: boolean) => void
  }): Promise<any> => {
    let errors = formErrors
    function validateErrors(): Promise<FormikErrors<FlatValidWebhookFormikValuesInterface>> {
      return new Promise(resolve => {
        setTimeout(() => {
          try {
            const validatedErrors =
              (validatePipeline({
                pipeline: { ...clearRuntimeInput(latestPipeline.pipeline) },
                template: latestYamlTemplate,
                originalPipeline: orgPipeline,
                resolvedPipeline,
                getString,
                viewType: StepViewType.TriggerForm,
                viewTypeMetadata: { isTrigger: true }
              }) as any) || formErrors
            resolve(validatedErrors)
          } catch (e) {
            showError(getString('triggers.cannotParseTriggersYaml'))
            setSubmitting(false)
          }
        }, 300)
      })
    }
    if (latestPipeline?.pipeline && latestYamlTemplate && orgPipeline) {
      errors = await validateErrors()

      setFormErrors(errors)
    }
    return errors
  }

  const validateTriggerPipeline = async ({
    formikProps,
    latestYaml: triggerYaml
  }: {
    formikProps: FormikProps<any>
    latestYaml?: any // validate from YAML view
  }): Promise<FormikErrors<FlatValidWebhookFormikValuesInterface>> => {
    if (!formikProps) return {}
    let _inputSetRefsError = ''

    if (gitAwareForTriggerEnabled) {
      // inputSetRefs is required if Input Set is required to run pipeline
      if (template?.data?.inputSetTemplateYaml && !formikProps?.values?.inputSetSelected?.length) {
        _inputSetRefsError = getString('triggers.inputSetIsRequired')
      }
    }

    const { values, setErrors, setSubmitting } = formikProps
    let latestPipelineFromYamlView
    const latestPipeline = {
      ...currentPipeline,
      pipeline: values.pipeline as PipelineInfoConfig
    }

    if (triggerYaml) {
      latestPipelineFromYamlView = getTriggerPipelineValues(triggerYaml, formikProps)
    }

    const runPipelineFormErrors = await getFormErrors({
      latestPipeline: latestPipelineFromYamlView || latestPipeline,
      latestYamlTemplate: yamlTemplate,
      orgPipeline: values.pipeline,
      setSubmitting
    })
    const gitXErrors = gitAwareForTriggerEnabled
      ? omitBy({ inputSetRefs: _inputSetRefsError }, value => !value)
      : undefined
    // https://github.com/formium/formik/issues/1392
    const errors: any = await {
      ...runPipelineFormErrors
    }

    if (gitXErrors && Object.keys(gitXErrors).length) {
      setErrors(gitXErrors)
      setFormErrors(gitXErrors)
      return gitXErrors
    } else if (!isEmpty(runPipelineFormErrors)) {
      setErrors(runPipelineFormErrors)
      return runPipelineFormErrors
    }
    return errors
  }

  const retryTriggerSubmit = useCallback(({ message }: ResponseNGTriggerResponseWithMessage) => {
    retryFn.current = () => {
      setIgnoreError(true)
      formikRef.current?.handleSubmit()
    }
    setRetrySavingConfirmation(message || getString('triggers.triggerCouldNotBeSavedGenericError'))
    confirmIgnoreErrorAndResubmit()
  }, [])

  const submitTrigger = async (triggerYaml: NGTriggerConfigV2 | TriggerConfigDTO): Promise<void> => {
    if (gitAwareForTriggerEnabled) {
      delete triggerYaml.inputYaml

      // Set pipelineBranchName to proper expression when it's left empty
      if (!(triggerYaml.pipelineBranchName || '').trim()) {
        triggerYaml.pipelineBranchName = getDefaultPipelineReferenceBranch(triggerYaml?.source?.spec?.spec?.type)
      }
    }

    if (!isNewTrigger) {
      try {
        const { status, data, message } = (await updateTrigger(
          yamlStringify({ trigger: clearNullUndefined(triggerYaml) }) as any
        )) as ResponseNGTriggerResponseWithMessage

        if (status === ResponseStatus.ERROR && gitAwareForTriggerEnabled) {
          retryTriggerSubmit({ message })
        } else if (data?.errors && !isEmpty(data?.errors)) {
          const displayErrors = displayPipelineIntegrityResponse(data.errors)
          setFormErrors(displayErrors)

          return
        } else if (status === ResponseStatus.SUCCESS) {
          showSuccess(
            getString('triggers.toast.successfulUpdate', {
              name: data?.name
            })
          )
          returnToTriggersPage()
        }
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((err as any)?.data?.status === ResponseStatus.ERROR && gitAwareForTriggerEnabled) {
          retryTriggerSubmit({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            message: getErrorMessage((err as any)?.data) || getString('triggers.retryTriggerSave')
          })
        } else {
          showError(getErrorMessage(err))
        }
      } finally {
        setIgnoreError(false)
      }
      // error flow sent to Wizard
    } else {
      try {
        const { status, data, message } = (await createTrigger(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          yamlStringify({ trigger: clearNullUndefined(triggerYaml) }) as any
        )) as ResponseNGTriggerResponseWithMessage

        if (status === ResponseStatus.ERROR && gitAwareForTriggerEnabled) {
          retryTriggerSubmit({ message })
        } else if (data?.errors && !isEmpty(data?.errors)) {
          const displayErrors = displayPipelineIntegrityResponse(data.errors)
          setFormErrors(displayErrors)

          return
        } else if (status === ResponseStatus.SUCCESS) {
          showSuccess(
            getString('triggers.toast.successfulCreate', {
              name: data?.name
            })
          )
          returnToTriggersPage()
        }
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((err as any)?.data?.status === ResponseStatus.ERROR && gitAwareForTriggerEnabled) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          retryTriggerSubmit({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            message: getErrorMessage((err as any)?.data) || getString('triggers.retryTriggerSave')
          })
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          showError((err as any)?.data?.message)
        }
      } finally {
        setIgnoreError(false)
      }
    }
  }

  const onSubmit = async (val: FlatValidWebhookFormikValuesInterface): Promise<void> => {
    const triggerYaml = getWebhookTriggerYaml({ values: val })

    submitTrigger(triggerYaml)
  }

  const handleModeSwitch = (view: SelectedView): void => {
    try {
      const latestYaml = yamlHandler?.getLatestYaml() || /* istanbul ignore next */ ''
      parse(latestYaml)
      const errorsYaml =
        (yamlHandler?.getYAMLValidationErrorMap() as unknown as Map<number, string>) || /* istanbul ignore next */ ''
      if (errorsYaml?.size > 0) {
        //? Do we want to add this
        // showError(getString('common.validation.invalidYamlText'))
        return
      }
      // handleModeSwitch?.(mode, yamlHandler)
      if (view === SelectedView.VISUAL) {
        const yaml = yamlHandler?.getLatestYaml() || /* istanbul ignore next */ ''
        clear()
        try {
          const triggerYaml = parse(yaml)
          setInitialValues({
            ...initialValues,
            ...getWebhookTriggerValues({ triggerYaml })
          })
          setWizardKey(wizardKey + 1)
        } catch (e) {
          showError(getString('triggers.cannotParseInputValues'))
        }
      }
      setSelectedView(view)
    } catch (e) {
      /* istanbul ignore next */
      showError(getString('common.validation.invalidYamlText'))
      return
    }
  }

  const [isExecutable] = usePermission(
    {
      resourceScope: {
        projectIdentifier,
        orgIdentifier,
        accountIdentifier
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipelineIdentifier
      },
      permissions: [PermissionIdentifier.EXECUTE_PIPELINE],
      options: {
        skipCache: true
      }
    },
    [accountIdentifier, orgIdentifier, projectIdentifier, pipelineIdentifier]
  )

  const isTriggerRbacDisabled = !isExecutable

  const ConnectorRefRegex = /^.+source\.spec\.spec\.spec\.connectorRef$/
  const invocationMapWebhook: YamlBuilderProps['invocationMap'] = new Map<RegExp, InvocationMapFunction>()

  invocationMapWebhook.set(
    ConnectorRefRegex,

    (_matchingPath: string, _currentYaml: string): Promise<CompletionItemInterface[]> => {
      return new Promise(resolve => {
        const request = getConnectorListV2Promise({
          queryParams: {
            accountIdentifier,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: { filterType: 'Connector', categories: ['CODE_REPO'] }
        })
          .then(response => {
            const data =
              response?.data?.content?.map(connector => ({
                label: getConnectorName(connector),
                insertText: getConnectorValue(connector),
                kind: CompletionItemKind.Field
              })) || []
            return data
          })
          .catch((err: Failure) => {
            throw err.message
          })

        resolve(request)
      })
    }
  )

  const triggerHeading = isNewTrigger ? getString('triggers.onNewWebhookTitle') : `Trigger: ${triggerData?.name}`

  return (
    <TabWizard
      key={wizardKey} // re-renders with yaml to visual initialValues
      wizardType="webhook"
      formikInitialProps={{
        initialValues,
        onSubmit: onSubmit,
        validationSchema: getValidationSchema(getString, isGithubWebhookAuthenticationEnabled),
        validate: validateTriggerPipeline,
        enableReinitialize: true
      }}
      tabWidth="200px"
      onHide={returnToTriggersPage}
      submitLabel={!isNewTrigger ? getString('triggers.updateTrigger') : getString('triggers.createTrigger')}
      disableSubmit={createTriggerLoading || updateTriggerLoading || isTriggerRbacDisabled || fetchingTemplate}
      isEdit={!isNewTrigger}
      visualYamlProps={{
        handleModeSwitch,
        yamlBuilderReadOnlyModeProps,
        yamlObjectKey: 'trigger',
        convertFormikValuesToYaml,
        schema: triggerSchema?.data,
        onYamlSubmit: submitTrigger,
        loading: loadingYamlSchema,
        invocationMap: invocationMapWebhook
      }}
      renderErrorsStrip={renderErrorsStrip}
      onFormikEffect={onFormikEffect}
      // new props
      panels={getPanels(getString)}
      // headerProps={{
      title={
        <TitleWithSwitch
          selectedView={selectedView}
          enabledStatus={enabledStatus}
          setEnabledStatus={setEnabledStatus}
          isTriggerRbacDisabled={isTriggerRbacDisabled}
          triggerHeading={triggerHeading}
        />
      }
      selectedView={selectedView}
      setSelectedView={setSelectedView}
      // }}
      yamlHandler={yamlHandler}
      setYamlHandler={setYamlHandler}
    >
      {props.children}
    </TabWizard>
  )
}
