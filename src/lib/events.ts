enum JEvent {
  // event
  EVENT_UPDATE_ROOM,
  EVENT_UPDATE_ONLINE,
  EVENT_NEW_DANMU,
  EVENT_NEW_GIFT,
  EVENT_NEW_GUARD,
  EVENT_NEW_SUPER_CHAT,
  EVENT_WINDOW_READY,
  EVENT_STORE_WATCH,
  EVENT_WINDOW_BLUR,
  EVENT_WINDOW_FOCUS,
  // invoke
  INVOKE_REQUEST_GIFT_DATA,
  INVOKE_WINDOW_MINIMIZE,
  INVOKE_WINDOW_ALWAYS_ON_TOP,
  INVOKE_WINDOW_MINIMIZABLE,
  INVOKE_WINDOW_HIDE,
  INVOKE_WINDOW_SHOW,
  INVOKE_STORE_GET,
  INVOKE_STORE_SET,
  INVOKE_STORE_REGISTER,
  INVOKE_APP_QUIT,
  INVOKE_QR_CODE,
  INVOKE_QR_CODE_UPDATE,
  INVOKE_LOGOUT,
  INVOKE_GET_USER_INFO,
  INVOKE_OPEN_URL,
  INVOKE_GET_ROOM_INFO,
}

export default JEvent
