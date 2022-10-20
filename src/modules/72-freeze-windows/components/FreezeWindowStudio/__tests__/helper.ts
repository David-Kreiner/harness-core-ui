import { noop } from 'lodash-es'
import { FreezeWindowLevels, ResourcesInterface } from '@freeze-windows/types'

export const defaultContext = {
  state: { freezeObj: {}, isYamlEditable: false, oldFreezeObj: {}, isUpdated: false },
  updateFreeze: noop,
  view: 'VISUAL',
  setDrawerType: noop,
  isReadOnly: false,
  setView: noop,
  setYamlHandler: noop,
  updateYamlView: noop,
  freezeWindowLevel: FreezeWindowLevels.ACCOUNT,
  loadingFreezeObj: false,
  isUpdatingFreeze: false,
  refetchFreezeObj: noop
}

export const resources: ResourcesInterface = {
  orgs: [],
  orgsMap: {},
  projects: [],
  projectsMap: {},
  services: [],
  servicesMap: {},
  freezeWindowLevel: FreezeWindowLevels.ACCOUNT,
  projectsByOrgId: {},
  fetchProjectsForOrgId: () => null
}
