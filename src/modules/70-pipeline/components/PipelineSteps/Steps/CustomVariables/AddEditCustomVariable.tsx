/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import { Button, Formik, FormikForm, FormInput, ButtonVariation, Dialog } from '@wings-software/uicore'

import { useStrings } from 'framework/strings'
import type { AllNGVariables } from '@pipeline/utils/types'

import { getVaribaleTypeOptions, VariableType } from './CustomVariableUtils'

const MAX_LENGTH = 64

export interface VariableState {
  variable: AllNGVariables
  index: number
}

export interface AddEditCustomVariableProps {
  selectedVariable: VariableState | null
  setSelectedVariable(variable: VariableState | null): void
  addNewVariable(variable: AllNGVariables): void
  updateVariable(index: number, variable: AllNGVariables): void
  existingVariables?: AllNGVariables[]
  formName?: string
  allowedVarialblesTypes?: VariableType[]
  isDescriptionEnabled?: boolean
}

export default function AddEditCustomVariable(props: AddEditCustomVariableProps): React.ReactElement {
  const {
    selectedVariable,
    setSelectedVariable,
    addNewVariable,
    updateVariable,
    existingVariables,
    formName,
    allowedVarialblesTypes,
    isDescriptionEnabled
  } = props
  const { getString } = useStrings()

  const existingNames: string[] = Array.isArray(existingVariables) ? existingVariables.map(v => v?.name || '') : []
  const isEdit = selectedVariable && typeof selectedVariable.index === 'number' && selectedVariable.index > -1

  // remove current variable name in case of edit
  if (isEdit) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    existingNames.splice(selectedVariable!.index, 1)
  }

  function closeModal(): void {
    setSelectedVariable(null)
  }

  const actualFormName = formName || 'addEditCustomVariableForm'

  return (
    <Dialog
      className={'padded-dialog'}
      isOpen={!!selectedVariable}
      enforceFocus={false}
      title={isEdit ? getString('common.editVariable') : getString('common.addVariable')}
      onClose={closeModal}
    >
      <Formik
        formName={actualFormName}
        initialValues={selectedVariable?.variable}
        enableReinitialize
        validationSchema={Yup.object().shape({
          name: Yup.string()
            .trim()
            .required(getString('common.validation.nameIsRequired'))
            .max(
              MAX_LENGTH,
              getString('common.validation.fieldCannotbeLongerThanN', { name: getString('name'), n: MAX_LENGTH })
            )
            .matches(
              /^[a-zA-Z_][0-9a-zA-Z_$]*$/,
              getString('common.validation.fieldMustBeAlphanumeric', { name: getString('name') })
            )
            .notOneOf(existingNames, getString('common.validation.variableAlreadyExists'))
        })}
        onSubmit={data => {
          if (data && selectedVariable) {
            if (selectedVariable.index === -1) {
              addNewVariable(data)
            } else {
              updateVariable(selectedVariable.index, data)
            }
            closeModal()
          }
        }}
      >
        {({ submitForm }) => (
          <FormikForm data-testid="add-edit-variable">
            <FormInput.Text
              name="name"
              label={getString('variableNameLabel')}
              placeholder={getString('pipeline.variable.variableNamePlaceholder')}
            />
            {isDescriptionEnabled && (
              <FormInput.TextArea name="description" isOptional={true} label={getString('description')} />
            )}
            <FormInput.Select
              name="type"
              items={getVaribaleTypeOptions(allowedVarialblesTypes, getString)}
              label={getString('typeLabel')}
              placeholder={getString('pipeline.variable.typePlaceholder')}
              selectProps={{
                usePortal: true
              }}
            />
            <div className="buttons-container">
              <Button
                variation={ButtonVariation.PRIMARY}
                text={getString('save')}
                onClick={submitForm}
                data-testid="addVariableSave"
              />
              &nbsp; &nbsp;
              <Button
                variation={ButtonVariation.TERTIARY}
                text={getString('cancel')}
                onClick={() => closeModal()}
                data-testid="addVariableCancel"
              />
            </div>
          </FormikForm>
        )}
      </Formik>
    </Dialog>
  )
}
