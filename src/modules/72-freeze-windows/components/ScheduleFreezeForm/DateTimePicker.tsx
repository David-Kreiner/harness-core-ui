/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement } from 'react'
import { connect, FormikContextType } from 'formik'
import { get, isEmpty } from 'lodash-es'
import { FormGroup, IFormGroupProps, Intent } from '@blueprintjs/core'
import { DataTooltipInterface, DateInput, errorCheck, FormError, getFormFieldLabel } from '@harness/uicore'
import type { DateInputProps } from '@harness/uicore/dist/components/DateInput/DateInput'
import moment from 'moment'

export const DATE_PARSE_FORMAT = 'YYYY-MM-DD hh:mm A'
export interface FormikExtended<T> extends FormikContextType<T> {
  disabled?: boolean
  formName: string
}

export interface FormikContextProps<T> {
  formik?: FormikExtended<T>
  tooltipProps?: DataTooltipInterface
}

interface FormikDateTimePickerProps extends IFormGroupProps {
  onChange?: (value?: string) => void
  name: string
  placeholder?: string
  disabled?: boolean
  dateInputProps?: DateInputProps
  defaultToCurrentTime?: boolean
}

function _DateTimePicker(props: FormikDateTimePickerProps & FormikContextProps<any>): ReactElement {
  const { formik, name, ...restProps } = props
  const hasError = errorCheck(name, formik)
  const {
    intent = hasError ? Intent.DANGER : Intent.NONE,
    helperText = hasError ? <FormError name={name} errorMessage={get(formik?.errors, name)} /> : null,
    disabled = formik?.disabled,
    label,
    tooltipProps,
    placeholder,
    onChange,
    dateInputProps,
    defaultToCurrentTime,
    ...rest
  } = restProps

  const formValue = get(formik?.values, name)

  return (
    <FormGroup
      label={getFormFieldLabel(label, name, { tooltipProps })}
      labelFor={name}
      helperText={helperText}
      intent={intent}
      disabled={disabled}
      {...rest}
    >
      <DateInput
        value={formValue ? moment(formValue).valueOf().toString() : ''}
        onChange={value => {
          formik?.setFieldValue(
            name,
            value && !isEmpty(value) ? moment(parseInt(value)).format(DATE_PARSE_FORMAT) : null
          )
          onChange?.(value)
        }}
        name={name}
        contentEditable={false}
        timePrecision="minute"
        dateProps={{
          timePickerProps: { useAmPm: true },
          highlightCurrentDay: true,
          maxDate: moment().add(5, 'year').toDate()
        }}
        popoverProps={{
          disabled,
          usePortal: true
        }}
        dateTimeFormat="LLLL"
        autoComplete="off"
        disabled={disabled}
        {...dateInputProps}
        readOnly
      />
    </FormGroup>
  )
}

export const DateTimePicker = connect(_DateTimePicker)
