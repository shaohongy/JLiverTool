import { createSuperchatEntry } from '../lib/common/superchat'
import {
  createDanmuEntry,
  createGiftEntry,
  createEffectEntry,
  createGuardEntry,
  giftCache,
  createInteractEntry,
} from './danmu-entry'
import Alpine from 'alpinejs'
import JEvent from '../lib/events'
import { Languages, LanguageType } from '../lib/i18n'
import { WindowType } from '../lib/types'
import {
  DanmuMessage,
  GiftMessage,
  GuardMessage,
  InteractMessage,
  SuperChatMessage,
} from '../lib/messages'

const toggles = {
  async init() {
    console.log('Init toggles')
    const config = await window.jliverAPI.get('config', {})
    this.values['always-on-top'] = config['always-on-top'] || false
    this.values['interact-display'] = config['interact-display'] || false
    this.values['medal-display'] = config['medal-display'] || false
    this.values['lite-mode'] = config['lite-mode'] || false

    // always-on-top should be set after init
    window.jliverAPI.window.alwaysOnTop(
      WindowType.WMAIN,
      this.values['always-on-top']
    )
    window.jliverAPI.window.minimizable(
      WindowType.WMAIN,
      !this.values['always-on-top']
    )
    document.documentElement.style.setProperty(
      '--medal-display',
      this.values['medal-display'] ? 'inline-block' : 'none'
    )
  },
  values: {
    'always-on-top': false,
    'medal-display': false,
    'interact-display': false,
    'lite-mode': false,
  },
  toggle(name: string) {
    console.log('Toggle ' + name)
    this.values[name] = !this.values[name]
    window.jliverAPI.set(`config.${name}`, this.values[name])
    if (name == 'always-on-top') {
      window.jliverAPI.window.alwaysOnTop(WindowType.WMAIN, this.values[name])
      window.jliverAPI.window.minimizable(WindowType.WMAIN, !this.values[name])
    }
    if (name == 'medal-display') {
      document.documentElement.style.setProperty(
        '--medal-display',
        this.values[name] ? 'inline-block' : 'none'
      )
    }
  },
}

const menu = {
  open: false,
  // get menu item id
  click(e: any) {
    const id = e.target.getAttribute('id')
    if (id) {
      switch (id) {
        case 'gift-window': {
          window.jliverAPI.window.show(WindowType.WGIFT)
          break
        }
        case 'superchat-window': {
          window.jliverAPI.window.show(WindowType.WSUPERCHAT)
          break
        }
        case 'setting-window': {
          window.jliverAPI.window.show(WindowType.WSETTING)
          break
        }
        case 'quit': {
          window.jliverAPI.app.quit()
          break
        }
        default:
      }
    }
    this.open = false
  },
}

