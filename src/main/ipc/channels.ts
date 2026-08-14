export const IPC_CHANNELS = {
  // Projects
  PROJECT_LIST:       'project:list',
  PROJECT_GET:        'project:get',
  PROJECT_CREATE:     'project:create',
  PROJECT_UPDATE:     'project:update',
  PROJECT_ARCHIVE:    'project:archive',
  // Modules
  MODULE_LIST:        'module:list',
  MODULE_UPSERT:      'module:upsert',
  // Units
  UNIT_LIST:          'unit:list',
  UNIT_UPSERT:        'unit:upsert',
  UNIT_BULK_IMPORT:   'unit:bulkImport',
  // Media
  MEDIA_UPLOAD:       'media:upload',
  MEDIA_LIST:         'media:list',
  MEDIA_REORDER:      'media:reorder',
  MEDIA_DELETE:       'media:delete',
  // Session
  SESSION_START:      'session:start',
  SESSION_END:        'session:end',
  SESSION_SHORTLIST:  'session:shortlist',
  SESSION_LOG_LIST:   'session:logList',
  // Export
  EXPORT_PDF:         'export:pdf',
  EXPORT_USB_PACKAGE: 'export:usbPackage',
  IMPORT_USB_PACKAGE: 'import:usbPackage',
  // Sync
  SYNC_NOW:           'sync:now',
  SYNC_STATUS:        'sync:status',
  // Settings
  SETTINGS_GET:       'settings:get',
  SETTINGS_SET:       'settings:set',
  SETTINGS_VERIFY_PIN:'settings:verifyPin',
  // Lead
  LEAD_CREATE:        'lead:create',
  LEAD_LIST:          'lead:list',
  // Highlights
  HIGHLIGHT_UPSERT:   'highlight:upsert',
  HIGHLIGHT_DELETE:   'highlight:delete',
  // System
  EXIT_KIOSK:         'system:exitKiosk',
  SECOND_DISPLAY:     'system:secondDisplay',
  // Dialog
  DIALOG_OPEN_FILE:   'dialog:openFile',
  DIALOG_OPEN_FOLDER: 'dialog:openFolder',
} as const

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS]
