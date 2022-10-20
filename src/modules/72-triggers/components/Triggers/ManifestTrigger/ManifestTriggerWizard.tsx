/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { defaultTo, get, isEmpty, isUndefined, merge, noop, omit, omitBy } from 'lodash-es'
import type { FormikErrors, FormikProps } from 'formik'
import { useHistory, useParams } from 'react-router-dom'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { parse } from 'yaml'
import { Color, Intent } from '@harness/design-system'
import {
  Button,
  ButtonVariation,
  Layout,
  PageSpinner,
  Switch,
  Text,
  useConfirmationDialog,
  VisualYamlSelectedView as SelectedView
} from '@wings-software/uicore'
import { getIdentifierFromValue, getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { FormikEffectProps } from '@common/components/FormikEffect/FormikEffect'
import Wizard from '@common/components/Wizard/Wizard'
import { Page, useToaster } from '@common/exports'
import { useConfirmAction, useDeepCompareEffect, useMutateAsGet, useQueryParams } from '@common/hooks'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import type {
  CompletionItemInterface,
  InvocationMapFunction,
  YamlBuilderHandlerBinding,
  YamlBuilderProps
} from '@common/interfaces/YAMLBuilderProps'
import routes from '@common/RouteDefinitions'
import { memoizedParse, yamlStringify } from '@common/utils/YamlHelperMethods'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { ErrorsStrip } from '@pipeline/components/ErrorsStrip/ErrorsStrip'
import type { InputSetValue } from '@pipeline/components/InputSetSelector/utils'
import { validatePipeline } from '@pipeline/components/PipelineStudio/StepUtil'
import {
  getPipelineWithoutCodebaseInputs,
  isCloneCodebaseEnabledAtLeastOneStage,
  isCodebaseFieldsRuntimeInputs
} from '@pipeline/utils/CIUtils'
import { clearRuntimeInput, mergeTemplateWithInputSetData } from '@pipeline/utils/runPipelineUtils'
import type { Pipeline } from '@pipeline/utils/types'
import { usePermission } from '@rbac/hooks/usePermission'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { useStrings } from 'framework/strings'

import { Failure, getConnectorListV2Promise, GetConnectorQueryParams, useGetConnector } from 'services/cd-ng'
import {
  GetTriggerQueryParams,
  NGTriggerConfigV2,
  NGTriggerSourceV2,
  PipelineInfoConfig,
  ResponseNGTriggerResponse,
  useCreateTrigger,
  useGetPipeline,
  useGetSchemaYaml,
  useGetTemplateFromPipeline,
  useGetTrigger,
  useUpdateTrigger
} from 'services/pipeline-ng'
import type { AddConditionInterface } from '@triggers/pages/triggers/views/AddConditionsSection'
import type { ManifestTriggerFormikValues } from '@triggers/components/steps/ManifestTriggerConfigPanel/ManifestSelection/ManifestInterface'
import type {
  ConnectorRefInterface,
  FlatOnEditValuesInterface,
  FlatValidArtifactFormikValuesInterface,
  FlatValidFormikValuesInterface,
  FlatValidScheduleFormikValuesInterface,
  FlatValidWebhookFormikValuesInterface,
  TriggerConfigDTO,
  TriggerGitQueryParams
} from '@triggers/pages/triggers/interface/TriggersWizardInterface'
import {
  clearNullUndefined,
  displayPipelineIntegrityResponse,
  EventConditionTypes,
  flattenKeys,
  getArtifactManifestTriggerYaml,
  getConnectorName,
  getConnectorValue,
  getDefaultPipelineReferenceBranch,
  getErrorMessage,
  getModifiedTemplateValues,
  getOrderedPipelineVariableValues,
  getManifestTriggerInitialSource,
  getValidationSchema,
  getWizardMap,
  isHarnessExpression,
  ResponseStatus,
  TriggerTypes
} from './ManifestWizardPageUtils'
import type { TriggerProps } from '../Trigger'
import useGitAwareForTriggerEnabled from '../useGitAwareForTriggerEnabled'
import css from '@triggers/pages/triggers/TriggersWizardPage.module.scss'

type ResponseNGTriggerResponseWithMessage = ResponseNGTriggerResponse & { message?: string }

export default function ManifestTriggerWizard(
  props: TriggerProps<any> & { children: JSX.Element[] }
): React.ReactElement {
  const { orgIdentifier, accountId, projectIdentifier, pipelineIdentifier, triggerIdentifier, module } = useParams<
    PipelineType<{
      projectIdentifier: string
      orgIdentifier: string
      accountId: string
      pipelineIdentifier: string
      targetIdentifier: string
      triggerIdentifier: string
    }>
  >()
  const {
    repoIdentifier,
    connectorRef: pipelineConnectorRef,
    repoName: pipelineRepoName,
    branch,
    storeType,
    triggerType: triggerTypeOnNew,
    manifestType
  } = useQueryParams<TriggerGitQueryParams>()
  const history = useHistory()
  const { getString } = useStrings()
  const { data: template, loading: fetchingTemplate } = useMutateAsGet(useGetTemplateFromPipeline, {
    queryParams: {
      accountIdentifier: accountId,
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

  const { data: triggerResponse, loading: loadingGetTrigger } = useGetTrigger({
    triggerIdentifier,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      targetIdentifier: pipelineIdentifier,
      branch
    } as GetTriggerQueryParams
    // lazy: true
  })
  const { data: pipelineResponse } = useGetPipeline({
    pipelineIdentifier,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      getTemplatesResolvedPipeline: true,
      branch,
      parentEntityConnectorRef: pipelineConnectorRef,
      parentEntityRepoName: pipelineRepoName
    }
  })

  const gitAwareForTriggerEnabled = useGitAwareForTriggerEnabled()

  const [connectorScopeParams] = useState<GetConnectorQueryParams | undefined>(undefined)
  const [ignoreError, setIgnoreError] = useState<boolean>(false)
  const createUpdateTriggerQueryParams = useMemo(
    () => ({
      accountIdentifier: accountId,
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
      accountId,
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

  const { mutate: createTrigger, loading: createTriggerLoading } = useCreateTrigger({
    queryParams: { ...createUpdateTriggerQueryParams, withServiceV2: true },
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })

  const { mutate: updateTrigger, loading: updateTriggerLoading } = useUpdateTrigger({
    triggerIdentifier,
    queryParams: createUpdateTriggerQueryParams,
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })

  const [errorToasterMessage, setErrorToasterMessage] = useState<string>('')

  const { loading: loadingYamlSchema, data: triggerSchema } = useGetSchemaYaml({
    queryParams: {
      entityType: 'Triggers',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      })
    }
  })
  const convertFormikValuesToYaml = (values: any): { trigger: TriggerConfigDTO } | undefined => {
    const res = getArtifactManifestTriggerYaml({
      values,
      persistIncomplete: true,
      manifestType,
      enabledStatus,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier,
      gitAwareForTriggerEnabled
    })
    if (gitAwareForTriggerEnabled) {
      delete res.inputYaml
      if (values.inputSetSelected?.length) {
        res.inputSetRefs = values.inputSetSelected.map((inputSet: InputSetValue) => inputSet.value)
      }
    }

    return { trigger: res }
  }

  const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
    fileName: `${triggerResponse?.data?.identifier ?? 'Trigger'}.yaml`,
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

  const [enabledStatus, setEnabledStatus] = useState<boolean>(true)
  const [currentPipeline, setCurrentPipeline] = useState<{ pipeline?: PipelineInfoConfig } | undefined>(undefined)
  const [wizardKey, setWizardKey] = useState<number>(0)
  const [isMergedPipelineReady, setIsMergedPipelineReady] = useState<boolean>(false)

  const [onEditInitialValues, setOnEditInitialValues] = useState<
    | FlatOnEditValuesInterface
    | {
        triggerType: NGTriggerSourceV2['type']
        pipeline?: PipelineInfoConfig | Record<string, never>
        originalPipeline?: PipelineInfoConfig
        resolvedPipeline?: PipelineInfoConfig
        identifier?: string
        connectorRef?: { identifier?: string; scope?: string }
        inputSetTemplateYamlObj?: {
          pipeline: PipelineInfoConfig | Record<string, never>
        }
      }
  >({ triggerType: triggerTypeOnNew })
  const isCreatingNewTrigger = useMemo(() => !onEditInitialValues?.identifier, [onEditInitialValues?.identifier])

  const { openDialog, closeDialog } = useConfirmationDialog({
    contentText: getString('triggers.updateTriggerDetails'),
    intent: Intent.WARNING,
    titleText: getString('triggers.updateTrigger'),
    customButtons: (
      <>
        <Button variation={ButtonVariation.PRIMARY} text={getString('close')} onClick={() => closeDialog()} />
      </>
    )
  })

  const originalPipeline: PipelineInfoConfig | undefined = memoizedParse<Pipeline>(
    (pipelineResponse?.data?.yamlPipeline as any) || ''
  )?.pipeline

  const resolvedPipeline: PipelineInfoConfig | undefined = memoizedParse<Pipeline>(
    (pipelineResponse?.data?.resolvedTemplatesPipelineYaml as any) || ''
  )?.pipeline

  const shouldRenderWizard = useMemo(() => {
    return !loadingGetTrigger && !fetchingTemplate
  }, [loadingGetTrigger, fetchingTemplate])

  useDeepCompareEffect(() => {
    if (shouldRenderWizard && template?.data?.inputSetTemplateYaml !== undefined) {
      if (onEditInitialValues?.pipeline && !isMergedPipelineReady) {
        let newOnEditPipeline = merge(
          parse(template?.data?.inputSetTemplateYaml)?.pipeline,
          onEditInitialValues.pipeline || {}
        )

        /*this check is needed as when trigger is already present with 1 stage and then tries to add parallel stage,
      we need to have correct yaml with both stages as a part of parallel*/
        if (
          newOnEditPipeline?.stages?.some((stages: { stage: any; parallel: any }) => stages?.stage && stages?.parallel)
        ) {
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
  }, [
    template?.data?.inputSetTemplateYaml,
    onEditInitialValues?.pipeline,
    resolvedPipeline,
    fetchingTemplate,
    loadingGetTrigger
  ])

  useEffect(() => {
    if (triggerResponse?.data?.enabled === false) {
      setEnabledStatus(false)
    }
  }, [triggerResponse?.data?.enabled])

  useEffect(() => {
    if (triggerResponse?.data?.yaml && triggerResponse.data.type === TriggerTypes.MANIFEST) {
      const newOnEditInitialValues = getArtifactTriggerValues({
        triggerResponseYaml: triggerResponse?.data?.yaml
      })
      setOnEditInitialValues({
        ...onEditInitialValues,
        ...newOnEditInitialValues
      })
    }
  }, [triggerIdentifier, triggerResponse, template])

  const returnToTriggersPage = (): void => {
    history.push(
      routes.toTriggersPage({
        accountId,
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
  }
  const { showSuccess } = useToaster()

  const getArtifactTriggerValues = ({
    triggerResponseYaml,
    triggerYaml
  }: {
    triggerResponseYaml?: string
    triggerYaml?: { trigger: NGTriggerConfigV2 }
  }): FlatOnEditValuesInterface | undefined => {
    let newOnEditInitialValues: FlatOnEditValuesInterface | undefined
    try {
      const triggerResponseJson = triggerYaml ?? parse(triggerResponseYaml ?? '')
      const {
        trigger: {
          name,
          identifier,
          description,
          tags,
          inputYaml,
          pipelineBranchName = getDefaultPipelineReferenceBranch(),
          inputSetRefs = [],
          source
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
          setErrorToasterMessage(getString('triggers.cannotParseInputValues'))
        }
      } else if (gitAwareForTriggerEnabled) {
        pipelineJson = resolvedPipeline
      }
      const eventConditions = source?.spec?.spec?.eventConditions || []
      const { value: versionValue, operator: versionOperator } =
        eventConditions?.find(
          (eventCondition: AddConditionInterface) => eventCondition.key === EventConditionTypes.VERSION
        ) || {}
      const { value: buildValue, operator: buildOperator } =
        eventConditions?.find(
          (eventCondition: AddConditionInterface) => eventCondition.key === EventConditionTypes.BUILD
        ) || {}

      newOnEditInitialValues = {
        name,
        identifier,
        description,
        triggerType: triggerTypeOnNew,
        tags,
        source,
        pipeline: pipelineJson,
        manifestType: TriggerTypes.MANIFEST,
        stageId: source?.spec?.stageIdentifier,
        inputSetTemplateYamlObj: parse(template?.data?.inputSetTemplateYaml || ''),
        pipelineBranchName,
        inputSetRefs,
        versionValue,
        versionOperator,
        buildValue,
        buildOperator,
        eventConditions: eventConditions?.filter(
          (eventCondition: AddConditionInterface) =>
            eventCondition.key !== EventConditionTypes.BUILD && eventCondition.key !== EventConditionTypes.VERSION
        )
      }

      return newOnEditInitialValues
    } catch (e) {
      // set error
      setErrorToasterMessage(getString('triggers.cannotParseTriggersData'))
    }
  }

  const [formErrors, setFormErrors] = useState<FormikErrors<FlatValidFormikValuesInterface>>({})
  const formikRef = useRef<FormikProps<any>>()

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
    function validateErrors(): Promise<
      FormikErrors<
        | FlatValidArtifactFormikValuesInterface
        | FlatValidWebhookFormikValuesInterface
        | FlatValidScheduleFormikValuesInterface
      >
    > {
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
            setErrorToasterMessage(getString('triggers.cannotParseTriggersYaml'))
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

  const retryTriggerSubmit = useCallback(({ message }: ResponseNGTriggerResponseWithMessage) => {
    retryFn.current = () => {
      setIgnoreError(true)
      formikRef.current?.handleSubmit()
    }
    setRetrySavingConfirmation(message || getString('triggers.triggerCouldNotBeSavedGenericError'))
    confirmIgnoreErrorAndResubmit()
  }, [])

  // TriggerConfigDTO is NGTriggerConfigV2 with optional identifier
  const submitTrigger = async (triggerYaml: NGTriggerConfigV2 | TriggerConfigDTO): Promise<void> => {
    setErrorToasterMessage('')

    if (gitAwareForTriggerEnabled) {
      delete triggerYaml.inputYaml

      // Set pipelineBranchName to proper expression when it's left empty
      if (!(triggerYaml.pipelineBranchName || '').trim()) {
        triggerYaml.pipelineBranchName = getDefaultPipelineReferenceBranch(
          triggerYaml?.source?.type,
          triggerYaml?.source?.spec?.spec?.type
        )
      }
    }
    const successCallback = ({ status, data, message }: ResponseNGTriggerResponseWithMessage): void => {
      if (status === ResponseStatus.ERROR && gitAwareForTriggerEnabled) {
        retryTriggerSubmit({ message })
      } else if (data?.errors && !isEmpty(data?.errors)) {
        const displayErrors = displayPipelineIntegrityResponse(data.errors)
        setFormErrors(displayErrors)

        return
      } else if (status === ResponseStatus.SUCCESS) {
        showSuccess(
          getString(isCreatingNewTrigger ? 'triggers.toast.successfulCreate' : 'triggers.toast.successfulUpdate', {
            name: data?.name
          })
        )
        history.push(
          routes.toTriggersPage({
            accountId,
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
      }
    }

    const errorCallback = (err: any): void => {
      if (err?.data?.status === ResponseStatus.ERROR && gitAwareForTriggerEnabled) {
        retryTriggerSubmit({ message: getErrorMessage(err?.data) || getString('triggers.retryTriggerSave') })
      } else {
        setErrorToasterMessage(getErrorMessage(err))
      }
    }

    if (!isCreatingNewTrigger) {
      try {
        const { status, data, message } = (await updateTrigger(
          yamlStringify({ trigger: clearNullUndefined(triggerYaml) }) as any
        )) as ResponseNGTriggerResponseWithMessage

        successCallback({ status, data, message })
      } catch (err) {
        errorCallback(err)
      } finally {
        setIgnoreError(false)
      }
      // error flow sent to Wizard
    } else {
      try {
        const { status, data, message } = (await createTrigger(
          yamlStringify({ trigger: clearNullUndefined(triggerYaml) }) as any
        )) as ResponseNGTriggerResponseWithMessage

        successCallback({ status, data, message })
      } catch (err) {
        errorCallback(err)
      } finally {
        setIgnoreError(false)
      }
    }
  }

  const handleArtifactSubmit = async (val: FlatValidArtifactFormikValuesInterface): Promise<void> => {
    const triggerYaml = getArtifactManifestTriggerYaml({
      values: val,
      manifestType,
      enabledStatus,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier,
      gitAwareForTriggerEnabled
    })
    submitTrigger(triggerYaml)
  }

  const getInitialValues = (): ManifestTriggerFormikValues => {
    let newPipeline: any = { ...(currentPipeline?.pipeline || {}) }
    // only applied for CI, Not cloned codebase
    if (
      newPipeline?.template?.templateInputs &&
      isCodebaseFieldsRuntimeInputs(newPipeline.template.templateInputs as PipelineInfoConfig) &&
      resolvedPipeline &&
      !isCloneCodebaseEnabledAtLeastOneStage(resolvedPipeline as PipelineInfoConfig)
    ) {
      newPipeline = getPipelineWithoutCodebaseInputs(newPipeline)
    }

    const inputSetTemplateYamlObj = parse(template?.data?.inputSetTemplateYaml || '')
    const source = getManifestTriggerInitialSource()

    return {
      triggerType: triggerTypeOnNew,
      identifier: '',
      tags: {},
      source,
      pipeline: newPipeline,
      originalPipeline,
      resolvedPipeline,
      inputSetTemplateYamlObj,
      pipelineBranchName: getDefaultPipelineReferenceBranch(triggerTypeOnNew)
    }
  }

  const [initialValues, setInitialValues] = useState<ManifestTriggerFormikValues>(
    merge(getInitialValues(), onEditInitialValues)
  )

  useEffect(() => {
    let newInitialValues = Object.assign(getInitialValues(), onEditInitialValues) as ManifestTriggerFormikValues
    if (onEditInitialValues?.identifier) {
      newInitialValues = (newInitialValues?.pipeline as PipelineInfoConfig)?.template
        ? getModifiedTemplateValues(newInitialValues)
        : newInitialValues
    }

    setInitialValues(newInitialValues)
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

        const inputSetTemplateYamlObj = parse(template?.data?.inputSetTemplateYaml || '')
        additionalValues.inputSetTemplateYamlObj = inputSetTemplateYamlObj

        if (onEditInitialValues?.identifier) {
          const newPipeline = currentPipeline?.pipeline ? currentPipeline.pipeline : onEditInitialValues.pipeline || {}
          setOnEditInitialValues({
            ...onEditInitialValues,
            originalPipeline: newOriginalPipeline,
            resolvedPipeline: newResolvedPipeline,
            pipeline: newPipeline,
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
        setErrorToasterMessage(getString('triggers.cannotParseInputValues'))
      }
    }
  }, [
    pipelineResponse?.data?.yamlPipeline,
    pipelineResponse?.data?.resolvedTemplatesPipelineYaml,
    onEditInitialValues?.identifier,
    initialValues,
    currentPipeline
  ])

  const { data: connectorData, refetch: getConnectorDetails } = useGetConnector({
    identifier: getIdentifierFromValue(
      wizardKey < 1 // wizardKey >1 means we've reset initialValues cause of Yaml Switching (onEdit or new) and should use those formik values instead
        ? onEditInitialValues?.connectorRef?.identifier || ''
        : initialValues?.connectorRef?.identifier || ''
    ),
    queryParams: connectorScopeParams,
    lazy: true
  })

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
      const { triggerType, event, pipelineBranchName } = nextValues
      if (!(pipelineBranchName || '').trim() || isHarnessExpression(pipelineBranchName)) {
        const defaultBranchName = getDefaultPipelineReferenceBranch(triggerType, event)
        if (pipelineBranchName !== defaultBranchName) {
          formik.setFieldValue('pipelineBranchName', defaultBranchName)
        }
      }
    }
  }

  useEffect(() => {
    if (
      (onEditInitialValues?.connectorRef?.identifier && !isUndefined(connectorScopeParams) && !connectorData) ||
      (initialValues?.connectorRef?.value &&
        (!initialValues.connectorRef.label ||
          (connectorData?.data?.connector?.identifier &&
            !initialValues?.connectorRef?.identifier?.includes(connectorData?.data?.connector?.identifier))))
    ) {
      getConnectorDetails()
    }
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
  }, [
    connectorData?.data?.connector,
    onEditInitialValues?.connectorRef?.identifier,
    initialValues?.connectorRef?.identifier
  ])

  const handleArtifactModeSwitch = (view: SelectedView, yamlHandler?: YamlBuilderHandlerBinding): void => {
    if (view === SelectedView.VISUAL) {
      const yaml = yamlHandler?.getLatestYaml() || /* istanbul ignore next */ ''
      setErrorToasterMessage('')
      try {
        const triggerYaml = parse(yaml)
        const newInitialValue = {
          ...initialValues,
          ...getArtifactTriggerValues({ triggerYaml })
        }
        setInitialValues(newInitialValue as ManifestTriggerFormikValues)
        setWizardKey(wizardKey + 1)
      } catch (e) {
        setErrorToasterMessage(getString('triggers.cannotParseInputValues'))
      }
    }
  }

  const [isExecutable] = usePermission(
    {
      resourceScope: {
        projectIdentifier: projectIdentifier,
        orgIdentifier: orgIdentifier,
        accountIdentifier: accountId
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
    [projectIdentifier, orgIdentifier, accountId, pipelineIdentifier]
  )

  const isTriggerRbacDisabled = !isExecutable

  const wizardMap = getWizardMap({
    getString,
    triggerName: initialValues?.name
  })

  const titleWithSwitch = ({ selectedView }: { selectedView: SelectedView }): JSX.Element => (
    <Layout.Horizontal
      spacing="medium"
      style={{
        paddingLeft: 'var(--spacing-xlarge)',
        paddingTop: 'var(--spacing-xsmall)',
        alignItems: 'baseline'
      }}
    >
      <Text color={Color.GREY_800} font={{ weight: 'bold' }} style={{ fontSize: 20 }}>
        {wizardMap?.wizardLabel}{' '}
      </Text>
      {selectedView !== SelectedView.YAML ? (
        <>
          <Switch
            style={{ paddingLeft: '46px' }}
            label={getString('enabledLabel')}
            disabled={isTriggerRbacDisabled}
            data-name="enabled-switch"
            key={Date.now()}
            checked={enabledStatus}
            onChange={() => setEnabledStatus(!enabledStatus)}
          />
        </>
      ) : null}
    </Layout.Horizontal>
  )
  const ConnectorRefRegex = /^.+source\.spec\.spec\.spec\.connectorRef$/
  const invocationMapWebhook: YamlBuilderProps['invocationMap'] = new Map<RegExp, InvocationMapFunction>()

  invocationMapWebhook.set(
    ConnectorRefRegex,

    (_matchingPath: string, _currentYaml: string): Promise<CompletionItemInterface[]> => {
      return new Promise(resolve => {
        const request = getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
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

  const renderErrorsStrip = (): JSX.Element => <ErrorsStrip formErrors={formErrors} />

  const getTriggerPipelineValues = (
    triggerYaml: string,
    formikProps: any
  ): { pipeline: PipelineInfoConfig } | undefined => {
    try {
      const triggerResponseJson = parse(triggerYaml)
      try {
        return parse(triggerResponseJson?.trigger.inputYaml || '')
      } catch (e) {
        setErrorToasterMessage(getString('triggers.cannotParseInputYaml'))
        // backend api to provide additional details on submit
        return
      }
    } catch (e) {
      setErrorToasterMessage(getString('triggers.cannotParseTriggersYaml'))
      formikProps.setSubmitting(false)
      // backend api to provide additional details on submit
      return
    }
  }

  const validateTriggerPipeline = async ({
    formikProps,
    latestYaml: triggerYaml
  }: {
    formikProps: FormikProps<any>
    latestYaml?: any // validate from YAML view
  }): Promise<FormikErrors<FlatValidWebhookFormikValuesInterface>> => {
    if (!formikProps) return {}
    let _pipelineBranchNameError = ''
    let _inputSetRefsError = ''

    if (gitAwareForTriggerEnabled) {
      // Custom validation when pipeline Reference Branch Name is an expression for non-webhook triggers
      if (formikProps?.values?.triggerType !== TriggerTypes.WEBHOOK) {
        const pipelineBranchName = (formikProps?.values?.pipelineBranchName || '').trim()

        if (isHarnessExpression(pipelineBranchName)) {
          _pipelineBranchNameError = getString('triggers.branchNameCantBeExpression')
        }
      }

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
      ? omitBy({ pipelineBranchName: _pipelineBranchNameError, inputSetRefs: _inputSetRefsError }, value => !value)
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

  const renderArtifactWizard = (): JSX.Element | undefined => {
    const isEdit = !!onEditInitialValues?.identifier

    return (
      <Wizard
        key={wizardKey} // re-renders with yaml to visual initialValues
        formikInitialProps={{
          initialValues,
          onSubmit: (val: FlatValidArtifactFormikValuesInterface) => handleArtifactSubmit(val),
          validationSchema: getValidationSchema(getString),
          validate: validateTriggerPipeline,
          validateOnChange: true,
          enableReinitialize: true
        }}
        className={css.tabs}
        wizardMap={wizardMap}
        tabWidth="200px"
        tabChevronOffset="178px"
        onHide={returnToTriggersPage}
        submitLabel={isEdit ? getString('triggers.updateTrigger') : getString('triggers.createTrigger')}
        wizardType="artifacts"
        disableSubmit={
          loadingGetTrigger || createTriggerLoading || updateTriggerLoading || isTriggerRbacDisabled || fetchingTemplate
        }
        isEdit={isEdit}
        errorToasterMessage={errorToasterMessage}
        visualYamlProps={{
          handleModeSwitch: handleArtifactModeSwitch,
          yamlBuilderReadOnlyModeProps,
          yamlObjectKey: 'trigger',
          showVisualYaml: true,
          convertFormikValuesToYaml,
          schema: triggerSchema?.data,
          onYamlSubmit: submitTrigger,
          loading: loadingYamlSchema,
          invocationMap: invocationMapWebhook
        }}
        renderErrorsStrip={renderErrorsStrip}
        leftNav={titleWithSwitch}
        onFormikEffect={onFormikEffect}
      >
        {props.children}
      </Wizard>
    )
  }

  if (
    initialValues?.triggerType &&
    !Object.values(TriggerTypes).includes(initialValues.triggerType) &&
    shouldRenderWizard
  ) {
    return (
      <Layout.Vertical spacing="medium" padding="medium">
        <Page.Body>
          <h2>{getString('triggers.pageNotFound')}</h2>
        </Page.Body>
      </Layout.Vertical>
    )
  }

  return shouldRenderWizard ? (
    <Page.Body>{renderArtifactWizard()}</Page.Body>
  ) : (
    <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
      <PageSpinner />
    </div>
  )
}
