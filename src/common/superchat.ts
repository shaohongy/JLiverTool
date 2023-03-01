import * as moment from 'moment/moment';
import { renderContent } from './content-render';
import { createMedal } from './medal';
import { SuperChat } from './superchatInterface';

// Create Superchat HTML entry for display
export function createSuperchatEntry({ id, g, removable }: { id: string; g: SuperChat; removable: boolean }): HTMLElement {
  let level = getSuperChatLevel(g.data.price)
  let scEntry = document.createElement('div')
  scEntry.classList.add('sc-entry')
  let scEntryHeader = document.createElement('div')
  scEntryHeader.classList.add('sc-entry-header')
  scEntryHeader.style.border = `1px solid var(--sc-f-level-${level})`
  scEntryHeader.style.backgroundColor = `var(--sc-b-level-${level})`
  let scEntryHeaderLeft = document.createElement('div')
  scEntryHeaderLeft.classList.add('sc-entry-header-left')
  let scEntryHeaderLeftAvatar = document.createElement('div')
  scEntryHeaderLeftAvatar.classList.add('sc-entry-header-left-avatar')
  let scEntryHeaderLeftAvatarImg = document.createElement('img')
  scEntryHeaderLeftAvatarImg.classList.add('avatar')
  scEntryHeaderLeftAvatarImg.src = g.data.user_info.face
  scEntryHeaderLeftAvatar.appendChild(scEntryHeaderLeftAvatarImg)
  if (g.data.user_info.face_frame != '') {
    let scEntryHeaderLeftAvatarFrameImg = document.createElement('img')
    scEntryHeaderLeftAvatarFrameImg.classList.add('avatar-frame')
    scEntryHeaderLeftAvatarFrameImg.src = g.data.user_info.face_frame
    scEntryHeaderLeftAvatar.appendChild(scEntryHeaderLeftAvatarFrameImg)
  }
  scEntryHeaderLeft.appendChild(scEntryHeaderLeftAvatar)
  let scEntryHeaderLeftName = document.createElement('div')
  scEntryHeaderLeftName.classList.add('sc-entry-header-left-name')
  if (g.data.medal_info) {
    let scEntryHeaderLeftNameMedal = createMedal(
      g.data.medal_info.guard_level,
      g.data.medal_info.medal_name,
      g.data.medal_info.medal_level
    )
    scEntryHeaderLeftName.appendChild(scEntryHeaderLeftNameMedal)
  }
  let scEntryHeaderLeftNameSender = document.createElement('div')
  scEntryHeaderLeftNameSender.classList.add('sender')
  scEntryHeaderLeftNameSender.innerText = g.data.user_info.uname
  scEntryHeaderLeftName.appendChild(scEntryHeaderLeftNameSender)
  scEntryHeaderLeft.appendChild(scEntryHeaderLeftName)
  scEntryHeader.appendChild(scEntryHeaderLeft)
  let scEntryHeaderRight = document.createElement('div')
  scEntryHeaderRight.classList.add('sc-entry-header-right')
  scEntryHeaderRight.innerText = '￥' + g.data.price
  scEntryHeader.appendChild(scEntryHeaderRight)
  scEntry.appendChild(scEntryHeader)
  let scEntryContent = document.createElement('div')
  scEntryContent.classList.add('sc-entry-content')
  scEntryContent.style.backgroundColor = `var(--sc-f-level-${level})`
  let scEntryContentText = document.createElement('div')
  scEntryContentText.classList.add('sc-entry-content-text')
  scEntryContentText.appendChild(renderContent(g.data.message))
  scEntryContent.appendChild(scEntryContentText)
  let scEntryContentTime = document.createElement('div')
  scEntryContentTime.classList.add('sc-entry-content-time')
  scEntryContentTime.innerText = moment(g.data.start_time * 1000).format('YYYY/MM/DD HH:mm:ss')
  scEntryContent.appendChild(scEntryContentTime)
  scEntry.appendChild(scEntryContent)
  if (removable) {
    scEntry.ondblclick = () => {
      scEntry.remove()
      window.electron.send('remove', {
        type: 'superchats',
        id: id
      })
    }
  }
  return scEntry
}

// Different Superchat amount with different style
function getSuperChatLevel(price: number): number {
  if (price >= 2000) {
    return 5
  } else if (price >= 1000) {
    return 4
  } else if (price >= 500) {
    return 3
  } else if (price >= 100) {
    return 2
  } else if (price >= 50) {
    return 1
  }
  return 0
}