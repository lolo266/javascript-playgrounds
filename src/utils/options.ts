import {
  PlaygroundOptions,
  TypeScriptOptions,
  ResponsivePaneSet,
  ExternalStyles,
} from '../components/workspace/Workspace'
import * as DefaultCode from '../constants/DefaultCode'
import { PaneOptions, PaneShorthand, normalizePane } from './Panes'
import defaultLibs from '../utils/TypeScriptDefaultLibs'

export interface WorkspaceStep {
  title: string
  description: string
  workspace: {
    title: string
    initialTab: string
    entry: string
    files: Record<string, string>
  }
}

const userInterfaceStrings = {
  loading: 'Loading dependencies...',
  about: `The source code for this sandbox is available [here on GitHub](https://github.com/dabbott/javascript-playgrounds)`,
  noErrors: 'No Errors',
  showDetails: 'Show Details',
  fullscreen: 'Fullscreen',
}

export type UserInterfaceStrings = typeof userInterfaceStrings

export interface PublicOptions {
  preset?: string
  title?: string
  code?: string
  files?: Record<string, string>
  entry?: string
  initialTab?: string
  strings?: UserInterfaceStrings
  css?: string // was workspaceCSS
  styles?: ExternalStyles
  fullscreen?: boolean
  sharedEnvironment?: boolean
  playground?: PlaygroundOptions
  typescript?: TypeScriptOptions
  workspaces?: WorkspaceStep[]
  panes?: PublicPaneOptions[]
  responsivePaneSets?: PublicResponsivePaneSet[]
}

export type PublicPaneOptions = PaneShorthand | PaneOptions

export type PublicResponsivePaneSet = {
  maxWidth: number
  panes: PublicPaneOptions[]
}

export type InternalOptions = Required<
  Omit<PublicOptions, 'panes' | 'responsivePaneSets' | 'code'>
> & {
  panes: PaneOptions[]
  responsivePaneSets: ResponsivePaneSet[]
}

const presetOptions: Record<string, PublicOptions> = {
  javascript: {
    code: DefaultCode.javaScript,
    panes: [
      'editor',
      {
        id: 'player',
        type: 'player',
        platform: 'web',
        style: { display: 'none' },
      },
    ],
    playground: {
      enabled: true,
      renderReactElements: true,
      debounceDuration: 200,
    },
  },
  react: {
    code: DefaultCode.react,
    panes: ['editor', { id: 'player', type: 'player', platform: 'web' }],
    styles: {
      playerApp: {
        width: '100%',
        height: '100%',
      },
    },
  },
  ['react-native']: {},
}

export function normalize(options: PublicOptions): InternalOptions {
  const preset = options.preset || 'react-native'

  let {
    title = '',
    code = DefaultCode.reactNative,
    files = {},
    entry,
    initialTab,
    strings: rawStrings,
    css = '', // was workspaceCSS
    styles = Object.assign({}, presetOptions[preset]?.styles, options.styles),
    fullscreen = false,
    sharedEnvironment = false,
    panes = ['editor', 'player'],
    responsivePaneSets = [],
    workspaces = [],
    playground = {
      enabled: false,
      renderReactElements: true,
      debounceDuration: 200,
    },
    typescript = {
      enabled: false,
      /* libs */
      /* types */
    },
  } = Object.assign({}, presetOptions[preset], options)

  const typescriptOptions = Object.assign(
    { libs: defaultLibs, types: [] },
    typescript
  )

  if (!entry) {
    entry = typescriptOptions.enabled ? 'index.tsx' : 'index.js'
  }

  if (Object.keys(files).length > 0) {
    // If entry file is invalid or not given, choose the first file
    if (!files.hasOwnProperty(entry)) {
      entry = files[Object.keys(files)[0]]
    }
  } else {
    // If no files are given, use the code param
    files = { [entry]: code }
  }

  // If initial tab is invalid or not given, use the entry file
  if (!initialTab || !files.hasOwnProperty(initialTab)) {
    initialTab = entry
  }

  return {
    preset,
    title,
    files,
    entry,
    initialTab,
    css,
    styles,
    strings: Object.assign({}, userInterfaceStrings, rawStrings),
    fullscreen,
    sharedEnvironment,
    panes: panes.map((pane) => normalizePane(pane, title)),
    responsivePaneSets: responsivePaneSets.map((set) => ({
      ...set,
      panes: set.panes.map((pane) => normalizePane(pane, title)),
    })),
    workspaces,
    playground,
    typescript: typescriptOptions,
  }
}