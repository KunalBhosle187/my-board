export const WS_SUBTYPES = {
  INIT: "INIT",
  UPDATE: "UPDATE",
} as const;

export const WS_EVENTS = {
  SCENE_UPDATE: "scene-update",
  USER_JOIN: "user-join",
  RECEIVE_EDITOR_CHANGES: "receive-editor-changes",
  RECEIVE_CURSOR_MOVE: "receive-cursor-move",
} as const;
