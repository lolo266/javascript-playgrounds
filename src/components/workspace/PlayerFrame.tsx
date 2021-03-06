import React, { PureComponent } from 'react'
import * as ExtendedJSON from '../../utils/ExtendedJSON'
import { prefixObject } from '../../utils/Styles'
import Phone from './Phone'
import { Message, ConsoleCommand } from '../../types/Messages'
import { encode } from '../../utils/queryString'
import { ExternalStyles } from './Workspace'
import type { ExternalModule } from '../player/VendorComponents'

const styles = prefixObject({
  iframe: {
    flex: '1 1 auto',
    minWidth: 0,
    minHeight: 0,
  },
})

interface Props {
  externalStyles: ExternalStyles
  preset: string
  platform: string
  width: number
  scale: number
  assetRoot: string
  statusBarHeight: number
  statusBarColor: string
  sharedEnvironment: boolean
  detectedModules: string[]
  modules: ExternalModule[]
  styleSheet: string
  css: string
  prelude: string
  onError: (payload: string) => void
  onRun: () => void
  onConsole: (payload: ConsoleCommand) => void
}

interface State {
  id: string | null
}

export default class extends PureComponent<Props, State> {
  static defaultProps = {
    preset: 'react-native',
    platform: 'ios',
    width: 210,
    scale: 1,
    assetRoot: '',
    statusBarHeight: 0,
    statusBarColor: 'black',
    sharedEnvironment: true,
    modules: [],
    styleSheet: 'reset',
    css: '',
    prelude: '',
    onError: () => {},
    onRun: () => {},
    onConsole: () => {},
  }

  status: string = 'loading'
  fileMap?: Record<string, string>
  entry?: string

  state: State = {
    id: null,
  }

  componentDidMount() {
    const { sharedEnvironment } = this.props

    this.setState({
      id: Math.random().toString().slice(2),
    })

    const handleMessageData = (data: Message) => {
      if (data.id !== this.state.id) return

      switch (data.type) {
        case 'ready':
          this.status = 'ready'
          if (this.fileMap) {
            this.runApplication(this.fileMap, this.entry!)
            this.fileMap = undefined
            this.entry = undefined
          }
          break
        case 'error':
          this.props.onError(data.payload)
          break
        case 'console':
          this.props.onConsole(data.payload)
          break
      }
    }

    if (sharedEnvironment) {
      window.__message = handleMessageData
    }

    window.addEventListener('message', (e) => {
      let data: Message
      try {
        data = ExtendedJSON.parse(e.data) as Message
      } catch (err) {
        return
      }

      handleMessageData(data)
    })
  }

  runApplication(fileMap: Record<string, string>, entry: string) {
    this.props.onRun()
    switch (this.status) {
      case 'loading':
        this.fileMap = fileMap
        this.entry = entry
        break
      case 'ready':
        ;(this.refs.iframe as HTMLIFrameElement).contentWindow!.postMessage(
          { fileMap, entry, source: 'rnwp' },
          '*'
        )
        break
    }
  }

  renderFrame = () => {
    const {
      externalStyles,
      preset,
      assetRoot,
      detectedModules,
      modules,
      styleSheet,
      css,
      statusBarColor,
      statusBarHeight,
      sharedEnvironment,
      prelude,
    } = this.props
    const { id } = this.state

    if (!id) return null

    const queryString = encode({
      preset,
      id,
      sharedEnvironment,
      assetRoot,
      detectedModules: JSON.stringify(detectedModules),
      modules: JSON.stringify(modules),
      styleSheet,
      css,
      statusBarColor,
      statusBarHeight,
      prelude,
      styles: JSON.stringify({
        playerRoot: externalStyles.playerRoot,
        playerWrapper: externalStyles.playerWrapper,
        playerApp: externalStyles.playerApp,
      }),
    })

    return (
      <iframe
        style={styles.iframe}
        ref={'iframe'}
        frameBorder={0}
        src={`player.html#${queryString}`}
      />
    )
  }

  render() {
    const { width, scale, platform } = this.props

    if (platform === 'web') {
      return this.renderFrame()
    }

    return (
      <Phone width={width} device={platform} scale={scale}>
        {this.renderFrame()}
      </Phone>
    )
  }
}