const appStatus = {
  async init() {
    console.log('Init config')
    const initialConfig = await window.jliverAPI.get('config', {})

    this.l.texts = Languages[initialConfig.language || LanguageType.zh]
    this.base.fontSize = initialConfig['font_size'] || 18
    this.base.opacity = initialConfig['opacity'] || 1
    this.base.font = initialConfig['font'] || 'system-ui'
    this.login = initialConfig.login || false
    this.base.theme = initialConfig.theme || 'light'
    this.base.interact_display = initialConfig['interact-display'] || false
    this.base.ignore_free = initialConfig['ignore_free'] || true
    this.base.lite_mode = initialConfig['lite-mode'] || false
    this.danmuPanel.max_entries = initialConfig['max_main_entry'] || 200

    window.jliverAPI.onDidChange('config.login', (v: boolean) => {
      this.login = v
    })
    window.jliverAPI.onDidChange('config.opacity', (newValue: number) => {
      this.base.opacity = newValue
    })
    window.jliverAPI.onDidChange('config.font_size', (newValue: number) => {
      this.base.fontSize = newValue
    })
    window.jliverAPI.onDidChange('config.font', (newValue: string) => {
      this.base.font = newValue
    })
    window.jliverAPI.onDidChange('config.ignore_free', (newValue: boolean) => {
      this.base.ignore_free = newValue
    })
    window.jliverAPI.onDidChange(
      'config.max_main_entry',
      (newValue: number) => {
        this.danmuPanel.max_entries = newValue
      }
    )
    window.jliverAPI.onDidChange('config.lite-mode', (newValue: boolean) => {
      this.base.lite_mode = newValue
    })
    // Set theme class in html
    document.documentElement.classList.add(
      'theme-' + (this.base.theme || 'light')
    )
    window.jliverAPI.onDidChange('config.theme', (newValue: string) => {
      document.documentElement.classList.remove(
        'theme-' + (this.base.theme || 'light')
      )
      document.documentElement.classList.add('theme-' + (newValue || 'light'))
      this.base.theme = newValue
    })
    window.jliverAPI.onDidChange(
      'config.interact-display',
      (newValue: boolean) => {
        this.base.interact_display = newValue
        if (!newValue) {
          // clean previous interact entries
          const interactEntries = document.querySelectorAll(
            '#danmu > span.interact'
          )
          interactEntries.forEach((entry) => {
            $danmuArea.removeChild(entry)
          })
        }
      }
    )

    console.log('Init events')
    window.jliverAPI.register(JEvent.EVENT_UPDATE_ONLINE, (arg: any) => {
      // Update online number
      this.base.online = arg.count
    })
    window.jliverAPI.register(JEvent.EVENT_UPDATE_ROOM, (arg: any) => {
      // Update room title and status
      // if arg has title
      if (arg.hasOwnProperty('title')) {
        const encodedString = arg.title
        const textarea = document.createElement('textarea')
        textarea.innerHTML = encodedString
        this.base.title = textarea.value
      }
      // if arg has live_status
      if (arg.hasOwnProperty('live_status')) {
        this.base.live = arg.live_status == 1
      }
    })
    window.jliverAPI.register(JEvent.EVENT_NEW_DANMU, (arg: DanmuMessage) => {
      this.onReceiveNewDanmu(arg)
    })
    window.jliverAPI.register(JEvent.EVENT_NEW_GIFT, (arg: GiftMessage) => {
      this.onReceiveNewGift(arg)
    })
    window.jliverAPI.register(JEvent.EVENT_NEW_GUARD, (arg: GuardMessage) => {
      this.onReceiveGuard(arg)
    })
    window.jliverAPI.register(
      JEvent.EVENT_NEW_SUPER_CHAT,
      (arg: SuperChatMessage) => {
        this.onReceiveSuperchat(arg)
      }
    )
    window.jliverAPI.register(
      JEvent.EVENT_NEW_INTERACT,
      (arg: InteractMessage) => {
        this.onReceiveInteract(arg)
      }
    )

    console.log('Init smooth scroll')
    setInterval(() => {
      if (this.danmuPanel.autoScroll && this.danmuPanel.scrollRemain > 0) {
        const v = Math.ceil(this.danmuPanel.scrollRemain / 60)
        $danmuArea.scrollTop += v
        this.danmuPanel.scrollRemain = Math.max(
          Math.ceil(
            $danmuArea.scrollHeight -
              $danmuArea.clientHeight -
              $danmuArea.scrollTop
          ),
          this.danmuPanel.scrollRemain - v
        )
      } else {
        this.danmuPanel.scrollRemain = 0
      }
    }, 16)
  },
  // language texts
  l: {
    texts: {},
  },
  base: {
    title: 'Loading',
    online: '',
    live: false,
    fontSize: 18,
    font: '',
    opacity: 1,
    theme: 'light',
    interact_display: false,
    ignore_free: true,
    lite_mode: false,
  },
  windowStatus: {
    gift: false,
    superchat: false,
  },
  danmuPanel: {
    replaceIndex: 0,
    lastSelectedDanmu: null,
    newDanmuCount: 0,
    autoScroll: true,
    scrollRemain: 0,
    max_entries: 200,
    enableAutoScroll() {
      $danmuArea.scrollTop = $danmuArea.scrollHeight - $danmuArea.clientHeight
      this.scrollRemain = 0
      this.newDanmuCount = 0
      this.autoScroll = true
    },
    handleNewEntry(entry: HTMLElement) {
      $danmuArea.appendChild(entry)
      if (this.autoScroll) {
        this.scrollRemain = Math.ceil(
          $danmuArea.scrollHeight -
            $danmuArea.clientHeight -
            $danmuArea.scrollTop
        )
      }
    },
    scrollHandler() {
      // User scroll
      if (
        Math.ceil($danmuArea.scrollTop) >=
        $danmuArea.scrollHeight - $danmuArea.clientHeight - 10
      ) {
        this.autoScroll = true
        this.newDanmuCount = 0
        this.scrollRemain = Math.ceil(
          $danmuArea.scrollHeight -
            $danmuArea.clientHeight -
            $danmuArea.scrollTop
        )
      } else {
        this.autoScroll = false
      }
    },
    doClean() {
      if (!this.autoScroll) this.newDanmuCount++
      while ($danmuArea.children.length > this.max_entries) {
        $danmuArea.removeChild($danmuArea.children[0])
      }
    },
  },
  minimize() {
    window.jliverAPI.window.minimize(WindowType.WMAIN)
  },
  onReceiveNewDanmu(danmu_msg: DanmuMessage) {
    this.danmuPanel.doClean()
    const $newEntry = createDanmuEntry(
      danmu_msg.side_index,
      danmu_msg.is_special,
      danmu_msg.sender.medal_info,
      danmu_msg.sender,
      danmu_msg.content,
      danmu_msg.emoji_content,
      danmu_msg.reply_uname
    )
    this.danmuPanel.handleNewEntry($newEntry)
  },
  onReceiveInteract(interact_msg: InteractMessage) {
    if (!this.base.interact_display) {
      return
    }
    this.danmuPanel.doClean()
    const $newEntry = createInteractEntry(interact_msg)
    this.danmuPanel.handleNewEntry($newEntry)
  },
  onReceiveEffect(content: string) {
    this.danmuPanel.doClean()
    const $newEntry = createEffectEntry(content)
    this.danmuPanel.handleNewEntry($newEntry)
  },
  onReceiveNewGift(gift: GiftMessage) {
    // if ignore free gift
    if (this.base.ignore_free) {
      if (gift.gift_info.coin_type != 'gold') {
        return
      }
    }
    // check gift cache to merge gift in combo
    if (giftCache.has(gift.id)) {
      const old = giftCache.get(gift.id)
      const oldNum = parseInt(old.getAttribute('gift-num'))
      const newNum = oldNum + gift.num
      const price = gift.gift_info.price * newNum
      old.querySelector('.gift-num').innerText = `共${newNum}个 | ￥${
        price / 1000
      }`
      old.setAttribute('gift-num', String(newNum))
      return
    }
    this.danmuPanel.doClean()
    const $newEntry = createGiftEntry(gift)
    this.danmuPanel.handleNewEntry($newEntry)
  },
  onReceiveGuard(msg: GuardMessage) {
    this.danmuPanel.doClean()
    const $newEntry = createGuardEntry(msg)
    this.danmuPanel.handleNewEntry($newEntry)
  },
  onReceiveSuperchat(msg: SuperChatMessage) {
    console.log(msg)
    this.danmuPanel.doClean()
    // Superchat entry should not be able to remove in chat window
    const $newEntry = createSuperchatEntry(msg, false)
    this.danmuPanel.handleNewEntry($newEntry)
  },
  login: false,
  content: '',
  async invokeCommand(e: any) {
    if (this.content != '') {
      e.target.innerText = ''
      this.content = this.content.slice(0, -2)
      console.log("Invoke command: '" + this.content + "'")
      window.jliverAPI.backend.callCommand(this.content)
    }
  },
  async handleContentEdit(e) {
    if (e.target.innerText.length <= 30) {
      this.content = e.target.innerText
    } else {
      e.target.innerText = this.content
    }
  },
  openBiliBackend() {
    window.jliverAPI.util.openUrl(
      'https://link.bilibili.com/p/center/index#/my-room/start-live'
    )
  },
}

Alpine.data('appStatus', () => appStatus)
Alpine.data('toggles', () => toggles)
Alpine.data('menu', () => menu)
Alpine.start()

const $danmuArea = document.getElementsByClassName('danmu')[0]
