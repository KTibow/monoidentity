export const canBackup =
  navigator.userAgent.includes("CrOS") && Boolean(window.showDirectoryPicker);
