import type { IconName } from '@wings-software/uicore'
import { pick } from 'lodash-es'
import { useEffect, useState } from 'react'
import { Connectors } from '@connectors/constants'
import type { GitSyncConfig, ConnectorInfoDTO, GitSyncEntityDTO } from 'services/cd-ng'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getPipelineListPromise } from 'services/pipeline-ng'
import { GitSuffixRegex, HarnessFolderNameSanityRegex } from '@common/utils/StringUtils'
import { useGetAllFeatures } from 'services/cf'

export const getGitConnectorIcon = (type: GitSyncConfig['gitConnectorType']): IconName => {
  switch (type) {
    case Connectors.GITHUB:
      return 'github'
    case Connectors.GITLAB:
      return 'service-gotlab'
    case Connectors.BITBUCKET:
      return 'bitbucket-selected'
    default:
      return 'cog'
  }
}

export const modalTypes = {
  GIT_SYNC_REP: 'gitSyncRepo',
  GIT_SYNC_BRANCH: 'gitSyncBranch'
}

export interface ConnectorCardInterface {
  type: ConnectorInfoDTO['type']
  disabled?: boolean
  icon: {
    default: IconName
    selected: IconName
  }
}

export const gitCards: Array<ConnectorCardInterface> = [
  {
    type: Connectors.GITHUB,
    icon: {
      default: 'github-unselected',
      selected: 'github-selected'
    }
  }
  // {
  //   type: Connectors.GITLAB,
  //   disabled: true,
  //   icon: {
  //     default: 'gitlab-unselected',
  //     selected: 'gitlab-selected'
  //   }
  // },
  // {
  //   type: Connectors.BITBUCKET,
  //   disabled: true,
  //   icon: {
  //     default: 'bitbucket-unselected',
  //     selected: 'bitbucket-selected'
  //   }
  // }
]

export const getRepoPath = (gitRepo: GitSyncConfig): string => {
  let basePath = ''
  switch (gitRepo.gitConnectorType) {
    case Connectors.GITHUB:
      basePath = 'https://github.com/'
      break
    case Connectors.GITLAB:
      basePath = 'https://gitlab.com/'
      break
    case Connectors.BITBUCKET:
      basePath = 'https://bitbucket.com/'
  }

  return gitRepo.repo ? gitRepo.repo.replace(GitSuffixRegex, '').split(basePath)?.[1] ?? '' : ''
}

export const getRepoUrl = (baseUrl: string, repoName: string) => {
  if (!baseUrl) {
    return ''
  }
  if (baseUrl.endsWith('/')) {
    return baseUrl + repoName
  }
  return `${baseUrl}/${repoName}`
}

export const getHarnessFolderPathWithSuffix = (folderPath: string, suffix: string) => {
  const sanitizedRootFolder = folderPath.replace(HarnessFolderNameSanityRegex, '/$2')
  return sanitizedRootFolder.endsWith('/')
    ? sanitizedRootFolder.concat(suffix.substring(1))
    : sanitizedRootFolder.concat(suffix)
}

export const getCompleteGitPath = (repo: string, folderPath: string, suffix: string): string => {
  const folderPathSuffix = folderPath.endsWith('/') ? suffix.substring(1) : suffix
  /* Convert repo url like 
  /* https://github.com/wings-software/vb.git//// to https://github.com/wings-software/vb */
  /* https://github.com/wings-software/vb.git to https://github.com/wings-software/vb */
  const sanitizedRepo = repo.replace(GitSuffixRegex, '')
  if (folderPath) {
    /* Convert folder paths like  
    /* ///////a/////b////c///// to /a/b/c/ */
    /* a/////b////c to a/b/c */
    /* ///////a/////b////c to /a/b/c */
    const sanitizedRootFolder = folderPath.replace(HarnessFolderNameSanityRegex, '/$2')
    if (sanitizedRepo.endsWith('/') && sanitizedRootFolder.startsWith('/')) {
      return `${sanitizedRepo}${sanitizedRootFolder.substring(1)}${folderPathSuffix}`
    } else if (
      (sanitizedRepo.endsWith('/') && !sanitizedRootFolder.startsWith('/')) ||
      (!sanitizedRepo.endsWith('/') && sanitizedRootFolder.startsWith('/'))
    ) {
      return `${sanitizedRepo}${sanitizedRootFolder}${folderPathSuffix}`
    } else if (!sanitizedRepo.endsWith('/') && !sanitizedRootFolder.startsWith('/')) {
      return `${sanitizedRepo}/${sanitizedRootFolder}${folderPathSuffix}`
    }
  } else {
    return `${sanitizedRepo}${sanitizedRepo.endsWith('/') ? suffix.substring(1) : suffix}`
  }
  return ''
}

export const getExternalUrl = (config: GitSyncConfig, folderPath?: string): string => {
  const { repo, branch, gitConnectorType } = config
  if (!repo || !branch || !folderPath) {
    return ''
  }
  switch (gitConnectorType) {
    case Connectors.GITHUB:
      return `${repo}/tree/${branch}${folderPath.startsWith('/') ? '' : '/'}${folderPath}`
    case Connectors.GITLAB:
    case Connectors.BITBUCKET:
    default:
      return ''
  }
}

export const getEntityUrl = (entity: GitSyncEntityDTO): string => {
  const { repoUrl, folderPath, branch, entityGitPath } = entity
  if (repoUrl && branch && folderPath && entityGitPath) {
    return `${repoUrl}/blob/${branch}/${folderPath}${entityGitPath}`
  } else {
    return ''
  }
}

/**
 * This hook will be used to decide whether user can enable git experience for any project or not.
 * Current conditions where Git Sync cannot be enabled:
 *  - If Pipelines have been created
 *  - If Feature Flags have been created
 * Once complete sync will be implemented, blocking user to enable the gitSync will be not required.
 */

export const useCanEnableGitExperience = (queryParam: ProjectPathProps & ModulePathParams): boolean => {
  const featureFlagsResponse = useGetAllFeatures({
    queryParams: {
      accountIdentifier: queryParam.accountId,
      org: queryParam.orgIdentifier,
      project: queryParam.projectIdentifier
    }
  })

  const [canEnableGit, setCanEnableGit] = useState<boolean>(false)

  useEffect(() => {
    const defaultQueryParamsForPipelines = {
      ...pick(queryParam, ['projectIdentifier', 'module', 'orgIdentifier']),
      accountIdentifier: queryParam.accountId,
      searchTerm: '',
      page: 0,
      size: 1
    }

    const checkEnableGitConditions = async (): Promise<void> => {
      try {
        const response = await getPipelineListPromise({
          queryParams: defaultQueryParamsForPipelines,
          body: { filterType: 'PipelineSetup' }
        })

        const hasPipelines = !!(
          response?.status === 'SUCCESS' &&
          response?.data?.totalElements &&
          response?.data?.totalElements > 0
        )

        const hasFeatureFlags = featureFlagsResponse.data && featureFlagsResponse.data?.itemCount > 0

        if (hasFeatureFlags === false && hasPipelines === false) {
          setCanEnableGit(true)
        }
      } catch (error) {
        setCanEnableGit(true)
      }
    }

    checkEnableGitConditions()
  }, [featureFlagsResponse.data])

  return canEnableGit
}
