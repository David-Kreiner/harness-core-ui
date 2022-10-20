/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  act,
  findByText,
  fireEvent,
  queryByAttribute,
  render,
  waitFor,
  getByText as getElementByText,
  queryAllByAttribute
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllowedTypesWithRunTime, MultiTypeInputType, RUNTIME_INPUT_VALUE, StepProps } from '@harness/uicore'

import * as cdng from 'services/cd-ng'
import * as portalng from 'services/portal'
import { TestWrapper } from '@common/utils/testUtils'
import {
  AmazonS3ArtifactProps,
  ArtifactType,
  TagTypes,
  AmazonS3InitialValuesType
} from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import { ModalViewFor } from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import { AmazonS3 } from '../AmazonS3'
import { awsRegionsData, bucketListData } from './mock'

const fetchBuckets = jest.fn().mockReturnValue(bucketListData)
jest.mock('services/cd-ng', () => ({
  useGetV2BucketListForS3: jest.fn().mockImplementation(() => {
    return { data: bucketListData, refetch: fetchBuckets, error: null, loading: false }
  })
}))
jest.mock('services/portal', () => ({
  useListAwsRegions: jest.fn().mockImplementation(() => {
    return { data: awsRegionsData, error: null, loading: false }
  })
}))

const commonInitialValues: AmazonS3InitialValuesType = {
  identifier: '',
  bucketName: '',
  tagType: TagTypes.Value,
  filePath: '',
  filePathRegex: '',
  region: ''
}

const onSubmit = jest.fn()
export const props: Omit<StepProps<cdng.ConnectorConfigDTO> & AmazonS3ArtifactProps, 'initialValues'> = {
  key: 'key',
  name: 'Artifact details',
  expressions: [],
  allowableTypes: [
    MultiTypeInputType.FIXED,
    MultiTypeInputType.RUNTIME,
    MultiTypeInputType.EXPRESSION
  ] as AllowedTypesWithRunTime[],
  context: 1,
  handleSubmit: onSubmit,
  artifactIdentifiers: [],
  selectedArtifact: 'AmazonS3' as ArtifactType,
  prevStepData: {
    connectorId: {
      value: 'testConnector'
    }
  }
}

const doConfigureOptionsTesting = async (cogModal: HTMLElement, fieldElement: HTMLInputElement) => {
  // Type regex and submit
  // check if field has desired value
  await waitFor(() => expect(getElementByText(cogModal, 'common.configureOptions.regex')).toBeInTheDocument())
  const regexRadio = getElementByText(cogModal, 'common.configureOptions.regex')
  userEvent.click(regexRadio)
  const regexTextArea = queryByAttribute('name', cogModal, 'regExValues')
  act(() => {
    fireEvent.change(regexTextArea!, { target: { value: '<+input>.includes(/test/)' } })
  })
  const cogSubmit = getElementByText(cogModal, 'submit')
  userEvent.click(cogSubmit)
  await waitFor(() => expect(fieldElement.value).toBe('<+input>.regex(<+input>.includes(/test/))'))
}

