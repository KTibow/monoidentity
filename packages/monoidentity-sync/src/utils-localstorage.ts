export const canBackup =
  navigator.userAgent.includes("CrOS") && "showDirectoryPicker" in window;
