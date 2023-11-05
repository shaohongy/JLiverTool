import { contextBridge, ipcRenderer } from 'electron'
import { WindowType } from './lib/types'
import JEvent from './lib/events'
import RoomInitResponse from './lib/bilibili/api/room/room_init'
import GetInfoResponse from './lib/bilibili/api/room/get_info'

export type JLiverAPI = {
  get: (key: string, d: any) => any
  set: (key: string, value: any) => void
  onDidChange: (key: string, callback: Function) => void
  invoke: (channel: string, ...args: any[]) => Promise<any>
  send: (channel: string, ...args: any[]) => void
  register: (channel: JEvent, callback: Function) => void
  window: {
    hide: (window_type: WindowType) => void
    show: (window_type: WindowType) => void
    minimize: (window_type: WindowType) => void
    alwaysOnTop: (window_type: WindowType, value: boolean) => void
    minimizable: (window_type: WindowType, value: boolean) => void
  }
  app: {
    quit: () => void
  }
  qr: {
    get: () => Promise<any>
    update: (key: string) => Promise<any>
  }
  user: {
    logout: () => Promise<any>
    info: (user_id: number) => Promise<any>
  }
  room: {
    info: (room_id: number) => Promise<GetInfoResponse>
  }
  util: {
    openUrl: (url: string) => Promise<any>
  }
}

// listeners keeps all registered callback in renderer process
let listeners: Map<string, Function[]> = new Map()

function registerListener(event: JEvent) {
  const eventName = JEvent[event]
  console.log('registering listener', eventName)
  ipcRenderer.on(eventName, (_, arg) => {
    if (listeners[eventName]) {
      listeners[eventName].forEach((callback: Function) => {
        callback(arg)
      })
    }
  })
}

registerListener(JEvent.EVENT_UPDATE_ROOM)
registerListener(JEvent.EVENT_UPDATE_ONLINE)
registerListener(JEvent.EVENT_NEW_DANMU)
registerListener(JEvent.EVENT_WINDOW_BLUR)
registerListener(JEvent.EVENT_WINDOW_FOCUS)
registerListener(JEvent.EVENT_STORE_WATCH)

// watcher keeps all registered onDidChange callback in renderer process
// and will be called when ipcMain send store-watch event
let watcher: Map<string, Function[]> = new Map()
void ipcRenderer.invoke(JEvent[JEvent.INVOKE_STORE_REGISTER])
ipcRenderer.on(JEvent[JEvent.EVENT_STORE_WATCH], (_, key, newValue) => {
  if (watcher[key]) {
    watcher[key].forEach((callback: Function) => {
      callback(newValue)
    })
  }
})

contextBridge.exposeInMainWorld('jliverAPI', {
  get: (key: string, d: any = null) => {
    return ipcRenderer.invoke(JEvent[JEvent.INVOKE_STORE_GET], key, d)
  },
  set: (key: string, value: any) => {
    return ipcRenderer.invoke(JEvent[JEvent.INVOKE_STORE_SET], key, value)
  },
  onDidChange: (key: string, callback: Function) => {
    if (!watcher[key]) {
      watcher[key] = []
    }
    watcher[key].push(callback)
  },
  //TODO this should be removed after all channel wrapped in function
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args)
  },
  window: {
    hide: (window_type: WindowType) => {
      return ipcRenderer.invoke(JEvent[JEvent.INVOKE_WINDOW_HIDE], window_type)
    },
    show: (window_type: WindowType) => {
      return ipcRenderer.invoke(JEvent[JEvent.INVOKE_WINDOW_SHOW], window_type)
    },
    minimize: (window_type: WindowType) => {
      return ipcRenderer.invoke(
        JEvent[JEvent.INVOKE_WINDOW_MINIMIZE],
        window_type
      )
    },
    alwaysOnTop: (window_type: WindowType, value: boolean) => {
      return ipcRenderer.invoke(
        JEvent[JEvent.INVOKE_WINDOW_ALWAYS_ON_TOP],
        window_type,
        value
      )
    },
    minimizable: (window_type: WindowType, value: boolean) => {
      return ipcRenderer.invoke(
        JEvent[JEvent.INVOKE_WINDOW_MINIMIZABLE],
        window_type,
        value
      )
    },
  },
  app: {
    quit: () => {
      return ipcRenderer.invoke(JEvent[JEvent.INVOKE_APP_QUIT])
    },
  },
  //TODO this should be removed after all channel wrapped in function
  send: ipcRenderer.send,
  register: (channel: JEvent, callback: Function) => {
    if (JEvent[channel] === undefined) {
      console.log('invalid channel', channel)
      return
    }
    if (!listeners[JEvent[channel]]) {
      listeners[JEvent[channel]] = []
    }
    listeners[JEvent[channel]].push(callback)
  },
  qr: {
    get: () => {
      return ipcRenderer.invoke(JEvent[JEvent.INVOKE_QR_CODE])
    },
    update: (key: string) => {
      return ipcRenderer.invoke(JEvent[JEvent.INVOKE_QR_CODE_UPDATE], key)
    },
  },
  user: {
    logout: () => {
      return ipcRenderer.invoke(JEvent[JEvent.INVOKE_LOGOUT])
    },
    info: (user_id: number) => {
      return ipcRenderer.invoke(JEvent[JEvent.INVOKE_GET_USER_INFO], user_id)
    },
  },
  room: {
    info: (room_id: number) => {
      return ipcRenderer.invoke(JEvent[JEvent.INVOKE_GET_ROOM_INFO], room_id)
    },
  },
  util: {
    openUrl: (url: string) => {
      return ipcRenderer.invoke(JEvent[JEvent.INVOKE_OPEN_URL], url)
    },
  },
})