describe('AmazonS3 tests', () => {
  beforeEach(() => {
    jest.spyOn(cdng, 'useGetV2BucketListForS3').mockImplementation((): any => {
      return {
        loading: false,
        data: bucketListData,
        refetch: fetchBuckets
      }
    })
    jest.spyOn(portalng, 'useListAwsRegions').mockImplementation((): any => {
      return {
        loading: false,
        data: awsRegionsData,
        error: null
      }
    })
    fetchBuckets.mockReset()
    onSubmit.mockReset()
  })

  test(`renders fine for the NEW artifact`, () => {
    const { container } = render(
      <TestWrapper>
        <AmazonS3 initialValues={commonInitialValues} {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`renders fine for the existing artifact when filePath is present`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: 'cdng-terraform-state',
        tagType: TagTypes.Value,
        filePath: 'test_file_path'
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    expect(queryByNameAttribute('bucketName')).not.toBeNull()
    expect(queryByNameAttribute('filePath')).not.toBeNull()
    expect(queryByNameAttribute('filePathRegex')).toBeNull()
    expect(container).toMatchSnapshot()

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: 'cdng-terraform-state',
          filePath: 'test_file_path'
        }
      })
    })
  })

  test(`renders fine for the existing artifact when filePathRegex is present`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: 'cdng-terraform-state',
        tagType: TagTypes.Regex,
        filePathRegex: 'file_path_regex'
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    expect(queryByNameAttribute('bucketName')).not.toBeNull()
    expect(queryByNameAttribute('filePath')).toBeNull()
    expect(queryByNameAttribute('filePathRegex')).not.toBeNull()
    expect(container).toMatchSnapshot()

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: 'cdng-terraform-state',
          filePathRegex: 'file_path_regex'
        }
      })
    })
  })

  test(`renders fine for the existing artifact when all values are runtime inputs`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: RUNTIME_INPUT_VALUE,
        tagType: TagTypes.Value,
        filePath: RUNTIME_INPUT_VALUE
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    expect(queryByNameAttribute('bucketName')).not.toBeNull()
    expect(queryByNameAttribute('filePath')).not.toBeNull()
    expect(container).toMatchSnapshot()

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(onSubmit).toBeCalled()
      expect(onSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: RUNTIME_INPUT_VALUE,
          filePath: RUNTIME_INPUT_VALUE
        }
      })
    })
  })

  test(`switching to Regex should set filePathRegex value as Runtime input when filePath is Runtime input`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: RUNTIME_INPUT_VALUE,
        tagType: TagTypes.Value,
        filePath: RUNTIME_INPUT_VALUE
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    const regexOption = queryAllByAttribute('name', container, 'tagType')[1]
    act(() => {
      fireEvent.click(regexOption)
    })
    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    expect(queryByNameAttribute('bucketName')).not.toBeNull()
    expect(queryByNameAttribute('filePathRegex')).not.toBeNull()

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(onSubmit).toBeCalled()
      expect(onSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: RUNTIME_INPUT_VALUE,
          filePathRegex: RUNTIME_INPUT_VALUE
        }
      })
    })
  })

  test(`switching to Value should set filePath value as Runtime input when filePathRegex is Runtime input`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: RUNTIME_INPUT_VALUE,
        tagType: TagTypes.Regex,
        filePathRegex: RUNTIME_INPUT_VALUE
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    const valueOption = queryAllByAttribute('name', container, 'tagType')[0]
    act(() => {
      fireEvent.click(valueOption)
    })
    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    expect(queryByNameAttribute('bucketName')).not.toBeNull()
    expect(queryByNameAttribute('filePath')).not.toBeNull()

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(onSubmit).toBeCalled()
      expect(onSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: RUNTIME_INPUT_VALUE,
          filePath: RUNTIME_INPUT_VALUE
        }
      })
    })
  })

  test(`switching to Regex should set filePathRegex as empty when filePath is Fixed input`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: RUNTIME_INPUT_VALUE,
        tagType: TagTypes.Value,
        filePath: 'test_file_path'
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    const regexOption = queryAllByAttribute('name', container, 'tagType')[1]
    act(() => {
      fireEvent.click(regexOption)
    })

    const filePathRegexInput = queryByNameAttribute('filePathRegex') as HTMLInputElement
    expect(queryByNameAttribute('bucketName')).not.toBeNull()
    expect(queryByNameAttribute('filePath')).toBeNull()
    expect(filePathRegexInput).not.toBeNull()
    expect(filePathRegexInput.value).toBe('')
    act(() => {
      fireEvent.change(filePathRegexInput, { target: { value: 'test_file_path_regex' } })
    })

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(onSubmit).toBeCalled()
      expect(onSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: RUNTIME_INPUT_VALUE,
          filePathRegex: 'test_file_path_regex'
        }
      })
    })
  })

  test(`switching to Value should set filePath as empty when filePathRegex is Fixed input`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: RUNTIME_INPUT_VALUE,
        tagType: TagTypes.Regex,
        filePathRegex: 'file_path_regex'
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    const valueOption = queryAllByAttribute('name', container, 'tagType')[0]
    act(() => {
      fireEvent.click(valueOption)
    })

    expect(queryByNameAttribute('bucketName')).not.toBeNull()
    const filePathInput = queryByNameAttribute('filePath') as HTMLInputElement
    expect(filePathInput).not.toBeNull()
    expect(filePathInput.value).toBe('')
    act(() => {
      fireEvent.change(filePathInput, { target: { value: 'file_path' } })
    })

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(onSubmit).toBeCalled()
      expect(onSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: RUNTIME_INPUT_VALUE,
          filePath: 'file_path'
        }
      })
    })
  })

  test(`configure values should work fine when all values are runtime inputs including filePath`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        region: RUNTIME_INPUT_VALUE,
        bucketName: RUNTIME_INPUT_VALUE,
        tagType: TagTypes.Value,
        filePath: RUNTIME_INPUT_VALUE
      },
      type: 'AmazonS3'
    }
    const { container } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    const regionInput = queryByAttribute('name', container, 'region') as HTMLInputElement
    const bucketNameInput = queryByAttribute('name', container, 'bucketName') as HTMLInputElement
    const filePathInput = queryByAttribute('name', container, 'filePath') as HTMLInputElement
    expect(regionInput).not.toBeNull()
    expect(bucketNameInput).not.toBeNull()
    expect(filePathInput).not.toBeNull()

    const modals = document.getElementsByClassName('bp3-dialog')
    expect(modals.length).toBe(0)

    // Configure options testing for bucketName and filePath fields
    const cogRegion = document.getElementById('configureOptions_region')
    userEvent.click(cogRegion!)
    await waitFor(() => expect(modals.length).toBe(1))
    const regionCOGModal = modals[0] as HTMLElement
    await doConfigureOptionsTesting(regionCOGModal, regionInput)

    const cogBucketName = document.getElementById('configureOptions_bucketName')
    userEvent.click(cogBucketName!)
    await waitFor(() => expect(modals.length).toBe(1))
    const bucketNameCOGModal = modals[0] as HTMLElement
    await doConfigureOptionsTesting(bucketNameCOGModal, bucketNameInput)

    const cogFilePath = document.getElementById('configureOptions_filePath')
    userEvent.click(cogFilePath!)
    await waitFor(() => expect(modals.length).toBe(2))
    const filePathCOGModal = modals[1] as HTMLElement
    await doConfigureOptionsTesting(filePathCOGModal, filePathInput)

    const submitBtn = getElementByText(container, 'submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(onSubmit).toBeCalled()
      expect(onSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          region: '<+input>.regex(<+input>.includes(/test/))',
          bucketName: '<+input>.regex(<+input>.includes(/test/))',
          filePath: '<+input>.regex(<+input>.includes(/test/))'
        }
      })
    })
  })

  test(`configure values should work fine when all values are runtime inputs including filePathRegex and connector from previous step is NOT FIXED`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: RUNTIME_INPUT_VALUE,
        tagType: TagTypes.Regex,
        filePathRegex: RUNTIME_INPUT_VALUE
      },
      type: 'AmazonS3'
    }
    const { container } = render(
      <TestWrapper>
        <AmazonS3
          initialValues={initialValues as any}
          {...{ ...props, prevStepData: { connectorId: RUNTIME_INPUT_VALUE } }}
        />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    expect(queryByNameAttribute('bucketName')).not.toBeNull()
    expect(queryByNameAttribute('filePathRegex')).not.toBeNull()

    const modals = document.getElementsByClassName('bp3-dialog')
    expect(modals.length).toBe(0)

    // Configure options testing for bucketName and filePath fields
    const cogBucketName = document.getElementById('configureOptions_bucketName')
    userEvent.click(cogBucketName!)
    await waitFor(() => expect(modals.length).toBe(1))
    const bucketNameCOGModal = modals[0] as HTMLElement
    const bucketNameInput = queryByAttribute('name', container, 'bucketName') as HTMLInputElement
    await doConfigureOptionsTesting(bucketNameCOGModal, bucketNameInput)

    const cogFilePathRegex = document.getElementById('configureOptions_filePathRegex')
    userEvent.click(cogFilePathRegex!)
    await waitFor(() => expect(modals.length).toBe(2))
    const filePathCOGModal = modals[1] as HTMLElement
    const filePathInput = queryByAttribute('name', container, 'filePathRegex') as HTMLInputElement
    await doConfigureOptionsTesting(filePathCOGModal, filePathInput)

    const submitBtn = getElementByText(container, 'submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(onSubmit).toBeCalled()
      expect(onSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: '<+input>',
          bucketName: '<+input>.regex(<+input>.includes(/test/))',
          filePathRegex: '<+input>.regex(<+input>.includes(/test/))'
        }
      })
    })
  })

  test(`clicking on Bucket Name field should display loading option when bucket data is being fetched`, async () => {
    jest.spyOn(cdng, 'useGetV2BucketListForS3').mockImplementation((): any => {
      return {
        loading: true,
        data: null,
        refetch: fetchBuckets
      }
    })

    const { container } = render(
      <TestWrapper>
        <AmazonS3 initialValues={commonInitialValues} {...props} />
      </TestWrapper>
    )

    await waitFor(() => expect(fetchBuckets).toHaveBeenCalledTimes(1))
    const portalDivs = document.getElementsByClassName('bp3-portal')
    expect(portalDivs.length).toBe(0)
    const bucketNameDropDownButton = container.querySelectorAll('[data-icon="chevron-down"]')[1]
    userEvent.click(bucketNameDropDownButton!)
    expect(portalDivs.length).toBe(1)
    const dropdownPortalDiv = portalDivs[0]
    const selectListMenu = dropdownPortalDiv.querySelector('.bp3-menu')
    const loadingBucketsOption = await findByText(selectListMenu as HTMLElement, 'Loading Buckets...')
    expect(loadingBucketsOption).toBeDefined()
    await waitFor(() => expect(fetchBuckets).toHaveBeenCalledTimes(1))
  })

  test(`region field placeholder should be loading when region data is being fetched`, async () => {
    jest.spyOn(portalng, 'useListAwsRegions').mockImplementation((): any => {
      return {
        loading: true,
        data: null,
        refetch: jest.fn()
      }
    })

    const { container } = render(
      <TestWrapper>
        <AmazonS3 initialValues={commonInitialValues} {...props} />
      </TestWrapper>
    )
    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    const regionSelect = queryByNameAttribute('region') as HTMLInputElement
    expect(regionSelect.placeholder).toBe('loading')
  })

  test(`clicking on Bucket Name field should call fetchBuckets function when bucket data is not present`, async () => {
    jest.spyOn(cdng, 'useGetV2BucketListForS3').mockImplementation((): any => {
      return {
        loading: false,
        data: null,
        refetch: fetchBuckets
      }
    })

    const { container } = render(
      <TestWrapper>
        <AmazonS3 initialValues={commonInitialValues} {...props} />
      </TestWrapper>
    )

    const portalDivs = document.getElementsByClassName('bp3-portal')
    expect(portalDivs.length).toBe(0)
    const bucketNameDropDownButton = container.querySelectorAll('[data-icon="chevron-down"]')[1]
    fireEvent.click(bucketNameDropDownButton!)
    expect(portalDivs.length).toBe(1)
    const dropdownPortalDiv = portalDivs[0]
    const selectListMenu = dropdownPortalDiv.querySelector('.bp3-menu')
    const noBucketsOption = await findByText(selectListMenu as HTMLElement, 'pipeline.noBucketsFound')
    expect(noBucketsOption).toBeDefined()
    await waitFor(() => expect(fetchBuckets).toHaveBeenCalled())
  })

  test(`Bucket Name field should be rendered as free text field, if region is Runtime input`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        region: RUNTIME_INPUT_VALUE,
        bucketName: 'cdng-terraform-state',
        tagType: TagTypes.Value,
        filePath: 'test_file_1'
      },
      type: 'AmazonS3'
    }
    const { container } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    await waitFor(() => expect(fetchBuckets).toHaveBeenCalledTimes(1))
    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    const bucketNameInput = queryByNameAttribute('bucketName') as HTMLInputElement
    const bucketNameDropDownButtons = container.querySelectorAll('[data-icon="chevron-down"]')
    expect(bucketNameDropDownButtons.length).toBe(0)
    userEvent.click(bucketNameInput)
    await waitFor(() => expect(fetchBuckets).toHaveBeenCalledTimes(1))
    expect(bucketNameInput.value).toBe('cdng-terraform-state')
    userEvent.clear(bucketNameInput)
    userEvent.type(bucketNameInput, 'abc')
    expect(bucketNameInput.value).toBe('abc')
  })

  test(`submits should work when filePath value is given`, async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={commonInitialValues} {...props} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    const bucketNameRequiredErr = await findByText(container, 'pipeline.manifestType.bucketNameRequired')
    expect(bucketNameRequiredErr).toBeDefined()
    const filePathRegexRequiredErr = await findByText(container, 'pipeline.manifestType.pathRequired')
    expect(filePathRegexRequiredErr).toBeDefined()

    const portalDivs = document.getElementsByClassName('bp3-portal')
    expect(portalDivs.length).toBe(0)

    // Select bucketName from dropdown
    const bucketNameDropDownButton = container.querySelectorAll('[data-icon="chevron-down"]')[1]
    fireEvent.click(bucketNameDropDownButton!)
    expect(portalDivs.length).toBe(1)
    const dropdownPortalDiv = portalDivs[0]
    const selectListMenu = dropdownPortalDiv.querySelector('.bp3-menu')
    const selectItem = await findByText(selectListMenu as HTMLElement, 'prod-bucket-339')
    act(() => {
      fireEvent.click(selectItem)
    })
    const bucketNameSelect = queryByNameAttribute('bucketName') as HTMLInputElement
    expect(bucketNameSelect.value).toBe('prod-bucket-339')

    // change value of filePath
    act(() => {
      fireEvent.change(queryByNameAttribute('filePath')!, { target: { value: 'file_path' } })
    })
    await waitFor(() => expect(container.querySelector('input[name="filePath"]')).toHaveValue('file_path'))

    // Submit the form
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: 'prod-bucket-339',
          filePath: 'file_path'
        }
      })
    })
  })

  test(`submits should work when filePathRegex value is given`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: '',
        tagType: TagTypes.Regex,
        filePathRegex: ''
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    const bucketNameRequiredErr = await findByText(container, 'pipeline.manifestType.bucketNameRequired')
    expect(bucketNameRequiredErr).toBeDefined()
    const filePathRegexRequiredErr = await findByText(container, 'pipeline.artifactsSelection.validation.filePathRegex')
    expect(filePathRegexRequiredErr).toBeDefined()

    const portalDivs = document.getElementsByClassName('bp3-portal')
    expect(portalDivs.length).toBe(0)

    // Select region from dropdown
    const regionDropDownButton = container.querySelectorAll('[data-icon="chevron-down"]')[0]
    fireEvent.click(regionDropDownButton!)
    expect(portalDivs.length).toBe(1)
    const dropdownPortalDivRegion = portalDivs[0]
    const selectListMenuRegion = dropdownPortalDivRegion.querySelector('.bp3-menu')
    const selectItemRegion = await findByText(selectListMenuRegion as HTMLElement, 'GovCloud (US-West)')
    act(() => {
      fireEvent.click(selectItemRegion)
    })
    const regionSelect = queryByNameAttribute('region') as HTMLInputElement
    expect(regionSelect.value).toBe('GovCloud (US-West)')

    // Select bucketName from dropdown
    const bucketNameDropDownButton = container.querySelectorAll('[data-icon="chevron-down"]')[1]
    fireEvent.click(bucketNameDropDownButton!)
    expect(portalDivs.length).toBe(2)
    const dropdownPortalDiv = portalDivs[1]
    const selectListMenu = dropdownPortalDiv.querySelector('.bp3-menu')
    const selectItem = await findByText(selectListMenu as HTMLElement, 'prod-bucket-339')
    act(() => {
      fireEvent.click(selectItem)
    })
    const bucketNameSelect = queryByNameAttribute('bucketName') as HTMLInputElement
    expect(bucketNameSelect.value).toBe('prod-bucket-339')

    // change value of filePathRegex
    const filePathRegexField = queryByNameAttribute('filePathRegex')
    expect(filePathRegexField).not.toBeNull()
    act(() => {
      fireEvent.change(filePathRegexField!, { target: { value: 'file_path_regex' } })
    })
    await waitFor(() => expect(filePathRegexField).toHaveValue('file_path_regex'))

    // Submit the form
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          region: 'us-gov-west-1',
          bucketName: 'prod-bucket-339',
          filePathRegex: 'file_path_regex'
        }
      })
    })
  })

  test(`on change of region, existing bucketName should be cleared`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: 'cdng-terraform-state',
        tagType: TagTypes.Value,
        filePath: 'test_file_1'
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)

    const portalDivs = document.getElementsByClassName('bp3-portal')
    expect(portalDivs.length).toBe(0)

    const bucketNameSelect = queryByNameAttribute('bucketName') as HTMLInputElement
    expect(bucketNameSelect.value).toBe('cdng-terraform-state')

    // Select region from dropdown
    const regionDropDownButton = container.querySelectorAll('[data-icon="chevron-down"]')[0]
    fireEvent.click(regionDropDownButton!)
    expect(portalDivs.length).toBe(1)
    const dropdownPortalDivRegion = portalDivs[0]
    const selectListMenuRegion = dropdownPortalDivRegion.querySelector('.bp3-menu')
    const selectItemRegion = await findByText(selectListMenuRegion as HTMLElement, 'GovCloud (US-West)')
    act(() => {
      fireEvent.click(selectItemRegion)
    })
    const regionSelect = queryByNameAttribute('region') as HTMLInputElement
    expect(regionSelect.value).toBe('GovCloud (US-West)')
    await waitFor(() => expect(bucketNameSelect.value).toBe(''))

    // Select bucketName from dropdown
    const bucketNameDropDownButton = container.querySelectorAll('[data-icon="chevron-down"]')[1]
    fireEvent.click(bucketNameDropDownButton!)
    expect(portalDivs.length).toBe(2)
    const dropdownPortalDiv = portalDivs[1]
    const selectListMenu = dropdownPortalDiv.querySelector('.bp3-menu')
    const selectItem = await findByText(selectListMenu as HTMLElement, 'prod-bucket-339')
    act(() => {
      fireEvent.click(selectItem)
    })
    expect(bucketNameSelect.value).toBe('prod-bucket-339')

    // Submit the form
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          region: 'us-gov-west-1',
          bucketName: 'prod-bucket-339',
          filePath: 'test_file_1'
        }
      })
    })
  })

  test(`While adding Sidecard Artifact - submits should work when filePath value is given`, async () => {
    const initialValues = {
      identifier: 'initial_id',
      type: 'AmazonS3',
      spec: {
        identifier: '',
        bucketName: 'cdng-terraform-state',
        tagType: TagTypes.Value,
        filePath: 'file_path'
      }
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} context={ModalViewFor.SIDECAR} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    const identifierField = queryByNameAttribute('identifier') as HTMLInputElement
    expect(identifierField.value).toBe('initial_id')
    // change value of identifier to empty
    act(() => {
      fireEvent.change(queryByNameAttribute('identifier')!, { target: { value: '' } })
    })

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)

    const identifierRequiredErr = await findByText(container, 'common.validation.nameIsRequired')
    expect(identifierRequiredErr).toBeDefined()

    // change value of identifier
    act(() => {
      fireEvent.change(queryByNameAttribute('identifier')!, { target: { value: 'test_id' } })
    })
    // Submit the form
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        identifier: 'test_id',
        spec: {
          connectorRef: 'testConnector',
          bucketName: 'cdng-terraform-state',
          filePath: 'file_path'
        }
      })
    })
  })

  test(`bucket name field should be free text when connectorId from previous step is not FIXED value`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: '',
        tagType: TagTypes.Regex,
        filePathRegex: ''
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3
          initialValues={initialValues as any}
          {...{ ...props, prevStepData: { connectorId: RUNTIME_INPUT_VALUE } }}
        />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    const bucketNameRequiredErr = await findByText(container, 'pipeline.manifestType.bucketNameRequired')
    expect(bucketNameRequiredErr).toBeDefined()
    const filePathRegexRequiredErr = await findByText(container, 'pipeline.artifactsSelection.validation.filePathRegex')
    expect(filePathRegexRequiredErr).toBeDefined()

    const portalDivs = document.getElementsByClassName('bp3-portal')
    expect(portalDivs.length).toBe(0)

    // Give bucket name value
    const bucketNameField = queryByNameAttribute('bucketName') as HTMLInputElement
    act(() => {
      fireEvent.change(bucketNameField, { target: { value: 'random_xyz_value' } })
    })
    expect(bucketNameField.value).toBe('random_xyz_value')

    // change value of filePathRegex
    const filePathRegexField = queryByNameAttribute('filePathRegex')
    expect(filePathRegexField).not.toBeNull()
    act(() => {
      fireEvent.change(filePathRegexField!, { target: { value: 'file_path_regex' } })
    })
    await waitFor(() => expect(filePathRegexField).toHaveValue('file_path_regex'))

    // Submit the form
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: '<+input>',
          bucketName: 'random_xyz_value',
          filePathRegex: 'file_path_regex'
        }
      })
    })
  })

  test(`bucket name field is Runtime input when connectorId from previous step is not FIXED value`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: RUNTIME_INPUT_VALUE,
        tagType: TagTypes.Regex,
        filePathRegex: 'file_path_regex'
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3
          initialValues={initialValues as any}
          {...{ ...props, prevStepData: { connectorId: RUNTIME_INPUT_VALUE } }}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    const submitBtn = getByText('submit')
    // Submit the form
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: '<+input>',
          bucketName: '<+input>',
          filePathRegex: 'file_path_regex'
        }
      })
    })
  })
})
