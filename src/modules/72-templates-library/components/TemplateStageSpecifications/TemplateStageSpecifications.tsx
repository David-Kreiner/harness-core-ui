/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext } from 'react'
import { debounce, defaultTo, isEmpty, isEqual, noop, set } from 'lodash-es'
import { Card, Container, Formik, FormikForm, Heading, Layout, PageError } from '@harness/uicore'
import * as Yup from 'yup'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import { produce } from 'immer'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type { Error, StageElementConfig } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { PageSpinner } from '@common/components'
import {
  getIdentifierFromValue,
  getScopeBasedProjectPathParams,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import type { ProjectPathProps, GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { NameId } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import { getsMergedTemplateInputYamlPromise, useGetTemplate, useGetTemplateInputSetYaml } from 'services/template-ng'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StageForm } from '@pipeline/components/PipelineInputSetForm/PipelineInputSetForm'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { TemplateTabs } from '@templates-library/components/TemplateStageSetupShell/TemplateStageSetupShellUtils'
import { validateStage } from '@pipeline/components/PipelineStudio/StepUtil'
import { useGlobalEventListener, useQueryParams } from '@common/hooks'
import ErrorsStripBinded from '@pipeline/components/ErrorsStrip/ErrorsStripBinded'
import { useStageTemplateActions } from '@pipeline/utils/useStageTemplateActions'
import { TemplateBar } from '@pipeline/components/PipelineStudio/TemplateBar/TemplateBar'
import { getTemplateErrorMessage, replaceDefaultValues, TEMPLATE_INPUT_PATH } from '@pipeline/utils/templateUtils'
import { parse, stringify } from '@common/utils/YamlHelperMethods'
import { getGitQueryParamsWithParentScope } from '@common/utils/gitSyncUtils'
import css from './TemplateStageSpecifications.module.scss'

declare global {
  interface WindowEventMap {
    SAVE_PIPELINE_CLICKED: CustomEvent<string>
  }
}

export const TemplateStageSpecifications = (): JSX.Element => {
  const {
    state: {
      selectionState: { selectedStageId = '' },
      storeMetadata
    },
    allowableTypes,
    updateStage,
    isReadonly,
    getStageFromPipeline,
    setIntermittentLoading
  } = usePipelineContext()
  const { stage } = getStageFromPipeline(selectedStageId)
  const queryParams = useParams<ProjectPathProps>()
  const { branch, repoIdentifier } = useQueryParams<GitQueryParams>()
  const templateRef = getIdentifierFromValue(defaultTo(stage?.stage?.template?.templateRef, ''))
  const templateVersionLabel = getIdentifierFromValue(defaultTo(stage?.stage?.template?.versionLabel, ''))
  const templateScope = getScopeFromValue(defaultTo(stage?.stage?.template?.templateRef, ''))
  const [formValues, setFormValues] = React.useState<StageElementConfig | undefined>(stage?.stage)
  const [allValues, setAllValues] = React.useState<StageElementConfig>()
  const [templateInputs, setTemplateInputs] = React.useState<StageElementConfig>()
  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)
  const formikRef = React.useRef<FormikProps<unknown> | null>(null)
  const { submitFormsForTab } = useContext(StageErrorContext)
  const { getString } = useStrings()
  const [loadingMergedTemplateInputs, setLoadingMergedTemplateInputs] = React.useState<boolean>(false)

  const onChange = React.useCallback(
    debounce(async (values: StageElementConfig): Promise<void> => {
      await updateStage({ ...stage?.stage, ...values })
    }, 300),
    [stage?.stage, updateStage]
  )

  const {
    data: templateResponse,
    error: templateError,
    refetch: refetchTemplate,
    loading: templateLoading
  } = useGetTemplate({
    templateIdentifier: templateRef,
    queryParams: {
      ...getScopeBasedProjectPathParams(queryParams, templateScope),
      versionLabel: templateVersionLabel,
      ...getGitQueryParamsWithParentScope(storeMetadata, queryParams, repoIdentifier, branch)
    }
  })

  React.useEffect(() => {
    setAllValues({
      ...parse<{ template: { spec: StageElementConfig } }>(defaultTo(templateResponse?.data?.yaml, ''))?.template.spec,
      identifier: defaultTo(stage?.stage?.identifier, '')
    })
  }, [templateResponse?.data?.yaml])

  const {
    data: templateInputSetYaml,
    error: templateInputSetError,
    refetch: refetchTemplateInputSet,
    loading: templateInputSetLoading
  } = useGetTemplateInputSetYaml({
    templateIdentifier: templateRef,
    queryParams: {
      ...getScopeBasedProjectPathParams(queryParams, templateScope),
      versionLabel: defaultTo(stage?.stage?.template?.versionLabel, ''),
      ...getGitQueryParamsWithParentScope(storeMetadata, queryParams, repoIdentifier, branch)
    }
  })

  const updateFormValues = (newTemplateInputs?: StageElementConfig) => {
    const updatedStage = produce(stage?.stage as StageElementConfig, draft => {
      set(
        draft,
        'template.templateInputs',
        !isEmpty(newTemplateInputs) ? replaceDefaultValues(newTemplateInputs) : undefined
      )
    })
    setFormValues(updatedStage)
    updateStage(updatedStage)
  }

  const retainInputsAndUpdateFormValues = (newTemplateInputs?: StageElementConfig) => {
    if (isEmpty(newTemplateInputs)) {
      updateFormValues(newTemplateInputs)
    } else {
      setLoadingMergedTemplateInputs(true)
      try {
        getsMergedTemplateInputYamlPromise({
          body: {
            oldTemplateInputs: stringify(defaultTo(stage?.stage?.template?.templateInputs, '')),
            newTemplateInputs: stringify(newTemplateInputs)
          },
          queryParams: {
            accountIdentifier: queryParams.accountId
          }
        }).then(response => {
          if (response && response.status === 'SUCCESS') {
            setLoadingMergedTemplateInputs(false)
            updateFormValues(parse<StageElementConfig>(defaultTo(response.data?.mergedTemplateInputs, '')))
          } else {
            throw response
          }
        })
      } catch (error) {
        setLoadingMergedTemplateInputs(false)
        updateFormValues(newTemplateInputs)
      }
    }
  }

  React.useEffect(() => {
    if (templateInputSetLoading) {
      setTemplateInputs(undefined)
      setAllValues(undefined)
    } else {
      const newTemplateInputs = parse<StageElementConfig>(defaultTo(templateInputSetYaml?.data, ''))
      setTemplateInputs(newTemplateInputs)
      retainInputsAndUpdateFormValues(newTemplateInputs)
    }
  }, [templateInputSetLoading])

  React.useEffect(() => {
    subscribeForm({ tab: TemplateTabs.OVERVIEW, form: formikRef })
    return () => unSubscribeForm({ tab: TemplateTabs.OVERVIEW, form: formikRef })
  }, [subscribeForm, unSubscribeForm, formikRef])

  useGlobalEventListener('SAVE_PIPELINE_CLICKED', _event => {
    submitFormsForTab(TemplateTabs.OVERVIEW)
  })

  const validateForm = (values: StageElementConfig) => {
    if (
      isEqual(values.template?.templateRef, stage?.stage?.template?.templateRef) &&
      isEqual(values.template?.versionLabel, stage?.stage?.template?.versionLabel)
    ) {
      onChange?.(values)
      const errorsResponse = validateStage({
        stage: values.template?.templateInputs as StageElementConfig,
        template: templateInputs,
        originalStage: stage?.stage?.template?.templateInputs as StageElementConfig,
        getString,
        viewType: StepViewType.DeploymentForm
      })
      return set({}, TEMPLATE_INPUT_PATH, errorsResponse)
    } else {
      return {}
    }
  }

  const refetch = () => {
    refetchTemplate()
    refetchTemplateInputSet()
  }

  const { addOrUpdateTemplate, removeTemplate } = useStageTemplateActions()

  const formRefDom = React.useRef<HTMLElement | undefined>()

  const isLoading = templateLoading || templateInputSetLoading || loadingMergedTemplateInputs

  const error = defaultTo(templateInputSetError, templateError)

  /**
   * This effect disables/enables Save button on Pipeline and Template Studio
   * For gitx, template resolution takes a long time
   * If user clicks on Save button before resolution, template exception occurs
   */
  React.useEffect(() => {
    setIntermittentLoading(isLoading)

    // cleanup
    return () => {
      setIntermittentLoading(false)
    }
  }, [isLoading, setIntermittentLoading])

  return (
    <Container className={css.serviceOverrides} height={'100%'} background={Color.FORM_BG}>
      <ErrorsStripBinded domRef={formRefDom} />
      <Layout.Vertical
        spacing={'xlarge'}
        className={css.contentSection}
        ref={ref => {
          formRefDom.current = ref as HTMLElement
        }}
      >
        {stage?.stage?.template && (
          <TemplateBar
            templateLinkConfig={stage?.stage.template}
            onRemoveTemplate={removeTemplate}
            onOpenTemplateSelector={addOrUpdateTemplate}
            className={css.templateBar}
            isReadonly={isReadonly}
            storeMetadata={storeMetadata}
          />
        )}
        <Formik<StageElementConfig>
          initialValues={formValues as StageElementConfig}
          formName="templateStageOverview"
          onSubmit={noop}
          validate={validateForm}
          validationSchema={Yup.object().shape({
            name: NameSchema({
              requiredErrorMsg: getString('pipelineSteps.build.create.stageNameRequiredError')
            }),
            identifier: IdentifierSchema()
          })}
          enableReinitialize={true}
        >
          {(formik: FormikProps<StageElementConfig>) => {
            window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: TemplateTabs.OVERVIEW }))
            formikRef.current = formik as FormikProps<unknown> | null
            return (
              <FormikForm>
                <Card className={css.sectionCard}>
                  <NameId
                    identifierProps={{
                      inputLabel: getString('stageNameLabel'),
                      isIdentifierEditable: false,
                      inputGroupProps: { disabled: isReadonly }
                    }}
                    inputGroupProps={{ placeholder: getString('common.namePlaceholder') }}
                  />
                </Card>
                <Container className={css.inputsContainer}>
                  {isLoading && <PageSpinner />}
                  {!isLoading && error && (
                    <Container height={isEmpty((error?.data as Error)?.responseMessages) ? 300 : 600}>
                      <PageError message={getTemplateErrorMessage(error, css.errorHandler)} onClick={() => refetch()} />
                    </Container>
                  )}
                  {!isLoading && !error && templateInputs && allValues && (
                    <Layout.Vertical
                      margin={{ top: 'medium' }}
                      padding={{ top: 'large', bottom: 'large' }}
                      spacing={'large'}
                    >
                      <Heading level={5} color={Color.BLACK}>
                        {getString('pipeline.templateInputs')}
                      </Heading>
                      <StageForm
                        template={{ stage: templateInputs }}
                        allValues={{ stage: allValues }}
                        path={TEMPLATE_INPUT_PATH}
                        readonly={isReadonly}
                        viewType={StepViewType.TemplateUsage}
                        hideTitle={true}
                        stageClassName={css.stageCard}
                        allowableTypes={allowableTypes}
                      />
                    </Layout.Vertical>
                  )}
                </Container>
              </FormikForm>
            )
          }}
        </Formik>
      </Layout.Vertical>
    </Container>
  )
}
