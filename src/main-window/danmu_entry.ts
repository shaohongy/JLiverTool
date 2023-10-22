import { renderContent } from '../common/content-render'
import { createMedal } from '../common/medal'

export function createDanmuEntry(special, medal, sender, content) {
  const danmuEntry = document.createElement('span')
  if (special) {
    danmuEntry.className = 'danmu_entry special'
  } else {
    danmuEntry.className = 'danmu_entry'
  }
  if (medal) {
    danmuEntry.appendChild(
      createMedal(medal.guardLevel, medal.name, medal.level)
    )
  }
  const danmuSender = document.createElement('span')
  danmuSender.className = 'sender'
  if (content) sender = sender + '：'
  danmuSender.innerText = sender
  danmuEntry.appendChild(danmuSender)
  if (content) {
    if (content.url) {
      const danmuContent = document.createElement('span')
      const ratio = content.width / content.height
      danmuContent.className = 'content emoji'
      danmuContent.style.backgroundImage = `url(${content.url})`
      danmuContent.style.width = `calc((var(--danmu-size) + 32px) * ${ratio})`
      danmuContent.style.height = 'calc(var(--danmu-size) + 32px)'
      danmuEntry.appendChild(danmuContent)
    } else {
      danmuEntry.appendChild(renderContent(content))
    }
  }
  return danmuEntry
}

export function createEnterEntry(medal, sender) {
  return createDanmuEntry(false, medal, sender + ' 进入直播间', null)
}

export function createEffectEntry(content) {
  return createDanmuEntry(false, null, content, null)
}

export const giftCache = new Map()

export function createGiftEntry(id, g) {
  let medalInfo = {
    guardLevel: g.data.medal_info.guard_level,
    name: g.data.medal_info.medal_name,
    level: g.data.medal_info.medal_level,
  }
  if (medalInfo.level == 0) {
    medalInfo = null
  }
  const entry = doCreateGiftEntry(medalInfo, g.data.uname, g)
  giftCache.set(id, entry)
  return entry
}

export function createGuardEntry(g) {
  let medalInfo = null
  if (g.medal) {
    medalInfo = {
      guardLevel: g.medal.guard_level,
      name: g.medal.medal_name,
      level: g.medal.level,
    }
  }
  return doCreateGiftEntry(medalInfo, g.name, {
    data: {
      action: '开通',
      giftName: g.gift_name,
      isGuard: true,
      guardLevel: g.guard_level,
    },
  })
}

function doCreateGiftEntry(medal, sender, g) {
  const gift = g.data
  const danmuEntry = document.createElement('span')
  danmuEntry.className = 'danmu_entry special gift'
  if (medal) {
    danmuEntry.appendChild(
      createMedal(medal.guardLevel, medal.name, medal.level)
    )
  }
  const danmuSender = document.createElement('span')
  danmuSender.className = 'sender'
  danmuSender.innerText = sender
  danmuEntry.appendChild(danmuSender)
  // Content
  const giftAction = document.createElement('span')
  giftAction.className = 'action'
  giftAction.innerText = gift.action
  danmuEntry.appendChild(giftAction)
  const giftName = document.createElement('span')
  giftName.className = 'gift-name'
  giftName.innerText = gift.giftName
  danmuEntry.appendChild(giftName)
  const giftIcon = document.createElement('span')
  giftIcon.className = 'gift-icon'
  if (gift.isGuard) {
    giftIcon.style.backgroundImage = `var(--guard-level-${gift.guardLevel})`
  } else {
    giftIcon.style.backgroundImage = `url(${g.gif.gif})`
  }
  danmuEntry.appendChild(giftIcon)
  if (gift.num) {
    const giftNum = document.createElement('span')
    giftNum.className = 'gift-num'
    giftNum.innerText = `共${gift.num}个 | ￥${(gift.price * gift.num) / 1000}`
    danmuEntry.appendChild(giftNum)
    danmuEntry.setAttribute('gift-num', gift.num)
  }
  return danmuEntry
}
