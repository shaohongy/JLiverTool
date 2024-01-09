import Alpine from 'alpinejs'
import { JLiverAPI } from '../preload'
import {
  Cookies,
  DefaultRoomID,
  RoomID,
  WindowType,
  typecast,
} from '../lib/types'
import JEvent from '../lib/events'
import * as QrCode from 'qrcode'
import UserInfoResponse from '../lib/bilibili/api/user/user_info'

declare global {
  interface window {
    jliverAPI: JLiverAPI
  }
}

enum QrPrompt {
  NeedConfirm = '请确认登录',
}

const app = {
  init() {
    window.jliverAPI.register(JEvent.EVENT_WINDOW_BLUR, () => {
      this.active = false
    })
    window.jliverAPI.register(JEvent.EVENT_WINDOW_FOCUS, () => {
      this.active = true
    })
  },
  active: true,
  hide() {
    window.jliverAPI.window.hide(WindowType.WSETTING)
  },
}

const room_setting = {
  async init() {
    await this.settingUpdate()
    window.jliverAPI.onDidChange('config.cookies', async () => {
      await this.settingUpdate()
    })
  },
  room_id: '',
  room_info: {},
  owned: false,
  error: false,
  async settingUpdate() {
    const room = typecast(RoomID, await window.jliverAPI.config.room())
    const user_id = (await window.jliverAPI.get('config.cookies', {}))
      .DedeUserID
    if (room.getOwnerID() == user_id) {
      this.owned = true
    } else {
      this.owned = false
    }
    this.room_id = room.getID()
    const room_info = await window.jliverAPI.room.info(parseInt(this.room_id))
    if (room_info.code != 0) {
      return
    }
    this.room_info = room_info.data
  },
  async confirmRoom() {
    const prev_room = typecast(RoomID, await window.jliverAPI.config.room())
    if (this.room_id == '') {
      this.error = true
      this.room_id = prev_room.getID()
      return
    }
    // length > 16
    if (this.room_id.length > 16) {
      this.error = true
      this.room_id = prev_room.getID()
      return
    }
    // contains non-number
    if (isNaN(Number(this.room_id))) {
      this.error = true
      this.room_id = prev_room.getID()
      return
    }
    this.error = false
    if (prev_room.same(parseInt(this.room_id))) {
      return
    }
    // new room id is set, check if it's valid
    const room_info = await window.jliverAPI.room.info(parseInt(this.room_id))
    if (room_info.code != 0) {
      this.error = true
      this.room_id = prev_room.getID()
      return
    }
    // confirm new room id
    window.jliverAPI.backend.updateRoom(
      new RoomID(
        room_info.data.short_id,
        room_info.data.room_id,
        room_info.data.uid
      )
    )
    await this.settingUpdate()
  },
  async confirmTitle() {
    await window.jliverAPI.backend.setRoomTitle(this.room_info.title)
  },
}

const account_setting = {
  async init() {
    this.login = await window.jliverAPI.get('config.login', false)
    window.jliverAPI.onDidChange('config.login', async (v: boolean) => {
      this.login = v
      if (this.login) {
        await this.updateUserInfo()
      }
    })

    if (this.login) {
      await this.updateUserInfo()
    }
  },
  user_info: {
    face: 'https://i0.hdslb.com/bfs/face/member/noface.jpg',
  },
  login: false,
  qr_dialog: false,
  qr_image: '',
  qr_prompt: '',
  async updateUserInfo() {
    const cookies = await window.jliverAPI.get('config.cookies', {})
    const updated_user_info = (await window.jliverAPI.user.info(
      parseInt(cookies.DedeUserID)
    )) as UserInfoResponse
    console.log(updated_user_info)
    this.user_info = updated_user_info.data
  },
  async qrLogin() {
    const qr_info = await window.jliverAPI.qr.get()
    this.qr_image = await QrCode.toDataURL(qr_info.url)
    this.qr_dialog = true
    // Setup interval to check qr status
    const qr_status_checker = setInterval(async () => {
      const qr_status = await window.jliverAPI.qr.update(qr_info.oauthKey)
      switch (qr_status.status) {
        case 2:
          const cookies = qr_status.cookies as Cookies
          window.jliverAPI.set('config.cookies', cookies)
          window.jliverAPI.set('config.login', true)
          this.login = true
          this.qr_dialog = false
          this.qr_prompt = ''
          await this.updateUserInfo()
          clearInterval(qr_status_checker)
          break
        case 1:
          this.qr_prompt = QrPrompt.NeedConfirm
          break
        case 0:
          break
        default:
          break
      }
    }, 2000)
  },
}

