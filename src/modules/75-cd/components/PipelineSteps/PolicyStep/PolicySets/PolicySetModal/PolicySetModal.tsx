/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, isEqual } from 'lodash-es'
import type { FormikProps } from 'formik'

import {
  Button,
  Layout,
  Container,
  Pagination,
  useToaster,
  Tabs,
  Text,
  FontVariation,
  IconName,
  ExpandingSearchInput,
  Color
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { Dialog, IDialogProps, Tab } from '@blueprintjs/core'

import { useStrings, StringKeys } from 'framework/strings'
import { GetPolicySetQueryParams, PolicySet, useGetPolicySetList } from 'services/pm'

import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'

import { PolicySetWizard } from '@governance/PolicySetWizard'

import { PolicySetListRenderer } from '../PolicySetListRenderer/PolicySetListRenderer'
import { NewPolicySetButton } from '../NewPolicySetButton/NewPolicySetButton'
import { PolicySetType, PolicyStepFormData } from '../../PolicyStepTypes'
import { getErrorMessage } from '../../utils'

import css from './PolicySetModal.module.scss'

export interface PolicySetModalProps {
  name: string
  formikProps?: FormikProps<PolicyStepFormData>
  policySetIds: string[]
  closeModal: (action?: string) => void
}

const modalProps: IDialogProps = {
  isOpen: true,
  enforceFocus: false,
  canOutsideClickClose: true,
  style: {
    width: 1080,
    borderLeft: 0,
    paddingBottom: 0,
    position: 'relative',
    overflow: 'auto'
  }
}

export function PolicySetModal({ name, formikProps, policySetIds, closeModal }: PolicySetModalProps): JSX.Element {
  const { getString } = useStrings()
  const { showError } = useToaster()

  const [selectedTabId, setSelectedTabId] = useState(PolicySetType.ACCOUNT)
  const [policySetList, setPolicySetList] = useState<PolicySet[]>([])
  const [newPolicySetIds, setNewPolicySetIds] = useState<string[]>([])
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(40)
  const [counts, setCounts] = useState({
    [PolicySetType.ACCOUNT]: 0,
    [PolicySetType.ORG]: 0,
    [PolicySetType.PROJECT]: 0
  })
  const [searchTerm, setsearchTerm] = useState<string>('')

  const {
    accountId: accountIdentifier,
    projectIdentifier,
    orgIdentifier,
    module
  } = useParams<ProjectPathProps & ModulePathParams>()
  const [queryParams, setQueryParams] = useState<GetPolicySetQueryParams>({
    accountIdentifier,
    ...((selectedTabId === PolicySetType.ORG || selectedTabId === PolicySetType.PROJECT) && { orgIdentifier }),
    ...(selectedTabId === PolicySetType.PROJECT && { projectIdentifier, module })
  })

  useEffect(() => {
    // istanbul ignore else
    if (policySetIds.length > 0) {
      setNewPolicySetIds(policySetIds)
    }
  }, [])

  useEffect(() => {
    setCounts({
      [PolicySetType.ACCOUNT]: newPolicySetIds.filter(id => id.includes('account.')).length,
      [PolicySetType.ORG]: newPolicySetIds.filter(id => id.includes('org.')).length,
      [PolicySetType.PROJECT]: newPolicySetIds.filter(id => !id.includes('account.') && !id.includes('org.')).length
    })
  }, [newPolicySetIds])

  useEffect(() => {
    // Set request query params to contain the org and project depending on the scope selected
    setQueryParams({
      accountIdentifier,
      ...((selectedTabId === PolicySetType.ORG || selectedTabId === PolicySetType.PROJECT) && { orgIdentifier }),
      ...(selectedTabId === PolicySetType.PROJECT && { projectIdentifier, module })
    })
  }, [selectedTabId])

  const reqQueryParams = useMemo(
    () => ({
      ...queryParams,
      page: String(pageIndex),
      per_page: pageSize.toString(),
      searchTerm: searchTerm
    }),
    [pageIndex, pageSize, queryParams, searchTerm]
  )

  const {
    data: policySets,
    loading,
    error,
    refetch,
    response: policySetResponse
  } = useGetPolicySetList({
    queryParams: {
      ...reqQueryParams,
      type: formikProps?.values?.spec?.type?.toLowerCase(),
      action: 'onstep'
    },
    debounce: 300
  })

  const pageCount = useMemo(
    () => parseInt(defaultTo(/* istanbul ignore next */ policySetResponse?.headers?.get('x-total-pages'), '1')),
    [policySetResponse]
  )

  const itemCount = useMemo(
    () => parseInt(defaultTo(/* istanbul ignore next */ policySetResponse?.headers?.get('x-total-items'), '0')),
    [policySetResponse]
  )

  useEffect(() => {
    // istanbul ignore else
    if (error) {
      showError(getErrorMessage(error))
    }
    // istanbul ignore else
    if (!policySets && !error) {
      refetch()
    }
    // istanbul ignore else
    if (!isEqual(policySets, policySetList)) {
      setPolicySetList(defaultTo(policySets, []))
    }
  }, [error, policySets, refetch])

  const [showModal, hideModal] = useModalHook(() => {
    return (
      <Dialog {...modalProps} onClose={hideModal}>
        <PolicySetWizard hideModal={hideModal} refetch={refetch} queryParams={queryParams} />
        <Button
          minimal
          className={css.closeIcon}
          icon="cross"
          iconProps={{ size: 18 }}
          onClick={() => {
            refetch()
            hideModal()
          }}
        />
      </Dialog>
    )
  }, [queryParams])

  const handleTabChange = (nextTab: PolicySetType): void => {
    setSelectedTabId(nextTab)
    setPageIndex(0)
  }

  // This component renders the title for the tabs in the modal
  const TabTitle = ({
    icon,
    type,
    count,
    identifier
  }: {
    icon: IconName
    type: StringKeys
    count: number
    identifier?: string
  }) => {
    return (
      <Container>
        <Text font={{ size: 'normal' }} icon={icon}>
          {getString(type)}
          {identifier ? `\xA0[${identifier}]` : ''}
          {count > 0 && (
            <Text
              itemType="span"
              icon={'main-tick'}
              iconProps={{
                color: Color.WHITE,
                size: 10
              }}
              className={css.selectedCount}
              background={Color.PRIMARY_7}
              color={Color.WHITE}
              margin={{ left: 'small' }}
              padding={{ right: 'small', left: 'small' }}
            >
              {count}
            </Text>
          )}
        </Text>
      </Container>
    )
  }

  // This component renders the tab panel in the modal
  const TabPanel = () => (
    <>
      <ExpandingSearchInput
        alwaysExpanded
        placeholder={getString('common.searchPlaceholder')}
        onChange={text => {
          setsearchTerm(text.trim())
        }}
        width={'100%'}
        autoFocus={false}
        defaultValue={searchTerm}
        throttle={300}
      />
      <PolicySetListRenderer
        newPolicySetIds={newPolicySetIds}
        setNewPolicySetIds={setNewPolicySetIds}
        policySetList={policySetList}
        loading={loading}
        error={error}
        refetch={refetch}
        selectedTabId={selectedTabId}
        showModal={showModal}
      />
      <Pagination
        itemCount={itemCount}
        pageCount={pageCount}
        pageSize={pageSize}
        pageSizeOptions={[5, 10, 20, 40]}
        onPageSizeChange={size => setPageSize(size)}
        pageIndex={pageIndex}
        gotoPage={index => setPageIndex(index)}
        hidePageNumbers
      />
      <hr className={css.separator} />
      <Container margin={{ top: 'large' }}>
        <Layout.Horizontal spacing="medium">
          <Button
            text="Apply"
            intent="primary"
            onClick={() => {
              formikProps?.setFieldValue(name, newPolicySetIds)
              closeModal(getString('common.apply'))
            }}
          />
          <Button text="Cancel" onClick={() => closeModal()} />
        </Layout.Horizontal>
      </Container>
    </>
  )

  return (
    <>
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={() => closeModal()}
        className={css.policySetModal}
        title={
          <Layout.Horizontal
            spacing="xsmall"
            padding={{ top: 'xlarge', left: 'medium', right: 'large' }}
            flex={{ justifyContent: 'space-between' }}
          >
            <Text font={{ variation: FontVariation.H3 }}>{getString('common.policiesSets.selectPolicySet')}</Text>
            <NewPolicySetButton onClick={showModal} />
          </Layout.Horizontal>
        }
      >
        <Container padding={{ top: 'medium', right: 'xxlarge', bottom: 'large', left: 'xxlarge' }} width={'800px'}>
          <Tabs id="policySetModal" onChange={handleTabChange} selectedTabId={selectedTabId} data-tabId={selectedTabId}>
            <Tab
              id={PolicySetType.ACCOUNT}
              title={<TabTitle icon="layers" type={'account'} count={counts[PolicySetType.ACCOUNT]} />}
              panel={<TabPanel />}
              data-testid="account"
            />
            <Tab
              id={PolicySetType.ORG}
              title={
                <TabTitle
                  icon="diagram-tree"
                  type={'orgLabel'}
                  count={counts[PolicySetType.ORG]}
                  identifier={orgIdentifier}
                />
              }
              panel={<TabPanel />}
              data-testid="orgLabel"
            />
            <Tab
              id={PolicySetType.PROJECT}
              title={
                <TabTitle
                  icon="cube"
                  type={'projectLabel'}
                  count={counts[PolicySetType.PROJECT]}
                  identifier={projectIdentifier}
                />
              }
              panel={<TabPanel />}
              data-testid="projectLabel"
            />
          </Tabs>
        </Container>
      </Dialog>
    </>
  )
}
