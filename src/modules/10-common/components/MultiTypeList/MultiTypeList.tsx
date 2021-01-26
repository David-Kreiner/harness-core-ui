import React from 'react'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import cx from 'classnames'
import { FormInput, Card, Button, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import { FieldArray, connect, FormikContext } from 'formik'
import { get } from 'lodash-es'
import { ConfigureOptions, ConfigureOptionsProps } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useStrings } from 'framework/exports'
import MultiTypeFieldSelector, {
  MultiTypeFieldSelectorProps
} from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import css from './MultiTypeList.module.scss'

export type ListValue = { id: string; value: string }[]
export type MultiTypeListType = ListValue | string

interface MultiTypeListConfigureOptionsProps
  extends Omit<ConfigureOptionsProps, 'value' | 'type' | 'variableName' | 'onChange'> {
  variableName?: ConfigureOptionsProps['variableName']
}

export interface MultiTypeListProps {
  name: string
  placeholder?: string
  multiTypeFieldSelectorProps: Omit<MultiTypeFieldSelectorProps, 'name' | 'defaultValueToReset' | 'children'>
  enableConfigureOptions?: boolean
  configureOptionsProps?: MultiTypeListConfigureOptionsProps
  formik?: FormikContext<any>
  style?: React.CSSProperties
}

export const MultiTypeList = (props: MultiTypeListProps): React.ReactElement => {
  const {
    name,
    placeholder,
    multiTypeFieldSelectorProps,
    enableConfigureOptions = true,
    configureOptionsProps,
    formik,
    ...restProps
  } = props
  const value = get(formik?.values, name, '') as MultiTypeListType

  const { getString } = useStrings()

  return (
    <div className={cx(css.group, css.withoutSpacing)} {...restProps}>
      <MultiTypeFieldSelector
        name={name}
        defaultValueToReset={[{ id: uuid('', nameSpace()), value: '' }]}
        style={{ flexGrow: 1, marginBottom: 0 }}
        {...multiTypeFieldSelectorProps}
      >
        <FieldArray
          name={name}
          render={({ push, remove }) => (
            <Card style={{ width: '100%' }}>
              {Array.isArray(value) &&
                value.map(({ id }, index: number) => (
                  <div className={cx(css.group, css.withoutAligning)} key={id}>
                    <FormInput.MultiTextInput
                      label=""
                      name={`${name}[${index}].value`}
                      placeholder={placeholder}
                      multiTextInputProps={{
                        allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
                      }}
                      style={{ flexGrow: 1 }}
                    />
                    <Button
                      icon="main-trash"
                      iconProps={{ size: 20 }}
                      minimal
                      onClick={() => remove(index)}
                      data-testid={`remove-${name}-[${index}]`}
                      style={{ marginTop: 4 }}
                    />
                  </div>
                ))}
              <Button
                intent="primary"
                minimal
                text={getString('plusAdd')}
                data-testid={`add-${name}`}
                onClick={() => push({ id: uuid('', nameSpace()), value: '' })}
              />
            </Card>
          )}
        />
      </MultiTypeFieldSelector>
      {enableConfigureOptions &&
        typeof value === 'string' &&
        getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            value={value}
            type={getString('list')}
            variableName={name}
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={val => formik?.setFieldValue(name, val)}
            {...configureOptionsProps}
          />
        )}
    </div>
  )
}

export default connect(MultiTypeList)
