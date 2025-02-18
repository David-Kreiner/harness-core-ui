/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, { useState } from 'react'
import { Classes, FormGroup, IFormGroupProps, Intent } from '@blueprintjs/core'
import { useFormikContext } from 'formik'
import { Color } from '@harness/design-system'
import {
  ButtonVariation,
  Container,
  DataTooltipInterface,
  errorCheck,
  FormError,
  FormikTooltipContext,
  HarnessDocTooltip,
  Layout,
  MultiTypeInputType,
  SelectOption,
  Tag,
  Text
} from '@harness/uicore'
import { defaultTo, get, isArray } from 'lodash-es'
import { useParams } from 'react-router-dom'
import type { EnvironmentResponseDTO, ResponsePageServiceResponse } from 'services/cd-ng'
import RbacButton from '@rbac/components/Button/Button'
import { Scope } from '@common/interfaces/SecretsInterface'
import { getScopeFromValue } from '@common/components/EntityReference/EntityReference'
import {
  Item,
  MultiTypeReferenceInput,
  MultiTypeReferenceInputProps,
  ReferenceSelectProps
} from '@common/components/ReferenceSelect/ReferenceSelect'
import { useStrings } from 'framework/strings'
import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import { getReferenceFieldProps } from './Utils'
import css from './FormMultiTypeEnvironmentField.module.scss'

export interface EnvironmentReferenceFieldProps extends Omit<IFormGroupProps, 'label'> {
  name: string
  label: string | React.ReactElement
  placeholder: string
  tooltipProps?: DataTooltipInterface
  style?: React.CSSProperties
  openAddNewModal?: () => void
  disabled?: boolean
  createNewLabel?: string
  isDrawerMode?: boolean
  multitypeInputValue?: MultiTypeInputType
  multiTypeProps?: Omit<MultiTypeReferenceInputProps<EnvironmentResponseDTO>, 'name' | 'referenceSelectProps'>
  setRefValue?: boolean
  onChange?: (service: any) => void
  selected?: string
  defaultScope?: Scope
  width?: number
  error?: string
  isMultiSelect?: boolean
  onMultiSelectChange?: any
  isNewConnectorLabelVisible?: boolean
}

export function getSelectedRenderer(selected: any): JSX.Element {
  return (
    <Layout.Horizontal spacing="small" flex={{ distribution: 'space-between' }} className={css.selectWrapper}>
      <Text tooltip={defaultTo(selected?.name, selected)} color={Color.GREY_800} className={css.label}>
        {defaultTo(selected?.label, selected)}
      </Text>
      <Tag minimal id={css.tag}>
        {getScopeFromValue(selected?.value || selected)}
      </Tag>
    </Layout.Horizontal>
  )
}

function generateInitialValues(selected: SelectOption[] | string): (string | Item)[] | string {
  if (isArray(selected)) {
    return selected
      .filter(env => env.label !== 'All')
      .map((svc: SelectOption) => ({
        label: svc.value as string,
        value: svc.value as string,
        scope: getScopeFromValue(svc.value as string)
      }))
  }
  return selected
}

