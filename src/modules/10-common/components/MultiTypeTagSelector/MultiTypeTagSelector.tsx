/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo, useEffect } from 'react'
import {
  Layout,
  FormInput,
  ExpressionInput,
  Button,
  ButtonSize,
  ButtonVariation,
  Select,
  Text,
  AllowedTypes,
  SelectOption,
  DataTooltipInterface,
  EXPRESSION_INPUT_PLACEHOLDER
} from '@wings-software/uicore'
import { useFormikContext } from 'formik'
import { get, isEmpty, set } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { MultiTypeFieldSelector } from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import css from './MultiTypeTagSelector.module.scss'

interface SelectedTagsType {
  key: string
  value: string
}

interface MultiTypeTagSelectorProps {
  allowableTypes: AllowedTypes
  tags: SelectOption[]
  isLoadingTags?: boolean
  name: string
  errorMessage?: string
  className?: string
  tooltipProps?: DataTooltipInterface
  expressions: string[]
  initialTags?: object | string
}

const preventEnter = (e: React.KeyboardEvent) => {
  /* istanbul ignore next */
  if (e.key === 'Enter') {
    e.preventDefault()
    e.stopPropagation()
  }
}

const MultiTypeTagSelector = ({
  allowableTypes,
  tags,
  isLoadingTags = false,
  name,
  errorMessage,
  className,
  tooltipProps,
  expressions,
  initialTags
}: MultiTypeTagSelectorProps) => {
  const formik = useFormikContext()
  const { getString } = useStrings()
  const [selectedTags, setSelectedTags] = useState([] as SelectedTagsType[])
  const [lastInitialTags, setLastInitialTags] = useState(initialTags)

  useEffect(() => {
    if (typeof initialTags === 'object') {
      const initialTagOptions = Object.entries(initialTags || {}).map(
        entry => ({ key: entry[0], value: entry[1] } as SelectedTagsType)
      )
      initialTagOptions.forEach(tagOption => {
        formik.setFieldValue(`${name}.${tagOption.key}`, tagOption.value)
      })
      setSelectedTags(initialTagOptions)
    }
  }, [])

  useEffect(() => {
    const formikTags = get(formik.values, name, {})
    if (
      ((typeof lastInitialTags === 'object' && Object.keys(lastInitialTags).length > 0) || !lastInitialTags) &&
      selectedTags.length > 0 &&
      typeof formikTags === 'object' &&
      Object.keys(formikTags).length === 0
    ) {
      setSelectedTags([])
    }
    setLastInitialTags(formikTags)
  }, [get(formik.values, name, null)])

  const usedTagKeys = useMemo(
    () =>
      selectedTags.reduce((map, tag) => {
        tag.key && set(map, tag.key, true)
        return map
      }, {}),
    [selectedTags]
  )

  const availableTags = useMemo(
    /* istanbul ignore next */
    () => tags.filter(tag => !get(usedTagKeys, get(tag, 'value', ''), false)),
    [tags, usedTagKeys]
  )

  const isFixedValueSetted = typeof get(formik.values, name) === 'object'

  useEffect(() => {
    const tagsObject = {}
    selectedTags.forEach(tag => set(tagsObject, tag.key, tag.value))
    !isEmpty(tagsObject) ? formik.setFieldValue(name, tagsObject) : null
  }, [selectedTags])

  return (
    <MultiTypeFieldSelector
      className={className}
      name={name}
      label={getString('tagLabel')}
      skipRenderValueInExpressionLabel
      allowedTypes={allowableTypes}
      supportListOfExpressions={true}
      formik={formik}
      style={{ flexGrow: 1, marginBottom: 0 }}
      tooltipProps={tooltipProps}
      expressionRender={
        /* istanbul ignore next */ () => (
          <ExpressionInput
            name={name}
            value={isFixedValueSetted ? '' : get(formik.values, name)}
            onChange={express => formik.setFieldValue(name, express)}
            inputProps={{ placeholder: EXPRESSION_INPUT_PLACEHOLDER }}
            items={expressions}
          />
        )
      }
    >
      {selectedTags.map((tag, index) => (
        <Layout.Horizontal spacing="small" key={index} onKeyDown={preventEnter}>
          <Layout.Vertical spacing="small">
            <Text className={css.textStyles}>{index === 0 ? getString('keyLabel') : null}</Text>
            <Select
              name={`tagslabel${index + 1}`}
              value={{ label: tag.key, value: tag.key }}
              items={availableTags}
              inputProps={{
                placeholder: availableTags.length === 0 ? getString('common.noAvailableTags') : ''
              }}
              className={css.tagsSelect}
              allowCreatingNewItems={true}
              noResults={<Text padding={'small'}>{isLoadingTags ? getString('loading') : errorMessage}</Text>}
              onChange={
                /* istanbul ignore next */ option => {
                  const newSelTags = [...selectedTags]
                  newSelTags[index].key = option.value as string
                  newSelTags[index].value = ''
                  setSelectedTags(newSelTags)
                }
              }
            />
          </Layout.Vertical>
          <Layout.Vertical spacing="small">
            <Text className={css.textStyles}>{index === 0 ? 'Value' : null}</Text>
            <FormInput.Text
              name={`${name}.${tag.key}`}
              onChange={
                /* istanbul ignore next */ event => {
                  const newSelTags = [...selectedTags]
                  newSelTags[index].value = get(event.target, 'value', '')
                  setSelectedTags(newSelTags)
                }
              }
            />
          </Layout.Vertical>
          <Layout.Horizontal className={css.removeTagBtn}>
            <Button
              icon="trash"
              iconProps={{ size: 12, margin: { right: 8 } }}
              onClick={() => {
                const newSelTags = [...selectedTags]
                newSelTags.splice(index, 1)
                setSelectedTags(newSelTags)
                formik.setFieldValue(`${name}.${tag.key}`, undefined)
              }}
              size={ButtonSize.SMALL}
              variation={ButtonVariation.LINK}
            />
          </Layout.Horizontal>
        </Layout.Horizontal>
      ))}
      <Button
        intent="primary"
        icon="add"
        iconProps={{ size: 12, margin: { right: 8 } }}
        className={css.addBtn}
        onClick={() => {
          const newTagPair: SelectedTagsType = { key: '', value: '' }
          setSelectedTags(selTags => [...selTags, newTagPair])
        }}
        size={ButtonSize.SMALL}
        variation={ButtonVariation.LINK}
      >
        {getString('tagLabel')}
      </Button>
    </MultiTypeFieldSelector>
  )
}

export default MultiTypeTagSelector
