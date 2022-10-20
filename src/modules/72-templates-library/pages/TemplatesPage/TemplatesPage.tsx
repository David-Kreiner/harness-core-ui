/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  DropDown,
  ExpandingSearchInput,
  ExpandingSearchInputHandle,
  GridListToggle,
  HarnessDocTooltip,
  Layout,
  Views
} from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { useHistory, useParams } from 'react-router-dom'
import { Dialog } from '@blueprintjs/core'
import { TemplateSettingsModal } from '@templates-library/components/TemplateSettingsModal/TemplateSettingsModal'
import { Page } from '@common/exports'
import { useStrings } from 'framework/strings'
import { Sort, SortFields, TemplateListType } from '@templates-library/pages/TemplatesPage/TemplatesPageUtils'
import { TemplateDetailsDrawer } from '@templates-library/components/TemplateDetailDrawer/TemplateDetailDrawer'
import { TemplateSummaryResponse, useGetTemplateList, useGetTemplateMetadataList } from 'services/template-ng'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { NewTemplatePopover } from '@templates-library/pages/TemplatesPage/views/NewTemplatePopover/NewTemplatePopover'
import { DeleteTemplateModal } from '@templates-library/components/DeleteTemplateModal/DeleteTemplateModal'
import routes from '@common/RouteDefinitions'
import { useMutateAsGet, useQueryParams, useUpdateQueryParams } from '@common/hooks'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import TemplatesView from '@templates-library/pages/TemplatesPage/views/TemplatesView/TemplatesView'
import ResultsViewHeader from '@templates-library/pages/TemplatesPage/views/ResultsViewHeader/ResultsViewHeader'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import GitFilters, { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { getAllowedTemplateTypes, TemplateType } from '@templates-library/utils/templatesUtils'
import { getLinkForAccountResources } from '@common/utils/BreadcrumbUtils'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useFeature } from '@common/hooks/useFeatures'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import FeatureWarningBanner from '@common/components/FeatureWarning/FeatureWarningBanner'
import useImportResource from '@pipeline/components/ImportResource/useImportResource'
import { ResourceType } from '@common/interfaces/GitSyncInterface'
import css from './TemplatesPage.module.scss'

