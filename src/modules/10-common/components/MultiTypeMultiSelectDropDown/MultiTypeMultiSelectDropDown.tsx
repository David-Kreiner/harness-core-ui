/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { FormGroup, Intent } from '@blueprintjs/core'
import { useFormikContext } from 'formik'
import {
  errorCheck,
  ExpressionAndRuntimeType,
  ExpressionAndRuntimeTypeProps,
  FormError,
  getMultiTypeFromValue,
  MultiSelectDropDown,
  MultiTypeInputType,
  MultiSelectDropDownProps,
  getFormFieldLabel,
  SelectOption,
  MultiSelectOption,
  MultiTypeInputValue,
  Layout,
  Container
} from '@harness/uicore'
import { get, isEqual } from 'lodash-es'
import cx from 'classnames'

import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useStrings } from 'framework/strings'

import {
  FormMultiTypeMultiSelectDropDownProps,
  getLocalValueFromSelectedOptions,
  MultiSelectDropDownFixedProps,
  SELECT_ALL_OPTION
} from './MultiTypeMultiSelectDropDownUtils'

import css from './MultiTypeMultiSelectDropDown.module.scss'

export function MultiSelectDropDownFixed(props: MultiSelectDropDownFixedProps): React.ReactElement {
  const { onChange, value, disabled, items, isAllSelectionSupported, selectAllOptionIfAllItemsAreSelected, ...rest } =
    props
  const [localValue, setLocalValue] = useState<MultiSelectOption[]>([])

  useEffect(() => {
    if (Array.isArray(value)) {
      setLocalValue(value)
    }
  }, [value])

  function handleChangeNoop(opts: MultiSelectOption[]): void {
    setLocalValue(getLocalValueFromSelectedOptions(opts, items.length, selectAllOptionIfAllItemsAreSelected))
  }

  function handleChange(opts: MultiSelectOption[]): void {
    // only call the onChange function if the selected options have changed
    if (!isEqual(opts, value)) {
      onChange?.(opts as SelectOption[], MultiTypeInputValue.MULTI_SELECT_OPTION, MultiTypeInputType.FIXED)
    }
    rest.onPopoverClose?.(opts)
  }

  const multiSelectDropDownItems = useMemo(() => {
    return [...(isAllSelectionSupported ? [SELECT_ALL_OPTION] : []), ...(items as MultiSelectOption[])]
  }, [items, isAllSelectionSupported])

  return (
    <MultiSelectDropDown
      {...rest}
      hideItemCount={localValue.at(0)?.value === SELECT_ALL_OPTION.value}
      value={localValue}
      items={multiSelectDropDownItems}
      disabled={disabled}
      onChange={handleChangeNoop}
      onPopoverClose={handleChange}
    />
  )
}

export function FormMultiTypeMultiSelectDropDown(props: FormMultiTypeMultiSelectDropDownProps): React.ReactElement {
  const {
    label,
    dropdownProps,
    multiTypeProps,
    name,
    className = '',
    tooltipProps,
    enableConfigureOptions,
    configureOptionsProps,
    onChange,
    ...restProps
  } = props
  const { getString } = useStrings()
  const formik = useFormikContext()
  const hasError = errorCheck(name, formik)
  const value = get(formik.values, name)
  const [type, setType] = React.useState(getMultiTypeFromValue(value))

  useEffect(() => {
    setType(getMultiTypeFromValue(value))
  }, [value])

  const {
    intent = hasError ? Intent.DANGER : Intent.NONE,
    helperText = hasError ? <FormError name={name} errorMessage={get(formik?.errors, name)} /> : null,
    disabled,
    ...rest
  } = restProps

  const handleChange: ExpressionAndRuntimeTypeProps['onChange'] = (val, _mutliType, valueType) => {
    formik.setFieldValue(name, valueType === MultiTypeInputType.EXPRESSION ? '' : val)
    onChange?.(val as SelectOption[])
  }

  function handleConfigChange(cvalue: string): void {
    formik.setFieldValue(name, cvalue)
  }

  return (
    <FormGroup
      {...rest}
      label={getFormFieldLabel(label, name, { tooltipProps })}
      labelFor={name}
      className={cx(css.main, className)}
      helperText={helperText}
      intent={intent}
      disabled={disabled}
    >
      <Layout.Horizontal spacing={'medium'} flex={{ alignItems: 'flex-start' }}>
        <Container>
          <ExpressionAndRuntimeType<MultiSelectDropDownProps>
            {...multiTypeProps}
            name={name}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            multitypeInputValue={type}
            className={cx(css.multitype, multiTypeProps?.className, { [css.hasError]: hasError })}
            fixedTypeComponent={MultiSelectDropDownFixed}
            fixedTypeComponentProps={{
              usePortal: true,
              ...dropdownProps,
              value,
              className: cx(css.dropdown, dropdownProps.className)
            }}
          />
        </Container>
        {enableConfigureOptions && getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME ? (
          <ConfigureOptions
            value={value}
            variableName={name}
            type={getString('service')}
            onChange={handleConfigChange}
            {...configureOptionsProps}
          />
        ) : null}
      </Layout.Horizontal>
    </FormGroup>
  )
}
