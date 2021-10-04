import React from 'react'
import { Accordion, Formik, MultiTypeInputType } from '@wings-software/uicore'
import * as Yup from 'yup'
import type { FormikProps } from 'formik'

import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { setFormikRef, StepFormikFowardRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useStrings } from 'framework/strings'

import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import type { ShellScriptFormData } from './shellScriptTypes'
import BaseShellScript from './BaseShellScript'
import OptionalConfiguration from './OptionalConfiguration'

import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

/**
 * Spec
 * https://harness.atlassian.net/wiki/spaces/CDNG/pages/1203634286/Shell+Script
 */

interface ShellScriptWidgetProps {
  initialValues: ShellScriptFormData
  onUpdate?: (data: ShellScriptFormData) => void
  onChange?: (data: ShellScriptFormData) => void
  allowableTypes: MultiTypeInputType[]
  readonly?: boolean
  stepViewType?: StepViewType
  isNewStep?: boolean
}

export function ShellScriptWidget(
  {
    initialValues,
    onUpdate,
    onChange,
    allowableTypes,
    isNewStep = true,
    readonly,
    stepViewType
  }: ShellScriptWidgetProps,
  formikRef: StepFormikFowardRef
): JSX.Element {
  const { getString } = useStrings()

  const defaultSSHSchema = Yup.object().shape({
    timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum')),
    spec: Yup.object().shape({
      shell: Yup.string().trim().required(getString('validation.scriptTypeRequired')),
      source: Yup.object().shape({
        spec: Yup.object().shape({
          script: Yup.string().trim().required(getString('cd.scriptRequired'))
        })
      }),
      environmentVariables: Yup.array().of(
        Yup.object({
          name: Yup.string().required(getString('common.validation.nameIsRequired')),
          value: Yup.string().required(getString('common.validation.valueIsRequired')),
          type: Yup.string().trim().required(getString('common.validation.typeIsRequired'))
        })
      ),
      outputVariables: Yup.array().of(
        Yup.object({
          name: Yup.string().required(getString('common.validation.nameIsRequired')),
          value: Yup.string().required(getString('common.validation.valueIsRequired')),
          type: Yup.string().trim().required(getString('common.validation.typeIsRequired'))
        })
      )
    }),
    ...getNameAndIdentifierSchema(getString, stepViewType)
  })

  const values: any = {
    ...initialValues,
    spec: {
      ...initialValues.spec,
      executionTarget: {
        ...initialValues.spec.executionTarget,
        connectorRef: undefined
      }
    }
  }

  const validationSchema = defaultSSHSchema

  return (
    <Formik<ShellScriptFormData>
      onSubmit={submit => {
        onUpdate?.(submit)
      }}
      validate={formValues => {
        onChange?.(formValues)
      }}
      formName="shellScriptForm"
      initialValues={values}
      validationSchema={validationSchema}
    >
      {(formik: FormikProps<ShellScriptFormData>) => {
        // this is required
        setFormikRef(formikRef, formik)

        return (
          <React.Fragment>
            <BaseShellScript
              isNewStep={isNewStep}
              stepViewType={stepViewType}
              formik={formik}
              readonly={readonly}
              allowableTypes={allowableTypes}
            />
            <Accordion className={stepCss.accordion}>
              <Accordion.Panel
                id="optional-config"
                summary={getString('common.optionalConfig')}
                details={<OptionalConfiguration formik={formik} readonly={readonly} allowableTypes={allowableTypes} />}
              />
            </Accordion>
          </React.Fragment>
        )
      }}
    </Formik>
  )
}

export const ShellScriptWidgetWithRef = React.forwardRef(ShellScriptWidget)
