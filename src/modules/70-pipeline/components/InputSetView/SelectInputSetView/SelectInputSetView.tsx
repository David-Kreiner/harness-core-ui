/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, get } from 'lodash-es'
import { connect } from 'formik'
import {
  DataTooltipInterface,
  MultiTypeInputType,
  Container,
  FormInput,
  getMultiTypeFromValue,
  Layout
} from '@harness/uicore'
import type { FormMultiTypeInputProps } from '@harness/uicore/dist/components/FormikForm/FormikForm'
import type { FormikContextProps, FormikExtended } from '@harness/uicore/dist/components/FormikForm/utils'

import type { ConfigureOptionsProps } from '@common/components/ConfigureOptions/ConfigureOptions'
import { SelectConfigureOptions } from '@common/components/ConfigureOptions/SelectConfigureOptions/SelectConfigureOptions'
import { shouldRenderRunTimeInputViewWithAllowedValues } from '@pipeline/utils/CIUtils'
import { useRenderMultiTypeInputWithAllowedValues } from '../utils/utils'

interface SelectInputSetViewProps extends FormMultiTypeInputProps, FormikContextProps<any> {
  formik?: FormikExtended<any>
  fieldPath: string
  template: any
  tooltipProps?: DataTooltipInterface
  enableConfigureOptions?: boolean
  configureOptionsProps?: Omit<ConfigureOptionsProps, 'value' | 'type' | 'variableName' | 'onChange'>
}

export function SelectInputSet(props: SelectInputSetViewProps): JSX.Element {
  const {
    formik,
    fieldPath,
    template,
    enableConfigureOptions = true,
    configureOptionsProps,
    className,
    ...rest
  } = props
  const { name, label, placeholder, tooltipProps, multiTypeInputProps, disabled, selectItems } = rest
  const value = get(formik?.values, name, '')

  const { getMultiTypeInputWithAllowedValues } = useRenderMultiTypeInputWithAllowedValues({
    name,
    labelKey: label,
    placeholderKey: placeholder,
    fieldPath: fieldPath,
    allowedTypes: defaultTo(multiTypeInputProps?.allowableTypes, [MultiTypeInputType.FIXED]),
    template,
    readonly: disabled,
    tooltipProps,
    className
  })

  const inputField = shouldRenderRunTimeInputViewWithAllowedValues(fieldPath, template) ? (
    getMultiTypeInputWithAllowedValues()
  ) : (
    <FormInput.MultiTypeInput style={{ flexGrow: 1 }} {...rest} />
  )

  return (
    <Container className={className}>
      <Layout.Horizontal>
        {inputField}
        {enableConfigureOptions && getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME && (
          <SelectConfigureOptions
            options={selectItems}
            value={value}
            type={'String'}
            variableName={name}
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={val => formik?.setFieldValue(name, val)}
            style={label ? { marginTop: 'var(--spacing-6)' } : undefined}
            {...configureOptionsProps}
            isReadonly={disabled}
          />
        )}
      </Layout.Horizontal>
    </Container>
  )
}

export const SelectInputSetView = connect(SelectInputSet)