const merge_setting = {
  async init() {
    this._enable = await window.jliverAPI.get('config.merge', false)
    const merge_rooms = (await window.jliverAPI.get(
      'config.merge_rooms',
      []
    )) as RoomID[]
    for (let room of merge_rooms) {
      room = typecast(RoomID, room)
      const room_info = await window.jliverAPI.room.info(room.getID())
      if (room_info.code != 0) {
        continue
      }

      const user_info = await window.jliverAPI.user.info(room_info.data.uid)
      if (user_info.code != 0) {
        continue
      }
      this.room_list.push({
        room: room,
        name: `[${user_info.data.uname}]${room_info.data.title}`,
      })
    }
  },
  _enable: false,
  room_list: [],
  error: false,
  to_add: '',
  get enable() {
    return this._enable
  },
  set enable(v: boolean) {
    this._enable = v
    window.jliverAPI.set('config.merge', v)
  },
  async add() {
    if (this['to_add'] == '') {
      this.error = true
      return
    }
    if (this.room_list.length >= 5) {
      return
    }
    if (isNaN(Number(this['to_add']))) {
      this.error = true
      return
    }
    // if room id is already in list
    if (
      this.room_list.find((room: any) => {
        return room.id == parseInt(this['to_add'])
      })
    ) {
      this.error = true
      return
    }
    // check if room id is valid
    const room_info = await window.jliverAPI.room.info(parseInt(this.to_add))
    if (room_info.code != 0) {
      this.error = true
      return
    }

    const user_info = await window.jliverAPI.user.info(room_info.data.uid)
    if (user_info.code != 0) {
      this.error = true
      return
    }
    this.error = false
    this.room_list.push({
      room: new RoomID(
        room_info.data.short_id,
        room_info.data.room_id,
        room_info.data.uid
      ),
      name: `[${user_info.data.uname}]${room_info.data.title}`,
    })
    this['to_add'] = ''
    // maximum 5 rooms, so update full list every time is fine
    const updated_merge_rooms = this.room_list.map((r: any) => ({ ...r.room }))
    window.jliverAPI.set('config.merge_rooms', updated_merge_rooms)
  },
  remove(index: number) {
    this.room_list.splice(index, 1)
    const updated_merge_rooms = this.room_list.map((r: any) => ({ ...r.room }))
    window.jliverAPI.set('config.merge_rooms', updated_merge_rooms)
  },
}

const danmu_style_setting = {
  async init() {
    // get all fonts in web
    this.font_list = await window.jliverAPI.util.fonts()
    this._font_size = await window.jliverAPI.get('config.font_size', 16)
    this._font = await window.jliverAPI.get('config.font', 'system-ui')
  },
  font_list: [],
  _font: 'system-ui',
  _font_size: 16,
  get font_size() {
    return this._font_size
  },
  set font_size(v: number) {
    this._font_size = v
    window.jliverAPI.set('config.font_size', v)
  },
  get font() {
    return this._font
  },
  set font(v: string) {
    this._font = v
    window.jliverAPI.set('config.font', v)
  },
}

const window_setting = {
  async init() {
    this._opacity = await window.jliverAPI.get('config.opacity', 1)
    this._theme = await window.jliverAPI.get('config.theme', 'light')
  },
  _opacity: 1,
  _theme: 'light',
  theme_list: [
    'light',
    'dark',
    'dracula',
    'catppuccin',
    'blueberry',
    'ayu-light',
    'ayu-dark',
  ],
  get opacity() {
    return this._opacity
  },
  set opacity(v: number) {
    this._opacity = v
    window.jliverAPI.set('config.opacity', v)
  },
  get theme() {
    return this._theme
  },
  set theme(v: string) {
    window.jliverAPI.set('config.theme', v)
    this._theme = v
  },
}

const about = {
  version: '-',
  latest_version: '-',
  logs: [],
  _checkUpdate: true,
  goals: [
    {
      sum_income: '0',
      monthly_income: '0',
    },
  ],
  async init() {
    this.version = await window.jliverAPI.util.version()
    this.latest_version = (await window.jliverAPI.util.latestRelease()).tag_name
    window.jliverAPI.register(JEvent.EVENT_LOG, (msg: string) => {
      if (this.logs.length >= 100) {
        // remove last
        this.logs.pop()
      }
      // push to front
      this.logs.unshift(msg)
    })
    this._checkUpdate = await window.jliverAPI.get('config.check_update', true)
    this.goals = (await window.jliverAPI.util.getGoals()).data.list
    console.log(this.goals)
  },
  get checkUpdate() {
    return this._checkUpdate
  },
  set checkUpdate(v: boolean) {
    this._checkUpdate = v
    window.jliverAPI.set('config.check_update', v)
  },
}
Alpine.data('app', (): any => app)
Alpine.data('room_setting', (): any => room_setting)
Alpine.data('account_setting', (): any => account_setting)
Alpine.data('merge_setting', (): any => merge_setting)
Alpine.data('danmu_style_setting', (): any => danmu_style_setting)
Alpine.data('window_setting', (): any => window_setting)
Alpine.data('about', (): any => about)
Alpine.data('tab', (): any => ({
  active: 0,
  items: [
    {
      id: 0,
      text: '基础设置',
    },
    {
      id: 1,
      text: '外观设置',
    },
    {
      id: 2,
      text: '关于',
    },
  ],
}))
Alpine.start()