export default function TemplatesPage(): React.ReactElement {
  const { getString } = useStrings()
  const history = useHistory()
  const { templateType } = useQueryParams<{ templateType?: TemplateType }>()
  const { updateQueryParams } = useUpdateQueryParams<{ templateType?: TemplateType }>()
  const [page, setPage] = useState(0)
  const [view, setView] = useState<Views>(Views.GRID)
  const [sort, setSort] = useState<string[]>([SortFields.LastUpdatedAt, Sort.DESC])
  const [searchParam, setSearchParam] = useState('')
  const [templateToDelete, setTemplateToDelete] = React.useState<TemplateSummaryResponse>({})
  const [templateIdentifierToSettings, setTemplateIdentifierToSettings] = React.useState<string>()
  const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateSummaryResponse | undefined>()
  const [gitFilter, setGitFilter] = useState<GitFilterScope | null>(null)
  const searchRef = React.useRef<ExpandingSearchInputHandle>({} as ExpandingSearchInputHandle)
  const { projectIdentifier, orgIdentifier, accountId, module } = useParams<ProjectPathProps & ModulePathParams>()
  const {
    isGitSyncEnabled: isGitSyncEnabledForProject,
    gitSyncEnabledOnlyForFF,
    supportingTemplatesGitx
  } = useAppStore()
  const isGitSyncEnabled = isGitSyncEnabledForProject && !gitSyncEnabledOnlyForFF
  const scope = getScopeFromDTO({ projectIdentifier, orgIdentifier, accountIdentifier: accountId })
  const { CUSTOM_SECRET_MANAGER_NG, CVNG_TEMPLATE_MONITORED_SERVICE, NG_SVC_ENV_REDESIGN } = useFeatureFlags()
  const { enabled: templateFeatureEnabled } = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.TEMPLATE_SERVICE
    }
  })
  const allowedTemplateTypes = getAllowedTemplateTypes(scope, {
    [TemplateType.SecretManager]: !!CUSTOM_SECRET_MANAGER_NG,
    [TemplateType.MonitoredService]: !!CVNG_TEMPLATE_MONITORED_SERVICE,
    [TemplateType.CustomDeployment]: !!NG_SVC_ENV_REDESIGN
  }).filter(item => !item.disabled)

  useDocumentTitle([getString('common.templates')])

  const {
    data: templateData,
    refetch: reloadTemplates,
    loading,
    error
  } = useMutateAsGet(supportingTemplatesGitx ? useGetTemplateMetadataList : useGetTemplateList, {
    body: {
      filterType: 'Template',
      ...(templateType && { templateEntityTypes: [templateType] })
    },
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      templateListType: TemplateListType.LastUpdated,
      searchTerm: searchParam,
      page,
      sort,
      size: 20,
      ...(gitFilter?.repo &&
        gitFilter.branch && {
          repoIdentifier: gitFilter.repo,
          branch: gitFilter.branch
        })
    },
    queryParamStringifyOptions: { arrayFormat: 'comma' },
    lazy: !templateFeatureEnabled
  })

  const reset = React.useCallback((): void => {
    searchRef.current.clear()
    updateQueryParams({ templateType: [] as any })
    setGitFilter(null)
  }, [searchRef.current, updateQueryParams, setGitFilter])

  const [showDeleteTemplatesModal, hideDeleteTemplatesModal] = useModalHook(() => {
    const content = (
      <DeleteTemplateModal
        template={templateToDelete}
        onClose={hideDeleteTemplatesModal}
        onSuccess={() => {
          hideDeleteTemplatesModal()
          reloadTemplates()
        }}
      />
    )
    return (
      <Dialog enforceFocus={false} isOpen={true} className={css.deleteTemplateDialog}>
        {isGitSyncEnabled ? <GitSyncStoreProvider>{content}</GitSyncStoreProvider> : content}
      </Dialog>
    )
  }, [templateToDelete, reloadTemplates, isGitSyncEnabled])

  const [showTemplateSettingsModal, hideTemplateSettingsModal] = useModalHook(
    () => (
      <Dialog enforceFocus={false} isOpen={true} className={css.updateTemplateSettingsDialog}>
        <TemplateSettingsModal
          templateIdentifier={templateIdentifierToSettings || ''}
          onClose={hideTemplateSettingsModal}
          onSuccess={() => {
            hideTemplateSettingsModal()
            reloadTemplates()
          }}
        />
      </Dialog>
    ),
    [templateIdentifierToSettings, reloadTemplates]
  )

  const { showImportResourceModal } = useImportResource({
    resourceType: ResourceType.TEMPLATE,
    modalTitle: getString('common.importEntityFromGit', { resourceType: getString('common.template.label') }),
    onSuccess: reloadTemplates
  })

  const goToTemplateStudio = (template: TemplateSummaryResponse): void => {
    history.push(
      routes.toTemplateStudio({
        projectIdentifier,
        orgIdentifier,
        accountId,
        module,
        templateType: template.templateEntityType,
        templateIdentifier: template.identifier || '',
        versionLabel: template.versionLabel,
        repoIdentifier: template.gitDetails?.repoIdentifier,
        branch: template.gitDetails?.branch
      })
    )
  }

  const onRetry = React.useCallback(() => {
    reloadTemplates()
  }, [reloadTemplates])

  return (
    <>
      <Page.Header
        title={
          <div className="ng-tooltip-native">
            <h2 data-tooltip-id="templatesPageHeading"> {getString('common.templates')}</h2>
            <HarnessDocTooltip tooltipId="templatePageHeading" useStandAlone={true} />
          </div>
        }
        breadcrumbs={
          <NGBreadcrumbs
            links={getLinkForAccountResources({ accountId, orgIdentifier, projectIdentifier, getString })}
          />
        }
        className={css.templatesPageHeader}
      />
      <Page.SubHeader className={css.templatesPageSubHeader}>
        <Layout.Horizontal spacing={'medium'}>
          <NewTemplatePopover onImportTemplateClick={showImportResourceModal} />
          <DropDown
            onChange={item => {
              updateQueryParams({ templateType: (item.value || []) as TemplateType })
            }}
            value={templateType}
            filterable={false}
            addClearBtn={true}
            items={allowedTemplateTypes}
            placeholder={getString('all')}
            popoverClassName={css.dropdownPopover}
          />
          {isGitSyncEnabled && (
            <GitSyncStoreProvider>
              <GitFilters
                onChange={filter => {
                  setGitFilter(filter)
                  setPage(0)
                }}
                className={css.gitFilter}
                defaultValue={gitFilter || undefined}
              />
            </GitSyncStoreProvider>
          )}
        </Layout.Horizontal>
        <Layout.Horizontal spacing="small" style={{ alignItems: 'center' }}>
          <ExpandingSearchInput
            alwaysExpanded
            width={200}
            placeholder={getString('search')}
            onChange={(text: string) => {
              setPage(0)
              setSearchParam(text)
            }}
            ref={searchRef}
            defaultValue={searchParam}
            className={css.expandSearch}
          />
          <GridListToggle initialSelectedView={view} onViewToggle={setView} />
        </Layout.Horizontal>
      </Page.SubHeader>
      <Page.Body
        loading={loading}
        error={(error?.data as Error)?.message || error?.message}
        className={css.templatesPageBody}
        retryOnError={onRetry}
      >
        {!templateFeatureEnabled ? (
          <FeatureWarningBanner featureName={FeatureIdentifier.TEMPLATE_SERVICE} className={css.featureWarningBanner} />
        ) : (
          !loading &&
          (!templateData?.data?.content?.length ? (
            <NoResultsView
              hasSearchParam={!!searchParam || !!templateType}
              onReset={reset}
              text={getString('templatesLibrary.templatesPage.noTemplates', { scope })}
            />
          ) : (
            <React.Fragment>
              <ResultsViewHeader templateData={templateData?.data} setPage={setPage} setSort={setSort} />
              <TemplatesView
                gotoPage={setPage}
                data={templateData?.data}
                onSelect={setSelectedTemplate}
                selectedTemplate={selectedTemplate}
                onPreview={setSelectedTemplate}
                onOpenEdit={goToTemplateStudio}
                onOpenSettings={identifier => {
                  setTemplateIdentifierToSettings(identifier)
                  showTemplateSettingsModal()
                }}
                onDelete={template => {
                  setTemplateToDelete(template)
                  showDeleteTemplatesModal()
                }}
                view={view}
              />
            </React.Fragment>
          ))
        )}
      </Page.Body>
      {selectedTemplate && (
        <TemplateDetailsDrawer
          template={selectedTemplate}
          onClose={() => {
            setSelectedTemplate(undefined)
          }}
        />
      )}
    </>
  )
}