export function MultiTypeEnvironmentField(props: EnvironmentReferenceFieldProps): React.ReactElement {
  const {
    name,
    style,
    createNewLabel,
    multitypeInputValue,
    multiTypeProps = {},
    setRefValue = false,
    onChange,
    defaultScope,
    isMultiSelect,
    onMultiSelectChange,
    openAddNewModal,
    isNewConnectorLabelVisible,
    placeholder,
    disabled,
    width,
    ...restProps
  } = props
  const formik = useFormikContext()
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const [page, setPage] = useState(0)
  const [pagedEnvironmentData, setPagedEnvironmentData] = useState<ResponsePageServiceResponse>({})
  const [hideModal, setHideModal] = useState(false)
  const selected = generateInitialValues(get(formik?.values, name, isMultiSelect ? [] : ''))
  const [selectedValue, setSelectedValue] = React.useState<any>(selected)
  const hasError = errorCheck(name, formik)
  const {
    intent = hasError ? Intent.DANGER : Intent.NONE,
    helperText = hasError ? <FormError name={name} errorMessage={get(formik?.errors, name)} /> : null,
    label,
    ...rest
  } = restProps
  const tooltipContext = React.useContext(FormikTooltipContext)
  const dataTooltipId =
    props.tooltipProps?.dataTooltipId || (tooltipContext?.formName ? `${tooltipContext?.formName}_${name}` : '')
  const getReferenceFieldPropsValues = getReferenceFieldProps({
    defaultScope,
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    name,
    width,
    selected,
    placeholder,
    isMultiSelect,
    setPagedEnvironmentData,
    selectedEnvironments: Array.isArray(selected) ? selected : [],
    getString
  })
  const handleMultiSelectChange = (envs: any): void => {
    const environments = envs.map((env: any) => ({
      label: env.identifier,
      value: env.scope !== Scope.PROJECT ? `${env.scope}.${env.identifier}` : env.identifier
    }))
    formik.setFieldValue(name, environments)
    onMultiSelectChange(environments)
  }
  return (
    <div style={style}>
      <Container data-testid="environmentTooltip">
        <HarnessDocTooltip tooltipId={dataTooltipId} labelText={label} className={Classes.LABEL} />
      </Container>
      <FormGroup {...rest} labelFor={name} helperText={helperText} intent={intent}>
        <MultiTypeReferenceInput<EnvironmentResponseDTO>
          name={name}
          disabled={disabled}
          referenceSelectProps={
            {
              ...getReferenceFieldPropsValues,
              isNewConnectorLabelVisible: isNewConnectorLabelVisible,
              placeholderClass: css.placeholderClass,
              createNewLabel: createNewLabel || 'Environment',
              disabled: disabled,
              disableCollapse: true,
              selectedRenderer: getSelectedRenderer(selected),
              hideModal: hideModal,
              onMultiSelectChange: handleMultiSelectChange,
              isMultiSelect: isMultiSelect,
              pagination: {
                itemCount: pagedEnvironmentData?.data?.totalItems || 0,
                pageSize: pagedEnvironmentData?.data?.pageSize || 10,
                pageCount: pagedEnvironmentData?.data?.totalPages || -1,
                pageIndex: page || 0,
                gotoPage: pageIndex => setPage(pageIndex)
              },
              createNewBtnComponent: isNewConnectorLabelVisible ? (
                <RbacButton
                  variation={ButtonVariation.SECONDARY}
                  onClick={() => {
                    openAddNewModal?.()
                    setHideModal(true)
                  }}
                  text={`+ ${createNewLabel || 'Environment'}`}
                  margin={{ right: 'small' }}
                  // TODO add permissions here depending on the tab from which it is clicked
                ></RbacButton>
              ) : null
            } as ReferenceSelectProps<EnvironmentResponseDTO>
          }
          onChange={(val, _valueType, type1) => {
            if (val && type1 === MultiTypeInputType.FIXED) {
              const { record, scope } = val as unknown as { record: EnvironmentResponseDTO; scope: Scope }
              const value = {
                label: record.name,
                value:
                  scope === Scope.ORG || scope === Scope.ACCOUNT ? `${scope}.${record.identifier}` : record.identifier,
                scope
              }
              if (setRefValue) {
                formik?.setFieldValue(name, value.value)
                onChange?.(value.value)
              } else {
                formik?.setFieldValue(name, value)
                onChange?.(value)
              }
              setSelectedValue(value)
            } else {
              formik?.setFieldValue(name, defaultTo(val, ''))
              setSelectedValue(defaultTo(val, ''))
              onChange?.(val)
            }
          }}
          value={Array.isArray(selectedValue) ? '' : selectedValue}
          multitypeInputValue={multitypeInputValue}
          {...multiTypeProps}
        />
      </FormGroup>
    </div>
  )
}
