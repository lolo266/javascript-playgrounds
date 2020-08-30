import React, { CSSProperties, memo, useState } from 'react'
import type { WorkspaceDiff } from '../../../index'
import { LogCommand } from '../../../types/Messages'
import { EditorPaneOptions, PaneOptions } from '../../../utils/Panes'
import {
  columnStyle,
  mergeStyles,
  prefixObject,
  rowStyle,
} from '../../../utils/Styles'
import {
  compareTabs,
  getTabChanged,
  getTabTitle,
  Tab,
} from '../../../utils/Tab'
import About from '../About'
import Button from '../Button'
import Editor, { Props as EditorProps } from '../Editor'
import Fullscreen from '../Fullscreen'
import Header from '../Header'
import Overlay from '../Overlay'
import Status from '../Status'
import Tabs from '../Tabs'
import { PublicError, PlaygroundOptions, TypeScriptOptions } from '../Workspace'

const styles = prefixObject({
  editorPane: columnStyle,
  overlayContainer: {
    position: 'relative',
    flex: 0,
    height: 0,
    alignItems: 'stretch',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    background: 'rgba(255,255,255,0.95)',
    zIndex: 100,
    left: 4,
    right: 0,
    borderTop: '1px solid #F8F8F8',
    display: 'flex',
    alignItems: 'stretch',
    overflow: 'auto',
    maxHeight: 300,
  },
  boldMessage: {
    fontWeight: 'bold',
  },
  codeMessage: {
    display: 'block',
    fontFamily: `'source-code-pro', Menlo, 'Courier New', Consolas, monospace`,
    borderRadius: 4,
    padding: '4px 8px',
    backgroundColor: 'rgba(0,0,0,0.02)',
    border: '1px solid rgba(0,0,0,0.05)',
  },
})

interface Props {
  options: EditorPaneOptions
  externalStyles: Record<string, CSSProperties>
  files: Record<string, string>
  logs: LogCommand[]
  fullscreen: boolean
  activeStepIndex: number
  diff: Record<string, WorkspaceDiff>
  playgroundOptions: PlaygroundOptions
  typescriptOptions: TypeScriptOptions
  compilerError?: PublicError
  runtimeError?: PublicError
  activeFile: string
  activeFileTab?: Tab
  fileTabs: Tab[]
  onChange: EditorProps['onChange']
  getTypeInfo: EditorProps['getTypeInfo']
  onClickTab: (tab: Tab) => void
}

export default memo(function EditorPane({
  files,
  externalStyles,
  fullscreen,
  activeStepIndex,
  diff,
  playgroundOptions,
  typescriptOptions,
  compilerError,
  runtimeError,
  activeFile,
  activeFileTab,
  fileTabs,
  logs,
  options,
  onChange,
  getTypeInfo,
  onClickTab,
}: Props) {
  const [showDetails, setShowDetails] = useState(false)

  const { title } = options

  const fileDiff = diff[activeFile] ? diff[activeFile].ranges : []

  const error = compilerError || runtimeError
  const isError = !!error

  const style = mergeStyles(styles.editorPane, options.style)

  return (
    <div style={style}>
      {title && (
        <Header
          text={title}
          headerStyle={externalStyles.header}
          textStyle={externalStyles.headerText}
        >
          {fullscreen && <Fullscreen textStyle={externalStyles.headerText} />}
        </Header>
      )}
      {fileTabs.length > 1 && (
        <Tabs
          tabs={fileTabs}
          getTitle={getTabTitle}
          getChanged={getTabChanged}
          activeTab={activeFileTab}
          compareTabs={compareTabs}
          onClickTab={onClickTab}
          tabStyle={externalStyles.tab}
          textStyle={externalStyles.tabText}
          activeTextStyle={externalStyles.tabTextActive}
          changedTextStyle={externalStyles.tabTextChanged}
        >
          {fullscreen && !title && (
            <Fullscreen textStyle={externalStyles.tabText} />
          )}
        </Tabs>
      )}
      <Editor
        key={activeFile}
        initialValue={files[activeFile]}
        filename={activeStepIndex + ':' + activeFile}
        onChange={onChange}
        errorLineNumber={error?.lineNumber}
        showDiff={true}
        diff={fileDiff}
        logs={playgroundOptions.enabled ? logs : undefined}
        playgroundDebounceDuration={playgroundOptions.debounceDuration}
        playgroundRenderReactElements={playgroundOptions.renderReactElements}
        getTypeInfo={typescriptOptions.enabled ? getTypeInfo : undefined}
        tooltipStyle={externalStyles.tooltip}
      />
      {showDetails && (
        <div style={styles.overlayContainer}>
          <div style={styles.overlay}>
            <Overlay isError={isError}>
              {isError ? (
                <>
                  <b style={styles.boldMessage}>{error?.description}</b>
                  <br />
                  <br />
                  <code style={styles.codeMessage}>{error?.errorMessage}</code>
                  <br />
                </>
              ) : (
                ''
              )}
              <About />
            </Overlay>
          </div>
        </div>
      )}
      <Status text={!!error ? error.summary : 'No Errors'} isError={isError}>
        <Button
          active={showDetails}
          isError={isError}
          onChange={setShowDetails}
        >
          {'Show Details'}
        </Button>
      </Status>
    </div>
  )
})