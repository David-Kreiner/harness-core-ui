/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import type { FormikErrors, FormikProps } from 'formik'
import { defaultTo, get, isEmpty, merge, noop, omit, omitBy } from 'lodash-es'
import { parse } from 'yaml' // Use parse from yaml helper

import {
  Button,
  ButtonVariation,
  getMultiTypeFromValue,
  Intent,
  Layout,
  MultiTypeInputType,
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
import { useStrings } from 'framework/strings'

import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import type {
  GitQueryParams,
  ModulePathParams,
  PipelinePathProps,
  TriggerPathProps
} from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { useConfirmAction, useDeepCompareEffect, useMutateAsGet, useQueryParams } from '@common/hooks'
import { memoizedParse, yamlStringify } from '@common/utils/YamlHelperMethods'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { FormikEffectProps } from '@common/components/FormikEffect/FormikEffect'

import { usePermission } from '@rbac/hooks/usePermission'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'

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

import {
  getBreakdownValues,
  getDefaultExpressionBreakdownValues,
  resetScheduleObject,
  scheduleTabsId
} from '@triggers/components/steps/SchedulePanel/components/utils'
import { scheduledTypes } from '@triggers/pages/triggers/utils/TriggersWizardPageUtils'
import TitleWithSwitch from '../components/TitleWithSwitch/TitleWithSwitch'
import { flattenKeys, getModifiedTemplateValues } from '../WebhookTrigger/utils'
import type { TriggerProps } from '../Trigger'
import { TriggerBaseType } from '../TriggerInterface'
import {
  clearNullUndefined,
  displayPipelineIntegrityResponse,
  getErrorMessage,
  getOrderedPipelineVariableValues,
  ResponseStatus
} from '../utils'
import type { FlatValidFormikValuesInterface, TriggerConfigDTO } from '../TriggerWizardInterface'
import {
  FlatInitialValuesInterface,
  FlatOnEditValuesInterface,
  FlatValidScheduleFormikValuesInterface,
  getValidationSchema,
  getPanels
} from './utils'
import useGitAwareForTriggerEnabled from '../useGitAwareForTriggerEnabled'

type ResponseNGTriggerResponseWithMessage = ResponseNGTriggerResponse & { message?: string }

export default function ScheduledTriggerWizard(
  props: TriggerProps<any> & { children: JSX.Element[] }
): React.ReactElement {
  const { isNewTrigger, baseType, triggerData } = props

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
    let newPipeline = { ...(currentPipeline?.pipeline || {}) } as PipelineInfoConfig
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
      identifier: '',
      tags: {},
      selectedScheduleTab: scheduleTabsId.MINUTES,
      pipeline: newPipeline,
      originalPipeline,
      resolvedPipeline,
      pipelineBranchName: '',
      ...getDefaultExpressionBreakdownValues(scheduleTabsId.MINUTES)
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

  const [wizardKey, setWizardKey] = useState<number>(0)

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

  const getScheduleTriggerValues = ({
    triggerResponseYaml,
    triggerYaml
  }: {
    triggerResponseYaml?: string
    triggerYaml?: { trigger: NGTriggerConfigV2 }
  }): FlatOnEditValuesInterface | undefined => {
    let newOnEditInitialValues: FlatOnEditValuesInterface | undefined
    try {
      const triggerResponseJson = triggerYaml ? triggerYaml : triggerResponseYaml ? parse(triggerResponseYaml) : {}
      const {
        trigger: {
          name,
          identifier,
          description,
          tags,
          inputYaml,
          pipelineBranchName = '',
          inputSetRefs = [],
          source: {
            spec: {
              spec: { expression }
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
      const expressionBreakdownValues = getBreakdownValues(expression)
      const newExpressionBreakdown = {
        ...resetScheduleObject,
        ...expressionBreakdownValues
      }
      newOnEditInitialValues = {
        name,
        identifier,
        description,
        tags,
        pipeline: pipelineJson,
        triggerType: TriggerBaseType.SCHEDULE,
        expression,
        pipelineBranchName,
        inputSetRefs,
        ...newExpressionBreakdown,
        selectedScheduleTab: scheduleTabsId.CUSTOM // only show CUSTOM on edit
      }
      return newOnEditInitialValues
    } catch (e) {
      // set error
      showError(getString('triggers.cannotParseTriggersData'))
    }
  }

  useEffect(() => {
    if (triggerData?.yaml && triggerData.type === TriggerBaseType.SCHEDULE) {
      const newOnEditInitialValues = getScheduleTriggerValues({
        triggerResponseYaml: triggerData.yaml
      })
      setOnEditInitialValues({
        ...onEditInitialValues,
        ...newOnEditInitialValues
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerIdentifier, triggerData, template])

  const getScheduleTriggerYaml = ({
    values: val
  }: {
    values: FlatValidScheduleFormikValuesInterface
  }): TriggerConfigDTO => {
    const {
      name,
      identifier,
      description,
      tags,
      pipeline: pipelineRuntimeInput,
      triggerType: formikValueTriggerType,
      expression,
      pipelineBranchName = '',
      inputSetRefs
    } = val

    // actions will be required thru validation
    const stringifyPipelineRuntimeInput = yamlStringify({
      pipeline: clearNullUndefined(pipelineRuntimeInput)
    })
    return clearNullUndefined({
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
          type: scheduledTypes.CRON,
          spec: {
            expression
          }
        }
      },
      inputYaml: stringifyPipelineRuntimeInput,
      pipelineBranchName: gitAwareForTriggerEnabled ? pipelineBranchName : undefined,
      inputSetRefs: gitAwareForTriggerEnabled ? inputSetRefs : undefined
    })
  }

  const convertFormikValuesToYaml = (values: any): { trigger: TriggerConfigDTO } | undefined => {
    const res = getScheduleTriggerYaml({ values })
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
      const { pipelineBranchName } = nextValues
      if (
        !(pipelineBranchName || '').trim() ||
        getMultiTypeFromValue(pipelineBranchName) === MultiTypeInputType.EXPRESSION
      ) {
        const defaultBranchName = ''
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
    function validateErrors(): Promise<FormikErrors<FlatValidScheduleFormikValuesInterface>> {
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
  }): Promise<FormikErrors<FlatValidScheduleFormikValuesInterface>> => {
    if (!formikProps) return {}
    let _pipelineBranchNameError = ''
    let _inputSetRefsError = ''

    if (gitAwareForTriggerEnabled) {
      const pipelineBranchName = (formikProps?.values?.pipelineBranchName || '').trim()

      if (getMultiTypeFromValue(pipelineBranchName) === MultiTypeInputType.EXPRESSION) {
        _pipelineBranchNameError = getString('triggers.branchNameCantBeExpression')
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

  const onSubmit = async (val: FlatValidScheduleFormikValuesInterface): Promise<void> => {
    const triggerYaml = getScheduleTriggerYaml({ values: val })

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
            ...getScheduleTriggerValues({ triggerYaml })
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

  const triggerHeading = isNewTrigger ? getString('triggers.onNewScheduleTitle') : `Trigger: ${triggerData?.name}`

  return (
    <TabWizard
      key={wizardKey} // re-renders with yaml to visual initialValues
      wizardType="scheduled"
      formikInitialProps={{
        initialValues,
        onSubmit: onSubmit,
        validationSchema: getValidationSchema(getString),
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
        loading: loadingYamlSchema
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
